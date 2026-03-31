import React, { useState, useEffect } from 'react'
import { User, Shield, Linkedin, Bell, Save, Link2Off } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

const sectionStyle = {
  background: '#111827', border: '1px solid #1e2535',
  borderRadius: 16, padding: 28, marginBottom: 24
}

const inputStyle = {
  width: '100%', padding: '11px 16px',
  background: '#0d1117', border: '1px solid #1e2535',
  borderRadius: 10, color: '#e2e8f0', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
}

const labelStyle = {
  fontSize: 13, fontWeight: 500, color: '#9ca3af',
  marginBottom: 8, display: 'block'
}

export default function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [linkedinConnected, setLinkedinConnected] = useState(false)
  const [notifications, setNotifications] = useState({ replies: true, accepted: true, meetings: true })
  const [saving, setSaving] = useState(false)
  const token = localStorage.getItem('token')
  const uid = localStorage.getItem('uid')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setProfile({ name: data.name || '', email: data.email || '' })
        setLinkedinConnected(!!data.linkedinSession)
      } catch {}
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${API}/user/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectLinkedIn = async () => {
    try {
      await fetch(`${API}/auth/linkedin-disconnect`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      setLinkedinConnected(false)
      toast.success('LinkedIn disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px' }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Settings</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Manage your account and preferences</div>
        </div>

        {/* Profile */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <User size={16} color="#6366f1" />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Profile</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                type="email" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* LinkedIn Connection */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Linkedin size={16} color="#0077b5" />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>LinkedIn Connection</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>
                {linkedinConnected ? 'LinkedIn account connected' : 'No LinkedIn account connected'}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {linkedinConnected
                  ? 'Your session is active and automation is enabled'
                  : 'Connect your LinkedIn to start automated outreach'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {linkedinConnected ? (
                <button onClick={handleDisconnectLinkedIn} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#ef444422', color: '#ef4444',
                  border: '1px solid #ef444433', padding: '9px 16px',
                  borderRadius: 9, fontSize: 13, cursor: 'pointer'
                }}>
                  <Link2Off size={14} /> Disconnect
                </button>
              ) : (
                <a href="/linkedin-connect" style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#0077b5', color: '#fff',
                  border: 'none', padding: '9px 16px',
                  borderRadius: 9, fontSize: 13, cursor: 'pointer', textDecoration: 'none'
                }}>
                  <Linkedin size={14} /> Connect LinkedIn
                </a>
              )}
            </div>
          </div>

          {linkedinConnected && (
            <div style={{
              marginTop: 20, padding: 16, background: '#0d1117',
              borderRadius: 10, display: 'flex', gap: 24
            }}>
              {[
                { label: 'Dedicated IP', value: 'Assigned', color: '#10b981' },
                { label: 'Session Status', value: 'Active', color: '#10b981' },
                { label: 'Daily Limit', value: '20 / day', color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Shield size={16} color="#10b981" />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Security</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>New Password</label>
            <input type="password" placeholder="Leave blank to keep current" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" placeholder="Confirm new password" style={inputStyle} />
          </div>
        </div>

        {/* Notifications */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Bell size={16} color="#f59e0b" />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Notifications</div>
          </div>
          {[
            { key: 'replies', label: 'New replies', desc: 'When a prospect replies to your message' },
            { key: 'accepted', label: 'Connection accepted', desc: 'When a connection request is accepted' },
            { key: 'meetings', label: 'Meetings booked', desc: 'When a prospect agrees to a call' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', borderBottom: '1px solid #1e2535'
            }}>
              <div>
                <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{desc}</div>
              </div>
              <div onClick={() => setNotifications(p => ({ ...p, [key]: !p[key] }))} style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative',
                background: notifications[key] ? '#10b981' : '#1e2535', transition: 'background 0.2s'
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: notifications[key] ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          width: '100%', background: '#10b981', color: '#fff', border: 'none',
          padding: '14px', borderRadius: 12, fontSize: 15,
          fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1
        }}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
