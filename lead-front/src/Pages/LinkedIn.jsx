import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import LeadLogo from "../assets/Images/logo.svg"
import { Linkedin, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"

export default function LinkedIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const uid = localStorage.getItem("uid");

  const handleLinkedInConnect = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Email and password are required")
      return
    }

    setLoading(true)
    try {
      const uid = localStorage.getItem("uid")

      const res = await fetch(`${import.meta.env.VITE_API_DB_URL}/auth/linkedin-connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ email, password  })
      })

      const data = await res.json();
      console.log("LinkedIn connect response:", data);

      if (res.status === 202 && data.requiresOtp) {
        // LinkedIn requires OTP verification
        toast.info("OTP sent to your LinkedIn email")
        navigate("/verify-linkedin") // navigate to OTP page
        return
      }

      if (!res.ok) {
        toast.error("Failed to connect LinkedIn ! check credentials and try again.")
        return
      }

      toast.success("LinkedIn connected successfully!")
      navigate("/dashboard")

    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error("LinkedIn connect error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center">
        <div className="max-w-4xl w-full bg-[#302a2a] rounded-2xl p-12 shadow-2xl border border-gray-800">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-10 justify-center">
            <img src={LeadLogo} alt="logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-white">
              Stealth<span className="text-emerald-500">Lead</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white text-center mb-4">
            Connect your LinkedIn Account
          </h1>

          <p className="text-gray-400 text-center mb-10">
            To start automated outreach and campaigns, connect your LinkedIn account.
          </p>

          {/* Form */}
          <form onSubmit={handleLinkedInConnect} className="flex flex-col gap-4 max-w-sm mx-auto">

            <input
              type="email"
              placeholder="LinkedIn Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1a1f26] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="LinkedIn Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1f26] text-white border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-[#0077b5] hover:bg-[#006097] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Linkedin className="w-5 h-5" />
              }
              {loading ? "Connecting..." : "Connect LinkedIn"}
            </button>

          </form>

        </div>
      </div>
    </>
  )
}
