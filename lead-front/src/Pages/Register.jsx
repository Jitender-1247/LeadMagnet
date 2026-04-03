import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LeadLogo from '../assets/Images/logo.svg'
import { User, Mail, Lock, ZapIcon, Globe2Icon, Inbox } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

export default function Register() {
  const navigate = useNavigate()
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [confirmPassword,setConfirmPassword] = useState('');
  const [name,setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
      const response = await fetch(import.meta.env.VITE_API_DB_URL + '/auth/register',{
        method:'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('uid',data.uid);
        localStorage.setItem('token', data.token);
        toast.success('Registration successful!');
        setTimeout(() => navigate('/verify-email'), 1000);
      } else {
        toast.error(data.error || 'Registration failed');
      }

    } catch(error){
      toast.error('Registration error:', error);
    }finally{
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${import.meta.env.VITE_API_DB_URL}/auth/register`;
  }
 

  return (
    <>
    <ToastContainer position='top-center' theme='colored'/>
    <div className='min-h-screen bg-[#0a0f16] flex items-center justify-center'>
      <div className='max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-[#302a2a] rounded-2xl overflow-hidden shadow-2xl border border-gray-800'>

        {/* Left Panel */}
        <div className='p-12'>
          <div className='relative z-10'>
            <div className='flex items-center gap-2 mb-12'>
              <img src={LeadLogo} alt="logo" className='w-12 h-12' />
              <span className='text-3xl font-bold text-white'>
                Stealth<span className='text-emerald-500'>Lead</span>
              </span>
            </div>

            <h1 className='text-4xl font-bold text-white mb-6'>
              Start Automating <span className='text-emerald-500'>Today.</span>
            </h1>

            <div className="space-y-4 mt-12">
              <div className="flex items-center gap-4 text-gray-200 font-mono text-lg">
                <ZapIcon className="text-emerald-400 w-5 h-7" />
                <span>Human Behavior Simulation</span>
              </div>
              <div className="flex items-center gap-4 text-gray-200 font-mono text-lg">
                <Globe2Icon className="text-emerald-400 w-5 h-7" />
                <span>Dedicated Residential Proxy</span>
              </div>
              <div className="flex items-center gap-4 text-gray-200 font-mono text-lg">
                <Inbox className="text-emerald-400 w-5 h-7" />
                <span>Centralized Lead Inbox</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className='p-12 bg-[#392f34]'>
          <form onSubmit={handleRegister}>
            
            <h2 className="text-2xl font-bold text-white mb-8 text-center mt-2">
              Create your Stealth<span className="text-emerald-500">Lead</span> Account
            </h2>

            <div className="space-y-4">

              {/* Name */}
              <div className="flex items-center bg-[#302a2a] border border-gray-700 rounded-xl px-3">
                <User className="text-white w-5 h-5 mr-2" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent w-full text-white p-3 outline-none"
                  required
                />
              </div>

              {/* Email */}
              <div className="flex items-center bg-[#302a2a] border border-gray-700 rounded-xl px-3">
                <Mail className="text-white w-5 h-5 mr-2" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent w-full text-white p-3 outline-none"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex items-center bg-[#302a2a] border border-gray-700 rounded-xl px-3">
                <Lock className="text-white w-5 h-5 mr-2" />
                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent w-full text-white p-3 outline-none"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="flex items-center bg-[#302a2a] border border-gray-700 rounded-xl px-3">
                <Lock className="text-white w-5 h-5 mr-2" />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent w-full text-white p-3 outline-none"
                  required
                />
              </div>

              {/* Register Button */}
              {password !== confirmPassword ? (
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition"
                  disabled
                >
                  Create Account
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || password !== confirmPassword}
                  className={`w-full font-bold py-3 rounded-xl transition text-white ${
                    loading
                      ? 'bg-emerald-700 cursor-not-allowed'
                      : password !== confirmPassword
                      ? 'bg-emerald-500 opacity-50 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating Account...
                    </span>
                  ) : 'Create Account'}
                </button>
              )}

              <span className='text-gray-300 text-sm'>
                Already have an account?{" "}
                <a href="/login" className="text-emerald-500 hover:underline">
                  Sign in
                </a>
              </span>


            </div>
          </form>
        </div>

      </div>
    </div>
    </>
  )
}