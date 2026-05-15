import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Lock, Linkedin, Shield,
  Save, Link2Off, ArrowLeft, CheckCircle,
  XCircle, Zap, Users, MessageSquare, Award
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

const inputStyle = {
  width: '100%', padding: '11px 16px',
  background: '#0d1117', border: '1px solid #1e2535',
  borderRadius: 10, color: '#e2e8f0', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.2s'
}

const labelStyle = {
  fontSize: 12, fontWeight: 500, color: '#6b7280',
  marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em'
}

const cardStyle = {
  background: '#111827', border: '1px solid #1e2535',
  borderRadius: 16, padding: 28, marginBottom: 20
}

function StatBadge({ label, value, color, icon: Icon }) {
  return (
    <div style={{
      background: '#0d1117', borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14, flex: 1
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: color + '22', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edit profile state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch(`${API}/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/user/stats`,   { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const profileData = await profileRes.json()
      const statsData   = await statsRes.json()
      setProfile(profileData)
      setStats(statsData)
      setName(profileData.name || '')
      setEmail(profileData.email || '')
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!name && !email) { toast.error('Nothing to update'); return }
    setSavingProfile(true)
    try {
      const res = await fetch(`${API}/user/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Profile updated!')
        setProfile(prev => ({ ...prev, name, email }))
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required'); return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match'); return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return
    }
    setSavingPassword(true)
    try {
      const res = await fetch(`${API}/user/change-password`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password changed!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.error || 'Failed to change password')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDisconnectLinkedIn = async () => {
    try {
      const res = await fetch(`${API}/user/linkedin-disconnect`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('LinkedIn disconnected')
        setProfile(prev => ({ ...prev, linkedinConnected: false, linkedinEmail: null, linkedinConnectedAt: null }))
      }
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4b5563' }}>Loading profile...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" position="top-right" />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: '#1a1f2e', border: '1px solid #1e2535', color: '#9ca3af',
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Profile</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Manage your account</div>
          </div>
        </div>

        {/* Avatar + name card */}
        <div style={{
          ...cardStyle,
          display: 'flex', alignItems: 'center', gap: 24
        }}>
          {/* Avatar — shows uploaded photo, LinkedIn photo, or initial */}
          {(profile?.profileImage || profile?.linkedinProfileImage) ? (
            <img
              src={profile.profileImage || profile.linkedinProfileImage}
              alt={profile?.name || 'avatar'}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                objectFit: 'cover', flexShrink: 0,
                border: '3px solid #10b98133',
                boxShadow: '0 0 20px #10b98122'
              }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #6366f1)',
            display: (profile?.profileImage || profile?.linkedinProfileImage) ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#fff', flexShrink: 0,
            boxShadow: '0 0 20px #10b98122'
          }}>
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{profile?.name}</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{profile?.email}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: profile?.isVerified ? '#10b98122' : '#f59e0b22',
                color: profile?.isVerified ? '#10b981' : '#f59e0b'
              }}>
                {profile?.isVerified
                  ? <><CheckCircle size={12} /> Verified</>
                  : <><XCircle size={12} /> Unverified</>
                }
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: profile?.linkedinConnected ? '#0077b522' : '#1e2535',
                color: profile?.linkedinConnected ? '#0ea5e9' : '#4b5563'
              }}>
                <Linkedin size={12} />
                {profile?.linkedinConnected ? 'LinkedIn Connected' : 'LinkedIn Not Connected'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#4b5563', textAlign: 'right' }}>
            <div>Member since</div>
            <div style={{ color: '#9ca3af', marginTop: 4 }}>
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <StatBadge label="Campaigns"    value={stats.totalCampaigns} color="#6366f1" icon={Zap} />
            <StatBadge label="Total Leads"  value={stats.totalLeads}     color="#10b981" icon={Users} />
            <StatBadge label="Replies"      value={stats.replied}        color="#f59e0b" icon={MessageSquare} />
            <StatBadge label="Meetings"     value={stats.meetings}       color="#ec4899" icon={Award} />
          </div>
        )}

        {/* Edit profile */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={15} color="#6366f1" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Personal Info</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#1e2535'}
              />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#1e2535'}
              />
            </div>
          </div>

          <button onClick={handleSaveProfile} disabled={savingProfile} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#6366f1', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: 10, fontSize: 13,
            fontWeight: 600, cursor: 'pointer', opacity: savingProfile ? 0.7 : 1
          }}>
            <Save size={14} />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* LinkedIn connection */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0077b522', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Linkedin size={15} color="#0ea5e9" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>LinkedIn Account</div>
          </div>

          {profile?.linkedinConnected ? (
            <div>
              <div style={{ background: '#0d1117', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Connected</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>
                      {profile.linkedinEmail || 'LinkedIn account active'}
                    </div>
                    {profile.linkedinConnectedAt && (
                      <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                        Connected {new Date(profile.linkedinConnectedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button onClick={handleDisconnectLinkedIn} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#ef444415', color: '#ef4444',
                    border: '1px solid #ef444430', padding: '9px 16px',
                    borderRadius: 9, fontSize: 13, cursor: 'pointer'
                  }}>
                    <Link2Off size={14} /> Disconnect
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Dedicated IP', value: 'Assigned', color: '#10b981' },
                  { label: 'Session',      value: 'Active',   color: '#10b981' },
                  { label: 'Daily Limit',  value: '20/day',   color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#0d1117', borderRadius: 10, padding: '12px 16px', flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 4 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>No LinkedIn account connected</div>
                <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>
                  Connect your LinkedIn to start automated outreach
                </div>
              </div>
              <button onClick={() => navigate('/connect-linkedin')} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#0077b5', color: '#fff', border: 'none',
                padding: '10px 18px', borderRadius: 10, fontSize: 13,
                fontWeight: 600, cursor: 'pointer'
              }}>
                <Linkedin size={14} /> Connect LinkedIn
              </button>
            </div>
          )}
        </div>

        {/* Change password */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={15} color="#10b981" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Security</div>
            </div>
            <button onClick={() => setShowPasswords(!showPasswords)} style={{
              background: 'none', border: 'none', color: '#6b7280',
              fontSize: 13, cursor: 'pointer'
            }}>
              {showPasswords ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswords ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input type="password" value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#1e2535'}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input type="password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#10b981'}
                      onBlur={e => e.target.style.borderColor = '#1e2535'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm Password</label>
                    <input type="password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      style={{
                        ...inputStyle,
                        borderColor: confirmPassword && newPassword !== confirmPassword ? '#ef4444' : '#1e2535'
                      }}
                      onFocus={e => e.target.style.borderColor = '#10b981'}
                      onBlur={e => e.target.style.borderColor = confirmPassword && newPassword !== confirmPassword ? '#ef4444' : '#1e2535'}
                    />
                  </div>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <div style={{ fontSize: 12, color: '#ef4444' }}>Passwords do not match</div>
                )}
              </div>
              <button onClick={handleChangePassword} disabled={savingPassword || newPassword !== confirmPassword} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#10b981', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: 10, fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
                opacity: (savingPassword || (confirmPassword && newPassword !== confirmPassword)) ? 0.5 : 1
              }}>
                <Lock size={14} />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#4b5563' }}>
              Password last changed — click "Change Password" to update it
            </div>
          )}
        </div>

        {/* Danger zone */}
        

      </div>
    </div>
  )
}