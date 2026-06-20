import React, { useState, useEffect, createContext, useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Login           from './Pages/Login'
import Register        from './Pages/Register'
import VerifyEmail     from './Components/verifyEmail'
import VerifyLinkedin  from './Components/verifyLinkedin'
import LinkedIn        from './Pages/LinkedIn'
import ConnectLinkedIn from './Pages/ConnectLinkedIn'
import OAuthCallback   from './Pages/OAuthCallback'
import Layout          from './Pages/Layout'
import Dashboard       from './Pages/Dashboard'
import Campaigns       from './Pages/Campaigns'
import NewCampaign     from './Pages/NewCampaign'
import Leads           from './Pages/Leads'
import Inbox           from './Pages/Inbox'
import Analytics       from './Pages/Analytics'
import Settings        from './Pages/Settings'
import Profile         from './Pages/Profile'
import SequenceBuilder from './Pages/SequenceBuilder'
import SetupProfile    from './Pages/SetupProfile'
import Landing         from './Pages/Landing'

// ── Exported so Login/VerifyEmail/OAuthCallback can call setStatus ───────────
export const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'unauth'

  useEffect(() => {
    const token   = localStorage.getItem('token')
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    fetch(import.meta.env.VITE_API_DB_URL + '/auth/me', {
      credentials: 'include',
      headers,
    })
      .then(res => setStatus(res.ok ? 'ok' : 'unauth'))
      .catch(() => setStatus('unauth'))
  }, [])

  return (
    <AuthContext.Provider value={{ status, setStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

function Protected({ children }) {
  const { status } = useContext(AuthContext)
  if (status === 'loading') return null
  if (status === 'unauth')  return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ── Public routes ─────────────────────────────────────────────── */}
        <Route path="/"               element={<Landing />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/verify-email"   element={<VerifyEmail />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* ── Protected but full-screen (no sidebar) ──────────────────────── */}
        <Route path="/connect-linkedin"
          element={<Protected><ConnectLinkedIn /></Protected>} />
        <Route path="/linkedin-connect-legacy"
          element={<Protected><LinkedIn /></Protected>} />
        <Route path="/verify-linkedin"
          element={<Protected><VerifyLinkedin /></Protected>} />
        <Route path="/campaigns/new/sequence"
          element={<Protected><SequenceBuilder /></Protected>} />
        <Route path="/campaigns/:campaignId/sequence"
          element={<Protected><SequenceBuilder /></Protected>} />
        <Route path="/setup-profile"
          element={<Protected><SetupProfile /></Protected>} />

        {/* ── Protected routes with sidebar ───────────────────────────────── */}
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/dashboard"                     element={<Dashboard />} />
          <Route path="/campaigns"                     element={<Campaigns />} />
          <Route path="/campaigns/new"                 element={<NewCampaign />} />
          <Route path="/campaigns/:campaignId/leads"   element={<Leads />} />
          <Route path="/leads"                         element={<Leads />} />
          <Route path="/inbox"                         element={<Inbox />} />
          <Route path="/analytics"                     element={<Analytics />} />
          <Route path="/settings"                      element={<Settings />} />
          <Route path="/profile"                       element={<Profile />} />
          <Route path="*"
            element={<Navigate to="/dashboard" replace />} />
        </Route>

      </Routes>
    </AuthProvider>
  )
}