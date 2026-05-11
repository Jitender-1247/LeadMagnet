import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pause, Play, Users, ChevronRight, Zap,
  Search, Download, X, Link, Edit3, Trash2,
  Activity, Clock
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

// ── Import Leads Modal ────────────────────────────────────────────────────────
function ImportLeadsModal({ campaign, onClose, token }) {
  const [searchUrl, setSearchUrl] = useState('')
  const [maxLeads, setMaxLeads]   = useState(25)
  const [loading, setLoading]     = useState(false)

  const estimatedMins = Math.ceil((maxLeads * 20) / 60)

  const handleImport = async () => {
    if (!searchUrl.trim() || !searchUrl.includes('linkedin.com')) {
      toast.error('Please paste a valid LinkedIn search URL')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/campaigns/${campaign.id}/import-leads`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ searchUrl, maxLeads })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      toast.success(`${data.leadsImported} leads imported!`)
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: '#111827', border: '1px solid #1e2535',
        borderRadius: 20, padding: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Import Leads</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Campaign: <span style={{ color: '#10b981' }}>{campaign.name}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: '#0d1117', border: '1px solid #1e2535',
          borderRadius: 10, padding: '14px 16px', marginBottom: 20
        }}>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
            <div style={{ color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>How to get your URL:</div>
            <div>1. Go to <span style={{ color: '#10b981' }}>linkedin.com/search/results/people</span></div>
            <div>2. Apply your filters (title, company, location)</div>
            <div>3. Copy the full URL and paste below</div>
          </div>
        </div>

        <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 8, display: 'block' }}>
          LinkedIn Search URL
        </label>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Link size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input
            value={searchUrl}
            onChange={e => setSearchUrl(e.target.value)}
            placeholder="https://www.linkedin.com/search/results/people/?keywords=..."
            style={{
              width: '100%', padding: '12px 12px 12px 36px',
              background: '#0d1117', border: '1px solid #2a2f3e',
              borderRadius: 10, color: '#e2e8f0', fontSize: 13,
              outline: 'none', boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#2a2f3e'}
          />
        </div>

        {/* Max leads selector */}
        <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 10, display: 'block' }}>
          Number of Profiles to Scrape
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[10, 25, 50, 100].map(n => (
            <button key={n} onClick={() => setMaxLeads(n)} style={{
              flex: 1, padding: '9px 0', borderRadius: 9,
              background: maxLeads === n ? '#10b981' : '#0d1117',
              border: `1px solid ${maxLeads === n ? '#10b981' : '#2a2f3e'}`,
              color: maxLeads === n ? '#fff' : '#6b7280',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
            }}>{n}</button>
          ))}
        </div>

        {/* Time estimate */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
          background: maxLeads > 25 ? '#f59e0b10' : '#10b98110',
          border: `1px solid ${maxLeads > 25 ? '#f59e0b30' : '#10b98130'}`,
          borderRadius: 9, padding: '10px 14px'
        }}>
          <span style={{ fontSize: 15 }}>{maxLeads > 25 ? '⚠️' : '✅'}</span>
          <div style={{ fontSize: 12, color: maxLeads > 25 ? '#f59e0b' : '#10b981', lineHeight: 1.5 }}>
            Scraping <strong>{maxLeads} profiles</strong> takes ~<strong>{estimatedMins} min</strong> to complete safely.
            {maxLeads > 50 && ' Consider running in batches to reduce detection risk.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0', background: 'none',
            border: '1px solid #2a2f3e', borderRadius: 10,
            color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>Cancel</button>
          <button onClick={handleImport} disabled={loading} style={{
            flex: 2, padding: '11px 0',
            background: loading ? '#065f46' : '#10b981',
            border: 'none', borderRadius: 10, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <Download size={14} />
            {loading ? `Importing ${maxLeads} profiles...` : `Import ${maxLeads} Leads`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Campaign card ─────────────────────────────────────────────────────────────
function CampaignCard({ campaign, onToggle, onImport, onDelete, navigate }) {
  const statusColor = campaign.status === 'active' ? '#10b981' : '#f59e0b'
  const steps       = campaign.sequence || []
  const actionSteps = steps.filter(s => s.type !== 'wait' && s.type !== 'condition').length
  const totalDays   = steps.reduce((acc, s) => acc + (s.days || 0), 0)

  return (
    <div style={{
      background: '#111827', border: '1px solid #1e2535',
      borderRadius: 16, padding: '20px 24px',
      transition: 'border-color 0.15s, box-shadow 0.15s'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#2a3245'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1e2535'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: campaign.status === 'active' ? '#10b98122' : '#f59e0b22',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={20} color={statusColor} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{campaign.name}</div>
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>
              Created {campaign.createdAt?.slice(0, 10)}
            </div>
          </div>
        </div>

        <div style={{
          padding: '4px 12px', borderRadius: 20,
          background: statusColor + '22', color: statusColor,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.03em'
        }}>
          {campaign.status?.toUpperCase()}
        </div>
      </div>

      {/* Sequence stats */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 18,
        padding: '12px 14px', background: '#0d1117', borderRadius: 10
      }}>
        {[
          { icon: Activity, label: 'Steps', value: steps.length, color: '#6366f1' },
          { icon: Zap, label: 'Actions', value: actionSteps, color: '#10b981' },
          { icon: Clock, label: 'Duration', value: totalDays > 0 ? `~${totalDays}d` : '< 1d', color: '#f59e0b' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={12} color={color} />
            <span style={{ fontSize: 11, color: '#4b5563' }}>{label}:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
          </div>
        ))}

        {campaign.isRunning && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Running</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => onToggle(campaign.id, campaign.status)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#1e2535', border: '1px solid #2a3245',
          color: '#9ca3af', padding: '8px 14px', borderRadius: 8,
          cursor: 'pointer', fontSize: 12, fontWeight: 500
        }}>
          {campaign.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
        </button>

        <button onClick={() => navigate(`/campaigns/${campaign.id}/sequence`)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#6366f115', border: '1px solid #6366f133',
          color: '#6366f1', padding: '8px 14px', borderRadius: 8,
          cursor: 'pointer', fontSize: 12, fontWeight: 500
        }}>
          <Edit3 size={12} /> Edit Sequence
        </button>

        <button onClick={() => onImport(campaign)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#10b98115', border: '1px solid #10b98133',
          color: '#10b981', padding: '8px 14px', borderRadius: 8,
          cursor: 'pointer', fontSize: 12, fontWeight: 500
        }}>
          <Download size={12} /> Import Leads
        </button>

        <button onClick={() => navigate(`/campaigns/${campaign.id}/leads`)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#1e2535', border: '1px solid #2a3245',
          color: '#9ca3af', padding: '8px 14px', borderRadius: 8,
          cursor: 'pointer', fontSize: 12, fontWeight: 500
        }}>
          <Users size={12} /> Leads
        </button>

        <button onClick={() => onDelete(campaign.id)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#ef444415', border: '1px solid #ef444433',
          color: '#ef4444', padding: '8px 14px', borderRadius: 8,
          cursor: 'pointer', fontSize: 12, fontWeight: 500,
          marginLeft: 'auto'
        }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Main Campaigns page ───────────────────────────────────────────────────────
export default function Campaigns() {
  const navigate      = useNavigate()
  const [campaigns, setCampaigns]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [importTarget, setImportTarget] = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => { fetchCampaigns() }, [])

  const fetchCampaigns = async () => {
    try {
      const res  = await fetch(`${API}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCampaigns(data.campaigns || [])
    } catch {
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id, current) => {
    const next = current === 'active' ? 'paused' : 'active'
    try {
      await fetch(`${API}/campaigns/${id}/status`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: next })
      })
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: next } : c))
      toast.success(`Campaign ${next}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return
    try {
      const res = await fetch(`${API}/campaigns/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setCampaigns(prev => prev.filter(c => c.id !== id))
      toast.success('Campaign deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filtered = campaigns.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" />

      {importTarget && (
        <ImportLeadsModal
          campaign={importTarget}
          token={token}
          onClose={() => setImportTarget(null)}
        />
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Campaigns</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{campaigns.length} total campaigns</div>
          </div>
          <button onClick={() => navigate('/campaigns/new')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#10b981', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <Plus size={16} /> New Campaign
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            style={{
              width: '100%', padding: '12px 12px 12px 42px',
              background: '#111827', border: '1px solid #1e2535',
              borderRadius: 10, color: '#e2e8f0', fontSize: 14,
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Campaign list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#4b5563' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 80,
            background: '#111827', borderRadius: 16, border: '1px dashed #2a2f3e'
          }}>
            <Zap size={40} color="#4b5563" style={{ marginBottom: 16 }} />
            <div style={{ color: '#9ca3af', fontSize: 16, fontWeight: 500 }}>No campaigns found</div>
            <div style={{ color: '#4b5563', fontSize: 13, marginTop: 8 }}>Build your first outreach sequence</div>
            <button onClick={() => navigate('/campaigns/new')} style={{
              marginTop: 20, background: '#10b981', color: '#fff',
              border: 'none', padding: '10px 24px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>
              Create Campaign
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filtered.map(c => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onToggle={toggleStatus}
                onImport={setImportTarget}
                onDelete={deleteCampaign}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
    </>
  )
}