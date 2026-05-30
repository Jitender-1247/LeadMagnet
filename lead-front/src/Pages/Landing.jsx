import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Shield, Users, BarChart2, MessageSquare, GitBranch,
  Globe, Clock, ArrowRight, Check, Play, TrendingUp,
  Lock, Cpu, Eye, Activity, Menu, X
} from 'lucide-react'
import logo from '../assets/Images/logo.svg'

function useIsMobile() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w < 768
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

function FeatureCard({ icon: Icon, title, desc, color, delay = 0, inView }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #111827 0%, #0d1117 100%)',
      border: '1px solid #1e2535', borderRadius: 20, padding: 24,
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.2s, box-shadow 0.2s`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.boxShadow = `0 8px 40px ${color}15` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2535'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>{desc}</div>
    </div>
  )
}

function StepCard({ num, title, desc, color, inView, delay }) {
  return (
    <div style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(-24px)', transition: `all 0.6s ease ${delay}ms`, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: color + '18', border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color, fontFamily: "'Syne', sans-serif" }}>{num}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [featRef,  featInView]      = useInView(0.1)
  const [howRef,   howInView]       = useInView(0.2)
  const [seqRef,   seqInView]       = useInView(0.2)
  const [ctaRef,   ctaInView]       = useInView(0.3)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) navigate('/dashboard', { replace: true })
  }, [navigate])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Close mobile menu on scroll
  useEffect(() => {
    if (menuOpen) setMenuOpen(false)
  }, [scrolled])

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

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
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6}   100%{transform:scale(1.8);opacity:0} }
        @keyframes shimmer    { 0%{background-position:-200% center}  100%{background-position:200% center} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        .hero-title   { font-family:'Syne',sans-serif; font-size:clamp(32px,6vw,80px); font-weight:800; line-height:1.05; letter-spacing:-0.03em; color:#fff; }
        .shimmer-text { background:linear-gradient(90deg,#10b981 0%,#6ee7b7 40%,#10b981 60%,#059669 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
        .btn-primary  { display:inline-flex; align-items:center; gap:8px; background:#10b981; color:#fff; border:none; padding:13px 26px; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; position:relative; overflow:hidden; }
        .btn-primary:hover { background:#059669; transform:translateY(-1px); box-shadow:0 8px 24px #10b98144; }
        .btn-ghost    { display:inline-flex; align-items:center; gap:8px; background:transparent; color:#9ca3af; border:1px solid #2a3245; padding:13px 26px; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; }
        .btn-ghost:hover { border-color:#4b5563; color:#e2e8f0; background:#111827; }
        .section-label{ font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#10b981; margin-bottom:12px; }
        .section-title{ font-family:'Syne',sans-serif; font-size:clamp(24px,3.5vw,46px); font-weight:800; color:#fff; line-height:1.15; letter-spacing:-0.02em; }
        .nav-link     { font-size:14px; color:#6b7280; cursor:pointer; text-decoration:none; transition:color 0.15s; font-weight:500; background:none; border:none; font-family:inherit; }
        .nav-link:hover { color:#e2e8f0; }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: isMobile ? '0 18px' : '0 5vw', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(13,17,23,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #1e2535' : '1px solid transparent',
        transition: 'all 0.3s'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px #10b98144' }}>
            <img src={logo} alt="Logo" />
          </div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: '#fff' }}>Stealth<span style={{ color: '#10b981' }}>Lead</span></span>
        </div>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {['Features', 'How it works'].map(item => (
              <button key={item} className="nav-link" onClick={() => scrollTo(item === 'Features' ? 'features' : 'how-it-works')}>{item}</button>
            ))}
          </div>
        )}

        {/* Desktop CTA buttons */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('/login')}>Log in</button>
            <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('/register')}>Get started free</button>
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 6 }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </nav>

      {/* Mobile menu drawer */}
      {isMobile && menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'fixed', top: 60, left: 0, right: 0, zIndex: 160,
            background: '#111827', borderBottom: '1px solid #1e2535',
            padding: '20px 20px 28px', display: 'flex', flexDirection: 'column', gap: 4
          }}>
            {['Features', 'How it works'].map(item => (
              <button key={item} onClick={() => scrollTo(item === 'Features' ? 'features' : 'how-it-works')}
                style={{ textAlign: 'left', padding: '12px 0', background: 'none', border: 'none', color: '#9ca3af', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', borderBottom: '1px solid #1e2535' }}>
                {item}
              </button>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => { setMenuOpen(false); navigate('/login') }}>Log in</button>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => { setMenuOpen(false); navigate('/register') }}>Get started free</button>
            </div>
          </div>
        </>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '100px 20px 60px' : '120px 5vw 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: isMobile ? 320 : 600, height: isMobile ? 320 : 600, borderRadius: '50%', background: 'radial-gradient(circle,#10b98112 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(#1e253508 1px,transparent 1px),linear-gradient(90deg,#1e253508 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#10b98112', border: '1px solid #10b98133', borderRadius: 40, padding: '6px 14px', marginBottom: 24, animation: 'fadeUp 0.6s ease both' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>The smarter LinkedIn outreach platform</span>
        </div>

        <h1 className="hero-title" style={{ textAlign: 'center', maxWidth: 840, animation: 'fadeUp 0.6s ease 0.1s both', padding: '0 8px' }}>
          Automate LinkedIn outreach<br /><span className="shimmer-text">without getting banned</span>
        </h1>

        <p style={{ fontSize: isMobile ? 15 : 17, color: '#6b7280', marginTop: 20, maxWidth: 520, textAlign: 'center', lineHeight: 1.7, fontWeight: 400, animation: 'fadeUp 0.6s ease 0.2s both', padding: '0 8px' }}>
          Build multi-step drip sequences, scrape leads, send connections and follow-ups — all with human-like behavior that keeps your account safe.
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 32, animation: 'fadeUp 0.6s ease 0.3s both', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/register')}>Start for free <ArrowRight size={15} /></button>
          <button className="btn-ghost"   onClick={() => navigate('/login')}><Play size={14} /> Log in</button>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 14 : 24, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 0.6s ease 0.4s both', padding: '0 16px' }}>
          {['✅ No credit card required', '🔒 Encrypted session storage', '🚀 Setup in 5 minutes'].map(t => (
            <span key={t} style={{ fontSize: 12, color: '#4b5563', fontWeight: 500 }}>{t}</span>
          ))}
        </div>

        {/* Hero visual */}
        <div style={{ position: 'relative', width: '100%', maxWidth: isMobile ? 320 : 560, marginTop: 56, animation: 'fadeUp 0.8s ease 0.5s both' }}>
          <div style={{ background: '#111827', border: '1px solid #10b98133', borderRadius: 20, padding: isMobile ? '18px 20px' : '20px 28px', boxShadow: '0 0 60px #10b98122', animation: 'float 4s ease-in-out infinite' }}>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Active Sequence</div>
            {[
              { step: 'View Profile',  status: 'done',    color: '#10b981' },
              { step: 'Send Connect',  status: 'done',    color: '#10b981' },
              { step: 'Follow Up',     status: 'running', color: '#6366f1' },
              { step: 'Final Message', status: 'pending', color: '#2a3245' },
            ].map(({ step, status, color }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: color + '22', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {status === 'done'    && <Check size={9} color={color} />}
                  {status === 'running' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
                </div>
                <span style={{ fontSize: 13, color: status === 'pending' ? '#4b5563' : '#e2e8f0', fontWeight: 500 }}>{step}</span>
                {status === 'running' && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6366f1', fontWeight: 700 }}>LIVE</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" ref={featRef} style={{ padding: isMobile ? '60px 20px' : '100px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div className="section-label">Everything you need</div>
            <h2 className="section-title">Built for serious<br />LinkedIn outreach</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 14, maxWidth: 460, margin: '14px auto 0', lineHeight: 1.7 }}>
              Every feature is designed to maximize replies while keeping your account safe from LinkedIn's detection systems.
            </p>
          </div>
          {/* 1 col mobile, 2 col tablet, 4 col desktop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 12 : 20
          }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 60} inView={featInView} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: isMobile ? '60px 20px' : '100px 5vw', background: '#0a0f16' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Stacks on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, alignItems: 'center' }}>
            <div ref={howRef}>
              <div className="section-label">Simple process</div>
              <h2 className="section-title" style={{ marginBottom: 36 }}>Up and running<br />in minutes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                {STEPS.map((s, i) => <StepCard key={s.num} {...s} inView={howInView} delay={i * 120} />)}
              </div>
            </div>

            {/* Sequence preview — hidden on mobile to save space */}
            {!isMobile && (
              <div style={{ position: 'relative', height: 460 }}>
                <div style={{ position: 'absolute', inset: 0, background: '#111827', border: '1px solid #1e2535', borderRadius: 20, overflow: 'hidden', padding: 24, animation: 'float 6s ease-in-out infinite' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>Sequence Builder</div>
                  {[
                    { type: 'view_profile', label: 'View Profile',    color: '#8b5cf6', done: true,  isDiamond: false },
                    { type: 'wait',         label: 'Wait 2 hours',    color: '#64748b', done: true,  isDiamond: false },
                    { type: 'connect',      label: 'Send Connection', color: '#6366f1', done: true,  isDiamond: false },
                    { type: 'wait',         label: 'Wait 2 days',     color: '#64748b', done: false, isDiamond: false },
                    { type: 'condition',    label: 'Accepted?',       color: '#06b6d4', done: false, isDiamond: true  },
                  ].map((node, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {i > 0 && <div style={{ width: 1, height: 14, background: node.done ? '#2a3245' : '#1e2535' }} />}
                      {node.isDiamond ? (
                        <div style={{ width: 52, height: 52, background: node.color + '18', border: `2px solid ${node.color}44`, transform: 'rotate(45deg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                          <GitBranch size={13} color={node.color} style={{ transform: 'rotate(-45deg)' }} />
                        </div>
                      ) : (
                        <div style={{ background: node.done ? node.color + '18' : '#0d1117', border: `1px solid ${node.done ? node.color + '55' : '#2a3245'}`, borderRadius: node.type === 'wait' ? 40 : 10, padding: node.type === 'wait' ? '5px 14px' : '8px 14px', display: 'flex', alignItems: 'center', gap: 8, width: node.type === 'wait' ? 'auto' : '100%' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: node.done ? '#e2e8f0' : '#4b5563', fontWeight: 500 }}>{node.label}</span>
                          {node.done && <Check size={10} color={node.color} style={{ marginLeft: 'auto' }} />}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingLeft: 8 }}>
                    <div style={{ background: '#10b98115', border: '1px solid #10b98130', borderRadius: 8, padding: '5px 12px', fontSize: 10, color: '#10b981', fontWeight: 700 }}>YES → Send message</div>
                    <div style={{ background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '5px 12px', fontSize: 10, color: '#ef4444', fontWeight: 700 }}>NO → Send InMail</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Anti-detection ───────────────────────────────────────────────────── */}
      <section ref={seqRef} style={{ padding: isMobile ? '60px 20px' : '100px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div className="section-label">Stay safe</div>
            <h2 className="section-title">Designed to be<br />undetectable</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 14, maxWidth: 480, margin: '14px auto 0', lineHeight: 1.7 }}>
              Every aspect of the automation mimics real human behavior. LinkedIn's detection systems look for patterns — we break every single one.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 12 : 20
          }}>
            {[
              { icon: Cpu,        title: 'Gaussian timing',       color: '#10b981', desc: 'Box-Muller random delays between every action. Typing speed, click pauses, reading time — all randomized with a normal distribution.' },
              { icon: Globe,      title: 'Residential proxy',     color: '#6366f1', desc: 'Your dedicated residential IP stays consistent throughout your campaign. Same IP = same trusted user to LinkedIn.' },
              { icon: Clock,      title: 'Safe hour enforcement', color: '#f59e0b', desc: '9am–6pm weekdays only. Lunch slowdowns, weekend reduction, random daily variance. Never exactly 20 connections per day.' },
              { icon: TrendingUp, title: 'Account warmup',        color: '#ec4899', desc: 'New accounts start at 5 connections/day and ramp to 20 over 2 weeks. Never go from 0 to full speed on day 1.' },
              { icon: Eye,        title: 'Profile view warmup',   color: '#8b5cf6', desc: 'View the profile before connecting. Scroll, move mouse, pause at sections — then connect. Looks completely human.' },
              { icon: Lock,       title: 'Encrypted sessions',    color: '#06b6d4', desc: 'LinkedIn session cookies are AES-256 encrypted before storage. Your credentials are never saved in plain text.' },
            ].map((card, i) => <FeatureCard key={card.title} {...card} delay={i * 60} inView={seqInView} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section ref={ctaRef} style={{ padding: isMobile ? '60px 20px' : '100px 5vw', background: '#0a0f16' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', opacity: ctaInView ? 1 : 0, transform: ctaInView ? 'translateY(0)' : 'translateY(32px)', transition: 'all 0.8s ease' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'radial-gradient(circle,#10b981 0%,transparent 70%)', margin: '0 auto 28px', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1px solid #10b98133', animation: 'pulse-ring 2s ease infinite' }} />
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#10b98122', border: '2px solid #10b98144', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={28} color="#10b981" />
            </div>
          </div>
          <h2 className="section-title" style={{ marginBottom: 18 }}>Ready to automate your<br />LinkedIn outreach?</h2>
          <p style={{ fontSize: isMobile ? 14 : 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 32, padding: '0 8px' }}>
            Join sales professionals using StealthLead to fill their pipeline — safely and automatically.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/register')}>Get started for free <ArrowRight size={15} /></button>
            <button className="btn-ghost"   onClick={() => navigate('/login')}>Log in</button>
          </div>
          <div style={{ fontSize: 12, color: '#374151', marginTop: 18 }}>No credit card · No LinkedIn API · Setup in 5 minutes</div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #1e2535', padding: isMobile ? '20px 20px' : '24px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logo} alt="Logo" />
          </div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: '#fff' }}>Stealth<span style={{ color: '#10b981' }}>Lead</span></span>
        </div>
        <div style={{ fontSize: 12, color: '#374151' }}>© 2026 StealthLead. All rights reserved.</div>
      </footer>
    </div>
  )
}