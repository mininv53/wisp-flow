'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import XPBar from './XPBar'
import AchievementPopup from './AchievementPopup'
import { useAchievements } from '../lib/useAchievements'
import { calcXP, updateStreak, checkNewBadges, type MotivationState } from '../lib/motivation'

type Mood = 'happy' | 'excited' | 'think' | 'sleepy' | 'sad' | 'laugh' | 'love'
type VoiceMode = 'idle' | 'recording' | 'analyzing' | 'responding'
interface Msg { role: 'user' | 'bot'; text: string; mood: Mood; ts: string; isVoice?: boolean }

const MOODS: Record<Mood,{emoji:string,label:string,bursts:string[]}> = {
  happy:   { emoji:'😊', label:'fericit',     bursts:['💜','⭐','✨','🌟'] },
  excited: { emoji:'🤩', label:'entuziasmat', bursts:['🎉','⭐','✨','🔥','🌈'] },
  think:   { emoji:'🤔', label:'gândesc',    bursts:['💭','❓','💡','🔮'] },
  sleepy:  { emoji:'😴', label:'obosit',      bursts:['💤','😪','🌙','⭐'] },
  sad:     { emoji:'😟', label:'îngrijorat',  bursts:['💙','🤗','💛','🌸'] },
  laugh:   { emoji:'😄', label:'râd',         bursts:['😂','🎉','💛','✨','🎊'] },
  love:    { emoji:'🥰', label:'afectuos',    bursts:['❤️','💜','💕','🌸','💫'] },
}

function detectMood(t: string): Mood {
  const s = t.toLowerCase()
  if (/super|wow|grozav|bravo|amazing|tare|yay|!/.test(s)) return 'excited'
  if (/de ce|cum|explic|înțeleg|adică|hmm/.test(s)) return 'think'
  if (/trist|rău|greu|nu pot|ajutor/.test(s)) return 'sad'
  if (/obosit|somnoros|epuizat/.test(s)) return 'sleepy'
  if (/haha|lol|amuzant|râd/.test(s)) return 'laugh'
  if (/iubesc|drăguț|frumos|mulțumesc/.test(s)) return 'love'
  return 'happy'
}

function Avatar({ mood, speaking, size=100 }: { mood:Mood; speaking:boolean; size?:number }) {
  const eyeRy = mood==='sleepy'?3:mood==='excited'||mood==='laugh'||mood==='love'?8:7
  const browTL = mood==='think'?'rotate(-7 30 27)':mood==='sad'?'rotate(9 30 27)':mood==='excited'||mood==='laugh'?'translate(0,-4)':mood==='sleepy'?'translate(0,3)':''
  const browTR = mood==='think'?'rotate(7 60 27)':mood==='sad'?'rotate(-9 60 27)':mood==='excited'||mood==='laugh'?'translate(0,-4)':mood==='sleepy'?'translate(0,3)':''
  const mouth = mood==='excited'||mood==='laugh'?'M26 56 Q45 72 64 56':mood==='think'?'M33 61 Q45 61 57 61':mood==='sleepy'?'M34 60 Q45 62 56 60':mood==='sad'?'M33 64 Q45 55 57 64':'M30 57 Q45 68 60 57'
  const [mf, setMf] = useState(0)
  useEffect(() => {
    if (!speaking) return
    const id = setInterval(() => setMf(f => (f+1)%3), 110)
    return () => clearInterval(id)
  }, [speaking])
  return (
    <svg viewBox="0 0 90 90" width={size} height={size}>
      <circle cx="45" cy="45" r="42" fill="#CECBF6"/>
      <circle cx="45" cy="51" r="33" fill="#EEEDFE"/>
      <ellipse cx="30" cy="39" rx="6.5" ry={eyeRy} fill="#3C3489"/>
      <ellipse cx="60" cy="39" rx="6.5" ry={eyeRy} fill="#3C3489"/>
      <circle cx="32.5" cy="36.5" r="2.2" fill="white"/>
      <circle cx="62.5" cy="36.5" r="2.2" fill="white"/>
      <ellipse cx="30" cy="28" rx="9" ry="3" fill="#EEEDFE"/>
      <ellipse cx="60" cy="28" rx="9" ry="3" fill="#EEEDFE"/>
      <rect x="22" y="25.5" width="16" height="4" rx="2" fill="#3C3489" transform={browTL}/>
      <rect x="52" y="25.5" width="16" height="4" rx="2" fill="#3C3489" transform={browTR}/>
      {speaking ? (
        <path d={[mouth, 'M32 58 Q45 65 58 58', 'M34 57 Q45 61 56 57'][mf]} fill="none" stroke="#3C3489" strokeWidth="2.8" strokeLinecap="round"/>
      ) : (
        <path d={mouth} fill="none" stroke="#3C3489" strokeWidth="2.8" strokeLinecap="round"/>
      )}
      <circle cx="17" cy="54" r="8" fill="#F4C0D1" opacity="0.5"/>
      <circle cx="73" cy="54" r="8" fill="#F4C0D1" opacity="0.5"/>
    </svg>
  )
}

function Burst({ mood, trigger }: { mood:Mood; trigger:number }) {
  const [ps, setPs] = useState<any[]>([])
  useEffect(() => {
    if (!trigger) return
    const emojis = MOODS[mood].bursts
    const items = Array.from({length:7+Math.floor(Math.random()*4)},(_,i)=>{
      const a = Math.random()*Math.PI*2, d = 45+Math.random()*60
      return {id:Date.now()+i,e:emojis[Math.floor(Math.random()*emojis.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-180+Math.random()*360,delay:Math.random()*250,size:14+Math.random()*12}
    })
    setPs(items)
    setTimeout(()=>setPs([]),2400)
  },[trigger])
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50}}>
      {ps.map(p=>(
        <span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',animationName:'burst',animationDuration:'1.8s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`}}>{p.e}</span>
      ))}
    </div>
  )
}

const defaultMotivation: MotivationState = {
  xp:0,level:1,streak:0,lastActiveDate:'',graceDayUsed:false,totalSessions:0,badges:[],weeklyXP:[]
}

export default function Wisp({ userId }: { userId?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([{role:'bot',text:'Salut! Sunt WISP, prietenul tău magic! ✨ Ce aventură explorăm azi?',mood:'happy',ts:'acum'}])
  const [mood, setMood] = useState<Mood>('happy')
  const [speaking, setSpeaking] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('idle')
  const [voText, setVoText] = useState('Apasă și vorbește cu mine! 🎤')
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [status, setStatus] = useState('gata')
  const [burst, setBurst] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [motivation, setMotivation] = useState<MotivationState>(() => {
    if (typeof window === 'undefined') return defaultMotivation
    const s = localStorage.getItem('wisp-motivation')
    return s ? JSON.parse(s) : defaultMotivation
  })
  const [newBadges, setNewBadges] = useState<string[]>([])
  const { current: achievement, dismiss, checkAndShow } = useAchievements()
  const chatRef = useRef<HTMLDivElement>(null)
  const voiceBuffer = useRef('')
  const recRef = useRef<any>(null)
  const sessionStart = useRef(Date.now())

  // voice leak fix
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      try { recRef.current?.stop() } catch(e) {}
    }
  }, [])

  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight },[msgs,isTyping])

  const now = () => new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const awardXP = useCallback((tasksCompleted: number) => {
    const mins = Math.floor((Date.now() - sessionStart.current) / 60000)
    const earned = calcXP(tasksCompleted, '😊', mins)
    let updated = updateStreak(motivation)
    updated = { ...updated, xp: updated.xp + earned, totalSessions: updated.totalSessions + 1, weeklyXP: [...(updated.weeklyXP||[]).slice(-6), earned] }
    const unlocked = checkNewBadges(updated)
    updated.badges = [...updated.badges, ...unlocked]
    setNewBadges(unlocked)
    setMotivation(updated)
    localStorage.setItem('wisp-motivation', JSON.stringify(updated))
    checkAndShow(motivation, updated, earned, {})
  }, [motivation, checkAndShow])

  const wispSpeak = useCallback((text:string, m:Mood, onDone?:()=>void) => {
    const synth=window.speechSynthesis; synth.cancel()
    const utt=new SpeechSynthesisUtterance(text)
    utt.lang='ro-RO'; utt.pitch=1.2; utt.rate=0.85; utt.volume=1
    utt.onstart=()=>{ setSpeaking(true); setMood(m); setStatus('vorbesc...') }
    utt.onend=()=>{ setSpeaking(false); setMood('happy'); setStatus('gata'); onDone?.() }
    utt.onerror=()=>{ setSpeaking(false); setMood('happy'); setStatus('gata'); onDone?.() }
    synth.speak(utt)
  },[])

  const getReply = async (history:Msg[], text:string) => {
    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],
        systemContext:`Ești WISP, un companion magic pentru copii de 6-12 ani. Ești entuziast, prietenos, vorbești simplu și clar. Răspunsuri SCURTE — maxim 2 propoziții. Folosești comparații cu jocuri și aventuri. Încurajezi mereu. Răspunzi în română.`
      })})
      const d=await res.json()
      return {text:d.message||'Super! Haida să explorăm!',mood:detectMood(d.message||'')}
    } catch { return {text:'Hopa! Ceva nu a mers. Încearcă din nou! 🌟',mood:'happy' as Mood} }
  }

  const sendMsg = async (text:string, isVoice=false) => {
    if(!text.trim()) return
    const m=detectMood(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice}])
    setMood('think'); setStatus('mă gândesc...'); setIsTyping(true)
    const reply=await getReply(msgs,text)
    setIsTyping(false)
    setMsgs(p=>[...p,{role:'bot',text:reply.text,mood:reply.mood,ts:now(),isVoice}])
    setMood(reply.mood); setBurst(b=>b+1)
    awardXP(1)
    wispSpeak(reply.text,reply.mood)
  }

  const startVoiceRec=()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){setVoText('Folosește Chrome! 🌐');return}
    voiceBuffer.current=''
    const rec=new SR(); rec.lang='ro-RO'; rec.continuous=true; rec.interimResults=true
    rec.onresult=(e:any)=>{
      let t=''; for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal) voiceBuffer.current+=e.results[i][0].transcript+' '
        else t+=e.results[i][0].transcript
      }
      setVoText((voiceBuffer.current+t)||'...')
    }
    rec.onerror=()=>{}; rec.start(); recRef.current=rec
    setVoiceMode('recording'); setVoText('...'); setMood('excited'); setIsListening(true)
  }

  const finishVoiceRec=()=>{
    try{recRef.current?.stop()}catch(e){}; setIsListening(false)
    const text=voiceBuffer.current.trim()
    if(!text){setVoiceMode('idle');setVoText('Nu am auzit nimic! Încearcă din nou 🎤');return}
    setVoiceMode('analyzing'); setMood('think')
    sendVoiceMsg(text)
  }

  const sendVoiceMsg=async(text:string)=>{
    const m=detectMood(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice:true}])
    const reply=await getReply(msgs,text)
    setMsgs(p=>[...p,{role:'bot',text:reply.text,mood:reply.mood,ts:now(),isVoice:true}])
    setMood(reply.mood); setVoText(reply.text); setBurst(b=>b+1)
    awardXP(1)
    setVoiceMode('responding')
    wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('Ce mai vrei să îmi spui? 🌟')})
  }

  const toggleMic=()=>{
    if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('gata');return}
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){alert('Folosește Chrome.');return}
    const rec=new SR(); rec.lang='ro-RO'; rec.continuous=false; rec.interimResults=true
    rec.onstart=()=>{setIsListening(true);setMood('excited');setStatus('te ascult...')}
    rec.onresult=(e:any)=>{
      let t=''; for(let i=e.resultIndex;i<e.results.length;i++) t+=e.results[i][0].transcript
      setInput(t)
      if(e.results[e.results.length-1].isFinal){try{rec.stop()}catch(e){};setIsListening(false);setStatus('gata');sendMsg(t)}
    }
    rec.onerror=()=>{setIsListening(false);setStatus('gata')}
    rec.start(); recRef.current=rec
  }

  const handleVoBtn=()=>{
    if(voiceMode==='idle') startVoiceRec()
    else if(voiceMode==='recording') finishVoiceRec()
    else if(voiceMode==='responding'){window.speechSynthesis.cancel();setSpeaking(false);setVoiceMode('idle');setVoText('Ce mai vrei să îmi spui? 🌟')}
  }

  const statusColor=status==='te ascult...'?'#E24B4A':status==='mă gândesc...'?'#EF9F27':status==='vorbesc...'?'#7F77DD':'rgba(255,255,255,.15)'

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0d0520 0%,#120a2e 55%,#0a1628 100%)',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',position:'relative',overflow:'hidden'}}>
      <style>{`
        @keyframes burst{0%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.3) rotate(var(--rot))}}
        @keyframes msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ring{0%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}
        @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .star-bg{position:absolute;border-radius:50%;animation:rpulse var(--d,3s) infinite;pointer-events:none}
      `}</style>

      {[...Array(12)].map((_,i)=>(
        <div key={i} className="star-bg" style={{width:2+Math.random()*3,height:2+Math.random()*3,background:'#7F77DD',left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,['--d' as any]:`${2+Math.random()*4}s`,animationDelay:`${Math.random()*3}s`,opacity:.15+Math.random()*.2}}/>
      ))}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',flexShrink:0,position:'relative',zIndex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18}}>✨</span>
          <span style={{fontSize:14,fontWeight:600,color:'#c8c5f5',letterSpacing:'.06em'}}>WISP</span>
          <span style={{fontSize:11,color:'rgba(127,119,221,.5)',background:'rgba(127,119,221,.1)',padding:'2px 8px',borderRadius:10,border:'0.5px solid rgba(127,119,221,.2)'}}>Junior · 6-12 ani</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setShowXP(v=>!v)} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:12,fontSize:11,border:'0.5px solid rgba(127,119,221,.25)',background:'rgba(127,119,221,.08)',color:'#c8c5f5',cursor:'pointer'}}>
            ⚡ {motivation.xp} XP
          </button>
          <button onClick={()=>setVoiceOpen(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:20,fontSize:12,border:'0.5px solid rgba(127,119,221,.3)',background:'rgba(127,119,221,.1)',color:'#c8c5f5',cursor:'pointer'}}>
            🎤 <span>Voice</span>
          </button>
        </div>
      </div>

      {showXP && (
        <div style={{padding:'0 18px 12px',position:'relative',zIndex:1}}>
          <XPBar state={motivation} newBadges={newBadges}/>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0 12px',gap:8,flexShrink:0,position:'relative',zIndex:1}}>
        <div style={{position:'relative',animation:'float 3s ease-in-out infinite'}}>
          {speaking&&<div style={{position:'absolute',inset:-10,borderRadius:'50%',border:'2px solid #7F77DD',animation:'ring 1.4s ease-out infinite'}}/>}
          {speaking&&<div style={{position:'absolute',inset:-18,borderRadius:'50%',border:'1px solid #7F77DD',animation:'ring 1.4s ease-out infinite .3s',opacity:.5}}/>}
          <Avatar mood={mood} speaking={speaking} size={100}/>
          <Burst mood={mood} trigger={burst}/>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#c8c5f5'}}>{MOODS[mood].emoji} WISP</div>
          <div style={{fontSize:10,color:statusColor,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
            <div style={{width:4,height:4,borderRadius:'50%',background:statusColor,animation:status!=='gata'?'rpulse .7s infinite':undefined}}/>
            {status}
          </div>
        </div>
      </div>

      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'0 14px',display:'flex',flexDirection:'column',gap:8,position:'relative',zIndex:1}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:8,alignItems:'flex-end',maxWidth:'85%',alignSelf:m.role==='user'?'flex-end':'flex-start',flexDirection:m.role==='user'?'row-reverse':'row',animation:'msg-in .3s ease-out'}}>
            {m.role==='bot'&&<div style={{width:24,height:24,borderRadius:'50%',background:'rgba(127,119,221,.2)',border:'0.5px solid rgba(127,119,221,.4)',color:'#c8c5f5',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>W</div>}
            {m.role==='user'&&<div style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,255,255,.05)',border:'0.5px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.35)',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>Tu</div>}
            <div>
              <div style={{padding:'9px 13px',borderRadius:16,fontSize:13,lineHeight:1.55,background:m.role==='bot'?'rgba(127,119,221,.13)':'rgba(127,119,221,.22)',color:'rgba(255,255,255,.9)',border:`0.5px solid rgba(127,119,221,${m.role==='bot'?.2:.3})`,borderBottomLeftRadius:m.role==='bot'?3:16,borderBottomRightRadius:m.role==='user'?3:16,fontStyle:m.isVoice?'italic':'normal'}}>
                {m.isVoice?`🎤 ${m.text}`:m.text}
              </div>
              <div style={{fontSize:10,marginTop:3,color:'rgba(255,255,255,.2)',display:'flex',gap:4,justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                {MOODS[m.mood].emoji} {m.ts}{m.isVoice?' · 🎤':''}
              </div>
            </div>
          </div>
        ))}
        {isTyping&&(
          <div style={{display:'flex',gap:8,alignItems:'center',animation:'msg-in .3s ease-out'}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(127,119,221,.2)',border:'0.5px solid rgba(127,119,221,.4)',color:'#c8c5f5',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>W</div>
            <div style={{display:'flex',gap:3}}>{[0,.2,.4].map((d,i)=><span key={i} style={{width:7,height:7,borderRadius:'50%',background:'rgba(127,119,221,.5)',display:'inline-block',animation:`tdot 1.2s ${d}s infinite`}}/>)}</div>
          </div>
        )}
      </div>

      <div style={{padding:'10px 14px 18px',display:'flex',gap:8,alignItems:'center',position:'relative',zIndex:1}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){sendMsg(input);setInput('')}}} placeholder="Scrie-mi ceva magic… ✨" style={{flex:1,background:'rgba(127,119,221,.08)',border:'0.5px solid rgba(127,119,221,.25)',borderRadius:16,padding:'10px 14px',color:'#fff',fontSize:13,outline:'none'}}/>
        <button onClick={toggleMic} style={{width:38,height:38,borderRadius:12,border:`0.5px solid ${isListening?'rgba(224,75,74,.5)':'rgba(127,119,221,.25)'}`,background:isListening?'rgba(224,75,74,.15)':'rgba(127,119,221,.08)',color:isListening?'#E24B4A':'#c8c5f5',fontSize:17,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined}}>🎤</button>
        <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:38,height:38,borderRadius:12,border:'none',background:'rgba(127,119,221,.35)',color:'#fff',fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>→</button>
      </div>

      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center, rgba(127,119,221,.15) 0%, rgba(0,0,0,.97) 70%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,zIndex:100,animation:'msg-in .4s ease-out'}}>
          <button onClick={()=>{setVoiceOpen(false);window.speechSynthesis.cancel();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('happy')}} style={{position:'absolute',top:18,right:18,background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:22,cursor:'pointer'}}>✕</button>
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {[140,180,220].map((sz,i)=>(
              <div key={i} style={{position:'absolute',width:sz,height:sz,borderRadius:'50%',border:`${i===2?.5:1}px solid rgba(127,119,221,${speaking?.6:.35})`,animation:speaking?`rpulse ${.5+i*.2}s ease-in-out infinite ${i*.15}s`:`ring ${1.8+i*.3}s ease-out infinite ${i*.3}s`}}/>
            ))}
            <div style={{position:'relative',zIndex:2,animation:'float 3s ease-in-out infinite'}}>
              <Avatar mood={mood} speaking={speaking} size={130}/>
              <Burst mood={mood} trigger={burst}/>
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:300,letterSpacing:'.08em',color:'#c8c5f5'}}>WISP</div>
            <div style={{fontSize:11,color:'rgba(127,119,221,.4)',marginTop:2}}>
              {voiceMode==='idle'?'apasă pentru a vorbi':voiceMode==='recording'?'🔴 te ascult...':voiceMode==='analyzing'?'⏳ analizez...':'🔊 răspund...'}
            </div>
          </div>
          <div style={{maxWidth:260,textAlign:'center',fontSize:14,color:'rgba(255,255,255,.75)',minHeight:52,lineHeight:1.65,fontStyle:voiceMode==='recording'?'italic':'normal',background:'rgba(127,119,221,.08)',borderRadius:16,padding:'12px 20px',border:'0.5px solid rgba(127,119,221,.15)'}}>
            {voText}
          </div>
          <button onClick={handleVoBtn} style={{width:74,height:74,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,cursor:'pointer',border:`1.5px solid rgba(127,119,221,${voiceMode==='recording'?.3:voiceMode==='responding'?.5:.2})`,background:voiceMode==='recording'?'rgba(224,75,74,.15)':voiceMode==='responding'?'rgba(127,119,221,.2)':'rgba(127,119,221,.1)',animation:voiceMode==='recording'?'rpulse .7s infinite':undefined,transition:'all .25s'}}>
            {voiceMode==='idle'?'🎤':voiceMode==='recording'?'⏹':voiceMode==='analyzing'?'⏳':'🔊'}
          </button>
          <div style={{fontSize:11,color:'rgba(255,255,255,.18)',textAlign:'center',maxWidth:220,lineHeight:1.6}}>
            {voiceMode==='idle'?'Apasă 🎤, vorbește liber, apoi ⏹ când gata':voiceMode==='recording'?'Apasă ⏹ când ai terminat':voiceMode==='responding'?'Apasă 🔊 pentru a vorbi din nou':''}
          </div>
        </div>
      )}

      <AchievementPopup achievement={achievement} onDone={dismiss} theme="dark"/>
    </div>
  )
}