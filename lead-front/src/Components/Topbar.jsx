import React from 'react'
import LeadLogo from '../assets/Images/logo.svg'
import { Bell, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TopBar() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/profile')
  }

  return (
    <div className="w-full bg-[#0f1720] px-6 py-3 flex items-center justify-between border-b border-gray-800 z-50 sticky">

      {/* Left */}
      <div 
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate('/dashboard')}
      >
        <img src={LeadLogo} alt="logo" className="w-9 h-9" />

        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold text-white">
            Stealth<span className="text-emerald-500">Lead</span>
          </span>
          <span className="text-[10px] text-gray-400 tracking-wide">
            AUTOMATED B2B PLATFORM
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-7">
        <div className="text-gray-400 hover:text-white cursor-pointer transition">
          <Bell className="w-8 h-8" />
        </div>

        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white cursor-pointer">
          <User className="text-gray-900 w-8 h-8" onClick={handleClick} />
        </div>
      </div>

    </div>
  )
}