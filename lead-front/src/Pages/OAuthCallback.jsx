/**
 * OAuthCallback.jsx
 * Landing page after LinkedIn OAuth redirect.
 * Reads uid + token from URL, stores them, updates AuthContext, redirects.
 */
import React, { useEffect, useContext } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthContext } from '../App'
import { notifyExtension } from '../utils/extensionBridge'

export default function OAuthCallback() {
  const navigate             = useNavigate()
  const [params]             = useSearchParams()
  const { setStatus }        = useContext(AuthContext)

  useEffect(() => {
    const mode    = params.get('mode')
    const uid     = params.get('uid')
    const token   = params.get('token')
    const success = params.get('success')
    const error   = params.get('error')

    if (error) {
      navigate(`/login?error=${error}`, { replace: true })
      return
    }

    if (mode === 'login' && uid && token) {
      // Store for local dev fallback (cookie set by server for production)
      localStorage.setItem('uid',   uid)
      localStorage.setItem('token', token)

      // Sync auth to the StealthLead browser extension (if installed)
      notifyExtension(uid, token)

      // Tell AuthContext user is authenticated
      setStatus('ok')
      navigate('/dashboard', { replace: true })
      return
    }

    if (mode === 'import' && success) {
      // Profile imported — go back to profile page
      navigate('/profile?imported=true', { replace: true })
      return
    }

    // Fallback
    navigate('/dashboard', { replace: true })
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', gap: 16
    }}>
      <svg style={{ animation: 'spin 1s linear infinite', width: 36, height: 36, color: '#10b981' }}
        viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
        <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity="0.75"/>
      </svg>
      <div style={{ color: '#6b7280', fontSize: 14 }}>Completing sign in...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}