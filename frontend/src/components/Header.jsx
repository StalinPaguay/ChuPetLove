import React from 'react';
import { ShoppingBag, Heart, Sparkles, Clock, Shield, Store, User, LogOut, CreditCard, Truck, AlertTriangle, Layers } from 'lucide-react';

export default function Header({
  cartCount = 0,
  onOpenCart,
  currentView,
  onChangeView,
  currentUser,
  onLogout,
  onOpenWallet,
  onOpenOrders,
  onOpenProviders,
  onOpenProductModal,
  ivaPercentage = 15.00
}) {
  const role = currentUser?.role || 'cliente';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #F1F5F9',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
    }}>
      {/* Top Banner Ecuador / IVA */}
      <div style={{
        backgroundColor: role === 'admin' ? '#15803D' : role === 'vendedor' ? '#EA580C' : '#FF7A00',
        color: '#FFFFFF',
        fontSize: '0.8rem',
        fontWeight: 700,
        textAlign: 'center',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background-color 0.3s ease'
      }}>
        <Sparkles size={14} />
        {role === 'admin' && <span>👑 PANEL ADMINISTRATIVO — Control Financiero y Gerencial • IVA Vigente: {ivaPercentage}%</span>}
        {role === 'vendedor' && <span>💼 PANEL DE VENDEDOR Y CAJA — Validación de Pagos e Inventario • ChuPetLove Ecuador</span>}
        {role === 'cliente' && <span>🐾 ¡Envíos gratis en Quito y Guayaquil por compras mayores a $30! • IVA {ivaPercentage}% Oficial</span>}
      </div>

      {/* Main Navbar */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '13px',
            background: role === 'admin'
              ? 'linear-gradient(135deg, #15803D 0%, #047857 100%)'
              : role === 'vendedor'
              ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
              : 'linear-gradient(135deg, #FF7A00 0%, #2E7D32 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
          }}>
            {role === 'admin' ? <Shield size={24} /> : role === 'vendedor' ? <Clock size={24} /> : <Heart size={22} fill="white" />}
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', margin: 0 }}>
              ChuPet<span style={{ color: '#FF7A00' }}>Love</span>
            </h1>
            <p style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 700, marginTop: '2px', margin: 0 }}>
              {role === 'admin' ? 'Portal Gerencial' : role === 'vendedor' ? 'Punto de Venta & Caja' : 'Tienda de Mascotas Ecuador 🐾'}
            </p>
          </div>
        </div>

        {/* Dynamic Context Navigation based on Strict Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* CLIENT NAV */}
          {role === 'cliente' && (
            <>
              <button
                onClick={onOpenOrders}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFF2E8',
                  color: '#EA580C',
                  border: '1.5px solid #FFD4B2',
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <ShoppingBag size={16} />
                <span>Mis Compras</span>
              </button>
              <button
                onClick={onOpenWallet}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#F0FDF4',
                  color: '#166534',
                  border: '1.5px solid #BBF7D0',
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <CreditCard size={16} />
                <span>Mi Billetera</span>
              </button>
            </>
          )}

          {/* VENDOR NAV - sin botones CRUD, todo integrado en su panel */}

          {/* ADMIN NAV */}
          {role === 'admin' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onOpenProviders}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#F0FDF4',
                  color: '#166534',
                  border: '1px solid #BBF7D0',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <Truck size={15} /> Proveedores
              </button>
            </div>
          )}

          {/* Cart Trigger (Exclusively for Client) */}
          {role === 'cliente' && (
            <button
              onClick={onOpenCart}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFF2E8',
                color: '#FF7A00',
                border: '1.5px solid #FFD4B2',
                padding: '9px 16px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ShoppingBag size={18} />
              <span>Carrito</span>
              {cartCount > 0 && (
                <span style={{
                  backgroundColor: '#FF7A00',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(255, 122, 0, 0.4)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile & Logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '4px 10px 4px 6px',
            borderRadius: '9999px'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: role === 'admin' ? '#15803D' : role === 'vendedor' ? '#EA580C' : '#0284C7',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 800
            }}>
              {currentUser?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1E293B' }}>
                {currentUser?.username}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: role === 'admin' ? '#15803D' : role === 'vendedor' ? '#EA580C' : '#0284C7',
                textTransform: 'uppercase'
              }}>
                {role}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              style={{
                background: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                marginLeft: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
