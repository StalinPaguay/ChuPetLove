import React, { useState } from 'react';
import {
  X, Trash2, Plus, Minus, CreditCard, Banknote, Upload, ShieldCheck,
  ArrowRight, Building2, Check, AlertCircle, Copy, Clock, CheckCircle2
} from 'lucide-react';
import { validateEcuadorianId, validatePichinchaCard } from '../utils/ecuadorValidation';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  ivaPercentage = 15.00,
  savedCards = []
}) {
  const [paymentMethod, setPaymentMethod] = useState('transferencia'); // 'transferencia' | 'tarjeta' | 'efectivo'
  const [selectedSavedCardId, setSelectedSavedCardId] = useState(savedCards.length > 0 ? savedCards[0].id : 'new');

  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardHolderName: '',
    userCi: ''
  });

  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewName, setProofPreviewName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState('');

  if (!isOpen) return null;

  // Exact math calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0);
  const ivaApplied = subtotal * (ivaPercentage / 100.0);
  const total = subtotal + ivaApplied;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleCardInputChange = (e) => {
    setCardInfo({
      ...cardInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'].includes(file.type)) {
        setErrorMessage('Formato de comprobante no válido (se aceptan JPG, PNG, WEBP o PDF)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('El archivo del comprobante no debe superar los 5MB');
        return;
      }
      setProofFile(file);
      setProofPreviewName(file.name);
      setErrorMessage('');
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (cartItems.length === 0) return;

    let finalCardData = null;

    // Validación según método de pago
    if (paymentMethod === 'transferencia') {
      if (!proofFile) {
        setErrorMessage('⚠️ Es obligatorio adjuntar la captura del comprobante de transferencia bancaria antes de enviar tu orden.');
        return;
      }
    } else if (paymentMethod === 'tarjeta') {
      if (selectedSavedCardId !== 'new') {
        const found = savedCards.find(c => c.id === selectedSavedCardId);
        if (found) {
          finalCardData = {
            card_number: found.card_number || '2100998877665544',
            card_holder_name: found.card_holder_name || found.cardholder_name || 'TITULAR',
            user_ci: found.user_ci || found.client_ci || '1710034065',
            cardNumber: found.card_number || '2100998877665544',
            cardHolderName: found.card_holder_name || found.cardholder_name || 'TITULAR',
            userCi: found.user_ci || found.client_ci || '1710034065'
          };
        }
      } else {
        const ciVal = validateEcuadorianId(cardInfo.userCi);
        if (!ciVal.isValid) {
          setErrorMessage(ciVal.message);
          return;
        }
        const cardVal = validatePichinchaCard(cardInfo.cardNumber);
        if (!cardVal.isValid) {
          setErrorMessage(cardVal.message);
          return;
        }
        if (!cardInfo.cardHolderName.trim()) {
          setErrorMessage('El nombre del titular de la tarjeta es obligatorio');
          return;
        }
        finalCardData = {
          card_number: cardInfo.cardNumber,
          card_holder_name: cardInfo.cardHolderName,
          user_ci: cardInfo.userCi,
          cardNumber: cardInfo.cardNumber,
          cardHolderName: cardInfo.cardHolderName,
          userCi: cardInfo.userCi
        };
      }
    }

    setIsProcessing(true);
    try {
      await onCheckout({
        items: cartItems,
        payment_method: paymentMethod,
        card_info: finalCardData,
        proofFile: proofFile,
        subtotal,
        iva_percentage: ivaPercentage,
        iva_applied: ivaApplied,
        total
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error al procesar la orden');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              Resumen de Compra 🛒
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              {cartItems.length} producto(s) en tu carrito
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🐾</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155' }}>Tu carrito está vacío</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>¡Explora el catálogo y añade lo mejor para tu mascota!</p>
            </div>
          ) : (
            <>
              {/* Product List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: '14px',
                      border: '1px solid #F1F5F9',
                      backgroundColor: '#F8FAFC'
                    }}
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop'}
                      alt={item.name}
                      style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{item.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#FF7A00', fontWeight: 700, margin: '2px 0 0 0' }}>
                        ${item.sale_price.toFixed(2)} c/u
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          style={{ border: '1px solid #CBD5E1', borderRadius: '6px', background: 'white', padding: '2px', cursor: 'pointer' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          style={{ border: '1px solid #CBD5E1', borderRadius: '6px', background: 'white', padding: '2px', cursor: 'pointer' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                        ${(item.sale_price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', marginTop: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Methods Section */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '16px',
                border: '1.5px solid #E2E8F0',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={18} color="#FF7A00" /> Método de Pago
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  {/* Transferencia */}
                  <div
                    onClick={() => setPaymentMethod('transferencia')}
                    style={{
                      border: paymentMethod === 'transferencia' ? '2px solid #FF7A00' : '1px solid #E2E8F0',
                      backgroundColor: paymentMethod === 'transferencia' ? '#FFF2E8' : '#F8FAFC',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Building2 size={20} color={paymentMethod === 'transferencia' ? '#FF7A00' : '#64748B'} style={{ margin: '0 auto 4px' }} />
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: paymentMethod === 'transferencia' ? '#FF7A00' : '#334155', margin: 0 }}>
                      Transferencia
                    </h5>
                    <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Banco Pichincha</span>
                  </div>

                  {/* Tarjeta */}
                  <div
                    onClick={() => setPaymentMethod('tarjeta')}
                    style={{
                      border: paymentMethod === 'tarjeta' ? '2px solid #2E7D32' : '1px solid #E2E8F0',
                      backgroundColor: paymentMethod === 'tarjeta' ? '#E8F5E9' : '#F8FAFC',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <CreditCard size={20} color={paymentMethod === 'tarjeta' ? '#2E7D32' : '#64748B'} style={{ margin: '0 auto 4px' }} />
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: paymentMethod === 'tarjeta' ? '#2E7D32' : '#334155', margin: 0 }}>
                      Tarjeta
                    </h5>
                    <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Banco Pichincha</span>
                  </div>

                  {/* Efectivo */}
                  <div
                    onClick={() => setPaymentMethod('efectivo')}
                    style={{
                      border: paymentMethod === 'efectivo' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                      backgroundColor: paymentMethod === 'efectivo' ? '#F0F9FF' : '#F8FAFC',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Banknote size={20} color={paymentMethod === 'efectivo' ? '#0284C7' : '#64748B'} style={{ margin: '0 auto 4px' }} />
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: paymentMethod === 'efectivo' ? '#0284C7' : '#334155', margin: 0 }}>
                      Efectivo
                    </h5>
                    <span style={{ fontSize: '0.65rem', color: '#64748B' }}>Contra entrega</span>
                  </div>
                </div>

                {/* Sub-Panel: Transferencia Bancaria Oficial (Banco Pichincha) */}
                {paymentMethod === 'transferencia' && (
                  <div style={{
                    backgroundColor: '#FFF7ED',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1.5px solid #FFD4B2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#C2410C', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        🏦 DATOS OFICIALES PARA TRANSFERENCIA (BANCO PICHINCHA)
                      </span>
                    </div>

                    {/* Official Bank Account Information Box */}
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '12px',
                      border: '1px solid #FED7AA',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '0.775rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>ENTIDAD BANCARIA:</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>Banco Pichincha</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #FED7AA', paddingTop: '6px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>TITULAR DE LA CUENTA:</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>Javier Eduardo Paredes Cabrera</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('Javier Eduardo Paredes Cabrera', 'titular')}
                          style={{ background: '#FFF2E8', border: '1px solid #FED7AA', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', color: '#EA580C', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}
                        >
                          {copiedField === 'titular' ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #FED7AA', paddingTop: '6px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>NÚMERO DE CUENTA:</span>
                          <strong style={{ color: '#C2410C', fontSize: '1rem', letterSpacing: '0.05em' }}>2202592175</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('2202592175', 'cuenta')}
                          style={{ background: '#FFF2E8', border: '1px solid #FED7AA', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', color: '#EA580C', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}
                        >
                          {copiedField === 'cuenta' ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #FED7AA', paddingTop: '6px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>CÉDULA DE IDENTIDAD (CI):</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>1761062716</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('1761062716', 'ci')}
                          style={{ background: '#FFF2E8', border: '1px solid #FED7AA', borderRadius: '6px', padding: '3px 7px', cursor: 'pointer', color: '#EA580C', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}
                        >
                          {copiedField === 'ci' ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                        </button>
                      </div>
                    </div>

                    {/* Upload Transfer Screenshot (MANDATORY) */}
                    <div style={{ marginTop: '4px' }}>
                      <label style={{ fontSize: '0.725rem', fontWeight: 800, color: '#9A3412', display: 'block', marginBottom: '4px' }}>
                        ADJUNTAR CAPTURA DE PANTALLA DE LA TRANSFERENCIA * <span style={{ color: '#DC2626' }}>(Obligatorio)</span>
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        backgroundColor: proofFile ? '#F0FDF4' : '#FFFFFF',
                        border: proofFile ? '1.5px solid #22C55E' : '1.5px dashed #FB923C',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.775rem',
                        color: proofFile ? '#166534' : '#EA580C',
                        fontWeight: 700,
                        transition: 'all 0.2s ease'
                      }}>
                        {proofFile ? <CheckCircle2 size={16} color="#16A34A" /> : <Upload size={16} />}
                        <span>{proofPreviewName ? `Comprobante: ${proofPreviewName}` : 'Subir captura de la transferencia (JPG, PNG, PDF)'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    {/* Notice about Pending Validation */}
                    <div style={{
                      backgroundColor: '#FEF3C7',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      color: '#92400E',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px'
                    }}>
                      <Clock size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        <strong>Aviso importante:</strong> Al enviar tu pedido quedará en estado <strong>"Pendiente de Validación"</strong> hasta que el cajero o administrador confirme la recepción de la transferencia.
                      </span>
                    </div>
                  </div>
                )}

                {/* Sub-Panel: Tarjeta */}
                {paymentMethod === 'tarjeta' && (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2E7D32' }}>
                      💳 PAGO CON TARJETA DE BANCO PICHINCHA
                    </span>

                    {savedCards.length > 0 && (
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                          SELECCIONAR TARJETA GUARDADA
                        </label>
                        <select
                          value={selectedSavedCardId}
                          onChange={(e) => setSelectedSavedCardId(e.target.value === 'new' ? 'new' : parseInt(e.target.value, 10))}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', backgroundColor: 'white' }}
                        >
                          {savedCards.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.masked_number || `•••• ${c.card_number?.slice(-4)}`} ({c.cardholder_name})
                            </option>
                          ))}
                          <option value="new">+ Ingresar otra tarjeta</option>
                        </select>
                      </div>
                    )}

                    {(savedCards.length === 0 || selectedSavedCardId === 'new') && (
                      <>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="Número de Tarjeta (10-19 dígitos)"
                          value={cardInfo.cardNumber}
                          onChange={handleCardInputChange}
                          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input
                            type="text"
                            name="cardHolderName"
                            placeholder="Nombre del Titular"
                            value={cardInfo.cardHolderName}
                            onChange={handleCardInputChange}
                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                          />
                          <input
                            type="text"
                            name="userCi"
                            placeholder="Cédula / RUC (Ecuador)"
                            value={cardInfo.userCi}
                            onChange={handleCardInputChange}
                            style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}
                          />
                        </div>
                      </>
                    )}

                    <div style={{ marginTop: '2px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        COMPROBANTE / VOUCHER DIGITAL (OPCIONAL)
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px dashed #CBD5E1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#64748B'
                      }}>
                        <Upload size={14} />
                        <span>{proofPreviewName ? `Adjunto: ${proofPreviewName}` : 'Subir comprobante si aplica (JPG, PNG, PDF)'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Sub-Panel: Efectivo */}
                {paymentMethod === 'efectivo' && (
                  <div style={{ backgroundColor: '#F0F9FF', padding: '12px', borderRadius: '10px', border: '1px solid #BAE6FD', fontSize: '0.775rem', color: '#0369A1' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      💵 Realizarás el pago en efectivo directamente al repartidor al recibir tu pedido.
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.725rem', color: '#0284C7' }}>
                      La orden quedará en estado <strong>"Pendiente de Validación"</strong> hasta la entrega física y cobro en efectivo.
                    </p>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  color: '#B91C1C',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '0.825rem',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer / Totals & Checkout Button */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748B' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748B' }}>
                <span>IVA Vigente Ecuador ({ivaPercentage}%):</span>
                <span style={{ fontWeight: 600 }}>${ivaApplied.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                <span>Total a Pagar:</span>
                <span style={{ color: '#FF7A00' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isProcessing}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800 }}
            >
              {isProcessing ? 'Enviando Orden a Validación...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Enviar Pedido a Validación (${total.toFixed(2)}) <ArrowRight size={18} />
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
