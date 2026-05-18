import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Shield, Users, BarChart2, MessageSquare, GitBranch,
  Globe, Clock, ArrowRight, Check, Play, TrendingUp,
  Lock, Cpu, Eye, UserPlus, Activity
} from 'lucide-react'
import logo from '../assets/Images/logo.svg'

function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

function useInView(threshold = 0.2) {
  const ref = useRef()
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function FloatingNode({ icon: Icon, label, color, style }) {
  return (
    <div style={{
      position: 'absolute', background: '#111827',
      border: `1px solid ${color}44`, borderRadius: 14,
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: `0 0 24px ${color}22`, backdropFilter: 'blur(8px)', ...style
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={13} color={color} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color, delay = 0, inView }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #111827 0%, #0d1117 100%)',
      border: '1px solid #1e2535', borderRadius: 20, padding: 28,
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.2s, box-shadow 0.2s`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.boxShadow = `0 8px 40px ${color}15` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2535'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '18', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{desc}</div>
    </div>
  )
}

function StepCard({ num, title, desc, color, inView, delay }) {
  return (
    <div style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(-24px)', transition: `all 0.6s ease ${delay}ms`, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: color + '18', border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color, fontFamily: "'Syne', sans-serif" }}>{num}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled]   = useState(false)
  const [statsRef, statsInView]   = useInView(0.3)
  const [featRef,  featInView]    = useInView(0.1)
  const [howRef,   howInView]     = useInView(0.2)
  const [seqRef,   seqInView]     = useInView(0.2)
  const [ctaRef,   ctaInView]     = useInView(0.3)

  
  const token = localStorage.getItem('token');
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  


  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const FEATURES = [
    { icon: GitBranch,     title: 'Visual Sequence Builder', color: '#6366f1', desc: "Drag-and-drop campaign builder with YES/NO conditional branches. Build multi-step drip sequences just like Dripify — but better." },
    { icon: Shield,        title: 'Anti-Detection Engine',   color: '#10b981', desc: "Gaussian human delays, session warmup, daily variance, lunch slowdowns, and weekend reduction. LinkedIn won't know the difference." },
    { icon: Globe,         title: 'Sticky Residential Proxy',color: '#f59e0b', desc: 'Each user gets a dedicated residential IP that stays consistent throughout their campaign. No IP rotation mid-sequence.' },
    { icon: Clock,         title: 'Smart Scheduling Queue',  color: '#ec4899', desc: 'Triggered outside safe hours? We queue it and run at exactly 9 AM. Guaranteed execution — no missed follow-ups.' },
    { icon: BarChart2,     title: 'Conversion Analytics',    color: '#8b5cf6', desc: 'Track micro, standard and ultimate conversions. See acceptance rate, reply rate, and meetings booked per campaign.' },
    { icon: MessageSquare, title: 'Unified Inbox',           color: '#06b6d4', desc: 'Sync your LinkedIn inbox, view all conversations, and reply directly from the platform without opening LinkedIn.' },
    { icon: Users,         title: 'Lead Scraper',            color: '#f97316', desc: 'Import leads from any LinkedIn search URL. Scrapes name, company, headline, location and profile image automatically.' },
    { icon: Activity,      title: 'Campaign Timeline',       color: '#10b981', desc: 'See exactly where every lead is in your sequence — which steps are done, overdue, or upcoming with real dates.' },
  ]

  const STEPS = [
    { num: '01', title: 'Connect your LinkedIn',  color: '#10b981', desc: 'Log in with your LinkedIn credentials. We store an encrypted session cookie — your password is never saved.' },
    { num: '02', title: 'Build your sequence',    color: '#6366f1', desc: 'Use the visual builder to create your outreach flow. View Profile → Wait → Connect → Message → Follow-up.' },
    { num: '03', title: 'Import leads',           color: '#f59e0b', desc: 'Paste a LinkedIn search URL. We scrape profiles with full data — name, company, headline, location, photo.' },
    { num: '04', title: 'Launch and track',       color: '#ec4899', desc: 'Hit Launch. The automation sends connections during safe hours, follows up automatically, and tracks every conversion.' },
  ]

  return (
    <div style={{ background: '#0d1117', color: '#e2e8f0', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float      { 0%,100%{transform:translateY(0)}     50%{transform:translateY(-12px)} }
        @keyframes float2     { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6}   100%{transform:scale(1.8);opacity:0} }
        @keyframes shimmer    { 0%{background-position:-200% center}  100%{background-position:200% center} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        .hero-title   { font-family:'Syne',sans-serif; font-size:clamp(40px,6vw,80px); font-weight:800; line-height:1.05; letter-spacing:-0.03em; color:#fff; }
        .shimmer-text { background:linear-gradient(90deg,#10b981 0%,#6ee7b7 40%,#10b981 60%,#059669 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
        .nav-link     { font-size:14px; color:#6b7280; cursor:pointer; text-decoration:none; transition:color 0.15s; font-weight:500; }
        .nav-link:hover { color:#e2e8f0; }
        .btn-primary  { display:inline-flex; align-items:center; gap:8px; background:#10b981; color:#fff; border:none; padding:14px 28px; border-radius:12px; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; position:relative; overflow:hidden; }
        .btn-primary::after { content:''; position:absolute; inset:0; background:linear-gradient(to right,transparent,rgba(255,255,255,0.1),transparent); transform:translateX(-100%); transition:transform 0.4s; }
        .btn-primary:hover::after { transform:translateX(100%); }
        .btn-primary:hover { background:#059669; transform:translateY(-1px); box-shadow:0 8px 24px #10b98144; }
        .btn-ghost    { display:inline-flex; align-items:center; gap:8px; background:transparent; color:#9ca3af; border:1px solid #2a3245; padding:14px 28px; border-radius:12px; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; }
        .btn-ghost:hover { border-color:#4b5563; color:#e2e8f0; background:#111827; }
        .stat-num     { font-family:'Syne',sans-serif; font-size:clamp(32px,4vw,52px); font-weight:800; color:#fff; line-height:1; }
        .section-label{ font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#10b981; margin-bottom:12px; }
        .section-title{ font-family:'Syne',sans-serif; font-size:clamp(28px,3.5vw,46px); font-weight:800; color:#fff; line-height:1.15; letter-spacing:-0.02em; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: '0 5vw', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(13,17,23,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid #1e2535' : '1px solid transparent', transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px #10b98144' }}>
            <img src={logo} alt="Logo" />
          </div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: '#fff' }}>Stealth<span style={{ color: '#10b981' }}>Lead</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {['Features', 'How it works'].map(item => (
            <a key={item} className="nav-link" onClick={() => document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' })}>{item}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" style={{ padding: '9px 20px', fontSize: 13 }} onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }} onClick={() => navigate('/register')}>Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 5vw 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,#10b98112 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(#1e253508 1px,transparent 1px),linear-gradient(90deg,#1e253508 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#10b98112', border: '1px solid #10b98133', borderRadius: 40, padding: '7px 16px', marginBottom: 28, animation: 'fadeUp 0.6s ease both' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>The smarter LinkedIn outreach platform</span>
        </div>

        <h1 className="hero-title" style={{ textAlign: 'center', maxWidth: 840, animation: 'fadeUp 0.6s ease 0.1s both' }}>
          Automate LinkedIn outreach<br /><span className="shimmer-text">without getting banned</span>
        </h1>

        <p style={{ fontSize: 18, color: '#6b7280', marginTop: 24, maxWidth: 560, textAlign: 'center', lineHeight: 1.7, fontWeight: 400, animation: 'fadeUp 0.6s ease 0.2s both' }}>
          Build multi-step drip sequences, scrape leads, send connections and follow-ups — all with human-like behavior that keeps your account safe.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 36, animation: 'fadeUp 0.6s ease 0.3s both', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-primary" style={{ fontSize: 15, padding: '14px 32px' }} onClick={() => navigate('/register')}>Start for free <ArrowRight size={16} /></button>
          <button className="btn-ghost"   style={{ fontSize: 15, padding: '14px 32px' }} onClick={() => navigate('/login')}><Play size={15} /> Log in</button>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 0.6s ease 0.4s both' }}>
          {['✅ No credit card required', '🔒 Encrypted session storage', '🚀 Setup in 5 minutes'].map(t => (
            <span key={t} style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>{t}</span>
          ))}
        </div>

        {/* Hero visual */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 720, height: 340, marginTop: 64, animation: 'fadeUp 0.8s ease 0.5s both' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: '#111827', border: '1px solid #10b98133', borderRadius: 20, padding: '20px 28px', minWidth: 240, boxShadow: '0 0 60px #10b98122', animation: 'float 4s ease-in-out infinite', zIndex: 10 }}>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Active Sequence</div>
            {[
              { step: 'View Profile',  status: 'done',    color: '#10b981' },
              { step: 'Send Connect',  status: 'done',    color: '#10b981' },
              { step: 'Follow Up',     status: 'running', color: '#6366f1' },
              { step: 'Final Message', status: 'pending', color: '#2a3245' },
            ].map(({ step, status, color }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: color + '22', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {status === 'done'    && <Check size={10} color={color} />}
                  {status === 'running' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
                </div>
                <span style={{ fontSize: 12, color: status === 'pending' ? '#4b5563' : '#e2e8f0', fontWeight: 500 }}>{step}</span>
                {status === 'running' && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6366f1', fontWeight: 600 }}>LIVE</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}

      {/* Features */}
      <section id="features" ref={featRef} style={{ padding: '100px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-label">Everything you need</div>
            <h2 className="section-title">Built for serious<br />LinkedIn outreach</h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginTop: 16, maxWidth: 480, margin: '16px auto 0', lineHeight: 1.7 }}>
              Every feature is designed to maximize replies while keeping your account safe from LinkedIn's detection systems.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 60} inView={featInView} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '100px 5vw', background: '#0a0f16' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div ref={howRef}>
            <div className="section-label">Simple process</div>
            <h2 className="section-title" style={{ marginBottom: 48 }}>Up and running<br />in minutes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {STEPS.map((s, i) => <StepCard key={s.num} {...s} inView={howInView} delay={i * 120} />)}
            </div>
          </div>
          <div style={{ position: 'relative', height: 480 }}>
            <div style={{ position: 'absolute', inset: 0, background: '#111827', border: '1px solid #1e2535', borderRadius: 20, overflow: 'hidden', padding: 24, animation: 'float 6s ease-in-out infinite' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Sequence Builder</div>
              {[
                { type: 'view_profile', label: 'View Profile',    color: '#8b5cf6', done: true,  isDiamond: false },
                { type: 'wait',         label: 'Wait 2 hours',    color: '#64748b', done: true,  isDiamond: false },
                { type: 'connect',      label: 'Send Connection', color: '#6366f1', done: true,  isDiamond: false },
                { type: 'wait',         label: 'Wait 2 days',     color: '#64748b', done: false, isDiamond: false },
                { type: 'condition',    label: 'Accepted?',       color: '#06b6d4', done: false, isDiamond: true  },
              ].map((node, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {i > 0 && <div style={{ width: 1, height: 16, background: node.done ? '#2a3245' : '#1e2535' }} />}
                  {node.isDiamond ? (
                    <div style={{ width: 56, height: 56, background: node.color + '18', border: `2px solid ${node.color}44`, transform: 'rotate(45deg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                      <GitBranch size={14} color={node.color} style={{ transform: 'rotate(-45deg)' }} />
                    </div>
                  ) : (
                    <div style={{ background: node.done ? node.color + '18' : '#0d1117', border: `1px solid ${node.done ? node.color + '55' : '#2a3245'}`, borderRadius: node.type === 'wait' ? 40 : 10, padding: node.type === 'wait' ? '6px 16px' : '9px 16px', display: 'flex', alignItems: 'center', gap: 8, width: node.type === 'wait' ? 'auto' : '100%' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: node.done ? '#e2e8f0' : '#4b5563', fontWeight: 500 }}>{node.label}</span>
                      {node.done && <Check size={11} color={node.color} style={{ marginLeft: 'auto' }} />}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingLeft: 8 }}>
                <div style={{ background: '#10b98115', border: '1px solid #10b98130', borderRadius: 8, padding: '6px 14px', fontSize: 11, color: '#10b981', fontWeight: 700 }}>YES → Send message</div>
                <div style={{ background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '6px 14px', fontSize: 11, color: '#ef4444', fontWeight: 700 }}>NO → Send InMail</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Anti-detection */}
      <section ref={seqRef} style={{ padding: '100px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', marginBottom: 60 }}>
          <div className="section-label">Stay safe</div>
          <h2 className="section-title">Designed to be<br />undetectable</h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginTop: 16, maxWidth: 520, margin: '16px auto 0', lineHeight: 1.7 }}>
            Every aspect of the automation mimics real human behavior. LinkedIn's detection systems look for patterns — we break every single one.
          </p>
        </div>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { icon: Cpu,        title: 'Gaussian timing',       color: '#10b981', desc: 'Box-Muller random delays between every action. Typing speed, click pauses, reading time — all randomized with a normal distribution.' },
            { icon: Globe,      title: 'Residential proxy',     color: '#6366f1', desc: 'Your dedicated residential IP stays consistent throughout your campaign. Same IP = same trusted user to LinkedIn.' },
            { icon: Clock,      title: 'Safe hour enforcement', color: '#f59e0b', desc: '9am–6pm weekdays only. Lunch slowdowns, weekend reduction, random daily variance. Never exactly 20 connections per day.' },
            { icon: TrendingUp, title: 'Account warmup',        color: '#ec4899', desc: 'New accounts start at 5 connections/day and ramp to 20 over 2 weeks. Never go from 0 to full speed on day 1.' },
            { icon: Eye,        title: 'Profile view warmup',   color: '#8b5cf6', desc: 'View the profile before connecting. Scroll, move mouse, pause at sections — then connect. Looks completely human.' },
            { icon: Lock,       title: 'Encrypted sessions',    color: '#06b6d4', desc: 'LinkedIn session cookies are AES-256 encrypted before storage. Your credentials are never saved in plain text.' },
          ].map((card, i) => <FeatureCard key={card.title} {...card} delay={i * 60} inView={seqInView} />)}
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} style={{ padding: '100px 5vw', background: '#0a0f16' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', opacity: ctaInView ? 1 : 0, transform: ctaInView ? 'translateY(0)' : 'translateY(32px)', transition: 'all 0.8s ease' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,#10b981 0%,transparent 70%)', margin: '0 auto 32px', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1px solid #10b98133', animation: 'pulse-ring 2s ease infinite' }} />
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#10b98122', border: '2px solid #10b98144', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={32} color="#10b981" />
            </div>
          </div>
          <h2 className="section-title" style={{ marginBottom: 20 }}>Ready to automate your<br />LinkedIn outreach?</h2>
          <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7, marginBottom: 36 }}>
            Join sales professionals using StealthLead to fill their pipeline — safely and automatically.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: 15, padding: '15px 36px' }} onClick={() => navigate('/register')}>Get started for free <ArrowRight size={16} /></button>
            <button className="btn-ghost"   style={{ fontSize: 15, padding: '15px 36px' }} onClick={() => navigate('/login')}>Log in</button>
          </div>
          <div style={{ fontSize: 12, color: '#374151', marginTop: 20 }}>No credit card · No LinkedIn API · Setup in 5 minutes</div>
        </div>
      </section>

      {/* Minimal footer — no links */}
      <footer style={{ borderTop: '1px solid #1e2535', padding: '24px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logo} alt="Logo" />
          </div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: '#fff' }}>Stealth<span style={{ color: '#10b981' }}>Lead</span></span>
        </div>
        <div style={{ fontSize: 12, color: '#374151' }}>© 2026 StealthLead. All rights reserved.</div>
      </footer>
    </div>
  )
}