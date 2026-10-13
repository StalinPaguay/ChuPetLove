import React, { useState } from 'react';
import { Search, Plus, Minus, ShoppingCart, AlertCircle, CheckCircle2, Sparkles, Package } from 'lucide-react';

const PET_TYPES = [
  { id: 'ALL', label: 'Todas las Mascotas', emoji: '🐾' },
  { id: 'Perros', label: 'Perros', emoji: '🐕' },
  { id: 'Gatos', label: 'Gatos', emoji: '🐈' },
  { id: 'Hamsters', label: 'Hámsters', emoji: '🐹' },
  { id: 'Conejos', label: 'Conejos', emoji: '🐇' }
];

const CATEGORIES = [
  { id: 'ALL', label: 'Todas las Categorías' },
  { id: 'Alimentos', label: '🍖 Alimentos' },
  { id: 'Accesorios', label: '🎾 Accesorios' },
  { id: 'Juguetes', label: '🧸 Juguetes' }
];

export default function Catalog({ products = [], onAddToCart }) {
  const [selectedPet, setSelectedPet] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState({});

  // Dynamic filter
  const filteredProducts = products.filter(p => {
    const matchesPet = selectedPet === 'ALL' || p.pet_type === selectedPet;
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPet && matchesCategory && matchesSearch;
  });

  const handleQuantityChange = (productId, delta, maxStock) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #FF7A00 0%, #FF922D 50%, #2E7D32 100%)',
        borderRadius: '24px',
        padding: '36px 40px',
        color: 'white',
        marginBottom: '32px',
        boxShadow: '0 12px 30px rgba(255, 122, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '650px' }}>
          <span style={{
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <Sparkles size={16} /> ¡Lo mejor para tu peludito en Ecuador!
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '12px', color: '#FFFFFF' }}>
            Catálogo Oficial ChuPetLove 🐶🐱
          </h2>
          <p style={{ fontSize: '1.05rem', opacity: 0.95, fontWeight: 500, margin: 0 }}>
            Nutrición balanceada, accesorios y juguetes para Perros, Gatos, Hámsters y Conejos.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '20px 24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E2E8F0'
      }}>
        {/* Search */}
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Buscar alimento, rascador, juguete para tu mascota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '14px',
              border: '1.5px solid #E2E8F0',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        {/* Pet filters */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>
            FILTRAR POR MASCOTA:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PET_TYPES.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelectedPet(pet.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: selectedPet === pet.id ? '2px solid #FF7A00' : '1.5px solid #E2E8F0',
                  backgroundColor: selectedPet === pet.id ? '#FFF2E8' : '#FFFFFF',
                  color: selectedPet === pet.id ? '#FF7A00' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{pet.emoji}</span>
                <span>{pet.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category filters */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>
            CATEGORÍA:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: selectedCategory === cat.id ? '2px solid #2E7D32' : '1.5px solid #E2E8F0',
                  backgroundColor: selectedCategory === cat.id ? '#E8F5E9' : '#FFFFFF',
                  color: selectedCategory === cat.id ? '#2E7D32' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0'
        }}>
          <Package size={48} color="#94A3B8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#334155' }}>No se encontraron productos</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '6px' }}>
            Intenta cambiar los filtros de categoría, mascota o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredProducts.map(product => {
            const qty = quantities[product.id] || 1;
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= 3;

            return (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: isLowStock ? '1.5px solid #FFD4B2' : '1px solid #E2E8F0',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Product Image */}
                <div style={{ position: 'relative', height: '200px', backgroundColor: '#F8FAFC' }}>
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop'}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Badges */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge-pet">{product.pet_type}</span>
                    <span className="badge-category">{product.category}</span>
                  </div>

                  {/* Stock Alert Badge */}
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                    {isOutOfStock ? (
                      <span style={{
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '9999px'
                      }}>
                        Agotado
                      </span>
                    ) : isLowStock ? (
                      <span className="badge-stock badge-stock-low">
                        ¡Últimas {product.stock} un.!
                      </span>
                    ) : (
                      <span className="badge-stock badge-stock-ok">
                        Stock: {product.stock} un.
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px', lineHeight: 1.3 }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '16px', flexGrow: 1, lineHeight: 1.4 }}>
                    {product.description || 'Producto premium seleccionado para el bienestar de tu mascota en Ecuador.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600 }}>PRECIO VENTA:</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF7A00' }}>
                        ${product.sale_price?.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    {!isOutOfStock && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        padding: '3px'
                      }}>
                        <button
                          onClick={() => handleQuantityChange(product.id, -1, product.stock)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', display: 'flex' }}
                        >
                          <Minus size={14} color="#64748B" />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
                          {qty}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(product.id, 1, product.stock)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', display: 'flex' }}
                        >
                          <Plus size={14} color="#64748B" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => onAddToCart(product, qty)}
                    disabled={isOutOfStock}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '11px',
                      fontSize: '0.9rem',
                      opacity: isOutOfStock ? 0.5 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ShoppingCart size={16} />
                    {isOutOfStock ? 'Sin existencias' : 'Añadir al Carrito'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
