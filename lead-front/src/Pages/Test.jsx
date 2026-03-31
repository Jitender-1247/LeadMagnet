import React from 'react'
import { useNavigate } from 'react-router-dom'
import LeadLogo from '../assets/Images/logo.svg'
import { Lock, Mail } from 'lucide-react'

export default function Test() {
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    navigate('/connect-linkedin')
  }

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google"
  }

  return (
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
                  className="bg-transparent w-full text-white p-3 outline-none"
                />
              </div>

              {/* Password */}
              <div className="flex items-center bg-[#302a2a] border border-gray-700 rounded-xl px-3">
                <Lock className="text-white w-5 h-5 mr-2" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="bg-transparent w-full text-white p-3 outline-none"
                />
              </div>

              {/* Sign In */}
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition"
              >
                Sign In
              </button>

              {/* Divider */}
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="text-gray-400 text-sm">or continue with</span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="w-5 h-5"
                />
                Sign in with Google
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  )
}




// import React, { useState } from 'react';
// import { Shield, Zap, Mail, Lock, Globe, ArrowRight, CheckCircle2, Key } from 'lucide-react';

// export default function Login() {
//   // 1. State Management
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     liEmail: '',
//     liPassword: '',
//     otp: ''
//   });

//   // 2. Input Handler
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // 3. Step Navigation Logic
//   const handleNextStep = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     // Simulate API Latency (e.g., calling /api/v1/auth/platform-login)
//     setTimeout(() => {
//       setLoading(false);
//       setStep(step + 1);
//     }, 1500);
//   };

//   return (
//     <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-4">
//       <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-[#302a2a] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
        
//         {/* Left Panel (Static) */}
//         <div className="hidden md:flex p-12 bg-linear-to-br from-[#0f172a] to-[#1e293b] flex-col justify-between relative">
//           <div className="relative z-10">
//             <div className="flex items-center gap-2 mb-12">
//               <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Shield className="text-white" /></div>
//               <span className="text-2xl font-bold text-white">StealthLead</span>
//             </div>
//             <h1 className="text-4xl font-bold text-white mb-6">Automate with <span className="text-blue-500">Confidence.</span></h1>
//             <div className="space-y-6">
//               <div className="flex items-center gap-4 text-gray-300"><Zap className="text-blue-400 w-5 h-5" /> <span>Human Behavior Simulation</span></div>
//               <div className="flex items-center gap-4 text-gray-300"><Globe className="text-blue-400 w-5 h-5" /> <span>Dedicated Residential Proxy</span></div>
//             </div>
//           </div>    
//         </div>

//         {/* Right Panel (Dynamic Form) */}
//         <div className="p-12 bg-[#0f172a]">
          
//           {/* Progress Stepper */}
//           <div className="flex justify-between mb-12">
//             {[1, 2, 3].map((s) => (
//               <div key={s} className="flex flex-col items-center gap-2">
//                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
//                   {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Step 1: Platform Login */}
//           {step === 1 && (
//             <form onSubmit={handleNextStep} className="animate-in fade-in duration-500">
//               <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
//               <div className="space-y-4">
//                 <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} className="w-full bg-[#1e293b] border border-gray-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
//                 <input name="password" type="password" placeholder="Password" required onChange={handleChange} className="w-full bg-[#1e293b] border border-gray-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
//                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
//                   {loading ? "Authenticating..." : "Continue to LinkedIn Connection"}
//                 </button>
//               </div>
//             </form>
//           )}

//           {/* Step 2: LinkedIn Credentials */}
//           {step === 2 && (
//             <form onSubmit={handleNextStep} className="animate-in slide-in-from-right duration-500">
//               <h2 className="text-2xl font-bold text-white mb-2">Connect LinkedIn</h2>
//               <p className="text-gray-400 text-sm mb-6">We need these to establish your cloud session.</p>
//               <div className="space-y-4">
//                 <input name="liEmail" type="email" placeholder="LinkedIn Email" required onChange={handleChange} className="w-full bg-[#1e293b] border border-gray-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
//                 <input name="liPassword" type="password" placeholder="LinkedIn Password" required onChange={handleChange} className="w-full bg-[#1e293b] border border-gray-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
//                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl">
//                   {loading ? "Establishing Bridge..." : "Securely Connect"}
//                 </button>
//               </div>
//             </form>
//           )}

//           {/* Step 3: OTP Verification */}
//           {step === 3 && (
//             <form onSubmit={(e) => { e.preventDefault(); alert("Dashboard Access Granted!"); }} className="animate-in slide-in-from-right duration-500">
//               <div className="text-center mb-6">
//                 <Key className="w-12 h-12 text-blue-500 mx-auto mb-4" />
//                 <h2 className="text-2xl font-bold text-white">Enter OTP</h2>
//                 <p className="text-gray-400 text-sm">Check your email or authenticator app.</p>
//               </div>
//               <div className="space-y-4">
//                 <input name="otp" type="text" placeholder="6-Digit Code" required onChange={handleChange} className="w-full bg-[#1e293b] border border-gray-700 text-center text-2xl tracking-[1em] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
//                 <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all">
//                   Verify & Enter Dashboard
//                 </button>
//                 <button type="button" onClick={() => setStep(2)} className="w-full text-gray-500 text-sm hover:text-white">Back to credentials</button>
//               </div>
//             </form>
//           )}

//         </div>
//       </div>
//     </div>
//   );
// };

