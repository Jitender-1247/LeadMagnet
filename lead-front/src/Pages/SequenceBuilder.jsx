import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  UserPlus, MessageSquare, Mail, Eye, Heart, Star,
  Clock, GitBranch, Plus, Trash2, X, ArrowLeft,
  Check, Loader2, Info, ZoomIn, ZoomOut, Maximize2,
  ChevronRight
} from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'

const API = import.meta.env.VITE_API_DB_URL

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

// ── Layout constants ──────────────────────────────────────────────────────────
const CX       = 400   // center X of main flow
const NODE_W   = 256
const NODE_H   = 70
const WAIT_W   = 160
const WAIT_H   = 40
const COND_R   = 36    // half-size of condition diamond
const V_GAP    = 56    // vertical gap between nodes
const NO_X_OFF = 260   // how far right the NO branch sits from CX

// ── getNodeDims ───────────────────────────────────────────────────────────────
function getNodeDims(type) {
  if (type === 'condition') return { w: COND_R * 2, h: COND_R * 2 }
  if (type === 'wait')      return { w: WAIT_W, h: WAIT_H }
  return { w: NODE_W, h: NODE_H }
}

// ── Recursive layout builder ──────────────────────────────────────────────────
// Returns { nodes, edges, bottomY }
// nodes: [{ id, step, x, y, w, h, cx, cy, seqNum }]
// edges: [{ id, x1,y1,x2,y2, label, color, dashed, plusCtx }]
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

    // Edge from previous node
    if (i > 0) {
      const prev = nodes[nodes.length - 2]
      // For condition nodes the edge comes from their bottom
      const fromY = prev.y + prev.h
      const toY   = y
      edges.push({
        id:      `e-main-${i}`,
        x1: cx, y1: fromY,
        x2: cx, y2: toY,
        color:   '#2a3245',
        plusCtx: { parentId: null, branch: 'main', afterIndex: i - 1 },
      })
    }

    let nextY = y + h + V_GAP

    // Condition branches
    if (step.type === 'condition') {
      const noX = startX + NO_X_OFF

      // ── YES branch (straight down) ───────────────────────────────────────
      const yesSteps  = step.yesSteps || []
      const yesResult = layoutFlow(yesSteps, startX, nextY, seqCounter)
      nodes.push(...yesResult.nodes)
      edges.push(...yesResult.edges)

      // YES connector from diamond bottom
      edges.push({
        id:      `e-yes-start-${step.id}`,
        x1: cx, y1: y + COND_R * 2,
        x2: cx, y2: nextY,
        color:   '#10b981',
        label:   'YES',
        plusCtx: { parentId: step.id, branch: 'yes', afterIndex: -1 },
      })

      // Add YES end (+) button
      const yesEndY = yesResult.bottomY
      edges.push({
        id:      `e-yes-add-${step.id}`,
        x1: cx, y1: yesResult.bottomY - V_GAP,
        x2: cx, y2: yesResult.bottomY,
        color:   '#10b981',
        dashed:  true,
        plusCtx: { parentId: step.id, branch: 'yes', afterIndex: yesSteps.length - 1 },
        isAddLine: true,
      })

      // ── NO branch (to the right) ─────────────────────────────────────────
      const noSteps  = step.noSteps || []
      const noResult = layoutFlow(noSteps, noX, nextY, seqCounter)
      nodes.push(...noResult.nodes)
      edges.push(...noResult.edges)

      // NO connector: horizontal from diamond right, then vertical down
      edges.push({
        id:      `e-no-start-${step.id}`,
        x1: cx + COND_R, y1: cy,  // diamond right point
        x2: noX,          y2: cy,  // go right
        x3: noX,          y3: nextY, // then down
        color:   '#ef4444',
        label:   'NO',
        isElbow: true,
        plusCtx: { parentId: step.id, branch: 'no', afterIndex: -1 },
      })

      // NO end (+)
      edges.push({
        id:      `e-no-add-${step.id}`,
        x1: noX, y1: noResult.bottomY - V_GAP,
        x2: noX, y2: noResult.bottomY,
        color:   '#ef4444',
        dashed:  true,
        plusCtx: { parentId: step.id, branch: 'no', afterIndex: noSteps.length - 1 },
        isAddLine: true,
      })

      nextY = Math.max(yesResult.bottomY, noResult.bottomY) + V_GAP
    }

    y = nextY
  })

  return { nodes, edges, bottomY: y }
}

// ── SVG canvas components ─────────────────────────────────────────────────────

function Edge({ edge, onAddClick }) {
  const midX = (edge.x1 + edge.x2) / 2
  const midY = (edge.y1 + edge.y2) / 2

  // Elbow connector (for NO branch)
  if (edge.isElbow) {
    const d = `M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y1} L ${edge.x3} ${edge.y3}`
    const labelX = edge.x1 + 12
    const labelY = edge.y1
    const btnX   = edge.x2
    const btnY   = (edge.y1 + edge.y3) / 2
    return (
      <g>
        <path d={d} fill="none" stroke={edge.color} strokeWidth={1.5} strokeDasharray="5,3" />
        {/* Arrow */}
        <polygon points={`${edge.x3},${edge.y3} ${edge.x3-4},${edge.y3-8} ${edge.x3+4},${edge.y3-8}`} fill={edge.color} />
        {/* NO label */}
        <rect x={labelX} y={labelY - 9} width={26} height={17} rx={4} fill={edge.color + '22'} />
        <text x={labelX + 13} y={labelY + 3} textAnchor="middle" fill={edge.color} fontSize={9} fontWeight={700}>NO</text>
        {/* + button */}
        <g style={{ cursor: 'pointer' }} onClick={() => onAddClick(edge.plusCtx)}>
          <circle cx={btnX} cy={btnY} r={10} fill="#0d1117" stroke={edge.color} strokeWidth={1.5} />
          <text x={btnX} y={btnY + 4} textAnchor="middle" fill={edge.color} fontSize={16} fontWeight={300}>+</text>
        </g>
      </g>
    )
  }

  // Add-line (dashed line to + button at end of branch)
  if (edge.isAddLine) {
    return (
      <g>
        <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
          stroke={edge.color} strokeWidth={1.5} strokeDasharray="4,3" />
        <g style={{ cursor: 'pointer' }} onClick={() => onAddClick(edge.plusCtx)}>
          <circle cx={edge.x2} cy={edge.y2} r={10} fill="#0d1117" stroke={edge.color} strokeWidth={1.5} />
          <text x={edge.x2} y={edge.y2 + 4} textAnchor="middle" fill={edge.color} fontSize={16} fontWeight={300}>+</text>
        </g>
      </g>
    )
  }

  // Standard straight connector
  const d = `M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`
  return (
    <g>
      <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
        stroke={edge.color} strokeWidth={1.5}
        strokeDasharray={edge.dashed ? '4,3' : 'none'} />
      {/* Arrow */}
      <polygon points={`${edge.x2},${edge.y2} ${edge.x2-4},${edge.y2-8} ${edge.x2+4},${edge.y2-8}`}
        fill={edge.color} />
      {/* YES label */}
      {edge.label === 'YES' && (
        <>
          <rect x={edge.x1 + 6} y={edge.y1 + 4} width={30} height={17} rx={4} fill={edge.color + '22'} />
          <text x={edge.x1 + 21} y={edge.y1 + 16} textAnchor="middle" fill={edge.color} fontSize={9} fontWeight={700}>YES</text>
        </>
      )}
      {/* + button (only on non-dashed, non-label lines) */}
      {!edge.label && !edge.dashed && (
        <g style={{ cursor: 'pointer' }} onClick={() => onAddClick(edge.plusCtx)}>
          <circle cx={midX} cy={midY} r={10} fill="#0d1117" stroke={edge.color} strokeWidth={1.5} />
          <text x={midX} y={midY + 4} textAnchor="middle" fill={edge.color} fontSize={16} fontWeight={300}>+</text>
        </g>
      )}
    </g>
  )
}

function FlowNode({ node, isSelected, onSelect, onDelete }) {
  const { step, x, y, w, h, cx, cy, seqNum } = node
  const def  = NODE_TYPES[step.type]
  const Icon = def?.icon

  // Condition diamond
  if (step.type === 'condition') {
    const pts = `${cx},${y} ${cx+COND_R},${cy} ${cx},${y+COND_R*2} ${cx-COND_R},${cy}`
    return (
      <g onClick={() => onSelect(step.id)} style={{ cursor: 'pointer' }}>
        <polygon points={pts}
          fill={isSelected ? def.color + '35' : def.color + '18'}
          stroke={isSelected ? def.color : def.color + '66'}
          strokeWidth={isSelected ? 2 : 1.5}
          filter={isSelected ? `drop-shadow(0 0 10px ${def.color}55)` : 'none'}
        />
        {/* Icon */}
        <foreignObject x={cx-10} y={cy-10} width={20} height={20}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%' }}>
            <Icon size={13} color={def.color} />
          </div>
        </foreignObject>
        {/* Label below */}
        <text x={cx} y={y+COND_R*2+14} textAnchor="middle" fill={def.color} fontSize={10} fontWeight={700}>{def.label}</text>
        {step.condition && (
          <text x={cx} y={y+COND_R*2+26} textAnchor="middle" fill="#4b5563" fontSize={9}>
            {step.condition.replace(/_/g,' ')}{step.timeoutDays ? ` · ${step.timeoutDays}d` : ''}
          </text>
        )}
        {/* Seq num */}
        <circle cx={cx+COND_R-4} cy={y+4} r={9} fill={def.color+'33'} />
        <text x={cx+COND_R-4} y={y+8} textAnchor="middle" fill={def.color} fontSize={8} fontWeight={700}>{seqNum}</text>
        {/* Delete */}
        {isSelected && (
          <g onClick={e=>{e.stopPropagation();onDelete(step.id)}} style={{cursor:'pointer'}}>
            <circle cx={cx-COND_R+4} cy={y+4} r={9} fill="#ef444420" stroke="#ef444440" />
            <text x={cx-COND_R+4} y={y+8} textAnchor="middle" fill="#ef4444" fontSize={13}>×</text>
          </g>
        )}
      </g>
    )
  }

  const isWait = step.type === 'wait'
  const rx     = isWait ? h / 2 : 12

  return (
    <g onClick={() => onSelect(step.id)} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={w} height={h} rx={rx}
        fill={isSelected ? def?.color+'28' : def?.color+'12'}
        stroke={isSelected ? def?.color : def?.color+'55'}
        strokeWidth={isSelected ? 2 : 1.5}
        filter={isSelected ? `drop-shadow(0 0 10px ${def?.color}44)` : 'none'}
      />

      {/* Icon bubble */}
      <circle cx={x + (isWait ? 20 : 26)} cy={cy} r={isWait ? 11 : 15} fill={def?.color+'22'} />
      <foreignObject
        x={x+(isWait?12:17)} y={cy-(isWait?9:11)}
        width={isWait?16:22} height={isWait?18:22}
      >
        <div xmlns="http://www.w3.org/1999/xhtml" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%'}}>
          <Icon size={isWait?12:13} color={def?.color} />
        </div>
      </foreignObject>

      {/* Text */}
      {isWait ? (
        <text x={x+42} y={cy+4} fill="#9ca3af" fontSize={12} fontWeight={500}>
          {'Wait '}
          <tspan fill={def?.color} fontWeight={700}>
            {step.days?`${step.days}d `:''}
            {step.hours?`${step.hours}h`:''}
            {!step.days&&!step.hours?'...':''}
          </tspan>
        </text>
      ) : (
        <>
          <text x={x+50} y={cy-7} fill="#ffffff" fontSize={12} fontWeight={700}>{def?.label}</text>
          <text x={x+50} y={cy+9} fill="#4b5563" fontSize={10}>
            {(step.message||step.note||def?.desc||'').slice(0,26)}
            {(step.message||step.note||'').length>26?'…':''}
          </text>
        </>
      )}

      {/* Seq number badge */}
      <circle cx={x+w-14} cy={cy} r={10} fill={def?.color+'2a'} />
      <text x={x+w-14} y={cy+4} textAnchor="middle" fill={def?.color} fontSize={9} fontWeight={700}>{seqNum}</text>

      {/* Delete on select */}
      {isSelected && (
        <g onClick={e=>{e.stopPropagation();onDelete(step.id)}} style={{cursor:'pointer'}}>
          <circle cx={x+w-10} cy={y+10} r={9} fill="#ef444420" stroke="#ef444440" />
          <text x={x+w-10} y={y+14} textAnchor="middle" fill="#ef4444" fontSize={13}>×</text>
        </g>
      )}
    </g>
  )
}

// ── Field configs ─────────────────────────────────────────────────────────────
function getFields(type) {
  const m = {
    connect:      [{key:'note',      label:'Connection Note (optional)', type:'textarea', placeholder:'Hi {name}, I noticed you\'re the {headline} at {company}...'}],
    message:      [{key:'message',   label:'Message', type:'textarea', placeholder:'Hey {name}...', required:true}],
    inmail:       [{key:'subject',   label:'Subject', type:'input',    placeholder:'Re: {company}', required:true},
                   {key:'message',   label:'Body',    type:'textarea', placeholder:'Hi {name}...', required:true}],
    view_profile: [],
    follow:       [],
    endorse:      [],
    wait:         [{key:'days', label:'Days', type:'number', min:0},
                   {key:'hours',label:'Hours',type:'number', min:0, max:23}],
    condition:    [
      {key:'condition', label:'If lead is...', type:'select', options:[
        {value:'accepted',    label:'Connection Accepted'},
        {value:'not_accepted',label:'Connection NOT Accepted'},
        {value:'replied',     label:'Has Replied'},
        {value:'not_replied', label:'Has NOT Replied'},
        {value:'no_response', label:'No Response at All'},
      ]},
      {key:'timeoutDays', label:'After how many days?', type:'number', min:1, placeholder:'3'},
    ],
  }
  return m[type] || []
}

// ── Right Panel ───────────────────────────────────────────────────────────────
function RightPanel({ mode, selectedStep, insertCtx, onPickType, onUpdateStep, onClose }) {
  const panelStyle = {
    width: 288, background: '#111827', borderLeft: '1px solid #1e2535',
    display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
    animation: 'slideIn 0.18s ease',
  }

  // Step picker
  if (mode === 'picker') return (
    <div style={panelStyle}>
      <div style={{ padding:'16px 18px', borderBottom:'1px solid #1e2535', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Add Step</div>
          <div style={{ fontSize:10, color:'#4b5563', marginTop:2 }}>
            {insertCtx?.branch==='no'?'🔴 NO branch':insertCtx?.branch==='yes'?'🟢 YES branch':'Main flow'}
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',color:'#4b5563',cursor:'pointer' }}><X size={15}/></button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:6 }}>
        {Object.entries(NODE_TYPES).map(([type, def]) => {
          const Icon = def.icon
          return (
            <button key={type} onClick={()=>onPickType(type)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'11px 12px',
              borderRadius:11, background:def.color+'10', border:`1px solid ${def.color}33`,
              cursor:'pointer', textAlign:'left', width:'100%', transition:'all 0.12s'
            }}
              onMouseEnter={e=>e.currentTarget.style.background=def.color+'1e'}
              onMouseLeave={e=>e.currentTarget.style.background=def.color+'10'}
            >
              <div style={{ width:34,height:34,borderRadius:9,background:def.color+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <Icon size={15} color={def.color}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'#fff' }}>{def.label}</div>
                <div style={{ fontSize:10,color:'#4b5563',marginTop:1 }}>{def.desc}</div>
              </div>
              <ChevronRight size={13} color="#2a3245"/>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Step editor
  if (mode === 'editor' && selectedStep) {
    const def    = NODE_TYPES[selectedStep.type]
    const Icon   = def?.icon
    const fields = getFields(selectedStep.type)

    return (
      <div style={panelStyle}>
        <div style={{ padding:'16px 18px', borderBottom:'1px solid #1e2535', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32,height:32,borderRadius:8,background:def?.color+'22',display:'flex',alignItems:'center',justifyContent:'center' }}>
              {Icon && <Icon size={15} color={def?.color}/>}
            </div>
            <div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{def?.label}</div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#4b5563',cursor:'pointer' }}><X size={15}/></button>
        </div>

        <div style={{ flex:1,overflowY:'auto',padding:'18px',display:'flex',flexDirection:'column',gap:16 }}>
          {fields.length===0 ? (
            <div style={{ background:'#0d1117',borderRadius:10,padding:14,display:'flex',gap:10 }}>
              <Info size={13} color={def?.color} style={{ flexShrink:0,marginTop:1 }}/>
              <span style={{ fontSize:12,color:'#6b7280',lineHeight:1.6 }}>Runs automatically — no config needed.</span>
            </div>
          ) : fields.map(field => (
            <div key={field.key}>
              <label style={{ fontSize:11,color:'#9ca3af',fontWeight:600,display:'block',marginBottom:6 }}>
                {field.label}{field.required&&<span style={{color:'#ef4444'}}> *</span>}
              </label>

              {field.type==='textarea' && (
                <>
                  {(field.key==='message'||field.key==='note') && (
                    <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:7 }}>
                      {VARIABLES.map(v=>(
                        <button key={v} onClick={()=>onUpdateStep({...selectedStep,[field.key]:(selectedStep[field.key]||'')+v})}
                          style={{ padding:'2px 6px',borderRadius:5,fontSize:10,background:'#10b98114',color:'#10b981',border:'1px solid #10b98130',cursor:'pointer' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={selectedStep[field.key]||''}
                    onChange={e=>onUpdateStep({...selectedStep,[field.key]:e.target.value})}
                    placeholder={field.placeholder} rows={4}
                    style={{ width:'100%',padding:'9px 11px',background:'#0d1117',border:'1px solid #1e2535',borderRadius:9,color:'#e2e8f0',fontSize:12,outline:'none',resize:'vertical',fontFamily:'inherit',lineHeight:1.6,boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor=def?.color}
                    onBlur={e=>e.target.style.borderColor='#1e2535'}
                  />
                  <div style={{ fontSize:10,color:'#4b5563',marginTop:3 }}>{(selectedStep[field.key]||'').length} chars</div>
                </>
              )}

              {field.type==='input' && (
                <input value={selectedStep[field.key]||''} onChange={e=>onUpdateStep({...selectedStep,[field.key]:e.target.value})}
                  placeholder={field.placeholder}
                  style={{ width:'100%',padding:'9px 11px',background:'#0d1117',border:'1px solid #1e2535',borderRadius:9,color:'#e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor=def?.color}
                  onBlur={e=>e.target.style.borderColor='#1e2535'}
                />
              )}

              {field.type==='number' && (
                <input type="number" min={field.min??0} max={field.max}
                  value={selectedStep[field.key]??''} placeholder={field.placeholder||'0'}
                  onChange={e=>onUpdateStep({...selectedStep,[field.key]:parseInt(e.target.value)||0})}
                  style={{ width:'100%',padding:'9px 11px',background:'#0d1117',border:'1px solid #1e2535',borderRadius:9,color:'#e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box' }}
                />
              )}

              {field.type==='select' && (
                <select value={selectedStep[field.key]||''} onChange={e=>onUpdateStep({...selectedStep,[field.key]:e.target.value})}
                  style={{ width:'100%',padding:'9px 11px',background:'#0d1117',border:'1px solid #1e2535',borderRadius:9,color:'#e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box' }}>
                  {field.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
            </div>
          ))}

          {/* Condition preview */}
          {selectedStep.type==='condition' && selectedStep.condition && (
            <div style={{ background:'#0d1117',borderRadius:10,padding:12,border:'1px solid #1e2535' }}>
              <div style={{ fontSize:10,color:'#4b5563',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em' }}>Branch Preview</div>
              <div style={{ display:'flex',gap:8 }}>
                <div style={{ flex:1,background:'#10b98110',border:'1px solid #10b98130',borderRadius:8,padding:'8px 10px' }}>
                  <div style={{ fontSize:10,color:'#10b981',fontWeight:700,marginBottom:2 }}>✅ YES</div>
                  <div style={{ fontSize:10,color:'#4b5563' }}>Continue if condition met</div>
                </div>
                <div style={{ flex:1,background:'#ef444410',border:'1px solid #ef444430',borderRadius:8,padding:'8px 10px' }}>
                  <div style={{ fontSize:10,color:'#ef4444',fontWeight:700,marginBottom:2 }}>❌ NO</div>
                  <div style={{ fontSize:10,color:'#4b5563' }}>Alternative path if not</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Guide panel
  return (
    <div style={{ width:260,background:'#111827',borderLeft:'1px solid #1e2535',padding:18,display:'flex',flexDirection:'column',gap:10 }}>
      <div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>Sequence Guide</div>
      {[
        {e:'👁', t:'Start with View Profile to warm up before connecting'},
        {e:'🤝', t:'Add a Wait before Connect to look natural'},
        {e:'🔀', t:'Use Condition to branch on acceptance or reply'},
        {e:'✅', t:'YES path: they accepted → send your pitch'},
        {e:'❌', t:'NO path: not accepted → try InMail instead'},
        {e:'⏰', t:'Wait 2–4 days between messages'},
      ].map((tip,i)=>(
        <div key={i} style={{ background:'#0d1117',borderRadius:9,padding:'9px 11px',display:'flex',gap:8,alignItems:'flex-start' }}>
          <span style={{ fontSize:13,flexShrink:0 }}>{tip.e}</span>
          <span style={{ fontSize:11,color:'#6b7280',lineHeight:1.55 }}>{tip.t}</span>
        </div>
      ))}
      <div style={{ padding:11,background:'#10b98110',border:'1px solid #10b98122',borderRadius:9,fontSize:11,color:'#10b981',lineHeight:1.6,marginTop:4 }}>
        Click <strong>+</strong> on any connector to add a step there. Click a node to edit it.
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SequenceBuilder() {
  const navigate       = useNavigate()
  const { campaignId } = useParams()
  const isEditing      = !!campaignId

  const [campaignName, setCampaignName] = useState('')
  const [steps, setSteps]               = useState([])
  const [selectedId, setSelectedId]     = useState(null)
  const [panelMode, setPanelMode]       = useState('guide')
  const [insertCtx, setInsertCtx]       = useState(null)
  const [saving, setSaving]             = useState(false)
  const [loading, setLoading]           = useState(isEditing)

  const [scale, setScale]   = useState(0.9)
  const [pan, setPan]       = useState({ x: 60, y: 20 })
  const isPanning           = useRef(false)
  const panStart            = useRef({ x:0, y:0 })
  const canvasRef           = useRef()
  const token               = localStorage.getItem('token')

  useEffect(() => {
    if (isEditing) loadCampaign()
    else           setDefaultSteps()
  }, [campaignId])

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
      const res  = await fetch(`${API}/campaigns/${campaignId}`, { headers:{ Authorization:`Bearer ${token}` } })
      const data = await res.json()
      setCampaignName(data.name||'')
      setSteps((data.sequence||[]).map(s=>({...s,id:s.id||genId()})))
    } catch { toast.error('Failed to load campaign') }
    finally   { setLoading(false) }
  }

  // Layout
  const seqCounter = useRef({ n:0 })
  const layout = useMemo(() => {
    seqCounter.current = { n:0 }
    return layoutFlow(steps, CX, 80, seqCounter.current)
  }, [steps])

  // Pan
  const onMouseDown = (e) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'text' || e.target.tagName === 'polygon' || e.target.tagName === 'rect') return
    isPanning.current = true
    panStart.current  = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  const onMouseMove = (e) => {
    if (!isPanning.current) return
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
  }
  const onMouseUp = () => { isPanning.current = false }

  useEffect(() => {
    const el = canvasRef.current
    const handler = (e) => { e.preventDefault(); setScale(s => Math.max(0.3, Math.min(2, s * (e.deltaY>0?0.92:1.08)))) }
    if (el) el.addEventListener('wheel', handler, { passive:false })
    return () => { if (el) el.removeEventListener('wheel', handler) }
  }, [])

  // Add step
  const handleAddClick = (ctx) => {
    setInsertCtx(ctx)
    setPanelMode('picker')
    setSelectedId(null)
  }

  const handlePickType = (type) => {
    const newStep = {
      id:genId(), type,
      ...(type==='wait'      ? {days:1,hours:0}                              : {}),
      ...(type==='condition' ? {condition:'accepted',timeoutDays:3,yesSteps:[],noSteps:[]} : {}),
    }

    setSteps(prev => {
      const ctx = insertCtx
      if (!ctx) return [...prev, newStep]

      if (ctx.parentId) {
        // Insert inside a condition branch
        const insertInto = (arr) => arr.map(s => {
          if (s.id !== ctx.parentId) {
            return {
              ...s,
              yesSteps: s.yesSteps ? insertInto(s.yesSteps) : undefined,
              noSteps:  s.noSteps  ? insertInto(s.noSteps)  : undefined,
            }
          }
          const key = ctx.branch === 'yes' ? 'yesSteps' : 'noSteps'
          const arr2 = [...(s[key]||[])]
          arr2.splice(ctx.afterIndex+1, 0, newStep)
          return { ...s, [key]: arr2 }
        })
        return insertInto(prev)
      }

      // Main flow
      const arr = [...prev]
      arr.splice(ctx.afterIndex+1, 0, newStep)
      return arr
    })

    setSelectedId(newStep.id)
    setPanelMode('editor')
  }

  const handleNodeSelect = (id) => {
    setSelectedId(id)
    setPanelMode('editor')
    setInsertCtx(null)
  }

  const handleUpdateStep = (updated) => {
    const update = (arr) => arr.map(s => {
      if (s.id===updated.id) return updated
      return { ...s,
        yesSteps: s.yesSteps ? update(s.yesSteps) : undefined,
        noSteps:  s.noSteps  ? update(s.noSteps)  : undefined,
      }
    })
    setSteps(prev => update(prev))
  }

  const handleDeleteStep = (id) => {
    const del = (arr) => arr.filter(s=>s.id!==id).map(s=>({...s,
      yesSteps: s.yesSteps ? del(s.yesSteps) : undefined,
      noSteps:  s.noSteps  ? del(s.noSteps)  : undefined,
    }))
    setSteps(prev => del(prev))
    setSelectedId(null)
    setPanelMode('guide')
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
      const endpoint = isEditing
        ? `${API}/campaigns/${campaignId}/sequence`
        : `${API}/campaigns/create`
      const method = isEditing ? 'PUT' : 'POST'
      const body   = isEditing
        ? { sequence: steps }
        : { name: campaignName, sequence: steps }

      const res  = await fetch(endpoint, { method, headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body:JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||'Save failed')
      toast.success(isEditing?'Sequence updated!':'Campaign created!')
      setTimeout(() => navigate(`/campaigns/${isEditing?campaignId:data.campaignId}/leads`), 1000)
    } catch(err) { toast.error(err.message) }
    finally      { setSaving(false) }
  }

  const countActions = (arr) => arr.reduce((a,s)=>
    a + (s.type!=='wait'&&s.type!=='condition'?1:0)
      + countActions(s.yesSteps||[])
      + countActions(s.noSteps||[]), 0)
  const countDays = (arr) => arr.reduce((a,s)=>
    a + (s.days||0) + countDays(s.yesSteps||[]) + countDays(s.noSteps||[]), 0)

  if (loading) return (
    <div style={{ height:'100vh',background:'#0d1117',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <Loader2 size={28} color="#10b981" style={{ animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const svgW = 800
  const svgH = layout.bottomY + 120

  return (
    <div style={{ height:'100vh',background:'#0d1117',color:'#e2e8f0',fontFamily:'system-ui,sans-serif',display:'flex',flexDirection:'column' }}>
      <ToastContainer theme="dark"/>

      {/* Topbar */}
      <div style={{ height:58,background:'#111827',borderBottom:'1px solid #1e2535',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 18px',flexShrink:0,gap:12 }}>
        <div style={{ display:'flex',alignItems:'center',gap:14 }}>
          <button onClick={()=>navigate('/campaigns')} style={{ background:'none',border:'none',color:'#6b7280',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:12 }}>
            <ArrowLeft size={14}/> Back
          </button>
          <div style={{ width:1,height:16,background:'#1e2535' }}/>
          <input value={campaignName} onChange={e=>setCampaignName(e.target.value)}
            placeholder="Campaign name..."
            style={{ background:'none',border:'none',color:'#fff',fontSize:15,fontWeight:700,outline:'none',width:220 }}
          />
        </div>

        <div style={{ display:'flex',alignItems:'center',gap:18 }}>
          {[
            {label:'Steps',   value:steps.length,         color:'#6366f1'},
            {label:'Actions', value:countActions(steps),  color:'#10b981'},
            {label:'~Days',   value:countDays(steps)||'<1',color:'#f59e0b'},
          ].map(({label,value,color})=>(
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:15,fontWeight:700,color,fontFamily:'monospace' }}>{value}</div>
              <div style={{ fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.06em' }}>{label}</div>
            </div>
          ))}

          {/* Zoom */}
          <div style={{ display:'flex',gap:2,background:'#0d1117',borderRadius:7,padding:2 }}>
            <button onClick={()=>setScale(s=>Math.max(0.3,s-0.1))} style={{ background:'none',border:'none',color:'#6b7280',cursor:'pointer',padding:'4px 7px',borderRadius:5 }}><ZoomOut size={13}/></button>
            <span style={{ fontSize:11,color:'#6b7280',padding:'4px 2px',minWidth:34,textAlign:'center' }}>{Math.round(scale*100)}%</span>
            <button onClick={()=>setScale(s=>Math.min(2,s+0.1))} style={{ background:'none',border:'none',color:'#6b7280',cursor:'pointer',padding:'4px 7px',borderRadius:5 }}><ZoomIn size={13}/></button>
            <button onClick={()=>{setScale(0.9);setPan({x:60,y:20})}} style={{ background:'none',border:'none',color:'#6b7280',cursor:'pointer',padding:'4px 7px',borderRadius:5 }}><Maximize2 size={12}/></button>
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            display:'flex',alignItems:'center',gap:7,
            background:saving?'#065f46':'#10b981',color:'#fff',border:'none',
            padding:'9px 16px',borderRadius:9,fontSize:13,fontWeight:600,
            cursor:saving?'not-allowed':'pointer'
          }}>
            {saving?<Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>:<Check size={13}/>}
            {saving?'Saving...':isEditing?'Save':'Create'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1,display:'flex',overflow:'hidden' }}>

        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{
            flex:1, overflow:'hidden', position:'relative',
            cursor: isPanning.current?'grabbing':'grab',
            backgroundImage:'radial-gradient(circle, #1a2035 1px, transparent 1px)',
            backgroundSize:'28px 28px',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClick={e=>{
            if(e.target===canvasRef.current||e.target.tagName==='svg'){
              setSelectedId(null); setPanelMode('guide')
            }
          }}
        >
          <svg
            width={svgW} height={svgH}
            style={{
              transform:`translate(${pan.x}px,${pan.y}px) scale(${scale})`,
              transformOrigin:'top left',
              display:'block', overflow:'visible',
            }}
          >
            {/* START pill */}
            <rect x={CX-50} y={28} width={100} height={24} rx={12} fill="#10b98118" stroke="#10b98144" strokeWidth={1.5}/>
            <text x={CX} y={44} textAnchor="middle" fill="#10b981" fontSize={10} fontWeight={700} letterSpacing={1}>START</text>

            {/* First connector from START */}
            {steps.length>0 && (
              <g>
                <line x1={CX} y1={52} x2={CX} y2={layout.nodes[0]?.y||80} stroke="#2a3245" strokeWidth={1.5}/>
                <g style={{cursor:'pointer'}} onClick={()=>handleAddClick({parentId:null,branch:'main',afterIndex:-1})}>
                  <circle cx={CX} cy={(52+(layout.nodes[0]?.y||80))/2} r={10} fill="#0d1117" stroke="#2a3245" strokeWidth={1.5}/>
                  <text x={CX} y={(52+(layout.nodes[0]?.y||80))/2+4} textAnchor="middle" fill="#4b5563" fontSize={16} fontWeight={300}>+</text>
                </g>
              </g>
            )}

            {/* Edges */}
            {layout.edges.map(edge=>(
              <Edge key={edge.id} edge={edge} onAddClick={handleAddClick}/>
            ))}

            {/* Nodes */}
            {layout.nodes.map(node=>(
              <FlowNode
                key={node.step.id}
                node={node}
                isSelected={selectedId===node.step.id}
                onSelect={handleNodeSelect}
                onDelete={handleDeleteStep}
              />
            ))}

            {/* END pill */}
            {steps.length>0 && (
              <g>
                <line x1={CX} y1={layout.bottomY-V_GAP} x2={CX} y2={layout.bottomY-4} stroke="#2a3245" strokeWidth={1.5}/>
                <rect x={CX-50} y={layout.bottomY-4} width={100} height={24} rx={12} fill="#ef444418" stroke="#ef444444" strokeWidth={1.5}/>
                <text x={CX} y={layout.bottomY+12} textAnchor="middle" fill="#ef4444" fontSize={10} fontWeight={700} letterSpacing={1}>END</text>
              </g>
            )}

            {/* Empty state */}
            {steps.length===0 && (
              <g style={{cursor:'pointer'}} onClick={()=>handleAddClick({parentId:null,branch:'main',afterIndex:-1})}>
                <circle cx={CX} cy={130} r={22} fill="#10b98114" stroke="#10b98144" strokeWidth={2}/>
                <text x={CX} y={138} textAnchor="middle" fill="#10b981" fontSize={28} fontWeight={200}>+</text>
                <text x={CX} y={168} textAnchor="middle" fill="#4b5563" fontSize={12}>Click to add your first step</text>
              </g>
            )}
          </svg>
        </div>

        {/* Right panel */}
        <RightPanel
          mode={panelMode}
          selectedStep={selectedStep}
          insertCtx={insertCtx}
          onPickType={handlePickType}
          onUpdateStep={handleUpdateStep}
          onClose={()=>{ setPanelMode('guide'); setSelectedId(null) }}
        />
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(16px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#0d1117; }
        ::-webkit-scrollbar-thumb { background:#1e2535; border-radius:3px; }
      `}</style>
    </div>
  )
}