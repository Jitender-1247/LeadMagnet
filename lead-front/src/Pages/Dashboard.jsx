import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BarChart2, Users, MessageSquare, TrendingUp,
  Zap, Activity, ChevronRight, Bell, Settings,
  LogOut, Link2, Plus
} from 'lucide-react'

const API = import.meta.env.VITE_API_DB_URL


// ✅ Reusable sidebar avatar — import and use on all pages
export function SidebarAvatar({ navigate }) {
  const [profile, setProfile] = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetch(`${API}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setProfile(data))
      .catch(() => {})
  }, [])

  const initial = profile?.name?.charAt(0)?.toUpperCase() || '?'

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
      {/* Avatar with gradient + initial */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #10b981, #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          {profile?.name || 'Loading...'}
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

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{
      background: '#1a1f2e', border: '1px solid #2a2f3e',
      borderRadius: 16, padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: color, opacity: 0.08, borderRadius: '0 16px 0 80px'
      }} />
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: color + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
      }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: color, marginTop: 8, fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

function CampaignRow({ campaign, onClick }) {
  const statusColor = campaign.status === 'active' ? '#10b981' : '#f59e0b'
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', padding: '16px 20px',
      borderBottom: '1px solid #1e2535', cursor: 'pointer',
      transition: 'background 0.15s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ flex: 1 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{campaign.name}</div>
        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{campaign.createdAt?.slice(0, 10)}</div>
      </div>
      <div style={{
        padding: '3px 10px', borderRadius: 20,
        background: statusColor + '22', color: statusColor,
        fontSize: 11, fontWeight: 600, marginRight: 16
      }}>{campaign.status}</div>
      <ChevronRight size={16} color="#4b5563" />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { campaignId } = useParams()
  const [campaigns, setCampaigns] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, analRes] = await Promise.all([
          fetch(`${API}/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        const campData = await campRes.json()
        const analData = await analRes.json()
        setCampaigns(campData.campaigns || [])
        setAnalytics(analData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>

      {/* Sidebar */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
        background: '#111827', borderRight: '1px solid #1e2535',
        display: 'flex', flexDirection: 'column', padding: '24px 0', zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 32px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
            Stealth<span style={{ color: '#10b981' }}>Lead</span>
          </div>
        </div>

        {/* Nav links */}
        {[
          { icon: BarChart2, label: 'Dashboard',  path: '/dashboard', active: true },
          { icon: Zap,       label: 'Campaigns',  path: '/campaigns' },
          { icon: Users,     label: 'Leads',      path: '/leads' },
          { icon: MessageSquare, label: 'Inbox',  path: '/inbox' },
          { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
          { icon: Settings,  label: 'Settings',   path: '/settings' },
        ].map(({ icon: Icon, label, path, active }) => (
          <div key={path} onClick={() => navigate(path)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 20px', cursor: 'pointer',
            background: active ? '#10b98122' : 'transparent',
            borderLeft: active ? '2px solid #10b981' : '2px solid transparent',
            color: active ? '#10b981' : '#6b7280',
            fontSize: 13, fontWeight: active ? 600 : 400,
            transition: 'all 0.15s'
          }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = '#1a1f2e' } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent' } }}
          >
            <Icon size={16} />
            {label}
          </div>
        ))}

        {/* Bottom section — logout + profile avatar */}
        <div style={{ marginTop: 'auto' }}>

          {/* Logout */}
          <div style={{ padding: '0 20px' }}>
            <div onClick={handleLogout} style={{
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

          {/* ✅ Profile avatar — navigates to /profile on click */}
          <SidebarAvatar navigate={navigate} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 220, padding: '32px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Dashboard</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Welcome back — here's what's happening</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/campaigns/new')} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#10b981', color: '#fff', border: 'none',
              padding: '10px 20px', borderRadius: 10, fontSize: 13,
              fontWeight: 600, cursor: 'pointer'
            }}>
              <Plus size={16} /> New Campaign
            </button>
            <button style={{
              background: '#1a1f2e', border: '1px solid #2a2f3e',
              color: '#e2e8f0', padding: '10px 12px', borderRadius: 10, cursor: 'pointer'
            }}>
              <Bell size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
          <StatCard label="Connections Sent" value={analytics?.connectionsSent ?? '—'} sub="↑ 12% this week" color="#10b981" icon={Users} />
          <StatCard label="Acceptance Rate" value={analytics?.acceptanceRate ? analytics.acceptanceRate + '%' : '—'} sub="Micro conversions" color="#6366f1" icon={TrendingUp} />
          <StatCard label="Reply Rate" value={analytics?.replyRate ? analytics.replyRate + '%' : '—'} sub="Standard conversions" color="#f59e0b" icon={MessageSquare} />
          <StatCard label="Meetings Booked" value={analytics?.meetingsBooked ?? '—'} sub="Ultimate conversions" color="#ec4899" icon={Activity} />
        </div>

        {/* Bottom grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Campaigns */}
          <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Active Campaigns</div>
              <button onClick={() => navigate('/campaigns')} style={{
                background: 'none', border: 'none', color: '#10b981', fontSize: 13, cursor: 'pointer'
              }}>View all →</button>
            </div>
            <div style={{ marginTop: 16 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}>Loading...</div>
              ) : campaigns.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}>
                  <Zap size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <div>No campaigns yet</div>
                  <button onClick={() => navigate('/campaigns/new')} style={{
                    marginTop: 12, background: '#10b98122', color: '#10b981',
                    border: '1px solid #10b98133', padding: '8px 16px',
                    borderRadius: 8, fontSize: 12, cursor: 'pointer'
                  }}>Create one →</button>
                </div>
              ) : campaigns.slice(0, 5).map(c => (
                <CampaignRow key={c.id} campaign={c} onClick={() => navigate(`/campaigns/${c.id}/leads`)} />
              ))}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Conversion Funnel</div>
            {[
              { label: 'Connections Sent', value: analytics?.connectionsSent ?? 0, color: '#6366f1', pct: 100 },
              { label: 'Accepted (Micro)', value: analytics?.accepted ?? 0, color: '#10b981', pct: analytics?.acceptanceRate ?? 0 },
              { label: 'Replied (Standard)', value: analytics?.replied ?? 0, color: '#f59e0b', pct: analytics?.replyRate ?? 0 },
              { label: 'Meetings (Ultimate)', value: analytics?.meetingsBooked ?? 0, color: '#ec4899', pct: analytics?.meetingRate ?? 0 },
            ].map(({ label, value, color, pct }) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{value}</span>
                </div>
                <div style={{ height: 6, background: '#1e2535', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
