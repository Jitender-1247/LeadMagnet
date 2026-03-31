import React, { useState, useEffect, useRef } from 'react'
import { RefreshCw, Send, User, Search } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

export default function Inbox() {
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef()
  const token = localStorage.getItem('token')

  useEffect(() => { fetchMessages() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selected])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/inbox/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMessages(data.messages || [])
      if (data.messages?.length > 0) setSelected(data.messages[0])
    } catch { toast.error('Failed to load messages') }
    finally { setLoading(false) }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`${API}/inbox/sync`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      toast.success(`Synced ${data.messagesSynced} messages`)
      fetchMessages()
    } catch { toast.error('Sync failed') }
    finally { setSyncing(false) }
  }

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      const res = await fetch(`${API}/inbox/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadUrl: selected.threadUrl, message: reply })
      })
      if (res.ok) {
        toast.success('Reply sent!')
        setReply('')
      } else {
        toast.error('Failed to send reply')
      }
    } catch { toast.error('Something went wrong') }
    finally { setSending(false) }
  }

  const filtered = messages.filter(m =>
    m.senderName?.toLowerCase().includes(search.toLowerCase()) ||
    m.message?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ height: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <ToastContainer theme="dark" />

      {/* Top bar */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #1e2535',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#111827', flexShrink: 0
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Inbox</div>
        <button onClick={handleSync} disabled={syncing} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1e2535', border: '1px solid #2a2f3e', color: '#e2e8f0',
          padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer'
        }}>
          <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Syncing...' : 'Sync Inbox'}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: message list */}
        <div style={{
          width: 320, borderRight: '1px solid #1e2535',
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2535' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%', padding: '9px 9px 9px 32px',
                  background: '#0d1117', border: '1px solid #1e2535',
                  borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}>No messages</div>
            ) : filtered.map(msg => (
              <div key={msg.id} onClick={() => setSelected(msg)} style={{
                padding: '14px 16px', borderBottom: '1px solid #1a1f2e',
                cursor: 'pointer', background: selected?.id === msg.id ? '#1a1f2e' : 'transparent',
                borderLeft: selected?.id === msg.id ? '2px solid #10b981' : '2px solid transparent',
                transition: 'all 0.1s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <User size={16} color="#6b7280" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                      {msg.senderName || 'LinkedIn User'}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {msg.message}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 6, marginLeft: 46 }}>
                  {msg.receivedAt ? new Date(msg.receivedAt).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: thread view */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
              Select a conversation
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{
                padding: '16px 24px', borderBottom: '1px solid #1e2535',
                display: 'flex', alignItems: 'center', gap: 12, background: '#111827'
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <User size={18} color="#6b7280" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                    {selected.senderName || 'LinkedIn User'}
                  </div>
                  <a href={selected.threadUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: '#6366f1' }}>View on LinkedIn →</a>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  maxWidth: '70%', background: '#1a1f2e',
                  borderRadius: '12px 12px 12px 4px', padding: '12px 16px'
                }}>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{selected.message}</div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8 }}>
                    {selected.receivedAt ? new Date(selected.receivedAt).toLocaleString() : ''}
                  </div>
                </div>
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #1e2535', background: '#111827' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <textarea value={reply} onChange={e => setReply(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleReply() }}
                    style={{
                      flex: 1, padding: '12px 16px', background: '#0d1117',
                      border: '1px solid #1e2535', borderRadius: 10,
                      color: '#e2e8f0', fontSize: 13, resize: 'none',
                      outline: 'none', fontFamily: 'inherit', lineHeight: 1.5
                    }}
                  />
                  <button onClick={handleReply} disabled={sending || !reply.trim()} style={{
                    background: '#10b981', border: 'none', color: '#fff',
                    padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
                    opacity: (sending || !reply.trim()) ? 0.5 : 1
                  }}>
                    <Send size={15} /> {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8 }}>⌘ + Enter to send</div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
