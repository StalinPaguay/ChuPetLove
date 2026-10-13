import React, { useState } from 'react';
import {
  X, Plus, Trash2, Edit2, AlertCircle, Phone, Mail, MapPin,
  Building2, Save, DollarSign, ChevronDown, ChevronUp,
  ShoppingBag
} from 'lucide-react';

export default function ProvidersModal({
  isOpen,
  onClose,
  providers = [],
  onCreateProvider,
  onUpdateProvider,
  onDeleteProvider,
  showToast,
  readOnly = false
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedProviderId, setExpandedProviderId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    default_cost: 10.00,
    offered_products: []
  });

  // Offered Product Draft Input for New Item inside Form
  const [newOfferedItem, setNewOfferedItem] = useState({
    name: '',
    pet_type: 'Perros',
    category: 'Alimentos',
    cost_price: 10.00
  });

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      default_cost: 10.00,
      offered_products: [
        { name: 'Alimento Premium Especial', pet_type: 'Perros', category: 'Alimentos', cost_price: 12.50 }
      ]
    });
    setNewOfferedItem({ name: '', pet_type: 'Perros', category: 'Alimentos', cost_price: 10.00 });
    setShowForm(true);
    setErrorMsg('');
  };

  const handleOpenEdit = (provider) => {
    setEditingProvider(provider);
    const existingOffered = provider.offered_products && provider.offered_products.length > 0
      ? provider.offered_products.map(op => ({
          id: op.id,
          name: op.name,
          pet_type: op.pet_type,
          category: op.category,
          cost_price: parseFloat(op.cost_price || provider.default_cost || 10.00)
        }))
      : [];

    setFormData({
      name: provider.name || '',
      contact_name: provider.contact_name || '',
      phone: provider.phone || '',
      email: provider.email || '',
      address: provider.address || '',
      default_cost: provider.default_cost ? parseFloat(provider.default_cost) : 10.00,
      offered_products: existingOffered
    });
    setNewOfferedItem({ name: '', pet_type: 'Perros', category: 'Alimentos', cost_price: 10.00 });
    setShowForm(true);
    setErrorMsg('');
  };

  const handleAddOfferedProduct = () => {
    if (!newOfferedItem.name.trim()) {
      setErrorMsg('Ingresa el nombre del producto que ofrece este proveedor');
      return;
    }
    if (newOfferedItem.cost_price <= 0) {
      setErrorMsg('El costo fijo del producto debe ser mayor a 0');
      return;
    }

    setFormData(prev => ({
      ...prev,
      offered_products: [
        ...prev.offered_products,
        {
          name: newOfferedItem.name.trim(),
          pet_type: newOfferedItem.pet_type,
          category: newOfferedItem.category,
          cost_price: parseFloat(newOfferedItem.cost_price)
        }
      ]
    }));

    setNewOfferedItem({ name: '', pet_type: 'Perros', category: 'Alimentos', cost_price: 10.00 });
    setErrorMsg('');
  };

  const handleRemoveOfferedProduct = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      offered_products: prev.offered_products.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('El nombre de la empresa proveedora es obligatorio');
      return;
    }
    if (formData.default_cost <= 0) {
      setErrorMsg('El precio de costo base de abastecimiento debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      if (editingProvider) {
        await onUpdateProvider(editingProvider.id, formData);
        if (showToast) showToast('success', 'Proveedor y catálogo actualizado correctamente', 'Proveedor Modificado');
      } else {
        await onCreateProvider(formData);
        if (showToast) showToast('success', 'Proveedor y catálogo creado exitosamente', 'Proveedor Registrado');
      }
      setShowForm(false);
      setEditingProvider(null);
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedProviderId(prev => (prev === id ? null : id));
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="providers-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '820px',
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

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#FF7A00',
            padding: '12px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {readOnly ? 'Consulta de Proveedores y Catálogos (Solo Lectura)' : 'Gestión de Proveedores y Catálogos de Abastecimiento'}
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0 0' }}>
              {readOnly
                ? 'Vista de consulta de proveedores oficiales, contactos y productos que comercializan con sus costos base'
                : 'Configuración de proveedores oficiales, costos fijos y catálogo de productos autorizados'}
            </p>
          </div>
        </div>

        {!showForm ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#334155' }}>
                PROVEEDORES REGISTRADOS ({providers.length})
              </span>
              {!readOnly && (
                <button
                  onClick={handleOpenCreate}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Nuevo Proveedor con Catálogo
                </button>
              )}
            </div>

            {providers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1.5px dashed #CBD5E1'
              }}>
                <Truck size={40} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                  No hay proveedores registrados aún
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {providers.map((p) => {
                  const offeredList = p.offered_products || [];
                  const isExpanded = expandedProviderId === p.id;
                  const defaultCost = p.default_cost ? parseFloat(p.default_cost).toFixed(2) : '10.00';

                  return (
                    <div
                      key={p.id}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: '16px',
                        padding: '16px 18px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building2 size={17} color="#FF7A00" /> {p.name}
                            </h4>
                            <span style={{
                              backgroundColor: '#E0F2FE',
                              color: '#0369A1',
                              fontSize: '0.725rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              Costo Base: ${defaultCost}
                            </span>
                            <span style={{
                              backgroundColor: '#FEF3C7',
                              color: '#B45309',
                              fontSize: '0.725rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {offeredList.length} producto(s) en catálogo
                            </span>
                          </div>

                          <p style={{ fontSize: '0.825rem', color: '#475569', margin: '4px 0 0 0' }}>
                            Contacto: <strong>{p.contact_name || 'No asignado'}</strong>
                          </p>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.775rem', color: '#64748B', marginTop: '6px' }}>
                            {p.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {p.phone}</span>}
                            {p.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} /> {p.email}</span>}
                            {p.address && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {p.address}</span>}
                          </div>
                        </div>

                        {!readOnly && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                color: '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.775rem',
                                fontWeight: 700
                              }}
                            >
                              <Edit2 size={14} /> Editar Catálogo
                            </button>
                            {onDeleteProvider && (
                              <button
                                onClick={() => onDeleteProvider(p.id)}
                                style={{
                                  background: '#FEE2E2',
                                  border: '1px solid #FECACA',
                                  borderRadius: '8px',
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  color: '#DC2626',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.775rem',
                                  fontWeight: 700
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Catálogo de Productos Ofrecidos por este Proveedor */}
                      <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                        <button
                          onClick={() => toggleExpand(p.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#0284C7',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            padding: 0
                          }}
                        >
                          <ShoppingBag size={15} />
                          <span>Catálogo de Productos que Ofrece este Proveedor ({offeredList.length})</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isExpanded && (
                          <div style={{ marginTop: '10px' }}>
                            {offeredList.length === 0 ? (
                              <p style={{ fontSize: '0.775rem', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>
                                No se han configurado productos predeterminados para este proveedor. Haz clic en "Editar Catálogo" para agregarlos.
                              </p>
                            ) : (
                              <div style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: '10px',
                                border: '1px solid #CBD5E1',
                                overflow: 'hidden'
                              }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.775rem' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#F1F5F9', color: '#475569', textAlign: 'left' }}>
                                      <th style={{ padding: '8px 12px' }}>Producto Comercializado</th>
                                      <th style={{ padding: '8px 12px' }}>Especie / Tipo Mascota</th>
                                      <th style={{ padding: '8px 12px' }}>Categoría</th>
                                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Precio de Costo Fijo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {offeredList.map((item, idx) => (
                                      <tr key={item.id || idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1E293B' }}>{item.name}</td>
                                        <td style={{ padding: '8px 12px', color: '#64748B' }}>{item.pet_type}</td>
                                        <td style={{ padding: '8px 12px', color: '#64748B' }}>{item.category}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#B91C1C' }}>
                                          ${parseFloat(item.cost_price).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                {editingProvider ? 'Editar Datos y Catálogo del Proveedor' : 'Registrar Nuevo Proveedor con Catálogo de Productos'}
              </span>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}
              >
                ← Volver al listado
              </button>
            </div>

            {errorMsg && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                color: '#B91C1C',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#DC2626" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* General Info */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} color="#FF7A00" /> Información General del Proveedor
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    NOMBRE DE LA EMPRESA / DISTRIBUIDORA *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Distribuidora PetFood Ecuador S.A."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      NOMBRE DE CONTACTO
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Ing. Carlos Gómez"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      PRECIO COSTO BASE PROMEDIO ($) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="10.00"
                        value={formData.default_cost}
                        onChange={(e) => setFormData({ ...formData, default_cost: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '9px 8px 9px 24px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      TELÉFONO / CELULAR
                    </label>
                    <input
                      type="text"
                      placeholder="ej: 0998765432"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      CORREO ELECTRÓNICO
                    </label>
                    <input
                      type="email"
                      placeholder="ej: ventas@petfood.ec"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    DIRECCIÓN (CIUDAD / SECTOR)
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Av. 10 de Agosto, Quito"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Offered Products Catalog Section (REGLA 1: CONFIGURACIÓN DE PRODUCTOS EN EL PROVEEDOR) */}
            <div style={{ backgroundColor: '#F1F5F9', padding: '16px', borderRadius: '14px', border: '1.5px solid #CBD5E1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <h5 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={17} color="#2563EB" /> Catálogo de Productos Ofrecidos por este Proveedor
                  </h5>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                    Define los productos que este proveedor comercializa con su categoría, tipo de mascota y precio de costo fijo.
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#DBEAFE',
                  color: '#1D4ED8',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {formData.offered_products.length} productos
                </span>
              </div>

              {/* Table of configured products */}
              {formData.offered_products.length > 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #CBD5E1', overflow: 'hidden', marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.775rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px' }}>Nombre Producto</th>
                        <th style={{ padding: '8px 10px' }}>Mascota</th>
                        <th style={{ padding: '8px 10px' }}>Categoría</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Costo Fijo</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.offered_products.map((item, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1E293B' }}>{item.name}</td>
                          <td style={{ padding: '8px 10px', color: '#64748B' }}>{item.pet_type}</td>
                          <td style={{ padding: '8px 10px', color: '#64748B' }}>{item.category}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#B91C1C' }}>
                            ${parseFloat(item.cost_price).toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveOfferedProduct(idx)}
                              style={{
                                background: '#FEE2E2',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#DC2626',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Eliminar del catálogo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px dashed #CBD5E1', marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.775rem', color: '#64748B', margin: 0 }}>
                    No has agregado productos a la lista de oferta de este proveedor. Agrega al menos uno usando el formulario inferior.
                  </p>
                </div>
              )}

              {/* Add New Offered Product Inputs */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid #CBD5E1',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                gap: '8px',
                alignItems: 'end'
              }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    NOMBRE PRODUCTO
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Cat Chow Esterilizados 1.5kg"
                    value={newOfferedItem.name}
                    onChange={(e) => setNewOfferedItem({ ...newOfferedItem, name: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    MASCOTA
                  </label>
                  <select
                    value={newOfferedItem.pet_type}
                    onChange={(e) => setNewOfferedItem({ ...newOfferedItem, pet_type: e.target.value })}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    <option value="Perros">Perros</option>
                    <option value="Gatos">Gatos</option>
                    <option value="Hamsters">Hamsters</option>
                    <option value="Conejos">Conejos</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    CATEGORÍA
                  </label>
                  <select
                    value={newOfferedItem.category}
                    onChange={(e) => setNewOfferedItem({ ...newOfferedItem, category: e.target.value })}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    <option value="Alimentos">Alimentos</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Juguetes">Juguetes</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    COSTO FIJO ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newOfferedItem.cost_price}
                    onChange={(e) => setNewOfferedItem({ ...newOfferedItem, cost_price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddOfferedProduct}
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '32px'
                  }}
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '4px', padding: '12px', fontWeight: 800 }}
            >
              {loading ? 'Guardando Proveedor y Catálogo...' : <><Save size={18} /> {editingProvider ? 'Guardar Cambios del Proveedor' : 'Registrar Proveedor con Catálogo'}</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
