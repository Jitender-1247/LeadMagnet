import React, { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Login           from './Pages/Login'
import Register        from './Pages/Register'
import VerifyEmail     from './Components/verifyEmail'
import VerifyLinkedin  from './Components/verifyLinkedin'
import LinkedIn        from './Pages/LinkedIn'

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

// ── Auth guard ────────────────────────────────────────────────────────────────
// Checks the HttpOnly cookie via /auth/me instead of reading localStorage.
// Shows nothing (null) while the check is in flight to avoid a flash of /login.
function Protected({ children }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'unauth'

  useEffect(() => {
    fetch(import.meta.env.VITE_API_DB_URL + '/auth/me', {
      credentials: 'include'
    })
      .then(res => {
        setStatus(res.ok ? 'ok' : 'unauth')
      })
      .catch(() => setStatus('unauth'))
  }, [])

  if (status === 'loading') return null       // blank while checking — no flicker
  if (status === 'unauth')  return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>

      {/* ── Public routes — no sidebar, no auth required ── */}
      <Route path="/"                 element={<Landing />} />
      <Route path="/login"            element={<Login />} />
      <Route path="/register"         element={<Register />} />
      <Route path="/verify-email"     element={<VerifyEmail />} />
      <Route path="/connect-linkedin" element={<Protected><LinkedIn /></Protected>} />
      <Route path="/verify-linkedin"  element={<Protected><VerifyLinkedin /></Protected>} />

      {/* ── Sequence builder — protected but full screen (no sidebar) ── */}
      <Route path="/campaigns/new/sequence"
        element={<Protected><SequenceBuilder /></Protected>}
      />
      <Route path="/campaigns/:campaignId/sequence"
        element={<Protected><SequenceBuilder /></Protected>}
      />
      <Route path="/setup-profile" element={<Protected><SetupProfile /></Protected>} />

      {/* ── Protected routes — sidebar on all pages via Layout ── */}
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/"                            element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"                   element={<Dashboard />} />
        <Route path="/campaigns"                   element={<Campaigns />} />
        <Route path="/campaigns/new"               element={<NewCampaign />} />
        <Route path="/campaigns/:campaignId/leads" element={<Leads />} />
        <Route path="/leads"                       element={<Leads />} />
        <Route path="/inbox"                       element={<Inbox />} />
        <Route path="/analytics"                   element={<Analytics />} />
        <Route path="/settings"                    element={<Settings />} />
        <Route path="/profile"                     element={<Profile />} />
        <Route path="*"                            element={<Navigate to="/dashboard" replace />} />
      </Route>

    </Routes>
  )
}