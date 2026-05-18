import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Download, Search, User, ExternalLink,
  Play, RefreshCw, ChevronDown, Clock, CheckCircle2,
  Circle, AlertCircle, Calendar, X, LayoutList, GitBranch,
  Zap, Timer
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

const STATUS_COLORS = {
  pending:   { bg: '#1e2535',    color: '#6b7280' },
  requested: { bg: '#6366f122', color: '#818cf8' },
  accepted:  { bg: '#10b98122', color: '#10b981' },
  replied:   { bg: '#f59e0b22', color: '#f59e0b' },
  called:    { bg: '#ec489922', color: '#ec4899' },
  skipped:   { bg: '#1e2535',   color: '#4b5563' },
}

const ALL_STATUSES = ['pending', 'requested', 'accepted', 'replied', 'called', 'skipped']

// ── Step type colors (matches SequenceBuilder) ────────────────────────────────
const STEP_COLORS = {
  connect:      '#6366f1',
  message:      '#10b981',
  inmail:       '#f59e0b',
  view_profile: '#8b5cf6',
  follow:       '#ec4899',
  endorse:      '#f97316',
  wait:         '#64748b',
  condition:    '#06b6d4',
}

const STEP_LABELS = {
  connect:      'Connect',
  message:      'Message',
  inmail:       'InMail',
  view_profile: 'View Profile',
  follow:       'Follow',
  endorse:      'Endorse',
  wait:         'Wait',
  condition:    'Condition',
}

// ── Flatten sequence into a timeline (skip wait/condition nodes for display) ──
function flattenSequence(sequence, startDate) {
  const steps = []
  let   dayOffset = 0

  const flatten = (arr, branch = 'main') => {
    arr.forEach(step => {
      if (step.type === 'wait') {
        dayOffset += (step.days || 0) + (step.hours || 0) / 24
        return
      }
      if (step.type === 'condition') {
        flatten(step.yesSteps || [], 'yes')
        return
      }
      const date = new Date(startDate)
      date.setDate(date.getDate() + Math.floor(dayOffset))
      steps.push({
        ...step,
        dayOffset: Math.floor(dayOffset),
        scheduledDate: date.toISOString(),
        branch,
      })
    })
  }

  flatten(sequence)
  return steps
}

// ── Timeline step status for a lead ──────────────────────────────────────────
function getStepStatus(stepIndex, lead) {
  const currentStep = lead.currentStep || 0
  if (stepIndex < currentStep)  return 'done'
  if (stepIndex === currentStep) return 'current'
  return 'upcoming'
}

// ── Queue status banner ───────────────────────────────────────────────────────
function QueueBanner({ campaignId, token, onCancel }) {
  const [job, setJob] = useState(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res  = await fetch(`${API}/campaigns/${campaignId}/queue-status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setJob(data.queued ? data.job : null)
      } catch {}
    }
    check()
    const interval = setInterval(check, 30000) // recheck every 30s
    return () => clearInterval(interval)
  }, [campaignId])

  if (!job) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#f59e0b10', border: '1px solid #f59e0b33',
      borderRadius: 12, padding: '12px 18px', marginBottom: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Timer size={15} color="#f59e0b" />
        <div>
          <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
            {job.status === 'running' ? '⚡ Campaign is running now...' : `⏰ Queued — runs ${job.scheduledLabel}`}
          </span>
          <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 8 }}>
            {new Date(job.scheduledFor).toLocaleString()}
          </span>
        </div>
      </div>
      {job.status === 'pending' && (
        <button onClick={onCancel} style={{
          background: 'none', border: '1px solid #ef444433',
          color: '#ef4444', borderRadius: 7, padding: '5px 12px',
          fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
        }}>
          <X size={11} /> Cancel
        </button>
      )}
    </div>
  )
}

// ── Lead Timeline Card ────────────────────────────────────────────────────────
function LeadTimelineCard({ lead, sequence }) {
  const sc        = STATUS_COLORS[lead.status] || STATUS_COLORS.pending
  const startDate = lead.requestedAt || lead.createdAt || new Date().toISOString()
  const steps     = flattenSequence(sequence, startDate)
  const today     = new Date()

  const daysSinceStart = Math.floor(
    (today - new Date(startDate)) / (1000 * 60 * 60 * 24)
  )

  return (
    <div style={{
      background: '#111827', border: '1px solid #1e2535',
      borderRadius: 14, padding: '18px 20px', marginBottom: 12,
      transition: 'border-color 0.15s'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2a3245'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2535'}
    >
      {/* Lead header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lead.profileImage ? (
            <img src={lead.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="#4b5563" />
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{lead.name || 'Unknown'}</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>
              {lead.headline || lead.company || '—'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Days since start */}
          <div style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} />
            Day {daysSinceStart}
          </div>

          {/* Status pill */}
          <div style={{
            padding: '3px 10px', borderRadius: 20,
            background: sc.bg, color: sc.color,
            fontSize: 11, fontWeight: 600,
            border: `1px solid ${sc.color}33`
          }}>
            {lead.status}
          </div>

          {/* LinkedIn link */}
          {lead.profileUrl && (
            <a href={lead.profileUrl} target="_blank" rel="noreferrer" style={{
              color: '#6366f1', display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 11, textDecoration: 'none'
            }}>
              <ExternalLink size={11} /> View
            </a>
          )}
        </div>
      </div>

      {/* Timeline track */}
      {steps.length > 0 ? (
        <div style={{ position: 'relative' }}>
          {/* Progress line */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            height: 2, background: '#1e2535',
            width: `calc(100% - 28px)`, zIndex: 0
          }}>
            {/* Filled portion */}
            <div style={{
              height: '100%',
              width: `${Math.min(100, ((lead.currentStep || 0) / steps.length) * 100)}%`,
              background: 'linear-gradient(to right, #6366f1, #10b981)',
              transition: 'width 0.5s ease'
            }} />
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 0, position: 'relative', zIndex: 1, overflowX: 'auto', paddingBottom: 4 }}>
            {steps.map((step, i) => {
              const status      = getStepStatus(i, lead)
              const color       = STEP_COLORS[step.type] || '#4b5563'
              const stepDate    = new Date(step.scheduledDate)
              const isPast      = stepDate < today
              const isToday     = stepDate.toDateString() === today.toDateString()
              const daysAway    = Math.ceil((stepDate - today) / (1000 * 60 * 60 * 24))
              const minWidth    = `${Math.max(80, Math.floor(100 / steps.length))}px`

              return (
                <div key={step.id || i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth, flex: 1, position: 'relative'
                }}>
                  {/* Step circle */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: status === 'done'    ? color :
                                status === 'current' ? color + '33' : '#1e2535',
                    border: `2px solid ${status === 'upcoming' ? '#2a3245' : color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: status === 'current' ? `0 0 12px ${color}55` : 'none'
                  }}>
                    {status === 'done' ? (
                      <CheckCircle2 size={13} color="#fff" />
                    ) : status === 'current' ? (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    ) : (
                      <Circle size={10} color="#2a3245" />
                    )}
                  </div>

                  {/* Step label */}
                  <div style={{ marginTop: 6, textAlign: 'center' }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: status === 'upcoming' ? '#2a3245' : color,
                      whiteSpace: 'nowrap'
                    }}>
                      {STEP_LABELS[step.type]}
                    </div>
                    <div style={{ fontSize: 9, color: '#4b5563', marginTop: 2, whiteSpace: 'nowrap' }}>
                      {status === 'done' ? (
                        <span style={{ color: '#10b981' }}>✓ Done</span>
                      ) : isToday ? (
                        <span style={{ color: '#f59e0b' }}>Today</span>
                      ) : isPast ? (
                        <span style={{ color: '#ef4444' }}>Overdue</span>
                      ) : (
                        <span>Day {step.dayOffset} {daysAway > 0 ? `(+${daysAway}d)` : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>
          No sequence defined for this campaign
        </div>
      )}

      {/* Next action info */}
      {lead.nextActionAt && lead.status !== 'replied' && lead.status !== 'called' && (
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: '#6b7280'
        }}>
          <Clock size={11} />
          Next action:{' '}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>
            {new Date(lead.nextActionAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          {' '}
          <span style={{ color: '#4b5563' }}>
            ({Math.max(0, Math.ceil((new Date(lead.nextActionAt) - today) / (1000 * 60 * 60 * 24)))} days away)
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main Leads page ───────────────────────────────────────────────────────────
export default function Leads() {
  const { campaignId } = useParams()
  const navigate       = useNavigate()

  const [leads, setLeads]                 = useState([])
  const [campaign, setCampaign]           = useState(null)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [filter, setFilter]               = useState('all')
  const [view, setView]                   = useState('table')
  const [searchUrl, setSearchUrl]         = useState('')
  const [maxLeads, setMaxLeads]           = useState(25)
  const [showLaunch, setShowLaunch]       = useState(false)
  const [launchState, setLaunchState]     = useState(null) // null | 'launching' | 'scraping' | 'running' | 'queued' | 'done'
  const [launchMsg, setLaunchMsg]         = useState('')
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [openDropdown, setOpenDropdown]   = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchLeads()
    fetchCampaign()
  }, [campaignId])

  useEffect(() => {
    const handleClick = () => setOpenDropdown(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const fetchLeads = async () => {
    try {
      const res  = await fetch(`${API}/campaigns/${campaignId}/leads`, {
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

  const fetchCampaign = async () => {
    try {
      const res  = await fetch(`${API}/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCampaign(data)

      // Restore launch state from Firestore
      const ls = data.launchStatus
      if (ls === 'scraping') {
        setLaunchState('scraping')
        setLaunchMsg(`Scraping LinkedIn profiles... (${data.leadsScraped || 0} found so far)`)
        setShowLaunch(true)
      } else if (ls === 'running') {
        setLaunchState('running')
        setLaunchMsg(`Sending connection requests to ${data.leadsScraped || 0} leads...`)
        setShowLaunch(true)
      } else if (ls === 'queued') {
        setLaunchState('queued')
        setLaunchMsg(`Queued — will run ${data.launchScheduled || 'during safe hours'}`)
        setShowLaunch(true)
      } else if (ls === 'error') {
        setLaunchState('error')
        setLaunchMsg(data.launchError || 'An error occurred')
        setShowLaunch(true)
      } else if (ls === 'done') {
        setLaunchState('done')
        setLaunchMsg(`Done — ${data.leadsScraped || 0} leads scraped, connections sent automatically`)
        setShowLaunch(true)
      }
    } catch {}
  }

  const handleLaunch = async () => {
    if (!searchUrl.trim() || !searchUrl.includes('linkedin.com')) {
      toast.error('Please paste a valid LinkedIn search URL')
      return
    }

    setLaunchState('launching')
    setLaunchMsg('Starting up...')

    try {
      const res = await fetch(`${API}/campaigns/${campaignId}/launch`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ searchUrl, maxLeads })
      })

      // Safely parse — response might not be JSON (rate limit, HTML error etc)
      let data = {}
      try {
        data = await res.json()
      } catch {
        // If status is 429 — rate limited
        if (res.status === 429) {
          toast.error('Too many requests. Please wait 10 minutes and try again.')
          setLaunchState(null)
          return
        }
        toast.error(`Server error (${res.status}) — check your connection`)
        setLaunchState(null)
        return
      }

      if (!res.ok) {
        toast.error(data.error || `Error ${res.status}: Launch failed`)
        setLaunchState(null)
        return
      }

      setLaunchState('scraping')
      setLaunchMsg(`Scraping ${maxLeads} LinkedIn profiles...`)
      toast.success('🚀 Campaign launched! Scraping profiles then sending connections automatically.')

      const interval = setInterval(async () => {
        await fetchLeads()
      }, 15000)

      const scrapeMins = Math.ceil((maxLeads * 20) / 60)
      setTimeout(() => {
        setLaunchState('running')
        setLaunchMsg('Sending connection requests...')
      }, scrapeMins * 60 * 1000)

      setTimeout(() => {
        clearInterval(interval)
        setLaunchState('done')
        setLaunchMsg('Campaign is running — follow-ups handled automatically')
        fetchLeads()
      }, 30 * 60 * 1000)

    } catch (err) {
      toast.error(err.message || 'Network error — check your connection')
      setLaunchState(null)
    }
  }

  const handleCancelQueue = async () => {
    try {
      await fetch(`${API}/campaigns/${campaignId}/cancel-queue`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Scheduled run cancelled')
    } catch (err) {
      toast.error(err.message || 'Failed to cancel')
    }
  }

  const handleCheckAccepted = async () => {
    try {
      const res  = await fetch(`${API}/campaigns/${campaignId}/check-accepted`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Checked connections!')
        fetchLeads()
      } else {
        toast.error(data.error || 'Check failed')
      }
    } catch (err) {
      toast.error(err.message || 'Network error')
    }
  }

  const handleStatusUpdate = async (leadId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [leadId]: true }))
    setOpenDropdown(null)
    try {
      const res  = await fetch(`${API}/campaigns/leads/${leadId}/status`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        toast.success(`Status → "${newStatus}"`)
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch (err) {
      toast.error(err.message || 'Network error')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [leadId]: false }))
    }
  }

  const filtered = leads.filter(l => {
    const matchSearch =
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || l.status === filter
    return matchSearch && matchFilter
  })

  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {})

  const requestedCount = statusCounts['requested'] || 0
  const sequence       = campaign?.sequence || []

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>

        {/* Back */}
        <button onClick={() => navigate('/campaigns')} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none',
          border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer',
          marginBottom: 24, padding: 0
        }}>
          <ArrowLeft size={16} /> Back to Campaigns
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
              {campaign?.name || 'Leads'}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              {leads.length} leads · {sequence.length} sequence steps
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {requestedCount > 0 && (
              <button onClick={handleCheckAccepted} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#1e2535', color: '#818cf8',
                border: '1px solid #6366f133',
                padding: '10px 16px', borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>
                <RefreshCw size={14} /> Check Accepted ({requestedCount})
              </button>
            )}

            {/* Single Launch button */}
            <button
              onClick={() => setShowLaunch(s => !s)}
              disabled={!!launchState && launchState !== 'done'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: launchState && launchState !== 'done' ? '#065f46' : '#10b981',
                color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                cursor: launchState && launchState !== 'done' ? 'not-allowed' : 'pointer'
              }}
            >
              <Zap size={15} />
              {launchState === 'scraping' ? 'Scraping profiles...' :
               launchState === 'running'  ? 'Sending connections...' :
               launchState === 'launching'? 'Launching...' :
               launchState === 'done'     ? 'Launch Again' :
               'Launch Campaign'}
            </button>
          </div>
        </div>

        {/* Queue status banner — disabled until Firestore index is built */}
        {/* <QueueBanner campaignId={campaignId} token={token} onCancel={handleCancelQueue} /> */}

        {/* Launch panel */}
        {showLaunch && (
          <div style={{
            background: '#111827', border: '1px solid #10b98133',
            borderRadius: 16, padding: 24, marginBottom: 24
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              🚀 Launch Campaign
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
              Paste a LinkedIn search URL below. We'll scrape the profiles and automatically
              send connection requests — no extra steps needed.
            </div>

            {/* Status indicator when running */}
            {launchState && launchState !== 'done' && launchState !== 'error' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#10b98110', border: '1px solid #10b98130',
                borderRadius: 10, padding: '12px 16px', marginBottom: 16
              }}>
                <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16, flexShrink: 0, color: '#10b981' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity="0.75"/>
                </svg>
                <div>
                  <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>{launchMsg}</div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>
                    Running in background — you can leave this page safely
                  </div>
                </div>
              </div>
            )}

            {/* Done state */}
            {launchState === 'done' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#10b98110', border: '1px solid #10b98130',
                borderRadius: 10, padding: '12px 16px', marginBottom: 16
              }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>Campaign launched successfully</div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{launchMsg}</div>
                </div>
              </div>
            )}

            {/* Error state */}
            {launchState === 'error' && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: '#ef444410', border: '1px solid #ef444430',
                borderRadius: 10, padding: '12px 16px', marginBottom: 16
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>❌</span>
                <div>
                  <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Launch failed</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{launchMsg}</div>
                  <button
                    onClick={() => { setLaunchState(null); setLaunchMsg('') }}
                    style={{
                      marginTop: 8, background: 'none',
                      border: '1px solid #ef444433', color: '#ef4444',
                      borderRadius: 6, padding: '4px 12px',
                      fontSize: 11, cursor: 'pointer'
                    }}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            <input
              value={searchUrl}
              onChange={e => setSearchUrl(e.target.value)}
              placeholder="https://www.linkedin.com/search/results/people/?keywords=..."
              disabled={!!launchState && launchState !== 'done'}
              style={{
                width: '100%', padding: '11px 16px', marginBottom: 12,
                background: '#0d1117', border: '1px solid #1e2535',
                borderRadius: 10, color: '#e2e8f0', fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
                opacity: launchState && launchState !== 'done' ? 0.5 : 1
              }}
            />

            {/* Profile count */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[10, 25, 50, 100].map(n => (
                <button key={n} onClick={() => setMaxLeads(n)}
                  disabled={!!launchState && launchState !== 'done'}
                  style={{
                    padding: '7px 16px', borderRadius: 8,
                    background: maxLeads === n ? '#10b981' : '#0d1117',
                    border: `1px solid ${maxLeads === n ? '#10b981' : '#1e2535'}`,
                    color: maxLeads === n ? '#fff' : '#6b7280',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>{n} profiles</button>
              ))}
              <span style={{ fontSize: 11, color: '#4b5563', alignSelf: 'center', marginLeft: 4 }}>
                ~{Math.ceil((maxLeads * 20) / 60)} min scrape
              </span>
            </div>

            {/* What happens info */}
            <div style={{
              background: '#0d1117', borderRadius: 10, padding: '12px 16px',
              marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap'
            }}>
              {[
                { step: '1', label: 'Scrape profiles', desc: `${maxLeads} leads from your URL` },
                { step: '2', label: 'Send connections', desc: 'During safe hours (9am–6pm)' },
                { step: '3', label: 'Auto follow-ups', desc: 'Based on your sequence' },
              ].map(({ step, label, desc }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 140 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: '#10b98122', border: '1px solid #10b98144',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#10b981'
                  }}>{step}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Launch Campaign button */}
            <button
              onClick={handleLaunch}
              disabled={!!launchState && launchState !== 'done' && launchState !== 'error'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: launchState === 'error' ? '#ef4444' :
                            launchState && launchState !== 'done' ? '#065f46' : '#10b981',
                color: '#fff', border: 'none',
                padding: '12px 28px', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: launchState && launchState !== 'done' && launchState !== 'error'
                  ? 'not-allowed' : 'pointer'
              }}
            >
              <Zap size={16} />
              {launchState === 'scraping'  ? 'Scraping profiles...' :
               launchState === 'running'   ? 'Sending connections...' :
               launchState === 'launching' ? 'Starting...' :
               launchState === 'queued'    ? 'Queued ✓' :
               launchState === 'error'     ? 'Retry Launch' :
               launchState === 'done'      ? 'Launch Again →' :
               'Launch Campaign →'}
            </button>
          </div>
        )}

        {/* View toggle + filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', ...ALL_STATUSES].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11,
                fontWeight: 500, cursor: 'pointer', border: 'none',
                background: filter === s ? '#10b981' : '#1a1f2e',
                color:      filter === s ? '#fff'    : '#6b7280',
                transition: 'all 0.15s'
              }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#111827', border: '1px solid #1e2535', borderRadius: 9, padding: 3, gap: 2 }}>
            {[
              { v: 'table',    icon: LayoutList, label: 'Table'    },
              { v: 'timeline', icon: GitBranch,  label: 'Timeline' },
            ].map(({ v, icon: Icon, label }) => (
              <button key={v} onClick={() => setView(v)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 7, border: 'none',
                background: view === v ? '#10b981' : 'transparent',
                color:      view === v ? '#fff'    : '#6b7280',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s'
              }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
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

        {/* ── Table view ────────────────────────────────────────────────────── */}
        {view === 'table' && (
          <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.2fr 0.8fr',
              padding: '12px 20px', borderBottom: '1px solid #1e2535',
              fontSize: 11, fontWeight: 600, color: '#4b5563',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <span>Name</span><span>Company</span><span>Headline</span>
              <span>Status</span><span>Profile</span>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#4b5563' }}>Loading leads...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#4b5563' }}>
                <User size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>{leads.length === 0 ? 'No leads yet' : 'No leads match your search'}</div>
                {leads.length === 0 && (
                  <div style={{ fontSize: 12, marginTop: 8, color: '#374151' }}>
                    Click "Import Leads" to get started
                  </div>
                )}
              </div>
            ) : filtered.map(lead => {
              const sc        = STATUS_COLORS[lead.status] || STATUS_COLORS.pending
              const isUpdating = updatingStatus[lead.id]
              const isOpen    = openDropdown === lead.id

              return (
                <div key={lead.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.2fr 0.8fr',
                  padding: '14px 20px', borderBottom: '1px solid #0d1117',
                  alignItems: 'center', position: 'relative'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0d1117'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {lead.profileImage ? (
                      <img src={lead.profileImage} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={14} color="#4b5563" />
                      </div>
                    )}
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{lead.name || 'Unknown'}</span>
                  </div>

                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{lead.company || '—'}</span>

                  <span style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.headline || '—'}
                  </span>

                  {/* Status dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button disabled={isUpdating}
                      onClick={e => { e.stopPropagation(); setOpenDropdown(isOpen ? null : lead.id) }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 20,
                        background: sc.bg, color: sc.color,
                        fontSize: 11, fontWeight: 600,
                        border: `1px solid ${sc.color}33`,
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.6 : 1
                      }}
                    >
                      {isUpdating ? 'Updating...' : (lead.status || 'pending')}
                      <ChevronDown size={10} />
                    </button>

                    {isOpen && (
                      <div onClick={e => e.stopPropagation()} style={{
                        position: 'absolute', top: '110%', left: 0, zIndex: 100,
                        background: '#1a1f2e', border: '1px solid #1e2535',
                        borderRadius: 10, overflow: 'hidden', minWidth: 140,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}>
                        {ALL_STATUSES.map(s => {
                          const opt = STATUS_COLORS[s] || STATUS_COLORS.pending
                          return (
                            <button key={s} onClick={() => handleStatusUpdate(lead.id, s)} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', padding: '9px 14px',
                              background: lead.status === s ? '#0d1117' : 'transparent',
                              border: 'none', color: opt.color,
                              fontSize: 12, fontWeight: 500,
                              cursor: 'pointer', textAlign: 'left'
                            }}
                              onMouseEnter={e => e.currentTarget.style.background = '#0d1117'}
                              onMouseLeave={e => e.currentTarget.style.background = lead.status === s ? '#0d1117' : 'transparent'}
                            >
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                              {lead.status === s && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4b5563' }}>✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {lead.profileUrl ? (
                    <a href={lead.profileUrl} target="_blank" rel="noreferrer" style={{
                      color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, textDecoration: 'none'
                    }}>
                      <ExternalLink size={13} /> View
                    </a>
                  ) : (
                    <span style={{ color: '#4b5563', fontSize: 12 }}>—</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Timeline view ─────────────────────────────────────────────────── */}
        {view === 'timeline' && (
          <div>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#4b5563' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#4b5563' }}>
                <Zap size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>No leads to show</div>
              </div>
            ) : (
              <>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Completed', color: '#10b981', symbol: '●' },
                    { label: 'Next up',   color: '#6366f1', symbol: '◉' },
                    { label: 'Upcoming',  color: '#2a3245', symbol: '○' },
                    { label: 'Overdue',   color: '#ef4444', symbol: '!' },
                  ].map(({ label, color, symbol }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
                      <span style={{ color, fontSize: 14 }}>{symbol}</span> {label}
                    </div>
                  ))}
                </div>

                {filtered.map(lead => (
                  <LeadTimelineCard
                    key={lead.id}
                    lead={lead}
                    sequence={sequence}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}