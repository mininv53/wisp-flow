'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

type Mood = 'happy' | 'excited' | 'think' | 'sleepy' | 'sad' | 'laugh' | 'love'
type VoiceMode = 'idle' | 'recording' | 'analyzing' | 'responding'
interface Msg { role: 'user' | 'bot'; text: string; mood: Mood; ts: string; isVoice?: boolean }

const MOODS: Record<Mood,{emoji:string,label:string,bursts:string[]}> = {
  happy:   { emoji:'◎', label:'echilibrat',  bursts:['○','◎','·','∘','◦'] },
  excited: { emoji:'◈', label:'energizat',   bursts:['◈','◆','▸','▹','→'] },
  think:   { emoji:'◐', label:'reflectez',   bursts:['◐','◑','◒','◓','·'] },
  sleepy:  { emoji:'◌', label:'obosit',      bursts:['◌','○','·','◦','∘'] },
  sad:     { emoji:'◍', label:'greu',        bursts:['◍','○','·','◦'] },
  laugh:   { emoji:'◉', label:'bine',        bursts:['◉','○','◎','·','∘'] },
  love:    { emoji:'♡', label:'recunoscător',bursts:['♡','♢','·','○','◦'] },
}

function detectMood(t: string): Mood {
  const s = t.toLowerCase()
  if (/super|excelent|productiv|reușit|gata|terminat/.test(s)) return 'excited'
  if (/de ce|cum|analizez|gândesc|planific/.test(s)) return 'think'
  if (/trist|rău|greu|blocat|anxios|epuizat/.test(s)) return 'sad'
  if (/obosit|somnoros|nu mai pot|burnout/.test(s)) return 'sleepy'
  if (/bine|mulțumesc|ajutat|recunoscător/.test(s)) return 'love'
  return 'happy'
}

function Avatar({ mood, speaking, size=80 }: { mood:Mood; speaking:boolean; size?:number }) {
  const eyeRy = mood==='sleepy'?2.5:mood==='excited'?6.5:5.5
  const browTL = mood==='think'?'rotate(-4 30 27)':mood==='sad'?'rotate(6 30 27)':mood==='excited'?'translate(0,-3)':mood==='sleepy'?'translate(0,4)':''
  const browTR = mood==='think'?'rotate(4 60 27)':mood==='sad'?'rotate(-6 60 27)':mood==='excited'?'translate(0,-3)':mood==='sleepy'?'translate(0,4)':''
  const mouth = mood==='excited'||mood==='love'||mood==='laugh'?'M32 57 Q45 65 58 57':mood==='think'?'M35 60 Q45 60 55 60':mood==='sleepy'?'M35 60 Q45 61 55 60':mood==='sad'?'M35 63 Q45 57 55 63':'M33 58 Q45 65 57 58'
  const [mf,setMf]=useState(0)
  useEffect(()=>{
    if(!speaking) return
    const id=setInterval(()=>setMf(f=>(f+1)%3),130)
    return ()=>clearInterval(id)
  },[speaking])
  return (
    <svg viewBox="0 0 90 90" width={size} height={size}>
      <circle cx="45" cy="45" r="42" fill="#D3D1C7"/>
      <circle cx="45" cy="51" r="32" fill="#F1EFE8"/>
      <ellipse cx="30" cy="39" rx="5.5" ry={eyeRy} fill="#2C2C2A"/>
      <ellipse cx="60" cy="39" rx="5.5" ry={eyeRy} fill="#2C2C2A"/>
      <circle cx="32" cy="37" r="1.8" fill="white"/>
      <circle cx="62" cy="37" r="1.8" fill="white"/>
      <ellipse cx="30" cy="28" rx="8.5" ry="2.5" fill="#F1EFE8"/>
      <ellipse cx="60" cy="28" rx="8.5" ry="2.5" fill="#F1EFE8"/>
      <rect x="22" y="25.5" width="16" height="3" rx="1.5" fill="#2C2C2A" transform={browTL}/>
      <rect x="52" y="25.5" width="16" height="3" rx="1.5" fill="#2C2C2A" transform={browTR}/>
      {speaking?(
        <path d={[mouth,'M34 59 Q45 63 56 59','M36 58 Q45 61 54 58'][mf]} fill="none" stroke="#2C2C2A" strokeWidth="2.2" strokeLinecap="round"/>
      ):(
        <path d={mouth} fill="none" stroke="#2C2C2A" strokeWidth="2.2" strokeLinecap="round"/>
      )}
      <circle cx="17" cy="54" r="6.5" fill="#B4B2A9" opacity="0.35"/>
      <circle cx="73" cy="54" r="6.5" fill="#B4B2A9" opacity="0.35"/>
    </svg>
  )
}

function Burst({ mood, trigger }: { mood:Mood; trigger:number }) {
  const [ps,setPs]=useState<any[]>([])
  useEffect(()=>{
    if(!trigger) return
    const emojis=MOODS[mood].bursts
    const items=Array.from({length:4+Math.floor(Math.random()*3)},(_,i)=>{
      const a=Math.random()*Math.PI*2,d=35+Math.random()*45
      return {id:Date.now()+i,e:emojis[Math.floor(Math.random()*emojis.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-90+Math.random()*180,delay:Math.random()*200,size:12+Math.random()*8}
    })
    setPs(items); setTimeout(()=>setPs([]),2000)
  },[trigger])
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50}}>
      {ps.map(p=>(
        <span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',animationName:'burst',animationDuration:'1.6s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`,color:'rgba(255,255,255,.4)',fontFamily:'monospace'}}>{p.e}</span>
      ))}
    </div>
  )
}

export default function Flow({ userId }: { userId?: string }) {
  const [msgs,setMsgs]=useState<Msg[]>([{role:'bot',text:'Bună. Cum te simți azi? Un cuvânt e suficient.',mood:'happy',ts:'acum'}])
  const [mood,setMood]=useState<Mood>('happy')
  const [speaking,setSpeaking]=useState(false)
  const [voiceOpen,setVoiceOpen]=useState(false)
  const [voiceMode,setVoiceMode]=useState<VoiceMode>('idle')
  const [voText,setVoText]=useState('Apasă și vorbește.')
  const [input,setInput]=useState('')
  const [isTyping,setIsTyping]=useState(false)
  const [status,setStatus]=useState('')
  const [burst,setBurst]=useState(0)
  const [isListening,setIsListening]=useState(false)
  const chatRef=useRef<HTMLDivElement>(null)
  const voiceBuffer=useRef('')
  const recRef=useRef<any>(null)

  useEffect(()=>{if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight},[msgs,isTyping])
  const now=()=>new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const wispSpeak=useCallback((text:string,m:Mood,onDone?:()=>void)=>{
    const synth=window.speechSynthesis; synth.cancel()
    const utt=new SpeechSynthesisUtterance(text)
    utt.lang='ro-RO'; utt.pitch=0.85; utt.rate=0.9; utt.volume=1
    utt.onstart=()=>{setSpeaking(true);setMood(m);setStatus('vorbesc')}
    utt.onend=()=>{setSpeaking(false);setMood('happy');setStatus('');onDone?.()}
    utt.onerror=()=>{setSpeaking(false);setMood('happy');setStatus('');onDone?.()}
    synth.speak(utt)
  },[])

  const getReply=async(history:Msg[],text:string)=>{
    try{
      const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],
        systemContext:`Ești FLOW, companion AI de productivitate pentru adulți. Ești calm, direct, fără presiune. Vorbești concis — maxim 2 propoziții. Nu ești motivational speaker. Ajuți cu focus, breakdown de taskuri, pattern-uri de energie, blocaje. Ești discret și practic. Răspunzi în română.`
      })})
      const d=await res.json()
      return {text:d.message||'Înțeles.',mood:detectMood(d.message||'')}
    }catch{return{text:'Eroare. Încearcă din nou.',mood:'sad' as Mood}}
  }

  const sendMsg=async(text:string,isVoice=false)=>{
    if(!text.trim()) return
    const m=detectMood(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice}])
    setMood('think'); setStatus('procesez'); setIsTyping(true)
    const reply=await getReply(msgs,text)
    setIsTyping(false)
    setMsgs(p=>[...p,{role:'bot',text:reply.text,mood:reply.mood,ts:now(),isVoice}])
    setMood(reply.mood); setBurst(b=>b+1)
    wispSpeak(reply.text,reply.mood)
  }

  const startVoiceRec=()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){setVoText('Necesită Chrome.');return}
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
    setVoiceMode('recording'); setVoText('...'); setMood('think'); setIsListening(true)
  }

  const finishVoiceRec=()=>{
    try{recRef.current?.stop()}catch(e){}; setIsListening(false)
    const text=voiceBuffer.current.trim()
    if(!text){setVoiceMode('idle');setVoText('Nu am detectat nimic.');return}
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
    wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('Sunt gata.')})
  }

  const toggleMic=()=>{
    if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('');return}
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){alert('Necesită Chrome.');return}
    const rec=new SR(); rec.lang='ro-RO'; rec.continuous=false; rec.interimResults=true
    rec.onstart=()=>{setIsListening(true);setMood('think');setStatus('ascult')}
    rec.onresult=(e:any)=>{
      let t=''; for(let i=e.resultIndex;i<e.results.length;i++) t+=e.results[i][0].transcript
      setInput(t)
      if(e.results[e.results.length-1].isFinal){try{rec.stop()}catch(e){};setIsListening(false);setStatus('');sendMsg(t)}
    }
    rec.onerror=()=>{setIsListening(false);setStatus('')}
    rec.start(); recRef.current=rec
  }

  const handleVoBtn=()=>{
    if(voiceMode==='idle') startVoiceRec()
    else if(voiceMode==='recording') finishVoiceRec()
    else if(voiceMode==='responding'){window.speechSynthesis.cancel();setSpeaking(false);setVoiceMode('idle');setVoText('Sunt gata.')}
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',flexDirection:'column',fontFamily:'"Georgia",serif',position:'relative',overflow:'hidden'}}>
      <style>{`
        @keyframes burst{0%{opacity:.6;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.2) rotate(var(--rot))}}
        @keyframes msg-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.8;transform:scale(1.03)}}
        @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-3px)}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes ring{0%{opacity:.4;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}}
      `}</style>

      {/* subtle grid bg */}
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none'}}/>

      {/* header — flow: clean, centered, minimal */}
      <div style={{padding:'20px 20px 0',flexShrink:0,position:'relative',zIndex:1}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{position:'relative'}}>
              {speaking&&<div style={{position:'absolute',inset:-6,borderRadius:'50%',border:'1px solid rgba(180,178,169,.3)',animation:'ring 1.5s ease-out infinite'}}/>}
              <Avatar mood={mood} speaking={speaking} size={44}/>
              <Burst mood={mood} trigger={burst}/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:400,color:'#C8C6BF',letterSpacing:'.12em',fontFamily:'system-ui'}}>FLOW</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.18)',fontFamily:'system-ui'}}>
                {status?`${MOODS[mood].emoji} ${status}`:`${MOODS[mood].emoji} ${MOODS[mood].label}`}
              </div>
            </div>
          </div>
          <button onClick={()=>setVoiceOpen(true)} style={{padding:'5px 12px',borderRadius:8,fontSize:11,border:'0.5px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(255,255,255,.3)',cursor:'pointer',fontFamily:'system-ui'}}>
            voice
          </button>
        </div>
        {/* thin divider */}
        <div style={{height:'0.5px',background:'rgba(255,255,255,.06)',marginTop:16}}/>
      </div>

      {/* chat — flow: clean, wide, no colors */}
      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12,position:'relative',zIndex:1}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{animation:'msg-in .3s ease-out',maxWidth:m.role==='user'?'75%':'90%',alignSelf:m.role==='user'?'flex-end':'flex-start'}}>
            {m.role==='bot'&&(
              <div style={{fontSize:10,color:'rgba(255,255,255,.15)',marginBottom:4,fontFamily:'system-ui',letterSpacing:'.04em'}}>
                FLOW · {m.ts}{m.isVoice?' · 🎤':''}
              </div>
            )}
            <div style={{fontSize:14,lineHeight:1.7,color:m.role==='bot'?'rgba(255,255,255,.8)':'rgba(255,255,255,.55)',fontStyle:m.isVoice?'italic':'normal',padding:m.role==='bot'?'0':'8px 14px',background:m.role==='user'?'rgba(255,255,255,.04)':'transparent',borderRadius:m.role==='user'?10:0,border:m.role==='user'?'0.5px solid rgba(255,255,255,.07)':'none'}}>
              {m.isVoice&&m.role==='user'?`🎤 "${m.text}"`:m.text}
            </div>
            {m.role==='user'&&(
              <div style={{fontSize:10,color:'rgba(255,255,255,.12)',marginTop:3,textAlign:'right',fontFamily:'system-ui'}}>
                {m.ts}
              </div>
            )}
          </div>
        ))}
        {isTyping&&(
          <div style={{animation:'msg-in .3s ease-out'}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,.15)',marginBottom:4,fontFamily:'system-ui'}}>FLOW</div>
            <div style={{display:'flex',gap:3}}>{[0,.2,.4].map((d,i)=><span key={i} style={{width:5,height:5,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'inline-block',animation:`tdot 1.2s ${d}s infinite`}}/>)}</div>
          </div>
        )}
      </div>

      {/* input — flow: very minimal */}
      <div style={{padding:'12px 20px 20px',position:'relative',zIndex:1}}>
        <div style={{height:'0.5px',background:'rgba(255,255,255,.06)',marginBottom:12}}/>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){sendMsg(input);setInput('')}}} placeholder="Scrie sau vorbește…" style={{flex:1,background:'transparent',border:'none',padding:'6px 0',color:'rgba(255,255,255,.6)',fontSize:14,outline:'none',fontFamily:'Georgia,serif'}}/>
          <button onClick={toggleMic} style={{width:32,height:32,borderRadius:'50%',border:`0.5px solid ${isListening?'rgba(224,75,74,.4)':'rgba(255,255,255,.1)'}`,background:isListening?'rgba(224,75,74,.08)':'transparent',color:isListening?'#E24B4A':'rgba(255,255,255,.25)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined}}>🎤</button>
          <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:32,height:32,borderRadius:'50%',border:'0.5px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(255,255,255,.3)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>↑</button>
        </div>
      </div>

      {/* voice overlay — flow: near-black, breathing circle, meditative */}
      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'#050505',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,zIndex:100,animation:'msg-in .5s ease-out'}}>
          <button onClick={()=>{setVoiceOpen(false);window.speechSynthesis.cancel();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('happy')}} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'rgba(255,255,255,.15)',fontSize:18,cursor:'pointer',fontFamily:'system-ui'}}>✕</button>

          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {[100,130,160].map((sz,i)=>(
              <div key={i} style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:sz,height:sz,borderRadius:'50%',border:`0.5px solid rgba(180,178,169,${speaking?.2:.1})`,animation:`breathe ${2.5+i*.5}s ease-in-out infinite ${i*.4}s`}}/>
            ))}
            <div style={{position:'relative',zIndex:2}}>
              <Avatar mood={mood} speaking={speaking} size={90}/>
              <Burst mood={mood} trigger={burst}/>
            </div>
          </div>

          <div style={{textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:300,color:'rgba(200,198,191,.8)',letterSpacing:'.2em',fontFamily:'Georgia,serif'}}>FLOW</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.2)',marginTop:4,fontFamily:'system-ui',letterSpacing:'.08em'}}>
              {voiceMode==='idle'?'':voiceMode==='recording'?'ascult':voiceMode==='analyzing'?'procesez':'răspund'}
            </div>
          </div>

          <div style={{maxWidth:240,textAlign:'center',fontSize:14,color:'rgba(255,255,255,.55)',minHeight:48,lineHeight:1.75,fontFamily:'Georgia,serif',fontStyle:voiceMode==='recording'?'italic':'normal'}}>
            {voText}
          </div>

          <button onClick={handleVoBtn} style={{width:64,height:64,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,cursor:'pointer',border:`0.5px solid rgba(180,178,169,${voiceMode==='recording'?.15:voiceMode==='responding'?.25:.08})`,background:voiceMode==='recording'?'rgba(224,75,74,.06)':voiceMode==='responding'?'rgba(180,178,169,.06)':'transparent',animation:voiceMode==='recording'?'breathe 1s infinite':undefined,transition:'all .3s'}}>
            {voiceMode==='idle'?'○':voiceMode==='recording'?'◼':voiceMode==='analyzing'?'◐':'◎'}
          </button>

          <div style={{fontSize:10,color:'rgba(255,255,255,.12)',fontFamily:'system-ui',letterSpacing:'.04em'}}>
            {voiceMode==='idle'?'apasă ○ pentru a vorbi':voiceMode==='recording'?'apasă ◼ când termini':voiceMode==='responding'?'apasă ◎ pentru a continua':''}
          </div>
        </div>
      )}
    </div>
  )
}