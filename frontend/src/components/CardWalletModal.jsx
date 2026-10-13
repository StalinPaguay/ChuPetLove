import React, { useState } from 'react';
import { X, CreditCard, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { validateEcuadorianId, validatePichinchaCard } from '../utils/ecuadorValidation';

export default function CardWalletModal({
  isOpen,
  onClose,
  cards = [],
  onAddCard,
  onDeleteCard,
  showToast
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    card_number: '',
    cardholder_name: '',
    client_ci: '',
    card_type: 'debito',
    expiry_month: 12,
    expiry_year: 2028
  });
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validar CI
    const ciValidation = validateEcuadorianId(formData.client_ci);
    if (!ciValidation.isValid) {
      setErrorMsg(ciValidation.message);
      return;
    }

    // Validar Tarjeta
    const cardValidation = validatePichinchaCard(formData.card_number);
    if (!cardValidation.isValid) {
      setErrorMsg(cardValidation.message);
      return;
    }

    if (!formData.cardholder_name.trim()) {
      setErrorMsg('El nombre del titular es obligatorio');
      return;
    }

    setLoading(true);
    try {
      await onAddCard({
        card_number: cardValidation.formatted,
        card_holder_name: formData.cardholder_name.trim(),
        user_ci: formData.client_ci.trim(),
        cardholder_name: formData.cardholder_name.trim(),
        client_ci: formData.client_ci.trim(),
        card_type: formData.card_type,
        expiry_month: parseInt(formData.expiry_month, 10),
        expiry_year: parseInt(formData.expiry_year, 10)
      });
      setShowAddForm(false);
      setFormData({
        card_number: '',
        cardholder_name: '',
        client_ci: '',
        card_type: 'debito',
        expiry_month: 12,
        expiry_year: 2028
      });
      if (showToast) showToast('success', 'Tarjeta agregada exitosamente');
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="wallet-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '540px',
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            backgroundColor: '#E8F5E9',
            color: '#2E7D32',
            padding: '10px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CreditCard size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              Billetera de Tarjetas
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              Tarjetas asociadas a Banco Pichincha (Ecuador)
            </p>
          </div>
        </div>

        {/* Lista de Tarjetas Guardadas */}
        {!showAddForm && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                TUS TARJETAS REGISTRADAS ({cards.length})
              </span>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <Plus size={16} /> Nueva Tarjeta
              </button>
            </div>

            {cards.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1.5px dashed #CBD5E1',
                marginBottom: '16px'
              }}>
                <CreditCard size={40} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', margin: 0 }}>
                  No tienes tarjetas guardadas
                </p>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
                  Guarda tu tarjeta Banco Pichincha para pagar rápidamente en 1 clic
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {cards.map((card) => (
                  <div
                    key={card.id}
                    style={{
                      background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                      color: 'white',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      position: 'relative',
                      boxShadow: '0 8px 16px rgba(30, 41, 59, 0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: '#FACC15' }}>
                        BANCO PICHINCHA • {card.card_type?.toUpperCase() || 'DÉBITO'}
                      </span>
                      {onDeleteCard && (
                        <button
                          onClick={() => onDeleteCard(card.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: 'none',
                            color: '#FCA5A5',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem'
                          }}
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '12px' }}>
                      {card.masked_number || `•••• •••• •••• ${card.card_number?.slice(-4) || '1234'}`}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'uppercase' }}>Titular</div>
                        <div style={{ fontWeight: 700 }}>{card.cardholder_name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'uppercase' }}>Cédula</div>
                        <div style={{ fontWeight: 600 }}>{card.client_ci}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'uppercase' }}>Vence</div>
                        <div style={{ fontWeight: 700 }}>{card.expiry_month}/{card.expiry_year}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulario de Agregar Tarjeta */}
        {showAddForm && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>
                Registrar Tarjeta Banco Pichincha
              </span>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
            </div>

            {errorMsg && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                NÚMERO DE TARJETA / CUENTA (10-19 DÍGITOS)
              </label>
              <input
                type="text"
                placeholder="ej: 2100123456789012"
                value={formData.card_number}
                onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                NOMBRE COMPLETO DEL TITULAR
              </label>
              <input
                type="text"
                placeholder="ej: MARÍA FERNANDA PÉREZ"
                value={formData.cardholder_name}
                onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value.toUpperCase() })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                CÉDULA DE IDENTIDAD / RUC (VALIDACIÓN ECUADOR)
              </label>
              <input
                type="text"
                maxLength={13}
                placeholder="ej: 1710034065"
                value={formData.client_ci}
                onChange={(e) => setFormData({ ...formData, client_ci: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                * Verificada mediante algoritmo Módulo 10 del Registro Civil
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  TIPO
                </label>
                <select
                  value={formData.card_type}
                  onChange={(e) => setFormData({ ...formData, card_type: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                >
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  MES
                </label>
                <select
                  value={formData.expiry_month}
                  onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  AÑO
                </label>
                <select
                  value={formData.expiry_year}
                  onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem' }}
                >
                  {[2026, 2027, 2028, 2029, 2030, 2031].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '8px', fontWeight: 700 }}
            >
              {loading ? 'Validando con Banco Pichincha...' : <><ShieldCheck size={18} /> Guardar Tarjeta de forma Segura</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
