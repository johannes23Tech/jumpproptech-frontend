import { validateImageFile } from './security';

const API_URL = import.meta.env.DEV ? '/api' : 'https://jumpproptech-api.onrender.com/api';

const fetchWithNetworkError = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  try {
    return await globalThis.fetch(input, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Could not reach the service. Check your connection and try again.');
    }
    throw error;
  }
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const handleResponse = async (res: Response) => {
  const text = await res.text();
  let data;

  // 1. Try to parse the JSON
  try {
    data = JSON.parse(text);
  } catch {
    // Log details only in development so server internals are never shown to users.
    if (import.meta.env.DEV) {
      console.error(`Non-JSON response (${res.status}):`, text.slice(0, 500));
    }
    throw new Error('The server returned an unexpected response. Please try again.');
  }

  // 2. Handle error responses
  if (!res.ok) {
    // GLOBAL PAYWALL INTERCEPTOR
    if (res.status === 402) {
      window.location.href = '/paywall';
    }

    // Session expired/invalid: drop the locally cached credentials.
    if (res.status === 401) {
      const hadToken = Boolean(localStorage.getItem('token'));
      clearSession();
      if (hadToken && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Never surface raw response bodies or internal `details`; rely only on
    // the API's user-safe message.
    const safeMessage = typeof data?.message === 'string'
      ? data.message
      : (typeof data?.error === 'string' ? data.error : '');
    const requestId = res.status >= 500
      && typeof data?.request_id === 'string'
      && /^[a-f0-9]{16}$/i.test(data.request_id)
      ? ` (Reference: ${data.request_id})`
      : '';
    throw new Error(`${safeMessage || `Request failed (${res.status}).`}${requestId}`);
  }

  return data;
};

export const api = {
  // --- AUTHENTICATION ---
  login: async (email: string, password: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  mfaLogin: async (data: { mfa_token: string; code: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/mfa_login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  mfaStatus: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/mfa_status.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  mfaSetup: async (password: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/mfa_setup.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse(res);
  },

  mfaEnable: async (code: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/mfa_enable.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code }),
    });
    return handleResponse(res);
  },

  mfaDisable: async (password: string, code: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/mfa_disable.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ password, code }),
    });
    return handleResponse(res);
  },

  register: async (userData: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  forgotPassword: async (email: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/forgot_password.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/reset_password.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  changePassword: async (data: { currentPassword: string, newPassword: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/auth/change_password.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- SUPER ADMIN ---
  getSuperAdminStats: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/admin/stats.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  toggleSubscription: async (data: { landlord_id: number, status: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/admin/toggle_sub.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  createLandlord: async (data: { full_name: string, email: string, password: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/admin/create_landlord.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  // --- DASHBOARD & ANALYTICS ---
  getDashboardStats: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/dashboard.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // --- PROPERTIES ---
  getProperties: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/properties.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createProperty: async (propertyData: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/properties.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(propertyData),
    });
    return handleResponse(res);
  },

  // --- UNITS / ROOMS ---
  getUnits: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/units.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createUnit: async (unitData: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/units.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(unitData),
    });
    return handleResponse(res);
  },

  // --- TENANTS ---
  getTenants: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/tenants.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createTenant: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/tenants.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  // --- TENANT DATA (Tenant Side) ---
  getTenantData: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/tenant_data.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getTenantProfile: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/tenant_profile.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  updateTenantProfile: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/tenant_profile.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  // --- MAINTENANCE & FINANCE ---
  getMaintenanceData: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/maintenance.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  logMaintenance: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/maintenance.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  assignContractor: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/maintenance.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  resolveMaintenance: async (ticket_id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/maintenance.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ ticket_id, status: 'Resolved' }) 
    });
    return handleResponse(res);
  },

  addContractor: async (data: { name: string, trade: string, phone: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/maintenance.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...data, action: 'add_contractor' }),
    });
    return handleResponse(res);
  },

  getExpenses: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/expenses.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  addExpense: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/expenses.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  // --- RENT & RECEIPTS ---
  getRentRecords: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  payRent: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  sendReceiptEmail: async (data: { email: string, receipt_number: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/send_receipt.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  // --- MESSAGING ---
  getMessages: async (tenantId?: number) => {
    const url = tenantId ? `${API_URL}/messages.php?tenant_id=${tenantId}` : `${API_URL}/messages.php`;
    const res = await fetchWithNetworkError(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  sendMessage: async (data: { receiver_id: number, tenant_id: number, message: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/messages.php`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },

  getFaqBotQuestions: async (): Promise<{ faqs: { id: string, question: string }[] }> => {
    const res = await fetchWithNetworkError(`${API_URL}/faq_bot.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  askFaqBot: async (question: string): Promise<{ faq_id: string | null, answer: string }> => {
    const res = await fetchWithNetworkError(`${API_URL}/faq_bot.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question }),
    });
    return handleResponse(res);
  },

  // --- CLOUDINARY IMAGE UPLOAD (Optimized) ---
  uploadImage: async (file: File) => {
    const fileError = validateImageFile(file);
    if (fileError) throw new Error(fileError);

    const formData = new FormData();
    formData.append('file', file);
    
    const cloudName = 'mvy6f66e';
    const uploadPreset = 'jumpproptech_preset'; 

    formData.append('upload_preset', uploadPreset);

    const res = await fetchWithNetworkError(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) throw new Error('Failed to upload image. Please try again.');
    const data = await res.json();

    const secureUrl = typeof data.secure_url === 'string' ? data.secure_url : '';
    if (!secureUrl.startsWith('https://res.cloudinary.com/')) {
      throw new Error('Image upload returned an unexpected URL.');
    }
    
    // Auto-compress and resize the image URL
    return secureUrl.replace('/upload/', '/upload/q_auto,f_auto,w_1000/');
  },

  // --- LOCAL STORAGE ---
  getUser: () => {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      // Do not keep a corrupted/tampered session blob around.
      localStorage.removeItem('user');
      return null;
    }
  }
};
