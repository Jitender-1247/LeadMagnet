import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, MessageSquare, Award } from 'lucide-react'
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

function MetricCard({ label, value, sub, color, icon: Icon, desc }) {
  return (
    <div style={{
      background: '#111827', border: '1px solid #1e2535',
      borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: color, opacity: 0.06, borderRadius: '50%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        {sub && <span style={{ fontSize: 11, color, fontWeight: 600, background: color + '15', padding: '3px 9px', borderRadius: 20 }}>{sub}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', marginTop: 4 }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 6 }}>{desc}</div>}
    </div>
  )
}

function FunnelStage({ label, value, total, color, definition }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{definition}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{value}</div>
          <div style={{ fontSize: 11, color, fontWeight: 500 }}>{pct}%</div>
        </div>
      </div>
      <div style={{ height: 7, background: '#1e2535', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 1.2s ease' }} />
      </div>
    </div>
  )
}

export default function Analytics() {
  const [overview, setOverview]       = useState(null)
  const [conversions, setConversions] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [period, setPeriod]           = useState('7d')
  const isMobile = useIsMobile()

  useEffect(() => { fetchAnalytics() }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [ovRes, cvRes] = await Promise.all([
        apiFetch(`/analytics/overview?period=${period}`),
        apiFetch(`/analytics/conversions?period=${period}`)
      ])
      setOverview(await ovRes.json())
      setConversions(await cvRes.json())
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  const total = overview?.connectionsSent || 0

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 32px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: isMobile ? 24 : 40
        }}>
          <div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#fff' }}>Analytics</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Campaign performance overview</div>
          </div>

          {/* Period selector — full width on mobile */}
          <div style={{
            display: 'flex', gap: 4, background: '#111827', border: '1px solid #1e2535',
            borderRadius: 10, padding: 4, width: isMobile ? '100%' : 'auto'
          }}>
            {['7d', '30d', '90d', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                flex: isMobile ? 1 : 'none',
                padding: '7px 14px', borderRadius: 7, border: 'none',
                background: period === p ? '#10b981' : 'transparent',
                color: period === p ? '#fff' : '#6b7280',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s'
              }}>{p}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#4b5563' }}>Loading analytics...</div>
        ) : (
          <>
            {/* Metric cards — 2 cols mobile, 4 cols desktop */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? 12 : 20, marginBottom: isMobile ? 20 : 40
            }}>
              <MetricCard label="Connections Sent" value={overview?.connectionsSent ?? 0}           sub="Total"    color="#6366f1" icon={Users} />
              <MetricCard label="Acceptance Rate"  value={`${overview?.acceptanceRate ?? 0}%`}      sub="Micro"    color="#10b981" icon={TrendingUp}   desc="Connections accepted / sent" />
              <MetricCard label="Reply Rate"        value={`${overview?.replyRate ?? 0}%`}           sub="Standard" color="#f59e0b" icon={MessageSquare} desc="Replies / accepted" />
              <MetricCard label="Meetings Booked"   value={overview?.meetingsBooked ?? 0}            sub="Ultimate" color="#ec4899" icon={Award}         desc="Calls / meetings agreed" />
            </div>

            {/* Bottom — stacks on mobile */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 16 : 24
            }}>

              {/* Funnel */}
              <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 16, padding: isMobile ? 20 : 28 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Conversion Funnel</div>
                <FunnelStage label="Connections Sent"   value={total}                        total={total} color="#6366f1" definition="Total outreach initiated" />
                <FunnelStage label="Micro Conversion"   value={overview?.accepted ?? 0}      total={total} color="#10b981" definition="Connection request accepted" />
                <FunnelStage label="Standard Conversion" value={overview?.replied ?? 0}      total={total} color="#f59e0b" definition="Prospect replied to message" />
                <FunnelStage label="Ultimate Conversion" value={overview?.meetingsBooked ?? 0} total={total} color="#ec4899" definition="Call or meeting booked" />
              </div>

              {/* Breakdown */}
              <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 16, padding: isMobile ? 20 : 28 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Conversion Breakdown</div>
                {[
                  { type: 'Micro Conversion',    label: 'Connection Accepted',   value: conversions?.micro     ?? 0, color: '#10b981', desc: 'Prospect accepted your connection request' },
                  { type: 'Standard Conversion', label: 'Message Reply',         value: conversions?.standard  ?? 0, color: '#f59e0b', desc: 'Prospect replied to your automated DM' },
                  { type: 'Ultimate Conversion', label: 'Meeting / Call Booked', value: conversions?.ultimate  ?? 0, color: '#ec4899', desc: 'Prospect agreed to a call or meeting' },
                ].map(({ type, label, value, color, desc }) => (
                  <div key={type} style={{
                    background: '#0d1117', borderRadius: 12, padding: 16, marginBottom: 14,
                    borderLeft: `3px solid ${color}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginTop: 4 }}>{label}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{desc}</div>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'monospace', flexShrink: 0 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}