import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Lock, Linkedin, Shield,
  Save, Link2Off, ArrowLeft, CheckCircle,
  XCircle, Zap, Users, MessageSquare, Award,
  Camera, Loader2, X
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import { apiFetch } from '../utils/api'

function useIsMobile() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w < 768
}

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: '#0d1117', border: '1px solid #1e2535',
  borderRadius: 10, color: '#e2e8f0', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.2s'
}

const labelStyle = {
  fontSize: 12, fontWeight: 500, color: '#6b7280',
  marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em'
}

function StatBadge({ label, value, color, icon: Icon }) {
  return (
    <div style={{ background: '#0d1117', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}

function compressImage(file, maxSize = 300) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = maxSize
        canvas.height = maxSize
        const ctx  = canvas.getContext('2d')
        const size = Math.min(img.width, img.height)
        const sx   = (img.width  - size) / 2
        const sy   = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const [profile, setProfile]             = useState(null)
  const [stats, setStats]                 = useState(null)
  const [loading, setLoading]             = useState(true)
  const [name, setName]                   = useState('')
  const [email, setEmail]                 = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword]   = useState(false)
  const [showPasswords, setShowPasswords]     = useState(false)

  // Avatar upload state
  const avatarFileRef                         = useRef()
  const [avatarPreview, setAvatarPreview]     = useState(null)  // base64 preview before save
  const [savingAvatar, setSavingAvatar]       = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        apiFetch('/user/profile'),
        apiFetch('/user/stats'),
      ])
      const profileData = await profileRes.json()
      const statsData   = await statsRes.json()
      setProfile(profileData)
      setStats(statsData)
      setName(profileData.name || '')
      setEmail(profileData.email || '')
    } catch { toast.error('Failed to load profile') }
    finally { setLoading(false) }
  }

  const handleSaveProfile = async () => {
    if (!name && !email) { toast.error('Nothing to update'); return }
    setSavingProfile(true)
    try {
      const res  = await apiFetch('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email })
      })
      const data = await res.json()
      if (res.ok) { toast.success('Profile updated!'); setProfile(prev => ({ ...prev, name, email })) }
      else toast.error(data.error || 'Failed to update')
    } catch { toast.error('Something went wrong') }
    finally { setSavingProfile(false) }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('All fields are required'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSavingPassword(true)
    try {
      const res  = await apiFetch('/user/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (res.ok) { toast.success('Password changed!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }
      else toast.error(data.error || 'Failed to change password')
    } catch { toast.error('Something went wrong') }
    finally { setSavingPassword(false) }
  }

  // ── Avatar handlers ──────────────────────────────────────────────────────
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024)   { toast.error('Image must be under 10MB');    return }
    try {
      const compressed = await compressImage(file, 300)
      setAvatarPreview(compressed)
    } catch { toast.error('Failed to process image') }
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return
    setSavingAvatar(true)
    try {
      const res  = await apiFetch('/user/profile-image', {
        method: 'POST',
        body: JSON.stringify({ profileImage: avatarPreview })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success('Profile photo updated!')
      setProfile(prev => ({ ...prev, profileImage: avatarPreview }))
      setAvatarPreview(null)
    } catch (err) { toast.error(err.message) }
    finally { setSavingAvatar(false) }
  }

  const handleDisconnectLinkedIn = async () => {
    try {
      const res = await apiFetch('/user/linkedin-disconnect', { method: 'POST' })
      if (res.ok) {
        toast.success('LinkedIn disconnected')
        setProfile(prev => ({ ...prev, linkedinConnected: false, linkedinEmail: null, linkedinConnectedAt: null }))
      }
    } catch { toast.error('Failed to disconnect') }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#4b5563' }}>Loading profile...</div>
    </div>
  )

  const cardStyle = {
    background: '#111827', border: '1px solid #1e2535',
    borderRadius: 16, padding: isMobile ? 18 : 26, marginBottom: 18
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" position="top-right" />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '20px 16px 40px' : '40px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: isMobile ? 24 : 40 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: '#1a1f2e', border: '1px solid #1e2535', color: '#9ca3af',
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#fff' }}>Profile</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Manage your account</div>
          </div>
        </div>

        {/* ── Avatar preview modal ─────────────────────────────────────────── */}
        {avatarPreview && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24
          }}
            onClick={() => setAvatarPreview(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#111827', border: '1px solid #1e2535',
                borderRadius: 20, padding: 28, width: '100%', maxWidth: 380,
                boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20
              }}
            >
              {/* Close button */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Update profile photo</div>
                <button onClick={() => setAvatarPreview(null)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Side-by-side: before / after */}
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current</div>
                  {(profile?.profileImage || profile?.linkedinProfileImage) ? (
                    <img src={profile.profileImage || profile.linkedinProfileImage} alt="current"
                      style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1e2535' }} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', border: '2px solid #1e2535' }}>
                      {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div style={{ fontSize: 20, color: '#10b981', fontWeight: 700 }}>→</div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#10b981', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>New</div>
                  <img src={avatarPreview} alt="new"
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981', boxShadow: '0 0 16px #10b98133' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  onClick={() => { setAvatarPreview(null); setTimeout(() => avatarFileRef.current?.click(), 50) }}
                  style={{ flex: 1, padding: '11px 0', background: 'none', border: '1px solid #2a3245', borderRadius: 10, color: '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Choose different
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                  style={{ flex: 2, padding: '11px 0', background: savingAvatar ? '#065f46' : '#10b981', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: savingAvatar ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                >
                  {savingAvatar
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                    : '✓ Save photo'
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={handleAvatarFileChange} />

        {/* Avatar card — stacks on mobile */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 20, flexWrap: 'wrap' }}>

          {/* Clickable avatar */}
          <div
            onClick={() => avatarFileRef.current?.click()}
            title="Click to change photo"
            style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
          >
            {(profile?.profileImage || profile?.linkedinProfileImage) ? (
              <img src={profile.profileImage || profile.linkedinProfileImage} alt={profile?.name || 'avatar'}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #10b98133', boxShadow: '0 0 20px #10b98122', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
            ) : null}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #6366f1)',
              display: (profile?.profileImage || profile?.linkedinProfileImage) ? 'none' : 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 20px #10b98122'
            }}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {/* Hover overlay with camera icon */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              opacity: 0, transition: 'opacity 0.2s',
              border: '3px solid #10b98166'
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
            >
              <Camera size={18} color="#fff" />
              <span style={{ fontSize: 8, color: '#fff', fontWeight: 600, letterSpacing: '0.03em' }}>CHANGE</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: profile?.isVerified ? '#10b98122' : '#f59e0b22', color: profile?.isVerified ? '#10b981' : '#f59e0b' }}>
                {profile?.isVerified ? <><CheckCircle size={11} /> Verified</> : <><XCircle size={11} /> Unverified</>}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: profile?.linkedinConnected ? '#0077b522' : '#1e2535', color: profile?.linkedinConnected ? '#0ea5e9' : '#4b5563' }}>
                <Linkedin size={11} />
                {profile?.linkedinConnected ? 'LinkedIn Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
          {!isMobile && (
            <div style={{ fontSize: 12, color: '#4b5563', textAlign: 'right', flexShrink: 0 }}>
              <div>Member since</div>
              <div style={{ color: '#9ca3af', marginTop: 4 }}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
          )}
        </div>

        {/* Stats — 2 cols on mobile, 4 on desktop */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 12, marginBottom: 18 }}>
            <StatBadge label="Campaigns"   value={stats.totalCampaigns} color="#6366f1" icon={Zap} />
            <StatBadge label="Total Leads" value={stats.totalLeads}     color="#10b981" icon={Users} />
            <StatBadge label="Replies"     value={stats.replied}        color="#f59e0b" icon={MessageSquare} />
            <StatBadge label="Meetings"    value={stats.meetings}       color="#ec4899" icon={Award} />
          </div>
        )}

        {/* Personal Info */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} color="#6366f1" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Personal Info</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#1e2535'} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#1e2535'} />
            </div>
          </div>
          <button onClick={handleSaveProfile} disabled={savingProfile} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#6366f1', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: savingProfile ? 0.7 : 1
          }}>
            <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* LinkedIn */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#0077b522', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Linkedin size={14} color="#0ea5e9" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>LinkedIn Account</div>
          </div>

          {profile?.linkedinConnected ? (
            <div>
              <div style={{ background: '#0d1117', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Connected</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>{profile.linkedinEmail || 'LinkedIn account active'}</div>
                    {profile.linkedinConnectedAt && (
                      <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>
                        Connected {new Date(profile.linkedinConnectedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button onClick={handleDisconnectLinkedIn} style={{
                    display: 'flex', alignItems: 'center', gap: 7, background: '#ef444415', color: '#ef4444',
                    border: '1px solid #ef444430', padding: '8px 14px', borderRadius: 9, fontSize: 12, cursor: 'pointer'
                  }}>
                    <Link2Off size={13} /> Disconnect
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Dedicated IP', value: 'Assigned', color: '#10b981' },
                  { label: 'Session',      value: 'Active',   color: '#10b981' },
                  { label: 'Daily Limit',  value: '20/day',   color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#0d1117', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color, marginTop: 3 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>No LinkedIn account connected</div>
                <div style={{ fontSize: 13, color: '#4b5563', marginTop: 3 }}>Connect your LinkedIn to start automated outreach</div>
              </div>
              <button onClick={() => navigate('/connect-linkedin')} style={{
                display: 'flex', alignItems: 'center', gap: 7, background: '#0077b5', color: '#fff',
                border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>
                <Linkedin size={14} /> Connect LinkedIn
              </button>
            </div>
          )}
        </div>

        {/* Security */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: '#10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} color="#10b981" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Security</div>
            </div>
            <button onClick={() => setShowPasswords(!showPasswords)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>
              {showPasswords ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswords ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e2535'} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e2535'} />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      style={{ ...inputStyle, borderColor: confirmPassword && newPassword !== confirmPassword ? '#ef4444' : '#1e2535' }}
                      onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e2535'} />
                  </div>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <div style={{ fontSize: 12, color: '#ef4444' }}>Passwords do not match</div>
                )}
              </div>
              <button onClick={handleChangePassword} disabled={savingPassword || newPassword !== confirmPassword} style={{
                display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: (savingPassword || (confirmPassword && newPassword !== confirmPassword)) ? 0.5 : 1
              }}>
                <Lock size={14} /> {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#4b5563' }}>Click "Change Password" to update your password</div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}