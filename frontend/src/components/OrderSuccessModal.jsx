import React from 'react';
import {
  Clock, Download, X, ShoppingBag, CreditCard, Banknote, Building2,
  Lock, AlertTriangle, CheckCircle2, ShieldAlert
} from 'lucide-react';

export default function OrderSuccessModal({ orderData, onClose, onDownloadInvoice }) {
  if (!orderData) return null;

  const isPaid = orderData.payment_status === 'pagado';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="order-success-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '540px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          textAlign: 'center'
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

        {/* Status Icon Header */}
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          backgroundColor: isPaid ? '#DCFCE7' : '#FFF2E8',
          color: isPaid ? '#16A34A' : '#EA580C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: isPaid ? '0 8px 16px rgba(22, 163, 74, 0.2)' : '0 8px 16px rgba(234, 88, 12, 0.2)'
        }}>
          {isPaid ? <CheckCircle2 size={38} /> : <Clock size={38} />}
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '6px' }}>
          {isPaid ? '¡Pago Aprobado y Factura Emitida!' : 'Pedido Registrado — Pendiente de Validación'}
        </h3>
        
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '18px', lineHeight: 1.4 }}>
          {isPaid
            ? `Tu orden #${orderData.id} ha sido verificada y el pago está asentado.`
            : `Orden #${orderData.id} recibida. Tu comprobante y datos de transacción están en proceso de verificación por el equipo de ChuPetLove.`}
        </p>

        {/* Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isPaid ? '#DCFCE7' : '#FEF3C7',
          color: isPaid ? '#15803D' : '#92400E',
          border: isPaid ? '1px solid #86EFAC' : '1px solid #FCD34D',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 800,
          marginBottom: '20px'
        }}>
          {isPaid ? <CheckCircle2 size={15} /> : <Clock size={15} />}
          <span>
            {isPaid ? 'ESTADO: PAGO VALIDADO / FACTURADO' : 'ESTADO: PENDIENTE DE VALIDACIÓN POR EL COMERCIO'}
          </span>
        </div>

        {/* Order Details Summary */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderRadius: '16px',
          padding: '16px 20px',
          textAlign: 'left',
          marginBottom: '18px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '6px' }}>
            <span style={{ color: '#64748B' }}>Número de Orden:</span>
            <strong style={{ color: '#0F172A' }}>#{orderData.id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '6px' }}>
            <span style={{ color: '#64748B' }}>Método de Pago:</span>
            <strong style={{ textTransform: 'capitalize', color: '#0F172A' }}>{orderData.payment_method}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '6px' }}>
            <span style={{ color: '#64748B' }}>Subtotal:</span>
            <span>${orderData.subtotal?.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '6px' }}>
            <span style={{ color: '#64748B' }}>IVA {orderData.iva_percentage || 15}% Ecuador:</span>
            <span>${orderData.iva_applied?.toFixed(2)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.15rem',
            fontWeight: 900,
            paddingTop: '8px',
            borderTop: '1px dashed #CBD5E1',
            color: '#0F172A'
          }}>
            <span>Total:</span>
            <span style={{ color: '#FF7A00' }}>${orderData.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Invoice Status Banner */}
        {!isPaid ? (
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1.5px solid #BFDBFE',
            borderRadius: '12px',
            padding: '12px 14px',
            textAlign: 'left',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <Lock size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.775rem', color: '#1E40AF', lineHeight: 1.4 }}>
              <strong>Factura Digital Bloqueada Temporalmente:</strong>
              <p style={{ margin: '3px 0 0 0' }}>
                Conforme a la normativa del sistema y validación tributaria, la factura oficial en PDF se generará y habilitará para descarga <strong>únicamente después de que el Administrador o Vendedor apruebe tu pago</strong> desde su panel de control.
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            borderRadius: '12px',
            padding: '12px 14px',
            textAlign: 'left',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.775rem', color: '#166534' }}>
              <strong>Factura Disponible:</strong> Tu pago ha sido aprobado. Puedes descargar tu comprobante fiscal en PDF inmediatamente.
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {isPaid && onDownloadInvoice ? (
            <button
              onClick={() => onDownloadInvoice(orderData.id)}
              className="btn-primary"
              style={{ flex: 1, padding: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Download size={16} /> Descargar Factura PDF
            </button>
          ) : (
            <button
              disabled
              style={{
                flex: 1,
                padding: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                backgroundColor: '#F1F5F9',
                color: '#94A3B8',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                cursor: 'not-allowed',
                fontSize: '0.825rem'
              }}
              title="Disponible solo cuando el estado sea 'pagado'"
            >
              <Lock size={15} /> Factura Bloqueada (Pendiente)
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, padding: '12px', fontWeight: 800 }}
          >
            Seguir Comprando
          </button>
        </div>
      </div>
    </div>
  );
}
