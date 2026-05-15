import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  BarChart2, Users, MessageSquare, TrendingUp,
  Zap, Settings, LogOut, Plus, Bell
} from 'lucide-react'

const API = import.meta.env.VITE_API_DB_URL

const NAV_ITEMS = [
  { icon: BarChart2,     label: 'Dashboard',  path: '/dashboard'  },
  { icon: Zap,           label: 'Campaigns',  path: '/campaigns'  },
  { icon: MessageSquare, label: 'Inbox',      path: '/inbox'      },
  { icon: TrendingUp,    label: 'Analytics',  path: '/analytics'  },
  { icon: Settings,      label: 'Settings',   path: '/settings'   },
]

// ── Avatar component ──────────────────────────────────────────────────────────
function SidebarAvatar({ profile }) {
  const navigate = useNavigate()
  const initial  = profile?.name?.charAt(0)?.toUpperCase() || '?'
  // User-uploaded photo takes priority over LinkedIn scraped photo
  const image    = profile?.profileImage || profile?.linkedinProfileImage || null

  return (
    <div
      onClick={() => navigate('/profile')}
      title="View Profile"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 20px', cursor: 'pointer',
        borderTop: '1px solid #1e2535', marginTop: 8,
        transition: 'background 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* LinkedIn image */}
      {image && (
        <img
          src={image}
          alt={profile?.name || 'avatar'}
          style={{
            width: 34, height: 34, borderRadius: '50%',
            objectFit: 'cover', flexShrink: 0,
            boxShadow: '0 0 0 2px #111827, 0 0 0 3px #10b98155'
          }}
          onError={e => {
            e.target.style.display = 'none'
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
          }}
        />
      )}

      {/* Fallback initial */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #10b981, #6366f1)',
        display: image ? 'none' : 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#fff',
        boxShadow: '0 0 0 2px #111827, 0 0 0 3px #10b98155'
      }}>
        {initial}
      </div>

      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#e2e8f0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {profile?.linkedinDisplayName || profile?.name || 'Loading...'}
        </div>
        <div style={{
          fontSize: 11, color: '#4b5563',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1
        }}>
          {profile?.email || ''}
        </div>
      </div>

      {/* Online dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: '#10b981', flexShrink: 0,
        boxShadow: '0 0 6px #10b981'
      }} />
    </div>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function Layout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [profile, setProfile] = useState(null)
  const token     = localStorage.getItem('token')

  // Fetch profile once for the whole layout
  useEffect(() => {
    if (!token) return
    fetch(`${API}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setProfile(data))
      .catch(() => {})
  }, [token])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  // Active nav item — matches current path prefix
  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    if (path === '/leads')     return location.pathname.includes('/leads')
    if (path === '/campaigns') return location.pathname.startsWith('/campaigns')
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      color: '#e2e8f0', fontFamily: 'system-ui, sans-serif',
      display: 'flex'
    }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
        background: '#111827', borderRight: '1px solid #1e2535',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        zIndex: 100
      }}>

        {/* Logo */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{ padding: '0 20px 32px', cursor: 'pointer' }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
            Stealth<span style={{ color: '#10b981' }}>Lead</span>
          </div>
          <div style={{ fontSize: 10, color: '#4b5563', marginTop: 3, letterSpacing: '0.06em' }}>
            AUTOMATED B2B PLATFORM
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1 }}>
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = isActive(path)
            return (
              <div
                key={path}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 20px', cursor: 'pointer',
                  background:   active ? '#10b98122' : 'transparent',
                  borderLeft:   active ? '2px solid #10b981' : '2px solid transparent',
                  color:        active ? '#10b981' : '#6b7280',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color      = '#e2e8f0'
                    e.currentTarget.style.background = '#1a1f2e'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color      = '#6b7280'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </div>
            )
          })}
        </div>

        {/* Bottom — New Campaign shortcut, logout, avatar */}
        <div>
          {/* New Campaign shortcut */}
          <div style={{ padding: '0 16px', marginBottom: 8 }}>
            <button
              onClick={() => navigate('/campaigns/new')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 7,
                background: '#10b98122', border: '1px solid #10b98133',
                color: '#10b981', borderRadius: 9,
                padding: '9px 0', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#10b98133'}
              onMouseLeave={e => e.currentTarget.style.background = '#10b98122'}
            >
              <Plus size={13} /> New Campaign
            </button>
          </div>

          {/* Logout */}
          <div style={{ padding: '0 20px' }}>
            <div
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                color: '#6b7280', fontSize: 13, cursor: 'pointer',
                padding: '11px 0', transition: 'color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
            >
              <LogOut size={16} /> Logout
            </div>
          </div>

          {/* Avatar */}
          <SidebarAvatar profile={profile} />
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  )
}