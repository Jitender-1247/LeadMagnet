import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, MessageSquare, TrendingUp, Zap,
  Activity, ChevronRight, Bell, Plus
} from 'lucide-react'
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

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{
      background: '#1a1f2e', border: '1px solid #2a2f3e',
      borderRadius: 16, padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: color, opacity: 0.08, borderRadius: '0 16px 0 80px' }} />
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: color, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

function CampaignRow({ campaign, onClick }) {
  const statusColor = campaign.status === 'active' ? '#10b981' : '#f59e0b'
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', padding: '14px 20px',
      borderBottom: '1px solid #1e2535', cursor: 'pointer', transition: 'background 0.15s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1f2e'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campaign.name}</div>
        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{campaign.createdAt?.slice(0, 10)}</div>
      </div>
      <div style={{ padding: '3px 10px', borderRadius: 20, background: statusColor + '22', color: statusColor, fontSize: 11, fontWeight: 600, marginRight: 12, flexShrink: 0 }}>
        {campaign.status}
      </div>
      <ChevronRight size={16} color="#4b5563" />
    </div>
  )
}

export default function Dashboard() {
  const navigate    = useNavigate()
  const isMobile    = useIsMobile()
  const [campaigns, setCampaigns] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, analRes] = await Promise.all([
          apiFetch('/campaigns'),
          apiFetch('/analytics/overview')
        ])
        setCampaigns((await campRes.json()).campaigns || [])
        setAnalytics(await analRes.json())
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const p = isMobile ? '20px 16px' : '32px 40px'

  return (
    <div style={{ padding: p, background: '#0d1117', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 24 : 40, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#fff' }}>Dashboard</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Welcome back — here's what's happening</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/campaigns/new')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#10b981', color: '#fff', border: 'none',
            padding: isMobile ? '9px 14px' : '10px 20px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <Plus size={15} /> {isMobile ? 'New' : 'New Campaign'}
          </button>
          <button style={{ background: '#1a1f2e', border: '1px solid #2a2f3e', color: '#e2e8f0', padding: '9px 12px', borderRadius: 10, cursor: 'pointer' }}>
            <Bell size={16} />
          </button>
        </div>
      </div>

      {/* Stats grid — 2 cols mobile, 4 cols desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? 12 : 20, marginBottom: isMobile ? 24 : 40
      }}>
        <StatCard label="Connections Sent"  value={analytics?.connectionsSent ?? '—'}                               sub="↑ 12% this week"      color="#10b981" icon={Users} />
        <StatCard label="Acceptance Rate"   value={analytics?.acceptanceRate  ? analytics.acceptanceRate + '%' : '—'} sub="Micro conversions"    color="#6366f1" icon={TrendingUp} />
        <StatCard label="Reply Rate"        value={analytics?.replyRate       ? analytics.replyRate      + '%' : '—'} sub="Standard conversions" color="#f59e0b" icon={MessageSquare} />
        <StatCard label="Meetings Booked"   value={analytics?.meetingsBooked  ?? '—'}                               sub="Ultimate conversions" color="#ec4899" icon={Activity} />
      </div>

      {/* Bottom — stacks on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 16 : 24
      }}>

        {/* Campaigns */}
        <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Active Campaigns</div>
            <button onClick={() => navigate('/campaigns')} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 13, cursor: 'pointer' }}>View all →</button>
          </div>
          <div style={{ marginTop: 14 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}>Loading...</div>
            ) : campaigns.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}>
                <Zap size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>No campaigns yet</div>
                <button onClick={() => navigate('/campaigns/new')} style={{ marginTop: 12, background: '#10b98122', color: '#10b981', border: '1px solid #10b98133', padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                  Create one →
                </button>
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
            { label: 'Connections Sent',   value: analytics?.connectionsSent  ?? 0, color: '#6366f1', pct: 100 },
            { label: 'Accepted (Micro)',    value: analytics?.accepted          ?? 0, color: '#10b981', pct: analytics?.acceptanceRate ?? 0 },
            { label: 'Replied (Standard)', value: analytics?.replied            ?? 0, color: '#f59e0b', pct: analytics?.replyRate      ?? 0 },
            { label: 'Meetings (Ultimate)',value: analytics?.meetingsBooked     ?? 0, color: '#ec4899', pct: analytics?.meetingRate    ?? 0 },
          ].map(({ label, value, color, pct }) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
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
  )
}