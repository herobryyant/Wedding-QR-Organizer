export type Guest = { id: string; name: string; tableName: string; updatedAt?: string };
export type GuestInput = { name: string; tableName: string };
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const TOKEN_KEY = 'seatfinder-organizer-token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function request<T>(path: string, options: RequestInit = {}, admin = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (admin) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; detail?: string } | null;
    if (response.status === 401 && admin) sessionStorage.removeItem(TOKEN_KEY);
    throw new ApiError(body?.message ?? body?.detail ?? `Request failed (${response.status})`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  lookup: (name: string) => request<Guest[]>(`/public/lookup?name=${encodeURIComponent(name)}`),
  login: (password: string) => request<{ token: string; expiresIn: string }>('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<void>('/admin/logout', { method: 'POST' }, true),
  guests: () => request<Guest[]>('/admin/guests', {}, true),
  stats: () => request<{ guests: number; tables: number }>('/admin/stats', {}, true),
  createGuest: (guest: GuestInput) => request<Guest>('/admin/guests', { method: 'POST', body: JSON.stringify(guest) }, true),
  updateGuest: (id: string, guest: GuestInput) => request<Guest>(`/admin/guests/${id}`, { method: 'PATCH', body: JSON.stringify(guest) }, true),
  deleteGuest: (id: string) => request<void>(`/admin/guests/${id}`, { method: 'DELETE' }, true),
  importGuests: (guests: GuestInput[]) => request<{ imported: number }>('/admin/guests/import', { method: 'POST', body: JSON.stringify({ guests }) }, true),
};

export const tokenKey = TOKEN_KEY;
