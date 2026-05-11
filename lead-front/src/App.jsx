import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Login          from './Pages/Login'
import Register       from './Pages/Register'
import VerifyEmail    from './Components/verifyEmail'
import VerifyLinkedin from './Components/verifyLinkedin'
import LinkedIn       from './Pages/LinkedIn'
import Test           from './Pages/Test'

import Layout         from './Pages/Layout'
import Dashboard      from './Pages/Dashboard'
import Campaigns      from './Pages/Campaigns'
import NewCampaign    from './Pages/Newcampaign'
import Leads          from './Pages/Leads'
import Inbox          from './Pages/Inbox'
import Analytics      from './Pages/Analytics'
import Settings       from './Pages/Settings'
import Profile        from './Pages/Profile'
import SequenceBuilder from './Pages/SequenceBuilder'
import SetupProfile from './Pages/SetupProfile'
import Landing from './Pages/Landing'

// ── Auth guard ────────────────────────────────────────────────────────────────
function Protected({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
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
      <Route path="/test"             element={<Test />} />

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
        <Route path="/"                              element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"                     element={<Dashboard />} />
        <Route path="/campaigns"                     element={<Campaigns />} />
        <Route path="/campaigns/new"                 element={<NewCampaign />} />
        <Route path="/campaigns/:campaignId/leads"   element={<Leads />} />
        <Route path="/leads"                         element={<Leads />} />
        <Route path="/inbox"                         element={<Inbox />} />
        <Route path="/analytics"                     element={<Analytics />} />
        <Route path="/settings"                      element={<Settings />} />
        <Route path="/profile"                       element={<Profile />} />
        <Route path="*"                              element={<Navigate to="/dashboard" replace />} />
      </Route>

    </Routes>
  )
}