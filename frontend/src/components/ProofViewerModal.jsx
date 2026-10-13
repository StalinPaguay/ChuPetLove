import React from 'react';
import { X, CheckCircle2, FileText, Download, ExternalLink } from 'lucide-react';

export default function ProofViewerModal({
  isOpen,
  onClose,
  order,
  onValidatePayment,
  onDownloadInvoice
}) {
  if (!isOpen || !order) return null;

  const isPaid = order.payment_status === 'pagado';
  const proofUrl = order.payment_proof_image
    ? (order.payment_proof_image.startsWith('http') || order.payment_proof_image.startsWith('data:')
        ? order.payment_proof_image
        : `http://localhost:8000/uploads/proofs/${order.payment_proof_image}`)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="proof-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
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

        <div style={{ marginBottom: '20px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: isPaid ? '#DCFCE7' : '#FEF3C7',
            color: isPaid ? '#15803D' : '#B45309',
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            {isPaid ? 'PAGO VERIFICADO Y PAGADO' : 'PENDIENTE DE VALIDACIÓN'}
          </span>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
            Comprobante de Orden #{order.id}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0 0' }}>
            Cliente: <strong>{order.username}</strong> • Total: <strong style={{ color: '#FF7A00' }}>${order.total?.toFixed(2)}</strong>
          </p>
        </div>

        {/* Visualización del comprobante */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderRadius: '16px',
          border: '1.5px dashed #CBD5E1',
          padding: '16px',
          textAlign: 'center',
          marginBottom: '20px',
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {proofUrl ? (
            <div>
              <img
                src={proofUrl}
                alt="Comprobante de Pago"
                style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `<div style="padding:20px; color:#64748B;"><p>📄 Comprobante registrado:</p><strong>${order.payment_proof_image}</strong></div>`;
                }}
              />
            </div>
          ) : (
            <div style={{ color: '#94A3B8' }}>
              <FileText size={48} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>
                {order.payment_method === 'efectivo'
                  ? 'Pago en Efectivo (Contra Entrega - Sin Comprobante Digital)'
                  : 'No se adjuntó imagen de comprobante'}
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isPaid && onValidatePayment && (
            <button
              onClick={() => {
                onValidatePayment(order.id);
                onClose();
              }}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={18} /> Validar y Aprobar Pago
            </button>
          )}

          {isPaid && onDownloadInvoice && (
            <button
              onClick={() => onDownloadInvoice(order.id)}
              className="btn-primary"
              style={{ flex: 1, padding: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Download size={18} /> Descargar Factura PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
