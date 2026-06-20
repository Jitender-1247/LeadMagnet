import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import { AuthContext } from '../App'
import { notifyExtension } from '../utils/extensionBridge'

export default function VerifyEmail() {
  const navigate       = useNavigate()
  const { setStatus }  = useContext(AuthContext)
  const uid            = localStorage.getItem('uid')

  const [otp,     setOtp]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()

    if (otp.length !== 6) {
      toast.error('Enter valid 6-digit OTP')
      return
    }

    try {
      setLoading(true)

      const res = await fetch(
        import.meta.env.VITE_API_DB_URL + '/auth/verify-email',
        {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify({ uid, otp })
        }
      )

      const data = await res.json()

      if (res.ok) {
        // Clear any stale old token
        localStorage.removeItem('token')

        // Store token for local dev (cross-origin cookie fallback)
        if (data.token) {
          localStorage.setItem('token', data.token)
        }

        // Sync auth to the StealthLead browser extension (if installed)
        notifyExtension(uid, data.token)

        // Tell AuthProvider user is authenticated — prevents Protected redirect
        setStatus('ok')

        toast.success('Email verified successfully 🚀')
        setTimeout(() => navigate('/connect-linkedin'), 500)
      } else {
        toast.error(data.error || 'Verification failed')
      }

    } catch (err) {
      toast.error('Something went wrong')
      console.error('Verify email error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_DB_URL}/auth/resend-otp`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ uid })
        }
      )
      const data = await res.json()
      if (res.ok) toast.success('OTP resent to your email')
      else        toast.error(data.error || 'Failed to resend OTP')
    } catch {
      toast.error('Error resending OTP')
    }
  }

  return (
    <>
      <ToastContainer position="top-center" theme="colored" />

      <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center">
        <div className="w-full max-w-md bg-[#1a1f2b] p-8 rounded-2xl shadow-xl border border-gray-800">

          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Verify Your <span className="text-emerald-500">Email</span>
          </h2>

          <p className="text-gray-400 text-sm text-center mb-6">
            Enter the 6-digit OTP sent to your email
          </p>

          <form onSubmit={handleVerify} className="space-y-5">
            <input
              type="text" maxLength="6" value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-[10px] text-xl bg-[#0f1720] border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
              placeholder="------"
            />

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="text-center mt-5">
            <button onClick={handleResend}
              className="text-emerald-400 hover:underline text-sm">
              Resend OTP
            </button>
          </div>

        </div>
      </div>
    </>
  )
}