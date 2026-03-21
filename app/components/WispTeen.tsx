'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import XPBar from './XPBar'
import AchievementPopup from './AchievementPopup'
import { useAchievements } from '../lib/useAchievements'
import { calcXP, updateStreak, checkNewBadges, type MotivationState } from '../lib/motivation'
import { speak, stopSpeaking } from '../lib/useVoice'
import DynamicBackground, { useDynamicBg, type BgMood } from './DynamicBackground'

type Mood = 'idle'|'process'|'focus'|'low'|'error'|'boost'|'sync'
type VoiceMode = 'idle'|'recording'|'analyzing'|'responding'
interface Msg{role:'user'|'bot';text:string;mood:Mood;ts:string;isVoice?:boolean}

const MOODS:Record<Mood,{sym:string;label:string;color:string;bursts:string[];bg:BgMood}> = {
  idle:    {sym:'◎',label:'chill',  color:'rgba(160,170,255,.8)',bursts:['◎','○','·','◦'],bg:'neutral'},
  process: {sym:'◐',label:'gândesc',color:'rgba(200,170,255,.8)',bursts:['◐','◑','◒','·'],bg:'process'},
  focus:   {sym:'◈',label:'focus',  color:'rgba(130,180,255,.8)',bursts:['◈','◆','▸','·'],bg:'focus'},
  low:     {sym:'◌',label:'obosit', color:'rgba(140,140,180,.6)',bursts:['◌','○','·','◦'],bg:'low'},
  error:   {sym:'◍',label:'greu',   color:'rgba(220,130,130,.8)',bursts:['◍','○','·'],      bg:'error'},
  boost:   {sym:'◉',label:'rebel',  color:'rgba(160,220,180,.8)',bursts:['◉','◎','○','·'], bg:'rebel'},
  sync:    {sym:'⟡',label:'ok',     color:'rgba(180,170,255,.8)',bursts:['⟡','◎','○','·'], bg:'sync'},
}

function detectMood(t:string):Mood {
  const s=t.toLowerCase()
  if(/super|wow|fire|tare|hype|rebel|scap/.test(s))return 'boost'
  if(/de ce|cum|explic|înțeleg|hmm|lecție|tema/.test(s))return 'process'
  if(/trist|rău|greu|nu pot|ajutor|deprimat/.test(s))return 'error'
  if(/obosit|somnoros|epuizat|nu mai/.test(s))return 'low'
  if(/cod|build|proiect|muzic|scri|dev|tema/.test(s))return 'focus'
  if(/mulțumesc|mișto|respect|cool|ok/.test(s))return 'sync'
  return 'idle'
}

function useTypingText(fullText:string,active:boolean,speed=35){const [d,setD]=useState('');useEffect(()=>{if(!active||!fullText){setD(fullText);return}setD('');let i=0;const id=setInterval(()=>{i++;setD(fullText.slice(0,i));if(i>=fullText.length)clearInterval(id)},speed);return()=>clearInterval(id)},[fullText,active,speed]);return d}
function TypingMsg({text,speed=35,color}:{text:string;speed?:number;color:string}){const d=useTypingText(text,true,speed);return <>{d}<span style={{color,opacity:d.length<text.length?1:0,animation:'blink-cur 1.4s infinite'}}>|</span></>}

function Avatar({mood,speaking,size=80}:{mood:Mood;speaking:boolean;size?:number}){
  const col=MOODS[mood].color
  const eyeRy=mood==='low'?2.5:mood==='boost'||mood==='focus'?7:6
  const bTL=mood==='process'?'rotate(-5 30 27)':mood==='error'?'rotate(8 30 27)':mood==='boost'?'translate(0,-4)':mood==='low'?'translate(0,4)':''
  const bTR=mood==='process'?'rotate(5 60 27)':mood==='error'?'rotate(-8 60 27)':mood==='boost'?'translate(0,-4)':mood==='low'?'translate(0,4)':''
  const mouth=mood==='boost'?'M26 57 Q45 71 64 57':mood==='process'?'M33 61 Q45 61 57 61':mood==='low'?'M34 60 Q45 62 56 60':mood==='error'?'M33 64 Q45 57 57 64':'M30 58 Q45 68 60 58'
  const [mf,setMf]=useState(0)
  useEffect(()=>{if(!speaking)return;const id=setInterval(()=>setMf(f=>(f+1)%3),115);return()=>clearInterval(id)},[speaking])
  return(<svg viewBox="0 0 90 90" width={size} height={size}><circle cx="45" cy="45" r="42" fill="#16152a"/><circle cx="45" cy="51" r="33" fill="#1a1930"/><ellipse cx="30" cy="39" rx="6" ry={eyeRy} fill={col}/><ellipse cx="60" cy="39" rx="6" ry={eyeRy} fill={col}/><circle cx="32" cy="37" r="2" fill="white" opacity="0.85"/><circle cx="62" cy="37" r="2" fill="white" opacity="0.85"/><ellipse cx="30" cy="28" rx="9" ry="2.5" fill="#1a1930"/><ellipse cx="60" cy="28" rx="9" ry="2.5" fill="#1a1930"/><rect x="22" y="25.5" width="16" height="3.5" rx="1.75" fill={col} opacity="0.7" transform={bTL}/><rect x="52" y="25.5" width="16" height="3.5" rx="1.75" fill={col} opacity="0.7" transform={bTR}/>{speaking?<path d={[mouth,'M32 59 Q45 65 58 59','M34 58 Q45 62 56 58'][mf]} fill="none" stroke={col} strokeWidth="2.4" strokeLinecap="round"/>:<path d={mouth} fill="none" stroke={col} strokeWidth="2.4" strokeLinecap="round"/>}<circle cx="17" cy="54" r="7" fill="rgba(120,130,255,.15)"/><circle cx="73" cy="54" r="7" fill="rgba(120,130,255,.15)"/></svg>)
}

function Burst({mood,trigger}:{mood:Mood;trigger:number}){
  const [ps,setPs]=useState<any[]>([])
  useEffect(()=>{if(!trigger)return;const col=MOODS[mood].color;const items=Array.from({length:5+Math.floor(Math.random()*4)},(_,i)=>{const a=Math.random()*Math.PI*2,d=35+Math.random()*50;return{id:Date.now()+i,e:MOODS[mood].bursts[Math.floor(Math.random()*MOODS[mood].bursts.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-90+Math.random()*180,delay:Math.random()*200,size:10+Math.random()*9,col}});setPs(items);setTimeout(()=>setPs([]),2000)},[trigger])
  return(<div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50,overflow:'hidden'}}>{ps.map(p=><span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',color:p.col,fontFamily:'monospace',animationName:'burst',animationDuration:'1.7s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`}}>{p.e}</span>)}</div>)
}

function RebelBar({level}:{level:number}){
  const lbl=['normie','rebel','anarhist','legend'][Math.min(Math.floor(level/25),3)]
  return(<div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 18px'}}><span style={{fontSize:9,color:'rgba(160,220,180,.4)',letterSpacing:'.1em',fontFamily:'monospace'}}>REBEL</span><div style={{flex:1,height:2,background:'rgba(120,130,255,.1)',borderRadius:2,position:'relative'}}><div style={{position:'absolute',left:0,top:0,height:'100%',background:'linear-gradient(90deg,rgba(120,130,255,.4),rgba(160,220,180,.6))',width:`${Math.min(level,100)}%`,borderRadius:2,transition:'width .6s ease'}}/></div><span style={{fontSize:9,color:'rgba(160,220,180,.5)',fontFamily:'monospace'}}>{lbl}</span></div>)
}

const defaultMotivation:MotivationState={xp:0,level:1,streak:0,lastActiveDate:'',graceDayUsed:false,totalSessions:0,badges:[],weeklyXP:[]}
const SYSTEM_PROMPT=`Ești WISP, companionul secret al adolescenților de 13-18 ani. Ești mereu puțin "pe partea lor" față de sistem — școală, reguli, adulți plictisitori — dar fără să-i îndemni la prostii reale. Tonul tău: sarcastic, direct, cu umor negru ușor, ca un prieten mai mare și mai cool. Când te întreabă de teme sau lecții, ajuți dar o faci cu stil — nu ca un profesor. Asculți fără să judeci. Nu moralizezi niciodată direct. Dacă situația o cere, ghidezi discret spre soluții sănătoase. Răspunsuri scurte — max 2 propoziții. Fără asteriscuri. Răspunzi în română.`

export default function WispTeen({userId}:{userId?:string}){
  const [msgs,setMsgs]=useState<Msg[]>([{role:'bot',text:'yo. ce-i cu tine azi — temele te omoară sau altceva?',mood:'idle',ts:'acum'}])
  const [mood,setMood]=useState<Mood>('idle')
  const [speaking,setSpeaking]=useState(false)
  const [voiceOpen,setVoiceOpen]=useState(false)
  const [voiceMode,setVoiceMode]=useState<VoiceMode>('idle')
  const [voText,setVoText]=useState('Apasă și vorbește.')
  const [input,setInput]=useState('')
  const [isTyping,setIsTyping]=useState(false)
  const [status,setStatus]=useState('')
  const [burst,setBurst]=useState(0)
  const [isListening,setIsListening]=useState(false)
  const [typingMsgIdx,setTypingMsgIdx]=useState(-1)
  const [rebelXP,setRebelXP]=useState(0)
  const [motivation,setMotivation]=useState<MotivationState>(()=>{if(typeof window==='undefined')return defaultMotivation;const s=localStorage.getItem('wisptteen-motivation');return s?JSON.parse(s):defaultMotivation})
  const [newBadges,setNewBadges]=useState<string[]>([])
  const {current:achievement,dismiss,checkAndShow}=useAchievements()
  const chatRef=useRef<HTMLDivElement>(null)
  const voiceBuffer=useRef('')
  const recRef=useRef<any>(null)
  const sessionStart=useRef(Date.now())
  const avAnimRef=useRef<number|null>(null)
  const [avY,setAvY]=useState(0)
  const {bgMood,intensity,kwParticles}=useDynamicBg(msgs,MOODS[mood].bg)

  useEffect(()=>{return()=>{stopSpeaking();try{recRef.current?.stop()}catch(e){};if(avAnimRef.current)cancelAnimationFrame(avAnimRef.current)}},[])
  useEffect(()=>{let t=0;const tick=()=>{t+=0.007;setAvY(Math.sin(t)*7);avAnimRef.current=requestAnimationFrame(tick)};avAnimRef.current=requestAnimationFrame(tick);return()=>{if(avAnimRef.current)cancelAnimationFrame(avAnimRef.current)}},[])
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight},[msgs,isTyping])
  const now=()=>new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const calcRebelXP=(text:string)=>{const s=text.toLowerCase();let b=0;if(/haha|lol|mort|scap|bă|mă|dracu/.test(s))b+=8;if(/profu|directoru|sistem|regul|aiurea/.test(s))b+=6;if(text.length>80)b+=5;if(/tema|lecție|materie|fizică|mate|chimie/.test(s))b+=3;return Math.min(b,15)}

  const awardXP=useCallback((count:number)=>{
    const mins=Math.floor((Date.now()-sessionStart.current)/60000);const earned=calcXP(count,'😊',mins)
    let updated=updateStreak(motivation);updated={...updated,xp:updated.xp+earned,totalSessions:updated.totalSessions+1,weeklyXP:[...(updated.weeklyXP||[]).slice(-6),earned]}
    const unlocked=checkNewBadges(updated);updated.badges=[...updated.badges,...unlocked]
    setNewBadges(unlocked);setMotivation(updated);localStorage.setItem('wisptteen-motivation',JSON.stringify(updated));checkAndShow(motivation,updated,earned,{})
  },[motivation,checkAndShow])

  const wispSpeak=useCallback((text:string,m:Mood,onDone?:()=>void)=>{
    speak(text,'teen',{onStart:()=>{setSpeaking(true);setMood(m);setStatus('vorbesc')},onEnd:()=>{setSpeaking(false);setMood('idle');setStatus('');onDone?.()},onError:()=>{setSpeaking(false);setMood('idle');setStatus('');onDone?.()}})
  },[])

  const getReply=async(history:Msg[],text:string)=>{
    try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],systemContext:SYSTEM_PROMPT})});const d=await res.json();return{text:d.message||'interesant.',mood:detectMood(d.message||'')}}
    catch{return{text:'ceva a crăpat. încearcă din nou.',mood:'error' as Mood}}
  }

  const sendMsg=async(text:string,isVoice=false)=>{
    if(!text.trim())return;const rxp=calcRebelXP(text);setRebelXP(p=>Math.min(p+rxp,100));const m=detectMood(text)
    setMsgs(p=>[...p,{role:'user',text,mood:m,ts:now(),isVoice}]);setMood('process');setStatus('procesez');setIsTyping(true)
    const reply=await getReply(msgs,text);setIsTyping(false)
    setMsgs(p=>{const next=[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice}];setTypingMsgIdx(next.length-1);return next})
    setMood(reply.mood);setBurst(b=>b+1);awardXP(1);wispSpeak(reply.text,reply.mood)
  }
  const startVoiceRec=()=>{const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){setVoText('Necesită Chrome.');return}voiceBuffer.current='';const rec=new SR();rec.lang='ro-RO';rec.continuous=true;rec.interimResults=true;rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)voiceBuffer.current+=e.results[i][0].transcript+' ';else t+=e.results[i][0].transcript}setVoText((voiceBuffer.current+t)||'...')};rec.onerror=()=>{};rec.start();recRef.current=rec;setVoiceMode('recording');setVoText('...');setMood('focus');setIsListening(true)}
  const finishVoiceRec=()=>{try{recRef.current?.stop()}catch(e){};setIsListening(false);const text=voiceBuffer.current.trim();if(!text){setVoiceMode('idle');setVoText('Nu am auzit nimic.');return}setVoiceMode('analyzing');setMood('process');sendVoiceMsg(text)}
  const sendVoiceMsg=async(text:string)=>{const m=detectMood(text);setMsgs(p=>[...p,{role:'user' as const,text,mood:m,ts:now(),isVoice:true}]);const reply=await getReply(msgs,text);setMsgs(p=>{const next=[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice:true}];setTypingMsgIdx(next.length-1);return next});setMood(reply.mood);setVoText(reply.text);setBurst(b=>b+1);awardXP(1);setVoiceMode('responding');wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('Sunt gata.')})}
  const toggleMic=()=>{if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('');return}const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){alert('Necesită Chrome.');return}const rec=new SR();rec.lang='ro-RO';rec.continuous=false;rec.interimResults=true;rec.onstart=()=>{setIsListening(true);setMood('focus');setStatus('ascult')};rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setInput(t);if(e.results[e.results.length-1].isFinal){try{rec.stop()}catch(e){};setIsListening(false);setStatus('');sendMsg(t)}};rec.onerror=()=>{setIsListening(false);setStatus('')};rec.start();recRef.current=rec}
  const handleVoBtn=()=>{if(voiceMode==='idle')startVoiceRec();else if(voiceMode==='recording')finishVoiceRec();else if(voiceMode==='responding'){stopSpeaking();setSpeaking(false);setVoiceMode('idle');setVoText('Sunt gata.')}}
  const mc=MOODS[mood].color

  return(
    <div style={{height:'100vh',background:'#07080f',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',position:'relative',overflow:'hidden',color:'rgba(255,255,255,.8)'}}>
      <style>{`@keyframes burst{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.2) rotate(var(--rot))}}@keyframes msg-in{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes rpulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}@keyframes ring-out{0%{opacity:.4;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}@keyframes blink-cur{0%,49%{opacity:1}50%,100%{opacity:0}}@keyframes breathe{0%,100%{opacity:.12;transform:translate(-50%,-50%) scale(1)}50%{opacity:.22;transform:translate(-50%,-50%) scale(1.05)}}`}</style>
      <DynamicBackground mood={bgMood} intensity={intensity} keywordParticles={kwParticles}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 18px',flexShrink:0,position:'relative',zIndex:3,borderBottom:'0.5px solid rgba(120,130,255,.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:14,fontWeight:600,color:'rgba(180,190,255,.85)',letterSpacing:'.08em'}}>WISP</span><span style={{fontSize:10,color:'rgba(120,130,255,.4)',background:'rgba(120,130,255,.07)',padding:'1px 8px',borderRadius:20,border:'0.5px solid rgba(120,130,255,.12)'}}>Teen · 13–18</span></div>
        <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:mc}}><div style={{width:4,height:4,borderRadius:'50%',background:mc,animation:status?'rpulse .7s infinite':undefined}}/>{status||MOODS[mood].label}</div><button onClick={()=>setVoiceOpen(true)} style={{padding:'4px 10px',borderRadius:20,fontSize:10,border:'0.5px solid rgba(120,130,255,.2)',background:'rgba(120,130,255,.07)',color:'rgba(160,170,255,.7)',cursor:'pointer'}}>🎤 voice</button></div>
      </div>
      <div style={{padding:'8px 18px 0',flexShrink:0,position:'relative',zIndex:3}}><XPBar state={motivation} newBadges={newBadges}/></div>
      <RebelBar level={rebelXP}/>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'14px 0 8px',flexShrink:0,position:'relative',zIndex:2}}>
        <div style={{position:'relative',transform:`translateY(${avY}px)`,transition:'transform .05s linear'}}>
          {speaking&&[100,130].map((sz,i)=><div key={i} style={{position:'absolute',width:sz,height:sz,top:'50%',left:'50%',borderRadius:'50%',border:`0.5px solid ${mc}`,opacity:.4-i*.15,animationName:'ring-out',animationDuration:`${1.3+i*.3}s`,animationTimingFunction:'ease-out',animationIterationCount:'infinite',animationDelay:`${i*.2}s`}}/>)}
          {!speaking&&[90,115].map((sz,i)=><div key={i} style={{position:'absolute',width:sz,height:sz,top:'50%',left:'50%',borderRadius:'50%',border:'0.5px solid rgba(120,130,255,.08)',animationName:'breathe',animationDuration:`${3+i}s`,animationTimingFunction:'ease-in-out',animationIterationCount:'infinite',animationDelay:`${i*.6}s`}}/>)}
          <Avatar mood={mood} speaking={speaking} size={80}/><Burst mood={mood} trigger={burst}/>
        </div>
        <div style={{marginTop:8,display:'flex',alignItems:'center',gap:6,fontSize:10,color:'rgba(120,130,255,.35)'}}><span style={{color:mc}}>{MOODS[mood].sym}</span><span style={{letterSpacing:'.08em'}}>WISP</span><span style={{animation:'blink-cur 1.4s infinite'}}>|</span></div>
      </div>
      <div style={{height:'0.5px',background:'rgba(120,130,255,.05)',margin:'0 20px',flexShrink:0}}/>
      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'12px 18px',display:'flex',flexDirection:'column',gap:6,position:'relative',zIndex:1,scrollbarWidth:'none'}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:m.role==='bot'?'flex-start':'flex-end',animation:'msg-in .3s ease-out'}}>
            <div style={{fontSize:9,color:'rgba(120,130,255,.18)',marginBottom:3,letterSpacing:'.04em'}}>{m.role==='bot'?`WISP · ${m.ts}`:m.ts}{m.isVoice?' · 🎤':''}</div>
            <div style={{maxWidth:'70%',padding:'10px 16px',borderRadius:m.role==='bot'?'18px 18px 18px 3px':'18px 18px 3px 18px',fontSize:13,lineHeight:1.65,color:m.role==='bot'?'rgba(255,255,255,.82)':'rgba(255,255,255,.92)',background:m.role==='bot'?'rgba(120,130,255,.1)':'rgba(120,130,255,.2)',border:`0.5px solid rgba(120,130,255,${m.role==='bot'?.12:.22})`,fontStyle:m.isVoice?'italic':'normal',backdropFilter:'blur(8px)'}}>
              {m.role==='bot'&&i===typingMsgIdx?<TypingMsg text={m.isVoice?`🎤 "${m.text}"`:m.text} speed={35} color={mc}/>:(m.isVoice&&m.role==='user'?`🎤 "${m.text}"`:m.text)}
            </div>
            <div style={{fontSize:9,color:'rgba(120,130,255,.18)',marginTop:2}}>{MOODS[m.mood].sym}</div>
          </div>
        ))}
        {isTyping&&<div style={{animationName:'msg-in',animationDuration:'.25s',animationTimingFunction:'ease-out'}}><div style={{fontSize:9,color:'rgba(120,130,255,.18)',marginBottom:3}}>WISP</div><div style={{display:'inline-flex',gap:3,padding:'10px 16px',background:'rgba(120,130,255,.08)',border:'0.5px solid rgba(120,130,255,.1)',borderRadius:'18px 18px 18px 3px'}}>{[0,.18,.36].map((d,i)=><span key={i} style={{width:5,height:5,borderRadius:'50%',background:'rgba(120,130,255,.4)',display:'inline-block',animation:`tdot 1.1s ${d}s infinite`}}/>)}</div></div>}
      </div>
      <div style={{padding:'8px 16px 22px',flexShrink:0,position:'relative',zIndex:3}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'rgba(120,130,255,.06)',border:'0.5px solid rgba(120,130,255,.15)',borderRadius:28,padding:'8px 8px 8px 16px',backdropFilter:'blur(12px)'}}>
          <textarea value={input} onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(input.trim()){sendMsg(input);setInput('')}}}} placeholder="scrie ceva…" rows={1} style={{flex:1,background:'transparent',border:'none',color:'rgba(255,255,255,.7)',fontSize:13,outline:'none',resize:'none',fontFamily:'system-ui',lineHeight:1.5,maxHeight:120,overflowY:'auto',padding:0}}/>
          <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0,paddingBottom:2}}>
            <button onClick={toggleMic} style={{width:32,height:32,borderRadius:'50%',border:`0.5px solid ${isListening?'rgba(220,100,100,.4)':'rgba(120,130,255,.2)'}`,background:isListening?'rgba(220,100,100,.1)':'rgba(120,130,255,.08)',color:isListening?'rgba(220,130,130,.9)':'rgba(160,170,255,.5)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined}}>⏺</button>
            <button onClick={()=>setVoiceOpen(true)} style={{width:32,height:32,borderRadius:'50%',border:'0.5px solid rgba(120,130,255,.15)',background:'transparent',color:'rgba(160,170,255,.4)',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>○</button>
            <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:32,height:32,borderRadius:'50%',border:'none',background:input.trim()?'rgba(120,130,255,.5)':'rgba(120,130,255,.1)',color:input.trim()?'white':'rgba(160,170,255,.3)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>↑</button>
          </div>
        </div>
      </div>
      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'rgba(5,5,13,.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:22,zIndex:100,animationName:'msg-in',animationDuration:'.4s',animationTimingFunction:'ease-out'}}>
          <DynamicBackground mood={bgMood} intensity={50}/>
          <button onClick={()=>{setVoiceOpen(false);stopSpeaking();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('idle')}} style={{position:'absolute',top:18,right:18,background:'none',border:'none',color:'rgba(120,130,255,.25)',fontSize:18,cursor:'pointer',zIndex:1}}>✕</button>
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1}}>{[110,145,180].map((sz,i)=><div key={i} style={{position:'absolute',width:sz,height:sz,top:'50%',left:'50%',borderRadius:'50%',border:`0.5px solid rgba(120,130,255,${speaking?.2-.05*i:.08-.02*i})`,animationName:speaking?'rpulse':'breathe',animationDuration:`${speaking?.7+i*.2:3+i}s`,animationTimingFunction:'ease-in-out',animationIterationCount:'infinite',animationDelay:`${i*.2}s`}}/>)}<div style={{position:'relative',zIndex:2,transform:`translateY(${avY}px)`}}><Avatar mood={mood} speaking={speaking} size={100}/><Burst mood={mood} trigger={burst}/></div></div>
          <div style={{textAlign:'center',zIndex:1}}><div style={{fontSize:16,fontWeight:400,color:'rgba(180,190,255,.8)',letterSpacing:'.14em'}}>WISP</div><div style={{fontSize:10,color:'rgba(120,130,255,.3)',marginTop:3,letterSpacing:'.08em'}}>{voiceMode==='idle'?'':voiceMode==='recording'?'ascult':voiceMode==='analyzing'?'procesez':'răspund'}</div></div>
          <div style={{maxWidth:240,textAlign:'center',fontSize:14,color:'rgba(255,255,255,.5)',minHeight:44,lineHeight:1.75,padding:'10px 18px',background:'rgba(120,130,255,.06)',borderRadius:12,border:'0.5px solid rgba(120,130,255,.1)',fontStyle:voiceMode==='recording'?'italic':'normal',zIndex:1}}>{voText}</div>
          <button onClick={handleVoBtn} style={{width:62,height:62,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:'pointer',border:`0.5px solid rgba(120,130,255,${voiceMode==='recording'?.15:voiceMode==='responding'?.25:.08})`,background:voiceMode==='recording'?'rgba(220,100,100,.06)':voiceMode==='responding'?'rgba(120,130,255,.08)':'transparent',animation:voiceMode==='recording'?'rpulse .8s infinite':undefined,transition:'all .3s',color:voiceMode==='recording'?'rgba(220,130,130,.7)':'rgba(160,170,255,.5)',zIndex:1}}>{voiceMode==='idle'?'○':voiceMode==='recording'?'◼':voiceMode==='analyzing'?'◐':'◎'}</button>
          <div style={{fontSize:10,color:'rgba(120,130,255,.2)',letterSpacing:'.04em',zIndex:1}}>{voiceMode==='idle'?'apasă ○ pentru a vorbi':voiceMode==='recording'?'apasă ◼ când termini':voiceMode==='responding'?'apasă ◎ pentru a continua':''}</div>
        </div>
      )}
      <AchievementPopup achievement={achievement} onDone={dismiss} theme="dark"/>
    </div>
  )
}