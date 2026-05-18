import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LeadLogo from '../assets/Images/logo.svg'
import { Loader2, ShieldCheck } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

export default function VerifyLinkedin() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()

    if (!otp) {
      toast.error('Please enter the OTP')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      const res = await fetch(import.meta.env.VITE_API_DB_URL + '/auth/linkedin-verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      })

      const data = await res.json()
      console.log('LinkedIn OTP verification response:', data)

      if (res.ok) {
        toast.success('LinkedIn connected successfully!')

        // Check if user already has a profile image — skip setup if so
        try {
          const profileRes = await fetch(`${import.meta.env.VITE_API_DB_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const profileData = await profileRes.json()
          setTimeout(() => {
            if (profileData.profileImage || profileData.linkedinProfileImage) {
              navigate('/dashboard')
            } else {
              navigate('/setup-profile')
            }
          }, 1000)
        } catch {
          setTimeout(() => navigate('/setup-profile'), 1000)
        }
      } else {
        toast.error(data.message || data.error || 'OTP verification failed')
      }

    } catch (error) {
      toast.error('Something went wrong. Please try again.')
      console.error('LinkedIn OTP error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/linkedin-connect')
  }

  return (
    <>
      <ToastContainer position='top-center' theme='colored' />
      <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center">
        <div className="max-w-md w-full bg-[#302a2a] rounded-2xl p-12 shadow-2xl border border-gray-800">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-10 justify-center">
            <img src={LeadLogo} alt="logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-white">
              Stealth<span className="text-emerald-500">Lead</span>
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-[#0077b5] p-4 rounded-full">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            LinkedIn Verification
          </h1>
          <p className="text-gray-400 text-center mb-8 text-sm">
            LinkedIn sent an OTP to your email or phone. Enter it below to complete the connection.
          </p>

          {/* Form */}
          <form onSubmit={handleVerify} className="flex flex-col gap-4">

            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="bg-[#1a1f26] text-white border border-gray-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-emerald-500"
              required
            />

            <button
              type="submit"
              disabled={loading || otp.length === 0}
              className="flex items-center justify-center gap-2 bg-[#0077b5] hover:bg-[#006097] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                : 'Verify & Connect'
              }
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="text-gray-400 hover:text-white text-sm text-center transition"
            >
              ← Go back and try again
            </button>

          </form>

        </div>
      </div>
    </>
  )
}