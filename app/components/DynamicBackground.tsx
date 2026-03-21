'use client'
import { useEffect, useRef, useState } from 'react'

export type BgMood = 'neutral'|'happy'|'excited'|'sad'|'think'|'love'|'sleepy'|'rebel'|'focus'|'deep'|'error'|'boost'|'sync'|'low'|'process'|'laugh'
export type Product = 'junior'|'teen'|'flow'

const BG: Record<BgMood,{bg:string;a1:string;a2:string;acc:string}> = {
  neutral: {bg:'#060608',a1:'#060608',a2:'#0a0a10',acc:'rgba(255,255,255,.05)'},
  happy:   {bg:'#0d0520',a1:'#0d0520',a2:'#120a2e',acc:'rgba(127,119,221,.13)'},
  excited: {bg:'#071a07',a1:'#071a07',a2:'#0d280d',acc:'rgba(90,210,100,.15)'},
  sad:     {bg:'#060a14',a1:'#060a14',a2:'#080c1c',acc:'rgba(70,110,220,.11)'},
  think:   {bg:'#0c0c1a',a1:'#0c0c1a',a2:'#10101e',acc:'rgba(150,130,255,.11)'},
  love:    {bg:'#140810',a1:'#140810',a2:'#1c0a16',acc:'rgba(210,90,150,.13)'},
  sleepy:  {bg:'#080810',a1:'#080810',a2:'#0c0c18',acc:'rgba(90,90,150,.09)'},
  rebel:   {bg:'#07100a',a1:'#07100a',a2:'#0a160c',acc:'rgba(90,210,130,.14)'},
  focus:   {bg:'#060e14',a1:'#060e14',a2:'#081218',acc:'rgba(70,150,210,.13)'},
  deep:    {bg:'#08060e',a1:'#08060e',a2:'#0c0812',acc:'rgba(130,70,200,.11)'},
  error:   {bg:'#120606',a1:'#120606',a2:'#180808',acc:'rgba(210,70,70,.11)'},
  boost:   {bg:'#061008',a1:'#061008',a2:'#081408',acc:'rgba(110,210,90,.15)'},
  sync:    {bg:'#080c16',a1:'#080c16',a2:'#0a1018',acc:'rgba(110,150,255,.11)'},
  low:     {bg:'#080808',a1:'#080808',a2:'#0c0c0e',acc:'rgba(110,110,150,.08)'},
  process: {bg:'#0a080e',a1:'#0a080e',a2:'#0e0c14',acc:'rgba(150,110,220,.11)'},
  laugh:   {bg:'#0a0e06',a1:'#0a0e06',a2:'#0e1408',acc:'rgba(170,210,70,.11)'},
}

type Shape = 'circle'|'dot'|'diamond'|'triangle'|'hex'|'star'|'cross'|'line'
const SHAPES: Record<BgMood,Shape[]> = {
  neutral: ['dot','line','circle'],
  happy:   ['star','circle','diamond'],
  excited: ['triangle','star','diamond'],
  sad:     ['line','circle','dot'],
  think:   ['hex','circle','line'],
  love:    ['diamond','circle','star'],
  sleepy:  ['dot','circle','line'],
  rebel:   ['triangle','cross','line'],
  focus:   ['hex','diamond','line'],
  deep:    ['circle','hex','dot'],
  error:   ['cross','triangle','line'],
  boost:   ['star','triangle','diamond'],
  sync:    ['hex','circle','diamond'],
  low:     ['dot','line','circle'],
  process: ['hex','line','circle'],
  laugh:   ['star','diamond','triangle'],
}

export const KEYWORD_REACTIONS = [
  {words:/trist|plâng|singur|pierdut|rău/i,       particles:['·','○','◦','∘'],   color:'rgba(80,120,220,.55)'},
  {words:/fericit|super|grozav|wow|bravo|yay/i,   particles:['★','◆','✦','◈'],   color:'rgba(255,200,80,.7)'},
  {words:/obosit|somnoros|epuizat|burnout/i,       particles:['·','◌','○','◦'],   color:'rgba(120,120,180,.45)'},
  {words:/dragoste|iubesc|love/i,                  particles:['♡','♢','◎','·'],   color:'rgba(220,100,160,.65)'},
  {words:/haha|lol|amuzant|râd/i,                 particles:['◉','★','◆','✦'],   color:'rgba(180,220,80,.65)'},
  {words:/rebel|sistem|profu|scap/i,               particles:['▸','◈','→','◆'],  color:'rgba(100,220,140,.65)'},
  {words:/focus|concentrat|cod|build/i,            particles:['◈','◆','▸','◉'],  color:'rgba(80,160,220,.65)'},
  {words:/mulțumesc|mersi|respect/i,               particles:['◎','○','·','♡'],  color:'rgba(160,140,255,.55)'},
  {words:/ajutor|nu pot|greu|anxios/i,             particles:['◍','○','·','◦'],  color:'rgba(220,120,80,.45)'},
]

function ShapeEl({type,size,color,style}:{type:Shape;size:number;color:string;style?:React.CSSProperties}) {
  if(type==='circle')   return <div style={{...style,width:size,height:size,borderRadius:'50%',border:`0.5px solid ${color}`}}/>
  if(type==='dot')      return <div style={{...style,width:size*.35,height:size*.35,borderRadius:'50%',background:color}}/>
  if(type==='line')     return <div style={{...style,width:size*2.5,height:1,background:color}}/>
  if(type==='diamond')  return <div style={{...style,width:size*.75,height:size*.75,border:`0.5px solid ${color}`,transform:'rotate(45deg)'}}/>
  if(type==='triangle') return <div style={{...style,width:0,height:0,borderLeft:`${size*.45}px solid transparent`,borderRight:`${size*.45}px solid transparent`,borderBottom:`${size*.75}px solid ${color}`}}/>
  if(type==='hex')      return <span style={{...style,fontSize:size,color,fontFamily:'monospace',lineHeight:1}}>⬡</span>
  if(type==='star')     return <span style={{...style,fontSize:size*.85,color,fontFamily:'monospace',lineHeight:1}}>✦</span>
  if(type==='cross')    return <span style={{...style,fontSize:size*.9,color,fontFamily:'monospace',lineHeight:1}}>✕</span>
  return null
}

function KwBurst({particles,color}:{particles:string[];color:string}) {
  const [ps]=useState(()=>Array.from({length:14},(_,i)=>{
    const a=Math.random()*Math.PI*2,d=50+Math.random()*130
    return {id:i,e:particles[i%particles.length],x:15+Math.random()*70,y:15+Math.random()*70,tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-180+Math.random()*360,delay:Math.random()*350,size:9+Math.random()*13}
  }))
  return <>
    {ps.map(p=>(
      <span key={p.id} style={{position:'absolute',left:`${p.x}%`,top:`${p.y}%`,fontSize:p.size,color,fontFamily:'monospace',animationName:'kw-out',animationDuration:'2s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',pointerEvents:'none',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`}}>{p.e}</span>
    ))}
  </>
}

interface Props {
  mood: BgMood
  intensity?: number
  keywordParticles?: {id:number;particles:string[];color:string}[]
}

export default function DynamicBackground({mood,intensity=20,keywordParticles=[]}: Props) {
  const c = BG[mood]||BG.neutral
  const shapeTypes = SHAPES[mood]||SHAPES.neutral
  const count = Math.floor(10+intensity*.2)

  const items = useRef(Array.from({length:28},(_,i)=>({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:4+Math.random()*11, dur:12+Math.random()*18,
    delay:Math.random()*14, tx:(Math.random()-.5)*90,
    ty:(Math.random()-.5)*90, rot:Math.random()*360,
    op:0.04+Math.random()*0.07,
    type:shapeTypes[i%shapeTypes.length],
  })))

  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0}}>
      {/* background gradient — transitioneaza la schimbare mood */}
      <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 25% 35%, ${c.acc} 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, ${c.acc} 0%, transparent 50%), linear-gradient(160deg,${c.a1} 0%,${c.a2} 100%)`,transition:'background 5s ease'}}/>

      {/* figuri animate */}
      {items.current.slice(0,count).map(p=>(
        <ShapeEl key={p.id} type={p.type as Shape} size={p.size}
          color={c.acc.replace(/[\d.]+\)$/,`${p.op})`)}
          style={{position:'absolute',left:`${p.x}%`,top:`${p.y}%`,animationName:'bg-drift',animationDuration:`${p.dur}s`,animationDelay:`${p.delay}s`,animationIterationCount:'infinite',animationTimingFunction:'ease-in-out',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`,flexShrink:0}}
        />
      ))}

      {/* keyword bursts */}
      {keywordParticles.map(kp=><KwBurst key={kp.id} particles={kp.particles} color={kp.color}/>)}

      <style>{`
        @keyframes bg-drift{0%{opacity:0;transform:translate(0,0) rotate(0deg) scale(.8)}15%{opacity:1}85%{opacity:.5}100%{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1.1)}}
        @keyframes kw-out{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.25) rotate(var(--rot))}}
      `}</style>
    </div>
  )
}

// ── HOOK ──────────────────────────────────────────────────
export function useDynamicBg(msgs:{role:string;text:string}[], moodRaw:string) {
  const [kwParticles,setKwParticles]=useState<{id:number;particles:string[];color:string}[]>([])
  const [intensity,setIntensity]=useState(20)
  const prevLen=useRef(0)

  const bgMood=(moodRaw as BgMood)||'neutral'

  useEffect(()=>{
    const c=msgs.filter(m=>m.role==='user').length
    setIntensity(Math.min(20+c*5,85))
  },[msgs])

  useEffect(()=>{
    if(msgs.length<=prevLen.current){prevLen.current=msgs.length;return}
    prevLen.current=msgs.length
    const last=msgs[msgs.length-1]
    if(!last||last.role!=='user') return
    for(const kr of KEYWORD_REACTIONS){
      if(kr.words.test(last.text)){
        const id=Date.now()
        setKwParticles(p=>[...p,{id,particles:kr.particles,color:kr.color}])
        setTimeout(()=>setKwParticles(p=>p.filter(x=>x.id!==id)),2800)
        break
      }
    }
  },[msgs])

  return {bgMood,intensity,kwParticles}
}