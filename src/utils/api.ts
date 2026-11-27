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
    // The retired SaaS paywall no longer intercepts API responses. A 402 from
    // an old deployment is shown as a normal error until every environment is
    // redeployed.

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

  updateProperty: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/properties.php`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
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

  updateUnit: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/units.php`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- BUILDINGS ---
  getBuildings: async (propertyId?: number) => {
    const url = propertyId ? `${API_URL}/buildings.php?property_id=${propertyId}` : `${API_URL}/buildings.php`;
    const res = await fetchWithNetworkError(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  createBuilding: async (data: { property_id: number; name: string; address?: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/buildings.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateBuilding: async (data: { id: number; name?: string; address?: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/buildings.php`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- QR ONBOARDING (staff) ---
  getUnitQrTokens: async (unitId?: number) => {
    const url = unitId ? `${API_URL}/qr_tokens.php?unit_id=${unitId}` : `${API_URL}/qr_tokens.php`;
    const res = await fetchWithNetworkError(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  generateUnitQr: async (data: { unit_id: number; expires_in_days?: number }) => {
    const res = await fetchWithNetworkError(`${API_URL}/qr_tokens.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  revokeUnitQr: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/qr_tokens.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'revoke', id }),
    });
    return handleResponse(res);
  },

  // --- TENANT APPLICATIONS (staff) ---
  getApplications: async (status?: string) => {
    const url = status ? `${API_URL}/applications.php?status=${encodeURIComponent(status)}` : `${API_URL}/applications.php`;
    const res = await fetchWithNetworkError(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  reviewApplication: async (data: {
    id: number;
    action: 'review' | 'reject' | 'approve';
    rejection_reason?: string;
    lease_start?: string;
    lease_end?: string;
    deposit?: number;
    monthly_rent?: number;
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/applications.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- PUBLIC QR ONBOARDING (no session) ---
  lookupOnboardingToken: async (token: string) => {
    const res = await fetchWithNetworkError(
      `${API_URL}/public/onboarding.php?token=${encodeURIComponent(token)}`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    return handleResponse(res);
  },

  submitTenantApplication: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/public/onboarding.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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

  updateTenantRentDueDay: async (id: number, rentDueDay: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/tenants.php`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ id, rent_due_day: rentDueDay }),
    });
    return handleResponse(res);
  },

  // --- TENANCY LIFECYCLE ---
  getTenancies: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/tenancies.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  tenancyAction: async (data: {
    id: number;
    action: 'move_in' | 'notice' | 'cancel_notice' | 'end' | 'renew';
    move_in_date?: string;
    move_out_date?: string;
    reason?: string;
    start_date?: string;
    end_date?: string;
    monthly_rent?: number;
    deposit_required?: number;
    notes?: string;
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/tenancies.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- LEASES (versioned, management-supplied documents) ---
  getLeases: async (params?: { tenant_id?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.tenant_id) query.set('tenant_id', String(params.tenant_id));
    if (params?.status) query.set('status', params.status);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithNetworkError(`${API_URL}/leases.php${suffix}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createLease: async (data: {
    tenant_id: number;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    deposit_required?: number;
    document_url?: string | null;
    title?: string;
    template_reference?: string;
    notes?: string;
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/leases.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'create', ...data }),
    });
    return handleResponse(res);
  },

  updateLease: async (data: {
    id: number;
    start_date?: string;
    end_date?: string;
    monthly_rent?: number;
    deposit_required?: number;
    document_url?: string | null;
    title?: string;
    template_reference?: string;
    notes?: string;
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/leases.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'update', ...data }),
    });
    return handleResponse(res);
  },

  signLease: async (data: {
    id: number;
    party: 'tenant' | 'landlord';
    signer_name: string;
    method?: 'in_person' | 'electronic' | 'scanned';
    evidence_url?: string | null;
    signed_at?: string;
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/leases.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'sign', ...data }),
    });
    return handleResponse(res);
  },

  activateLease: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/leases.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'activate', id }),
    });
    return handleResponse(res);
  },

  deleteLease: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/leases.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete', id }),
    });
    return handleResponse(res);
  },

  // --- DEPOSITS ---
  getDeposits: async (tenantId?: number) => {
    const suffix = tenantId ? `?tenant_id=${tenantId}` : '';
    const res = await fetchWithNetworkError(`${API_URL}/deposits.php${suffix}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  recordDeposit: async (data: {
    tenant_id: number;
    type: 'received' | 'deduction' | 'refund' | 'adjustment';
    amount: number;
    method?: 'cash' | 'eft' | 'other';
    reference?: string;
    notes?: string;
    lease_id?: number;
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/deposits.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- INSPECTIONS ---
  getInspections: async (tenantId?: number) => {
    const suffix = tenantId ? `?tenant_id=${tenantId}` : '';
    const res = await fetchWithNetworkError(`${API_URL}/inspections.php${suffix}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createInspection: async (data: {
    tenant_id: number;
    type: 'move_in' | 'move_out' | 'routine';
    inspected_at?: string;
    notes?: string;
    status?: 'draft' | 'completed';
    lease_id?: number;
    photos?: { url: string; caption?: string }[];
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/inspections.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateInspection: async (data: {
    id: number;
    notes?: string;
    inspected_at?: string;
    status?: 'draft' | 'completed';
    photos?: { url: string; caption?: string }[];
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/inspections.php`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
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

  assignTechnician: async (data: { ticket_id: number; technician_id?: number | null; severity?: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/maintenance.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'assign_technician', ...data }),
    });
    return handleResponse(res);
  },

  updateMaintenanceCostNotes: async (data: { ticket_id: number; actual_cost?: number | null; completion_notes?: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/maintenance.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'update_cost_notes', ...data }),
    });
    return handleResponse(res);
  },

  resolveMaintenance: async (ticket_id: number, completionNotes: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/maintenance.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ticket_id, action: 'resolve', completion_notes: completionNotes }),
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

  approveExpense: async (expenseId: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/expenses.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'approve', expense_id: expenseId }),
    });
    return handleResponse(res);
  },

  rejectExpense: async (expenseId: number, reason: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/expenses.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reject', expense_id: expenseId, reason }),
    });
    return handleResponse(res);
  },

  reverseExpense: async (expenseId: number, reason: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/expenses.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reverse', expense_id: expenseId, reason }),
    });
    return handleResponse(res);
  },

  // --- SUPPLIERS ---
  getSuppliers: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/suppliers.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  addSupplier: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/suppliers.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSupplier: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/suppliers.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete', id }),
    });
    return handleResponse(res);
  },

  // --- BUDGETS ---
  getBudgets: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/budgets.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  addBudget: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/budgets.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteBudget: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/budgets.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'delete', id }),
    });
    return handleResponse(res);
  },

  // --- RENT & RECEIPTS ---
  getRentRecords: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getArrears: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php?view=arrears`, { headers: getHeaders() });
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

  recordCashPayment: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'record_cash', id }),
    });
    return handleResponse(res);
  },

  submitEftProof: async (data: { id: number; proof_url: string; reference?: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'submit_eft', ...data }),
    });
    return handleResponse(res);
  },

  verifyEftPayment: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'verify_eft', id }),
    });
    return handleResponse(res);
  },

  rejectEftPayment: async (id: number, reason: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reject_eft', id, reason }),
    });
    return handleResponse(res);
  },

  reverseRentPayment: async (id: number, reason: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'reverse', id, reason }),
    });
    return handleResponse(res);
  },

  generateRentObligations: async (tenantId: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/rent.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'generate', tenant_id: tenantId }),
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

  // --- STAFF MANAGEMENT ---
  getStaff: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/staff.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getStaffMember: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/staff.php?id=${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createStaff: async (data: {
    full_name: string; email: string; phone?: string; password: string; staff_role: string;
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/staff.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateStaff: async (data: {
    id: number;
    full_name?: string;
    email?: string;
    phone?: string;
    password?: string;
    staff_role?: string;
    is_active?: boolean;
  }) => {
    const res = await fetchWithNetworkError(`${API_URL}/staff.php`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteStaff: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/staff.php`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ id }),
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

  // Upload a management-supplied lease document or signature evidence. Uses
  // Cloudinary's auto endpoint so scanned PDFs and images are both accepted.
  uploadDocument: async (file: File): Promise<string> => {
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) throw new Error('The document must be 10 MB or smaller.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'jumpproptech_preset');

    const res = await fetchWithNetworkError(
      'https://api.cloudinary.com/v1_1/mvy6f66e/auto/upload',
      { method: 'POST', body: formData },
    );

    if (!res.ok) throw new Error('Failed to upload the document. Please try again.');
    const data = await res.json();
    const secureUrl = typeof data.secure_url === 'string' ? data.secure_url : '';
    if (!secureUrl.startsWith('https://res.cloudinary.com/')) {
      throw new Error('Document upload returned an unexpected URL.');
    }
    return secureUrl;
  },

  // --- JUMP FLUX AI ---
  getFluxStatus: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php?action=status`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getFluxConversations: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php?action=conversations`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getFluxConversation: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php?action=conversation&id=${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createFluxConversation: async (title?: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'conversation_create', title }),
    });
    return handleResponse(res);
  },

  updateFluxConversation: async (id: number, title: string) => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'conversation_update', id, title }),
    });
    return handleResponse(res);
  },

  deleteFluxConversation: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'conversation_delete', id }),
    });
    return handleResponse(res);
  },

  clearFluxConversation: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'conversation_clear', id }),
    });
    return handleResponse(res);
  },

  sendFluxMessage: async (data: { conversation_id?: number | null; message: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'chat', ...data }),
    });
    return handleResponse(res);
  },

  captureFluxFeedback: async (data: { conversation_id?: number | null; message_id?: number | null; question?: string; assistant_response?: string; capture_type?: 'unanswered' | 'correction' | 'feedback' | 'mistake'; detail?: string }) => {
    const res = await fetchWithNetworkError(`${API_URL}/flux_ai.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'capture', ...data }),
    });
    return handleResponse(res);
  },

  // --- CONTROL CENTER (Super Administrator) ---
  getControlCenterOverview: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/control_center/overview.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getControlCenterAccounts: async (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    const url = `${API_URL}/control_center/accounts.php${qs.toString() ? `?${qs}` : ''}`;
    const res = await fetchWithNetworkError(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  controlCenterAccountAction: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/control_center/accounts.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getControlCenterAudit: async (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    const url = `${API_URL}/control_center/audit.php${qs.toString() ? `?${qs}` : ''}`;
    const res = await fetchWithNetworkError(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  getControlCenterSessions: async (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    const url = `${API_URL}/control_center/sessions.php${qs.toString() ? `?${qs}` : ''}`;
    const res = await fetchWithNetworkError(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  controlCenterSessionAction: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/control_center/sessions.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getControlCenterTokens: async (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    const url = `${API_URL}/control_center/tokens.php${qs.toString() ? `?${qs}` : ''}`;
    const res = await fetchWithNetworkError(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  controlCenterTokenAction: async (data: any) => {
    const res = await fetchWithNetworkError(`${API_URL}/control_center/tokens.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getControlCenterPermissions: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/control_center/permissions.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  downloadControlCenterExport: async (type: 'accounts' | 'audit', format: 'csv' | 'json' = 'csv') => {
    const token = localStorage.getItem('token');
    const res = await fetchWithNetworkError(`${API_URL}/control_center/export.php?type=${type}&format=${format}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = 'Export failed.';
      try { const data = JSON.parse(text); msg = data.message || msg; } catch {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_export.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // --- LEASE CONTRACT GENERATOR ---
  // Legal wording is always fetched from management-approved templates.
  getContracts: async (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') qs.set(key, String(value));
    });
    const suffix = qs.toString() ? `?${qs}` : '';
    const res = await fetchWithNetworkError(`${API_URL}/contracts.php${suffix}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getContractStats: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/contracts.php?view=stats`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getContract: async (id: number) => {
    const res = await fetchWithNetworkError(`${API_URL}/contracts.php?id=${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  contractAction: async (data: Record<string, unknown>) => {
    const res = await fetchWithNetworkError(`${API_URL}/contracts.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getContractTemplates: async () => {
    const res = await fetchWithNetworkError(`${API_URL}/contract_templates.php`, { headers: getHeaders() });
    return handleResponse(res);
  },

  saveContractTemplate: async (data: Record<string, unknown>) => {
    const res = await fetchWithNetworkError(`${API_URL}/contract_templates.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getContractDocument: async (id: number, type: 'generated' | 'signed' = 'generated') => {
    const res = await fetchWithNetworkError(`${API_URL}/contract_documents.php?id=${id}&type=${type}`, { headers: getHeaders() });
    return handleResponse(res);
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
