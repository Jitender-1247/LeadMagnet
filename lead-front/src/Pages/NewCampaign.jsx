import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: '#111827', border: '1px solid #1e2535',
  borderRadius: 10, color: '#e2e8f0', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit'
}

const labelStyle = { fontSize: 13, fontWeight: 500, color: '#9ca3af', marginBottom: 8, display: 'block' }

export default function NewCampaign() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [loading, setLoading] = useState(false)
  const token = localStorage.getItem('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !messageTemplate) { toast.error('All fields required'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/campaigns/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, messageTemplate })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Campaign created!')
        setTimeout(() => navigate(`/campaigns/${data.campaignId}/leads`), 1000)
      } else {
        toast.error(data.error || 'Failed to create')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const VARIABLES = ['{name}', '{company}', '{headline}', '{location}']

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 32px' }}>

        <button onClick={() => navigate('/campaigns')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', color: '#6b7280',
          fontSize: 13, cursor: 'pointer', marginBottom: 32, padding: 0
        }}>
          <ArrowLeft size={16} /> Back to Campaigns
        </button>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>New Campaign</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Set up your automated outreach sequence</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Campaign Details</div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Campaign Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. SaaS Founders Outreach Q1"
                style={inputStyle} required />
            </div>

            <div>
              <label style={labelStyle}>Message Template</label>
              <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {VARIABLES.map(v => (
                  <button key={v} type="button"
                    onClick={() => setMessageTemplate(prev => prev + v)}
                    style={{
                      padding: '4px 10px', background: '#10b98122', color: '#10b981',
                      border: '1px solid #10b98133', borderRadius: 6,
                      fontSize: 12, cursor: 'pointer'
                    }}>{v}</button>
                ))}
              </div>
              <textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)}
                placeholder="Hi {name}, I noticed you're the {headline} at {company}. I'd love to connect and share how we're helping similar companies..."
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                required />
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>
                Use variables above to personalize your message. They'll be replaced with each lead's real data.
              </div>
            </div>
          </div>

          <div style={{ background: '#111827', border: '1px solid #1e2535', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Human Simulation</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>These settings protect your LinkedIn account from restrictions.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Send Speed', value: 'Natural (2–8 min delays)', color: '#10b981' },
                { label: 'Active Hours', value: '9:00 AM – 6:00 PM', color: '#6366f1' },
                { label: 'Daily Limit', value: '20 connections/day', color: '#f59e0b' },
                { label: 'Proxy', value: 'Dedicated IP assigned', color: '#ec4899' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#0d1117', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
                  <div style={{ fontSize: 13, color, fontWeight: 500, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#10b981', color: '#fff', border: 'none',
            padding: '14px', borderRadius: 12, fontSize: 15,
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
            <Zap size={18} />
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      </div>
    </div>
  )
}
