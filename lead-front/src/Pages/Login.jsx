import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LeadLogo from '../assets/Images/logo.svg'
import { Globe, Globe2Icon, Inbox, Lock, Mail, Zap, ZapIcon } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify';

export default function Login() {
  const navigate = useNavigate();
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
      const response = await fetch(import.meta.env.VITE_API_DB_URL + '/auth/platform-login',{
        method:'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Login successful!');
        localStorage.setItem('token', data.token);
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch(error){
      toast.error('Login error:', error);
    } finally{
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google"
  }

  return (
    <>
    <ToastContainer/>
    <div className='min-h-screen bg-[#0a0f16] flex items-center justify-center'>
      <div className='max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-[#302a2a] rounded-2xl overflow-hidden shadow-2xl border border-gray-800'>

        {/* Left Panel */}
        <div className='p-12'>
          <div className='relative z-10'>
            <div className='flex items-center gap-2 mb-12'>
              <img src={LeadLogo} alt="StealthLead Logo" className='w-12 h-12' />
              <span className='text-3xl font-bold text-white'>
                Stealth<span className='text-emerald-500'>Lead</span>
              </span>
            </div>

            <h1 className='text-4xl font-bold text-white mb-6'>
              Automate with <span className='text-emerald-500 font-medium'>Confidence.</span>
            </h1>
            <div className="space-y-3 mt-8">
               <div className="flex items-center gap-4 text-gray-200 font-mono text-lg"><ZapIcon className="text-emerald-400 w-5 h-7" /> <span>Human Behavior Simulation</span></div>
               <div className="flex items-center gap-4 text-gray-200 font-mono text-lg"><Globe2Icon className="text-emerald-400 w-5 h-7" /> <span>Dedicated Residential Proxy</span></div>
               <div className="flex items-center gap-4 text-gray-200 font-mono text-lg"><Inbox className="text-emerald-400 w-5 h-7" /> <span>Centralized Lead Inbox</span></div>
           </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className='p-12 bg-[#392f34]'>
          <form onSubmit={handleLogin}>
            
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Welcome to Stealth<span className="text-emerald-500">Lead</span>
            </h2>

            <div className="space-y-4">

              {/* Email */}
              <div className="flex items-center bg-[#302a2a] border border-gray-700 rounded-xl px-3">
                <Mail className="text-white w-5 h-5 mr-2" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent w-full text-white p-3 outline-none"
                />
              </div>

              {/* Password */}
              <div className="flex items-center bg-[#302a2a] border border-gray-700 rounded-xl px-3">
                <Lock className="text-white w-5 h-5 mr-2" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent w-full text-white p-3 outline-none"
                />
              </div>

              {/* Sign In */}
              <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              <span className='text-gray-300'>Don't have an account? <a href="/register" className="text-emerald-500 hover:underline">Sign up</a></span>



            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}