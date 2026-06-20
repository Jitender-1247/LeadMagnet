import React, { useState, useContext, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ExternalLink, Clipboard, AlertCircle, Loader2, BookMarked } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import { apiFetch } from '../utils/api'
import LinkedInOAuthButton from '../Components/LinkedInOAuthButton'

const STEPS = [
  { num: 1, label: 'Add the bookmarklet',  color: '#6366f1' },
  { num: 2, label: 'Go to LinkedIn',        color: '#0077b5' },
  { num: 3, label: 'Paste your cookies',    color: '#10b981' },
]

const bookmarklet = `javascript:(function(){const cookies={};document.cookie.split(';').forEach(c=>{const p=c.trim();const idx=p.indexOf('=');if(idx>0){const k=p.slice(0,idx).trim();const v=p.slice(idx+1).trim();cookies[k]=v;}});const needed={li_at:cookies['li_at']||null,JSESSIONID:(cookies['JSESSIONID']||'').replace(/"/g,'')||null,li_rm:cookies['li_rm']||null,bcookie:cookies['bcookie']||null};if(!needed.li_at){alert('❌ li_at cookie not found. Make sure you are logged into LinkedIn!');return;}const output=JSON.stringify(needed,null,2);const overlay=document.createElement('div');overlay.style='position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,0.6);';const div=document.createElement('div');div.style='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999;background:#1a1a2e;color:#00ff88;padding:24px;border-radius:16px;font-family:monospace;font-size:13px;border:2px solid #00ff88;width:90%;max-width:480px;box-shadow:0 0 40px rgba(0,255,136,0.3);';div.innerHTML='<div style="font-size:15px;font-weight:bold;margin-bottom:4px;">🔐 StealthLead Cookie Extractor</div><div style="color:#9ca3af;font-size:12px;margin-bottom:14px;">Found your LinkedIn session cookies</div><pre style="background:#0d0d1a;padding:12px;border-radius:8px;overflow:auto;max-height:180px;font-size:12px;line-height:1.5;">'+output+'</pre><button id="sl-copy" style="margin-top:12px;width:100%;padding:11px;background:#00ff88;color:#000;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px;">📋 Copy to Clipboard</button><button id="sl-close" style="margin-top:8px;width:100%;padding:9px;background:transparent;color:#ff4444;border:1px solid #ff4444;border-radius:8px;cursor:pointer;font-size:13px;">✕ Close</button>';document.body.appendChild(overlay);document.body.appendChild(div);document.getElementById('sl-copy').onclick=function(){navigator.clipboard.writeText(output).then(()=>{this.textContent='✅ Copied! Go back and paste it in StealthLead';this.style.background='#065f46';this.style.color='#fff';});};document.getElementById('sl-close').onclick=function(){overlay.remove();div.remove();};overlay.onclick=function(){overlay.remove();div.remove();};})();`

export default function ConnectLinkedIn() {
  const navigate            = useNavigate()
  const [pastedJson, setPastedJson] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected,  setConnected]  = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [copied,     setCopied]     = useState(false)
  const [error,      setError]      = useState('')
  const bookmarkletRef               = useRef(null)

  // React sanitizes javascript: URLs set via JSX href — set it directly
  // on the DOM node instead so drag-to-bookmark actually works.
  useEffect(() => {
    if (bookmarkletRef.current) {
      bookmarkletRef.current.setAttribute('href', bookmarklet)
    }
  }, [])

  // ── Validate pasted JSON ────────────────────────────────────────────────────
  function validateCookies(raw) {
    try {
      const parsed = JSON.parse(raw)
      if (!parsed.li_at) return { valid: false, error: 'Missing li_at cookie. Did you copy the full output?' }
      if (parsed.li_at === 'NOT FOUND') return { valid: false, error: 'li_at not found. Make sure you are logged into LinkedIn first.' }
      return { valid: true, data: parsed }
    } catch {
      return { valid: false, error: 'Invalid JSON. Please copy the full output from the bookmarklet popup.' }
    }
  }

  // ── Copy bookmarklet URL ────────────────────────────────────────────────────
  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarklet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Bookmarklet code copied!')
  }

  // ── Submit cookies to backend ───────────────────────────────────────────────
  const handleConnect = async () => {
    setError('')
    const { valid, error: err, data } = validateCookies(pastedJson)
    if (!valid) { setError(err); return }

    setConnecting(true)
    try {
      const res  = await apiFetch('/auth/linkedin-cookie-connect', {
        method: 'POST',
        body:   JSON.stringify({ cookies: data }),
      })
      const json = await res.json()

      if (res.ok && json.success) {
        setConnected(true)
        toast.success('LinkedIn connected successfully! 🎉')
        setTimeout(() => navigate('/setup-profile'), 1500)
      } else {
        setError(json.error || 'Failed to connect. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    } finally {
      setConnecting(false)
    }
  }

  // ── Detect JSON paste and auto-advance ──────────────────────────────────────
  const handlePaste = (e) => {
    const text = e.clipboardData?.getData('text') || e.target.value
    setPastedJson(text)
    setError('')
    if (text.includes('li_at')) setActiveStep(3)
  }

  if (connected) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#10b98122', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={40} color="#10b981" />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>LinkedIn Connected!</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>Redirecting to profile setup...</div>
      </div>
    </div>
  )

  return (
    <>
      <ToastContainer theme="dark" position="top-center" />
      <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', padding: '40px 16px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Connect your <span style={{ color: '#0077b5' }}>LinkedIn</span>
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              Use the one-click bookmarklet to securely extract your session cookies.
              No password needed — works in 60 seconds.
            </div>
          </div>

          {/* Optional: Quick import via OAuth (profile data only, not automation) */}
          <div style={{
            background: '#111827', border: '1px solid #1e2535',
            borderRadius: 14, padding: '16px 18px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.6 }}>
              💡 Want to quickly import your name & photo from LinkedIn first?
              This uses official LinkedIn sign-in (separate from automation setup below).
            </div>
            <LinkedInOAuthButton mode="import" label="Import my LinkedIn profile" style={{ padding: '9px 16px', fontSize: 13 }} />
          </div>

          {/* Progress steps */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
            {STEPS.map((step, i) => (
              <React.Fragment key={step.num}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: activeStep >= step.num ? step.color : '#1e2535',
                    border: `2px solid ${activeStep >= step.num ? step.color : '#2a3245'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    color: activeStep >= step.num ? '#fff' : '#4b5563',
                    transition: 'all 0.3s',
                    boxShadow: activeStep === step.num ? `0 0 12px ${step.color}66` : 'none',
                  }}>
                    {activeStep > step.num ? <CheckCircle size={16}/> : step.num}
                  </div>
                  <div style={{ fontSize: 10, color: activeStep >= step.num ? '#e2e8f0' : '#4b5563', textAlign: 'center', maxWidth: 80 }}>
                    {step.label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 60, height: 2, background: activeStep > step.num ? '#10b981' : '#1e2535', margin: '0 4px 20px', transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── Step 1 — Bookmarklet ─────────────────────────────────────── */}
          <div style={{
            background: '#111827', border: `1px solid ${activeStep === 1 ? '#6366f1' : '#1e2535'}`,
            borderRadius: 16, padding: 24, marginBottom: 14,
            transition: 'border-color 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookMarked size={14} color="#6366f1" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Step 1 — Add the bookmarklet</div>
            </div>

            <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, marginBottom: 16 }}>
              <strong style={{ color: '#e2e8f0' }}>Option A (easiest):</strong> Drag the button below to your browser's bookmarks bar.
            </div>

            {/* Draggable bookmarklet */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <a
                ref={bookmarkletRef}
                onClick={e => { e.preventDefault(); toast.info('Drag this button to your bookmarks bar!') }}
                draggable
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', padding: '12px 24px', borderRadius: 10,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  cursor: 'grab', boxShadow: '0 4px 20px #10b98144',
                  userSelect: 'none',
                }}
              >
                🔐 StealthLead Extract
              </a>
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#4b5563', marginBottom: 16 }}>
              ↑ Drag this green button to your bookmarks bar ↑
            </div>

            <div style={{ background: '#0d1117', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>
                <strong style={{ color: '#e2e8f0' }}>Option B:</strong> Add manually
              </div>
              <ol style={{ fontSize: 12, color: '#6b7280', paddingLeft: 18, margin: 0, lineHeight: 2 }}>
                <li>Press <kbd style={{ background: '#1e2535', padding: '1px 6px', borderRadius: 4, color: '#e2e8f0', fontSize: 11 }}>Ctrl+D</kbd> to open Add Bookmark</li>
                <li>Name it <strong style={{ color: '#e2e8f0' }}>StealthLead Extract</strong></li>
                <li>Click the button below to copy the code, then paste it in the URL field</li>
              </ol>
            </div>

            <button onClick={handleCopyBookmarklet} style={{
              width: '100%', padding: '10px', borderRadius: 9,
              background: copied ? '#10b98122' : '#1e2535',
              border: `1px solid ${copied ? '#10b981' : '#2a3245'}`,
              color: copied ? '#10b981' : '#9ca3af',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 0.2s'
            }}>
              <Clipboard size={13} />
              {copied ? '✅ Copied! Paste into bookmark URL field' : 'Copy bookmarklet code'}
            </button>

            <button onClick={() => setActiveStep(2)} style={{
              width: '100%', marginTop: 10, padding: '11px',
              background: '#6366f1', border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>
              Done — Next step →
            </button>
          </div>

          {/* ── Step 2 — Open LinkedIn ───────────────────────────────────── */}
          <div style={{
            background: '#111827', border: `1px solid ${activeStep === 2 ? '#0077b5' : '#1e2535'}`,
            borderRadius: 16, padding: 24, marginBottom: 14,
            opacity: activeStep < 2 ? 0.5 : 1, transition: 'all 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0077b522', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExternalLink size={14} color="#0077b5" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Step 2 — Go to LinkedIn & click the bookmarklet</div>
            </div>

            <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, marginBottom: 16 }}>
              Make sure you are <strong style={{ color: '#e2e8f0' }}>already logged into LinkedIn</strong>, then click your new bookmarklet. A popup will appear with your cookies.
            </div>

            <div style={{ background: '#0d1117', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <ol style={{ fontSize: 12, color: '#6b7280', paddingLeft: 18, margin: 0, lineHeight: 2.2 }}>
                <li>Open LinkedIn in your browser</li>
                <li>Make sure you are logged in</li>
                <li>Click <strong style={{ color: '#10b981' }}>StealthLead Extract</strong> in your bookmarks bar</li>
                <li>A green popup will appear with your cookies</li>
                <li>Click <strong style={{ color: '#10b981' }}>Copy to Clipboard</strong></li>
                <li>Come back here and paste in Step 3</li>
              </ol>
            </div>

            <a href="https://www.linkedin.com/feed" target="_blank" rel="noreferrer"
              onClick={() => setActiveStep(3)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '11px', borderRadius: 10,
                background: '#0077b5', color: '#fff',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                boxSizing: 'border-box'
              }}
            >
              Open LinkedIn <ExternalLink size={13} />
            </a>
          </div>

          {/* ── Step 3 — Paste cookies ───────────────────────────────────── */}
          <div style={{
            background: '#111827', border: `1px solid ${activeStep === 3 ? '#10b981' : '#1e2535'}`,
            borderRadius: 16, padding: 24, marginBottom: 14,
            opacity: activeStep < 3 ? 0.5 : 1, transition: 'all 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={14} color="#10b981" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Step 3 — Paste your cookies</div>
            </div>

            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 14 }}>
              Paste the JSON you copied from the bookmarklet popup:
            </div>

            <textarea
              value={pastedJson}
              onChange={e => { setPastedJson(e.target.value); setError('') }}
              onPaste={handlePaste}
              onClick={() => setActiveStep(3)}
              placeholder={'{\n  "li_at": "AQEDATxxxxxx...",\n  "JSESSIONID": "ajax:xxxx..."\n}'}
              rows={6}
              style={{
                width: '100%', padding: '12px 14px',
                background: '#0d1117',
                border: `1px solid ${error ? '#ef4444' : pastedJson.includes('li_at') ? '#10b981' : '#1e2535'}`,
                borderRadius: 10, color: '#10b981',
                fontFamily: 'monospace', fontSize: 12,
                lineHeight: 1.6, resize: 'vertical',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />

            {/* Validation feedback */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, color: '#ef4444', fontSize: 12 }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}
            {!error && pastedJson.includes('li_at') && !pastedJson.includes('NOT FOUND') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, color: '#10b981', fontSize: 12 }}>
                <CheckCircle size={13} /> Cookies look valid — ready to connect!
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting || !pastedJson.trim()}
              style={{
                width: '100%', marginTop: 14, padding: '13px',
                background: connecting ? '#065f46' : !pastedJson.trim() ? '#1e2535' : '#10b981',
                border: 'none', borderRadius: 11,
                color: !pastedJson.trim() ? '#4b5563' : '#fff',
                fontSize: 14, fontWeight: 700,
                cursor: connecting || !pastedJson.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s'
              }}
            >
              {connecting
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Connecting...</>
                : '✅ Connect LinkedIn Account'
              }
            </button>
          </div>

          {/* Skip */}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'none', border: 'none', color: '#4b5563',
              fontSize: 13, cursor: 'pointer',
            }}>
              Skip for now — connect later from Settings
            </button>
          </div>

          {/* Security note */}
          <div style={{
            marginTop: 24, padding: '14px 16px',
            background: '#10b98108', border: '1px solid #10b98122',
            borderRadius: 10, fontSize: 12, color: '#6b7280', lineHeight: 1.7
          }}>
            🔒 <strong style={{ color: '#9ca3af' }}>Security:</strong> Your cookies are encrypted with AES-256 before storage.
            We never store your LinkedIn password. Cookies are only used to perform
            actions you've configured in your campaigns.
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}