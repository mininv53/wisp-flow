'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

type Mood = 'happy' | 'excited' | 'think' | 'sleepy' | 'sad' | 'laugh' | 'love'
type VoiceMode = 'idle' | 'recording' | 'analyzing' | 'responding'
interface Msg { role: 'user' | 'bot'; text: string; mood: Mood; ts: string; isVoice?: boolean }

const MOODS: Record<Mood,{emoji:string,label:string,bursts:string[]}> = {
  happy:   { emoji:'😊', label:'chill',       bursts:['💚','✦','·','◦'] },
  excited: { emoji:'🔥', label:'hype',        bursts:['🔥','⚡','🚀','💥','✌️'] },
  think:   { emoji:'🤔', label:'gândesc',    bursts:['💡','🎵','🎨','💭'] },
  sleepy:  { emoji:'😮‍💨', label:'obosit',    bursts:['😮‍💨','💤','🌙'] },
  sad:     { emoji:'😞', label:'off',         bursts:['💙','🤍','◦','·'] },
  laugh:   { emoji:'💀', label:'skill issue', bursts:['💀','😭','😂','🎊'] },
  love:    { emoji:'🫶', label:'respect',     bursts:['🫶','💚','✊','🤝'] },
}

function detectMood(t: string): Mood {
  const s = t.toLowerCase()
  if (/super|wow|grozav|bravo|fire|tare|yay|🔥/.test(s)) return 'excited'
  if (/de ce|cum|explic|înțeleg|adică|hmm|interesant/.test(s)) return 'think'
  if (/trist|rău|greu|nu pot|ajutor|deprimat/.test(s)) return 'sad'
  if (/obosit|somnoros|epuizat|nu mai/.test(s)) return 'sleepy'
  if (/haha|lol|mort|💀|amuzant/.test(s)) return 'laugh'
  if (/mulțumesc|fain|mișto|respect/.test(s)) return 'love'
  return 'happy'
}

function Avatar({ mood, speaking, size=90 }: { mood:Mood; speaking:boolean; size?:number }) {
  const eyeRy = mood==='sleepy'?2.5:mood==='excited'||mood==='laugh'?7:6
  const browTL = mood==='think'?'rotate(-5 30 27)':mood==='sad'?'rotate(8 30 27)':mood==='excited'?'translate(0,-4)':mood==='sleepy'?'translate(0,4)':''
  const browTR = mood==='think'?'rotate(5 60 27)':mood==='sad'?'rotate(-8 60 27)':mood==='excited'?'translate(0,-4)':mood==='sleepy'?'translate(0,4)':''
  const mouth = mood==='excited'||mood==='laugh'?'M28 56 Q45 70 62 56':mood==='think'?'M35 61 Q45 61 55 61':mood==='sleepy'?'M35 60 Q45 62 55 60':mood==='sad'?'M35 64 Q45 56 55 64':'M31 58 Q45 67 59 58'
  const [mf, setMf] = useState(0)
  useEffect(()=>{
    if(!speaking) return
    const id=setInterval(()=>setMf(f=>(f+1)%3),100)
    return ()=>clearInterval(id)
  },[speaking])
  return (
    <svg viewBox="0 0 90 90" width={size} height={size}>
      <circle cx="45" cy="45" r="42" fill="#9FE1CB"/>
      <circle cx="45" cy="51" r="32" fill="#E1F5EE"/>
      <ellipse cx="30" cy="39" rx="6" ry={eyeRy} fill="#085041"/>
      <ellipse cx="60" cy="39" rx="6" ry={eyeRy} fill="#085041"/>
      <circle cx="32" cy="37" r="2" fill="white"/>
      <circle cx="62" cy="37" r="2" fill="white"/>
      <ellipse cx="30" cy="28" rx="9" ry="3" fill="#E1F5EE"/>
      <ellipse cx="60" cy="28" rx="9" ry="3" fill="#E1F5EE"/>
      <rect x="22" y="25.5" width="16" height="3.5" rx="1.75" fill="#085041" transform={browTL}/>
      <rect x="52" y="25.5" width="16" height="3.5" rx="1.75" fill="#085041" transform={browTR}/>
      {speaking?(
        <path d={[mouth,'M33 59 Q45 66 57 59','M35 58 Q45 62 55 58'][mf]} fill="none" stroke="#085041" strokeWidth="2.5" strokeLinecap="round"/>
      ):(
        <path d={mouth} fill="none" stroke="#085041" strokeWidth="2.5" strokeLinecap="round"/>
      )}
      <circle cx="17" cy="54" r="7" fill="#5DCAA5" opacity="0.4"/>
      <circle cx="73" cy="54" r="7" fill="#5DCAA5" opacity="0.4"/>
    </svg>
  )
}

function Burst({ mood, trigger }: { mood:Mood; trigger:number }) {
  const [ps, setPs] = useState<any[]>([])
  useEffect(()=>{
    if(!trigger) return
    const emojis=MOODS[mood].bursts
    const items=Array.from({length:5+Math.floor(Math.random()*4)},(_,i)=>{
      const a=Math.random()*Math.PI*2,d=40+Math.random()*55
      return {id:Date.now()+i,e:emojis[Math.floor(Math.random()*emojis.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-180+Math.random()*360,delay:Math.random()*200,size:12+Math.random()*10}
    })
    setPs(items); setTimeout(()=>setPs([]),2200)
  },[trigger])
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50}}>
      {ps.map(p=>(
        <span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',animationName:'burst',animationDuration:'1.7s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`}}>{p.e}</span>
      ))}
    </div>
  )
}

export default function WispTeen({ userId }: { userId?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([{role:'bot',text:"Hey. Ce construim azi? Ai o idee sau ți propun eu ceva 🔥",mood:'happy',ts:'acum'}])
  const [mood, setMood] = useState<Mood>('happy')
  const [speaking, setSpeaking] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('idle')
  const [voText, setVoText] = useState('Apasă și vorbește. Ascult.')
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [status, setStatus] = useState('online')
  const [burst, setBurst] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const voiceBuffer = useRef('')
  const recRef = useRef<any>(null)

  useEffect(()=>{if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight},[msgs,isTyping])
  const now=()=>new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const wispSpeak=useCallback((text:string,m:Mood,onDone?:()=>void)=>{
    const synth=window.speechSynthesis; synth.cancel()
    const utt=new SpeechSynthesisUtterance(text)
    utt.lang='ro-RO'; utt.pitch=0.95; utt.rate=1.0; utt.volume=1
    utt.onstart=()=>{setSpeaking(true);setMood(m);setStatus('vorbesc')}
    utt.onend=()=>{setSpeaking(false);setMood('happy');setStatus('online');onDone?.()}
    utt.onerror=()=>{setSpeaking(false);setMood('happy');setStatus('online');onDone?.()}
    synth.speak(utt)
  },[])

  const getReply=async(history:Msg[],text:string)=>{
    try{
      const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],
        systemContext:`Ești WISP, companion AI pentru adolescenți 13-18 ani. Ești relaxat, direct, vorbești ca un prieten de aceeași vârstă — fără a fi condescendent. Răspunsuri scurte (max 2 prop). Ajuți cu orice: muzică, cod, scriere, probleme personale, idei. Înțelegi cultura teen. Răspunzi în română.`
      })})
      const d=await res.json()
      return {text:d.message||'Interesant ngl.',mood:detectMood(d.message||'')}
    }catch{return{text:'Ceva a mers prost. Try again.',mood:'sad' as Mood}}
  }

  const sendMsg=async(text:string,isVoice=false)=>{
    if(!text.trim()) return
    const m=detectMood(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice}])
    setMood('think'); setStatus('scrie...'); setIsTyping(true)
    const reply=await getReply(msgs,text)
    setIsTyping(false)
    setMsgs(p=>[...p,{role:'bot',text:reply.text,mood:reply.mood,ts:now(),isVoice}])
    setMood(reply.mood); setBurst(b=>b+1)
    wispSpeak(reply.text,reply.mood)
  }

  const startVoiceRec=()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){setVoText('Chrome only bro.');return}
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
    if(!text){setVoiceMode('idle');setVoText("Nu am prins nimic. Try again.");return}
    setVoiceMode('analyzing'); setMood('think')
    sendVoiceMsg(text)
  }

  const sendVoiceMsg=async(text:string)=>{
    const m=detectMood(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice:true}])
    const reply=await getReply(msgs,text)
    setMsgs(p=>[...p,{role:'bot',text:reply.text,mood:reply.mood,ts:now(),isVoice:true}])
    setMood(reply.mood); setVoText(reply.text); setBurst(b=>b+1)
    setVoiceMode('responding')
    wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('Ce mai vrei să spui?')})
  }

  const toggleMic=()=>{
    if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('online');return}
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){alert('Chrome only.');return}
    const rec=new SR(); rec.lang='ro-RO'; rec.continuous=false; rec.interimResults=true
    rec.onstart=()=>{setIsListening(true);setMood('excited');setStatus('ascult...')}
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
    else if(voiceMode==='responding'){window.speechSynthesis.cancel();setSpeaking(false);setVoiceMode('idle');setVoText('Ce mai vrei să spui?')}
  }

  const stColor=status==='ascult...'?'#E24B4A':status==='scrie...'||status==='gândesc'?'#EF9F27':status==='vorbesc'?'#1D9E75':'#1D9E75'

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#020f0a 0%,#031a10 55%,#041228 100%)',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',position:'relative',overflow:'hidden'}}>
      <style>{`
        @keyframes burst{0%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.2) rotate(var(--rot))}}
        @keyframes msg-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ring{0%{opacity:.5;transform:scale(1)}100%{opacity:0;transform:scale(1.4)}}
        @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes scan{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
      `}</style>

      <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(29,158,117,.4),transparent)',animation:'scan 4s linear infinite',pointerEvents:'none'}}/>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{position:'relative'}}>
            <Avatar mood={mood} speaking={speaking} size={38}/>
            {speaking&&<div style={{position:'absolute',inset:-4,borderRadius:'50%',border:'1.5px solid #1D9E75',animation:'ring 1.3s ease-out infinite'}}/>}
            <Burst mood={mood} trigger={burst}/>
          </div>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:14,fontWeight:600,color:'#9FE1CB'}}>WISP</span>
              <span style={{width:6,height:6,borderRadius:'50%',background:stColor,display:'inline-block'}}/>
              <span style={{fontSize:10,color:'rgba(29,158,117,.5)'}}>{status}</span>
            </div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.2)'}}>Teen · 13–18 ani · {MOODS[mood].emoji} {MOODS[mood].label}</div>
          </div>
        </div>
        <button onClick={()=>setVoiceOpen(true)} style={{padding:'5px 12px',borderRadius:10,fontSize:11,border:'0.5px solid rgba(29,158,117,.3)',background:'rgba(29,158,117,.08)',color:'#9FE1CB',cursor:'pointer'}}>
          voice 🎤
        </button>
      </div>

      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'4px 14px',display:'flex',flexDirection:'column',gap:6}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:7,alignItems:'flex-end',maxWidth:'88%',alignSelf:m.role==='user'?'flex-end':'flex-start',flexDirection:m.role==='user'?'row-reverse':'row',animation:'msg-in .25s ease-out'}}>
            <div style={{width:20,height:20,borderRadius:6,background:m.role==='bot'?'rgba(29,158,117,.2)':'rgba(255,255,255,.04)',border:`0.5px solid ${m.role==='bot'?'rgba(29,158,117,.3)':'rgba(255,255,255,.08)'}`,color:m.role==='bot'?'#9FE1CB':'rgba(255,255,255,.3)',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {m.role==='bot'?'W':'T'}
            </div>
            <div>
              <div style={{padding:'8px 12px',borderRadius:12,fontSize:13,lineHeight:1.5,background:m.role==='bot'?'rgba(29,158,117,.1)':'rgba(29,158,117,.18)',color:'rgba(255,255,255,.88)',border:`0.5px solid rgba(29,158,117,${m.role==='bot'?.15:.25})`,borderBottomLeftRadius:m.role==='bot'?2:12,borderBottomRightRadius:m.role==='user'?2:12,fontStyle:m.isVoice?'italic':'normal'}}>
                {m.isVoice?`🎤 ${m.text}`:m.text}
              </div>
              <div style={{fontSize:10,marginTop:2,color:'rgba(255,255,255,.18)',display:'flex',gap:3,justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                {MOODS[m.mood].emoji} {m.ts}{m.isVoice?' · voice':''}
              </div>
            </div>
          </div>
        ))}
        {isTyping&&(
          <div style={{display:'flex',gap:7,alignItems:'center',animation:'msg-in .25s ease-out'}}>
            <div style={{width:20,height:20,borderRadius:6,background:'rgba(29,158,117,.2)',border:'0.5px solid rgba(29,158,117,.3)',color:'#9FE1CB',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>W</div>
            <div style={{display:'flex',gap:3}}>{[0,.18,.36].map((d,i)=><span key={i} style={{width:6,height:6,borderRadius:'50%',background:'rgba(29,158,117,.5)',display:'inline-block',animation:`tdot 1.1s ${d}s infinite`}}/>)}</div>
          </div>
        )}
      </div>

      <div style={{padding:'8px 14px 16px',display:'flex',gap:7,alignItems:'center'}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){sendMsg(input);setInput('')}}} placeholder="scrie ceva..." style={{flex:1,background:'rgba(29,158,117,.06)',border:'0.5px solid rgba(29,158,117,.2)',borderRadius:10,padding:'9px 13px',color:'rgba(255,255,255,.85)',fontSize:13,outline:'none'}}/>
        <button onClick={toggleMic} style={{width:36,height:36,borderRadius:8,border:`0.5px solid ${isListening?'rgba(224,75,74,.5)':'rgba(29,158,117,.2)'}`,background:isListening?'rgba(224,75,74,.12)':'rgba(29,158,117,.06)',color:isListening?'#E24B4A':'rgba(29,158,117,.7)',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined}}>🎤</button>
        <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:36,height:36,borderRadius:8,border:'none',background:'rgba(29,158,117,.25)',color:'#9FE1CB',fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>→</button>
      </div>

      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,#020f0a 0%,#031a10 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18,zIndex:100,animation:'msg-in .35s ease-out'}}>
          <button onClick={()=>{setVoiceOpen(false);window.speechSynthesis.cancel();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('happy')}} style={{position:'absolute',top:16,right:16,background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(29,158,117,.5),transparent)',animation:'scan 3s linear infinite'}}/>
          <div style={{position:'relative'}}>
            {[120,155,190].map((sz,i)=>(
              <div key={i} style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:sz,height:sz,borderRadius:'50%',border:`0.5px solid rgba(29,158,117,${speaking?.4:.2})`,animation:speaking?`rpulse ${.7+i*.25}s ease-in-out infinite ${i*.15}s`:`ring ${2+i*.4}s ease-out infinite ${i*.35}s`}}/>
            ))}
            <div style={{position:'relative',zIndex:2}}>
              <Avatar mood={mood} speaking={speaking} size={100}/>
              <Burst mood={mood} trigger={burst}/>
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:500,color:'#9FE1CB',letterSpacing:'.04em'}}>WISP</div>
            <div style={{fontSize:10,color:'rgba(29,158,117,.4)',letterSpacing:'.08em',textTransform:'uppercase',marginTop:2}}>
              {voiceMode==='idle'?'ready':voiceMode==='recording'?'listening':voiceMode==='analyzing'?'processing':'speaking'}
            </div>
          </div>
          <div style={{maxWidth:260,textAlign:'center',fontSize:14,color:'rgba(255,255,255,.7)',minHeight:44,lineHeight:1.6,background:'rgba(29,158,117,.06)',borderRadius:12,padding:'10px 18px',border:'0.5px solid rgba(29,158,117,.12)',fontStyle:voiceMode==='recording'?'italic':'normal'}}>
            {voText}
          </div>
          <button onClick={handleVoBtn} style={{width:68,height:68,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,cursor:'pointer',border:`1px solid rgba(29,158,117,${voiceMode==='recording'?.2:voiceMode==='responding'?.4:.15})`,background:voiceMode==='recording'?'rgba(224,75,74,.1)':voiceMode==='responding'?'rgba(29,158,117,.12)':'rgba(29,158,117,.06)',animation:voiceMode==='recording'?'rpulse .7s infinite':undefined,transition:'all .2s'}}>
            {voiceMode==='idle'?'🎤':voiceMode==='recording'?'⏹':voiceMode==='analyzing'?'⏳':'🔊'}
          </button>
          <div style={{fontSize:11,color:'rgba(255,255,255,.15)',textAlign:'center'}}>
            {voiceMode==='idle'?'tap 🎤 → vorbești → tap ⏹':voiceMode==='recording'?'tap ⏹ când termini':voiceMode==='responding'?'tap 🔊 to continue':''}
          </div>
        </div>
      )}
    </div>
  )
}