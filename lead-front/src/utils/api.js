const BASE = import.meta.env.VITE_API_DB_URL

/**
 * Drop-in replacement for fetch() across the entire app.
 * - Always sends the HttpOnly cookie (credentials: 'include')
 * - Always sets Content-Type: application/json
 * - Auto-redirects to /login on 401
 * - Returns the raw Response so callers can still do res.json(), res.ok, etc.
 */
export async function apiFetch(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        credentials: 'include',         // send HttpOnly cookie on every request
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,         // allow callers to override/add headers
        },
    })

    // Session expired or not authenticated — redirect to login
    if (res.status === 401) {
        localStorage.removeItem('uid')
        window.location.href = '/login'
        return res
    }

    return res
}