import React from 'react';
import { X, ShoppingBag, Clock, CheckCircle2, Download, Lock, Sparkles } from 'lucide-react';

export default function ClientOrdersModal({
  isOpen,
  onClose,
  orders = [],
  currentUser,
  onDownloadInvoice,
  ivaPercentage = 15.00
}) {
  if (!isOpen) return null;

  // Filtrar órdenes del cliente actual
  const clientOrders = orders.filter(o => o.username === currentUser?.username || o.user_id === currentUser?.id);
  const paidOrders = clientOrders.filter(o => o.payment_status === 'pagado');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="client-orders-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '780px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
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
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B'
          }}
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            backgroundColor: '#FFF2E8',
            color: '#FF7A00',
            padding: '12px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingBag size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              Historial de Compras y Facturas Oficiales
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Autogestión de compras, estados de validación y descarga de facturas en PDF • ChuPetLove
            </p>
          </div>
        </div>

        {/* 1. NOTIFICACIÓN VISUAL DESTACADA DE PAGO VALIDADO (ISO 25010 Usability & Feedback) */}
        {paidOrders.length > 0 && (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: '#DCFCE7', padding: '8px', borderRadius: '10px', color: '#16A34A' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                  ¡Tu pago ha sido validado! Ya puedes descargar tu factura oficial en PDF 🎉
                </h4>
                <p style={{ fontSize: '0.775rem', color: '#15803D', margin: '2px 0 0 0' }}>
                  Tienes {paidOrders.length} factura(s) digital(es) oficial(es) lista(s) para descargar en formato PDF.
                </p>
              </div>
            </div>

            <button
              onClick={() => onDownloadInvoice(paidOrders[0].id)}
              className="btn-primary"
              style={{ padding: '7px 14px', fontSize: '0.8rem', backgroundColor: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={15} /> Descargar Factura Reciente
            </button>
          </div>
        )}

        {/* 2. LISTADO DE ÓRDENES DEL CLIENTE */}
        {clientOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            border: '1.5px dashed #CBD5E1'
          }}>
            <ShoppingBag size={48} color="#94A3B8" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', margin: 0 }}>
              Aún no has realizado compras
            </h4>
            <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '4px' }}>
              Explora nuestro catálogo con alimentos de marcas ecuatorianas, accesorios y juguetes para tus mascotas.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {clientOrders.map(order => {
              const isPaid = order.payment_status === 'pagado';
              const formattedDate = new Date(order.created_at || '2026-10-13T12:00:00Z').toLocaleDateString('es-EC', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: isPaid ? '1.5px solid #BBF7D0' : '1.5px solid #FED7AA',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Top Bar de la Orden */}
                  <div style={{
                    backgroundColor: isPaid ? '#F0FDF4' : '#FFF7ED',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: isPaid ? '1px solid #DCFCE7' : '1px solid #FFEDD5',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0F172A' }}>
                        ORDEN #{order.id}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        • {formattedDate}
                      </span>
                    </div>

                    {/* Badge de Estado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isPaid ? (
                        <span style={{
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={13} /> Pago Aprobado & Validado
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={13} /> Pendiente de Validación
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo de la Orden (Detalle de Productos y Pagos) */}
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                        Productos Comprados:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {order.items && order.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#334155' }}>
                            <span>
                              <strong>{item.quantity}x</strong> {item.product_name || `Producto #${item.product_id || item.id}`}
                            </span>
                            <span style={{ fontWeight: 700 }}>
                              ${((item.unit_price || item.sale_price || 0) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Desglose Financiero */}
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '0.8rem',
                      color: '#64748B'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal:</span>
                        <span style={{ fontWeight: 700, color: '#334155' }}>${(order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>IVA Aplicado ({order.iva_percentage || ivaPercentage}%):</span>
                        <span style={{ fontWeight: 700, color: '#16A34A' }}>+${(order.iva_applied || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', borderTop: '1px dashed #CBD5E1', paddingTop: '4px', marginTop: '2px' }}>
                        <span>Total Pagado:</span>
                        <span style={{ color: '#FF7A00' }}>${(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Barra de Acciones y Descarga de Factura */}
                    <div style={{
                      marginTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: '#64748B' }}>
                        <span>Método: </span>
                        <span style={{ fontWeight: 700, color: '#1E293B', textTransform: 'capitalize' }}>
                          {order.payment_method === 'tarjeta' ? '💳 Tarjeta Banco Pichincha' : order.payment_method === 'efectivo' ? '💵 Efectivo contra entrega' : '🏦 Transferencia'}
                        </span>
                      </div>

                      {isPaid ? (
                        <button
                          onClick={() => onDownloadInvoice(order.id)}
                          className="btn-primary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.825rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#FF7A00'
                          }}
                        >
                          <Download size={15} /> Descargar Factura Oficial (PDF)
                        </button>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#F1F5F9',
                          color: '#64748B',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '0.775rem',
                          fontWeight: 700
                        }}>
                          <Lock size={14} color="#94A3B8" />
                          <span>Factura Bloqueada (Pendiente de Validación por Caja)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
