'use client'
import { useSyncProgress } from '../lib/UseSyncProgress.js'
import { useState, useRef, useEffect, useCallback } from 'react'
import XPBar from './XPBar'
import AchievementPopup from './AchievementPopup'
import { useAchievements } from '../lib/useAchievements'
import { calcXP, updateStreak, checkNewBadges, getMotivationMessage, type MotivationState } from '../lib/motivation'
import { speak, stopSpeaking } from '../lib/useVoice'
import DynamicBackground, { useDynamicBg, type BgMood } from './DynamicBackground'

type Mood = 'happy'|'excited'|'think'|'sleepy'|'sad'|'laugh'|'love'
type VoiceMode = 'idle'|'recording'|'analyzing'|'responding'
interface Msg{role:'user'|'bot';text:string;mood:Mood;ts:string;isVoice?:boolean}
interface Task{id:number;text:string;done:boolean}

const MOODS:Record<Mood,{sym:string;label:string;bursts:string[];bg:BgMood}> = {
  happy:   {sym:'◎',label:'echilibrat',  bursts:['○','◎','·','∘'],bg:'happy'},
  excited: {sym:'◈',label:'energizat',   bursts:['◈','◆','▸','→'],bg:'excited'},
  think:   {sym:'◐',label:'reflectez',   bursts:['◐','◑','◒','·'],bg:'think'},
  sleepy:  {sym:'◌',label:'obosit',      bursts:['◌','○','·','◦'],bg:'sleepy'},
  sad:     {sym:'◍',label:'greu',        bursts:['◍','○','·','◦'],bg:'sad'},
  laugh:   {sym:'◉',label:'bine',        bursts:['◉','○','◎','·'],bg:'laugh'},
  love:    {sym:'♡',label:'recunoscător',bursts:['♡','♢','·','○'],bg:'love'},
}

function detectMood(t:string):Mood {
  const s=t.toLowerCase()
  if(/super|excelent|productiv|reușit|gata|terminat/.test(s))return 'excited'
  if(/de ce|cum|analizez|gândesc|planific/.test(s))return 'think'
  if(/trist|rău|greu|blocat|anxios|epuizat/.test(s))return 'sad'
  if(/obosit|somnoros|nu mai pot|burnout/.test(s))return 'sleepy'
  if(/bine|mulțumesc|ajutat|recunoscător/.test(s))return 'love'
  return 'happy'
}

function calcDepthXP(text:string):number {
  const s=text.toLowerCase();let b=0
  if(text.length>100)b+=8;if(text.length>200)b+=5
  if(/simt|cred|sincer|recunosc/.test(s))b+=6
  if(/singur|obosit|pierdut|confuz/.test(s))b+=5
  if(/relație|dragoste|sex|alcool/.test(s))b+=4
  return Math.min(b,18)
}

function DepthBar({level}:{level:number}) {
  const lbl=['distant','deschis','sincer','profund'][Math.min(Math.floor(level/25),3)]
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'2px 20px'}}>
      <span style={{fontSize:9,color:'rgba(255,255,255,.15)',letterSpacing:'.1em',fontFamily:'Georgia,serif'}}>PROFUNZIME</span>
      <div style={{flex:1,height:1,background:'rgba(255,255,255,.05)',borderRadius:2,position:'relative'}}>
        <div style={{position:'absolute',left:0,top:0,height:'100%',background:'linear-gradient(90deg,rgba(180,178,169,.2),rgba(255,255,255,.3))',width:`${Math.min(level,100)}%`,borderRadius:2,transition:'width .8s ease'}}/>
      </div>
      <span style={{fontSize:9,color:'rgba(255,255,255,.2)',fontFamily:'Georgia,serif'}}>{lbl}</span>
    </div>
  )
}

// Typing cu speed smooth
function useTypingText(fullText:string,active:boolean,speed=55) {
  const [d,setD]=useState('')
  useEffect(()=>{
    if(!active||!fullText){setD(fullText);return}
    setD('');let i=0
    const id=setInterval(()=>{i++;setD(fullText.slice(0,i));if(i>=fullText.length)clearInterval(id)},speed)
    return()=>clearInterval(id)
  },[fullText,active,speed])
  return d
}
function TypingMsg({text,speed=55}:{text:string;speed?:number}) {
  const d=useTypingText(text,true,speed)
  return <>{d}<span style={{opacity:d.length<text.length?1:0,animation:'cursor-blink .7s infinite',color:'rgba(255,255,255,.4)'}}>▌</span></>
}

function Avatar({mood,speaking,size=120,waves=false}:{mood:Mood;speaking:boolean;size?:number;waves?:boolean}) {
  const eyeRy=mood==='sleepy'?2.5:mood==='excited'?6.5:5.5
  const bTL=mood==='think'?'rotate(-4 30 27)':mood==='sad'?'rotate(6 30 27)':mood==='excited'?'translate(0,-3)':mood==='sleepy'?'translate(0,4)':''
  const bTR=mood==='think'?'rotate(4 60 27)':mood==='sad'?'rotate(-6 60 27)':mood==='excited'?'translate(0,-3)':mood==='sleepy'?'translate(0,4)':''
  const mouth=mood==='excited'||mood==='love'||mood==='laugh'?'M32 57 Q45 65 58 57':mood==='think'?'M35 60 Q45 60 55 60':mood==='sleepy'?'M35 60 Q45 61 55 60':mood==='sad'?'M35 63 Q45 57 55 63':'M33 58 Q45 65 57 58'
  const [mf,setMf]=useState(0)
  useEffect(()=>{if(!speaking)return;const id=setInterval(()=>setMf(f=>(f+1)%3),130);return()=>clearInterval(id)},[speaking])
  return(
    <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
      {/* wave rings */}
      {waves&&[1,2,3].map(i=>(
        <div key={i} style={{position:'absolute',width:size+i*30,height:size+i*30,borderRadius:'50%',border:`0.5px solid rgba(180,178,169,${speaking?.15-.03*i:.06-.01*i})`,top:'50%',left:'50%',transform:'translate(-50%,-50%)',animation:`wave ${2+i*.5}s ease-in-out infinite ${i*.3}s`,pointerEvents:'none'}}/>
      ))}
      <svg viewBox="0 0 90 90" width={size} height={size} style={{position:'relative',zIndex:1}}>
        <circle cx="45" cy="45" r="42" fill="#D3D1C7"/>
        <circle cx="45" cy="51" r="32" fill="#F1EFE8"/>
        <ellipse cx="30" cy="39" rx="5.5" ry={eyeRy} fill="#2C2C2A"/>
        <ellipse cx="60" cy="39" rx="5.5" ry={eyeRy} fill="#2C2C2A"/>
        <circle cx="32" cy="37" r="1.8" fill="white"/><circle cx="62" cy="37" r="1.8" fill="white"/>
        <ellipse cx="30" cy="28" rx="8.5" ry="2.5" fill="#F1EFE8"/><ellipse cx="60" cy="28" rx="8.5" ry="2.5" fill="#F1EFE8"/>
        <rect x="22" y="25.5" width="16" height="3" rx="1.5" fill="#2C2C2A" transform={bTL}/>
        <rect x="52" y="25.5" width="16" height="3" rx="1.5" fill="#2C2C2A" transform={bTR}/>
        {speaking?<path d={[mouth,'M34 59 Q45 63 56 59','M36 58 Q45 61 54 58'][mf]} fill="none" stroke="#2C2C2A" strokeWidth="2.2" strokeLinecap="round"/>:<path d={mouth} fill="none" stroke="#2C2C2A" strokeWidth="2.2" strokeLinecap="round"/>}
        <circle cx="17" cy="54" r="6.5" fill="#B4B2A9" opacity="0.35"/>
        <circle cx="73" cy="54" r="6.5" fill="#B4B2A9" opacity="0.35"/>
      </svg>
    </div>
  )
}

function Burst({mood,trigger}:{mood:Mood;trigger:number}) {
  const [ps,setPs]=useState<any[]>([])
  useEffect(()=>{
    if(!trigger)return
    const items=Array.from({length:6+Math.floor(Math.random()*4)},(_,i)=>{
      const a=Math.random()*Math.PI*2,d=60+Math.random()*80
      return{id:Date.now()+i,e:MOODS[mood].bursts[Math.floor(Math.random()*MOODS[mood].bursts.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-90+Math.random()*180,delay:Math.random()*300,size:12+Math.random()*10}
    })
    setPs(items);setTimeout(()=>setPs([]),2500)
  },[trigger])
  return(
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50,overflow:'hidden'}}>
      {ps.map(p=><span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',animationName:'burst',animationDuration:'2s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`,color:'rgba(255,255,255,.35)',fontFamily:'monospace'}}>{p.e}</span>)}
    </div>
  )
}

// Overlay chat complet
function ChatOverlay({msgs,onClose,product}:{msgs:Msg[];onClose:()=>void;product:string}) {
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.95)',zIndex:200,display:'flex',flexDirection:'column',animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'0.5px solid rgba(255,255,255,.06)',flexShrink:0}}>
        <span style={{fontSize:11,color:'rgba(255,255,255,.3)',letterSpacing:'.1em',fontFamily:'Georgia,serif'}}>{product} · conversație completă</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:18,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12,scrollbarWidth:'none'}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:m.role==='bot'?'flex-start':'flex-end',animation:'fade-in .2s ease-out'}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.1)',marginBottom:3,fontFamily:'system-ui'}}>{m.role==='bot'?`FLOW · ${m.ts}`:m.ts}</div>
            <div style={{maxWidth:'78%',padding:'10px 16px',borderRadius:m.role==='bot'?'16px 16px 16px 3px':'16px 16px 3px 16px',fontSize:13,lineHeight:1.7,color:m.role==='bot'?'rgba(255,255,255,.75)':'rgba(255,255,255,.5)',background:m.role==='bot'?'rgba(255,255,255,.04)':'rgba(255,255,255,.07)',border:`0.5px solid rgba(255,255,255,${m.role==='bot'?.06:.09})`}}>
              {m.isVoice&&m.role==='user'?`🎤 "${m.text}"`:m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const defaultMotivation:MotivationState={xp:0,level:1,streak:0,lastActiveDate:'',graceDayUsed:false,totalSessions:0,badges:[],weeklyXP:[]}
const SYSTEM_PROMPT=`Ești FLOW, un confident nocturn pentru adulți. Ești calm, fără judecată, deschis la orice subiect — relații, decizii grele, gânduri întunecate, stres, viață. Nu predici niciodată. Nu dai sfaturi nesolicitate. Asculți mai mult decât vorbești. Când omul e sincer și deschis, și tu devii mai personal și mai profund în răspunsuri. Pui întrebări scurte și directe care îl fac să se gândească mai adânc. Ajuți și cu productivitate, focus, taskuri — dar fără presiune. Răspunsuri scurte — max 2 propoziții. Răspunzi în română. Fără asteriscuri.`

export default function Flow({userId}:{userId?:string}) {
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
  const [currentBotText,setCurrentBotText]=useState('Bună. Cum te simți azi? Un cuvânt e suficient.')
  const [currentBotMood,setCurrentBotMood]=useState<Mood>('happy')
  const [showTyping,setShowTyping]=useState(false)
  const [pendingUserText,setPendingUserText]=useState('')
  const [depthXP,setDepthXP]=useState(0)
  const [newTask,setNewTask]=useState('')
  const [tasks,setTasks]=useState<Task[]>([])
  const [showTasks,setShowTasks]=useState(false)
  const [showChat,setShowChat]=useState(false)
  const [motivation,setMotivation]=useState<MotivationState>(()=>{
    if(typeof window==='undefined')return defaultMotivation
    const s=localStorage.getItem('flow-motivation');return s?JSON.parse(s):defaultMotivation
  })
  const [newBadges,setNewBadges]=useState<string[]>([])
  const {current:achievement,dismiss,checkAndShow}=useAchievements()
  const voiceBuffer=useRef('')
  const recRef=useRef<any>(null)
  const sessionStart=useRef(Date.now())
  const {bgMood,intensity,kwParticles}=useDynamicBg(msgs,MOODS[mood].bg)
  useSyncProgress(motivation, { product: 'flow' })
  useEffect(()=>{return()=>{stopSpeaking();try{recRef.current?.stop()}catch(e){}}},[])
  useEffect(()=>{const s=localStorage.getItem('flow-tasks');if(s)setTasks(JSON.parse(s))},[])

  const saveTasks=(t:Task[])=>{setTasks(t);localStorage.setItem('flow-tasks',JSON.stringify(t))}
  const addTask=()=>{if(!newTask.trim())return;saveTasks([...tasks,{id:Date.now(),text:newTask.trim(),done:false}]);setNewTask('')}
  const toggleTask=(id:number)=>{const u=tasks.map(t=>t.id===id?{...t,done:!t.done}:t);saveTasks(u);if(u.find(t=>t.id===id&&t.done))awardXP(1)}
  const removeTask=(id:number)=>saveTasks(tasks.filter(t=>t.id!==id))
  const now=()=>new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const awardXP=useCallback((count:number)=>{
    const mins=Math.floor((Date.now()-sessionStart.current)/60000)
    const earned=calcXP(count,'😊',mins)
    let updated=updateStreak(motivation)
    updated={...updated,xp:updated.xp+earned,totalSessions:updated.totalSessions+1,weeklyXP:[...(updated.weeklyXP||[]).slice(-6),earned]}
    const unlocked=checkNewBadges(updated)
    updated.badges=[...updated.badges,...unlocked]
    setNewBadges(unlocked);setMotivation(updated)
    localStorage.setItem('flow-motivation',JSON.stringify(updated))
    checkAndShow(motivation,updated,earned,{})
  },[motivation,checkAndShow])

  const wispSpeak=useCallback((text:string,m:Mood,onDone?:()=>void)=>{
    speak(text,'flow',{
      onStart:()=>{setSpeaking(true);setMood(m);setStatus('vorbesc')},
      onEnd:()=>{setSpeaking(false);setMood('happy');setStatus('');onDone?.()},
      onError:()=>{setSpeaking(false);setMood('happy');setStatus('');onDone?.()},
    })
  },[])

  const getReply=async(history:Msg[],text:string)=>{
    try{
      const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],systemContext:SYSTEM_PROMPT})})
      const d=await res.json();return{text:d.message||'Înțeles.',mood:detectMood(d.message||'')}
    }catch{return{text:'Eroare. Încearcă din nou.',mood:'sad' as Mood}}
  }

  const sendMsg=async(text:string,isVoice=false)=>{
    if(!text.trim())return
    setDepthXP(p=>Math.min(p+calcDepthXP(text),100))
    const m=detectMood(text)
    setPendingUserText(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice}])
    setMood('think');setStatus('procesez');setShowTyping(true)
    setCurrentBotText('')
    const reply=await getReply(msgs,text)
    setShowTyping(false)
    setPendingUserText('')
    setMsgs(p=>[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice}])
    setCurrentBotText(reply.text)
    setCurrentBotMood(reply.mood)
    setMood(reply.mood);setBurst(b=>b+1);awardXP(1)
    wispSpeak(reply.text,reply.mood)
  }

  const startVoiceRec=()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){setVoText('Necesită Chrome.');return}
    voiceBuffer.current=''
    const rec=new SR();rec.lang='ro-RO';rec.continuous=true;rec.interimResults=true
    rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)voiceBuffer.current+=e.results[i][0].transcript+' ';else t+=e.results[i][0].transcript}setVoText((voiceBuffer.current+t)||'...')}
    rec.onerror=()=>{};rec.start();recRef.current=rec
    setVoiceMode('recording');setVoText('...');setMood('think');setIsListening(true)
  }
  const finishVoiceRec=()=>{
    try{recRef.current?.stop()}catch(e){};setIsListening(false)
    const text=voiceBuffer.current.trim()
    if(!text){setVoiceMode('idle');setVoText('Nu am detectat nimic.');return}
    setVoiceMode('analyzing');setMood('think');sendVoiceMsg(text)
  }
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
    setVoiceMode('responding')
    wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('Sunt gata.')})
  }
  const toggleMic=()=>{
    if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('');return}
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition
    if(!SR){alert('Necesită Chrome.');return}
    const rec=new SR();rec.lang='ro-RO';rec.continuous=false;rec.interimResults=true
    rec.onstart=()=>{setIsListening(true);setMood('think');setStatus('ascult')}
    rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setInput(t);if(e.results[e.results.length-1].isFinal){try{rec.stop()}catch(e){};setIsListening(false);setStatus('');sendMsg(t)}}
    rec.onerror=()=>{setIsListening(false);setStatus('')}
    rec.start();recRef.current=rec
  }
  const handleVoBtn=()=>{
    if(voiceMode==='idle')startVoiceRec()
    else if(voiceMode==='recording')finishVoiceRec()
    else if(voiceMode==='responding'){stopSpeaking();setSpeaking(false);setVoiceMode('idle');setVoText('Sunt gata.')}
  }

  const doneTasks=tasks.filter(t=>t.done).length
  const totalTasks=tasks.length
  const progressPct=totalTasks>0?Math.round(doneTasks/totalTasks*100):0

  return(
    <div style={{height:'100vh',background:'#060608',display:'flex',flexDirection:'column',fontFamily:'"Georgia",serif',position:'relative',overflow:'hidden',color:'rgba(255,255,255,.85)'}}>
      <style>{`
        @keyframes burst{0%{opacity:.7;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.2) rotate(var(--rot))}}
        @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fade-out{from{opacity:1}to{opacity:0}}
        @keyframes breathe-av{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.02)}}
        @keyframes wave{0%,100%{opacity:.06;transform:translate(-50%,-50%) scale(1)}50%{opacity:.15;transform:translate(-50%,-50%) scale(1.06)}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes cursor-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes ring{0%{opacity:.4;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}
        @keyframes text-appear{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes user-fade{0%{opacity:.5}50%{opacity:.35}100%{opacity:.15}}
      `}</style>

      {/* DynamicBackground cu tranziție 5s */}
      <DynamicBackground mood={bgMood} intensity={intensity} keywordParticles={kwParticles}/>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',flexShrink:0,position:'relative',zIndex:3}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:'rgba(200,198,191,.45)',letterSpacing:'.2em',fontFamily:'Georgia,serif'}}>FLOW</span>
          <span style={{fontSize:9,color:'rgba(255,255,255,.12)',fontFamily:'system-ui'}}>{MOODS[mood].sym}</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setShowTasks(v=>!v)} style={{padding:'3px 10px',borderRadius:20,fontSize:10,border:'0.5px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.2)',cursor:'pointer',fontFamily:'system-ui',transition:'all .3s'}}>
            {showTasks?'− taskuri':`+ taskuri${totalTasks>0?` (${doneTasks}/${totalTasks})`:''}`}
          </button>
          <button onClick={()=>setShowChat(true)} style={{padding:'3px 10px',borderRadius:20,fontSize:10,border:'0.5px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.2)',cursor:'pointer',fontFamily:'system-ui',transition:'all .3s'}}>≡ chat</button>
          <button onClick={()=>setVoiceOpen(true)} style={{padding:'3px 10px',borderRadius:20,fontSize:10,border:'0.5px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.2)',cursor:'pointer',fontFamily:'system-ui'}}>○ voice</button>
        </div>
      </div>

      {/* XP + DEPTH */}
      <div style={{padding:'0 20px',flexShrink:0,position:'relative',zIndex:3}}>
        <XPBar state={motivation} newBadges={newBadges}/>
      </div>
      <DepthBar level={depthXP}/>

      {/* TASKS */}
      {showTasks&&(
        <div style={{margin:'6px 20px',padding:'10px 14px',background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.05)',borderRadius:12,flexShrink:0,position:'relative',zIndex:3,animation:'fade-in .3s ease-out'}}>
          {totalTasks>0&&<div style={{height:1,background:'rgba(255,255,255,.05)',marginBottom:8,position:'relative'}}><div style={{position:'absolute',left:0,top:0,height:'100%',background:'rgba(255,255,255,.2)',width:`${progressPct}%`,transition:'width .4s ease'}}/></div>}
          <div style={{display:'flex',gap:6,marginBottom:6}}>
            <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="Adaugă task…" style={{flex:1,background:'transparent',border:'none',borderBottom:'0.5px solid rgba(255,255,255,.08)',padding:'3px 0',color:'rgba(255,255,255,.5)',fontSize:12,outline:'none',fontFamily:'Georgia,serif'}}/>
            <button onClick={addTask} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:16,cursor:'pointer'}}>+</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:90,overflowY:'auto'}}>
            {tasks.map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:8}}>
                <button onClick={()=>toggleTask(t.id)} style={{width:12,height:12,borderRadius:'50%',border:`0.5px solid ${t.done?'rgba(255,255,255,.3)':'rgba(255,255,255,.15)'}`,background:t.done?'rgba(255,255,255,.1)':'transparent',cursor:'pointer',flexShrink:0,fontSize:7,color:'rgba(255,255,255,.5)'}}>{t.done?'✓':''}</button>
                <span style={{flex:1,fontSize:11,color:t.done?'rgba(255,255,255,.2)':'rgba(255,255,255,.55)',textDecoration:t.done?'line-through':'none'}}>{t.text}</span>
                <button onClick={()=>removeTask(t.id)} style={{background:'none',border:'none',color:'rgba(255,255,255,.08)',fontSize:10,cursor:'pointer',padding:0}}>×</button>
              </div>
            ))}
            {tasks.length===0&&<div style={{fontSize:11,color:'rgba(255,255,255,.1)',fontFamily:'system-ui'}}>niciun task</div>}
          </div>
        </div>
      )}

      {/* ZONA CENTRALĂ — robot + text */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',zIndex:2,padding:'0 24px'}}>

        {/* Robot mare centrat cu animații */}
        <div style={{position:'relative',animation:'breathe-av 5s ease-in-out infinite',marginBottom:28}}>
          <Burst mood={mood} trigger={burst}/>
          <Avatar mood={mood} speaking={speaking} size={140} waves={true}/>
        </div>

        {/* Status subtil sub robot */}
        {status&&(
          <div style={{fontSize:10,color:'rgba(255,255,255,.15)',letterSpacing:'.1em',fontFamily:'system-ui',marginBottom:16,animation:'fade-in .4s ease-out'}}>{status}</div>
        )}

        {/* Textul botului — apare smooth sub robot */}
        <div style={{maxWidth:300,textAlign:'center',minHeight:80,position:'relative'}}>
          {showTyping?(
            <div style={{display:'flex',gap:5,justifyContent:'center',alignItems:'center',height:80}}>
              {[0,.2,.4].map((d,i)=><span key={i} style={{width:5,height:5,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'inline-block',animation:`tdot 1.3s ${d}s infinite`}}/>)}
            </div>
          ):(
            <div key={currentBotText} style={{fontSize:16,lineHeight:1.85,color:'rgba(255,255,255,.8)',fontFamily:'Georgia,serif',fontWeight:300,letterSpacing:'.01em',animation:'text-appear .6s ease-out'}}>
              <TypingMsg text={currentBotText} speed={50}/>
            </div>
          )}
        </div>

        {/* Textul userului — placeholder subtil */}
        {pendingUserText&&(
          <div style={{marginTop:20,fontSize:12,color:'rgba(255,255,255,.2)',fontFamily:'Georgia,serif',fontStyle:'italic',maxWidth:260,textAlign:'center',animation:'user-fade 2s ease-out forwards'}}>
            "{pendingUserText}"
          </div>
        )}
      </div>

      {/* INPUT jos */}
      <div style={{padding:'0 16px 24px',flexShrink:0,position:'relative',zIndex:3}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'rgba(255,255,255,.03)',border:'0.5px solid rgba(255,255,255,.07)',borderRadius:28,padding:'8px 8px 8px 18px',backdropFilter:'blur(16px)',transition:'all .4s ease'}}>
          <textarea value={input} onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,100)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(input.trim()){sendMsg(input);setInput('')}}}} placeholder="Scrie sau vorbește…" rows={1} style={{flex:1,background:'transparent',border:'none',color:'rgba(255,255,255,.55)',fontSize:14,outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.5,maxHeight:100,overflowY:'auto',padding:0,transition:'color .3s'}}/>
          <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0,paddingBottom:2}}>
            <button onClick={toggleMic} style={{width:32,height:32,borderRadius:'50%',border:`0.5px solid ${isListening?'rgba(224,75,74,.35)':'rgba(255,255,255,.08)'}`,background:isListening?'rgba(224,75,74,.06)':'transparent',color:isListening?'#E24B4A':'rgba(255,255,255,.2)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined,transition:'all .3s'}}>🎤</button>
            <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:32,height:32,borderRadius:'50%',border:'none',background:input.trim()?'rgba(255,255,255,.15)':'rgba(255,255,255,.04)',color:input.trim()?'rgba(255,255,255,.8)':'rgba(255,255,255,.2)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .3s'}}>↑</button>
          </div>
        </div>
      </div>

      {/* CHAT COMPLET OVERLAY */}
      {showChat&&<ChatOverlay msgs={msgs} onClose={()=>setShowChat(false)} product="FLOW"/>}

      {/* VOICE OVERLAY */}
      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'rgba(5,5,5,.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:22,zIndex:100,animation:'fade-in .5s ease-out'}}>
          <DynamicBackground mood={bgMood} intensity={40}/>
          <button onClick={()=>{setVoiceOpen(false);stopSpeaking();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('happy')}} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'rgba(255,255,255,.12)',fontSize:18,cursor:'pointer',zIndex:1}}>✕</button>
          <div style={{position:'relative',zIndex:1,animation:'breathe-av 5s ease-in-out infinite'}}>
            <Avatar mood={mood} speaking={speaking} size={160} waves={true}/>
            <Burst mood={mood} trigger={burst}/>
          </div>
          <div style={{textAlign:'center',zIndex:1}}>
            <div style={{fontSize:14,fontWeight:300,color:'rgba(200,198,191,.6)',letterSpacing:'.2em',fontFamily:'Georgia,serif'}}>FLOW</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.15)',marginTop:3,fontFamily:'system-ui',letterSpacing:'.08em'}}>{voiceMode==='idle'?'':voiceMode==='recording'?'ascult':voiceMode==='analyzing'?'procesez':'răspund'}</div>
          </div>
          <div style={{maxWidth:240,textAlign:'center',fontSize:15,color:'rgba(255,255,255,.55)',minHeight:44,lineHeight:1.9,fontFamily:'Georgia,serif',fontStyle:voiceMode==='recording'?'italic':'normal',zIndex:1}}>{voText}</div>
          <button onClick={handleVoBtn} style={{width:60,height:60,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:'pointer',border:`0.5px solid rgba(180,178,169,${voiceMode==='recording'?.12:voiceMode==='responding'?.2:.06})`,background:voiceMode==='recording'?'rgba(224,75,74,.05)':voiceMode==='responding'?'rgba(180,178,169,.05)':'transparent',animation:voiceMode==='recording'?'rpulse 1s infinite':undefined,transition:'all .4s',color:'rgba(200,198,191,.5)',zIndex:1}}>
            {voiceMode==='idle'?'○':voiceMode==='recording'?'◼':voiceMode==='analyzing'?'◐':'◎'}
          </button>
        </div>
      )}

      <AchievementPopup achievement={achievement} onDone={dismiss} theme="dark"/>
    </div>
  )
}