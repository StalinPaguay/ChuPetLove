import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, Mail, User, ShieldCheck, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { validateEcuadorianId } from '../utils/ecuadorValidation';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
  showToast
}) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Login form
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // Register form
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!loginData.username || !loginData.password) {
      setErrorMessage('Por favor ingrese usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      await onLoginSuccess(loginData.username, loginData.password);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error al iniciar sesión. Verifique credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regData.username || !regData.email || !regData.password) {
      setErrorMessage('Todos los campos son obligatorios');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    if (regData.password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await onRegisterSuccess({
        username: regData.username,
        email: regData.email,
        password: regData.password
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error al registrar cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user, pass) => {
    setLoginData({ username: user, password: pass });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '460px',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Close button */}
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

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #FF7A00 0%, #2E7D32 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            margin: '0 auto 12px',
            boxShadow: '0 6px 16px rgba(255, 122, 0, 0.3)'
          }}>
            <Sparkles size={28} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E293B' }}>
            ChuPet<span style={{ color: '#FF7A00' }}>Love</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
            Accede a tu cuenta o regístrate como Cliente
          </p>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F1F5F9',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => { setTab('login'); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: tab === 'login' ? '#FFFFFF' : 'transparent',
              color: tab === 'login' ? '#FF7A00' : '#64748B',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: tab === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setTab('register'); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: tab === 'register' ? '#FFFFFF' : 'transparent',
              color: tab === 'register' ? '#2E7D32' : '#64748B',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: tab === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Crear Cuenta Cliente
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Usuario o Correo
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="ej: maria_ecuador o admin_master"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '6px' }}
            >
              {loading ? 'Validando con Servidor...' : <><LogIn size={18} /> Iniciar Sesión</>}
            </button>

            {/* Cuentas Demo Rápidas */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
                ⚡ ACCESO RÁPIDO DEMO:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin_master', 'Admin123*')}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #BBF7D0',
                    backgroundColor: '#F0FDF4',
                    color: '#166534',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🛡️ Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('vendedor_juan', 'Vendedor123*')}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #FED7AA',
                    backgroundColor: '#FFF7ED',
                    color: '#9A3412',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  💼 Vendedor
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('maria_ecuador', 'Cliente123*')}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#334155',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🐾 Cliente
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER CLIENT */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Nombre de Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="ej: juan_perez"
                  value={regData.username}
                  onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  placeholder="ej: juan@gmail.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Confirmar Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={regData.confirmPassword}
                  onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.75rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={16} />
              <span>Rol asignado automáticamente: <strong>Cliente</strong> (seguridad RBAC)</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '6px', fontWeight: 700 }}
            >
              {loading ? 'Creando cuenta...' : <><UserPlus size={18} /> Registrarse como Cliente</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
