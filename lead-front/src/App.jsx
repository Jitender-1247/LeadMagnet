
import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './Pages/Dashboard'
import Login from './Pages/Login'
import Test from './Pages/Test'
import LinkedIn from './Pages/LinkedIn'
import Register from './Pages/Register'
import VerifyEmail from './Components/verifyEmail'
import VerifyLinkedin from './Components/verifyLinkedin'
import Campaigns from './Pages/Campaigns'
import Leads from './Pages/Leads'
import Inbox from './Pages/Inbox'
import Analytics from './Pages/Analytics'
import Settings from './Pages/Settings'
import NewCampaign from './Pages/Newcampaign'
import Profile from './Pages/Profile'

function Protected({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/"                    element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"               element={<Login />} />
      <Route path="/test"                element={<Test />} />
      <Route path="/register"            element={<Register />} />
      <Route path="/verify-email"        element={<VerifyEmail />} />
      <Route path="/connect-linkedin"    element={<Protected><LinkedIn /></Protected>} />
      <Route path="/verify-linkedin"     element={<Protected><VerifyLinkedin /></Protected>} />
      <Route path="/dashboard"           element={<Protected><Dashboard /></Protected>} />
      <Route path="/campaigns"           element={<Protected><Campaigns /></Protected>} />
      <Route path="/campaigns/new"       element={<Protected><NewCampaign /></Protected>} />
      <Route path="/campaigns/:campaignId/leads" element={<Protected><Leads /></Protected>} />
      <Route path="/leads" element={<Protected><Leads /></Protected>} />
      <Route path="/inbox"               element={<Protected><Inbox /></Protected>} />
      <Route path="/analytics"           element={<Protected><Analytics /></Protected>} />
      <Route path="/settings"            element={<Protected><Settings /></Protected>} />
      <Route path="/profile"            element={<Protected><Profile /></Protected>} />
      <Route path="*"                    element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  )
}
