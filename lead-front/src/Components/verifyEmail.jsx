import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const uid = localStorage.getItem('uid');

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()

    if (otp.length !== 6) {
      toast.error('Enter valid 6-digit OTP')
      return
    }

    try {
      setLoading(true)

      const res = await fetch(import.meta.env.VITE_API_DB_URL + '/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, otp })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Email verified successfully 🚀')
        setTimeout(() => navigate('/connect-linkedin'), 1000)
      } else {
        toast.error(data.error || 'Verification failed')
      }

    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_DB_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('OTP resent to your email')
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
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

            {/* OTP Input */}
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-[10px] text-xl bg-[#0f1720] border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
              placeholder="------"
            />

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

          </form>

          {/* Resend OTP */}
          <div className="text-center mt-5">
            <button
              onClick={handleResend}
              className="text-emerald-400 hover:underline text-sm"
            >
              Resend OTP
            </button>
          </div>

        </div>
      </div>
    </>
  )
}