import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, Check, ArrowRight, Loader2, X } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

/**
 * Compress and resize an image file to a small square
 * Returns a base64 string
 */
function compressImage(file, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = maxSize
        canvas.height = maxSize

        const ctx = canvas.getContext('2d')

        // Crop to square from center
        const size = Math.min(img.width, img.height)
        const sx   = (img.width  - size) / 2
        const sy   = (img.height - size) / 2

        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize)

        // Compress to JPEG at 80% quality (~10-20KB typically)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function SetupProfile() {
  const navigate    = useNavigate()
  const fileRef     = useRef()
  const [preview, setPreview]   = useState(null)
  const [base64,  setBase64]    = useState(null)
  const [saving,  setSaving]    = useState(false)
  const [dragging, setDragging] = useState(false)
  const token = localStorage.getItem('token')

  const handleFile = async (file) => {
    if (!file) return

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate size (max 10MB original)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB')
      return
    }

    try {
      const compressed = await compressImage(file, 200)
      setPreview(compressed)
      setBase64(compressed)
    } catch {
      toast.error('Failed to process image')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSave = async () => {
    if (!base64) return
    setSaving(true)
    try {
      const res  = await fetch(`${API}/user/profile-image`, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileImage: base64 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success('Profile photo saved!')
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => navigate('/dashboard')

  return (
    <>
      <ToastContainer position="top-center" theme="colored" />
      <div style={{
        minHeight: '100vh', background: '#0a0f16',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif', padding: 24
      }}>
        <div style={{
          width: '100%', maxWidth: 460,
          background: '#111827', border: '1px solid #1e2535',
          borderRadius: 24, padding: 40,
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)'
        }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#10b98122', border: '1px solid #10b98144',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Camera size={24} color="#10b981" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
              Add a profile photo
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8, lineHeight: 1.6 }}>
              This will be used as your avatar across the platform.
              You can change it anytime in settings.
            </div>
          </div>

          {/* Upload area */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !preview && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#10b981' : preview ? '#10b98144' : '#2a3245'}`,
              borderRadius: 16, padding: 32,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: preview ? 'default' : 'pointer',
              background: dragging ? '#10b98108' : '#0d1117',
              transition: 'all 0.2s', marginBottom: 24,
              minHeight: 200, position: 'relative'
            }}
          >
            {preview ? (
              <>
                {/* Preview */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      width: 120, height: 120, borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #10b981',
                      boxShadow: '0 0 24px #10b98144'
                    }}
                  />
                  {/* Remove button */}
                  <button
                    onClick={e => { e.stopPropagation(); setPreview(null); setBase64(null) }}
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#ef4444', border: '2px solid #111827',
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
                <div style={{ fontSize: 13, color: '#10b981', marginTop: 12, fontWeight: 500 }}>
                  Looking good! ✨
                </div>
                <button
                  onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                  style={{
                    marginTop: 10, background: 'none',
                    border: '1px solid #2a3245', color: '#6b7280',
                    borderRadius: 8, padding: '6px 14px',
                    fontSize: 12, cursor: 'pointer'
                  }}
                >
                  Choose different photo
                </button>
              </>
            ) : (
              <>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: '#1e2535',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14
                }}>
                  <Upload size={22} color="#4b5563" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>
                  Drop your photo here
                </div>
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
                  or click to browse
                </div>
                <div style={{ fontSize: 11, color: '#374151', marginTop: 10 }}>
                  JPG, PNG, WEBP · Max 10MB
                </div>
              </>
            )}

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={!base64 || saving}
              style={{
                width: '100%', padding: '13px 0',
                background: !base64 ? '#1e2535' : saving ? '#065f46' : '#10b981',
                border: 'none', borderRadius: 12, color: !base64 ? '#4b5563' : '#fff',
                fontSize: 14, fontWeight: 600,
                cursor: !base64 || saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s'
              }}
            >
              {saving
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                : <><Check size={16} /> Save & Continue</>
              }
            </button>

            <button
              onClick={handleSkip}
              style={{
                width: '100%', padding: '11px 0',
                background: 'none', border: '1px solid #1e2535',
                borderRadius: 12, color: '#4b5563',
                fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
              onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
            >
              Skip for now <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}