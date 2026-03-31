import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Pause, Play, Users, ChevronRight, Zap, Search, Download, X, Link } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

// ── Import Leads Modal ──────────────────────────────────────────────────────
function ImportLeadsModal({ campaign, onClose, token }) {
  const [searchUrl, setSearchUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    if (!searchUrl.trim()) {
      toast.error('Please paste a LinkedIn search URL')
      return
    }
    if (!searchUrl.includes('linkedin.com')) {
      toast.error('URL must be a LinkedIn search URL')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/campaigns/${campaign.id}/import-leads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ searchUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      toast.success(`${data.leadsImported} leads imported successfully!`)
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24
      }}
    >
      <div style={{
        background: '#111827', border: '1px solid #1e2535',
        borderRadius: 16, padding: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Import Leads</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Campaign: <span style={{ color: '#10b981' }}>{campaign.name}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#4b5563',
            cursor: 'pointer', padding: 4, lineHeight: 1
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#0d1117', border: '1px solid #1e2535',
          borderRadius: 10, padding: '14px 16px', marginBottom: 20
        }}>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
            <div style={{ color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>How to get your search URL:</div>
            <div>1. Go to <span style={{ color: '#10b981' }}>linkedin.com/search/results/people</span></div>
            <div>2. Apply your filters (title, company, location, etc.)</div>
            <div>3. Copy the full URL from your browser and paste it below</div>
          </div>
        </div>

        {/* URL Input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 8, display: 'block' }}>
            LinkedIn Search URL
          </label>
          <div style={{ position: 'relative' }}>
            <Link size={14} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: '#4b5563'
            }} />
            <input
              value={searchUrl}
              onChange={e => setSearchUrl(e.target.value)}
              placeholder="https://www.linkedin.com/search/results/people/?keywords=..."
              style={{
                width: '100%', padding: '12px 12px 12px 36px',
                background: '#0d1117', border: '1px solid #2a2f3e',
                borderRadius: 10, color: '#e2e8f0', fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#2a2f3e'}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0',
            background: 'none', border: '1px solid #2a2f3e',
            borderRadius: 10, color: '#6b7280', fontSize: 13,
            fontWeight: 600, cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            style={{
              flex: 2, padding: '11px 0',
              background: loading ? '#065f46' : '#10b981',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 13,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s'
            }}
          >
            <Download size={14} />
            {loading ? 'Importing...' : 'Import Leads'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Campaigns Page ─────────────────────────────────────────────────────
export default function Campaigns() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importTarget, setImportTarget] = useState(null) // campaign being imported into
  const token = localStorage.getItem('token')

  useEffect(() => { fetchCampaigns() }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCampaigns(data.campaigns || [])
    } catch (e) {
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id, current) => {
    const next = current === 'active' ? 'paused' : 'active'
    try {
      await fetch(`${API}/campaigns/${id}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      })
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: next } : c))
      toast.success(`Campaign ${next}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const filtered = campaigns.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" position="top-right" />

      {/* Import Leads Modal */}
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
            padding: '10px 20px', borderRadius: 10, fontSize: 13,
            fontWeight: 600, cursor: 'pointer'
          }}>
            <Plus size={16} /> New Campaign
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            style={{
              width: '100%', padding: '12px 12px 12px 42px',
              background: '#111827', border: '1px solid #1e2535',
              borderRadius: 10, color: '#e2e8f0', fontSize: 14,
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Campaign cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#4b5563' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 80,
            background: '#111827', borderRadius: 16, border: '1px dashed #2a2f3e'
          }}>
            <Zap size={40} color="#4b5563" style={{ marginBottom: 16 }} />
            <div style={{ color: '#9ca3af', fontSize: 16, fontWeight: 500 }}>No campaigns found</div>
            <div style={{ color: '#4b5563', fontSize: 13, marginTop: 8 }}>Create your first outreach campaign</div>
            <button onClick={() => navigate('/campaigns/new')} style={{
              marginTop: 20, background: '#10b981', color: '#fff',
              border: 'none', padding: '10px 24px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>Create Campaign</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filtered.map(c => (
              <div key={c.id} style={{
                background: '#111827', border: '1px solid #1e2535',
                borderRadius: 14, padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 20
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: c.status === 'active' ? '#10b98122' : '#f59e0b22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Zap size={18} color={c.status === 'active' ? '#10b981' : '#f59e0b'} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>{c.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.messageTemplate}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    padding: '4px 12px', borderRadius: 20,
                    background: c.status === 'active' ? '#10b98122' : '#f59e0b22',
                    color: c.status === 'active' ? '#10b981' : '#f59e0b',
                    fontSize: 11, fontWeight: 600
                  }}>{c.status}</div>

                  <button onClick={() => toggleStatus(c.id, c.status)} style={{
                    background: '#1e2535', border: 'none', color: '#9ca3af',
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
                  }}>
                    {c.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                  </button>

                  {/* ✅ Import Leads button — opens modal with searchUrl input */}
                  <button onClick={() => setImportTarget(c)} style={{
                    background: '#10b98115', border: '1px solid #10b98133',
                    color: '#10b981', padding: '8px 14px', borderRadius: 8,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    gap: 6, fontSize: 12, fontWeight: 500
                  }}>
                    <Download size={12} /> Import Leads
                  </button>

                  <button onClick={() => navigate(`/campaigns/${c.id}/leads`)} style={{
                    background: '#1e2535', border: 'none', color: '#9ca3af',
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
                  }}>
                    <Users size={12} /> Leads
                  </button>

                  <button onClick={() => navigate(`/campaigns/${c.id}`)} style={{
                    background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer'
                  }}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
