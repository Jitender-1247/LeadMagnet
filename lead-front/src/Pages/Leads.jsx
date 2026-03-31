import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Search, User, ExternalLink, Play, RefreshCw, ChevronDown } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

const STATUS_COLORS = {
  pending:  { bg: '#1e2535',    color: '#6b7280' },
  sent:     { bg: '#6366f122', color: '#818cf8' },
  accepted: { bg: '#10b98122', color: '#10b981' },
  replied:  { bg: '#f59e0b22', color: '#f59e0b' },
  meeting:  { bg: '#ec489922', color: '#ec4899' },
  ignored:  { bg: '#1e2535',   color: '#4b5563' },
}

const ALL_STATUSES = ['pending', 'sent', 'accepted', 'replied', 'meeting', 'ignored']

export default function Leads() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [importing, setImporting] = useState(false)
  const [searchUrl, setSearchUrl] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [campaignRunning, setCampaignRunning] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState({}) // leadId -> bool
  const [openDropdown, setOpenDropdown] = useState(null)   // leadId or null
  const token = localStorage.getItem('token')

  useEffect(() => { fetchLeads() }, [campaignId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API}/campaigns/${campaignId}/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setLeads(data.leads || [])
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!searchUrl.trim()) { toast.error('Enter a LinkedIn search URL'); return }
    if (!searchUrl.includes('linkedin.com')) { toast.error('Must be a LinkedIn URL'); return }

    setImporting(true)
    try {
      const res = await fetch(`${API}/campaigns/${campaignId}/import-leads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchUrl })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Imported ${data.leadsImported} leads! Sending connection requests...`)
        setShowImport(false)
        setSearchUrl('')
        fetchLeads()
      } else {
        toast.error(data.error || 'Import failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setImporting(false)
    }
  }

  // ── Start campaign (send connections to pending leads) ───────────────────
  const handleStartCampaign = async () => {
    setCampaignRunning(true)
    try {
      const res = await fetch(`${API}/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Campaign started! Connection requests are being sent.')
        setTimeout(fetchLeads, 5000) // refresh leads after 5s
      } else {
        toast.error(data.error || 'Failed to start campaign')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setCampaignRunning(false)
    }
  }

  // ── Check accepted connections + send messages ───────────────────────────
  const handleCheckAccepted = async () => {
    try {
      const res = await fetch(`${API}/campaigns/${campaignId}/check-accepted`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Checked connections — ${data.messaged || 0} messages sent!`)
        fetchLeads()
      } else {
        toast.error(data.error || 'Check failed')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  // ── Update a single lead's status manually ───────────────────────────────
  const handleStatusUpdate = async (leadId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [leadId]: true }))
    setOpenDropdown(null)
    try {
      const res = await fetch(`${API}/campaigns/${leadId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        toast.success(`Status updated to "${newStatus}"`)
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [leadId]: false }))
    }
  }

  const filtered = leads.filter(l => {
    const matchSearch =
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase()) ||
      l.profileUrl?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || l.status === filter
    return matchSearch && matchFilter
  })

  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {})

  const pendingCount = statusCounts['pending'] || 0
  const sentCount = statusCounts['sent'] || 0

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
      <ToastContainer theme="dark" />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>

        {/* Back button */}
        <button onClick={() => navigate('/campaigns')} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none',
          border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0
        }}>
          <ArrowLeft size={16} /> Back to Campaigns
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Leads</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{leads.length} leads in this campaign</div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>

            {/* Check accepted + send messages */}
            {sentCount > 0 && (
              <button onClick={handleCheckAccepted} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#1e2535', color: '#818cf8', border: '1px solid #6366f133',
                padding: '10px 16px', borderRadius: 10, fontSize: 13,
                fontWeight: 600, cursor: 'pointer'
              }}>
                <RefreshCw size={14} /> Check Accepted ({sentCount})
              </button>
            )}

            {/* Start campaign — send connections to pending */}
            {pendingCount > 0 && (
              <button
              onClick={handleStartCampaign}
              disabled={campaignRunning}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: campaignRunning ? '#065f46' : '#059669',
                color: '#fff', border: 'none',
                padding: '10px 16px', borderRadius: 10, fontSize: 13,
                fontWeight: 600, cursor: campaignRunning ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {campaignRunning ? (
                <>
                  {/* Spinner */}
                  <svg
                    style={{ animation: 'spin 1s linear infinite', width: 14, height: 14 }}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  >
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Play size={14} />
                  {`Send Connections (${pendingCount})`}
                </>
              )}
            </button>
            )}

            {/* Import leads */}
            <button onClick={() => setShowImport(!showImport)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#10b981', color: '#fff', border: 'none',
              padding: '10px 18px', borderRadius: 10, fontSize: 13,
              fontWeight: 600, cursor: 'pointer'
            }}>
              <Download size={15} /> Import Leads
            </button>
          </div>
        </div>

        {/* Import form */}
        {showImport && (
          <div style={{
            background: '#111827', border: '1px solid #10b98133',
            borderRadius: 14, padding: 24, marginBottom: 24
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              Import from LinkedIn Search
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              Go to linkedin.com/search/results/people, apply your filters, then copy and paste the full URL below.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                value={searchUrl}
                onChange={e => setSearchUrl(e.target.value)}
                placeholder="https://www.linkedin.com/search/results/people/?keywords=..."
                style={{
                  flex: 1, padding: '11px 16px',
                  background: '#0d1117', border: '1px solid #1e2535',
                  borderRadius: 10, color: '#e2e8f0', fontSize: 13, outline: 'none'
                }}
              />
              <button
                onClick={handleImport}
                disabled={importing}
                style={{
                  background: importing ? '#065f46' : '#10b981',
                  color: '#fff', border: 'none',
                  padding: '11px 24px', borderRadius: 10, fontSize: 13,
                  fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {importing ? 'Importing...' : 'Import Now'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 10 }}>
              After import, click "Send Connections" to start the campaign. Up to 25 leads per import.
            </div>
          </div>
        )}

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'pending', 'sent', 'accepted', 'replied', 'meeting'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12,
              fontWeight: 500, cursor: 'pointer', border: 'none',
              background: filter === s ? '#10b981' : '#1a1f2e',
              color: filter === s ? '#fff' : '#6b7280',
              transition: 'all 0.15s'
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company..."
            style={{
              width: '100%', padding: '11px 11px 11px 40px',
              background: '#111827', border: '1px solid #1e2535',
              borderRadius: 10, color: '#e2e8f0', fontSize: 13,
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Leads table */}
        <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 14, overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.2fr 0.8fr',
            padding: '12px 20px', borderBottom: '1px solid #1e2535',
            fontSize: 11, fontWeight: 600, color: '#4b5563',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <span>Name</span>
            <span>Company</span>
            <span>Headline</span>
            <span>Status</span>
            <span>Profile</span>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563' }}>
              Loading leads...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563' }}>
              <User size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div>{leads.length === 0 ? 'No leads yet' : 'No leads match your search'}</div>
              {leads.length === 0 && (
                <div style={{ fontSize: 12, marginTop: 8, color: '#374151' }}>
                  Click "Import Leads" above to get started
                </div>
              )}
            </div>
          ) : (
            filtered.map(lead => {
              const sc = STATUS_COLORS[lead.status] || STATUS_COLORS.pending
              const isUpdating = updatingStatus[lead.id]
              const isOpen = openDropdown === lead.id

              return (
                <div
                  key={lead.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.2fr 0.8fr',
                    padding: '14px 20px', borderBottom: '1px solid #0d1117',
                    alignItems: 'center', transition: 'background 0.1s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0d1117'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#1e2535', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0
                    }}>
                      <User size={14} color="#4b5563" />
                    </div>
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                      {lead.name || 'Unknown'}
                    </span>
                  </div>

                  {/* Company */}
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>
                    {lead.company || '—'}
                  </span>

                  {/* Headline */}
                  <span style={{
                    fontSize: 12, color: '#6b7280',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {lead.headline || '—'}
                  </span>

                  {/* Status dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      disabled={isUpdating}
                      onClick={e => {
                        e.stopPropagation()
                        setOpenDropdown(isOpen ? null : lead.id)
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 20,
                        background: sc.bg, color: sc.color,
                        fontSize: 11, fontWeight: 600,
                        border: `1px solid ${sc.color}33`,
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.6 : 1,
                        transition: 'all 0.15s'
                      }}
                    >
                      {isUpdating ? 'Updating...' : (lead.status || 'pending')}
                      <ChevronDown size={10} />
                    </button>

                    {/* Dropdown menu */}
                    {isOpen && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'absolute', top: '110%', left: 0, zIndex: 100,
                          background: '#1a1f2e', border: '1px solid #1e2535',
                          borderRadius: 10, overflow: 'hidden', minWidth: 140,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                        }}
                      >
                        {ALL_STATUSES.map(s => {
                          const opt = STATUS_COLORS[s] || STATUS_COLORS.pending
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusUpdate(lead.id, s)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                width: '100%', padding: '9px 14px',
                                background: lead.status === s ? '#0d1117' : 'transparent',
                                border: 'none', color: opt.color,
                                fontSize: 12, fontWeight: 500,
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'background 0.1s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#0d1117'}
                              onMouseLeave={e => e.currentTarget.style.background = lead.status === s ? '#0d1117' : 'transparent'}
                            >
                              <span style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: opt.color, flexShrink: 0
                              }} />
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                              {lead.status === s && (
                                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4b5563' }}>✓</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Profile link */}
                  {lead.profileUrl ? (
                    <a
                      href={lead.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#6366f1', display: 'flex',
                        alignItems: 'center', gap: 4, fontSize: 12,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={13} /> View
                    </a>
                  ) : (
                    <span style={{ color: '#4b5563', fontSize: 12 }}>—</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
