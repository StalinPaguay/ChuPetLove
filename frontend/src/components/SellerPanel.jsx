import {
  CheckCircle2, Clock, Eye, AlertTriangle, FileText,
  Banknote, CreditCard, Download, Building2, Package,
  TrendingUp, ShoppingBag, ChevronDown, ChevronUp, Phone, Mail, MapPin
} from 'lucide-react';
import ProofViewerModal from './ProofViewerModal';

/**
 * SellerPanel - Panel Operativo del Vendedor (Cajero)
 * 
 * ISO 25010 - RBAC estricto:
 * ✅ Validar pagos pendientes (único permiso de escritura)
 * ✅ Ver inventario de productos y stock (Solo Lectura)
 * ✅ Ver alertas de stock bajo ≤ 3 unidades (Solo Lectura)
 * ✅ Ver proveedores y catálogos (Solo Lectura)
 * ✅ Ver historial de ventas realizadas (Solo Lectura)
 * ✅ Descargar facturas de órdenes pagadas
 * ❌ NO puede crear/editar/eliminar productos
 * ❌ NO puede crear/editar/eliminar proveedores
 * ❌ NO puede reabastecer stock
 */
export default function SellerPanel({
  orders = [],
  products = [],
  providers = [],
  onValidateOrder,
  lowStockProducts = [],
  onDownloadInvoice
}) {
  const [selectedProofOrder, setSelectedProofOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState('pagos'); // 'pagos' | 'inventario' | 'proveedores' | 'ventas'
  const [expandedProviderId, setExpandedProviderId] = useState(null);

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'ALL') return true;
    return order.payment_status === filterStatus;
  });

  const pendingCount = orders.filter(o => o.payment_status === 'pendiente_validacion').length;
  const paidOrders = orders.filter(o => o.payment_status === 'pagado');
  const totalSales = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0);

  const toggleProviderExpand = (id) => {
    setExpandedProviderId(prev => (prev === id ? null : id));
  };

  const tabs = [
    { id: 'pagos', label: 'Validación de Pagos', icon: <Clock size={16} />, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'inventario', label: 'Inventario', icon: <Package size={16} />, badge: null },
    { id: 'proveedores', label: 'Proveedores', icon: <Building2 size={16} />, badge: null },
    { id: 'ventas', label: 'Historial Ventas', icon: <TrendingUp size={16} />, badge: null }
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Clock color="#FF7A00" size={30} /> Panel de Vendedor y Caja
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Bandeja de verificación de pagos, consulta de inventario y proveedores • ChuPetLove Ecuador
          </p>
        </div>

        {/* Pending badge */}
        <div style={{
          backgroundColor: pendingCount > 0 ? '#FFF2E8' : '#E8F5E9',
          border: pendingCount > 0 ? '1.5px solid #FFD4B2' : '1.5px solid #A5D6A7',
          padding: '8px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={18} color={pendingCount > 0 ? '#FF7A00' : '#2E7D32'} />
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: pendingCount > 0 ? '#FF7A00' : '#2E7D32' }}>
            {pendingCount} pago(s) pendiente(s)
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '24px',
        borderBottom: '2px solid #F1F5F9',
        paddingBottom: '0'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px 10px 0 0',
              border: activeTab === tab.id ? '1.5px solid #FF7A00' : '1px solid transparent',
              borderBottom: activeTab === tab.id ? '2px solid #FF7A00' : '2px solid transparent',
              backgroundColor: activeTab === tab.id ? '#FFF2E8' : 'transparent',
              color: activeTab === tab.id ? '#FF7A00' : '#64748B',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span style={{
                backgroundColor: '#EF4444',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '9999px',
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. ALERTAS DE STOCK BAJO (siempre visible arriba si hay alertas) */}
      {lowStockProducts.length > 0 && (activeTab === 'pagos' || activeTab === 'inventario') && (
        <div style={{
          backgroundColor: '#FFF3E0',
          border: '2px solid #FFB74D',
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 8px 20px rgba(230, 81, 0, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} color="#E65100" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#E65100', margin: 0 }}>
                ¡ALERTA CRÍTICA DE STOCK! ({lowStockProducts.length} productos con stock ≤ 3 unidades)
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600 }}>
              Notifique al Administrador para reabastecer con proveedores
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {lowStockProducts.map(product => (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid #FFE0B2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', margin: 0 }}>{product.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>{product.pet_type} • {product.category}</p>
                  <span style={{
                    backgroundColor: product.stock === 0 ? '#FEE2E2' : '#FFE0B2',
                    color: product.stock === 0 ? '#DC2626' : '#E65100',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginTop: '4px'
                  }}>
                    {product.stock === 0 ? '🔴 AGOTADO' : `Quedan: ${product.stock} un.`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: VALIDACIÓN DE PAGOS */}
      {activeTab === 'pagos' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                Órdenes Registradas y Comprobantes
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Valida pagos bancarios y genera facturas digitales oficiales
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setFilterStatus('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: filterStatus === 'ALL' ? '1.5px solid #FF7A00' : '1px solid #E2E8F0',
                  backgroundColor: filterStatus === 'ALL' ? '#FFF2E8' : '#FFFFFF',
                  color: filterStatus === 'ALL' ? '#FF7A00' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Todas ({orders.length})
              </button>
              <button
                onClick={() => setFilterStatus('pendiente_validacion')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: filterStatus === 'pendiente_validacion' ? '1.5px solid #E65100' : '1px solid #E2E8F0',
                  backgroundColor: filterStatus === 'pendiente_validacion' ? '#FFF3E0' : '#FFFFFF',
                  color: filterStatus === 'pendiente_validacion' ? '#E65100' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Pendientes ({orders.filter(o => o.payment_status === 'pendiente_validacion').length})
              </button>
              <button
                onClick={() => setFilterStatus('pagado')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: filterStatus === 'pagado' ? '1.5px solid #2E7D32' : '1px solid #E2E8F0',
                  backgroundColor: filterStatus === 'pagado' ? '#E8F5E9' : '#FFFFFF',
                  color: filterStatus === 'pagado' ? '#2E7D32' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Pagadas ({orders.filter(o => o.payment_status === 'pagado').length})
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <FileText size={40} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
              <p style={{ fontWeight: 600 }}>No hay órdenes en este estado</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>ORDEN</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>CLIENTE</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>MÉTODO</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>TOTAL</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>ESTADO</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const isPaid = order.payment_status === 'pagado';
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px', fontWeight: 800, color: '#1E293B' }}>
                          #{order.id}
                        </td>
                        <td style={{ padding: '14px', color: '#334155' }}>
                          <div style={{ fontWeight: 700 }}>{order.username}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{new Date(order.created_at || '2026-10-13T12:00:00Z').toLocaleDateString('es-EC')}</div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            textTransform: 'capitalize',
                            fontWeight: 600,
                            color: '#475569'
                          }}>
                            {order.payment_method === 'tarjeta' && <CreditCard size={15} color="#2E7D32" />}
                            {order.payment_method === 'transferencia' && <Building2 size={15} color="#FF7A00" />}
                            {order.payment_method === 'efectivo' && <Banknote size={15} color="#0284C7" />}
                            {order.payment_method}
                          </span>
                        </td>
                        <td style={{ padding: '14px', fontWeight: 800, color: '#1E293B' }}>
                          ${order.total?.toFixed(2)}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            backgroundColor: isPaid ? '#DCFCE7' : '#FEF3C7',
                            color: isPaid ? '#15803D' : '#B45309',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isPaid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                            {isPaid ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setSelectedProofOrder(order)}
                              title="Ver Comprobante"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#475569',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={14} /> Ver
                            </button>

                            {!isPaid ? (
                              <button
                                onClick={() => onValidateOrder(order.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  backgroundColor: '#2E7D32',
                                  color: '#FFFFFF',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <CheckCircle2 size={14} /> Aprobar
                              </button>
                            ) : (
                              <button
                                onClick={() => onDownloadInvoice(order.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #FFD4B2',
                                  backgroundColor: '#FFF2E8',
                                  color: '#FF7A00',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Download size={14} /> PDF
                              </button>
                            )}
                          </div>
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

      {/* TAB: INVENTARIO (SOLO LECTURA) */}
      {activeTab === 'inventario' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={22} color="#FF7A00" /> Inventario de Productos
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Vista de consulta del catálogo y niveles de stock disponibles (Solo Lectura)
              </p>
            </div>
            <div style={{
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#0369A1'
            }}>
              {products.length} productos registrados
            </div>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <Package size={40} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
              <p style={{ fontWeight: 600 }}>No hay productos registrados</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>PRODUCTO</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>MASCOTA</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>CATEGORÍA</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>PVP</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const isLow = product.stock <= 3;
                    const isOut = product.stock === 0;
                    return (
                      <tr key={product.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isOut ? '#FEF2F2' : isLow ? '#FFFBEB' : 'transparent' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1E293B' }}>
                          {product.name}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {product.pet_type}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          <span style={{
                            backgroundColor: product.category === 'Alimentos' ? '#DCFCE7' : product.category === 'Accesorios' ? '#DBEAFE' : '#FEF3C7',
                            color: product.category === 'Alimentos' ? '#166534' : product.category === 'Accesorios' ? '#1D4ED8' : '#B45309',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {product.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#FF7A00' }}>
                          ${parseFloat(product.sale_price).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            backgroundColor: isOut ? '#FEE2E2' : isLow ? '#FEF3C7' : '#DCFCE7',
                            color: isOut ? '#DC2626' : isLow ? '#B45309' : '#15803D'
                          }}>
                            {isOut ? 'AGOTADO' : `${product.stock} un.`}
                          </span>
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

      {/* TAB: PROVEEDORES (SOLO LECTURA) */}
      {activeTab === 'proveedores' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={22} color="#FF7A00" /> Directorio de Proveedores
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Consulta de proveedores oficiales, contactos y catálogos de productos con costos base (Solo Lectura)
            </p>
          </div>

          {providers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <Building2 size={40} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
              <p style={{ fontWeight: 600 }}>No hay proveedores registrados</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {providers.map(p => {
                const offeredList = p.offered_products || [];
                const isExpanded = expandedProviderId === p.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '16px',
                      padding: '16px 18px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={17} color="#FF7A00" /> {p.name}
                          </h4>
                          <span style={{
                            backgroundColor: '#E0F2FE',
                            color: '#0369A1',
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            Costo Base: ${parseFloat(p.default_cost || 10).toFixed(2)}
                          </span>
                          <span style={{
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            {offeredList.length} producto(s) en catálogo
                          </span>
                        </div>

                        <p style={{ fontSize: '0.825rem', color: '#475569', margin: '4px 0 0 0' }}>
                          Contacto: <strong>{p.contact_name || 'No asignado'}</strong>
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.775rem', color: '#64748B', marginTop: '6px' }}>
                          {p.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {p.phone}</span>}
                          {p.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} /> {p.email}</span>}
                          {p.address && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {p.address}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Catálogo expandible */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                      <button
                        onClick={() => toggleProviderExpand(p.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#0284C7',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: 0
                        }}
                      >
                        <ShoppingBag size={15} />
                        <span>Catálogo de Productos ({offeredList.length})</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isExpanded && (
                        <div style={{ marginTop: '10px' }}>
                          {offeredList.length === 0 ? (
                            <p style={{ fontSize: '0.775rem', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>
                              No se han configurado productos para este proveedor.
                            </p>
                          ) : (
                            <div style={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '10px',
                              border: '1px solid #CBD5E1',
                              overflow: 'hidden'
                            }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.775rem' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#F1F5F9', color: '#475569', textAlign: 'left' }}>
                                    <th style={{ padding: '8px 12px' }}>Producto</th>
                                    <th style={{ padding: '8px 12px' }}>Mascota</th>
                                    <th style={{ padding: '8px 12px' }}>Categoría</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Costo Fijo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {offeredList.map((item, idx) => (
                                    <tr key={item.id || idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1E293B' }}>{item.name}</td>
                                      <td style={{ padding: '8px 12px', color: '#64748B' }}>{item.pet_type}</td>
                                      <td style={{ padding: '8px 12px', color: '#64748B' }}>{item.category}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#B91C1C' }}>
                                        ${parseFloat(item.cost_price).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: HISTORIAL DE VENTAS (SOLO LECTURA) */}
      {activeTab === 'ventas' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={22} color="#2E7D32" /> Historial de Ventas Realizadas
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Registro de ventas con pagos aprobados (Solo Lectura)
              </p>
            </div>

            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              padding: '8px 16px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={16} color="#16A34A" />
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#166534' }}>
                Total Vendido: ${totalSales.toFixed(2)} ({paidOrders.length} ventas)
              </span>
            </div>
          </div>

          {paidOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <ShoppingBag size={40} style={{ margin: '0 auto 8px', color: '#94A3B8' }} />
              <p style={{ fontWeight: 600 }}>No hay ventas registradas aún</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>ORDEN</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>CLIENTE</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>FECHA</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>MÉTODO</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>TOTAL</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>FACTURA</th>
                  </tr>
                </thead>
                <tbody>
                  {paidOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1E293B' }}>#{order.id}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#334155' }}>{order.username}</td>
                      <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '0.8rem' }}>
                        {new Date(order.created_at || '2026-10-13T12:00:00Z').toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize', fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>
                          {order.payment_method === 'tarjeta' && <CreditCard size={14} color="#2E7D32" />}
                          {order.payment_method === 'transferencia' && <Building2 size={14} color="#FF7A00" />}
                          {order.payment_method === 'efectivo' && <Banknote size={14} color="#0284C7" />}
                          {order.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#16A34A' }}>${order.total?.toFixed(2)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => onDownloadInvoice(order.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid #FFD4B2',
                            backgroundColor: '#FFF2E8',
                            color: '#FF7A00',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Download size={13} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Comprobante */}
      {selectedProofOrder && (
        <ProofViewerModal
          isOpen={Boolean(selectedProofOrder)}
          onClose={() => setSelectedProofOrder(null)}
          order={selectedProofOrder}
          onValidatePayment={onValidateOrder}
          onDownloadInvoice={onDownloadInvoice}
        />
      )}
    </div>
  );
}
