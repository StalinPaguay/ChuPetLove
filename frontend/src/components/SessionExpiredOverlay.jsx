/**
 * SessionExpiredOverlay.jsx
 *
 * Alerta visual elegante que se muestra cuando la sesión expira por inactividad.
 * Se superpone a toda la pantalla con un backdrop, animación de entrada y
 * el mensaje exacto requerido.
 *
 * Props:
 *   visible  {boolean}  - Controla si el overlay está visible.
 *   onClose  {Function} - Callback al cerrar/confirmar el overlay.
 */

import React, { useEffect, useState } from 'react';
import { Clock, LogIn, ShieldAlert } from 'lucide-react';

export default function SessionExpiredOverlay({ visible, onClose }) {
  const [show, setShow] = useState(false);

  // Animación de entrada con un pequeño delay para CSS transition
  useEffect(() => {
    if (visible) {
      // pequeño timeout para que el browser pinte primero opacity:0 y luego la transición
      const t = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(t);
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-desc"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        // Backdrop
        backgroundColor: show ? 'rgba(15, 23, 42, 0.75)' : 'rgba(15, 23, 42, 0)',
        backdropFilter: show ? 'blur(6px)' : 'blur(0px)',
        transition: 'background-color 0.35s ease, backdrop-filter 0.35s ease',
      }}
    >
      {/* Card */}
      <div
        style={{
          background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF7ED 100%)',
          borderRadius: '24px',
          padding: '44px 40px 36px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 32px 80px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,122,0,0.12)',
          textAlign: 'center',
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(32px)',
          opacity: show ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow top */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,122,0,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Icono principal animado */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF7A00 0%, #EA580C 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 12px 30px rgba(255,122,0,0.40)',
          animation: 'pulse-icon 2.4s ease-in-out infinite',
        }}>
          <Clock size={36} color="white" strokeWidth={2.5} />
        </div>

        {/* Título */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}>
          <ShieldAlert size={18} color="#DC2626" />
          <h2
            id="session-expired-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#1E293B',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Sesión Expirada
          </h2>
        </div>

        {/* Mensaje exacto requerido */}
        <p
          id="session-expired-desc"
          style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: '#EA580C',
            margin: '0 0 8px 0',
            lineHeight: 1.45,
          }}
        >
          Tu tiempo de uso del sistema ha expirado, vuelve a iniciar sesión
        </p>

        <p style={{
          fontSize: '0.85rem',
          color: '#64748B',
          margin: '0 0 32px 0',
          lineHeight: 1.5,
        }}>
          Por seguridad, tu sesión se cierra automáticamente tras 10 minutos de inactividad (ISO/IEC 25010).
        </p>

        {/* Separador decorativo */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,122,0,0.3), transparent)',
          marginBottom: '28px',
        }} />

        {/* Botón CTA */}
        <button
          id="session-expired-login-btn"
          onClick={onClose}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 36px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #FF7A00 0%, #EA580C 100%)',
            color: 'white',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(255,122,0,0.38)',
            letterSpacing: '-0.01em',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            width: '100%',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,122,0,0.48)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,122,0,0.38)';
          }}
        >
          <LogIn size={20} />
          Volver a Iniciar Sesión
        </button>

        {/* Marca de seguridad */}
        <p style={{
          fontSize: '0.75rem',
          color: '#94A3B8',
          marginTop: '18px',
          marginBottom: 0,
        }}>
          🔒 ChuPetLove · Seguridad ISO/IEC 25010
        </p>

        {/* CSS animation keyframes inline */}
        <style>{`
          @keyframes pulse-icon {
            0%, 100% { box-shadow: 0 12px 30px rgba(255,122,0,0.40); transform: scale(1); }
            50%       { box-shadow: 0 16px 40px rgba(255,122,0,0.60); transform: scale(1.07); }
          }
        `}</style>
      </div>
    </div>
  );
}
