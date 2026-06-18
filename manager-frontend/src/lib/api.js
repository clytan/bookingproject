export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost/bookingproject/api';

const KEY = 'manager_token';

export function getToken()   { return typeof window !== 'undefined' ? localStorage.getItem(KEY) : null; }
export function setToken(t)  { if (typeof window !== 'undefined') localStorage.setItem(KEY, t); }
export function clearToken() { if (typeof window !== 'undefined') localStorage.removeItem(KEY); }

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function qs(params) {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  ).toString();
  return s ? `?${s}` : '';
}

export const api = {
  login:  (username, password) => request('/manager/login.php', { method: 'POST', body: { username, password } }),
  me:     () => request('/manager/me.php', { auth: true }),
  stats:  () => request('/manager/stats.php', { auth: true }),

  roomsList:   () => request('/manager/rooms/list.php', { auth: true }),
  roomSave:    (payload) => request('/manager/rooms/save.php',   { method: 'POST', body: payload, auth: true }),
  roomDelete:  (id) => request('/manager/rooms/delete.php', { method: 'POST', body: { id }, auth: true }),

  bookingsList:  (filters = {}) => request(`/manager/bookings/list.php${qs(filters)}`, { auth: true }),
  bookingCreate: (payload)      => request('/manager/bookings/create.php', { method: 'POST', body: payload, auth: true }),
  bookingStatus: (id, status)   => request('/manager/bookings/status.php', { method: 'POST', body: { id, status }, auth: true }),

  availability: (params) => request(`/hotels/availability.php${qs(params)}`),

  hotelGet:  () => request('/manager/hotel/get.php', { auth: true }),
  hotelSave: (payload) => request('/manager/hotel/save.php', { method: 'POST', body: payload, auth: true }),
  analytics: (range = {}) => request(`/manager/analytics.php${qs(range)}`, { auth: true }),
};
