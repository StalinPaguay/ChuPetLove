import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#16A34A" />;
      case 'error':
        return <XCircle size={18} color="#DC2626" />;
      case 'warning':
        return <AlertTriangle size={18} color="#D97706" />;
      default:
        return <Info size={18} color="#2563EB" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'success':
        return '#F0FDF4';
      case 'error':
        return '#FEF2F2';
      case 'warning':
        return '#FFFBEB';
      default:
        return '#EFF6FF';
    }
  };

  const getBorder = (type) => {
    switch (type) {
      case 'success':
        return '#BBF7D0';
      case 'error':
        return '#FECACA';
      case 'warning':
        return '#FDE68A';
      default:
        return '#BFDBFE';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px',
      width: 'calc(100% - 48px)'
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            backgroundColor: getBg(toast.type),
            border: `1px solid ${getBorder(toast.type)}`,
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'slideUp 0.25s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {getIcon(toast.type)}
            <div>
              {toast.title && (
                <h5 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                  {toast.title}
                </h5>
              )}
              <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>
                {toast.message}
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(toast.id)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
