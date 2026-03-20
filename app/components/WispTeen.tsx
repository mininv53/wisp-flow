'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import XPBar from './XPBar'
import AchievementPopup from './AchievementPopup'
import { useAchievements } from '../lib/useAchievements'
import { calcXP, updateStreak, checkNewBadges, type MotivationState } from '../lib/motivation'

type Mood = 'idle' | 'process' | 'focus' | 'low' | 'error' | 'boost' | 'sync'
type VoiceMode = 'idle' | 'recording' | 'analyzing' | 'responding'
interface Msg { role: 'user' | 'bot'; text: string; mood: Mood; ts: string; isVoice?: boolean }

const MOODS: Record<Mood,{sym:string,label:string,color:string,bursts:string[]}> = {
  idle:    { sym:'◉', label:'online',   color:'#1D9E75', bursts:['◉','○','◌','◦'] },
  process: { sym:'◈', label:'process',  color:'#EF9F27', bursts:['◈','◇','◆','▸'] },
  focus:   { sym:'▣', label:'focus',    color:'#378ADD', bursts:['▣','▪','▸','◈'] },
  low:     { sym:'▱', label:'low',      color:'#888780', bursts:['▱','▰','▯','▮'] },
  error:   { sym:'⊗', label:'error',    color:'#E24B4A', bursts:['⊗','✕','×','⊘'] },
  boost:   { sym:'▲', label:'boost',    color:'#1D9E75', bursts:['▲','△','▴','◆'] },
  sync:    { sym:'⟳', label:'sync',     color:'#AFA9EC', bursts:['⟳','◎','○','◌'] },
}

function detectMood(t: string): Mood {
  const s = t.toLowerCase()
  if (/super|wow|fire|tare|🔥|sick|dope|hype/.test(s)) return 'boost'
  if (/de ce|cum|explic|înțeleg|adică|hmm|interesant/.test(s)) return 'process'
  if (/trist|rău|greu|nu pot|ajutor|deprimat/.test(s)) return 'error'
  if (/obosit|somnoros|epuizat|nu mai/.test(s)) return 'low'
  if (/cod|build|proiect|aplic|muzic|scri|dev/.test(s)) return 'focus'
  if (/mulțumesc|mișto|respect|cool|ok/.test(s)) return 'sync'
  return 'idle'
}

function Avatar({ mood, speaking, size=100 }: { mood:Mood; speaking:boolean; size?:number }) {
  const c = MOODS[mood].color
  const eyeRy = mood==='low'?2.5:mood==='boost'||mood==='focus'?7.5:6
  const browTL = mood==='process'?'rotate(-6 30 27)':mood==='error'?'rotate(10 30 27)':mood==='boost'?'translate(0,-5)':mood==='low'?'translate(0,4)':''
  const browTR = mood==='process'?'rotate(6 60 27)':mood==='error'?'rotate(-10 60 27)':mood==='boost'?'translate(0,-5)':mood==='low'?'translate(0,4)':''
  const mouth = mood==='boost'?'M25 57 Q45 73 65 57':mood==='process'?'M33 62 Q45 62 57 62':mood==='low'?'M34 61 Q45 63 56 61':mood==='error'?'M33 65 Q45 56 57 65':'M30 58 Q45 69 60 58'
  const [mf, setMf] = useState<number>(0)
  useEffect(()=>{
    if(!speaking) return
    const id=setInterval(()=>setMf((f:number)=>(f+1)%3),100)
    return ()=>clearInterval(id)
  },[speaking])
  return (
    <svg viewBox="0 0 90 90" width={size} height={size}>
      <polygon points="45,3 82,24 82,66 45,87 8,66 8,24" fill="#0a1a12" stroke={c} strokeWidth="1.5" strokeOpacity="0.6"/>
      <polygon points="45,10 76,28 76,62 45,80 14,62 14,28" fill="#0d2018" stroke={c} strokeWidth="0.5" strokeOpacity="0.3"/>
      <circle cx="45" cy="44" r="24" fill="#0f2a1a"/>
      <circle cx="45" cy="48" r="18" fill="#122d1e"/>
      <line x1="21" y1="44" x2="69" y2="44" stroke={c} strokeWidth="0.3" strokeOpacity="0.4"/>
      <ellipse cx="30" cy="40" rx="5.5" ry={eyeRy} fill={c} opacity="0.9"/>
      <ellipse cx="60" cy="40" rx="5.5" ry={eyeRy} fill={c} opacity="0.9"/>
      <circle cx="31.5" cy="38" r="1.8" fill="white" opacity="0.9"/>
      <circle cx="61.5" cy="38" r="1.8" fill="white" opacity="0.9"/>
      <circle cx="31.5" cy="38" r=".7" fill={c}/>
      <circle cx="61.5" cy="38" r=".7" fill={c}/>
      <rect x="23" y="30" width="13" height="3" rx="1.5" fill={c} opacity="0.8" transform={browTL}/>
      <rect x="54" y="30" width="13" height="3" rx="1.5" fill={c} opacity="0.8" transform={browTR}/>
      {speaking ? (
        <path d={[mouth,'M32 59 Q45 66 58 59','M34 58 Q45 62 56 58'][mf]} fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.9"/>
      ) : (
        <path d={mouth} fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.9"/>
      )}
      <line x1="8" y1="24" x2="14" y2="28" stroke={c} strokeWidth="1.5" opacity="0.4"/>
      <line x1="82" y1="24" x2="76" y2="28" stroke={c} strokeWidth="1.5" opacity="0.4"/>
      <line x1="8" y1="66" x2="14" y2="62" stroke={c} strokeWidth="1.5" opacity="0.4"/>
      <line x1="82" y1="66" x2="76" y2="62" stroke={c} strokeWidth="1.5" opacity="0.4"/>
    </svg>
  )
}

function Burst({ mood, trigger }: { mood:Mood; trigger:number }) {
  const [ps, setPs] = useState<any[]>([])
  useEffect(()=>{
    if(!trigger) return
    const syms = MOODS[mood].bursts
    const col = MOODS[mood].color
    const items = Array.from({length:6+Math.floor(Math.random()*4)},(_,i)=>{
      const a=Math.random()*Math.PI*2, d=40+Math.random()*55
      return {id:Date.now()+i,e:syms[Math.floor(Math.random()*syms.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-180+Math.random()*360,delay:Math.random()*200,size:10+Math.random()*10,col}
    })
    setPs(items); setTimeout(()=>setPs([]),2000)
  },[trigger])
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50}}>
      {ps.map(p=>(
        <span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',color:p.col,fontFamily:'monospace',fontWeight:700,animationName:'burst',animationDuration:'1.6s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`}}>{p.e}</span>
      ))}
    </div>
  )
}

const defaultMotivation: MotivationState = {
  xp:0,level:1,streak:0,lastActiveDate:'',graceDayUsed:false,totalSessions:0,badges:[],weeklyXP:[]
}

export default function WispTeen({ userId }: { userId?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([{role:'bot',text:'// WISP v2.0 online\n> Hey. Ce construim azi?',mood:'idle',ts:'now'}])
  const [mood, setMood] = useState<Mood>('idle')
  const [speaking, setSpeaking] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('idle')
  const [voText, setVoText] = useState('> awaiting input...')
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [status, setStatus] = useState('online')
  const [burst, setBurst] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [avPos, setAvPos] = useState({ x: 0, y: 0 })
  const [motivation, setMotivation] = useState<MotivationState>(() => {
    if (typeof window === 'undefined') return defaultMotivation
    const s = localStorage.getItem('wisptteen-motivation')
    return s ? JSON.parse(s) : defaultMotivation
  })
  const [newBadges, setNewBadges] = useState<string[]>([])
  const { current: achievement, dismiss, checkAndShow } = useAchievements()
  const chatRef = useRef<HTMLDivElement>(null)
  const voiceBuffer = useRef('')
  const recRef = useRef<any>(null)
  const avAnimRef = useRef<number | null>(null)
  const sessionStart = useRef(Date.now())

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      try { recRef.current?.stop() } catch(e) {}
      if(avAnimRef.current) cancelAnimationFrame(avAnimRef.current)
    }
  }, [])

  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight },[msgs,isTyping])

  useEffect(()=>{
    let t = 0
    const animate = () => {
      t += 0.008
      setAvPos({ x: Math.sin(t * 1.3) * 6, y: Math.sin(t) * 8 })
      avAnimRef.current = requestAnimationFrame(animate)
    }
    avAnimRef.current = requestAnimationFrame(animate)
    return () => { if(avAnimRef.current) cancelAnimationFrame(avAnimRef.current) }
  },[])

  const now = () => new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const awardXP = useCallback((count: number) => {
    const mins = Math.floor((Date.now() - sessionStart.current) / 60000)
    const earned = calcXP(count, '😊', mins)
    let updated = updateStreak(motivation)
    updated = { ...updated, xp: updated.xp + earned, totalSessions: updated.totalSessions + 1, weeklyXP: [...(updated.weeklyXP||[]).slice(-6), earned] }
    const unlocked = checkNewBadges(updated)
    updated.badges = [...updated.badges, ...unlocked]
    setNewBadges(unlocked)
    setMotivation(updated)
    localStorage.setItem('wisptteen-motivation', JSON.stringify(updated))
    checkAndShow(motivation, updated, earned, {})
  }, [motivation, checkAndShow])

  const wispSpeak = useCallback((text:string, m:Mood, onDone?:()=>void)=>{
    const synth=window.speechSynthesis; synth.cancel()
    const utt=new SpeechSynthesisUtterance(text.replace(/^\/\/.*\n?/gm,'').replace(/^> /gm,''))
    utt.lang='ro-RO'; utt.pitch=0.9; utt.rate=1.0; utt.volume=1
    utt.onstart=()=>{ setSpeaking(true); setMood(m); setStatus('talking') }
    utt.onend=()=>{ setSpeaking(false); setMood('idle'); setStatus('online'); onDone?.() }
    utt.onerror=()=>{ setSpeaking(false); setMood('idle'); setStatus('online'); onDone?.() }
    synth.speak(utt)
  },[])

  const getReply = async (history:Msg[], text:string) => {
    try {
      const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],
        systemContext:`Ești WISP, companion AI pentru adolescenți 13-18 ani. Ești direct, cool, vorbești ca un prieten. Max 2 propoziții. Ajuți cu orice: cod, muzică, scriere, psihologie. Răspunzi în română. Fără asteriscuri.`
      })})
      const d=await res.json()
      return {text:d.message||'Interesant.',mood:detectMood(d.message||'')}
    } catch { return {text:'Connection error.',mood:'error' as Mood} }
  }

  const sendMsg = async (text:string, isVoice=false) => {
    if(!text.trim()) return
    const m=detectMood(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice}])
    setMood('process'); setStatus('processing...'); setIsTyping(true)
    const reply=await getReply(msgs,text)
    setIsTyping(false)
    setMsgs(p=>[...p,{role:'bot',text:reply.text,mood:reply.mood,ts:now(),isVoice}])
    setMood(reply.mood); setBurst(b=>b+1)
    awardXP(1)
    wispSpeak(reply.text,reply.mood)
  }

  const startVoiceRec=()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){setVoText('> chrome only.');return}
    voiceBuffer.current=''
    const rec=new SR(); rec.lang='ro-RO'; rec.continuous=true; rec.interimResults=true
    rec.onresult=(e:any)=>{
      let t=''; for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal) voiceBuffer.current+=e.results[i][0].transcript+' '
        else t+=e.results[i][0].transcript
      }
      setVoText('> '+(voiceBuffer.current+t)||'...')
    }
    rec.onerror=()=>{}; rec.start(); recRef.current=rec
    setVoiceMode('recording'); setVoText('> listening...'); setMood('focus'); setIsListening(true)
  }

  const finishVoiceRec=()=>{
    try{recRef.current?.stop()}catch(e){}; setIsListening(false)
    const text=voiceBuffer.current.trim()
    if(!text){setVoiceMode('idle');setVoText('> no input detected.');return}
    setVoiceMode('analyzing'); setMood('process')
    sendVoiceMsg(text)
  }

  const sendVoiceMsg=async(text:string)=>{
    const m=detectMood(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice:true}])
    const reply=await getReply(msgs,text)
    setMsgs(p=>[...p,{role:'bot',text:reply.text,mood:reply.mood,ts:now(),isVoice:true}])
    setMood(reply.mood); setVoText('> '+reply.text); setBurst(b=>b+1)
    awardXP(1)
    setVoiceMode('responding')
    wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('> ready.')})
  }

  const toggleMic=()=>{
    if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('online');return}
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){alert('Chrome only.');return}
    const rec=new SR(); rec.lang='ro-RO'; rec.continuous=false; rec.interimResults=true
    rec.onstart=()=>{setIsListening(true);setMood('focus');setStatus('listening...')}
    rec.onresult=(e:any)=>{
      let t=''; for(let i=e.resultIndex;i<e.results.length;i++) t+=e.results[i][0].transcript
      setInput(t)
      if(e.results[e.results.length-1].isFinal){try{rec.stop()}catch(e){};setIsListening(false);setStatus('online');sendMsg(t)}
    }
    rec.onerror=()=>{setIsListening(false);setStatus('online')}
    rec.start(); recRef.current=rec
  }

  const handleVoBtn=()=>{
    if(voiceMode==='idle') startVoiceRec()
    else if(voiceMode==='recording') finishVoiceRec()
    else if(voiceMode==='responding'){window.speechSynthesis.cancel();setSpeaking(false);setVoiceMode('idle');setVoText('> ready.')}
  }

  const mc = MOODS[mood].color
  const statusColor = status==='listening...'?'#E24B4A':status==='processing...'?'#EF9F27':status==='talking'?mc:'#1D9E75'

  return (
    <div style={{minHeight:'100vh',background:'#020d07',display:'flex',flexDirection:'column',fontFamily:'"Courier New",Courier,monospace',position:'relative',overflow:'hidden',color:'rgba(255,255,255,.85)'}}>
      <style>{`
        @keyframes burst{0%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.2) rotate(var(--rot))}}
        @keyframes msg-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scan{0%{transform:translateY(-100%);opacity:0}10%{opacity:1}90%{opacity:.3}100%{transform:translateY(100vh);opacity:0}}
        @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes grid-fade{0%,100%{opacity:.03}50%{opacity:.07}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes ring-out{0%{opacity:.5;transform:scale(1)}100%{opacity:0;transform:scale(1.6)}}
      `}</style>

      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(29,158,117,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,158,117,.06) 1px,transparent 1px)',backgroundSize:'32px 32px',animation:'grid-fade 4s ease-in-out infinite',pointerEvents:'none'}}/>
      {[0,1,2].map(i=>(<div key={i} style={{position:'absolute',left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(29,158,117,.3),transparent)',animation:`scan ${6+i*3}s linear infinite`,animationDelay:`${i*2}s`,pointerEvents:'none'}}/>))}
      {[{top:8,left:8,borderTop:'1px solid',borderLeft:'1px solid'},{top:8,right:8,borderTop:'1px solid',borderRight:'1px solid'},{bottom:8,left:8,borderBottom:'1px solid',borderLeft:'1px solid'},{bottom:8,right:8,borderBottom:'1px solid',borderRight:'1px solid'}].map((s,i)=>(
        <div key={i} style={{position:'absolute',width:16,height:16,borderColor:'rgba(29,158,117,.3)',pointerEvents:'none',...s}}/>
      ))}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 18px',flexShrink:0,position:'relative',zIndex:2,borderBottom:'0.5px solid rgba(29,158,117,.1)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,color:'rgba(29,158,117,.5)'}}>{'>'}</span>
          <span style={{fontSize:13,fontWeight:700,color:'#9FE1CB',letterSpacing:'.1em'}}>WISP</span>
          <span style={{fontSize:10,color:'rgba(29,158,117,.4)',background:'rgba(29,158,117,.06)',padding:'1px 7px',borderRadius:4,border:'0.5px solid rgba(29,158,117,.15)',letterSpacing:'.06em'}}>TEEN · v2.0</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>setShowXP(v=>!v)} style={{padding:'3px 8px',borderRadius:4,fontSize:10,border:'0.5px solid rgba(29,158,117,.25)',background:'rgba(29,158,117,.06)',color:'#9FE1CB',cursor:'pointer',fontFamily:'monospace'}}>
            XP:{motivation.xp}
          </button>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:statusColor}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:statusColor,animation:status!=='online'?'rpulse .7s infinite':undefined}}/>
            {status}
          </div>
          <button onClick={()=>setVoiceOpen(true)} style={{padding:'4px 10px',borderRadius:4,fontSize:10,border:'0.5px solid rgba(29,158,117,.25)',background:'rgba(29,158,117,.06)',color:'#9FE1CB',cursor:'pointer',letterSpacing:'.04em'}}>MIC_ON</button>
        </div>
      </div>

      {showXP && (
        <div style={{padding:'8px 18px',position:'relative',zIndex:2,borderBottom:'0.5px solid rgba(29,158,117,.08)'}}>
          <XPBar state={motivation} newBadges={newBadges}/>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'14px 0 6px',flexShrink:0,position:'relative',zIndex:2}}>
        <div style={{position:'relative',transform:`translate(${avPos.x}px,${avPos.y}px)`,transition:'transform .05s linear'}}>
          {speaking&&[110,145].map((sz,i)=>(
            <div key={i} style={{position:'absolute',inset:-(sz-90)/2,borderRadius:2,border:`1px solid ${mc}`,animation:`ring-out ${1.2+i*.3}s ease-out infinite ${i*.2}s`,opacity:.6-i*.2}}/>
          ))}
          <Avatar mood={mood} speaking={speaking} size={90}/>
          <Burst mood={mood} trigger={burst}/>
          {(status==='processing...'||status==='listening...') && (
            <div style={{position:'absolute',left:0,right:0,height:1,background:mc,top:'50%',animation:'rpulse .5s infinite',pointerEvents:'none',opacity:.6}}/>
          )}
        </div>
        <div style={{marginTop:6,display:'flex',alignItems:'center',gap:8,fontSize:10}}>
          <span style={{color:mc,fontWeight:700,letterSpacing:'.08em'}}>{MOODS[mood].sym}</span>
          <span style={{color:'rgba(29,158,117,.45)',letterSpacing:'.06em'}}>{MOODS[mood].label.toUpperCase()}</span>
          <span style={{color:'rgba(29,158,117,.2)',animation:'blink 1.2s infinite'}}>█</span>
        </div>
      </div>

      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'4px 16px 8px',display:'flex',flexDirection:'column',gap:6,position:'relative',zIndex:1}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',maxWidth:'90%',alignSelf:m.role==='user'?'flex-end':'flex-start',flexDirection:m.role==='user'?'row-reverse':'row',animation:'msg-in .25s ease-out'}}>
            <div style={{width:18,height:18,borderRadius:2,background:m.role==='bot'?'rgba(29,158,117,.15)':'rgba(255,255,255,.04)',border:`0.5px solid ${m.role==='bot'?'rgba(29,158,117,.3)':'rgba(255,255,255,.08)'}`,color:m.role==='bot'?'#9FE1CB':'rgba(255,255,255,.3)',fontSize:8,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
              {m.role==='bot'?'W':'U'}
            </div>
            <div style={{maxWidth:'100%'}}>
              <div style={{padding:'7px 11px',borderRadius:2,fontSize:12,lineHeight:1.6,background:m.role==='bot'?'rgba(29,158,117,.07)':'rgba(29,158,117,.13)',color:m.role==='bot'?'rgba(255,255,255,.82)':'rgba(255,255,255,.92)',border:`0.5px solid rgba(29,158,117,${m.role==='bot'?.12:.22})`,borderLeft:`2px solid ${m.role==='bot'?MOODS[m.mood].color:'rgba(29,158,117,.4)'}`,fontStyle:m.isVoice?'italic':'normal',whiteSpace:'pre-line'}}>
                {m.isVoice?`// voice\n> ${m.text}`:m.text}
              </div>
              <div style={{fontSize:9,marginTop:2,color:'rgba(29,158,117,.25)',display:'flex',gap:5,justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                <span style={{color:MOODS[m.mood].color}}>{MOODS[m.mood].sym}</span>
                <span>{m.ts}</span>
                {m.isVoice&&<span>· voice</span>}
              </div>
            </div>
          </div>
        ))}
        {isTyping&&(
          <div style={{display:'flex',gap:8,alignItems:'center',animation:'msg-in .25s ease-out'}}>
            <div style={{width:18,height:18,borderRadius:2,background:'rgba(29,158,117,.15)',border:'0.5px solid rgba(29,158,117,.3)',color:'#9FE1CB',fontSize:8,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>W</div>
            <div style={{display:'flex',gap:3,padding:'7px 11px',background:'rgba(29,158,117,.07)',border:'0.5px solid rgba(29,158,117,.12)',borderLeft:'2px solid rgba(29,158,117,.5)',borderRadius:2}}>
              {[0,.18,.36].map((d,i)=><span key={i} style={{width:5,height:5,borderRadius:'50%',background:'rgba(29,158,117,.5)',display:'inline-block',animation:`tdot 1s ${d}s infinite`}}/>)}
            </div>
          </div>
        )}
      </div>

      <div style={{padding:'8px 16px 16px',display:'flex',gap:7,alignItems:'center',borderTop:'0.5px solid rgba(29,158,117,.08)',position:'relative',zIndex:2}}>
        <span style={{fontSize:11,color:'rgba(29,158,117,.4)',flexShrink:0}}>{'>'}</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){sendMsg(input);setInput('')}}} placeholder="input..." style={{flex:1,background:'transparent',border:'none',borderBottom:'0.5px solid rgba(29,158,117,.2)',borderRadius:0,padding:'6px 4px',color:'#9FE1CB',fontSize:12,outline:'none',fontFamily:'monospace'}}/>
        <button onClick={toggleMic} style={{width:30,height:30,borderRadius:2,border:`0.5px solid ${isListening?'rgba(224,75,74,.5)':'rgba(29,158,117,.2)'}`,background:isListening?'rgba(224,75,74,.1)':'transparent',color:isListening?'#E24B4A':'rgba(29,158,117,.6)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined}}>⏺</button>
        <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:30,height:30,borderRadius:2,border:'0.5px solid rgba(29,158,117,.3)',background:'rgba(29,158,117,.1)',color:'#9FE1CB',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>▸</button>
      </div>

      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,#020d07 0%,#041208 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,zIndex:100,animation:'msg-in .3s ease-out'}}>
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(29,158,117,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(29,158,117,.05) 1px,transparent 1px)',backgroundSize:'32px 32px',pointerEvents:'none'}}/>
          <button onClick={()=>{setVoiceOpen(false);window.speechSynthesis.cancel();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('idle')}} style={{position:'absolute',top:16,right:16,background:'none',border:'none',color:'rgba(29,158,117,.3)',fontSize:16,cursor:'pointer',fontFamily:'monospace',zIndex:1}}>[ X ]</button>
          <div style={{position:'relative',zIndex:1}}>
            {[120,160,200].map((sz,i)=>(
              <div key={i} style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:sz,height:sz,border:`${i===0?1:.5}px solid rgba(29,158,117,${speaking?.5-.1*i:.2-.04*i})`,borderRadius:speaking?'50%':2,transition:'border-radius .5s',animation:speaking?`rpulse ${.6+i*.2}s ease-in-out infinite ${i*.15}s`:`ring-out ${2+i*.4}s ease-out infinite ${i*.3}s`}}/>
            ))}
            <div style={{position:'relative',zIndex:2,transform:`translate(${avPos.x}px,${avPos.y}px)`}}>
              <Avatar mood={mood} speaking={speaking} size={110}/>
              <Burst mood={mood} trigger={burst}/>
            </div>
          </div>
          <div style={{textAlign:'center',zIndex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:'#9FE1CB',letterSpacing:'.12em'}}>WISP</div>
            <div style={{fontSize:10,color:'rgba(29,158,117,.4)',letterSpacing:'.1em',marginTop:3}}>
              {voiceMode==='idle'?'// READY':voiceMode==='recording'?'// RECORDING':voiceMode==='analyzing'?'// ANALYZING':'// SPEAKING'}
            </div>
          </div>
          <div style={{maxWidth:260,textAlign:'left',fontSize:12,color:'rgba(29,158,117,.75)',minHeight:48,lineHeight:1.7,padding:'10px 16px',background:'rgba(29,158,117,.05)',borderRadius:2,border:'0.5px solid rgba(29,158,117,.15)',borderLeft:'2px solid rgba(29,158,117,.4)',fontFamily:'monospace',whiteSpace:'pre-wrap',zIndex:1}}>
            {voText}{voiceMode==='recording'&&<span style={{animation:'blink 0.7s infinite'}}>█</span>}
          </div>
          <button onClick={handleVoBtn} style={{width:64,height:64,borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`1px solid rgba(29,158,117,${voiceMode==='recording'?.2:voiceMode==='responding'?.4:.2})`,background:voiceMode==='recording'?'rgba(224,75,74,.08)':voiceMode==='responding'?'rgba(29,158,117,.12)':'rgba(29,158,117,.06)',animation:voiceMode==='recording'?'rpulse .7s infinite':undefined,transition:'all .2s',color:voiceMode==='recording'?'#E24B4A':'#9FE1CB',fontFamily:'monospace',fontSize:voiceMode==='recording'?14:22,zIndex:1}}>
            {voiceMode==='idle'?'⏺':voiceMode==='recording'?'[ STOP ]':voiceMode==='analyzing'?'...':'▸'}
          </button>
          <div style={{fontSize:10,color:'rgba(29,158,117,.2)',textAlign:'center',fontFamily:'monospace',zIndex:1}}>
            {voiceMode==='idle'?'// press ⏺ to start':voiceMode==='recording'?'// press [STOP] when done':voiceMode==='responding'?'// press ▸ to continue':''}
          </div>
        </div>
      )}

      <AchievementPopup achievement={achievement} onDone={dismiss} theme="dark"/>
    </div>
  )
}