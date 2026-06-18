export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost/bookingproject/api';

const KEY = 'operator_token';

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
  login:  (username, password) => request('/operator/login.php', { method: 'POST', body: { username, password } }),
  me:     () => request('/operator/me.php', { auth: true }),
  stats:  () => request('/operator/stats.php', { auth: true }),

  activitiesList:  () => request('/operator/activities/list.php', { auth: true }),
  activityGet:     (id) => request(`/operator/activities/get.php${qs({ id })}`, { auth: true }),
  activitySave:    (payload) => request('/operator/activities/save.php', { method: 'POST', body: payload, auth: true }),
  activityDelete:  (id) => request('/operator/activities/delete.php', { method: 'POST', body: { id }, auth: true }),

  slotsList:    (activity_id = 0) => request(`/operator/slots/list.php${qs({ activity_id })}`, { auth: true }),
  slotSave:     (payload) => request('/operator/slots/save.php',   { method: 'POST', body: payload, auth: true }),
  slotDelete:   (id) => request('/operator/slots/delete.php', { method: 'POST', body: { id }, auth: true }),

  bookingsList:  (filters = {}) => request(`/operator/bookings/list.php${qs(filters)}`, { auth: true }),
  bookingCreate: (payload)      => request('/operator/bookings/create.php', { method: 'POST', body: payload, auth: true }),
  bookingStatus: (id, status)   => request('/operator/bookings/status.php', { method: 'POST', body: { id, status }, auth: true }),

  availability: (params) => request(`/activities/availability.php${qs(params)}`),
};
