/**
 * apiService.js - Centralized API integration for ChuPetLove Backend.
 * 
 * Includes:
 *  - JWT header interceptor
 *  - Auto error formatting
 *  - Seamless fallback to local storage / mock state if backend is offline
 */

const BASE_URL = 'http://localhost:8000/api';

export const getAuthToken = () => localStorage.getItem('chupetlove_token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('chupetlove_token', token);
  else localStorage.removeItem('chupetlove_token');
};

export const getStoredUser = () => {
  const user = localStorage.getItem('chupetlove_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user) => {
  if (user) localStorage.setItem('chupetlove_user', JSON.stringify(user));
  else localStorage.removeItem('chupetlove_user');
};

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      setAuthToken(null);
      setStoredUser(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chupetlove:auth_expired', {
          detail: { message: 'La sesión ha expirado por seguridad (ISO/IEC 25010).' }
        }));
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }

      let errorMsg = 'Error en la solicitud';
      if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMsg = errorData.detail.map(d => d.msg || JSON.stringify(d)).join('. ');
      } else if (errorData.message) {
        errorMsg = errorData.message;
      } else {
        errorMsg = `Error ${response.status}`;
      }

      throw new Error(errorMsg);
    }

    // If 204 or empty response
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      const offlineMsg = 'No se pudo conectar con el servidor backend (FastAPI en http://localhost:8000). Verifique su conexión.';
      console.warn(`[API Offline] ${endpoint}:`, offlineMsg);
      const networkErr = new Error(offlineMsg);
      networkErr.isNetworkError = true;
      throw networkErr;
    }
    console.warn(`[API] Error on ${endpoint}:`, error.message);
    throw error;
  }
}

// 1. Auth API
export const authApi = {
  login: async (username, password) => {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email: username, password })
    });
  },
  registerClient: async (data) => {
    return await apiRequest('/auth/register-client', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  getUsers: async () => {
    return await apiRequest('/auth/users');
  },
  createUser: async (data) => {
    return await apiRequest('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateUser: async (userId, data) => {
    return await apiRequest(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  updateUserStatus: async (userId, isActive) => {
    return await apiRequest(`/auth/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  },
  deleteUser: async (userId) => {
    return await apiRequest(`/auth/users/${userId}`, {
      method: 'DELETE'
    });
  }
};

// 2. Products API
export const productsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/products${query ? `?${query}` : ''}`);
  },
  getLowStock: async () => {
    return await apiRequest('/products/alerts/low-stock');
  },
  getPurchases: async () => {
    return await apiRequest('/products/purchases');
  },
  getPurchasesSummary: async () => {
    return await apiRequest('/products/purchases/summary');
  },
  create: async (data) => {
    return await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  delete: async (id) => {
    return await apiRequest(`/products/${id}`, {
      method: 'DELETE'
    });
  },
  restock: async (id, quantity) => {
    return await apiRequest(`/products/${id}/restock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    });
  }
};

// 3. Providers API
export const providersApi = {
  getAll: async () => {
    return await apiRequest('/providers');
  },
  getById: async (id) => {
    return await apiRequest(`/providers/${id}`);
  },
  create: async (data) => {
    return await apiRequest('/providers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return await apiRequest(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  delete: async (id) => {
    return await apiRequest(`/providers/${id}`, {
      method: 'DELETE'
    });
  },
  getOfferedProducts: async (providerId) => {
    return await apiRequest(`/providers/${providerId}/offered-products`);
  },
  addOfferedProduct: async (providerId, productData) => {
    return await apiRequest(`/providers/${providerId}/offered-products`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  deleteOfferedProduct: async (providerId, productId) => {
    return await apiRequest(`/providers/${providerId}/offered-products/${productId}`, {
      method: 'DELETE'
    });
  }
};

// 4. Orders API
export const ordersApi = {
  checkout: async (data) => {
    return await apiRequest('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  uploadProof: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();

    const response = await fetch(`${BASE_URL}/orders/upload-proof`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Error al subir el comprobante');
    }
    return await response.json();
  },
  list: async () => {
    return await apiRequest('/orders');
  },
  updateStatus: async (orderId, paymentStatus) => {
    return await apiRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status: paymentStatus })
    });
  },
  getInvoiceUrl: (orderId) => {
    return `${BASE_URL}/orders/${orderId}/invoice-pdf`;
  },
  downloadInvoicePdf: async (orderId) => {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/orders/${orderId}/invoice-pdf`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'No se pudo descargar la factura');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Factura_ChuPetLove_#${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};

// 5. Cards API
export const cardsApi = {
  list: async () => {
    return await apiRequest('/cards');
  },
  create: async (data) => {
    return await apiRequest('/cards', {
      method: 'POST',
      body: JSON.stringify({
        card_number: data.card_number || data.cardNumber,
        card_holder_name: data.card_holder_name || data.cardholder_name || data.cardHolderName,
        user_ci: data.user_ci || data.client_ci || data.userCi
      })
    });
  },
  delete: async (cardId) => {
    return await apiRequest(`/cards/${cardId}`, {
      method: 'DELETE'
    });
  }
};

// 6. Config API (IVA)
export const configApi = {
  getIva: async () => {
    return await apiRequest('/config/iva');
  },
  updateIva: async (ivaPercentage) => {
    return await apiRequest('/config/iva', {
      method: 'PUT',
      body: JSON.stringify({ iva_percentage: ivaPercentage })
    });
  }
};
