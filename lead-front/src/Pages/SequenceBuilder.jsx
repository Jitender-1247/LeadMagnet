import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  UserPlus, MessageSquare, Mail, Eye, Heart, Star,
  Clock, GitBranch, Plus, X, ArrowLeft,
  Check, Loader2, Info, ZoomIn, ZoomOut, Maximize2,
  ChevronRight, GripVertical, Trash2, Edit2
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import { apiFetch } from '../utils/api'

// ── Node type registry ────────────────────────────────────────────────────────
const NODE_TYPES = {
  connect:      { label: 'Send Connection', icon: UserPlus,      color: '#6366f1', desc: 'Send a connection request' },
  message:      { label: 'Send Message',    icon: MessageSquare, color: '#10b981', desc: 'Send a direct message' },
  inmail:       { label: 'Send InMail',     icon: Mail,          color: '#f59e0b', desc: 'Send an InMail' },
  view_profile: { label: 'View Profile',    icon: Eye,           color: '#8b5cf6', desc: 'Visit their profile' },
  follow:       { label: 'Follow',          icon: Heart,         color: '#ec4899', desc: 'Follow their profile' },
  endorse:      { label: 'Endorse Skills',  icon: Star,          color: '#f97316', desc: 'Endorse up to 3 skills' },
  wait:         { label: 'Wait / Delay',    icon: Clock,         color: '#64748b', desc: 'Pause before next action' },
  condition:    { label: 'Condition',       icon: GitBranch,     color: '#06b6d4', desc: 'Branch on lead status' },
}

const VARIABLES = ['{name}', '{firstName}', '{company}', '{headline}', '{location}']
const genId     = () => `n${Date.now()}${Math.random().toString(36).substr(2,4)}`

// ── Layout constants (desktop SVG) ────────────────────────────────────────────
const CX       = 400
const NODE_W   = 256
const NODE_H   = 70
const WAIT_W   = 160
const WAIT_H   = 40
const COND_R   = 36
const V_GAP    = 56
const NO_X_OFF = 260

function useIsMobile() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w < 768
}

function getNodeDims(type) {
  if (type === 'condition') return { w: COND_R * 2, h: COND_R * 2 }
  if (type === 'wait')      return { w: WAIT_W, h: WAIT_H }
  return { w: NODE_W, h: NODE_H }
}

function layoutFlow(steps, startX, startY, seqCounter = { n: 0 }) {
  const nodes = []
  const edges = []
  let   y     = startY

  steps.forEach((step, i) => {
    const { w, h } = getNodeDims(step.type)
    const x        = startX - w / 2
    const cx       = startX
    const cy       = y + h / 2
    seqCounter.n  += 1

    const node = { id: step.id, step, x, y, w, h, cx, cy, seqNum: seqCounter.n }
    nodes.push(node)

    if (i > 0) {
      const prev  = nodes[nodes.length - 2]
      const fromY = prev.y + prev.h
      edges.push({
        id: `e-main-${i}`, x1: cx, y1: fromY, x2: cx, y2: y,
        color: '#2a3245',
        plusCtx: { parentId: null, branch: 'main', afterIndex: i - 1 },
      })
    }

    let nextY = y + h + V_GAP

    if (step.type === 'condition') {
      const noX      = startX + NO_X_OFF
      const yesSteps = step.yesSteps || []
      const noSteps  = step.noSteps  || []

      const yesResult = layoutFlow(yesSteps, startX, nextY, seqCounter)
      nodes.push(...yesResult.nodes)
      edges.push(...yesResult.edges)
      edges.push({ id:`e-yes-start-${step.id}`, x1:cx, y1:y+COND_R*2, x2:cx, y2:nextY, color:'#10b981', label:'YES', plusCtx:{parentId:step.id,branch:'yes',afterIndex:-1} })
      edges.push({ id:`e-yes-add-${step.id}`, x1:cx, y1:yesResult.bottomY-V_GAP, x2:cx, y2:yesResult.bottomY, color:'#10b981', dashed:true, plusCtx:{parentId:step.id,branch:'yes',afterIndex:yesSteps.length-1}, isAddLine:true })

      const noResult = layoutFlow(noSteps, noX, nextY, seqCounter)
      nodes.push(...noResult.nodes)
      edges.push(...noResult.edges)
      edges.push({ id:`e-no-start-${step.id}`, x1:cx+COND_R, y1:cy, x2:noX, y2:cy, x3:noX, y3:nextY, color:'#ef4444', label:'NO', isElbow:true, plusCtx:{parentId:step.id,branch:'no',afterIndex:-1} })
      edges.push({ id:`e-no-add-${step.id}`, x1:noX, y1:noResult.bottomY-V_GAP, x2:noX, y2:noResult.bottomY, color:'#ef4444', dashed:true, plusCtx:{parentId:step.id,branch:'no',afterIndex:noSteps.length-1}, isAddLine:true })

      nextY = Math.max(yesResult.bottomY, noResult.bottomY) + V_GAP
    }
    y = nextY
  })
  return { nodes, edges, bottomY: y }
}

// ── SVG Edge ──────────────────────────────────────────────────────────────────
function Edge({ edge, onAddClick }) {
  const midX = (edge.x1 + edge.x2) / 2
  const midY = (edge.y1 + edge.y2) / 2

  if (edge.isElbow) {
    const d = `M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y1} L ${edge.x3} ${edge.y3}`
    return (
      <g>
        <path d={d} fill="none" stroke={edge.color} strokeWidth={1.5} strokeDasharray="5,3" />
        <polygon points={`${edge.x3},${edge.y3} ${edge.x3-4},${edge.y3-8} ${edge.x3+4},${edge.y3-8}`} fill={edge.color} />
        <rect x={edge.x1+12} y={edge.y1-9} width={26} height={17} rx={4} fill={edge.color+'22'} />
        <text x={edge.x1+25} y={edge.y1+3} textAnchor="middle" fill={edge.color} fontSize={9} fontWeight={700}>NO</text>
        <g style={{cursor:'pointer'}} onClick={()=>onAddClick(edge.plusCtx)}>
          <circle cx={edge.x2} cy={(edge.y1+edge.y3)/2} r={10} fill="#0d1117" stroke={edge.color} strokeWidth={1.5}/>
          <text x={edge.x2} y={(edge.y1+edge.y3)/2+4} textAnchor="middle" fill={edge.color} fontSize={16} fontWeight={300}>+</text>
        </g>
      </g>
    )
  }
  if (edge.isAddLine) {
    return (
      <g>
        <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke={edge.color} strokeWidth={1.5} strokeDasharray="4,3"/>
        <g style={{cursor:'pointer'}} onClick={()=>onAddClick(edge.plusCtx)}>
          <circle cx={edge.x2} cy={edge.y2} r={10} fill="#0d1117" stroke={edge.color} strokeWidth={1.5}/>
          <text x={edge.x2} y={edge.y2+4} textAnchor="middle" fill={edge.color} fontSize={16} fontWeight={300}>+</text>
        </g>
      </g>
    )
  }
  return (
    <g>
      <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke={edge.color} strokeWidth={1.5} strokeDasharray={edge.dashed?'4,3':'none'}/>
      <polygon points={`${edge.x2},${edge.y2} ${edge.x2-4},${edge.y2-8} ${edge.x2+4},${edge.y2-8}`} fill={edge.color}/>
      {edge.label==='YES' && (
        <>
          <rect x={edge.x1+6} y={edge.y1+4} width={30} height={17} rx={4} fill={edge.color+'22'}/>
          <text x={edge.x1+21} y={edge.y1+16} textAnchor="middle" fill={edge.color} fontSize={9} fontWeight={700}>YES</text>
        </>
      )}
      {!edge.label && !edge.dashed && (
        <g style={{cursor:'pointer'}} onClick={()=>onAddClick(edge.plusCtx)}>
          <circle cx={midX} cy={midY} r={10} fill="#0d1117" stroke={edge.color} strokeWidth={1.5}/>
          <text x={midX} y={midY+4} textAnchor="middle" fill={edge.color} fontSize={16} fontWeight={300}>+</text>
        </g>
      )}
    </g>
  )
}

// ── SVG FlowNode ──────────────────────────────────────────────────────────────
function FlowNode({ node, isSelected, onSelect, onDelete }) {
  const { step, x, y, w, h, cx, cy, seqNum } = node
  const def  = NODE_TYPES[step.type]
  const Icon = def?.icon

  if (step.type === 'condition') {
    const pts = `${cx},${y} ${cx+COND_R},${cy} ${cx},${y+COND_R*2} ${cx-COND_R},${cy}`
    return (
      <g onClick={()=>onSelect(step.id)} style={{cursor:'pointer'}}>
        <polygon points={pts} fill={isSelected?def.color+'35':def.color+'18'} stroke={isSelected?def.color:def.color+'66'} strokeWidth={isSelected?2:1.5} filter={isSelected?`drop-shadow(0 0 10px ${def.color}55)`:'none'}/>
        <foreignObject x={cx-10} y={cy-10} width={20} height={20}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%'}}><Icon size={13} color={def.color}/></div>
        </foreignObject>
        <text x={cx} y={y+COND_R*2+14} textAnchor="middle" fill={def.color} fontSize={10} fontWeight={700}>{def.label}</text>
        {step.condition && <text x={cx} y={y+COND_R*2+26} textAnchor="middle" fill="#4b5563" fontSize={9}>{step.condition.replace(/_/g,' ')}{step.timeoutDays?` · ${step.timeoutDays}d`:''}</text>}
        <circle cx={cx+COND_R-4} cy={y+4} r={9} fill={def.color+'33'}/>
        <text x={cx+COND_R-4} y={y+8} textAnchor="middle" fill={def.color} fontSize={8} fontWeight={700}>{seqNum}</text>
        {isSelected && <g onClick={e=>{e.stopPropagation();onDelete(step.id)}} style={{cursor:'pointer'}}><circle cx={cx-COND_R+4} cy={y+4} r={9} fill="#ef444420" stroke="#ef444440"/><text x={cx-COND_R+4} y={y+8} textAnchor="middle" fill="#ef4444" fontSize={13}>×</text></g>}
      </g>
    )
  }
  const isWait = step.type==='wait'
  return (
    <g onClick={()=>onSelect(step.id)} style={{cursor:'pointer'}}>
      <rect x={x} y={y} width={w} height={h} rx={isWait?h/2:12} fill={isSelected?def?.color+'28':def?.color+'12'} stroke={isSelected?def?.color:def?.color+'55'} strokeWidth={isSelected?2:1.5} filter={isSelected?`drop-shadow(0 0 10px ${def?.color}44)`:'none'}/>
      <circle cx={x+(isWait?20:26)} cy={cy} r={isWait?11:15} fill={def?.color+'22'}/>
      <foreignObject x={x+(isWait?12:17)} y={cy-(isWait?9:11)} width={isWait?16:22} height={isWait?18:22}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%'}}><Icon size={isWait?12:13} color={def?.color}/></div>
      </foreignObject>
      {isWait ? (
        <text x={x+42} y={cy+4} fill="#9ca3af" fontSize={12} fontWeight={500}>{'Wait '}<tspan fill={def?.color} fontWeight={700}>{step.days?`${step.days}d `:''}{step.hours?`${step.hours}h`:''}{!step.days&&!step.hours?'...':''}</tspan></text>
      ) : (
        <>
          <text x={x+50} y={cy-7} fill="#ffffff" fontSize={12} fontWeight={700}>{def?.label}</text>
          <text x={x+50} y={cy+9} fill="#4b5563" fontSize={10}>{(step.message||step.note||def?.desc||'').slice(0,26)}{(step.message||step.note||'').length>26?'…':''}</text>
        </>
      )}
      <circle cx={x+w-14} cy={cy} r={10} fill={def?.color+'2a'}/>
      <text x={x+w-14} y={cy+4} textAnchor="middle" fill={def?.color} fontSize={9} fontWeight={700}>{seqNum}</text>
      {isSelected && <g onClick={e=>{e.stopPropagation();onDelete(step.id)}} style={{cursor:'pointer'}}><circle cx={x+w-10} cy={y+10} r={9} fill="#ef444420" stroke="#ef444440"/><text x={x+w-10} y={y+14} textAnchor="middle" fill="#ef4444" fontSize={13}>×</text></g>}
    </g>
  )
}

// ── Mobile Step Card ──────────────────────────────────────────────────────────
function MobileStepCard({ step, index, total, onEdit, onDelete, onMoveUp, onMoveDown }) {
  const def  = NODE_TYPES[step.type]
  const Icon = def?.icon
  const isWait = step.type === 'wait'
  const isCond = step.type === 'condition'

  const label = isWait
    ? `Wait ${step.days ? step.days + 'd ' : ''}${step.hours ? step.hours + 'h' : ''}`.trim() || 'Wait...'
    : def?.label

  const sub = isCond
    ? `If ${(step.condition||'').replace(/_/g,' ')} after ${step.timeoutDays||'?'}d`
    : (step.message || step.note || step.subject || def?.desc || '')

  return (
    <div style={{ background:'#111827', border:`1px solid ${def?.color}33`, borderLeft:`3px solid ${def?.color}`, borderRadius:12, padding:'12px 14px', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {/* Seq badge */}
        <div style={{ width:28, height:28, borderRadius:'50%', background:def?.color+'22', border:`1px solid ${def?.color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:def?.color }}>{index+1}</div>

        {/* Icon + text */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:def?.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {Icon && <Icon size={14} color={def?.color}/>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{label}</div>
            {sub && <div style={{ fontSize:11, color:'#6b7280', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub.slice(0,48)}{sub.length>48?'…':''}</div>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:5, flexShrink:0 }}>
          <button onClick={()=>onMoveUp(index)} disabled={index===0}
            style={{ background:'none', border:'none', color: index===0?'#2a3245':'#6b7280', cursor: index===0?'default':'pointer', padding:'4px', fontSize:16, lineHeight:1 }}>↑</button>
          <button onClick={()=>onMoveDown(index)} disabled={index===total-1}
            style={{ background:'none', border:'none', color: index===total-1?'#2a3245':'#6b7280', cursor: index===total-1?'default':'pointer', padding:'4px', fontSize:16, lineHeight:1 }}>↓</button>
          <button onClick={()=>onEdit(step)}
            style={{ background:def?.color+'18', border:`1px solid ${def?.color}33`, color:def?.color, borderRadius:7, padding:'5px 8px', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <Edit2 size={11}/>
          </button>
          <button onClick={()=>onDelete(step.id)}
            style={{ background:'#ef444415', border:'1px solid #ef444430', color:'#ef4444', borderRadius:7, padding:'5px 8px', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <Trash2 size={11}/>
          </button>
        </div>
      </div>

      {/* Condition branches preview */}
      {isCond && (
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          <div style={{ flex:1, background:'#10b98110', border:'1px solid #10b98130', borderRadius:8, padding:'7px 10px' }}>
            <div style={{ fontSize:10, color:'#10b981', fontWeight:700 }}>✅ YES ({(step.yesSteps||[]).length} steps)</div>
          </div>
          <div style={{ flex:1, background:'#ef444410', border:'1px solid #ef444430', borderRadius:8, padding:'7px 10px' }}>
            <div style={{ fontSize:10, color:'#ef4444', fontWeight:700 }}>❌ NO ({(step.noSteps||[]).length} steps)</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Field configs ─────────────────────────────────────────────────────────────
function getFields(type) {
  const m = {
    connect:      [{key:'note',    label:'Connection Note (optional)', type:'textarea', placeholder:"Hi {name}, I noticed you're the {headline} at {company}..."}],
    message:      [{key:'message', label:'Message', type:'textarea', placeholder:'Hey {name}...', required:true}],
    inmail:       [{key:'subject', label:'Subject', type:'input',    placeholder:'Re: {company}', required:true},
                   {key:'message', label:'Body',    type:'textarea', placeholder:'Hi {name}...', required:true}],
    view_profile: [], follow: [], endorse: [],
    wait:         [{key:'days',  label:'Days',  type:'number', min:0},
                   {key:'hours', label:'Hours', type:'number', min:0, max:23}],
    condition:    [
      {key:'condition', label:'If lead is...', type:'select', options:[
        {value:'accepted',     label:'Connection Accepted'},
        {value:'not_accepted', label:'Connection NOT Accepted'},
        {value:'replied',      label:'Has Replied'},
        {value:'not_replied',  label:'Has NOT Replied'},
        {value:'no_response',  label:'No Response at All'},
      ]},
      {key:'timeoutDays', label:'After how many days?', type:'number', min:1, placeholder:'3'},
    ],
  }
  return m[type] || []
}

// ── Right/Bottom Panel ────────────────────────────────────────────────────────
function Panel({ mode, selectedStep, insertCtx, onPickType, onUpdateStep, onClose, isMobile }) {
  const panelStyle = isMobile ? {
    // Mobile: bottom sheet
    position:'fixed', bottom:0, left:0, right:0, zIndex:500,
    background:'#111827', borderTop:'1px solid #1e2535',
    borderRadius:'20px 20px 0 0',
    maxHeight:'80vh', display:'flex', flexDirection:'column',
    boxShadow:'0 -8px 32px rgba(0,0,0,0.5)',
    animation:'slideUp 0.22s ease',
  } : {
    // Desktop: side panel
    width:288, background:'#111827', borderLeft:'1px solid #1e2535',
    display:'flex', flexDirection:'column', height:'100%', flexShrink:0,
    animation:'slideIn 0.18s ease',
  }

  const headerContent = (title, sub) => (
    <div style={{ padding: isMobile ? '8px 18px 14px' : '16px 18px', borderBottom:'1px solid #1e2535', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
      {isMobile && <div style={{ width:40, height:4, background:'#2a3245', borderRadius:2, position:'absolute', top:10, left:'50%', transform:'translateX(-50%)' }}/>}
      <div style={{ marginTop: isMobile ? 8 : 0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{title}</div>
        {sub && <div style={{ fontSize:10, color:'#4b5563', marginTop:2 }}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer' }}><X size={15}/></button>
    </div>
  )

  if (mode === 'picker') return (
    <div style={panelStyle}>
      {headerContent('Add Step', insertCtx?.branch==='no'?'🔴 NO branch':insertCtx?.branch==='yes'?'🟢 YES branch':'Main flow')}
      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection: isMobile ? 'row' : 'column', flexWrap: isMobile ? 'wrap' : 'nowrap', gap:6 }}>
        {Object.entries(NODE_TYPES).map(([type, def]) => {
          const Icon = def.icon
          return (
            <button key={type} onClick={()=>onPickType(type)} style={{
              display:'flex', alignItems:'center', gap:10,
              padding: isMobile ? '10px 12px' : '11px 12px',
              borderRadius:11, background:def.color+'10', border:`1px solid ${def.color}33`,
              cursor:'pointer', textAlign:'left',
              width: isMobile ? 'calc(50% - 3px)' : '100%',
              transition:'all 0.12s', flexShrink:0
            }}
              onMouseEnter={e=>e.currentTarget.style.background=def.color+'1e'}
              onMouseLeave={e=>e.currentTarget.style.background=def.color+'10'}
            >
              <div style={{ width:30, height:30, borderRadius:8, background:def.color+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={14} color={def.color}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>{def.label}</div>
                {!isMobile && <div style={{ fontSize:10, color:'#4b5563', marginTop:1 }}>{def.desc}</div>}
              </div>
              {!isMobile && <ChevronRight size={13} color="#2a3245"/>}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (mode === 'editor' && selectedStep) {
    const def    = NODE_TYPES[selectedStep.type]
    const Icon   = def?.icon
    const fields = getFields(selectedStep.type)

    return (
      <div style={panelStyle}>
        {isMobile && <div style={{ width:40, height:4, background:'#2a3245', borderRadius:2, margin:'10px auto 0' }}/>}
        <div style={{ padding: isMobile ? '12px 18px 14px' : '16px 18px', borderBottom:'1px solid #1e2535', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:def?.color+'22', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {Icon && <Icon size={15} color={def?.color}/>}
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{def?.label}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer' }}><X size={15}/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'18px', display:'flex', flexDirection:'column', gap:16 }}>
          {fields.length===0 ? (
            <div style={{ background:'#0d1117', borderRadius:10, padding:14, display:'flex', gap:10 }}>
              <Info size={13} color={def?.color} style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12, color:'#6b7280', lineHeight:1.6 }}>Runs automatically — no config needed.</span>
            </div>
          ) : fields.map(field => (
            <div key={field.key}>
              <label style={{ fontSize:11, color:'#9ca3af', fontWeight:600, display:'block', marginBottom:6 }}>
                {field.label}{field.required && <span style={{color:'#ef4444'}}> *</span>}
              </label>

              {field.type==='textarea' && (
                <>
                  {(field.key==='message'||field.key==='note') && (
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:7 }}>
                      {VARIABLES.map(v=>(
                        <button key={v} onClick={()=>onUpdateStep({...selectedStep,[field.key]:(selectedStep[field.key]||'')+v})}
                          style={{ padding:'2px 6px', borderRadius:5, fontSize:10, background:'#10b98114', color:'#10b981', border:'1px solid #10b98130', cursor:'pointer' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea value={selectedStep[field.key]||''} onChange={e=>onUpdateStep({...selectedStep,[field.key]:e.target.value})}
                    placeholder={field.placeholder} rows={isMobile ? 3 : 4}
                    style={{ width:'100%', padding:'9px 11px', background:'#0d1117', border:'1px solid #1e2535', borderRadius:9, color:'#e2e8f0', fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor=def?.color}
                    onBlur={e=>e.target.style.borderColor='#1e2535'}
                  />
                  <div style={{ fontSize:10, color:'#4b5563', marginTop:3 }}>{(selectedStep[field.key]||'').length} chars</div>
                </>
              )}
              {field.type==='input' && (
                <input value={selectedStep[field.key]||''} onChange={e=>onUpdateStep({...selectedStep,[field.key]:e.target.value})}
                  placeholder={field.placeholder}
                  style={{ width:'100%', padding:'10px 11px', background:'#0d1117', border:'1px solid #1e2535', borderRadius:9, color:'#e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor=def?.color}
                  onBlur={e=>e.target.style.borderColor='#1e2535'}
                />
              )}
              {field.type==='number' && (
                <input type="number" min={field.min??0} max={field.max}
                  value={selectedStep[field.key]??''} placeholder={field.placeholder||'0'}
                  onChange={e=>onUpdateStep({...selectedStep,[field.key]:parseInt(e.target.value)||0})}
                  style={{ width:'100%', padding:'10px 11px', background:'#0d1117', border:'1px solid #1e2535', borderRadius:9, color:'#e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }}
                />
              )}
              {field.type==='select' && (
                <select value={selectedStep[field.key]||''} onChange={e=>onUpdateStep({...selectedStep,[field.key]:e.target.value})}
                  style={{ width:'100%', padding:'10px 11px', background:'#0d1117', border:'1px solid #1e2535', borderRadius:9, color:'#e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }}>
                  {field.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
            </div>
          ))}

          {selectedStep.type==='condition' && selectedStep.condition && (
            <div style={{ background:'#0d1117', borderRadius:10, padding:12, border:'1px solid #1e2535' }}>
              <div style={{ fontSize:10, color:'#4b5563', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Branch Preview</div>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ flex:1, background:'#10b98110', border:'1px solid #10b98130', borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color:'#10b981', fontWeight:700, marginBottom:2 }}>✅ YES</div>
                  <div style={{ fontSize:10, color:'#4b5563' }}>Continue if met</div>
                </div>
                <div style={{ flex:1, background:'#ef444410', border:'1px solid #ef444430', borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color:'#ef4444', fontWeight:700, marginBottom:2 }}>❌ NO</div>
                  <div style={{ fontSize:10, color:'#4b5563' }}>Alternative path</div>
                </div>
              </div>
            </div>
          )}

          {isMobile && (
            <button onClick={onClose} style={{ width:'100%', padding:'12px', background:'#10b981', border:'none', borderRadius:11, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:4 }}>
              Done
            </button>
          )}
        </div>
      </div>
    )
  }

  // Guide — only shown on desktop
  if (isMobile) return null

  return (
    <div style={{ width:260, background:'#111827', borderLeft:'1px solid #1e2535', padding:18, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Sequence Guide</div>
      {[
        {e:'👁', t:'Start with View Profile to warm up before connecting'},
        {e:'🤝', t:'Add a Wait before Connect to look natural'},
        {e:'🔀', t:'Use Condition to branch on acceptance or reply'},
        {e:'✅', t:'YES path: they accepted → send your pitch'},
        {e:'❌', t:'NO path: not accepted → try InMail instead'},
        {e:'⏰', t:'Wait 2–4 days between messages'},
      ].map((tip,i)=>(
        <div key={i} style={{ background:'#0d1117', borderRadius:9, padding:'9px 11px', display:'flex', gap:8, alignItems:'flex-start' }}>
          <span style={{ fontSize:13, flexShrink:0 }}>{tip.e}</span>
          <span style={{ fontSize:11, color:'#6b7280', lineHeight:1.55 }}>{tip.t}</span>
        </div>
      ))}
      <div style={{ padding:11, background:'#10b98110', border:'1px solid #10b98122', borderRadius:9, fontSize:11, color:'#10b981', lineHeight:1.6, marginTop:4 }}>
        Click <strong>+</strong> on any connector to add a step. Click a node to edit it.
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SequenceBuilder() {
  const navigate       = useNavigate()
  const { campaignId } = useParams()
  const isEditing      = !!campaignId
  const isMobile       = useIsMobile()

  const [campaignName, setCampaignName] = useState('')
  const [steps,        setSteps]        = useState([])
  const [selectedId,   setSelectedId]   = useState(null)
  const [panelMode,    setPanelMode]    = useState('guide')
  const [insertCtx,    setInsertCtx]    = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [loading,      setLoading]      = useState(isEditing)
  const [showPanel,    setShowPanel]    = useState(false)  // mobile panel visibility

  const [scale,  setScale] = useState(0.9)
  const [pan,    setPan]   = useState({ x: 60, y: 20 })
  const isPanning          = useRef(false)
  const panStart           = useRef({ x:0, y:0 })
  const lastTouch          = useRef(null)
  const lastPinchDist      = useRef(null)
  const canvasRef          = useRef()

  useEffect(() => {
    if (isEditing) loadCampaign()
    else           setDefaultSteps()
  }, [campaignId])

  // On mobile, reset scale/pan to show canvas from top center
  useEffect(() => {
    if (isMobile) { setScale(0.6); setPan({ x: 10, y: 10 }) }
    else          { setScale(0.9); setPan({ x: 60, y: 20 }) }
  }, [isMobile])

  const setDefaultSteps = () => {
    setSteps([
      { id:genId(), type:'view_profile' },
      { id:genId(), type:'wait', hours:2 },
      { id:genId(), type:'connect', note:"Hi {name}, I came across your profile and would love to connect!" },
      { id:genId(), type:'wait', days:2 },
      {
        id:genId(), type:'condition', condition:'accepted', timeoutDays:3,
        yesSteps:[
          { id:genId(), type:'message', message:"Hey {name}, thanks for connecting! I'd love to share how we help companies like {company}. Up for a quick chat?" },
          { id:genId(), type:'wait', days:4 },
          { id:genId(), type:'message', message:"Hi {name}, just following up — happy to chat whenever works for you!" },
        ],
        noSteps:[
          { id:genId(), type:'inmail', subject:"Reaching out about {company}", message:"Hi {name}, I tried connecting but wanted to reach out directly. Would love to connect!" },
        ]
      },
    ])
  }

  const loadCampaign = async () => {
    try {
      const res  = await apiFetch(`/campaigns/${campaignId}`)
      const data = await res.json()
      setCampaignName(data.name || '')
      setSteps((data.sequence || []).map(s => ({ ...s, id: s.id || genId() })))
    } catch { toast.error('Failed to load campaign') }
    finally   { setLoading(false) }
  }

  const seqCounter = useRef({ n:0 })
  const layout = useMemo(() => {
    seqCounter.current = { n:0 }
    return layoutFlow(steps, CX, 80, seqCounter.current)
  }, [steps])

  // ── Desktop mouse pan ─────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (['circle','text','polygon','rect'].includes(e.target.tagName)) return
    isPanning.current = true
    panStart.current  = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  const onMouseMove = (e) => {
    if (!isPanning.current) return
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
  }
  const onMouseUp = () => { isPanning.current = false }

  // ── Mobile touch pan + pinch zoom ─────────────────────────────────────────
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y }
      lastPinchDist.current = null
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx*dx + dy*dy)
    }
  }
  const onTouchMove = (e) => {
    e.preventDefault()
    if (e.touches.length === 1 && lastTouch.current) {
      setPan({ x: e.touches[0].clientX - lastTouch.current.x, y: e.touches[0].clientY - lastTouch.current.y })
    } else if (e.touches.length === 2 && lastPinchDist.current) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX
      const dy   = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx*dx + dy*dy)
      const ratio = dist / lastPinchDist.current
      setScale(s => Math.max(0.3, Math.min(2, s * ratio)))
      lastPinchDist.current = dist
    }
  }
  const onTouchEnd = () => { lastTouch.current = null; lastPinchDist.current = null }

  useEffect(() => {
    const el      = canvasRef.current
    const handler = (e) => { e.preventDefault(); setScale(s => Math.max(0.3, Math.min(2, s * (e.deltaY>0?0.92:1.08)))) }
    if (el) el.addEventListener('wheel', handler, { passive:false })
    return () => { if (el) el.removeEventListener('wheel', handler) }
  }, [])

  const handleAddClick = (ctx) => {
    setInsertCtx(ctx)
    setPanelMode('picker')
    setSelectedId(null)
    if (isMobile) setShowPanel(true)
  }

  const handlePickType = (type) => {
    const newStep = {
      id:genId(), type,
      ...(type==='wait'      ? {days:1,hours:0}                                            : {}),
      ...(type==='condition' ? {condition:'accepted',timeoutDays:3,yesSteps:[],noSteps:[]} : {}),
    }
    setSteps(prev => {
      const ctx = insertCtx
      if (!ctx) return [...prev, newStep]
      if (ctx.parentId) {
        const insertInto = (arr) => arr.map(s => {
          if (s.id !== ctx.parentId) return { ...s, yesSteps: s.yesSteps?insertInto(s.yesSteps):undefined, noSteps: s.noSteps?insertInto(s.noSteps):undefined }
          const key = ctx.branch==='yes' ? 'yesSteps' : 'noSteps'
          const arr2 = [...(s[key]||[])]
          arr2.splice(ctx.afterIndex+1, 0, newStep)
          return { ...s, [key]: arr2 }
        })
        return insertInto(prev)
      }
      const arr = [...prev]
      arr.splice(ctx.afterIndex+1, 0, newStep)
      return arr
    })
    setSelectedId(newStep.id)
    setPanelMode('editor')
    if (isMobile) setShowPanel(true)
  }

  const handleNodeSelect = (id) => {
    setSelectedId(id)
    setPanelMode('editor')
    setInsertCtx(null)
    if (isMobile) setShowPanel(true)
  }

  const handleUpdateStep = (updated) => {
    const update = (arr) => arr.map(s => {
      if (s.id===updated.id) return updated
      return { ...s, yesSteps: s.yesSteps?update(s.yesSteps):undefined, noSteps: s.noSteps?update(s.noSteps):undefined }
    })
    setSteps(prev => update(prev))
  }

  const handleDeleteStep = (id) => {
    const del = (arr) => arr.filter(s=>s.id!==id).map(s=>({...s, yesSteps:s.yesSteps?del(s.yesSteps):undefined, noSteps:s.noSteps?del(s.noSteps):undefined}))
    setSteps(prev => del(prev))
    setSelectedId(null)
    setPanelMode('guide')
    setShowPanel(false)
  }

  // Mobile-only: move step up/down in flat list
  const handleMoveUp = (index) => {
    if (index === 0) return
    setSteps(prev => { const a=[...prev]; [a[index-1],a[index]]=[a[index],a[index-1]]; return a })
  }
  const handleMoveDown = (index) => {
    setSteps(prev => { if (index>=prev.length-1) return prev; const a=[...prev]; [a[index],a[index+1]]=[a[index+1],a[index]]; return a })
  }

  const selectedStep = useMemo(() => {
    const find = (arr) => {
      for (const s of arr) {
        if (s.id===selectedId) return s
        if (s.yesSteps) { const f=find(s.yesSteps); if(f) return f }
        if (s.noSteps)  { const f=find(s.noSteps);  if(f) return f }
      }
      return null
    }
    return find(steps)
  }, [steps, selectedId])

  const handleSave = async () => {
    if (!campaignName.trim()) { toast.error('Campaign name is required'); return }
    if (!steps.length)        { toast.error('Add at least one step');     return }
    setSaving(true)
    try {
      const endpoint = isEditing ? `/campaigns/${campaignId}/sequence` : `/campaigns/create`
      const method   = isEditing ? 'PUT' : 'POST'
      const body     = isEditing ? { sequence:steps } : { name:campaignName, sequence:steps }
      const res      = await apiFetch(endpoint, { method, body: JSON.stringify(body) })
      const data     = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(isEditing ? 'Sequence updated!' : 'Campaign created!')
      setTimeout(() => navigate(`/campaigns/${isEditing?campaignId:data.campaignId}/leads`), 1000)
    } catch (err) { toast.error(err.message) }
    finally       { setSaving(false) }
  }

  const countActions = (arr) => arr.reduce((a,s)=>a+(s.type!=='wait'&&s.type!=='condition'?1:0)+countActions(s.yesSteps||[])+countActions(s.noSteps||[]),0)
  const countDays    = (arr) => arr.reduce((a,s)=>a+(s.days||0)+countDays(s.yesSteps||[])+countDays(s.noSteps||[]),0)

  if (loading) return (
    <div style={{ height:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Loader2 size={28} color="#10b981" style={{ animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const svgW = 800
  const svgH = layout.bottomY + 120

  const closePanel = () => { setPanelMode('guide'); setSelectedId(null); setShowPanel(false) }

  return (
    <div style={{ height:'100vh', background:'#0d1117', color:'#e2e8f0', fontFamily:'system-ui,sans-serif', display:'flex', flexDirection:'column' }}>
      <ToastContainer theme="dark"/>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div style={{ height: isMobile ? 52 : 58, background:'#111827', borderBottom:'1px solid #1e2535', display:'flex', alignItems:'center', justifyContent:'space-between', padding: isMobile ? '0 12px' : '0 18px', flexShrink:0, gap: isMobile ? 8 : 12 }}>

        {/* Left: back + name */}
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 14, flex:1, minWidth:0 }}>
          <button onClick={()=>navigate('/campaigns')} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12, flexShrink:0 }}>
            <ArrowLeft size={14}/> {!isMobile && 'Back'}
          </button>
          <div style={{ width:1, height:16, background:'#1e2535', flexShrink:0 }}/>
          <input value={campaignName} onChange={e=>setCampaignName(e.target.value)}
            placeholder="Campaign name..."
            style={{ background:'none', border:'none', color:'#fff', fontSize: isMobile ? 14 : 15, fontWeight:700, outline:'none', width: isMobile ? '100%' : 220, minWidth:0 }}
          />
        </div>

        {/* Right: stats (desktop only) + zoom (desktop only) + save */}
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 18, flexShrink:0 }}>
          {!isMobile && [
            {label:'Steps',   value:steps.length,          color:'#6366f1'},
            {label:'Actions', value:countActions(steps),   color:'#10b981'},
            {label:'~Days',   value:countDays(steps)||'<1',color:'#f59e0b'},
          ].map(({label,value,color})=>(
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:700, color, fontFamily:'monospace' }}>{value}</div>
              <div style={{ fontSize:9, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
            </div>
          ))}

          {!isMobile && (
            <div style={{ display:'flex', gap:2, background:'#0d1117', borderRadius:7, padding:2 }}>
              <button onClick={()=>setScale(s=>Math.max(0.3,s-0.1))} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:'4px 7px', borderRadius:5 }}><ZoomOut size={13}/></button>
              <span style={{ fontSize:11, color:'#6b7280', padding:'4px 2px', minWidth:34, textAlign:'center' }}>{Math.round(scale*100)}%</span>
              <button onClick={()=>setScale(s=>Math.min(2,s+0.1))} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:'4px 7px', borderRadius:5 }}><ZoomIn size={13}/></button>
              <button onClick={()=>{setScale(0.9);setPan({x:60,y:20})}} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:'4px 7px', borderRadius:5 }}><Maximize2 size={12}/></button>
            </div>
          )}

          {/* Mobile: step count badge */}
          {isMobile && (
            <div style={{ background:'#6366f122', border:'1px solid #6366f133', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700, color:'#818cf8' }}>
              {steps.length} steps
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            display:'flex', alignItems:'center', gap: isMobile ? 5 : 7,
            background:saving?'#065f46':'#10b981', color:'#fff', border:'none',
            padding: isMobile ? '8px 14px' : '9px 16px', borderRadius:9,
            fontSize: isMobile ? 13 : 13, fontWeight:600, cursor:saving?'not-allowed':'pointer'
          }}>
            {saving ? <Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> : <Check size={13}/>}
            {saving ? 'Saving...' : isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* ── MOBILE: card list ──────────────────────────────────────────────── */}
        {isMobile ? (
          <div style={{ flex:1, overflowY:'auto', padding:'16px 14px 120px' }}>
            {/* START pill */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
              <div style={{ background:'#10b98118', border:'1px solid #10b98144', borderRadius:20, padding:'4px 20px', fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:1 }}>START</div>
            </div>

            {steps.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'#4b5563' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>+</div>
                <div style={{ fontSize:14, marginBottom:20 }}>No steps yet</div>
                <button onClick={()=>handleAddClick({parentId:null,branch:'main',afterIndex:-1})} style={{ background:'#10b981', color:'#fff', border:'none', padding:'12px 24px', borderRadius:11, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Add first step
                </button>
              </div>
            ) : (
              <>
                {steps.map((step, i) => (
                  <MobileStepCard key={step.id} step={step} index={i} total={steps.length}
                    onEdit={(s) => { setSelectedId(s.id); setPanelMode('editor'); setShowPanel(true) }}
                    onDelete={handleDeleteStep}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
                {/* END pill */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', margin:'4px 0 16px' }}>
                  <div style={{ background:'#ef444418', border:'1px solid #ef444444', borderRadius:20, padding:'4px 20px', fontSize:11, fontWeight:700, color:'#ef4444', letterSpacing:1 }}>END</div>
                </div>
              </>
            )}
          </div>
        ) : (
          // ── DESKTOP: SVG canvas ──────────────────────────────────────────────
          <div ref={canvasRef} style={{
            flex:1, overflow:'hidden', position:'relative',
            cursor: isPanning.current?'grabbing':'grab',
            backgroundImage:'radial-gradient(circle, #1a2035 1px, transparent 1px)',
            backgroundSize:'28px 28px',
          }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onClick={e=>{ if(e.target===canvasRef.current||e.target.tagName==='svg'){ setSelectedId(null); setPanelMode('guide') } }}
          >
            <svg width={svgW} height={svgH} style={{ transform:`translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin:'top left', display:'block', overflow:'visible' }}>
              <rect x={CX-50} y={28} width={100} height={24} rx={12} fill="#10b98118" stroke="#10b98144" strokeWidth={1.5}/>
              <text x={CX} y={44} textAnchor="middle" fill="#10b981" fontSize={10} fontWeight={700} letterSpacing={1}>START</text>
              {steps.length>0 && (
                <g>
                  <line x1={CX} y1={52} x2={CX} y2={layout.nodes[0]?.y||80} stroke="#2a3245" strokeWidth={1.5}/>
                  <g style={{cursor:'pointer'}} onClick={()=>handleAddClick({parentId:null,branch:'main',afterIndex:-1})}>
                    <circle cx={CX} cy={(52+(layout.nodes[0]?.y||80))/2} r={10} fill="#0d1117" stroke="#2a3245" strokeWidth={1.5}/>
                    <text x={CX} y={(52+(layout.nodes[0]?.y||80))/2+4} textAnchor="middle" fill="#4b5563" fontSize={16} fontWeight={300}>+</text>
                  </g>
                </g>
              )}
              {layout.edges.map(edge => <Edge key={edge.id} edge={edge} onAddClick={handleAddClick}/>)}
              {layout.nodes.map(node => <FlowNode key={node.step.id} node={node} isSelected={selectedId===node.step.id} onSelect={handleNodeSelect} onDelete={handleDeleteStep}/>)}
              {steps.length>0 && (
                <g>
                  <line x1={CX} y1={layout.bottomY-V_GAP} x2={CX} y2={layout.bottomY-4} stroke="#2a3245" strokeWidth={1.5}/>
                  <rect x={CX-50} y={layout.bottomY-4} width={100} height={24} rx={12} fill="#ef444418" stroke="#ef444444" strokeWidth={1.5}/>
                  <text x={CX} y={layout.bottomY+12} textAnchor="middle" fill="#ef4444" fontSize={10} fontWeight={700} letterSpacing={1}>END</text>
                </g>
              )}
              {steps.length===0 && (
                <g style={{cursor:'pointer'}} onClick={()=>handleAddClick({parentId:null,branch:'main',afterIndex:-1})}>
                  <circle cx={CX} cy={130} r={22} fill="#10b98114" stroke="#10b98144" strokeWidth={2}/>
                  <text x={CX} y={138} textAnchor="middle" fill="#10b981" fontSize={28} fontWeight={200}>+</text>
                  <text x={CX} y={168} textAnchor="middle" fill="#4b5563" fontSize={12}>Click to add your first step</text>
                </g>
              )}
            </svg>
          </div>
        )}

        {/* ── Desktop: right panel (always visible in guide mode) ────────────── */}
        {!isMobile && (
          <Panel mode={panelMode} selectedStep={selectedStep} insertCtx={insertCtx}
            onPickType={handlePickType} onUpdateStep={handleUpdateStep}
            onClose={closePanel} isMobile={false}
          />
        )}

        {/* ── Mobile: bottom sheet (shown on demand) ────────────────────────── */}
        {isMobile && showPanel && (
          <>
            {/* backdrop */}
            <div onClick={closePanel} style={{ position:'fixed', inset:0, zIndex:490, background:'rgba(0,0,0,0.5)' }}/>
            <Panel mode={panelMode} selectedStep={selectedStep} insertCtx={insertCtx}
              onPickType={handlePickType} onUpdateStep={handleUpdateStep}
              onClose={closePanel} isMobile={true}
            />
          </>
        )}

        {/* ── Mobile: FAB to add step ──────────────────────────────────────── */}
        {isMobile && !showPanel && (
          <button
            onClick={()=>handleAddClick({parentId:null,branch:'main',afterIndex:steps.length-1})}
            style={{
              position:'fixed', bottom:80, right:20, zIndex:400,
              width:52, height:52, borderRadius:'50%',
              background:'#10b981', border:'none', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 20px #10b98166', cursor:'pointer',
              fontSize:28, fontWeight:300, lineHeight:1
            }}
          >
            <Plus size={22}/>
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(16px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#0d1117; }
        ::-webkit-scrollbar-thumb { background:#1e2535; border-radius:3px; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}