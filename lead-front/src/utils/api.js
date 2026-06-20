const BASE = import.meta.env.VITE_API_DB_URL

/**
 * Central fetch wrapper for all API calls.
 *
 * - Always sends HttpOnly cookie (credentials: 'include')
 * - Also sends Authorization header if token exists in localStorage
 *   (fallback for local dev where cross-origin cookies don't work)
 * - Auto-redirects to /login on 401
 */
export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Attach token as Authorization header if available
  // This makes local dev work even when cookies can't be sent cross-origin
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',   // always try to send cookie too
    headers,
  })

  // Session expired or not authenticated — clear and redirect
  if (res.status === 401) {
    localStorage.removeItem('uid')
    localStorage.removeItem('token')
    window.location.href = '/login'
    return res
  }

  return res
}