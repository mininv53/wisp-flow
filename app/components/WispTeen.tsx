'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import XPBar from './XPBar'
import AchievementPopup from './AchievementPopup'
import { useAchievements } from '../lib/useAchievements'
import { calcXP, updateStreak, checkNewBadges, type MotivationState } from '../lib/motivation'
import { speak, stopSpeaking } from '../lib/useVoice'
import DynamicBackground, { useDynamicBg, type BgMood } from './DynamicBackground'

type Mood = 'happy'|'excited'|'think'|'sleepy'|'sad'|'laugh'|'love'
type VoiceMode = 'idle'|'recording'|'analyzing'|'responding'
interface Msg{role:'user'|'bot';text:string;mood:Mood;ts:string;isVoice?:boolean}

const MOODS:Record<Mood,{emoji:string;label:string;bursts:string[];bg:BgMood}> = {
  happy:   {emoji:'😊',label:'fericit',    bursts:['💜','⭐','✨','🌟'],bg:'happy'},
  excited: {emoji:'🤩',label:'entuziasmat',bursts:['🎉','⭐','✨','🔥','🌈'],bg:'excited'},
  think:   {emoji:'🤔',label:'gândesc',    bursts:['💭','❓','💡','🔮'],bg:'think'},
  sleepy:  {emoji:'😴',label:'obosit',     bursts:['💤','😪','🌙','⭐'],bg:'sleepy'},
  sad:     {emoji:'😟',label:'îngrijorat', bursts:['💙','🤗','💛','🌸'],bg:'sad'},
  laugh:   {emoji:'😄',label:'râd',        bursts:['😂','🎉','💛','✨','🎊'],bg:'laugh'},
  love:    {emoji:'🥰',label:'afectuos',   bursts:['❤️','💜','💕','🌸','💫'],bg:'love'},
}

function detectMood(t:string):Mood {
  const s=t.toLowerCase()
  if(/super|wow|grozav|bravo|amazing|tare|yay/.test(s))return 'excited'
  if(/de ce|cum|explic|înțeleg|adică|hmm/.test(s))return 'think'
  if(/trist|rău|greu|nu pot|ajutor/.test(s))return 'sad'
  if(/obosit|somnoros|epuizat/.test(s))return 'sleepy'
  if(/haha|lol|amuzant|râd/.test(s))return 'laugh'
  if(/iubesc|drăguț|frumos|mulțumesc/.test(s))return 'love'
  return 'happy'
}

function useTypingText(fullText:string,active:boolean,speed=45){
  const [d,setD]=useState('')
  useEffect(()=>{
    if(!active||!fullText){setD(fullText);return}
    setD('');let i=0
    const id=setInterval(()=>{i++;setD(fullText.slice(0,i));if(i>=fullText.length)clearInterval(id)},speed)
    return()=>clearInterval(id)
  },[fullText,active,speed])
  return d
}
function TypingMsg({text,speed=45}:{text:string;speed?:number}){
  const d=useTypingText(text,true,speed)
  return <>{d}<span style={{opacity:d.length<text.length?1:0,animation:'cursor-blink .7s infinite',color:'rgba(127,119,221,.6)'}}>▌</span></>
}

function Avatar({mood,speaking,size=140,waves=false}:{mood:Mood;speaking:boolean;size?:number;waves?:boolean}){
  const eyeRy=mood==='sleepy'?3:mood==='excited'||mood==='laugh'||mood==='love'?8:7
  const bTL=mood==='think'?'rotate(-7 30 27)':mood==='sad'?'rotate(9 30 27)':mood==='excited'||mood==='laugh'?'translate(0,-4)':mood==='sleepy'?'translate(0,3)':''
  const bTR=mood==='think'?'rotate(7 60 27)':mood==='sad'?'rotate(-9 60 27)':mood==='excited'||mood==='laugh'?'translate(0,-4)':mood==='sleepy'?'translate(0,3)':''
  const mouth=mood==='excited'||mood==='laugh'?'M26 56 Q45 72 64 56':mood==='think'?'M33 61 Q45 61 57 61':mood==='sleepy'?'M34 60 Q45 62 56 60':mood==='sad'?'M33 64 Q45 55 57 64':'M30 57 Q45 68 60 57'
  const [mf,setMf]=useState(0)
  useEffect(()=>{if(!speaking)return;const id=setInterval(()=>setMf(f=>(f+1)%3),110);return()=>clearInterval(id)},[speaking])
  return(
    <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
      {waves&&[1,2,3].map(i=>(
        <div key={i} style={{position:'absolute',width:size+i*28,height:size+i*28,borderRadius:'50%',border:`0.5px solid rgba(127,119,221,${speaking?.18-.04*i:.07-.01*i})`,top:'50%',left:'50%',transform:'translate(-50%,-50%)',animation:`wave ${2+i*.5}s ease-in-out infinite ${i*.35}s`,pointerEvents:'none'}}/>
      ))}
      <svg viewBox="0 0 90 90" width={size} height={size} style={{position:'relative',zIndex:1}}>
        <circle cx="45" cy="45" r="42" fill="#CECBF6"/>
        <circle cx="45" cy="51" r="33" fill="#EEEDFE"/>
        <ellipse cx="30" cy="39" rx="6.5" ry={eyeRy} fill="#3C3489"/>
        <ellipse cx="60" cy="39" rx="6.5" ry={eyeRy} fill="#3C3489"/>
        <circle cx="32.5" cy="36.5" r="2.2" fill="white"/><circle cx="62.5" cy="36.5" r="2.2" fill="white"/>
        <ellipse cx="30" cy="28" rx="9" ry="3" fill="#EEEDFE"/><ellipse cx="60" cy="28" rx="9" ry="3" fill="#EEEDFE"/>
        <rect x="22" y="25.5" width="16" height="4" rx="2" fill="#3C3489" transform={bTL}/>
        <rect x="52" y="25.5" width="16" height="4" rx="2" fill="#3C3489" transform={bTR}/>
        {speaking?<path d={[mouth,'M32 58 Q45 65 58 58','M34 57 Q45 61 56 57'][mf]} fill="none" stroke="#3C3489" strokeWidth="2.8" strokeLinecap="round"/>:<path d={mouth} fill="none" stroke="#3C3489" strokeWidth="2.8" strokeLinecap="round"/>}
        <circle cx="17" cy="54" r="8" fill="#F4C0D1" opacity="0.5"/>
        <circle cx="73" cy="54" r="8" fill="#F4C0D1" opacity="0.5"/>
      </svg>
    </div>
  )
}

function Burst({mood,trigger}:{mood:Mood;trigger:number}){
  const [ps,setPs]=useState<any[]>([])
  useEffect(()=>{
    if(!trigger)return
    const items=Array.from({length:8+Math.floor(Math.random()*5)},(_,i)=>{
      const a=Math.random()*Math.PI*2,d=70+Math.random()*90
      return{id:Date.now()+i,e:MOODS[mood].bursts[Math.floor(Math.random()*MOODS[mood].bursts.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-180+Math.random()*360,delay:Math.random()*300,size:16+Math.random()*14}
    })
    setPs(items);setTimeout(()=>setPs([]),2800)
  },[trigger])
  return(<div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50,overflow:'hidden'}}>{ps.map(p=><span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',animationName:'burst',animationDuration:'2.2s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`}}>{p.e}</span>)}</div>)
}

function ChatOverlay({msgs,onClose}:{msgs:Msg[];onClose:()=>void}){
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(10,5,30,.97)',zIndex:200,display:'flex',flexDirection:'column',animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'0.5px solid rgba(127,119,221,.1)',flexShrink:0}}>
        <span style={{fontSize:11,color:'rgba(127,119,221,.4)',letterSpacing:'.1em'}}>WISP · conversație completă</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:18,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10,scrollbarWidth:'none'}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:8,alignItems:'flex-end',maxWidth:'85%',alignSelf:m.role==='user'?'flex-end':'flex-start',flexDirection:m.role==='user'?'row-reverse':'row'}}>
            {m.role==='bot'&&<div style={{width:22,height:22,borderRadius:'50%',background:'rgba(127,119,221,.2)',border:'0.5px solid rgba(127,119,221,.4)',color:'#c8c5f5',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>W</div>}
            <div style={{padding:'8px 12px',borderRadius:14,fontSize:13,lineHeight:1.55,background:m.role==='bot'?'rgba(127,119,221,.13)':'rgba(127,119,221,.22)',color:'rgba(255,255,255,.9)',border:`0.5px solid rgba(127,119,221,${m.role==='bot'?.2:.3})`,borderBottomLeftRadius:m.role==='bot'?3:14,borderBottomRightRadius:m.role==='user'?3:14}}>
              {m.isVoice?`🎤 ${m.text}`:m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const defaultMotivation:MotivationState={xp:0,level:1,streak:0,lastActiveDate:'',graceDayUsed:false,totalSessions:0,badges:[],weeklyXP:[]}

export default function Wisp({userId}:{userId?:string}){
  const [msgs,setMsgs]=useState<Msg[]>([{role:'bot',text:'Salut! Sunt WISP, prietenul tău magic! ✨ Ce aventură explorăm azi?',mood:'happy',ts:'acum'}])
  const [mood,setMood]=useState<Mood>('happy')
  const [speaking,setSpeaking]=useState(false)
  const [voiceOpen,setVoiceOpen]=useState(false)
  const [voiceMode,setVoiceMode]=useState<VoiceMode>('idle')
  const [voText,setVoText]=useState('Apasă și vorbește cu mine! 🎤')
  const [input,setInput]=useState('')
  const [isTyping,setIsTyping]=useState(false)
  const [status,setStatus]=useState('')
  const [burst,setBurst]=useState(0)
  const [isListening,setIsListening]=useState(false)
  const [showXP,setShowXP]=useState(false)
  const [showChat,setShowChat]=useState(false)
  const [currentBotText,setCurrentBotText]=useState('Salut! Sunt WISP, prietenul tău magic! ✨ Ce aventură explorăm azi?')
  const [currentBotMood,setCurrentBotMood]=useState<Mood>('happy')
  const [showTyping,setShowTyping]=useState(false)
  const [pendingUserText,setPendingUserText]=useState('')
  const [motivation,setMotivation]=useState<MotivationState>(()=>{if(typeof window==='undefined')return defaultMotivation;const s=localStorage.getItem('wisp-motivation');return s?JSON.parse(s):defaultMotivation})
  const [newBadges,setNewBadges]=useState<string[]>([])
  const {current:achievement,dismiss,checkAndShow}=useAchievements()
  const voiceBuffer=useRef('')
  const recRef=useRef<any>(null)
  const sessionStart=useRef(Date.now())
  const {bgMood,intensity,kwParticles}=useDynamicBg(msgs,MOODS[mood].bg)

  useEffect(()=>{return()=>{stopSpeaking();try{recRef.current?.stop()}catch(e){}}},[])
  const now=()=>new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const awardXP=useCallback((n:number)=>{
    const mins=Math.floor((Date.now()-sessionStart.current)/60000);const earned=calcXP(n,'😊',mins)
    let updated=updateStreak(motivation);updated={...updated,xp:updated.xp+earned,totalSessions:updated.totalSessions+1,weeklyXP:[...(updated.weeklyXP||[]).slice(-6),earned]}
    const unlocked=checkNewBadges(updated);updated.badges=[...updated.badges,...unlocked]
    setNewBadges(unlocked);setMotivation(updated);localStorage.setItem('wisp-motivation',JSON.stringify(updated));checkAndShow(motivation,updated,earned,{})
  },[motivation,checkAndShow])

  const wispSpeak=useCallback((text:string,m:Mood,onDone?:()=>void)=>{
    speak(text,'junior',{onStart:()=>{setSpeaking(true);setMood(m);setStatus('vorbesc...')},onEnd:()=>{setSpeaking(false);setMood('happy');setStatus('');onDone?.()},onError:()=>{setSpeaking(false);setMood('happy');setStatus('');onDone?.()}})
  },[])

  const getReply=async(history:Msg[],text:string)=>{
    try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],systemContext:`Ești WISP, un companion magic pentru copii de 6-12 ani. Ești entuziast, prietenos, vorbești simplu și clar. Răspunsuri SCURTE — maxim 2 propoziții. Folosești comparații cu jocuri și aventuri. Încurajezi mereu. Răspunzi în română.`})});const d=await res.json();return{text:d.message||'Super! Haida să explorăm!',mood:detectMood(d.message||'')}}
    catch{return{text:'Hopa! Ceva nu a mers. Încearcă din nou! 🌟',mood:'happy' as Mood}}
  }

  const sendMsg=async(text:string,isVoice=false)=>{
    if(!text.trim())return;const m=detectMood(text)
    setPendingUserText(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice}])
    setMood('think');setStatus('mă gândesc...');setShowTyping(true);setCurrentBotText('')
    const reply=await getReply(msgs,text)
    setShowTyping(false);setPendingUserText('')
    setMsgs(p=>[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice}])
    setCurrentBotText(reply.text);setCurrentBotMood(reply.mood)
    setMood(reply.mood);setBurst(b=>b+1);awardXP(1);wispSpeak(reply.text,reply.mood)
  }

  const startVoiceRec=()=>{const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){setVoText('Folosește Chrome! 🌐');return}voiceBuffer.current='';const rec=new SR();rec.lang='ro-RO';rec.continuous=true;rec.interimResults=true;rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)voiceBuffer.current+=e.results[i][0].transcript+' ';else t+=e.results[i][0].transcript}setVoText((voiceBuffer.current+t)||'...')};rec.onerror=()=>{};rec.start();recRef.current=rec;setVoiceMode('recording');setVoText('...');setMood('excited');setIsListening(true)}
  const finishVoiceRec=()=>{try{recRef.current?.stop()}catch(e){};setIsListening(false);const text=voiceBuffer.current.trim();if(!text){setVoiceMode('idle');setVoText('Nu am auzit nimic! 🎤');return}setVoiceMode('analyzing');setMood('think');sendVoiceMsg(text)}
  const sendVoiceMsg=async(text:string)=>{
    const m=detectMood(text)
    setPendingUserText(text)
    setMsgs(p=>[...p,{role:'user' as const,text,mood:m,ts:now(),isVoice:true}])
    setShowTyping(true);setCurrentBotText('')
    const reply=await getReply(msgs,text)
    setShowTyping(false);setPendingUserText('')
    setMsgs(p=>[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice:true}])
    setCurrentBotText(reply.text);setCurrentBotMood(reply.mood)
    setMood(reply.mood);setVoText(reply.text);setBurst(b=>b+1);awardXP(1)
    setVoiceMode('responding');wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('Ce mai vrei să îmi spui? 🌟')})
  }
  const toggleMic=()=>{if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('');return}const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){alert('Folosește Chrome.');return}const rec=new SR();rec.lang='ro-RO';rec.continuous=false;rec.interimResults=true;rec.onstart=()=>{setIsListening(true);setMood('excited');setStatus('te ascult...')};rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setInput(t);if(e.results[e.results.length-1].isFinal){try{rec.stop()}catch(e){};setIsListening(false);setStatus('');sendMsg(t)}};rec.onerror=()=>{setIsListening(false);setStatus('')};rec.start();recRef.current=rec}
  const handleVoBtn=()=>{if(voiceMode==='idle')startVoiceRec();else if(voiceMode==='recording')finishVoiceRec();else if(voiceMode==='responding'){stopSpeaking();setSpeaking(false);setVoiceMode('idle');setVoText('Ce mai vrei să îmi spui? 🌟')}}

  return(
    <div style={{height:'100vh',background:'#0d0520',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',position:'relative',overflow:'hidden'}}>
      <style>{`
        @keyframes burst{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.25) rotate(var(--rot))}}
        @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes breathe-av{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.02)}}
        @keyframes wave{0%,100%{opacity:.07;transform:translate(-50%,-50%) scale(1)}50%{opacity:.18;transform:translate(-50%,-50%) scale(1.06)}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes cursor-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes text-appear{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes user-fade{0%{opacity:.55}60%{opacity:.35}100%{opacity:.12}}
        @keyframes ring{0%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}
      `}</style>

      <DynamicBackground mood={bgMood} intensity={intensity} keywordParticles={kwParticles}/>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',flexShrink:0,position:'relative',zIndex:3}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18}}>✨</span>
          <span style={{fontSize:14,fontWeight:600,color:'#c8c5f5',letterSpacing:'.06em'}}>WISP</span>
          <span style={{fontSize:11,color:'rgba(127,119,221,.5)',background:'rgba(127,119,221,.1)',padding:'2px 8px',borderRadius:10,border:'0.5px solid rgba(127,119,221,.2)'}}>Junior · 6-12 ani</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setShowXP(v=>!v)} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:12,fontSize:11,border:'0.5px solid rgba(127,119,221,.25)',background:'rgba(127,119,221,.08)',color:'#c8c5f5',cursor:'pointer'}}>⚡ {motivation.xp} XP</button>
          <button onClick={()=>setShowChat(true)} style={{padding:'4px 10px',borderRadius:12,fontSize:11,border:'0.5px solid rgba(127,119,221,.25)',background:'rgba(127,119,221,.08)',color:'#c8c5f5',cursor:'pointer'}}>≡ chat</button>
          <button onClick={()=>setVoiceOpen(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:20,fontSize:12,border:'0.5px solid rgba(127,119,221,.3)',background:'rgba(127,119,221,.1)',color:'#c8c5f5',cursor:'pointer'}}>🎤 Voice</button>
        </div>
      </div>

      {showXP&&<div style={{padding:'0 18px 10px',position:'relative',zIndex:3}}><XPBar state={motivation} newBadges={newBadges}/></div>}

      {/* CENTRU — robot mare + text */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',zIndex:2,padding:'0 20px'}}>

        {/* Robot */}
        <div style={{position:'relative',animation:'breathe-av 4.5s ease-in-out infinite',marginBottom:24}}>
          <Burst mood={mood} trigger={burst}/>
          <Avatar mood={mood} speaking={speaking} size={150} waves={true}/>
        </div>

        {/* Nume + status */}
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:600,color:'#c8c5f5',letterSpacing:'.04em'}}>{MOODS[mood].emoji} WISP</div>
          {status&&<div style={{fontSize:10,color:'rgba(127,119,221,.5)',marginTop:4,animation:'fade-in .3s ease-out'}}>{status}</div>}
        </div>

        {/* Răspunsul botului */}
        <div style={{maxWidth:320,textAlign:'center',minHeight:70}}>
          {showTyping?(
            <div style={{display:'flex',gap:5,justifyContent:'center',alignItems:'center',height:70}}>
              {[0,.2,.4].map((d,i)=><span key={i} style={{width:8,height:8,borderRadius:'50%',background:'rgba(127,119,221,.4)',display:'inline-block',animation:`tdot 1.2s ${d}s infinite`}}/>)}
            </div>
          ):(
            <div key={currentBotText} style={{fontSize:16,lineHeight:1.8,color:'rgba(255,255,255,.88)',fontWeight:400,letterSpacing:'.01em',animation:'text-appear .5s ease-out'}}>
              <TypingMsg text={currentBotText} speed={42}/>
            </div>
          )}
        </div>

        {/* Textul userului — placeholder */}
        {pendingUserText&&(
          <div style={{marginTop:18,fontSize:12,color:'rgba(255,255,255,.25)',fontStyle:'italic',maxWidth:280,textAlign:'center',animation:'user-fade 2.5s ease-out forwards'}}>
            "{pendingUserText}"
          </div>
        )}
      </div>

      {/* INPUT */}
      <div style={{padding:'0 14px 18px',position:'relative',zIndex:3}}>
        <div style={{display:'flex',gap:8,alignItems:'center',background:'rgba(127,119,221,.07)',border:'0.5px solid rgba(127,119,221,.2)',borderRadius:20,padding:'10px 14px',backdropFilter:'blur(16px)',transition:'all .4s'}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){sendMsg(input);setInput('')}}} placeholder="Scrie-mi ceva magic… ✨" style={{flex:1,background:'transparent',border:'none',color:'#fff',fontSize:13,outline:'none',fontFamily:'system-ui'}}/>
          <button onClick={toggleMic} style={{width:36,height:36,borderRadius:10,border:`0.5px solid ${isListening?'rgba(224,75,74,.5)':'rgba(127,119,221,.25)'}`,background:isListening?'rgba(224,75,74,.15)':'rgba(127,119,221,.08)',color:isListening?'#E24B4A':'#c8c5f5',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined,transition:'all .3s'}}>🎤</button>
          <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:36,height:36,borderRadius:10,border:'none',background:'rgba(127,119,221,.35)',color:'#fff',fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .3s'}}>→</button>
        </div>
      </div>

      {showChat&&<ChatOverlay msgs={msgs} onClose={()=>setShowChat(false)}/>}

      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,zIndex:100,animation:'fade-in .4s ease-out'}}>
          <DynamicBackground mood={bgMood} intensity={50}/>
          <button onClick={()=>{setVoiceOpen(false);stopSpeaking();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('happy')}} style={{position:'absolute',top:18,right:18,background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:22,cursor:'pointer',zIndex:1}}>✕</button>
          <div style={{position:'relative',zIndex:1,animation:'breathe-av 4.5s ease-in-out infinite'}}>
            <Avatar mood={mood} speaking={speaking} size={170} waves={true}/>
            <Burst mood={mood} trigger={burst}/>
          </div>
          <div style={{textAlign:'center',zIndex:1}}><div style={{fontSize:20,fontWeight:300,letterSpacing:'.08em',color:'#c8c5f5'}}>WISP</div><div style={{fontSize:11,color:'rgba(127,119,221,.4)',marginTop:2}}>{voiceMode==='idle'?'apasă pentru a vorbi':voiceMode==='recording'?'🔴 te ascult...':voiceMode==='analyzing'?'⏳ analizez...':'🔊 răspund...'}</div></div>
          <div style={{maxWidth:270,textAlign:'center',fontSize:14,color:'rgba(255,255,255,.75)',minHeight:52,lineHeight:1.7,fontStyle:voiceMode==='recording'?'italic':'normal',background:'rgba(127,119,221,.07)',borderRadius:16,padding:'12px 20px',border:'0.5px solid rgba(127,119,221,.12)',zIndex:1}}>{voText}</div>
          <button onClick={handleVoBtn} style={{width:74,height:74,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,cursor:'pointer',border:`1.5px solid rgba(127,119,221,${voiceMode==='recording'?.3:voiceMode==='responding'?.5:.2})`,background:voiceMode==='recording'?'rgba(224,75,74,.15)':voiceMode==='responding'?'rgba(127,119,221,.2)':'rgba(127,119,221,.1)',animation:voiceMode==='recording'?'rpulse .7s infinite':undefined,transition:'all .3s',zIndex:1}}>{voiceMode==='idle'?'🎤':voiceMode==='recording'?'⏹':voiceMode==='analyzing'?'⏳':'🔊'}</button>
        </div>
      )}
      <AchievementPopup achievement={achievement} onDone={dismiss} theme="dark"/>
    </div>
  )
}