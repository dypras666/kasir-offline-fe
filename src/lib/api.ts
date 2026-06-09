const API_BASE = import.meta.env.VITE_API_URL || '';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(
      data?.message || `HTTP ${res.status}`,
      res.status,
      data
    );
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PUT', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  tenant_id: number | null;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password, device_name: 'erp-web' }),
  logout: () =>
    api.post<{ message: string }>('/auth/logout'),
  me: () =>
    api.get<{ data: AuthUser }>('/auth/me'),
};

// Dashboard Types
export interface DashboardData {
  stats: {
    total_sales: string;
    sales_change: string;
    pending_payables: string;
    payable_invoices: number;
    low_stock: number;
    total_customers: number;
    today_customers: number;
  };
  recent_invoices: Array<{
    id: number;
    invoice_number: string;
    customer_name: string;
    status: string;
    total: string;
    created_at: string;
  }>;
  aging_summary: Array<{
    range: string;
    total: string;
    count: number;
  }>;
}

// Branch Types
export interface Branch {
  id: number;
  name: string;
  type: string;
  address: string;
  phone: string;
  code: string;
  is_active: boolean;
}

// Account Types
export interface Account {
  id: number;
  code: string;
  name: string;
  parent_id: number | null;
  level: number;
  type: string;
  is_active: boolean;
  children?: Account[];
}

// User / Role Types
export interface UserData {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export interface RoleData {
  id: number;
  name: string;
  permissions: string[];
}

// API Modules
export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
};

export const userApi = {
  list: () => api.get<UserData[]>('/users'),
  get: (id: number) => api.get<UserData>(`/users/${id}`),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<UserData>('/users', data),
  update: (id: number, data: { name?: string; email?: string; password?: string; role?: string }) =>
    api.put<UserData>(`/users/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/users/${id}`),
  assignRole: (id: number, role: string) =>
    api.post<{ message: string }>(`/users/${id}/assign-role`, { role }),
  roles: () => api.get<RoleData[]>('/roles'),
};
