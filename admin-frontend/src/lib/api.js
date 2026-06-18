// =============================================================
// API client — points to PHP backend
// In dev (XAMPP on port 80): http://localhost/bookingproject/api
// In production on GoDaddy: /api (same origin)
// Override with NEXT_PUBLIC_API_URL env var.
// =============================================================

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost/bookingproject/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function setToken(token) {
  if (typeof window !== 'undefined') localStorage.setItem('admin_token', token);
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem('admin_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function qs(params) {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  ).toString();
  return s ? `?${s}` : '';
}

export const api = {
  adminLogin: (username, password) =>
    request('/admin/login.php', { method: 'POST', body: { username, password } }),
  adminMe: () => request('/admin/me.php', { auth: true }),

  adminHotelsList:        () => request('/admin/hotels/list.php', { auth: true }),
  adminHotelGet:          (id) => request(`/admin/hotels/get.php${qs({ id })}`, { auth: true }),
  adminHotelSave:         (payload) => request('/admin/hotels/save.php', { method: 'POST', body: payload, auth: true }),
  adminHotelDelete:       (id) => request('/admin/hotels/delete.php', { method: 'POST', body: { id }, auth: true }),
  adminRoomsList:         (hotel_id = 0) => request(`/admin/rooms/list.php${qs({ hotel_id })}`, { auth: true }),
  adminRoomSave:          (payload) => request('/admin/rooms/save.php', { method: 'POST', body: payload, auth: true }),
  adminRoomDelete:        (id) => request('/admin/rooms/delete.php', { method: 'POST', body: { id }, auth: true }),
  adminHotelBookingsList: (range = {}) => request(`/admin/hotel-bookings/list.php${qs(range)}`, { auth: true }),
  adminAnalytics:         (range = {}) => request(`/admin/analytics.php${qs(range)}`, { auth: true }),

  // Water Activities
  adminActivitiesList:    () => request('/admin/activities/list.php', { auth: true }),
  adminActivityGet:       (id) => request(`/admin/activities/get.php${qs({ id })}`, { auth: true }),
  adminActivitySave:      (payload) => request('/admin/activities/save.php', { method: 'POST', body: payload, auth: true }),
  adminActivityDelete:    (id) => request('/admin/activities/delete.php', { method: 'POST', body: { id }, auth: true }),
  adminSlotsList:         (activity_id = 0) => request(`/admin/activity-slots/list.php${qs({ activity_id })}`, { auth: true }),
  adminSlotSave:          (payload) => request('/admin/activity-slots/save.php', { method: 'POST', body: payload, auth: true }),
  adminSlotDelete:        (id) => request('/admin/activity-slots/delete.php', { method: 'POST', body: { id }, auth: true }),
  adminActivityBookingsList: (range = {}) => request(`/admin/activity-bookings/list.php${qs(range)}`, { auth: true }),

  // Water sports companies (operators)
  adminOperatorsList:  () => request('/admin/operators/list.php', { auth: true }),
  adminOperatorGet:    (id) => request(`/admin/operators/get.php${qs({ id })}`, { auth: true }),
  adminOperatorSave:   (payload) => request('/admin/operators/save.php', { method: 'POST', body: payload, auth: true }),
  adminOperatorDelete: (id) => request('/admin/operators/delete.php', { method: 'POST', body: { id }, auth: true }),
};
