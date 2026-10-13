import React, { useState } from 'react';
import {
  LogIn, UserPlus, Lock, User, ShieldCheck, Heart, Sparkles,
  AlertCircle, CheckCircle2, Star, Award, XCircle, Check, Eye, EyeOff
} from 'lucide-react';

export default function AuthScreen({ onLogin, onRegister, loading, error, clearError }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [mascotMood, setMascotMood] = useState('idle'); // 'idle' | 'typing_user' | 'typing_password' | 'peek'
  const [showPassword, setShowPassword] = useState(false);

  // Login form: Username/Email + Password
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // Register form: Username + Password + Confirm Password
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [localError, setLocalError] = useState('');

  // Validaciones en tiempo real para Registro
  const isPasswordTooShort = registerForm.password.length > 0 && registerForm.password.length < 6;
  const doPasswordsMatch = registerForm.password.length >= 6 && registerForm.confirmPassword.length > 0 && registerForm.password === registerForm.confirmPassword;
  const doPasswordsMismatch = registerForm.confirmPassword.length > 0 && registerForm.password !== registerForm.confirmPassword;

  // 1. Manejador de Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (clearError) clearError();

    const u = loginForm.username.trim();
    const p = loginForm.password.trim();

    if (!u || !p) {
      setLocalError('Todos los campos son obligatorios. Por favor ingrese su usuario y contraseña.');
      setMascotMood('error');
      return;
    }

    onLogin(u, p);
  };

  // 2. Manejador de Registro
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (clearError) clearError();

    const u = registerForm.username.trim();
    const p = registerForm.password.trim();
    const cp = registerForm.confirmPassword.trim();

    if (!u || !p || !cp) {
      setLocalError('Todos los campos son obligatorios. Por favor complete todos los datos.');
      setMascotMood('error');
      return;
    }
    if (u.length < 3) {
      setLocalError('El nombre de usuario debe contener al menos 3 caracteres.');
      setMascotMood('error');
      return;
    }
    if (p.length < 6) {
      setLocalError('La contraseña debe tener una longitud mínima de 6 caracteres.');
      setMascotMood('error');
      return;
    }
    if (p !== cp) {
      setLocalError('Las contraseñas no coinciden. Verifique y vuelva a escribir.');
      setMascotMood('error');
      return;
    }

    onRegister({
      username: u,
      password: p
    });
  };

  const handleInputChange = (field, value, formType) => {
    setLocalError('');
    if (clearError) clearError();
    if (formType === 'login') {
      setLoginForm(prev => ({ ...prev, [field]: value }));
    } else {
      setRegisterForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // Botón rápido para pruebas QA de auditoría (1-Click Fill)
  const handleQuickFill = (user, pass) => {
    setTab('login');
    setLoginForm({ username: user, password: pass });
    setLocalError('');
    if (clearError) clearError();
    setMascotMood('idle');
  };

  const activeError = localError || error;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF7F2',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      {/* Decorative ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        right: '-100px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 122, 0, 0.15) 0%, rgba(255, 122, 0, 0) 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-120px',
        left: '-100px',
        width: '520px',
        height: '520px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46, 125, 50, 0.14) 0%, rgba(46, 125, 50, 0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top Banner Ecuador */}
      <header style={{
        backgroundColor: '#FF7A00',
        color: '#FFFFFF',
        fontSize: '0.85rem',
        fontWeight: 700,
        textAlign: 'center',
        padding: '9px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 2px 10px rgba(255, 122, 0, 0.25)',
        zIndex: 10
      }}>
        <Sparkles size={16} />
        <span>¡Bienvenidos a ChuPetLove Ecuador! • Calidad Certificada ISO/IEC 25010 • IVA 15% Oficial Vigente</span>
      </header>

      {/* Main Container Grid */}
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '36px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '40px',
        alignItems: 'center',
        flexGrow: 1,
        width: '100%',
        boxSizing: 'border-box',
        zIndex: 2
      }}>
        {/* Left Side: Commercial Showcase + Animated Pet Mascot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #FF7A00 0%, #2E7D32 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 22px rgba(255, 122, 0, 0.35)'
            }}>
              <Heart size={32} fill="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: '#1E293B', margin: 0 }}>
                ChuPet<span style={{ color: '#FF7A00' }}>Love</span>
              </h1>
              <p style={{ fontSize: '0.925rem', color: '#2E7D32', fontWeight: 700, marginTop: '4px', margin: 0 }}>
                Tienda Especializada de Mascotas • Ecuador 🐾
              </p>
            </div>
          </div>

          <h2 style={{ fontSize: '1.95rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.25, margin: 0 }}>
            Nutrición balanceada, accesorios y felicidad para tu peludito.
          </h2>

          {/* Interactive Mascot Visual Showcase Card */}
          <div style={{
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.1)',
            border: '2px solid #FFFFFF',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 50%, #ECFDF5 100%)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px'
          }}>
            {/* Interactive SVG Mascot (Puppy ChuPet) */}
            <div style={{ position: 'relative', width: '180px', height: '170px', marginBottom: '12px' }}>
              <svg viewBox="0 0 200 190" width="100%" height="100%">
                {/* Ears */}
                <ellipse
                  cx="50"
                  cy={mascotMood === 'typing_user' ? '45' : '65'}
                  rx="26"
                  ry="42"
                  fill="#EA580C"
                  transform={mascotMood === 'typing_user' ? 'rotate(-25 50 45)' : 'rotate(-15 50 65)'}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <ellipse
                  cx="150"
                  cy={mascotMood === 'typing_user' ? '45' : '65'}
                  rx="26"
                  ry="42"
                  fill="#EA580C"
                  transform={mascotMood === 'typing_user' ? 'rotate(25 150 45)' : 'rotate(15 150 65)'}
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Head */}
                <ellipse cx="100" cy="95" rx="68" ry="60" fill="#FDBA74" />
                <ellipse cx="100" cy="115" rx="42" ry="34" fill="#FED7AA" />

                {/* Eyes */}
                {mascotMood === 'typing_password' ? (
                  // Closed/playful wink eyes
                  <g>
                    <path d="M 72 88 Q 82 82 92 88" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M 108 88 Q 118 82 128 88" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </g>
                ) : (
                  // Open curious eyes
                  <g>
                    <ellipse cx="80" cy={mascotMood === 'typing_user' ? "85" : "88"} rx="9" ry="11" fill="#1E293B" />
                    <ellipse cx="82" cy={mascotMood === 'typing_user' ? "83" : "86"} rx="3.5" ry="4" fill="#FFFFFF" />
                    <ellipse cx="120" cy={mascotMood === 'typing_user' ? "85" : "88"} rx="9" ry="11" fill="#1E293B" />
                    <ellipse cx="122" cy={mascotMood === 'typing_user' ? "83" : "86"} rx="3.5" ry="4" fill="#FFFFFF" />
                  </g>
                )}

                {/* Snout & Nose */}
                <path d="M 92 110 Q 100 102 108 110 Q 100 118 92 110 Z" fill="#7C2D12" />
                <path d="M 100 115 L 100 126" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 88 124 Q 100 133 112 124" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                {/* Tongue (Happy wagging when idle or typing user) */}
                {mascotMood !== 'typing_password' && (
                  <path d="M 96 128 C 96 138 104 138 104 128 Z" fill="#F43F5E" />
                )}

                {/* Blush */}
                <ellipse cx="62" cy="105" rx="9" ry="5" fill="#FDA4AF" opacity="0.6" />
                <ellipse cx="138" cy="105" rx="9" ry="5" fill="#FDA4AF" opacity="0.6" />

                {/* Paws covering eyes when password focused */}
                {mascotMood === 'typing_password' && (
                  <g style={{ transition: 'all 0.3s ease' }}>
                    {/* Left Paw */}
                    <ellipse cx="76" cy="88" rx="20" ry="18" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
                    <circle cx="70" cy="80" r="4" fill="#EA580C" />
                    <circle cx="78" cy="78" r="4" fill="#EA580C" />
                    <circle cx="86" cy="82" r="4" fill="#EA580C" />
                    {/* Right Paw */}
                    <ellipse cx="124" cy="88" rx="20" ry="18" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
                    <circle cx="114" cy="82" r="4" fill="#EA580C" />
                    <circle cx="122" cy="78" r="4" fill="#EA580C" />
                    <circle cx="130" cy="80" r="4" fill="#EA580C" />
                  </g>
                )}
              </svg>
            </div>

            {/* Dynamic Interactive Speech Bubble */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '10px 18px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #FED7AA'
            }}>
              <span style={{ fontSize: '1.2rem' }}>
                {mascotMood === 'typing_password' ? '🙈' : mascotMood === 'typing_user' ? '👀' : mascotMood === 'error' ? '🐾' : '🐶'}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                {mascotMood === 'typing_password'
                  ? '¡No miro tu clave! Tu contraseña está cifrada con Bcrypt.'
                  : mascotMood === 'typing_user'
                  ? '¡Hola! Escribe tu usuario o correo en mayúsculas o minúsculas.'
                  : mascotMood === 'error'
                  ? '¡Revisa los datos marcados para ingresar con éxito!'
                  : '¡Hola amigo! Bienvenido a ChuPetLove Ecuador.'}
              </span>
            </div>
          </div>

          {/* Corporate Badges & Guarantees (Pronaca, Purina, Banco Pichincha) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '14px 16px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                padding: '10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                  Pronaca & Purina
                </h4>
                <p style={{ fontSize: '0.725rem', color: '#64748B', margin: '2px 0 0 0' }}>
                  Distribuidores oficiales en Ecuador
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '14px 16px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                padding: '10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                  Banco Pichincha
                </h4>
                <p style={{ fontSize: '0.725rem', color: '#64748B', margin: '2px 0 0 0' }}>
                  Transferencias y pagos protegidos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Authentication Card with High-Impact Feedback */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          padding: '38px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>
              {tab === 'login' ? 'Acceso al Sistema' : 'Registro de Cliente'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
              {tab === 'login'
                ? 'Ingresa tus credenciales para acceder con tu rol'
                : 'Crea tu cuenta de cliente para realizar tus compras'}
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => { setTab('login'); setLocalError(''); if (clearError) clearError(); setMascotMood('idle'); }}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: tab === 'login' ? '#FFFFFF' : 'transparent',
                color: tab === 'login' ? '#FF7A00' : '#64748B',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: tab === 'login' ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogIn size={17} /> Iniciar Sesión
            </button>
            <button
              onClick={() => { setTab('register'); setLocalError(''); if (clearError) clearError(); setMascotMood('idle'); }}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: tab === 'register' ? '#FFFFFF' : 'transparent',
                color: tab === 'register' ? '#2E7D32' : '#64748B',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: tab === 'register' ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <UserPlus size={17} /> Crear Cuenta
            </button>
          </div>

          {/* Prominent Visual Alert Box for Errors */}
          {activeError && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)'
            }}>
              <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991B1B', margin: '0 0 2px 0' }}>
                  Atención en la Validación
                </h5>
                <p style={{ fontSize: '0.825rem', color: '#B91C1C', margin: 0, lineHeight: 1.4 }}>
                  {activeError}
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: INICIAR SESIÓN */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  USUARIO O CORREO ELECTRÓNICO
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="ej: admin, vendedor, cliente o maria_ecuador"
                    value={loginForm.username}
                    onFocus={() => setMascotMood('typing_user')}
                    onBlur={() => setMascotMood('idle')}
                    onChange={(e) => handleInputChange('username', e.target.value, 'login')}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.725rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
                  * Búsqueda insensible a mayúsculas y minúsculas (case-insensitive).
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  CONTRASEÑA
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onFocus={() => setMascotMood('typing_password')}
                    onBlur={() => setMascotMood('idle')}
                    onChange={(e) => handleInputChange('password', e.target.value, 'login')}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800, marginTop: '8px' }}
              >
                {loading ? 'Validando con Servidor (Bcrypt)...' : <><LogIn size={18} /> Entrar a ChuPetLove</>}
              </button>
            </form>
          )}

          {/* TAB 2: CREAR CUENTA */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  NOMBRE DE USUARIO
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="ej: juan_perez o ana_cat"
                    value={registerForm.username}
                    onFocus={() => setMascotMood('typing_user')}
                    onBlur={() => setMascotMood('idle')}
                    onChange={(e) => handleInputChange('username', e.target.value, 'register')}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                    CONTRASEÑA
                  </label>
                  {isPasswordTooShort && (
                    <span style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>
                      Mínimo 6 caracteres
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerForm.password}
                    onFocus={() => setMascotMood('typing_password')}
                    onBlur={() => setMascotMood('idle')}
                    onChange={(e) => handleInputChange('password', e.target.value, 'register')}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 42px',
                      borderRadius: '12px',
                      border: isPasswordTooShort ? '1.5px solid #F87171' : '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                    CONFIRMAR CONTRASEÑA
                  </label>
                  {doPasswordsMatch && (
                    <span style={{ fontSize: '0.725rem', color: '#16A34A', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={12} /> Coinciden
                    </span>
                  )}
                  {doPasswordsMismatch && (
                    <span style={{ fontSize: '0.725rem', color: '#DC2626', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <XCircle size={12} /> No coinciden
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="password"
                    placeholder="Repite tu contraseña exactamente"
                    value={registerForm.confirmPassword}
                    onFocus={() => setMascotMood('typing_password')}
                    onBlur={() => setMascotMood('idle')}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value, 'register')}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 42px',
                      borderRadius: '12px',
                      border: doPasswordsMismatch ? '1.5px solid #F87171' : doPasswordsMatch ? '1.5px solid #4ADE80' : '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* RBAC Guarantee Note */}
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldCheck size={18} />
                <span>
                  Rol asignado automáticamente: <strong>Cliente</strong> 🐾 (Tus tarjetas y datos estarán 100% privados).
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-secondary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800, marginTop: '4px' }}
              >
                {loading ? 'Cifrando con Bcrypt y guardando...' : <><UserPlus size={18} /> Registrarse como Cliente</>}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '16px 24px',
        borderTop: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        color: '#64748B',
        fontSize: '0.8rem'
      }}>
        © 2026 ChuPetLove — Sistema Integral de Gestión y Tienda de Mascotas (Ecuador). Cumplimiento ISO/IEC 25010.
      </footer>
    </div>
  );
}
