import React, { useState } from 'react';
import {
  DollarSign, Percent, UserPlus, Users, TrendingUp, Settings, Trash2,
  CheckCircle2, AlertTriangle, RefreshCw, PackagePlus,
  Building2, Eye, Download, FileText, Check, Clock, Search,
  Edit2, Package, ArrowUpRight, AlertCircle
} from 'lucide-react';
import ProofViewerModal from './ProofViewerModal';

export default function AdminDashboard({
  products = [],
  orders = [],
  users = [],
  providers = [],
  purchases = [],
  purchasesSummary = null,
  ivaPercentage = 15.00,
  onUpdateIva,
  onCreateUser,
  onUpdateUser,
  onToggleUserStatus,
  onDeleteUser,
  onValidateOrder,
  onDownloadInvoice,
  onDeleteProduct,
  onOpenProductModal,
  onOpenEditProductModal,
  onOpenRestockModal,
  onOpenProvidersModal
}) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'products' | 'purchases' | 'providers' | 'users' | 'payments' | 'invoices' | 'config'

  // IVA Form State
  const [newIva, setNewIva] = useState(ivaPercentage);
  const [ivaSuccessMsg, setIvaSuccessMsg] = useState(false);

  // Simplified User Creation Form (Only username, password, confirmPassword + role)
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'vendedor'
  });
  const [userSuccessMsg, setUserSuccessMsg] = useState(false);
  const [userErrorMsg, setUserErrorMsg] = useState('');

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    role: 'vendedor',
    is_active: true
  });
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Proof Viewer Modal
  const [viewProofOrder, setViewProofOrder] = useState(null);

  // Search & Filter States
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');

  // ----------------------------------------------------
  // FINANCIAL CALCULATIONS (REAL BUSINESS METRICS & PURCHASES LEDGER)
  // ----------------------------------------------------
  let totalGrossRevenue = 0.0;
  let totalCostOfGoodsSold = 0.0;
  let paidOrdersCount = 0;

  orders.forEach(order => {
    if (order.payment_status === 'pagado') {
      paidOrdersCount++;
      totalGrossRevenue += (order.subtotal || 0);

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const prod = products.find(p => p.id === (item.product_id || item.id));
          const unitCost = prod ? parseFloat(prod.cost_price) : (item.unit_price * 0.60);
          totalCostOfGoodsSold += (item.quantity * unitCost);
        });
      }
    }
  });

  // Calculate Total Supplier Purchases Expenditure (Accounting Egreso)
  const totalSupplierPurchases = purchasesSummary?.total_supplier_cost !== undefined
    ? parseFloat(purchasesSummary.total_supplier_cost)
    : purchases.reduce((acc, p) => acc + (parseFloat(p.total_cost) || 0), 0);

  // Impacto contable real: Ganancia Neta = Ingresos por Ventas - Compras a Proveedores
  const netProfit = totalGrossRevenue - totalSupplierPurchases;
  const profitMarginPercent = totalGrossRevenue > 0 ? (netProfit / totalGrossRevenue) * 100 : 0;
  const lowStockProducts = products.filter(p => p.stock <= 3);

  // Filtered Lists
  const pendingOrders = orders.filter(o => o.payment_status === 'pendiente_validacion');
  const paidInvoices = orders.filter(o => o.payment_status === 'pagado');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.pet_type.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p =>
    p.product_name.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
    (p.provider_name && p.provider_name.toLowerCase().includes(purchaseSearch.toLowerCase()))
  );

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredInvoices = paidInvoices.filter(o =>
    String(o.id).includes(orderSearch) ||
    (o.username && o.username.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  const handleIvaSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdateIva(parseFloat(newIva));
      setIvaSuccessMsg(true);
      setTimeout(() => setIvaSuccessMsg(false), 3500);
    } catch {
      // handled
    }
  };

  // Simplified User Creation (Requirement 3: Username + Password + Confirm Password)
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setUserErrorMsg('');

    const u = userForm.username.trim();
    const p = userForm.password.trim();
    const cp = userForm.confirmPassword.trim();

    if (!u || !p || !cp) {
      setUserErrorMsg('Todos los campos son obligatorios.');
      return;
    }
    if (u.length < 3) {
      setUserErrorMsg('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (p.length < 6) {
      setUserErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (p !== cp) {
      setUserErrorMsg('Las contraseñas no coinciden. Verifique nuevamente.');
      return;
    }

    try {
      await onCreateUser({
        username: u,
        password: p,
        role: userForm.role
      });
      setUserForm({ username: '', password: '', confirmPassword: '', role: 'vendedor' });
      setUserSuccessMsg(true);
      setTimeout(() => setUserSuccessMsg(false), 3500);
    } catch (err) {
      setUserErrorMsg(err.message || 'Error al crear la cuenta de usuario');
    }
  };

  // User Edit Open (Requirement 4: Full User Editing)
  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      password: '',
      role: user.role,
      is_active: user.is_active
    });
    setEditErrorMsg('');
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.username.trim()) {
      setEditErrorMsg('El nombre de usuario no puede estar vacío');
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      setEditErrorMsg('Si actualiza la contraseña, debe tener al menos 6 caracteres');
      return;
    }

    try {
      const payload = {
        username: editForm.username.trim(),
        role: editForm.role,
        is_active: editForm.is_active
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      await onUpdateUser(editingUser.id, payload);
      setEditingUser(null);
    } catch (err) {
      setEditErrorMsg(err.message || 'Error al actualizar usuario');
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Executive Command Header */}
      <div style={{
        backgroundColor: '#0F172A',
        borderRadius: '24px',
        padding: '30px 36px',
        marginBottom: '28px',
        color: '#FFFFFF',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 122, 0, 0.15) 0%, rgba(255, 122, 0, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              backgroundColor: '#FF7A00',
              color: '#FFFFFF',
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '20px',
              letterSpacing: '0.05em'
            }}>
              PORTAL GERENCIAL EJECUTIVO
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              ChuPetLove S.A. • Ecuador
            </span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            Panel de Control y Dirección General
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
            Monitoreo financiero en tiempo real, validación de pagos, facturación oficial y administración de inventario.
          </p>
        </div>

        {/* Action Quick Launchers */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', zIndex: 2 }}>
          <button
            onClick={onOpenProductModal}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <PackagePlus size={18} /> Nuevo Producto
          </button>
          <button
            onClick={onOpenProvidersModal}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Building2 size={18} /> Proveedores ({providers.length})
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div style={{
        display: 'flex',
        gap: '6px',
        backgroundColor: '#FFFFFF',
        padding: '6px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        marginBottom: '28px',
        overflowX: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        {[
          { id: 'metrics', label: 'Dashboard Financiero', icon: TrendingUp },
          { id: 'products', label: `Inventario (${products.length})`, icon: Package },
          { id: 'purchases', label: `Compras a Proveedores (${purchases.length})`, icon: DollarSign },
          { id: 'providers', label: `Proveedores (${providers.length})`, icon: Building2 },
          { id: 'users', label: `Control de Usuarios (${users.length})`, icon: Users },
          { id: 'payments', label: `Validación Pagos (${pendingOrders.length})`, icon: Clock, badge: pendingOrders.length },
          { id: 'invoices', label: `Facturas Emitidas (${paidInvoices.length})`, icon: FileText },
          { id: 'config', label: 'Configuración IVA', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isActive ? '#0F172A' : 'transparent',
                color: isActive ? '#FFFFFF' : '#64748B',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={17} color={isActive ? '#FF7A00' : '#64748B'} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FINANCIAL DASHBOARD & METRICS */}
      {/* ========================================================================= */}
      {activeTab === 'metrics' && (
        <div>
          {/* KPI Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* 1. Gross Revenue */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '22px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>
                  INGRESOS POR VENTAS
                </span>
                <div style={{ backgroundColor: '#FFF2E8', padding: '10px', borderRadius: '12px', color: '#FF7A00' }}>
                  <DollarSign size={20} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                ${totalGrossRevenue.toFixed(2)}
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '6px' }}>
                {paidOrdersCount} órdenes cobradas exitosamente
              </p>
            </div>

            {/* 2. Total Supplier Purchases (Egreso Contable de Inventario) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '22px',
              border: '1.5px solid #FCA5A5',
              boxShadow: '0 4px 15px rgba(220, 38, 38, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B', letterSpacing: '0.05em' }}>
                  COMPRAS A PROVEEDORES (EGRESOS)
                </span>
                <div style={{ backgroundColor: '#FEF2F2', padding: '10px', borderRadius: '12px', color: '#DC2626' }}>
                  <TrendingUp size={20} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#DC2626', margin: 0 }}>
                ${totalSupplierPurchases.toFixed(2)}
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#991B1B', marginTop: '6px', fontWeight: 700 }}>
                {purchases.length} adquisiciones de mercadería
              </p>
            </div>

            {/* 3. Cost of Goods Sold (CMV) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '22px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>
                  COSTO DE MERCADERÍA VENDIDA
                </span>
                <div style={{ backgroundColor: '#F1F5F9', padding: '10px', borderRadius: '12px', color: '#475569' }}>
                  <Package size={20} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#475569', margin: 0 }}>
                ${totalCostOfGoodsSold.toFixed(2)}
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '6px' }}>
                Costo base de ítems entregados
              </p>
            </div>

            {/* 4. Net Profit */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '22px',
              border: '2px solid #BBF7D0',
              boxShadow: '0 6px 20px rgba(34, 197, 94, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', letterSpacing: '0.05em' }}>
                  GANANCIA NETA CONTABLE (VENTAS - COMPRAS)
                </span>
                <div style={{ backgroundColor: '#DCFCE7', padding: '10px', borderRadius: '12px', color: '#16A34A' }}>
                  <ArrowUpRight size={20} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803D', margin: 0 }}>
                ${netProfit.toFixed(2)}
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#15803D', marginTop: '6px', fontWeight: 800 }}>
                Margen Comercial: {profitMarginPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Quick Action Alerts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Pending Payments Alert Box */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} color="#FF7A00" /> Pagos Pendientes de Aprobación ({pendingOrders.length})
                </h4>
                <button
                  onClick={() => setActiveTab('payments')}
                  style={{ background: 'none', border: 'none', color: '#0284C7', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer' }}
                >
                  Ver todos →
                </button>
              </div>

              {pendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '0.875rem' }}>
                  ✓ No hay pagos pendientes por verificar. Todas las órdenes están al día.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingOrders.slice(0, 3).map(order => (
                    <div key={order.id} style={{
                      backgroundColor: '#F8FAFC',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #E2E8F0'
                    }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem' }}>
                          Orden #{order.id} • {order.username}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Método: {order.payment_method.toUpperCase()} • Total: <strong>${order.total?.toFixed(2)}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => onValidateOrder(order.id)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                      >
                        Aprobar Pago
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alerts Box */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} color="#DC2626" /> Alertas de Reabastecimiento Crítico ({lowStockProducts.length})
                </h4>
                <button
                  onClick={() => setActiveTab('products')}
                  style={{ background: 'none', border: 'none', color: '#0284C7', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer' }}
                >
                  Ver inventario →
                </button>
              </div>

              {lowStockProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#16A34A', fontSize: '0.875rem', fontWeight: 700 }}>
                  ✓ Todos los productos cuentan con suficiente inventario disponible.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lowStockProducts.slice(0, 3).map(prod => (
                    <div key={prod.id} style={{
                      backgroundColor: '#FEF2F2',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #FECACA'
                    }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#991B1B', fontSize: '0.875rem' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>
                          Stock: <strong>{prod.stock} u.</strong> • Proveedor: {providers.find(p => p.id === prod.provider_id)?.name || 'Distribuidor Asignado'}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenRestockModal(prod)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                      >
                        Reabastecer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVENTORY & PRODUCTS CRUD (PREDETERMINED COST & STRICT PVP > COST) */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Catálogo e Inventario de Productos
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Precios fijados por proveedor con validación de rentabilidad (PVP &gt; Costo)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={onOpenProductModal}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PackagePlus size={16} /> Crear Producto
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', color: '#475569', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px' }}>PRODUCTO</th>
                  <th style={{ padding: '12px 14px' }}>CATEGORÍA / MASCOTA</th>
                  <th style={{ padding: '12px 14px' }}>PROVEEDOR ORIGEN</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>COSTO PROV. ($)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>PVP TIENDA ($)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>MARGEN (%)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>STOCK</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const prov = providers.find(pr => pr.id === p.provider_id);
                  const cost = parseFloat(p.cost_price);
                  const sale = parseFloat(p.sale_price);
                  const marginPct = sale > 0 ? (((sale - cost) / sale) * 100).toFixed(1) : 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>
                        <span style={{ backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {p.category}
                        </span>
                        <span style={{ marginLeft: '4px', fontSize: '0.75rem', color: '#94A3B8' }}>• {p.pet_type}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                        {prov ? prov.name : 'Distribuidor Asignado'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                        ${cost.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#16A34A' }}>
                        ${sale.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0369A1' }}>
                        {marginPct}%
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          color: p.stock <= 3 ? '#DC2626' : '#15803D',
                          backgroundColor: p.stock <= 3 ? '#FEE2E2' : '#DCFCE7',
                          padding: '3px 8px',
                          borderRadius: '8px'
                        }}>
                          {p.stock} u.
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => onOpenRestockModal(p)}
                            title="Reabastecer con proveedor"
                            style={{
                              backgroundColor: '#FFF2E8',
                              border: '1px solid #FFD4B2',
                              color: '#C2410C',
                              padding: '5px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RefreshCw size={13} /> +Stock
                          </button>
                          <button
                            onClick={() => onOpenEditProductModal(p)}
                            title="Editar producto"
                            style={{
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              padding: '5px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit2 size={13} /> Editar
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            title="Eliminar producto"
                            style={{
                              backgroundColor: '#FEE2E2',
                              border: '1px solid #FECACA',
                              color: '#DC2626',
                              padding: '5px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: INVENTORY PURCHASES & SUPPLIER EXPENSES (LIBRO CONTABLE DE COMPRAS) */}
      {/* ========================================================================= */}
      {activeTab === 'purchases' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={22} color="#DC2626" /> Registro Contable de Compras a Proveedores (Egresos)
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Historial cronológico de compras de mercadería, costos unitarios y egresos contables reales
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Buscar compra o producto..."
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={onOpenProductModal}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PackagePlus size={16} /> Comprar Inventario
              </button>
            </div>
          </div>

          {/* Purchases Summary Mini Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '20px'
          }}>
            <div style={{ backgroundColor: '#FEF2F2', padding: '14px 18px', borderRadius: '14px', border: '1px solid #FECACA' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#991B1B' }}>TOTAL INVERTIDO EN PROVEEDORES</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#DC2626', margin: '4px 0 0 0' }}>
                ${totalSupplierPurchases.toFixed(2)}
              </h4>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '14px 18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#475569' }}>TOTAL COMPRAS REGISTRADAS</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', margin: '4px 0 0 0' }}>
                {purchases.length} transacciones
              </h4>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', padding: '14px 18px', borderRadius: '14px', border: '1px solid #BFDBFE' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#1E40AF' }}>UNIDADES TOTALES ADQUIRIDAS</span>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563EB', margin: '4px 0 0 0' }}>
                {purchases.reduce((acc, p) => acc + (p.quantity || 0), 0)} unidades
              </h4>
            </div>
          </div>

          {/* Purchases Table */}
          {filteredPurchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px dashed #CBD5E1' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>No se encontraron registros de compras a proveedores con ese criterio.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', color: '#475569', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px' }}>FECHA ADQUISICIÓN</th>
                    <th style={{ padding: '12px 14px' }}>PRODUCTO</th>
                    <th style={{ padding: '12px 14px' }}>PROVEEDOR ORIGEN</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>CANTIDAD</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>COSTO UNITARIO ($)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>TOTAL EGRESO ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map(p => {
                    const purchaseDate = p.purchase_date ? new Date(p.purchase_date).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) : 'Reciente';
                    const prov = providers.find(pr => pr.id === p.provider_id);
                    const provName = p.provider_name || (prov ? prov.name : 'Distribuidor Asignado');

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '0.8rem' }}>
                          {purchaseDate}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>
                          {p.product_name}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} color="#FF7A00" /> {provName}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}>
                            +{p.quantity} u.
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>
                          ${parseFloat(p.unit_cost).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#DC2626' }}>
                          ${parseFloat(p.total_cost).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROVIDERS MODULE WITH SUPPLIED PRODUCTS & DEFAULT COSTS */}
      {/* ========================================================================= */}
      {activeTab === 'providers' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Proveedores y Catálogo de Distribución
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Precios de costo base predeterminados y líneas de productos abastecidas
              </p>
            </div>

            <button
              onClick={onOpenProvidersModal}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Building2 size={16} /> Administrar Proveedores
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
            {providers.map(prov => {
              const provProducts = products.filter(p => p.provider_id === prov.id);
              const defaultCost = prov.default_cost ? parseFloat(prov.default_cost).toFixed(2) : '10.00';

              return (
                <div key={prov.id} style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={18} color="#FF7A00" /> {prov.name}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                        Contacto: <strong>{prov.contact_name || 'No especificado'}</strong> • {prov.phone || 'Sin teléfono'}
                      </p>
                    </div>

                    <span style={{
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      Costo Base: ${defaultCost}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '12px' }}>
                    <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                      PRODUCTOS ABASTECIDOS ({provProducts.length}):
                    </div>

                    {provProducts.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>
                        Sin productos asignados todavía.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {provProducts.map(item => (
                          <div key={item.id} style={{
                            backgroundColor: '#FFFFFF',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.775rem'
                          }}>
                            <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.name}</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <span style={{ color: '#DC2626', fontWeight: 700 }}>Costo: ${parseFloat(item.cost_price).toFixed(2)}</span>
                              <span style={{ color: '#16A34A', fontWeight: 800 }}>PVP: ${parseFloat(item.sale_price).toFixed(2)}</span>
                              <span style={{ color: '#64748B', fontWeight: 700 }}>({item.stock} u.)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: USERS & ROLES MANAGEMENT (SIMPLIFIED CREATION + FULL EDITING) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Control de Usuarios y Roles (RBAC)
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Creación rápida de cuentas, edición completa de credenciales y permisos
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
            {/* Formulario Simplificado Crear Usuario (Req 3: Username + Password + Confirm) */}
            <div style={{
              backgroundColor: '#F8FAFC',
              padding: '24px',
              borderRadius: '18px',
              border: '1.5px solid #E2E8F0'
            }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#FF7A00" /> Crear Nueva Cuenta de Acceso
              </h4>

              {userErrorMsg && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={15} />
                  <span>{userErrorMsg}</span>
                </div>
              )}

              {userSuccessMsg && (
                <div style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#15803D',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={15} />
                  <span>✓ Usuario registrado exitosamente con rol asignado</span>
                </div>
              )}

              <form onSubmit={handleCreateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    NOMBRE DE USUARIO *
                  </label>
                  <input
                    type="text"
                    placeholder="ej: vendedor_quito"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    CONTRASEÑA *
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    CONFIRMAR CONTRASEÑA *
                  </label>
                  <input
                    type="password"
                    placeholder="Repite la contraseña"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    ROL DEL SISTEMA
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    <option value="vendedor">💼 Vendedor (Caja y Facturación)</option>
                    <option value="admin">🛡️ Administrador (Jefe General)</option>
                    <option value="cliente">🐾 Cliente (Compras y Billetera Privada)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '6px', padding: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <UserPlus size={17} /> Crear Usuario
                </button>
              </form>
            </div>

            {/* Lista y Edición de Usuarios (Req 4: Editar usuarios) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>
                  USUARIOS ACTIVOS ({users.length})
                </span>
                <input
                  type="text"
                  placeholder="Filtrar usuario..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', color: '#475569', borderBottom: '1.5px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px' }}>USUARIO</th>
                      <th style={{ padding: '10px 12px' }}>ROL</th>
                      <th style={{ padding: '10px 12px' }}>ESTADO</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>{u.username}</div>
                          <div style={{ fontSize: '0.725rem', color: '#94A3B8' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            backgroundColor: u.role === 'admin' ? '#DCFCE7' : u.role === 'vendedor' ? '#FFF7ED' : '#F1F5F9',
                            color: u.role === 'admin' ? '#15803D' : u.role === 'vendedor' ? '#C2410C' : '#475569',
                            textTransform: 'capitalize'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            color: u.is_active ? '#16A34A' : '#DC2626'
                          }}>
                            {u.is_active ? '● Activo' : '○ Inactivo'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              title="Editar usuario"
                              style={{
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Edit2 size={12} /> Editar
                            </button>
                            <button
                              onClick={() => onToggleUserStatus(u.id)}
                              title={u.is_active ? 'Bloquear usuario' : 'Activar usuario'}
                              style={{
                                background: u.is_active ? '#FEF2F2' : '#F0FDF4',
                                border: '1px solid #CBD5E1',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                color: u.is_active ? '#DC2626' : '#16A34A'
                              }}
                            >
                              {u.is_active ? 'Bloquear' : 'Activar'}
                            </button>
                            <button
                              onClick={() => onDeleteUser(u.id)}
                              title="Eliminar usuario"
                              style={{
                                background: '#FEE2E2',
                                border: 'none',
                                color: '#DC2626',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PAYMENT VALIDATION INBOX (INCOMING ORDERS & RECEIPTS) */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Bandeja de Validación de Pagos y Comprobantes
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Revisión ejecutiva de comprobantes de transferencia Banco Pichincha y pagos en efectivo
              </p>
            </div>
          </div>

          {pendingOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1.5px dashed #CBD5E1' }}>
              <CheckCircle2 size={42} color="#16A34A" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                ¡Bandeja al día!
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                No hay órdenes pendientes de validación en este momento.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pendingOrders.map(order => (
                <div key={order.id} style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1.5px solid #CBD5E1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>
                        Orden #{order.id}
                      </span>
                      <span style={{
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        Pendiente Validación
                      </span>
                      <span style={{
                        backgroundColor: '#E0F2FE',
                        color: '#0369A1',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {order.payment_method?.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: '4px 0' }}>
                      Cliente: <strong>{order.username}</strong> • Fecha: {new Date(order.created_at).toLocaleString('es-EC')}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Subtotal: ${order.subtotal?.toFixed(2)} + IVA ({order.iva_percentage || 15}%): ${order.iva_applied?.toFixed(2)} = <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>Total: ${order.total?.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => setViewProofOrder(order)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontWeight: 700,
                        fontSize: '0.825rem',
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Eye size={16} /> Ver Comprobante
                    </button>

                    <button
                      onClick={() => onValidateOrder(order.id)}
                      className="btn-primary"
                      style={{
                        padding: '10px 18px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} /> Aprobar y Emitir Factura
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: OFFICIAL ISSUED INVOICES WITH PDF DOWNLOAD */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Historial de Facturas Emitidas (Válidas con IVA Ecuador)
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Órdenes pagadas y validadas con acceso a comprobante oficial en PDF
              </p>
            </div>

            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Buscar por # o cliente..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', color: '#475569', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px' }}>N° FACTURA</th>
                  <th style={{ padding: '12px 14px' }}>CLIENTE</th>
                  <th style={{ padding: '12px 14px' }}>MÉTODO DE PAGO</th>
                  <th style={{ padding: '12px 14px' }}>FECHA EMISIÓN</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>SUBTOTAL</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>IVA ({ivaPercentage}%)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>TOTAL FACTURADO</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>FACTURA PDF</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>
                      COMP-{String(order.id).padStart(6, '0')}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>
                      {order.username}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {order.payment_method}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '0.8rem' }}>
                      {new Date(order.created_at).toLocaleString('es-EC')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#334155' }}>
                      ${order.subtotal?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748B' }}>
                      ${order.iva_applied?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#16A34A', fontSize: '0.95rem' }}>
                      ${order.total?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => onDownloadInvoice(order.id)}
                        className="btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.775rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: DYNAMIC IVA CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'config' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          maxWidth: '650px'
        }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={22} color="#FF7A00" /> Configuración de IVA Ecuador
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>
            Ajusta la tasa tributaria legal del IVA aplicable a todas las ventas en Ecuador.
          </p>

          <form onSubmit={handleIvaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                PORCENTAJE DE IVA (%) VIGENTE
              </label>
              <div style={{ position: 'relative', width: '180px' }}>
                <Percent size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newIva}
                  onChange={(e) => setNewIva(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '2px solid #FF7A00',
                    fontSize: '1.3rem',
                    fontWeight: 900,
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {ivaSuccessMsg && (
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#15803D',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={18} />
                <span>¡IVA actualizado correctamente en el sistema al {newIva}%!</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: 'fit-content', padding: '12px 24px', fontWeight: 800, fontSize: '0.9rem' }}
            >
              Guardar Tasa de IVA
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER (FULL USER EDITING REQUIREMENT 4) */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="#FF7A00" /> Editar Usuario: {editingUser.username}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {editErrorMsg && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.825rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={16} />
                <span>{editErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  NOMBRE DE USUARIO
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  NUEVA CONTRASEÑA (Dejar en blanco para mantener la actual)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  ROL ASIGNADO
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.875rem', fontWeight: 700 }}
                >
                  <option value="vendedor">💼 Vendedor</option>
                  <option value="admin">🛡️ Administrador</option>
                  <option value="cliente">🐾 Cliente</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="user_active_toggle"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="user_active_toggle" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  Cuenta de usuario habilitada / activa
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '10px', padding: '12px', fontWeight: 800 }}
              >
                Guardar Cambios de Usuario
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {viewProofOrder && (
        <ProofViewerModal
          isOpen={Boolean(viewProofOrder)}
          onClose={() => setViewProofOrder(null)}
          order={viewProofOrder}
          onValidateOrder={onValidateOrder}
        />
      )}
    </div>
  );
}
