import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Catalog from './components/Catalog';
import CartDrawer from './components/CartDrawer';
import OrderSuccessModal from './components/OrderSuccessModal';
import SellerPanel from './components/SellerPanel';
import AdminDashboard from './components/AdminDashboard';
import AuthScreen from './components/AuthScreen';
import CardWalletModal from './components/CardWalletModal';
import ProvidersModal from './components/ProvidersModal';
import ProductFormModal from './components/ProductFormModal';
import Toast from './components/Toast';
import ClientOrdersModal from './components/ClientOrdersModal';
import SessionExpiredOverlay from './components/SessionExpiredOverlay';
import useInactivityTimer from './hooks/useInactivityTimer';

import { INITIAL_PRODUCTS } from './data/mockProducts';
import {
  authApi,
  productsApi,
  providersApi,
  ordersApi,
  cardsApi,
  configApi,
  getStoredUser,
  setStoredUser,
  setAuthToken
} from './api/apiService';

const DEFAULT_DATE_ISO = '2026-10-13T10:00:00.000Z';

const DEFAULT_PROVIDERS = [
  {
    id: 1,
    name: 'Distribuidora PetFood Ecuador S.A. (Pronaca)',
    contact_name: 'Ing. Carlos Gómez',
    phone: '0998765432',
    email: 'ventas@petfood.ec',
    address: 'Av. 10 de Agosto, Quito',
    default_cost: 12.00,
    offered_products: [
      { id: 1, name: 'Croquetas Dog Chow Adultos 2kg', category: 'Alimentos', pet_type: 'Perros', cost_price: 6.50 },
      { id: 2, name: 'ProPlan Adulto Razas Grandes 3kg', category: 'Alimentos', pet_type: 'Perros', cost_price: 18.00 },
      { id: 3, name: 'Huesos de Carnaza Masticables x3', category: 'Juguetes', pet_type: 'Perros', cost_price: 3.50 }
    ]
  },
  {
    id: 2,
    name: 'Importadora PetEcuador & Purina',
    contact_name: 'Juan Pérez',
    phone: '0991234567',
    email: 'ventas@petecuador.ec',
    address: 'Quito Norte, Av. Amazonas N32-89',
    default_cost: 15.00,
    offered_products: [
      { id: 4, name: 'Cat Chow Esterilizados 1.5kg', category: 'Alimentos', pet_type: 'Gatos', cost_price: 5.80 },
      { id: 5, name: 'Rascador Torre con Hamaca para Gatos', category: 'Accesorios', pet_type: 'Gatos', cost_price: 26.00 },
      { id: 6, name: 'Arena Sanitaria Aglomerante 5kg', category: 'Accesorios', pet_type: 'Gatos', cost_price: 4.20 }
    ]
  },
  {
    id: 3,
    name: 'Accesorios & Juguetes Guayaquil Cía. Ltda.',
    contact_name: 'Lcda. Andrea Noboa',
    phone: '0981234567',
    email: 'contacto@accesoriosgye.ec',
    address: 'Av. 9 de Octubre, Guayaquil',
    default_cost: 8.00,
    offered_products: [
      { id: 7, name: 'Mezcla Nutritiva Hámster Cereal & Frutas 500g', category: 'Alimentos', pet_type: 'Hamsters', cost_price: 2.20 },
      { id: 8, name: 'Rueda de Ejercicios Silenciosa Hámster', category: 'Juguetes', pet_type: 'Hamsters', cost_price: 3.80 },
      { id: 9, name: 'Heno Timothy Premium Conejos 1kg', category: 'Alimentos', pet_type: 'Conejos', cost_price: 3.90 },
      { id: 10, name: 'Bebedero Antigoteo para Conejos 500ml', category: 'Accesorios', pet_type: 'Conejos', cost_price: 2.90 }
    ]
  }
];

const DEFAULT_PURCHASES = [
  { id: 1, provider_id: 1, provider_name: 'Distribuidora PetFood Ecuador S.A. (Pronaca)', product_name: 'Croquetas Dog Chow Adultos 2kg', quantity: 25, unit_cost: 6.50, total_cost: 162.50, purchase_date: DEFAULT_DATE_ISO },
  { id: 2, provider_id: 1, provider_name: 'Distribuidora PetFood Ecuador S.A. (Pronaca)', product_name: 'ProPlan Adulto Razas Grandes 3kg', quantity: 15, unit_cost: 18.00, total_cost: 270.00, purchase_date: DEFAULT_DATE_ISO },
  { id: 3, provider_id: 2, provider_name: 'Importadora PetEcuador & Purina', product_name: 'Cat Chow Esterilizados 1.5kg', quantity: 20, unit_cost: 5.80, total_cost: 116.00, purchase_date: DEFAULT_DATE_ISO },
  { id: 4, provider_id: 2, provider_name: 'Importadora PetEcuador & Purina', product_name: 'Rascador Torre con Hamaca para Gatos', quantity: 8, unit_cost: 26.00, total_cost: 208.00, purchase_date: DEFAULT_DATE_ISO },
  { id: 5, provider_id: 3, provider_name: 'Accesorios & Juguetes Guayaquil Cía. Ltda.', product_name: 'Mezcla Nutritiva Hámster Cereal & Frutas 500g', quantity: 30, unit_cost: 2.20, total_cost: 66.00, purchase_date: DEFAULT_DATE_ISO },
  { id: 6, provider_id: 3, provider_name: 'Accesorios & Juguetes Guayaquil Cía. Ltda.', product_name: 'Heno Timothy Premium Conejos 1kg', quantity: 20, unit_cost: 3.90, total_cost: 78.00, purchase_date: DEFAULT_DATE_ISO }
];

const DEFAULT_SAVED_CARDS = [
  { id: 1, user_id: 3, card_type: 'debito', masked_number: '•••• •••• •••• 4589', card_number: '2100458922334589', cardholder_name: 'MARÍA FERNANDA PÉREZ', client_ci: '1710034065', expiry_month: 10, expiry_year: 2028 }
];

const DEFAULT_ORDERS = [
  {
    id: 101,
    username: 'maria_ecuador',
    payment_method: 'tarjeta',
    payment_status: 'pendiente_validacion',
    subtotal: 34.50,
    iva_applied: 5.18,
    total: 39.68,
    payment_proof_image: 'comprobante_banco_pichincha_101.jpg',
    created_at: DEFAULT_DATE_ISO,
    items: [{ id: 1, product_id: 2, quantity: 1, unit_price: 34.50 }]
  },
  {
    id: 102,
    username: 'carlos_quito',
    payment_method: 'efectivo',
    payment_status: 'pendiente_validacion',
    subtotal: 7.99,
    iva_applied: 1.20,
    total: 9.19,
    payment_proof_image: null,
    created_at: DEFAULT_DATE_ISO,
    items: [{ id: 2, product_id: 3, quantity: 1, unit_price: 7.99 }]
  },
  {
    id: 100,
    username: 'ana_guayaquil',
    payment_method: 'transferencia',
    payment_status: 'pagado',
    subtotal: 49.90,
    iva_applied: 7.48,
    total: 57.38,
    payment_proof_image: 'comprobante_pichincha_100.png',
    created_at: DEFAULT_DATE_ISO,
    items: [{ id: 3, product_id: 5, quantity: 1, unit_price: 49.90 }]
  }
];

const DEFAULT_USERS = [
  { id: 1, username: 'admin', email: 'admin@chupetlove.ec', role: 'admin', is_active: true },
  { id: 2, username: 'vendedor', email: 'vendedor@chupetlove.ec', role: 'vendedor', is_active: true },
  { id: 3, username: 'maria_ecuador', email: 'maria@gmail.com', role: 'cliente', is_active: true },
  { id: 4, username: 'carlos_quito', email: 'carlos@gmail.com', role: 'cliente', is_active: true }
];

export default function App() {
  // 1. Auth & User state (starts null or from localStorage to require initial login if unauthenticated)
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 2. Modals state
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isProvidersOpen, setIsProvidersOpen] = useState(false);
  const [productModal, setProductModal] = useState({ isOpen: false, mode: 'create', product: null });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isClientOrdersOpen, setIsClientOrdersOpen] = useState(false);

  // 3. Data states
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [providers, setProviders] = useState(DEFAULT_PROVIDERS);
  const [purchases, setPurchases] = useState(DEFAULT_PURCHASES);
  const [purchasesSummary, setPurchasesSummary] = useState({
    total_supplier_cost: 900.50,
    total_purchases: 6,
    total_units_purchased: 118
  });
  const [savedCards, setSavedCards] = useState(DEFAULT_SAVED_CARDS);
  const [cartItems, setCartItems] = useState([]);
  const [ivaPercentage, setIvaPercentage] = useState(15.00);

  // Initial orders
  const [orders, setOrders] = useState(DEFAULT_ORDERS);

  // Initial users
  const [users, setUsers] = useState(DEFAULT_USERS);

  // 4. Toast alerts
  const [toasts, setToasts] = useState([]);

  // 5. Inactivity session expiry state
  const [sessionExpired, setSessionExpired] = useState(false);

  // Callback ejecutado por useInactivityTimer cuando expiran 10 min sin actividad
  const handleInactivityExpire = useCallback(() => {
    // Limpiar tokens y datos de sesión
    setAuthToken(null);
    setStoredUser(null);
    // Mostrar overlay antes de destruir el currentUser
    setSessionExpired(true);
  }, []);

  // Hook de inactividad: solo activo cuando hay sesión iniciada
  useInactivityTimer({
    onExpire: handleInactivityExpire,
    isActive: !!currentUser,
  });

  // Cierra el overlay y redirige al login (setCurrentUser(null) desmonta las vistas)
  const handleSessionExpiredClose = useCallback(() => {
    setSessionExpired(false);
    setCurrentUser(null);
    setCartItems([]);
  }, []);

  const showToast = (type, message, title = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync with Backend
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const ivaRes = await configApi.getIva();
        if (ivaRes && ivaRes.iva_percentage) setIvaPercentage(ivaRes.iva_percentage);
      } catch {}

      try {
        const prodRes = await productsApi.getAll();
        if (Array.isArray(prodRes) && prodRes.length > 0) {
          const merged = prodRes.map((p, idx) => ({
            ...p,
            image: p.image || INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length]?.image || 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop',
            description: p.description || INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length]?.description
          }));
          setProducts(merged);
        }
      } catch {}

      try {
        const provRes = await providersApi.getAll();
        if (Array.isArray(provRes) && provRes.length > 0) setProviders(provRes);
      } catch {}

      try {
        const ordRes = await ordersApi.list();
        if (Array.isArray(ordRes) && ordRes.length > 0) setOrders(ordRes);
      } catch {}

      try {
        const purchasesRes = await productsApi.getPurchases();
        if (Array.isArray(purchasesRes) && purchasesRes.length > 0) setPurchases(purchasesRes);
      } catch {}

      try {
        const summaryRes = await productsApi.getPurchasesSummary();
        if (summaryRes && summaryRes.total_supplier_cost !== undefined) setPurchasesSummary(summaryRes);
      } catch {}

      if (currentUser?.role === 'cliente') {
        try {
          const cardRes = await cardsApi.list();
          if (Array.isArray(cardRes) && cardRes.length > 0) setSavedCards(cardRes);
        } catch {}
      }

      if (currentUser?.role === 'admin') {
        try {
          const usersRes = await authApi.getUsers();
          if (Array.isArray(usersRes) && usersRes.length > 0) setUsers(usersRes);
        } catch {}
      }
    };

    loadBackendData();
  }, [currentUser]);

  // Low stock products (stock <= 3)
  const lowStockProducts = products.filter(p => p.stock <= 3);

  // Listener para expiración de JWT (ISO/IEC 25010 Seguridad)
  useEffect(() => {
    const handleAuthExpired = (e) => {
      setCurrentUser(null);
      setCartItems([]);
      setAuthError(e.detail?.message || 'Su sesión ha expirado por seguridad (ISO/IEC 25010). Por favor inicie sesión nuevamente.');
      showToast('warning', 'Sesión expirada por seguridad. Inicie sesión nuevamente.', 'Sesión Expirada');
    };
    window.addEventListener('chupetlove:auth_expired', handleAuthExpired);
    return () => window.removeEventListener('chupetlove:auth_expired', handleAuthExpired);
  }, []);

  // AUTH ACTIONS
  const handleLogin = async (username, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await authApi.login(username, password);
      setAuthToken(data.access_token);
      const userObj = {
        id: data.user_id || 1,
        username: data.username || username,
        email: `${data.username || username}@chupetlove.ec`,
        role: data.role || (username.toLowerCase() === 'admin' ? 'admin' : username.toLowerCase() === 'vendedor' ? 'vendedor' : 'cliente')
      };
      setCurrentUser(userObj);
      setStoredUser(userObj);
      showToast('success', `¡Bienvenido, ${userObj.username}! Has ingresado con rol ${userObj.role.toUpperCase()}`, 'Autenticación Exitosa');
    } catch (err) {
      if (err.isNetworkError) {
        // Fallback de alta disponibilidad offline para testing de QA
        const cleanU = username.trim().toLowerCase();
        let fallbackRole = null;
        if (cleanU === 'admin' && password === 'admin123') fallbackRole = 'admin';
        else if (cleanU === 'vendedor' && password === 'vendedor123') fallbackRole = 'vendedor';
        else if ((cleanU === 'cliente' || cleanU === 'maria_ecuador') && password === 'cliente123') fallbackRole = 'cliente';

        if (fallbackRole) {
          const offlineUser = {
            id: fallbackRole === 'admin' ? 1 : fallbackRole === 'vendedor' ? 2 : 3,
            username: cleanU,
            email: `${cleanU}@chupetlove.ec`,
            role: fallbackRole
          };
          setCurrentUser(offlineUser);
          setStoredUser(offlineUser);
          showToast('warning', `Servidor backend fuera de línea. Autenticado en modo contingencia como ${fallbackRole.toUpperCase()}`, 'Modo Fuera de Línea');
          return;
        }
      }
      setAuthError(err.message || 'Usuario o contraseña incorrectos. Verifique sus datos e intente nuevamente.');
      showToast('error', err.message || 'Usuario o contraseña incorrectos', 'Acceso Denegado');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterClient = async (userData) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await authApi.registerClient(userData);
      const newClient = {
        id: data.id || users.length + 1,
        username: data.username,
        email: data.email || `${data.username}@chupetlove.ec`,
        role: 'cliente'
      };
      setUsers(prev => [...prev, newClient]);
      setCurrentUser(newClient);
      setStoredUser(newClient);
      showToast('success', 'Tu cuenta de Cliente ha sido creada con éxito. Tus tarjetas y datos están protegidos.', '¡Registro Exitoso!');
    } catch (err) {
      if (err.isNetworkError) {
        const cleanU = userData.username.trim().toLowerCase();
        const offlineClient = {
          id: users.length + 1,
          username: cleanU,
          email: `${cleanU}@chupetlove.ec`,
          role: 'cliente'
        };
        setUsers(prev => [...prev, offlineClient]);
        setCurrentUser(offlineClient);
        setStoredUser(offlineClient);
        showToast('warning', 'Cuenta creada en modo contingencia (Servidor backend fuera de línea).', 'Registro Local');
        return;
      }
      setAuthError(err.message || 'Error al registrar el usuario. Verifique los datos.');
      showToast('error', err.message || 'Error al registrar usuario', 'Error de Registro');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setCurrentUser(null);
    setCartItems([]);
    showToast('info', 'Has cerrado sesión correctamente de ChuPetLove', 'Sesión Finalizada');
  };

  // CART ACTIONS (CLIENT ONLY)
  const handleAddToCart = (product, quantity) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(product.stock, updated[existingIndex].quantity + quantity);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      }
      return [...prev, { ...product, quantity }];
    });
    showToast('success', `${product.name} (+${quantity}) añadido al carrito`, 'Carrito Actualizado');
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: Math.min(item.stock, newQty) };
      }
      return item;
    }));
  };

  const handleRemoveCartItem = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
    showToast('info', 'Producto removido del carrito');
  };

  // CHECKOUT ACTION
  const handleCheckout = async (orderData) => {
    let uploadedProofName = null;

    if (orderData.proofFile) {
      try {
        const uploadRes = await ordersApi.uploadProof(orderData.proofFile);
        uploadedProofName = uploadRes.filename;
      } catch {
        uploadedProofName = orderData.proofFile.name;
      }
    }

    const newOrderId = Math.floor(Math.random() * 9000) + 200;

    // Deduct local product stock
    setProducts(prev => prev.map(p => {
      const purchased = orderData.items.find(i => i.id === p.id);
      if (purchased) {
        return { ...p, stock: Math.max(0, p.stock - purchased.quantity) };
      }
      return p;
    }));

    const newOrderObj = {
      id: newOrderId,
      username: currentUser?.username || 'cliente_registrado',
      payment_method: orderData.payment_method,
      payment_status: 'pendiente_validacion',
      subtotal: orderData.subtotal,
      iva_applied: orderData.iva_applied,
      iva_percentage: orderData.iva_percentage,
      total: orderData.total,
      payment_proof_image: uploadedProofName || (orderData.payment_method === 'tarjeta' ? 'captura_pago_tarjeta_pichincha.png' : null),
      created_at: new Date().toISOString(),
      items: orderData.items.map(i => ({ id: i.id, product_id: i.id, quantity: i.quantity, unit_price: i.sale_price }))
    };

    setOrders(prev => [newOrderObj, ...prev]);

    // Send to FastAPI if alive
    try {
      await ordersApi.checkout({
        items: orderData.items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        payment_method: orderData.payment_method,
        card_info: orderData.card_info,
        payment_proof_image: uploadedProofName
      });
    } catch {}

    setOrderSuccess(newOrderObj);
    setCartItems([]);
    setIsCartOpen(false);
    showToast('success', `Orden #${newOrderId} enviada a validación por $${orderData.total.toFixed(2)}`, '¡Compra Registrada!');
  };

  // ORDER VALIDATION & PDF INVOICE
  const handleValidateOrder = async (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, payment_status: 'pagado' };
      }
      return o;
    }));

    try {
      await ordersApi.updateStatus(orderId, 'pagado');
    } catch {}

    showToast('success', `Orden #${orderId} validada y aprobada con éxito`, 'Pago Aprobado');
  };

  const handleDownloadInvoice = async (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder && targetOrder.payment_status !== 'pagado') {
      showToast('warning', `La factura de la orden #${orderId} está bloqueada. El pago aún se encuentra 'pendiente de validación' por el comercio.`, 'Factura Bloqueada');
      return;
    }

    try {
      await ordersApi.downloadInvoicePdf(orderId);
      showToast('success', `Descargando factura oficial en PDF de la orden #${orderId}`);
    } catch (err) {
      showToast('error', err.message || 'No se puede descargar la factura. La orden debe estar aprobada como pagada.', 'Factura Bloqueada');
    }
  };

  // CONFIG IVA (ADMIN ONLY)
  const handleUpdateIva = async (newIvaVal) => {
    setIvaPercentage(newIvaVal);
    try {
      await configApi.updateIva(newIvaVal);
    } catch {}
    showToast('success', `Porcentaje de IVA actualizado a ${newIvaVal}% en todo el sistema`, 'Configuración Guardada');
  };

  // CARDS WALLET ACTIONS (PRIVATE CLIENT ONLY)
  const handleAddCard = async (cardData) => {
    try {
      const res = await cardsApi.create(cardData);
      setSavedCards(prev => [...prev, res]);
    } catch {
      const newCard = {
        id: savedCards.length + 1,
        ...cardData,
        masked_number: `•••• •••• •••• ${cardData.card_number?.slice(-4) || '1234'}`
      };
      setSavedCards(prev => [...prev, newCard]);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await cardsApi.delete(cardId);
    } catch {}
    setSavedCards(prev => prev.filter(c => c.id !== cardId));
    showToast('info', 'Tarjeta eliminada de tu billetera privada');
  };

  // PROVIDERS ACTIONS
  const handleCreateProvider = async (data) => {
    try {
      const res = await providersApi.create(data);
      setProviders(prev => [...prev, res]);
    } catch {
      const newProv = { id: providers.length + 1, ...data };
      setProviders(prev => [...prev, newProv]);
    }
  };

  const handleUpdateProvider = async (id, data) => {
    try {
      const res = await providersApi.update(id, data);
      setProviders(prev => prev.map(p => p.id === id ? res : p));
    } catch {
      setProviders(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    }
  };

  const handleDeleteProvider = async (id) => {
    try {
      await providersApi.delete(id);
    } catch {}
    setProviders(prev => prev.filter(p => p.id !== id));
    showToast('info', 'Proveedor eliminado');
  };

  // PRODUCTS ACTIONS
  const handleCreateOrEditProduct = async (productData, editId = null) => {
    if (editId) {
      try {
        const res = await productsApi.update(editId, productData);
        setProducts(prev => prev.map(p => p.id === editId ? { ...p, ...res } : p));
      } catch {
        setProducts(prev => prev.map(p => p.id === editId ? { ...p, ...productData } : p));
      }
      showToast('success', 'Producto modificado exitosamente');
    } else {
      const selectedProv = providers.find(p => p.id === productData.provider_id);
      const provName = selectedProv ? selectedProv.name : 'Distribuidor Asignado';
      const cost = parseFloat(productData.cost_price || 10.0);
      const qty = parseInt(productData.stock || 10, 10);
      const totalCost = cost * qty;

      try {
        const res = await productsApi.create(productData);
        setProducts(prev => [res, ...prev]);

        // Refresh purchases from API if available
        try {
          const updatedPurchases = await productsApi.getPurchases();
          if (Array.isArray(updatedPurchases)) setPurchases(updatedPurchases);
          const updatedSummary = await productsApi.getPurchasesSummary();
          if (updatedSummary) setPurchasesSummary(updatedSummary);
        } catch {}
      } catch {
        const newP = {
          id: products.length + 1,
          ...productData,
          image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop',
          description: 'Producto registrado en ChuPetLove Ecuador'
        };
        setProducts(prev => [newP, ...prev]);

        // Register local purchase record
        const newPurchase = {
          id: purchases.length + 1,
          provider_id: productData.provider_id,
          provider_name: provName,
          product_name: productData.name,
          quantity: qty,
          unit_cost: cost,
          total_cost: totalCost,
          purchase_date: new Date().toISOString()
        };
        setPurchases(prev => [newPurchase, ...prev]);
        setPurchasesSummary(prev => ({
          total_supplier_cost: (prev?.total_supplier_cost || 0) + totalCost,
          total_purchases: (prev?.total_purchases || 0) + 1,
          total_units_purchased: (prev?.total_units_purchased || 0) + qty
        }));
      }
      showToast('success', 'Producto creado y compra de inventario registrada');
    }
  };

  const handleRestockProduct = async (productId, quantity) => {
    const targetProduct = products.find(p => p.id === productId);
    const cost = targetProduct ? parseFloat(targetProduct.cost_price || 10.0) : 10.0;
    const selectedProv = targetProduct ? providers.find(p => p.id === targetProduct.provider_id) : null;
    const provName = selectedProv ? selectedProv.name : 'Distribuidor Asignado';
    const totalCost = cost * quantity;

    try {
      await productsApi.restock(productId, quantity);

      try {
        const updatedPurchases = await productsApi.getPurchases();
        if (Array.isArray(updatedPurchases)) setPurchases(updatedPurchases);
        const updatedSummary = await productsApi.getPurchasesSummary();
        if (updatedSummary) setPurchasesSummary(updatedSummary);
      } catch {}
    } catch {
      // Local purchase ledger entry
      const newPurchase = {
        id: purchases.length + 1,
        provider_id: targetProduct?.provider_id || 1,
        provider_name: provName,
        product_name: targetProduct ? targetProduct.name : 'Producto Reabastecido',
        quantity: quantity,
        unit_cost: cost,
        total_cost: totalCost,
        purchase_date: new Date().toISOString()
      };
      setPurchases(prev => [newPurchase, ...prev]);
      setPurchasesSummary(prev => ({
        total_supplier_cost: (prev?.total_supplier_cost || 0) + totalCost,
        total_purchases: (prev?.total_purchases || 0) + 1,
        total_units_purchased: (prev?.total_units_purchased || 0) + quantity
      }));
    }

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, stock: p.stock + quantity };
      }
      return p;
    }));

    showToast('success', `Se añadieron +${quantity} unidades al inventario`, 'Reabastecimiento Exitoso');
  };

  // USER CRUD (ADMIN ONLY)
  const handleCreateUser = async (userData) => {
    try {
      const res = await authApi.createUser(userData);
      setUsers(prev => [...prev, res]);
    } catch {
      const newU = {
        id: users.length + 1,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        is_active: true
      };
      setUsers(prev => [...prev, newU]);
    }
    showToast('success', `Usuario ${userData.username} creado con rol ${userData.role.toUpperCase()}`);
  };

  const handleToggleUserStatus = async (userId) => {
    const userToToggle = users.find(u => u.id === userId);
    const newStatus = !userToToggle?.is_active;

    try {
      await authApi.updateUserStatus(userId, newStatus);
    } catch {}

    setUsers(prev => prev.map(u => {
      if (u.id === userId) return { ...u, is_active: newStatus };
      return u;
    }));
    showToast('info', `Estado de usuario actualizado a ${newStatus ? 'Activo' : 'Inactivo'}`);
  };

  const handleUpdateUser = async (userId, updateData) => {
    try {
      const res = await authApi.updateUser(userId, updateData);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...res } : u));
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updateData } : u));
    }
    showToast('success', 'Usuario actualizado correctamente', 'Modificación Exitosa');
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productsApi.delete(productId);
    } catch {}
    setProducts(prev => prev.filter(p => p.id !== productId));
    showToast('info', 'Producto eliminado del catálogo', 'Producto Eliminado');
  };

  const handleDeleteUser = async (userId) => {
    try {
      await authApi.deleteUser(userId);
    } catch {}
    setUsers(prev => prev.filter(u => u.id !== userId));
    showToast('info', 'Usuario eliminado del sistema');
  };

  // 1. STRICT UNGUARDED BARRIER: If user is not authenticated, show ONLY AuthScreen
  if (!currentUser) {
    return (
      <>
        <AuthScreen
          onLogin={handleLogin}
          onRegister={handleRegisterClient}
          loading={authLoading}
          error={authError}
          clearError={() => setAuthError('')}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
        {/* Overlay de expiración: se puede mostrar sobre el login si el usuario
            ya estaba en sesión y el overlay se disparó antes de desmontarse */}
        <SessionExpiredOverlay
          visible={sessionExpired}
          onClose={handleSessionExpiredClose}
        />
      </>
    );
  }

  const role = currentUser.role || 'cliente';
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // 2. AUTHENTICATED WORKSPACES: Strict RBAC Separation
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2' }}>
      {/* Dynamic Header */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenOrders={() => setIsClientOrdersOpen(true)}
        onOpenProviders={() => setIsProvidersOpen(true)}
        onOpenProductModal={() => setProductModal({ isOpen: true, mode: 'create', product: null })}
        ivaPercentage={ivaPercentage}
      />

      {/* Main View Container */}
      <main>
        {/* ROLE 1: CLIENT VIEW (Catalog & Shopping only) */}
        {role === 'cliente' && (
          <Catalog
            products={products}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* ROLE 2: VENDOR VIEW (Cashier operations, Order validation, Inventory alerts & Supplier contacts) */}
        {role === 'vendedor' && (
          <SellerPanel
            orders={orders}
            products={products}
            providers={providers}
            onValidateOrder={handleValidateOrder}
            lowStockProducts={lowStockProducts}
            onDownloadInvoice={handleDownloadInvoice}
          />
        )}

        {/* ROLE 3: ADMIN VIEW (Executive KPIs, Net profit calculation, Dynamic IVA, User CRUD & Catalog management) */}
        {role === 'admin' && (
          <AdminDashboard
            products={products}
            orders={orders}
            users={users}
            providers={providers}
            purchases={purchases}
            purchasesSummary={purchasesSummary}
            ivaPercentage={ivaPercentage}
            onUpdateIva={handleUpdateIva}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onToggleUserStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
            onValidateOrder={handleValidateOrder}
            onDownloadInvoice={handleDownloadInvoice}
            onDeleteProduct={handleDeleteProduct}
            onOpenProductModal={() => setProductModal({ isOpen: true, mode: 'create', product: null })}
            onOpenEditProductModal={(p) => setProductModal({ isOpen: true, mode: 'edit', product: p })}
            onOpenRestockModal={(p) => setProductModal({ isOpen: true, mode: 'restock', product: p })}
            onOpenProvidersModal={() => setIsProvidersOpen(true)}
            onCreateProvider={handleCreateProvider}
            onUpdateProvider={handleUpdateProvider}
            onDeleteProvider={handleDeleteProvider}
            showToast={showToast}
          />
        )}
      </main>

      {/* Client Cart Drawer */}
      {role === 'cliente' && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={handleCheckout}
          ivaPercentage={ivaPercentage}
          savedCards={savedCards}
          currentUser={currentUser}
        />
      )}

      {/* Client Private Card Wallet Modal (Banco Pichincha) */}
      {role === 'cliente' && (
        <CardWalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          cards={savedCards}
          onAddCard={handleAddCard}
          onDeleteCard={handleDeleteCard}
          showToast={showToast}
        />
      )}

      {/* Providers Management Modal (Admin only - Vendedor has inline read-only view) */}
      {role === 'admin' && (
        <ProvidersModal
          isOpen={isProvidersOpen}
          onClose={() => setIsProvidersOpen(false)}
          providers={providers}
          products={products}
          onCreateProvider={handleCreateProvider}
          onUpdateProvider={handleUpdateProvider}
          onDeleteProvider={handleDeleteProvider}
          showToast={showToast}
        />
      )}

      {/* Product Form / Restock Modal (Admin only - Vendedor has NO CRUD) */}
      {role === 'admin' && (
        <ProductFormModal
          isOpen={productModal.isOpen}
          onClose={() => setProductModal({ isOpen: false, mode: 'create', product: null })}
          mode={productModal.mode}
          product={productModal.product}
          providers={providers}
          onSubmit={productModal.mode === 'restock' ? handleRestockProduct : handleCreateOrEditProduct}
          showToast={showToast}
        />
      )}

      {/* Client Order History & Notifications Modal */}
      {role === 'cliente' && (
        <ClientOrdersModal
          isOpen={isClientOrdersOpen}
          onClose={() => setIsClientOrdersOpen(false)}
          orders={orders}
          currentUser={currentUser}
          onDownloadInvoice={handleDownloadInvoice}
          ivaPercentage={ivaPercentage}
        />
      )}

      {/* Order Success Confirmation Modal */}
      {orderSuccess && (
        <OrderSuccessModal
          orderData={orderSuccess}
          onClose={() => setOrderSuccess(null)}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Overlay de Sesión Expirada por Inactividad (10 min) */}
      <SessionExpiredOverlay
        visible={sessionExpired}
        onClose={handleSessionExpiredClose}
      />
    </div>
  );
}
