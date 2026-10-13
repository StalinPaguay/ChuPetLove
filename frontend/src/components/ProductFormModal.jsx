import React, { useState, useEffect } from 'react';
import {
  X, PackagePlus, RefreshCw, AlertCircle, Save, Building2,
  DollarSign, ShoppingBag, AlertTriangle
} from 'lucide-react';

export default function ProductFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'restock' | 'edit'
  product = null,
  providers = [],
  onSubmit
}) {
  const [formData, setFormData] = useState({
    provider_id: providers.length > 0 ? providers[0].id : 1,
    provider_product_id: null,
    name: '',
    category: 'Alimentos',
    pet_type: 'Perros',
    cost_price: 10.0,
    sale_price: 15.0,
    stock: 10
  });

  const [restockQty, setRestockQty] = useState(10);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Provider & its Catalog
  const currentProvider = providers.find(p => p.id === formData.provider_id) || providers[0] || null;
  const offeredProducts = currentProvider?.offered_products || [];

  // Initialize or synchronize form state
  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        provider_id: product.provider_id || (providers[0]?.id || 1),
        provider_product_id: product.provider_product_id || null,
        name: product.name || '',
        category: product.category || 'Alimentos',
        pet_type: product.pet_type || 'Perros',
        cost_price: product.cost_price ? parseFloat(product.cost_price) : 10.0,
        sale_price: product.sale_price ? parseFloat(product.sale_price) : 0,
        stock: product.stock || 0
      });
    } else if (mode === 'create') {
      const defaultProv = providers[0] || null;
      const catalog = defaultProv?.offered_products || [];
      const firstItem = catalog.length > 0 ? catalog[0] : null;

      const initialCost = firstItem
        ? parseFloat(firstItem.cost_price)
        : (defaultProv?.default_cost ? parseFloat(defaultProv.default_cost) : 10.0);

      setFormData({
        provider_id: defaultProv ? defaultProv.id : 1,
        provider_product_id: firstItem ? firstItem.id : null,
        name: firstItem ? firstItem.name : '',
        category: firstItem ? firstItem.category : 'Alimentos',
        pet_type: firstItem ? firstItem.pet_type : 'Perros',
        cost_price: initialCost,
        sale_price: Number((initialCost * 1.35).toFixed(2)),
        stock: 10
      });
    }
  }, [product, mode, providers, isOpen]);

  // Manejar cambio de proveedor: seleccionar primer producto de su catálogo
  const handleProviderChange = (e) => {
    const provId = parseInt(e.target.value, 10);
    const selectedProv = providers.find(p => p.id === provId);
    const catalog = selectedProv?.offered_products || [];
    const firstItem = catalog.length > 0 ? catalog[0] : null;

    const newCost = firstItem
      ? parseFloat(firstItem.cost_price)
      : (selectedProv?.default_cost ? parseFloat(selectedProv.default_cost) : 10.0);

    setFormData(prev => ({
      ...prev,
      provider_id: provId,
      provider_product_id: firstItem ? firstItem.id : null,
      name: firstItem ? firstItem.name : '',
      category: firstItem ? firstItem.category : 'Alimentos',
      pet_type: firstItem ? firstItem.pet_type : 'Perros',
      cost_price: newCost,
      sale_price: Number((newCost * 1.35).toFixed(2))
    }));
  };

  // Manejar selección del producto ofrecido por el proveedor
  const handleProductSelectChange = (e) => {
    const selectedVal = e.target.value;
    if (!selectedVal) return;

    // Buscar en el catálogo del proveedor
    const selectedItem = offeredProducts.find(item => String(item.id) === selectedVal || item.name === selectedVal);
    if (selectedItem) {
      const itemCost = parseFloat(selectedItem.cost_price || currentProvider?.default_cost || 10.0);
      setFormData(prev => ({
        ...prev,
        provider_product_id: selectedItem.id || null,
        name: selectedItem.name,
        category: selectedItem.category || prev.category,
        pet_type: selectedItem.pet_type || prev.pet_type,
        cost_price: itemCost,
        sale_price: Number((itemCost * 1.35).toFixed(2))
      }));
    }
  };

  if (!isOpen) return null;

  const profit = Number((formData.sale_price - formData.cost_price).toFixed(2));
  const profitMarginPercent = formData.sale_price > 0
    ? Number(((profit / formData.sale_price) * 100).toFixed(1))
    : 0;
  const isLoss = formData.sale_price <= formData.cost_price;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    setLoading(true);
    try {
      if (mode === 'restock') {
        if (restockQty <= 0) {
          setErrorMsg('La cantidad a reabastecer debe ser mayor a 0');
          setLoading(false);
          return;
        }
        await onSubmit(product.id, parseInt(restockQty, 10));
      } else {
        if (!formData.name.trim()) {
          setErrorMsg('Debes seleccionar un producto del catálogo del proveedor.');
          setLoading(false);
          return;
        }
        if (formData.sale_price <= formData.cost_price) {
          setErrorMsg(`El PVP ($${formData.sale_price.toFixed(2)}) debe ser estrictamente mayor al costo del proveedor ($${formData.cost_price.toFixed(2)}) para garantizar rentabilidad.`);
          setLoading(false);
          return;
        }
        if (formData.stock < 0) {
          setErrorMsg('La cantidad de stock inicial no puede ser negativa.');
          setLoading(false);
          return;
        }
        await onSubmit(formData, mode === 'edit' ? product.id : null);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="product-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '580px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            backgroundColor: mode === 'restock' ? '#FFF2E8' : '#0F172A',
            color: mode === 'restock' ? '#FF7A00' : '#10B981',
            padding: '12px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {mode === 'restock' ? <RefreshCw size={26} /> : <PackagePlus size={26} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {mode === 'restock' ? `Reabastecer ${product?.name}` : mode === 'edit' ? 'Editar Producto' : 'Comprar / Registrar Inventario'}
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
              {mode === 'restock'
                ? 'Recepción de mercadería de proveedor con registro contable de compra'
                : 'Selección de producto del proveedor con autocompletado de costo y registro de egreso'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            color: '#B91C1C',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'restock' ? (
            <div>
              <div style={{
                backgroundColor: '#F8FAFC',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0 }}>
                  Stock actual en tienda: <strong style={{ color: product?.stock <= 3 ? '#DC2626' : '#0F172A' }}>{product?.stock} unidades</strong>
                </p>
                <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: '6px' }}>
                  Proveedor de origen: <strong>{providers.find(p => p.id === product?.provider_id)?.name || 'Distribuidor Asignado'}</strong>
                </p>
                <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: '6px' }}>
                  Costo de Reabastecimiento: <strong>${parseFloat(product?.cost_price || 0).toFixed(2)} / unidad</strong>
                </p>
              </div>

              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                CANTIDAD A REABASTECER (+ UNIDADES A COMPRAR)
              </label>
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '2px solid #FF7A00',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#FF7A00',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{
                marginTop: '12px',
                backgroundColor: '#EFF6FF',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #BFDBFE',
                fontSize: '0.8rem',
                color: '#1E40AF'
              }}>
                <strong>Impacto Financiero:</strong> Se registrará un egreso por compra a proveedor de{' '}
                <strong>${((parseFloat(product?.cost_price || 0)) * (parseInt(restockQty, 10) || 0)).toFixed(2)}</strong> en el libro contable de compras.
              </div>
            </div>
          ) : (
            <>
              {/* 1. SELECCIÓN DE PROVEEDOR */}
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Building2 size={15} color="#FF7A00" /> 1. PROVEEDOR DISTRIBUIDOR *
                </label>
                <select
                  value={formData.provider_id}
                  onChange={handleProviderChange}
                  disabled={mode === 'edit'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    backgroundColor: mode === 'edit' ? '#F1F5F9' : '#F8FAFC'
                  }}
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.offered_products?.length || 0} productos ofrecidos)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. SELECCIÓN DE PRODUCTO DEL CATÁLOGO DEL PROVEEDOR (REGLA 2: SELECT DE PRODUCTO PREDETERMINADO) */}
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShoppingBag size={15} color="#2563EB" /> 2. PRODUCTO OFRECIDO POR EL PROVEEDOR (SELECT PREDEFINIDO) *
                </label>

                {mode === 'edit' ? (
                  <input
                    type="text"
                    disabled
                    value={formData.name}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.875rem',
                      backgroundColor: '#F1F5F9',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                ) : (
                  <div>
                    {offeredProducts.length > 0 ? (
                      <select
                        value={formData.provider_product_id || formData.name}
                        onChange={handleProductSelectChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '2px solid #2563EB',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: '#1E293B',
                          backgroundColor: '#EFF6FF'
                        }}
                      >
                        {offeredProducts.map((item, idx) => (
                          <option key={item.id || idx} value={item.id || item.name}>
                            {item.name} — {item.category} / {item.pet_type} (Costo Fijo: ${parseFloat(item.cost_price).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{
                        padding: '10px 12px',
                        backgroundColor: '#FFFBEB',
                        borderRadius: '10px',
                        border: '1px solid #FCD34D',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <AlertTriangle size={16} color="#D97706" />
                        <span style={{ fontSize: '0.8rem', color: '#92400E' }}>
                          Este proveedor no tiene catálogo precargado. Puedes escribir el nombre o gestionarlo en "Proveedores".
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Categoría y Tipo de Mascota (Auto-configuradas desde el catálogo del proveedor) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    TIPO DE MASCOTA
                  </label>
                  <select
                    value={formData.pet_type}
                    onChange={(e) => setFormData({ ...formData, pet_type: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                  >
                    <option value="Perros">Perros 🐕</option>
                    <option value="Gatos">Gatos 🐈</option>
                    <option value="Hamsters">Hámsters 🐹</option>
                    <option value="Conejos">Conejos 🐇</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    CATEGORÍA
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                  >
                    <option value="Alimentos">Alimentos 🍖</option>
                    <option value="Accesorios">Accesorios 🦺</option>
                    <option value="Juguetes">Juguetes 🎾</option>
                  </select>
                </div>
              </div>

              {/* Precios: Costo de Proveedor (Autocompletado) y PVP Tienda */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    COSTO DE PROVEEDOR ($) <span style={{ color: '#059669', fontSize: '0.7rem' }}>(Autocompletado)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.cost_price}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          cost_price: val,
                          sale_price: prev.sale_price <= val ? Number((val * 1.35).toFixed(2)) : prev.sale_price
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 10px 10px 28px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        backgroundColor: '#F8FAFC',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    PVP DE VENTA AL PÚBLICO ($) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#16A34A' }} />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '10px 10px 10px 28px',
                        borderRadius: '10px',
                        border: isLoss ? '2px solid #EF4444' : '1.5px solid #16A34A',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: isLoss ? '#DC2626' : '#15803D',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Rentabilidad y Stock inicial */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.775rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    CANTIDAD A COMPRAR / STOCK *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{
                  backgroundColor: isLoss ? '#FEF2F2' : '#F0FDF4',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  border: isLoss ? '1px solid #FECACA' : '1px solid #BBF7D0',
                  marginTop: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: 700, color: isLoss ? '#DC2626' : '#166534' }}>
                      {isLoss ? '⚠️ PÉRDIDA' : 'MARGEN BENEFICIO:'}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isLoss ? '#DC2626' : '#15803D' }}>
                      +${profit.toFixed(2)} ({profitMarginPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {mode === 'create' && (
                <div style={{
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.775rem',
                  color: '#475569'
                }}>
                  📦 <strong>Contabilidad de Inventario:</strong> Al registrar este producto, se comprarán{' '}
                  <strong>{formData.stock} unidades</strong> a <strong>${formData.cost_price.toFixed(2)}</strong> c/u, registrando un egreso contable de{' '}
                  <strong>${(formData.stock * formData.cost_price).toFixed(2)}</strong> a favor del proveedor.
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading || isLoss}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontWeight: 800,
              marginTop: '4px',
              opacity: isLoss ? 0.6 : 1,
              cursor: isLoss ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Procesando...' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Save size={18} />
                {mode === 'restock' ? 'Confirmar Compra y Reabastecer' : mode === 'edit' ? 'Guardar Cambios' : 'Comprar Producto y Agregar al Inventario'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
