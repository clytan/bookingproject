// =============================================================
// User-side API client
// Talks to the PHP backend served by XAMPP Apache.
// =============================================================

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost/bookingproject/api';

const TOKEN_KEY = 'user_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
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
  register: (payload) => request('/users/register.php', { method: 'POST', body: payload }),
  login:    (email, password) => request('/users/login.php', { method: 'POST', body: { email, password } }),
  me:       () => request('/users/me.php', { auth: true }),

  // Email OTP
  otpRequest: (email, purpose) => request('/users/otp/request.php', { method: 'POST', body: { email, purpose } }),
  otpVerify:  (payload)        => request('/users/otp/verify.php',  { method: 'POST', body: payload }),

  hotelsList:   (city = '') => request(`/hotels/list.php${qs({ city })}`),
  hotelsSearch: (params)    => request(`/hotels/search.php${qs(params)}`),
  hotelGet:     (id)        => request(`/hotels/get.php${qs({ id })}`),
  hotelBook:    (payload)   => request('/hotels/book.php', { method: 'POST', body: payload, auth: true }),
  hotelAvailability: (params) => request(`/hotels/availability.php${qs(params)}`),
  myBookings:   () => request('/users/my-bookings.php', { auth: true }),
  cancelBooking: (id) => request('/users/cancel-booking.php', { method: 'POST', body: { id }, auth: true }),

  // Water activities
  activitiesList:        (params = {}) => request(`/activities/list.php${qs(params)}`),
  activityGet:           (id) => request(`/activities/get.php${qs({ id })}`),
  activityAvailability:  (params) => request(`/activities/availability.php${qs(params)}`),
  activityBook:          (payload) => request('/activities/book.php', { method: 'POST', body: payload, auth: true }),

  // Water sports companies (public)
  operatorsList:         (params = {}) => request(`/operators/list.php${qs(params)}`),
  operatorGet:           (id, params = {}) => request(`/operators/get.php${qs({ id, ...params })}`),
  activityBookMany:      (items) => request('/activities/book-many.php', { method: 'POST', body: { items }, auth: true }),
};
