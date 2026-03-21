'use client'
import CognitiveGames from './CognitiveGames'
import { useSyncProgress } from '../lib/useSyncProgress'
import { useState, useRef, useEffect, useCallback } from 'react'
import XPBar from './XPBar'
import AchievementPopup from './AchievementPopup'
import { useAchievements } from '../lib/useAchievements'
import { calcXP, updateStreak, checkNewBadges, type MotivationState } from '../lib/motivation'
import { speak, stopSpeaking } from '../lib/useVoice'
import DynamicBackground, { useDynamicBg, type BgMood } from './DynamicBackground'

type Mood = 'happy'|'excited'|'think'|'sleepy'|'sad'|'laugh'|'love'
type VoiceMode = 'idle'|'recording'|'analyzing'|'responding'
type AlterEgo = 'none'|'stoic'|'optimist'|'realist'|'visat'
type LifeArea = 'cariera'|'relatii'|'sanatate'|'bani'|'creatie'|'spirit'
interface Msg{role:'user'|'bot';text:string;mood:Mood;ts:string;isVoice?:boolean;gameProposal?:GameProposal}
interface Task{id:number;text:string;done:boolean;priority?:'low'|'mid'|'high'}
interface GameProposal{gameId:string;gameName:string;gameIcon:string;gameColor:string;declined?:boolean}
interface MoodEntry{date:string;mood:Mood;score:number;note?:string}
interface HabitEntry{id:string;name:string;icon:string;streak:number;lastDone:string}
interface GratitudeEntry{date:string;text:string}
interface EnergyEntry{date:string;hour:number;level:number}
interface JournalEntry{date:string;prompt:string;text:string}
interface LifeAreaScore{area:LifeArea;score:number}
interface Intention{text:string;date:string;done:boolean}

const MOODS:Record<Mood,{sym:string;label:string;bursts:string[];bg:BgMood;score:number}> = {
  happy:   {sym:'◎',label:'echilibrat',  bursts:['○','◎','·','∘'],bg:'happy',score:7},
  excited: {sym:'◈',label:'energizat',   bursts:['◈','◆','▸','→'],bg:'excited',score:9},
  think:   {sym:'◐',label:'reflectez',   bursts:['◐','◑','◒','·'],bg:'think',score:6},
  sleepy:  {sym:'◌',label:'obosit',      bursts:['◌','○','·','◦'],bg:'sleepy',score:3},
  sad:     {sym:'◍',label:'greu',        bursts:['◍','○','·','◦'],bg:'sad',score:2},
  laugh:   {sym:'◉',label:'bine',        bursts:['◉','○','◎','·'],bg:'laugh',score:8},
  love:    {sym:'♡',label:'recunoscător',bursts:['♡','♢','·','○'],bg:'love',score:8},
}

const ALTER_EGO_DATA:Record<AlterEgo,{icon:string;name:string;color:string;prompt:string}> = {
  none:    {icon:'◎',name:'Flow',color:'rgba(180,178,169,.8)',prompt:''},
  stoic:   {icon:'⬛',name:'Stoic',color:'#B4B2A9',prompt:'Răspunde ca un stoic modern — calm, rațional, focusat pe ce poți controla. Citează ocazional Marcus Aurelius sau Epictetus în mod natural.'},
  optimist:{icon:'◈',name:'Optimist',color:'#FFD700',prompt:'Răspunde ca un optimist autentic — găsești oportunitatea în orice situație, dar nu ești naiv. Energie pozitivă realistă.'},
  realist: {icon:'◐',name:'Realist',color:'#7B8CDE',prompt:'Răspunde ca un realist pragmatic — date, fapte, soluții concrete. Fără iluzii, dar nici fără pesimism.'},
  visat:   {icon:'♡',name:'Visător',color:'#E040FB',prompt:'Răspunde ca un visător creativ — metafore, posibilități infinite, gândire laterală. Fiecare problemă are o soluție neașteptată.'},
}

const JOURNAL_PROMPTS = [
  'Ce moment din azi a meritat să fie trăit?',
  'Ce ai evitat azi și de ce?',
  'Dacă mâine ar fi ultima zi, ce ai face diferit azi?',
  'Care e cel mai mare obstacol din viața ta acum?',
  'Ce înseamnă succes pentru tine în acest moment?',
  'Ce parte din tine vrei să dezvolți cel mai mult?',
  'Cui îi ești recunoscător și nu i-ai spus-o?',
  'Ce teamă te ține pe loc?',
  'Dacă ai putea schimba un lucru din trecut, ce ar fi?',
  'Ce vrei să îți spui tu din viitor?',
]

const BREATHING_PATTERNS = [
  {name:'4-7-8',inhale:4,hold:7,exhale:8,desc:'relaxare profundă'},
  {name:'Box',inhale:4,hold:4,exhale:4,desc:'concentrare și calm'},
  {name:'2-1-4',inhale:2,hold:1,exhale:4,desc:'energie rapidă'},
]

const WISDOM_QUOTES = [
  'Fericirea nu vine din a avea mai mult, ci din a vrea mai puțin.',
  'Cel mai curaj act este să gândești singur cu voce tare.',
  'Nu poți controla vântul, dar poți ajusta pânzele.',
  'Viața nu se măsoară în respirații, ci în momentele care îți taie respirația.',
  'Fă un lucru pe zi care te sperie puțin.',
  'Simplitatea e sofisticare supremă.',
  'Durerea e inevitabilă. Suferința e opțională.',
  'Nu e niciodată prea târziu să devii ce ai fi putut fi.',
  'Mintea e tot. Ce crezi, devii.',
  'Acțiunea e antidotul disperării.',
]

const CHALLENGES = [
  {text:'Nu verifica telefonul în prima oră după ce te trezești',icon:'📵'},
  {text:'Scrie 3 pagini de mână fără să te oprești',icon:'✍️'},
  {text:'Vorbește cu un străin azi',icon:'👋'},
  {text:'Mergi la culcare cu 1 oră mai devreme',icon:'🌙'},
  {text:'Fă 10 minute de mers pe jos în tăcere totală',icon:'🚶'},
  {text:'Mănâncă o masă fără ecran',icon:'🍽️'},
  {text:'Spune "nu" la un lucru azi',icon:'🚫'},
  {text:'Ascultă pe cineva fără să întrerupi',icon:'👂'},
  {text:'Fă ceva gratuit pentru cineva',icon:'🎁'},
  {text:'Stai 5 minute fără să faci absolut nimic',icon:'⬜'},
]

const GAME_SUGGESTIONS = [
  {gameId:'math',gameName:'Math Sprint',gameIcon:'⚡',gameColor:'#43D9A3'},
  {gameId:'stroop',gameName:'Stroop',gameIcon:'🌈',gameColor:'#E040FB'},
  {gameId:'reaction',gameName:'Reaction',gameIcon:'⚡',gameColor:'#FFEB3B'},
  {gameId:'oddone',gameName:'Odd One Out',gameIcon:'🧩',gameColor:'#00BCD4'},
  {gameId:'numbermem',gameName:'Number Memory',gameIcon:'🔢',gameColor:'#4CAF50'},
  {gameId:'categories',gameName:'Categorii',gameIcon:'📚',gameColor:'#9C27B0'},
]

const BORED_TEXTS_FLOW = [
  'Simț că ai nevoie de o pauză. Un joc de 60 secunde te-ar reseta.',
  'Uneori cel mai bun lucru e să oprești și să joci ceva.',
  'Creierul tău ar putea folosi un mic reset.',
  'Stres acumulat? Un mini-joc cognitiv poate elibera tensiunea.',
  'Înainte să continuăm — 60 secunde de antrenament cognitiv?',
]

function detectMood(t:string):Mood{
  const s=t.toLowerCase()
  if(/super|excelent|productiv|reușit|gata|terminat/.test(s))return 'excited'
  if(/de ce|cum|analizez|gândesc|planific/.test(s))return 'think'
  if(/trist|rău|greu|blocat|anxios|epuizat/.test(s))return 'sad'
  if(/obosit|somnoros|nu mai pot|burnout/.test(s))return 'sleepy'
  if(/bine|mulțumesc|ajutat|recunoscător/.test(s))return 'love'
  return 'happy'
}

function shouldProposeGame(msgs:Msg[],msgCount:number,lastProposedAt:number):boolean{
  if(msgCount-lastProposedAt<4)return false
  if(msgCount-lastProposedAt>=4)return Math.random()<0.5
  return false
}

function calcDepthXP(text:string):number{
  const s=text.toLowerCase();let b=0
  if(text.length>100)b+=8;if(text.length>200)b+=5
  if(/simt|cred|sincer|recunosc/.test(s))b+=6
  if(/singur|obosit|pierdut|confuz/.test(s))b+=5
  if(/relație|dragoste|sex|alcool/.test(s))b+=4
  return Math.min(b,18)
}

function useTypingText(fullText:string,active:boolean,speed=55){
  const [d,setD]=useState('')
  useEffect(()=>{
    if(!active||!fullText){setD(fullText);return}
    setD('');let i=0
    const id=setInterval(()=>{i++;setD(fullText.slice(0,i));if(i>=fullText.length)clearInterval(id)},speed)
    return()=>clearInterval(id)
  },[fullText,active,speed])
  return d
}
function TypingMsg({text,speed=55}:{text:string;speed?:number}){
  const d=useTypingText(text,true,speed)
  return <>{d}<span style={{opacity:d.length<text.length?1:0,animation:'cursor-blink .7s infinite',color:'rgba(255,255,255,.4)'}}>▌</span></>
}

// ─── OVERLAY COMPONENTS ───────────────────────────────────────────────────────

function DepthBar({level}:{level:number}){
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

// 1. Focus Timer (Pomodoro)
function FocusTimerOverlay({onClose}:{onClose:()=>void}){
  const [phase,setPhase]=useState<'idle'|'focus'|'break'>('idle')
  const [secs,setSecs]=useState(25*60)
  const [running,setRunning]=useState(false)
  const [rounds,setRounds]=useState(0)
  const timerRef=useRef<any>(null)
  useEffect(()=>{
    if(running){timerRef.current=setInterval(()=>setSecs(s=>{if(s<=1){clearInterval(timerRef.current);if(phase==='focus'){setPhase('break');setSecs(5*60);setRounds(r=>r+1)}else{setPhase('focus');setSecs(25*60)};return 0}return s-1}),1000)}
    else clearInterval(timerRef.current)
    return()=>clearInterval(timerRef.current)
  },[running,phase])
  const m=Math.floor(secs/60),s=secs%60
  const pct=(phase==='focus'?secs/(25*60):secs/(5*60))*100
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,animation:'fade-in .3s ease-out'}}>
      <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      <div style={{fontSize:11,color:'rgba(255,255,255,.3)',letterSpacing:'.2em'}}>{phase==='idle'?'POMODORO':phase==='focus'?'FOCUS':'PAUZĂ'}</div>
      <div style={{position:'relative',width:160,height:160}}>
        <svg width="160" height="160" style={{transform:'rotate(-90deg)'}}>
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="4"/>
          <circle cx="80" cy="80" r="70" fill="none" stroke={phase==='break'?'#43D9A3':'rgba(180,178,169,.6)'} strokeWidth="4" strokeDasharray={`${2*Math.PI*70}`} strokeDashoffset={`${2*Math.PI*70*(1-pct/100)}`} style={{transition:'stroke-dashoffset .5s'}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
          <div style={{fontSize:36,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{rounds} runde</div>
        </div>
      </div>
      <div style={{display:'flex',gap:12}}>
        <button onClick={()=>{if(phase==='idle')setPhase('focus');setRunning(r=>!r)}} style={{padding:'10px 28px',borderRadius:20,border:'1px solid rgba(255,255,255,.1)',background:running?'rgba(220,130,130,.1)':'rgba(255,255,255,.06)',color:'white',fontSize:13,cursor:'pointer',transition:'all .3s'}}>{running?'Pauză':'Start'}</button>
        <button onClick={()=>{clearInterval(timerRef.current);setRunning(false);setPhase('idle');setSecs(25*60)}} style={{padding:'10px 20px',borderRadius:20,border:'1px solid rgba(255,255,255,.06)',background:'transparent',color:'rgba(255,255,255,.3)',fontSize:12,cursor:'pointer'}}>Reset</button>
      </div>
    </div>
  )
}

// 2. Breathing Exercise
function BreathingOverlay({onClose}:{onClose:()=>void}){
  const [patIdx,setPatIdx]=useState(0)
  const [phase,setPhase]=useState<'idle'|'inhale'|'hold'|'exhale'>('idle')
  const [count,setCount]=useState(0)
  const [cycles,setCycles]=useState(0)
  const pat=BREATHING_PATTERNS[patIdx]
  useEffect(()=>{
    if(phase==='idle')return
    const dur={inhale:pat.inhale,hold:pat.hold,exhale:pat.exhale}[phase]||4
    let c=dur
    setCount(c)
    const id=setInterval(()=>{c--;setCount(c);if(c<=0){clearInterval(id);if(phase==='inhale')setPhase('hold');else if(phase==='hold')setPhase('exhale');else{setPhase('inhale');setCycles(n=>n+1)}}},1000)
    return()=>clearInterval(id)
  },[phase,patIdx])
  const scale=phase==='inhale'?1.3:phase==='exhale'?0.8:1
  const labels={idle:'apasă start',inhale:'inspiră',hold:'ține',exhale:'expiră'}
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,animation:'fade-in .3s ease-out'}}>
      <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      <div style={{fontSize:11,color:'rgba(255,255,255,.3)',letterSpacing:'.2em'}}>RESPIRAȚIE GHIDATĂ</div>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        {BREATHING_PATTERNS.map((p,i)=>(
          <button key={i} onClick={()=>{setPatIdx(i);setPhase('idle');setCycles(0)}} style={{padding:'4px 12px',borderRadius:20,border:`1px solid ${i===patIdx?'rgba(255,255,255,.3)':'rgba(255,255,255,.08)'}`,background:i===patIdx?'rgba(255,255,255,.08)':'transparent',color:i===patIdx?'white':'rgba(255,255,255,.3)',fontSize:10,cursor:'pointer'}}>{p.name}</button>
        ))}
      </div>
      <div style={{fontSize:10,color:'rgba(255,255,255,.2)',marginTop:-12}}>{pat.desc}</div>
      <div style={{width:140,height:140,borderRadius:'50%',border:'1px solid rgba(180,178,169,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',transform:`scale(${scale})`,transition:`transform ${phase==='inhale'?pat.inhale:phase==='exhale'?pat.exhale:0.3}s ease-in-out`,background:'rgba(180,178,169,.04)'}}>
        <div style={{fontSize:32,fontWeight:300,color:'rgba(180,178,169,.8)',fontFamily:'Georgia,serif'}}>{phase!=='idle'?count:''}</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>{labels[phase]}</div>
      </div>
      <div style={{fontSize:10,color:'rgba(255,255,255,.2)'}}>cicluri: {cycles}</div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={()=>setPhase(p=>p==='idle'?'inhale':'idle')} style={{padding:'10px 28px',borderRadius:20,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.05)',color:'white',fontSize:13,cursor:'pointer'}}>{phase==='idle'?'Start':'Stop'}</button>
      </div>
    </div>
  )
}

// 3. Mood Tracker
function MoodTrackerOverlay({entries,onClose}:{entries:MoodEntry[];onClose:()=>void}){
  const last7=entries.slice(-7)
  const days=['D','L','M','M','J','V','S']
  const avg=last7.length>0?Math.round(last7.reduce((a,e)=>a+e.score,0)/last7.length):0
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Mood Tracker</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>ultimele 7 zile · medie: {avg}/10</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      {last7.length===0?(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'rgba(255,255,255,.2)',textAlign:'center',fontFamily:'Georgia,serif',lineHeight:1.8}}>vorbește cu mine<br/>și îți voi urmări starea</div>
      ):(
        <div style={{display:'flex',gap:10,alignItems:'flex-end',justifyContent:'center',flex:1,maxHeight:200,paddingBottom:16}}>
          {last7.map((e,i)=>{
            const h=Math.max(24,e.score*18)
            const col=MOODS[e.mood].bursts[0]
            return(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flex:1}}>
                <div style={{fontSize:8,color:'rgba(255,255,255,.4)',fontFamily:'Georgia,serif'}}>{e.score}</div>
                <div style={{width:'100%',height:h,background:`rgba(180,178,169,${0.15+e.score*0.03})`,borderRadius:'4px 4px 0 0',transition:'all .5s'}}/>
                <div style={{fontSize:9,color:'rgba(255,255,255,.25)',fontFamily:'monospace'}}>{days[new Date(e.date).getDay()]}</div>
                <div style={{fontSize:11}}>{MOODS[e.mood].sym}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 4. Gratitude Streak
function GratitudeOverlay({entries,onAdd,onClose}:{entries:GratitudeEntry[];onAdd:(t:string)=>void;onClose:()=>void}){
  const [text,setText]=useState('')
  const today=new Date().toDateString()
  const todayDone=entries.some(e=>e.date===today)
  const streak=entries.length
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Recunoștință</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>streak: {streak} zile 🌱</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      {!todayDone?(
        <>
          <div style={{fontSize:13,color:'rgba(255,255,255,.5)',marginBottom:12,fontFamily:'Georgia,serif',fontStyle:'italic'}}>Ce lucru bun s-a întâmplat azi?</div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="orice, cât de mic..." autoFocus style={{flex:1,background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.06)',borderRadius:12,padding:14,color:'rgba(255,255,255,.7)',fontSize:14,outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.8}}/>
          <button onClick={()=>{if(text.trim()){onAdd(text);onClose()}}} disabled={!text.trim()} style={{marginTop:14,padding:'12px 0',borderRadius:20,border:'none',background:text.trim()?'rgba(180,178,169,.3)':'rgba(255,255,255,.04)',color:'white',fontSize:13,cursor:text.trim()?'pointer':'default',transition:'all .3s',fontFamily:'Georgia,serif'}}>salvează</button>
        </>
      ):(
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:10,overflowY:'auto',scrollbarWidth:'none'}}>
          <div style={{fontSize:13,color:'rgba(255,255,255,.4)',fontFamily:'Georgia,serif',fontStyle:'italic'}}>azi ai scris deja ✓</div>
          {entries.slice(-5).reverse().map((e,i)=>(
            <div key={i} style={{padding:'10px 14px',background:'rgba(255,255,255,.02)',borderRadius:10,border:'0.5px solid rgba(255,255,255,.04)'}}>
              <div style={{fontSize:9,color:'rgba(255,255,255,.2)',marginBottom:4}}>{e.date}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.6)',fontFamily:'Georgia,serif',lineHeight:1.6}}>{e.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 5. Journal Mode
function JournalOverlay({entries,onAdd,onClose}:{entries:JournalEntry[];onAdd:(p:string,t:string)=>void;onClose:()=>void}){
  const [text,setText]=useState('')
  const prompt=JOURNAL_PROMPTS[new Date().getDay()%JOURNAL_PROMPTS.length]
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Jurnal</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>{entries.length} intrări</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{fontSize:14,color:'rgba(255,255,255,.5)',marginBottom:14,fontFamily:'Georgia,serif',fontStyle:'italic',lineHeight:1.7,padding:'10px 14px',background:'rgba(255,255,255,.02)',borderRadius:10,border:'0.5px solid rgba(255,255,255,.04)'}}>„{prompt}"</div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="scrie liber..." autoFocus style={{flex:1,background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.04)',borderRadius:12,padding:14,color:'rgba(255,255,255,.7)',fontSize:14,outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.8}}/>
      <button onClick={()=>{if(text.trim()){onAdd(prompt,text);onClose()}}} disabled={!text.trim()} style={{marginTop:14,padding:'12px 0',borderRadius:20,border:'none',background:text.trim()?'rgba(180,178,169,.3)':'rgba(255,255,255,.04)',color:'white',fontSize:13,cursor:text.trim()?'pointer':'default',transition:'all .3s',fontFamily:'Georgia,serif'}}>salvează</button>
    </div>
  )
}

// 6. Habit Tracker
function HabitTrackerOverlay({habits,onDone,onAdd,onClose}:{habits:HabitEntry[];onDone:(id:string)=>void;onAdd:(n:string,i:string)=>void;onClose:()=>void}){
  const [newName,setNewName]=useState('')
  const [newIcon,setNewIcon]=useState('◎')
  const icons=['◎','◈','♡','◐','⬛','∞','⚡','✦']
  const today=new Date().toDateString()
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Obiceiuri</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,scrollbarWidth:'none'}}>
        {habits.map(h=>{
          const done=h.lastDone===today
          return(
            <div key={h.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,border:`0.5px solid ${done?'rgba(180,178,169,.2)':'rgba(255,255,255,.06)'}`,background:done?'rgba(180,178,169,.04)':'rgba(255,255,255,.01)',transition:'all .3s'}}>
              <span style={{fontSize:16,fontFamily:'monospace',color:'rgba(180,178,169,.7)'}}>{h.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:done?'rgba(255,255,255,.3)':'rgba(255,255,255,.8)',textDecoration:done?'line-through':'none'}}>{h.name}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.2)',marginTop:2}}>🔥 {h.streak} zile</div>
              </div>
              {!done&&<button onClick={()=>onDone(h.id)} style={{padding:'5px 14px',borderRadius:20,border:'0.5px solid rgba(180,178,169,.2)',background:'rgba(180,178,169,.06)',color:'rgba(180,178,169,.7)',fontSize:11,cursor:'pointer'}}>✓</button>}
              {done&&<span style={{fontSize:16}}>✓</span>}
            </div>
          )
        })}
        {habits.length===0&&<div style={{fontSize:13,color:'rgba(255,255,255,.2)',fontFamily:'Georgia,serif',fontStyle:'italic'}}>niciun obicei — adaugă primul</div>}
      </div>
      <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',gap:6}}>
          {icons.map(ic=><button key={ic} onClick={()=>setNewIcon(ic)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${newIcon===ic?'rgba(180,178,169,.4)':'rgba(255,255,255,.06)'}`,background:newIcon===ic?'rgba(180,178,169,.08)':'transparent',color:'rgba(180,178,169,.7)',fontSize:14,cursor:'pointer',fontFamily:'monospace'}}>{ic}</button>)}
        </div>
        <div style={{display:'flex',gap:8}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="obicei nou..." onKeyDown={e=>e.key==='Enter'&&newName.trim()&&(onAdd(newName,newIcon),setNewName(''))} style={{flex:1,background:'rgba(255,255,255,.03)',border:'0.5px solid rgba(255,255,255,.06)',borderRadius:10,padding:'8px 12px',color:'rgba(255,255,255,.6)',fontSize:13,outline:'none',fontFamily:'Georgia,serif'}}/>
          <button onClick={()=>{if(newName.trim()){onAdd(newName,newIcon);setNewName('')}}} style={{padding:'8px 16px',borderRadius:10,border:'none',background:'rgba(180,178,169,.15)',color:'white',cursor:'pointer',fontSize:13}}>+</button>
        </div>
      </div>
    </div>
  )
}

// 7. Life Areas Radar
function LifeRadarOverlay({areas,onUpdate,onClose}:{areas:LifeAreaScore[];onUpdate:(a:LifeArea,s:number)=>void;onClose:()=>void}){
  const areaNames:Record<LifeArea,string>={cariera:'Carieră',relatii:'Relații',sanatate:'Sănătate',bani:'Bani',creatie:'Creație',spirit:'Spirit'}
  const colors:Record<LifeArea,string>={cariera:'#43D9A3',relatii:'#FF6584',sanatate:'#4CAF50',bani:'#FFD700',creatie:'#E040FB',spirit:'#7B8CDE'}
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Roata Vieții</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>unde ești acum?</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:12,overflowY:'auto',scrollbarWidth:'none'}}>
        {areas.map(a=>(
          <div key={a.area}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,.6)',fontFamily:'Georgia,serif'}}>{areaNames[a.area]}</span>
              <span style={{fontSize:12,color:colors[a.area],fontWeight:700}}>{a.score}/10</span>
            </div>
            <div style={{display:'flex',gap:4}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                <button key={n} onClick={()=>onUpdate(a.area,n)} style={{flex:1,height:24,borderRadius:4,border:'none',background:n<=a.score?colors[a.area]+'66':'rgba(255,255,255,.05)',cursor:'pointer',transition:'all .2s'}}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 8. Decision Helper
function DecisionOverlay({onClose,onSend}:{onClose:()=>void;onSend:(t:string)=>void}){
  const [decision,setDecision]=useState('')
  const [pros,setPros]=useState<string[]>([''])
  const [cons,setCons]=useState<string[]>([''])
  const addPro=()=>setPros(p=>[...p,''])
  const addCon=()=>setCons(c=>[...c,''])
  const updatePro=(i:number,v:string)=>setPros(p=>p.map((x,j)=>j===i?v:x))
  const updateCon=(i:number,v:string)=>setCons(c=>c.map((x,j)=>j===i?v:x))
  const submit=()=>{
    const text=`[DECISION] ${decision}\nPro: ${pros.filter(Boolean).join(', ')}\nCon: ${cons.filter(Boolean).join(', ')}`
    onSend(text);onClose()
  }
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:20,animation:'fade-in .3s ease-out',overflowY:'auto',scrollbarWidth:'none'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Decision Helper</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <input value={decision} onChange={e=>setDecision(e.target.value)} placeholder="Ce decizie ai de luat?" style={{background:'rgba(255,255,255,.03)',border:'0.5px solid rgba(255,255,255,.08)',borderRadius:10,padding:'10px 14px',color:'rgba(255,255,255,.7)',fontSize:14,outline:'none',marginBottom:16,fontFamily:'Georgia,serif'}}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,flex:1}}>
        <div>
          <div style={{fontSize:11,color:'#43D9A3',marginBottom:8,letterSpacing:'.05em'}}>PRO</div>
          {pros.map((p,i)=><input key={i} value={p} onChange={e=>updatePro(i,e.target.value)} placeholder={`pro ${i+1}`} style={{width:'100%',background:'rgba(67,217,163,.04)',border:'0.5px solid rgba(67,217,163,.1)',borderRadius:8,padding:'7px 10px',color:'rgba(255,255,255,.6)',fontSize:12,outline:'none',marginBottom:6,fontFamily:'Georgia,serif'}}/>)}
          <button onClick={addPro} style={{fontSize:11,color:'rgba(67,217,163,.4)',background:'none',border:'none',cursor:'pointer'}}>+ adaugă</button>
        </div>
        <div>
          <div style={{fontSize:11,color:'rgba(220,130,130,.8)',marginBottom:8,letterSpacing:'.05em'}}>CON</div>
          {cons.map((c,i)=><input key={i} value={c} onChange={e=>updateCon(i,e.target.value)} placeholder={`con ${i+1}`} style={{width:'100%',background:'rgba(220,130,130,.04)',border:'0.5px solid rgba(220,130,130,.1)',borderRadius:8,padding:'7px 10px',color:'rgba(255,255,255,.6)',fontSize:12,outline:'none',marginBottom:6,fontFamily:'Georgia,serif'}}/>)}
          <button onClick={addCon} style={{fontSize:11,color:'rgba(220,130,130,.4)',background:'none',border:'none',cursor:'pointer'}}>+ adaugă</button>
        </div>
      </div>
      <button onClick={submit} disabled={!decision.trim()} style={{marginTop:14,padding:'12px 0',borderRadius:20,border:'none',background:decision.trim()?'rgba(180,178,169,.2)':'rgba(255,255,255,.04)',color:'white',fontSize:13,cursor:decision.trim()?'pointer':'default',fontFamily:'Georgia,serif'}}>analizează cu FLOW</button>
    </div>
  )
}

// 9. Time Capsule
function TimeCapsuleOverlay({capsules,onAdd,onClose}:{capsules:{text:string;date:string;openDate:string}[];onAdd:(t:string,d:string)=>void;onClose:()=>void}){
  const [text,setText]=useState('')
  const [days,setDays]=useState(30)
  const today=new Date().toDateString()
  const readyCapsules=capsules.filter(c=>new Date(c.openDate)<=new Date())
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Capsulă Temporală</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>scrisori pentru tine din viitor</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      {readyCapsules.length>0&&(
        <div style={{marginBottom:14,padding:'12px 14px',background:'rgba(180,178,169,.06)',borderRadius:12,border:'0.5px solid rgba(180,178,169,.15)'}}>
          <div style={{fontSize:11,color:'rgba(180,178,169,.6)',marginBottom:8}}>📬 capsule de citit:</div>
          {readyCapsules.map((c,i)=><div key={i} style={{fontSize:13,color:'rgba(255,255,255,.6)',fontFamily:'Georgia,serif',lineHeight:1.7,marginBottom:8,padding:'8px 0',borderBottom:'0.5px solid rgba(255,255,255,.04)'}}>{c.text}<div style={{fontSize:9,color:'rgba(255,255,255,.2)',marginTop:4}}>scris pe {c.date}</div></div>)}
        </div>
      )}
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Scrie-i ceva lui tu din viitor..." autoFocus style={{flex:1,background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.04)',borderRadius:12,padding:14,color:'rgba(255,255,255,.7)',fontSize:14,outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.8}}/>
      <div style={{marginTop:12,display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:11,color:'rgba(255,255,255,.3)',fontFamily:'Georgia,serif'}}>deschide după</span>
        {[7,30,90,365].map(d=><button key={d} onClick={()=>setDays(d)} style={{padding:'4px 10px',borderRadius:16,border:`0.5px solid ${days===d?'rgba(255,255,255,.3)':'rgba(255,255,255,.06)'}`,background:days===d?'rgba(255,255,255,.06)':'transparent',color:days===d?'white':'rgba(255,255,255,.3)',fontSize:10,cursor:'pointer'}}>{d}z</button>)}
      </div>
      <button onClick={()=>{if(text.trim()){const od=new Date();od.setDate(od.getDate()+days);onAdd(text,od.toDateString());onClose()}}} disabled={!text.trim()} style={{marginTop:12,padding:'12px 0',borderRadius:20,border:'none',background:text.trim()?'rgba(180,178,169,.2)':'rgba(255,255,255,.04)',color:'white',fontSize:13,cursor:text.trim()?'pointer':'default',fontFamily:'Georgia,serif'}}>sigilează capsula</button>
    </div>
  )
}

// 10. Alter Ego
function AlterEgoOverlay({current,onSelect,onClose}:{current:AlterEgo;onSelect:(e:AlterEgo)=>void;onClose:()=>void}){
  const egos:AlterEgo[]=['none','stoic','optimist','realist','visat']
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Mod de Conversație</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>cum vrei să îți vorbesc azi</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10,flex:1}}>
        {egos.map(e=>{
          const d=ALTER_EGO_DATA[e]
          return(
            <button key={e} onClick={()=>{onSelect(e);onClose()}} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:14,border:`1px solid ${current===e?d.color+'44':'rgba(255,255,255,.05)'}`,background:current===e?d.color+'08':'rgba(255,255,255,.01)',cursor:'pointer',textAlign:'left',transition:'all .2s'}}>
              <span style={{fontSize:18,fontFamily:'monospace',color:d.color}}>{d.icon}</span>
              <div>
                <div style={{fontSize:13,fontWeight:400,color:current===e?d.color:'rgba(255,255,255,.7)',fontFamily:'Georgia,serif'}}>{e==='none'?'Flow (implicit)':d.name}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.25)',marginTop:2,fontFamily:'Georgia,serif',fontStyle:'italic'}}>{e==='none'?'calm, fără judecată, profund':d.prompt.slice(0,55)+'...'}</div>
              </div>
              {current===e&&<div style={{marginLeft:'auto',fontSize:9,color:d.color,fontFamily:'monospace'}}>activ</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 11. Energy Check-in
function EnergyOverlay({entries,onAdd,onClose}:{entries:EnergyEntry[];onAdd:(l:number)=>void;onClose:()=>void}){
  const [selected,setSelected]=useState(5)
  const today=entries.filter(e=>e.date===new Date().toDateString())
  const labels=['', 'epuizat','obosit','greu','jos','ok','bine','bun','energic','fire','maxim']
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Energy Check-in</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{fontSize:13,color:'rgba(255,255,255,.4)',fontFamily:'Georgia,serif',fontStyle:'italic',marginBottom:20}}>Cum e energia ta acum?</div>
      <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:16}}>
        {[1,2,3,4,5,6,7,8,9,10].map(n=>{
          const col=n<=3?'rgba(220,130,130,.7)':n<=6?'rgba(180,178,169,.6)':n<=8?'rgba(160,220,180,.7)':'rgba(255,215,0,.7)'
          return<button key={n} onClick={()=>setSelected(n)} style={{width:40,height:40,borderRadius:10,border:`1px solid ${selected===n?col:'rgba(255,255,255,.06)'}`,background:selected===n?col.replace('.7','.15'):'transparent',color:selected===n?col:'rgba(255,255,255,.3)',fontSize:14,fontWeight:700,cursor:'pointer',transition:'all .2s'}}>{n}</button>
        })}
      </div>
      <div style={{textAlign:'center',fontSize:14,color:'rgba(255,255,255,.5)',fontFamily:'Georgia,serif',fontStyle:'italic',marginBottom:20}}>{labels[selected]}</div>
      {today.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,.2)',marginBottom:6}}>azi</div>
          <div style={{display:'flex',gap:4,alignItems:'flex-end',height:40}}>
            {today.map((e,i)=><div key={i} style={{flex:1,height:e.level*4,background:'rgba(180,178,169,.3)',borderRadius:2}}/>)}
          </div>
        </div>
      )}
      <button onClick={()=>{onAdd(selected);onClose()}} style={{padding:'12px 0',borderRadius:20,border:'none',background:'rgba(180,178,169,.15)',color:'white',fontSize:13,cursor:'pointer',fontFamily:'Georgia,serif',marginTop:'auto'}}>salvează</button>
    </div>
  )
}

// 12. Rant Mode
function RantOverlay({onClose,onSend}:{onClose:()=>void;onSend:(t:string)=>void}){
  const [text,setText]=useState('')
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'rgba(220,130,130,.8)',fontFamily:'Georgia,serif'}}>Eliberare</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>scrie tot ce ai pe suflet. fără filtru.</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="dă-i drumul..." autoFocus style={{flex:1,background:'rgba(220,130,130,.03)',border:'0.5px solid rgba(220,130,130,.1)',borderRadius:16,padding:16,color:'rgba(255,255,255,.8)',fontSize:14,outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.8}}/>
      <div style={{display:'flex',gap:10,marginTop:14}}>
        <button onClick={()=>{if(text.trim()){onSend(`[RANT] ${text}`);onClose()}}} disabled={!text.trim()} style={{flex:1,padding:'12px 0',borderRadius:20,border:'none',background:text.trim()?'rgba(220,130,130,.4)':'rgba(255,255,255,.04)',color:'white',fontSize:13,cursor:text.trim()?'pointer':'default',fontFamily:'Georgia,serif'}}>eliberează</button>
        <button onClick={onClose} style={{padding:'12px 18px',borderRadius:20,border:'0.5px solid rgba(255,255,255,.06)',background:'transparent',color:'rgba(255,255,255,.3)',fontSize:12,cursor:'pointer'}}>anulează</button>
      </div>
    </div>
  )
}

// 13. Confess
function ConfessOverlay({onClose,onSend}:{onClose:()=>void;onSend:(t:string)=>void}){
  const [text,setText]=useState('')
  const [sent,setSent]=useState(false)
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      {sent?(
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,textAlign:'center'}}>
          <div style={{fontSize:32,fontFamily:'Georgia,serif'}}>◎</div>
          <div style={{fontSize:16,fontWeight:300,color:'rgba(180,178,169,.8)',fontFamily:'Georgia,serif'}}>primit.</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.35)',lineHeight:1.9,maxWidth:260,fontFamily:'Georgia,serif',fontStyle:'italic'}}>nu judec. nu țin minte. tu știi că ai spus-o — asta e tot ce contează.</div>
          <button onClick={onClose} style={{marginTop:10,padding:'10px 28px',borderRadius:20,border:'0.5px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.3)',cursor:'pointer',fontFamily:'Georgia,serif'}}>închide</button>
        </div>
      ):(
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div>
              <div style={{fontSize:16,fontWeight:300,color:'rgba(180,170,255,.8)',fontFamily:'Georgia,serif'}}>Confesiune</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>anonim · fără judecată · fără memorie</div>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="ce ai pe suflet..." autoFocus style={{flex:1,background:'rgba(180,170,255,.03)',border:'0.5px solid rgba(180,170,255,.08)',borderRadius:16,padding:16,color:'rgba(255,255,255,.8)',fontSize:14,outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.8}}/>
          <button onClick={()=>{if(text.trim()){onSend(`[CONFESS] ${text}`);setSent(true)}}} disabled={!text.trim()} style={{marginTop:14,padding:'12px 0',borderRadius:20,border:'none',background:text.trim()?'rgba(180,170,255,.3)':'rgba(255,255,255,.04)',color:'white',fontSize:13,cursor:text.trim()?'pointer':'default',fontFamily:'Georgia,serif'}}>trimite în gol</button>
        </>
      )}
    </div>
  )
}

// 14. Weekly Insight
function WeeklyInsightOverlay({msgs,moodHistory,onClose}:{msgs:Msg[];moodHistory:MoodEntry[];onClose:()=>void}){
  const week=moodHistory.slice(-7)
  const avg=week.length?Math.round(week.reduce((a,e)=>a+e.score,0)/week.length):0
  const best=week.reduce((b,e)=>e.score>b.score?e:b,week[0])
  const worst=week.reduce((w,e)=>e.score<w.score?e:w,week[0])
  const wordCount=msgs.filter(m=>m.role==='user').reduce((a,m)=>a+m.text.split(' ').length,0)
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Insight Săptămânal</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>ce spun datele despre tine</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12,flex:1}}>
        {[
          {label:'stare medie',value:`${avg}/10`,sub:avg>=7?'săptămână bună':avg>=5?'săptămână ok':'săptămână dificilă'},
          {label:'cea mai bună zi',value:best?new Date(best.date).toLocaleDateString('ro-RO',{weekday:'long'}):'—',sub:best?MOODS[best.mood].label:''},
          {label:'cea mai grea zi',value:worst?new Date(worst.date).toLocaleDateString('ro-RO',{weekday:'long'}):'—',sub:worst?MOODS[worst.mood].label:''},
          {label:'cuvinte scrise',value:wordCount.toString(),sub:'în total cu FLOW'},
          {label:'sesiuni',value:msgs.filter(m=>m.role==='user').length.toString(),sub:'mesaje trimise'},
        ].map((item,i)=>(
          <div key={i} style={{padding:'12px 16px',background:'rgba(255,255,255,.02)',borderRadius:12,border:'0.5px solid rgba(255,255,255,.04)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginBottom:3,fontFamily:'Georgia,serif'}}>{item.label}</div>
              <div style={{fontSize:18,color:'rgba(180,178,169,.8)',fontFamily:'Georgia,serif',fontWeight:300}}>{item.value}</div>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.25)',fontFamily:'Georgia,serif',fontStyle:'italic',textAlign:'right',maxWidth:100}}>{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 15. Intentions (Scopuri zilnice)
function IntentionsOverlay({intentions,onAdd,onDone,onClose}:{intentions:Intention[];onAdd:(t:string)=>void;onDone:(i:number)=>void;onClose:()=>void}){
  const [text,setText]=useState('')
  const today=new Date().toDateString()
  const todayInt=intentions.filter(i=>i.date===today)
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Intenții Zilnice</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>ce contează azi cu adevărat</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,scrollbarWidth:'none'}}>
        {todayInt.length===0&&<div style={{fontSize:13,color:'rgba(255,255,255,.2)',fontFamily:'Georgia,serif',fontStyle:'italic'}}>nicio intenție — ce îți propui azi?</div>}
        {todayInt.map((int,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,border:`0.5px solid ${int.done?'rgba(180,178,169,.15)':'rgba(255,255,255,.06)'}`,background:int.done?'rgba(180,178,169,.03)':'rgba(255,255,255,.01)'}}>
            <button onClick={()=>onDone(intentions.indexOf(int))} style={{width:16,height:16,borderRadius:'50%',border:`0.5px solid ${int.done?'rgba(180,178,169,.5)':'rgba(255,255,255,.2)'}`,background:int.done?'rgba(180,178,169,.2)':'transparent',cursor:'pointer',flexShrink:0,fontSize:8,color:'rgba(255,255,255,.6)'}}>{int.done?'✓':''}</button>
            <span style={{fontSize:13,color:int.done?'rgba(255,255,255,.25)':'rgba(255,255,255,.7)',textDecoration:int.done?'line-through':'none',fontFamily:'Georgia,serif'}}>{int.text}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginTop:14}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&text.trim()&&(onAdd(text),setText(''))} placeholder="intenție nouă..." style={{flex:1,background:'rgba(255,255,255,.03)',border:'0.5px solid rgba(255,255,255,.06)',borderRadius:10,padding:'9px 14px',color:'rgba(255,255,255,.6)',fontSize:13,outline:'none',fontFamily:'Georgia,serif'}}/>
        <button onClick={()=>{if(text.trim()){onAdd(text);setText('')}}} style={{padding:'9px 18px',borderRadius:10,border:'none',background:'rgba(180,178,169,.12)',color:'white',cursor:'pointer',fontSize:13}}>+</button>
      </div>
    </div>
  )
}

// 16. Wisdom Quote
function WisdomOverlay({onClose,onSend}:{onClose:()=>void;onSend:(t:string)=>void}){
  const [idx,setIdx]=useState(()=>Math.floor(Math.random()*WISDOM_QUOTES.length))
  const q=WISDOM_QUOTES[idx]
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:24,animation:'fade-in .3s ease-out',textAlign:'center'}}>
      <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      <div style={{fontSize:11,color:'rgba(255,255,255,.2)',letterSpacing:'.2em',fontFamily:'Georgia,serif'}}>◎ ÎNȚELEPCIUNE</div>
      <div style={{fontSize:18,color:'rgba(180,178,169,.85)',fontFamily:'Georgia,serif',fontWeight:300,lineHeight:1.9,fontStyle:'italic',maxWidth:280}}>„{q}"</div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={()=>setIdx(i=>(i+1)%WISDOM_QUOTES.length)} style={{padding:'8px 18px',borderRadius:20,border:'0.5px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.3)',fontSize:12,cursor:'pointer',fontFamily:'Georgia,serif'}}>altul</button>
        <button onClick={()=>{onSend(`Ce crezi despre asta: „${q}"`);onClose()}} style={{padding:'8px 18px',borderRadius:20,border:'none',background:'rgba(180,178,169,.15)',color:'white',fontSize:12,cursor:'pointer',fontFamily:'Georgia,serif'}}>discutăm</button>
      </div>
    </div>
  )
}

// 17. Daily Challenge
function ChallengeOverlay({onClose,onAccept}:{onClose:()=>void;onAccept:(t:string)=>void}){
  const ch=CHALLENGES[new Date().getDay()%CHALLENGES.length]
  const [done,setDone]=useState(()=>localStorage.getItem('flow-challenge-date')===new Date().toDateString())
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:20,animation:'fade-in .3s ease-out',textAlign:'center'}}>
      <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      <div style={{fontSize:11,color:'rgba(255,255,255,.2)',letterSpacing:'.2em'}}>PROVOCAREA ZILEI</div>
      <div style={{fontSize:40}}>{ch.icon}</div>
      <div style={{fontSize:16,color:'rgba(180,178,169,.8)',fontFamily:'Georgia,serif',fontWeight:300,lineHeight:1.8,maxWidth:260}}>{ch.text}</div>
      {done?(
        <div style={{fontSize:13,color:'rgba(160,220,180,.6)',fontFamily:'Georgia,serif'}}>✓ ai acceptat-o azi</div>
      ):(
        <button onClick={()=>{localStorage.setItem('flow-challenge-date',new Date().toDateString());setDone(true);onAccept(`Am acceptat provocarea: ${ch.text}`);onClose()}} style={{padding:'12px 32px',borderRadius:20,border:'none',background:'rgba(180,178,169,.2)',color:'white',fontSize:13,cursor:'pointer',fontFamily:'Georgia,serif'}}>accept provocarea</button>
      )}
    </div>
  )
}

// 18. Anonymous Letter
function LetterOverlay({onClose}:{onClose:()=>void}){
  const [to,setTo]=useState('')
  const [text,setText]=useState('')
  const [sent,setSent]=useState(false)
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,4,8,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      {sent?(
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,textAlign:'center'}}>
          <div style={{fontSize:24,fontFamily:'Georgia,serif'}}>✉</div>
          <div style={{fontSize:16,fontWeight:300,color:'rgba(180,178,169,.8)',fontFamily:'Georgia,serif'}}>scrisoarea există.</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.35)',lineHeight:1.9,maxWidth:260,fontFamily:'Georgia,serif',fontStyle:'italic'}}>nu ai nevoie să o trimiți. uneori e suficient să o scrii.</div>
          <button onClick={onClose} style={{marginTop:10,padding:'10px 28px',borderRadius:20,border:'0.5px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.3)',cursor:'pointer'}}>închide</button>
        </div>
      ):(
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div>
              <div style={{fontSize:16,fontWeight:300,color:'white',fontFamily:'Georgia,serif'}}>Scrisoare Netrimisă</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>scrie ceea ce n-ai putut spune</div>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
          </div>
          <input value={to} onChange={e=>setTo(e.target.value)} placeholder="Către cine? (opțional)" style={{background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.05)',borderRadius:10,padding:'9px 14px',color:'rgba(255,255,255,.5)',fontSize:13,outline:'none',marginBottom:12,fontFamily:'Georgia,serif',fontStyle:'italic'}}/>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Dragă..." autoFocus style={{flex:1,background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.04)',borderRadius:14,padding:16,color:'rgba(255,255,255,.7)',fontSize:14,outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.9}}/>
          <button onClick={()=>{if(text.trim())setSent(true)}} disabled={!text.trim()} style={{marginTop:14,padding:'12px 0',borderRadius:20,border:'none',background:text.trim()?'rgba(180,178,169,.15)':'rgba(255,255,255,.04)',color:'white',fontSize:13,cursor:text.trim()?'pointer':'default',fontFamily:'Georgia,serif'}}>scrisoarea e completă</button>
        </>
      )}
    </div>
  )
}

// GameProposal Card
function GameProposalCard({proposal,onAccept,onDecline,botText}:{proposal:GameProposal;onAccept:()=>void;onDecline:()=>void;botText:string}){
  const d=useTypingText(botText,true,50)
  if(proposal.declined)return(<div style={{fontSize:16,lineHeight:1.85,color:'rgba(255,255,255,.5)',fontFamily:'Georgia,serif',fontWeight:300,fontStyle:'italic',animation:'text-appear .6s ease-out'}}>ok, când vrei să joci, știi unde să mă găsești.</div>)
  return(
    <div style={{animation:'text-appear .6s ease-out',textAlign:'center'}}>
      <div style={{fontSize:15,lineHeight:1.85,color:'rgba(255,255,255,.75)',fontFamily:'Georgia,serif',fontWeight:300,marginBottom:16}}>{d}<span style={{opacity:d.length<botText.length?1:0,animation:'cursor-blink .7s infinite',color:'rgba(255,255,255,.4)'}}>▌</span></div>
      <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:10,padding:'14px 20px',borderRadius:16,background:`${proposal.gameColor}11`,border:`1px solid ${proposal.gameColor}33`}}>
        <div style={{fontSize:28}}>{proposal.gameIcon}</div>
        <div style={{fontSize:13,fontWeight:700,color:'white'}}>{proposal.gameName}</div>
        <div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>60 secunde · cognitiv</div>
        <div style={{display:'flex',gap:8,marginTop:4}}>
          <button onClick={onAccept} style={{padding:'8px 20px',borderRadius:20,border:'none',background:proposal.gameColor,color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>Da, hai!</button>
          <button onClick={onDecline} style={{padding:'8px 16px',borderRadius:20,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(255,255,255,.3)',fontSize:12,cursor:'pointer'}}>Mai târziu</button>
        </div>
      </div>
    </div>
  )
}

function Avatar({mood,speaking,size=120,waves=false}:{mood:Mood;speaking:boolean;size?:number;waves?:boolean}){
  const eyeRy=mood==='sleepy'?2.5:mood==='excited'?6.5:5.5
  const bTL=mood==='think'?'rotate(-4 30 27)':mood==='sad'?'rotate(6 30 27)':mood==='excited'?'translate(0,-3)':mood==='sleepy'?'translate(0,4)':''
  const bTR=mood==='think'?'rotate(4 60 27)':mood==='sad'?'rotate(-6 60 27)':mood==='excited'?'translate(0,-3)':mood==='sleepy'?'translate(0,4)':''
  const mouth=mood==='excited'||mood==='love'||mood==='laugh'?'M32 57 Q45 65 58 57':mood==='think'?'M35 60 Q45 60 55 60':mood==='sleepy'?'M35 60 Q45 61 55 60':mood==='sad'?'M35 63 Q45 57 55 63':'M33 58 Q45 65 57 58'
  const [mf,setMf]=useState(0)
  useEffect(()=>{if(!speaking)return;const id=setInterval(()=>setMf(f=>(f+1)%3),130);return()=>clearInterval(id)},[speaking])
  return(
    <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
      {waves&&[1,2,3].map(i=>(<div key={i} style={{position:'absolute',width:size+i*30,height:size+i*30,borderRadius:'50%',border:`0.5px solid rgba(180,178,169,${speaking?.15-.03*i:.06-.01*i})`,top:'50%',left:'50%',transform:'translate(-50%,-50%)',animation:`wave ${2+i*.5}s ease-in-out infinite ${i*.3}s`,pointerEvents:'none'}}/>))}
      <svg viewBox="0 0 90 90" width={size} height={size} style={{position:'relative',zIndex:1}}>
        <circle cx="45" cy="45" r="42" fill="#D3D1C7"/><circle cx="45" cy="51" r="32" fill="#F1EFE8"/>
        <ellipse cx="30" cy="39" rx="5.5" ry={eyeRy} fill="#2C2C2A"/><ellipse cx="60" cy="39" rx="5.5" ry={eyeRy} fill="#2C2C2A"/>
        <circle cx="32" cy="37" r="1.8" fill="white"/><circle cx="62" cy="37" r="1.8" fill="white"/>
        <ellipse cx="30" cy="28" rx="8.5" ry="2.5" fill="#F1EFE8"/><ellipse cx="60" cy="28" rx="8.5" ry="2.5" fill="#F1EFE8"/>
        <rect x="22" y="25.5" width="16" height="3" rx="1.5" fill="#2C2C2A" transform={bTL}/><rect x="52" y="25.5" width="16" height="3" rx="1.5" fill="#2C2C2A" transform={bTR}/>
        {speaking?<path d={[mouth,'M34 59 Q45 63 56 59','M36 58 Q45 61 54 58'][mf]} fill="none" stroke="#2C2C2A" strokeWidth="2.2" strokeLinecap="round"/>:<path d={mouth} fill="none" stroke="#2C2C2A" strokeWidth="2.2" strokeLinecap="round"/>}
        <circle cx="17" cy="54" r="6.5" fill="#B4B2A9" opacity="0.35"/><circle cx="73" cy="54" r="6.5" fill="#B4B2A9" opacity="0.35"/>
      </svg>
    </div>
  )
}

function Burst({mood,trigger}:{mood:Mood;trigger:number}){
  const [ps,setPs]=useState<any[]>([])
  useEffect(()=>{if(!trigger)return;const items=Array.from({length:6+Math.floor(Math.random()*4)},(_,i)=>{const a=Math.random()*Math.PI*2,d=60+Math.random()*80;return{id:Date.now()+i,e:MOODS[mood].bursts[Math.floor(Math.random()*MOODS[mood].bursts.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-90+Math.random()*180,delay:Math.random()*300,size:12+Math.random()*10}});setPs(items);setTimeout(()=>setPs([]),2500)},[trigger])
  return(<div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50,overflow:'hidden'}}>{ps.map(p=><span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',animationName:'burst',animationDuration:'2s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`,color:'rgba(255,255,255,.35)',fontFamily:'monospace'}}>{p.e}</span>)}</div>)
}

function ChatOverlay({msgs,onClose}:{msgs:Msg[];onClose:()=>void}){
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.96)',zIndex:200,display:'flex',flexDirection:'column',animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0}}>
        <span style={{fontSize:11,color:'rgba(255,255,255,.25)',letterSpacing:'.1em',fontFamily:'Georgia,serif'}}>FLOW · conversație</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:18,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10,scrollbarWidth:'none'}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:m.role==='bot'?'flex-start':'flex-end'}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.08)',marginBottom:3,fontFamily:'Georgia,serif'}}>{m.role==='bot'?`FLOW · ${m.ts}`:m.ts}</div>
            <div style={{maxWidth:'78%',padding:'10px 16px',borderRadius:m.role==='bot'?'16px 16px 16px 3px':'16px 16px 3px 16px',fontSize:13,lineHeight:1.7,color:m.role==='bot'?'rgba(255,255,255,.7)':'rgba(255,255,255,.5)',background:m.role==='bot'?'rgba(255,255,255,.03)':'rgba(255,255,255,.06)',border:`0.5px solid rgba(255,255,255,${m.role==='bot'?.05:.08})`,fontFamily:'Georgia,serif'}}>{m.isVoice&&m.role==='user'?`🎤 "${m.text}"`:m.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Quick Actions Bar
function QuickActions({onFocus,onBreath,onMood,onGratitude,onJournal,onHabits,onRadar,onDecision,onCapsule,onAlterEgo,onEnergy,onRant,onConfess,onWeekly,onIntentions,onWisdom,onChallenge,onLetter,alterEgo,habitsDone,intentionsDone}:{
  onFocus:()=>void;onBreath:()=>void;onMood:()=>void;onGratitude:()=>void;onJournal:()=>void;
  onHabits:()=>void;onRadar:()=>void;onDecision:()=>void;onCapsule:()=>void;onAlterEgo:()=>void;
  onEnergy:()=>void;onRant:()=>void;onConfess:()=>void;onWeekly:()=>void;onIntentions:()=>void;
  onWisdom:()=>void;onChallenge:()=>void;onLetter:()=>void;
  alterEgo:AlterEgo;habitsDone:number;intentionsDone:number
}){
  const btns=[
    {icon:'⏱',label:'focus',onClick:onFocus,color:'rgba(180,178,169,.6)'},
    {icon:'◯',label:'respirație',onClick:onBreath,color:'rgba(130,180,255,.6)'},
    {icon:'📊',label:'mood',onClick:onMood,color:'rgba(200,170,255,.6)'},
    {icon:'🌱',label:'recunoștință',onClick:onGratitude,color:'rgba(160,220,180,.6)'},
    {icon:'📝',label:'jurnal',onClick:onJournal,color:'rgba(180,178,169,.6)'},
    {icon:'◈',label:`obiceiuri${habitsDone>0?` ·${habitsDone}`:''}`,onClick:onHabits,color:'rgba(255,200,80,.6)'},
    {icon:'⬡',label:'roata vieții',onClick:onRadar,color:'rgba(130,180,255,.6)'},
    {icon:'⊕',label:'decizie',onClick:onDecision,color:'rgba(67,217,163,.6)'},
    {icon:'✉',label:'capsulă',onClick:onCapsule,color:'rgba(180,178,169,.5)'},
    {icon:ALTER_EGO_DATA[alterEgo].icon,label:'mod',onClick:onAlterEgo,color:ALTER_EGO_DATA[alterEgo].color.replace('rgba','rgba').includes('rgba')?ALTER_EGO_DATA[alterEgo].color:'rgba(180,178,169,.6)'},
    {icon:'⚡',label:'energie',onClick:onEnergy,color:'rgba(255,215,0,.6)'},
    {icon:'∿',label:'eliberare',onClick:onRant,color:'rgba(220,130,130,.6)'},
    {icon:'◎',label:'confesiune',onClick:onConfess,color:'rgba(180,170,255,.6)'},
    {icon:'◑',label:'insight',onClick:onWeekly,color:'rgba(200,170,255,.6)'},
    {icon:'◇',label:`intenții${intentionsDone>0?` ·${intentionsDone}`:''}`,onClick:onIntentions,color:'rgba(180,178,169,.6)'},
    {icon:'∞',label:'înțelepciune',onClick:onWisdom,color:'rgba(180,178,169,.5)'},
    {icon:'◆',label:'provocare',onClick:onChallenge,color:'rgba(255,180,80,.6)'},
    {icon:'✦',label:'scrisoare',onClick:onLetter,color:'rgba(180,178,169,.5)'},
  ]
  return(
    <div style={{display:'flex',gap:6,padding:'4px 16px',overflowX:'auto',scrollbarWidth:'none',flexShrink:0,position:'relative',zIndex:3}}>
      {btns.map(b=>(
        <button key={b.label} onClick={b.onClick} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'5px 8px',borderRadius:10,border:`0.5px solid ${b.color.replace('.6','.15').replace('.5','.12')}`,background:`${b.color.replace('.6','.04').replace('.5','.03')}`,cursor:'pointer',flexShrink:0,transition:'all .2s'}}>
          <span style={{fontSize:13,fontFamily:'monospace',color:b.color}}>{b.icon}</span>
          <span style={{fontSize:7,color:b.color,fontFamily:'Georgia,serif',letterSpacing:'.03em',whiteSpace:'nowrap'}}>{b.label}</span>
        </button>
      ))}
    </div>
  )
}

const defaultMotivation:MotivationState={xp:0,level:1,streak:0,lastActiveDate:'',graceDayUsed:false,totalSessions:0,badges:[],weeklyXP:[]}

export default function Flow({userId}:{userId?:string}){
  const [msgs,setMsgs]=useState<Msg[]>([{role:'bot',text:'Bună. Cum te simți azi? Un cuvânt e suficient.',mood:'happy',ts:'acum'}])
  const [mood,setMood]=useState<Mood>('happy')
  const [speaking,setSpeaking]=useState(false)
  const [voiceOpen,setVoiceOpen]=useState(false)
  const [voiceMode,setVoiceMode]=useState<VoiceMode>('idle')
  const [voText,setVoText]=useState('Apasă și vorbește.')
  const [input,setInput]=useState('')
  const [status,setStatus]=useState('')
  const [burst,setBurst]=useState(0)
  const [isListening,setIsListening]=useState(false)
  const [currentBotText,setCurrentBotText]=useState('Bună. Cum te simți azi? Un cuvânt e suficient.')
  const [showTyping,setShowTyping]=useState(false)
  const [pendingUserText,setPendingUserText]=useState('')
  const [depthXP,setDepthXP]=useState(0)
  const [tasks,setTasks]=useState<Task[]>(()=>{if(typeof window==='undefined')return[];const s=localStorage.getItem('flow-tasks');return s?JSON.parse(s):[]})
  const [showTasks,setShowTasks]=useState(false)
  const [showChat,setShowChat]=useState(false)
  const [showGames,setShowGames]=useState(false)
  const [currentProposal,setCurrentProposal]=useState<GameProposal|null>(null)
  const msgCountRef=useRef(0)
  const lastProposedAtRef=useRef(0)
  // Feature states
  const [alterEgo,setAlterEgo]=useState<AlterEgo>('none')
  const [moodHistory,setMoodHistory]=useState<MoodEntry[]>(()=>{if(typeof window==='undefined')return[];const s=localStorage.getItem('flow-mood-history');return s?JSON.parse(s):[]})
  const [gratitude,setGratitude]=useState<GratitudeEntry[]>(()=>{if(typeof window==='undefined')return[];const s=localStorage.getItem('flow-gratitude');return s?JSON.parse(s):[]})
  const [journals,setJournals]=useState<JournalEntry[]>(()=>{if(typeof window==='undefined')return[];const s=localStorage.getItem('flow-journals');return s?JSON.parse(s):[]})
  const [habits,setHabits]=useState<HabitEntry[]>(()=>{if(typeof window==='undefined')return[];const s=localStorage.getItem('flow-habits');return s?JSON.parse(s):[]})
  const [lifeAreas,setLifeAreas]=useState<LifeAreaScore[]>(()=>{if(typeof window==='undefined')return([{area:'cariera',score:5},{area:'relatii',score:5},{area:'sanatate',score:5},{area:'bani',score:5},{area:'creatie',score:5},{area:'spirit',score:5}] as LifeAreaScore[]);const s=localStorage.getItem('flow-life-areas');return s?JSON.parse(s):[{area:'cariera',score:5},{area:'relatii',score:5},{area:'sanatate',score:5},{area:'bani',score:5},{area:'creatie',score:5},{area:'spirit',score:5}]})
  const [energyHistory,setEnergyHistory]=useState<EnergyEntry[]>(()=>{if(typeof window==='undefined')return[];const s=localStorage.getItem('flow-energy');return s?JSON.parse(s):[]})
  const [capsules,setCapsules]=useState<{text:string;date:string;openDate:string}[]>(()=>{if(typeof window==='undefined')return[];const s=localStorage.getItem('flow-capsules');return s?JSON.parse(s):[]})
  const [intentions,setIntentions]=useState<Intention[]>(()=>{if(typeof window==='undefined')return[];const s=localStorage.getItem('flow-intentions');return s?JSON.parse(s):[]})
  // Overlay states
  const [showFocus,setShowFocus]=useState(false)
  const [showBreath,setShowBreath]=useState(false)
  const [showMoodTracker,setShowMoodTracker]=useState(false)
  const [showGratitude,setShowGratitude]=useState(false)
  const [showJournal,setShowJournal]=useState(false)
  const [showHabits,setShowHabits]=useState(false)
  const [showRadar,setShowRadar]=useState(false)
  const [showDecision,setShowDecision]=useState(false)
  const [showCapsule,setShowCapsule]=useState(false)
  const [showAlterEgo,setShowAlterEgo]=useState(false)
  const [showEnergy,setShowEnergy]=useState(false)
  const [showRant,setShowRant]=useState(false)
  const [showConfess,setShowConfess]=useState(false)
  const [showWeekly,setShowWeekly]=useState(false)
  const [showIntentions,setShowIntentions]=useState(false)
  const [showWisdom,setShowWisdom]=useState(false)
  const [showChallenge,setShowChallenge]=useState(false)
  const [showLetter,setShowLetter]=useState(false)
  const [motivation,setMotivation]=useState<MotivationState>(()=>{if(typeof window==='undefined')return defaultMotivation;const s=localStorage.getItem('flow-motivation');return s?JSON.parse(s):defaultMotivation})
  const [newBadges,setNewBadges]=useState<string[]>([])
  const {current:achievement,dismiss,checkAndShow}=useAchievements()
  const voiceBuffer=useRef('')
  const recRef=useRef<any>(null)
  const sessionStart=useRef(Date.now())
  const {bgMood,intensity,kwParticles}=useDynamicBg(msgs,MOODS[mood].bg)
  useSyncProgress(motivation,{product:'flow'})
  useEffect(()=>{return()=>{stopSpeaking();try{recRef.current?.stop()}catch(e){}}},[])
  const now=()=>new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const saveTasks=(t:Task[])=>{setTasks(t);localStorage.setItem('flow-tasks',JSON.stringify(t))}
  const addTask=(text:string)=>{if(!text.trim())return;const t=[...tasks,{id:Date.now(),text:text.trim(),done:false}];saveTasks(t)}
  const toggleTask=(id:number)=>{const u=tasks.map(t=>t.id===id?{...t,done:!t.done}:t);saveTasks(u);if(u.find(t=>t.id===id&&t.done))awardXP(1)}
  const removeTask=(id:number)=>saveTasks(tasks.filter(t=>t.id!==id))

  const trackMood=(m:Mood)=>{
    const today=new Date().toDateString()
    const entry:MoodEntry={date:today,mood:m,score:MOODS[m].score}
    const updated=[...moodHistory.filter(e=>e.date!==today),entry]
    setMoodHistory(updated);localStorage.setItem('flow-mood-history',JSON.stringify(updated))
  }

  const addGratitude=(text:string)=>{
    const updated=[...gratitude,{date:new Date().toDateString(),text}]
    setGratitude(updated);localStorage.setItem('flow-gratitude',JSON.stringify(updated));awardXP(2)
  }

  const addJournal=(prompt:string,text:string)=>{
    const updated=[...journals,{date:new Date().toDateString(),prompt,text}]
    setJournals(updated);localStorage.setItem('flow-journals',JSON.stringify(updated));awardXP(3)
  }

  const doneHabit=(id:string)=>{
    const updated=habits.map(h=>h.id===id?{...h,lastDone:new Date().toDateString(),streak:h.lastDone===new Date(Date.now()-86400000).toDateString()?h.streak+1:1}:h)
    setHabits(updated);localStorage.setItem('flow-habits',JSON.stringify(updated));awardXP(1)
  }

  const addHabit=(name:string,icon:string)=>{
    const updated=[...habits,{id:Date.now().toString(),name,icon,streak:0,lastDone:''}]
    setHabits(updated);localStorage.setItem('flow-habits',JSON.stringify(updated))
  }

  const updateLifeArea=(area:LifeArea,score:number)=>{
    const updated=lifeAreas.map(a=>a.area===area?{...a,score}:a)
    setLifeAreas(updated);localStorage.setItem('flow-life-areas',JSON.stringify(updated))
  }

  const addEnergy=(level:number)=>{
    const entry:EnergyEntry={date:new Date().toDateString(),hour:new Date().getHours(),level}
    const updated=[...energyHistory,entry]
    setEnergyHistory(updated);localStorage.setItem('flow-energy',JSON.stringify(updated))
  }

  const addCapsule=(text:string,openDate:string)=>{
    const updated=[...capsules,{text,date:new Date().toDateString(),openDate}]
    setCapsules(updated);localStorage.setItem('flow-capsules',JSON.stringify(updated))
  }

  const addIntention=(text:string)=>{
    const updated=[...intentions,{text,date:new Date().toDateString(),done:false}]
    setIntentions(updated);localStorage.setItem('flow-intentions',JSON.stringify(updated))
  }

  const doneIntention=(i:number)=>{
    const updated=intentions.map((x,j)=>j===i?{...x,done:true}:x)
    setIntentions(updated);localStorage.setItem('flow-intentions',JSON.stringify(updated));awardXP(1)
  }

  const awardXP=useCallback((count:number)=>{
    const mins=Math.floor((Date.now()-sessionStart.current)/60000);const earned=calcXP(count,'😊',mins)
    let updated=updateStreak(motivation);updated={...updated,xp:updated.xp+earned,totalSessions:updated.totalSessions+1,weeklyXP:[...(updated.weeklyXP||[]).slice(-6),earned]}
    const unlocked=checkNewBadges(updated);updated.badges=[...updated.badges,...unlocked]
    setNewBadges(unlocked);setMotivation(updated);localStorage.setItem('flow-motivation',JSON.stringify(updated));checkAndShow(motivation,updated,earned,{})
  },[motivation,checkAndShow])

  const wispSpeak=useCallback((text:string,m:Mood,onDone?:()=>void)=>{
    speak(text,'flow',{onStart:()=>{setSpeaking(true);setMood(m);setStatus('vorbesc')},onEnd:()=>{setSpeaking(false);setMood('happy');setStatus('');onDone?.()},onError:()=>{setSpeaking(false);setMood('happy');setStatus('');onDone?.()}})
  },[])

  const buildPrompt=()=>{
    let base=`Ești FLOW, un confident nocturn pentru adulți. Ești calm, fără judecată, deschis la orice subiect — relații, decizii grele, gânduri întunecate, stres, viață. Nu predici niciodată. Nu dai sfaturi nesolicitate. Asculți mai mult decât vorbești. Pui întrebări scurte și directe. Ajuți și cu productivitate. Răspunsuri scurte — max 2 propoziții. Răspunzi în română. Fără asteriscuri.`
    if(alterEgo!=='none')base+=` IMPORTANT: ${ALTER_EGO_DATA[alterEgo].prompt}`
    return base
  }

  const getReply=async(history:Msg[],text:string)=>{
    if(text.startsWith('[RANT'))return{text:'ai eliberat-o. cum te simți acum?',mood:'happy' as Mood}
    if(text.startsWith('[CONFESS'))return{text:'primit. nu judec. nu țin minte.',mood:'love' as Mood}
    if(text.startsWith('[DECISION'))return{text:'hai să analizăm asta împreună. ce e mai important pentru tine — rațiunea sau instinctul?',mood:'think' as Mood}
    try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],systemContext:buildPrompt()})});const d=await res.json();return{text:d.message||'Înțeles.',mood:detectMood(d.message||'')}}
    catch{return{text:'Eroare. Încearcă din nou.',mood:'sad' as Mood}}
  }

  const proposeGame=(currentMsgs:Msg[])=>{
    const game=GAME_SUGGESTIONS[Math.floor(Math.random()*GAME_SUGGESTIONS.length)]
    const text=BORED_TEXTS_FLOW[Math.floor(Math.random()*BORED_TEXTS_FLOW.length)]
    setCurrentProposal({...game});setCurrentBotText(text)
    setMsgs(p=>[...p,{role:'bot' as const,text,mood:'happy',ts:now(),gameProposal:{...game}}])
    lastProposedAtRef.current=msgCountRef.current;wispSpeak(text,'happy')
  }

  const sendMsg=async(text:string,isVoice=false)=>{
    if(!text.trim())return
    setCurrentProposal(null);setDepthXP(p=>Math.min(p+calcDepthXP(text),100))
    const m=detectMood(text);trackMood(m);msgCountRef.current+=1
    setPendingUserText(text)
    const currentMsgs=[...msgs,{role:'user' as const,text,mood:m,ts:now(),isVoice}]
    setMsgs(currentMsgs);setMood('think');setStatus('procesez');setShowTyping(true);setCurrentBotText('')
    const reply=await getReply(msgs,text)
    setShowTyping(false);setPendingUserText('')
    setMsgs(p=>[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice}])
    setCurrentBotText(reply.text);setMood(reply.mood);setBurst(b=>b+1);awardXP(1);wispSpeak(reply.text,reply.mood)
    if(shouldProposeGame(currentMsgs,msgCountRef.current,lastProposedAtRef.current))setTimeout(()=>proposeGame(currentMsgs),1200)
  }

  const handleAcceptGame=()=>{setShowGames(true);setCurrentProposal(null)}
  const handleDeclineGame=()=>{
    setCurrentProposal(prev=>prev?{...prev,declined:true}:null)
    setTimeout(()=>{setCurrentBotText('ok, când vrei să joci, știi unde să mă găsești.');setCurrentProposal(null)},400)
  }

  const startVoiceRec=()=>{const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){setVoText('Necesită Chrome.');return}voiceBuffer.current='';const rec=new SR();rec.lang='ro-RO';rec.continuous=true;rec.interimResults=true;rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)voiceBuffer.current+=e.results[i][0].transcript+' ';else t+=e.results[i][0].transcript}setVoText((voiceBuffer.current+t)||'...')};rec.onerror=()=>{};rec.start();recRef.current=rec;setVoiceMode('recording');setVoText('...');setMood('think');setIsListening(true)}
  const finishVoiceRec=()=>{try{recRef.current?.stop()}catch(e){};setIsListening(false);const text=voiceBuffer.current.trim();if(!text){setVoiceMode('idle');setVoText('Nu am detectat nimic.');return}setVoiceMode('analyzing');setMood('think');sendVoiceMsg(text)}
  const sendVoiceMsg=async(text:string)=>{
    const m=detectMood(text);trackMood(m);setPendingUserText(text)
    setMsgs(p=>[...p,{role:'user' as const,text,mood:m,ts:now(),isVoice:true}]);setShowTyping(true);setCurrentBotText('')
    const reply=await getReply(msgs,text)
    setShowTyping(false);setPendingUserText('')
    setMsgs(p=>[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice:true}])
    setCurrentBotText(reply.text);setMood(reply.mood);setVoText(reply.text);setBurst(b=>b+1);awardXP(1)
    setVoiceMode('responding');wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('Sunt gata.')})
  }
  const toggleMic=()=>{if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('');return}const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){alert('Necesită Chrome.');return}const rec=new SR();rec.lang='ro-RO';rec.continuous=false;rec.interimResults=true;rec.onstart=()=>{setIsListening(true);setMood('think');setStatus('ascult')};rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setInput(t);if(e.results[e.results.length-1].isFinal){try{rec.stop()}catch(e){};setIsListening(false);setStatus('');sendMsg(t)}};rec.onerror=()=>{setIsListening(false);setStatus('')};rec.start();recRef.current=rec}
  const handleVoBtn=()=>{if(voiceMode==='idle')startVoiceRec();else if(voiceMode==='recording')finishVoiceRec();else if(voiceMode==='responding'){stopSpeaking();setSpeaking(false);setVoiceMode('idle');setVoText('Sunt gata.')}}

  const doneTasks=tasks.filter(t=>t.done).length
  const totalTasks=tasks.length
  const progressPct=totalTasks>0?Math.round(doneTasks/totalTasks*100):0
  const todayHabitsDone=habits.filter(h=>h.lastDone===new Date().toDateString()).length
  const todayIntentionsDone=intentions.filter(i=>i.date===new Date().toDateString()&&!i.done).length

  return(
    <div style={{height:'100vh',background:'#060608',display:'flex',flexDirection:'column',fontFamily:'"Georgia",serif',position:'relative',overflow:'hidden',color:'rgba(255,255,255,.85)'}}>
      <style>{`
        @keyframes burst{0%{opacity:.7;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.2) rotate(var(--rot))}}
        @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes breathe-av{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.02)}}
        @keyframes wave{0%,100%{opacity:.06;transform:translate(-50%,-50%) scale(1)}50%{opacity:.15;transform:translate(-50%,-50%) scale(1.06)}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes cursor-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes text-appear{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes user-fade{0%{opacity:.5}50%{opacity:.35}100%{opacity:.15}}
      `}</style>

      <DynamicBackground mood={bgMood} intensity={intensity} keywordParticles={kwParticles}/>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 18px',flexShrink:0,position:'relative',zIndex:3,borderBottom:'0.5px solid rgba(255,255,255,.04)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:'rgba(200,198,191,.4)',letterSpacing:'.2em',fontFamily:'Georgia,serif'}}>FLOW</span>
          <span style={{fontSize:9,color:'rgba(255,255,255,.1)'}}>{MOODS[mood].sym}</span>
          {alterEgo!=='none'&&<span style={{fontSize:9,color:ALTER_EGO_DATA[alterEgo].color,fontFamily:'Georgia,serif',fontStyle:'italic'}}>{ALTER_EGO_DATA[alterEgo].name}</span>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <button onClick={()=>setShowTasks(v=>!v)} style={{padding:'3px 8px',borderRadius:16,fontSize:9,border:'0.5px solid rgba(255,255,255,.06)',background:'transparent',color:'rgba(255,255,255,.18)',cursor:'pointer',fontFamily:'Georgia,serif'}}>
            {showTasks?'− tasks':`tasks${totalTasks>0?` (${doneTasks}/${totalTasks})`:''}`}
          </button>
          <button onClick={()=>setShowChat(true)} style={{padding:'3px 8px',borderRadius:16,fontSize:9,border:'0.5px solid rgba(255,255,255,.06)',background:'transparent',color:'rgba(255,255,255,.18)',cursor:'pointer',fontFamily:'Georgia,serif'}}>≡ chat</button>
          <button onClick={()=>setShowGames(true)} style={{padding:'3px 8px',borderRadius:16,fontSize:9,border:'0.5px solid rgba(255,255,255,.06)',background:'transparent',color:'rgba(255,255,255,.18)',cursor:'pointer'}}>🧠</button>
          <button onClick={()=>setVoiceOpen(true)} style={{padding:'3px 8px',borderRadius:16,fontSize:9,border:'0.5px solid rgba(255,255,255,.06)',background:'transparent',color:'rgba(255,255,255,.18)',cursor:'pointer',fontFamily:'Georgia,serif'}}>○ voice</button>
        </div>
      </div>

      <div style={{padding:'0 18px',flexShrink:0,position:'relative',zIndex:3}}>
        <XPBar state={motivation} newBadges={newBadges}/>
      </div>
      <DepthBar level={depthXP}/>

      {/* QUICK ACTIONS */}
      <QuickActions
        onFocus={()=>setShowFocus(true)} onBreath={()=>setShowBreath(true)}
        onMood={()=>setShowMoodTracker(true)} onGratitude={()=>setShowGratitude(true)}
        onJournal={()=>setShowJournal(true)} onHabits={()=>setShowHabits(true)}
        onRadar={()=>setShowRadar(true)} onDecision={()=>setShowDecision(true)}
        onCapsule={()=>setShowCapsule(true)} onAlterEgo={()=>setShowAlterEgo(true)}
        onEnergy={()=>setShowEnergy(true)} onRant={()=>setShowRant(true)}
        onConfess={()=>setShowConfess(true)} onWeekly={()=>setShowWeekly(true)}
        onIntentions={()=>setShowIntentions(true)} onWisdom={()=>setShowWisdom(true)}
        onChallenge={()=>setShowChallenge(true)} onLetter={()=>setShowLetter(true)}
        alterEgo={alterEgo} habitsDone={todayHabitsDone} intentionsDone={todayIntentionsDone}
      />

      {/* TASKS */}
      {showTasks&&(
        <div style={{margin:'4px 16px',padding:'10px 14px',background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.04)',borderRadius:10,flexShrink:0,position:'relative',zIndex:3,animation:'fade-in .3s ease-out'}}>
          {totalTasks>0&&<div style={{height:1,background:'rgba(255,255,255,.04)',marginBottom:8,position:'relative'}}><div style={{position:'absolute',left:0,top:0,height:'100%',background:'rgba(255,255,255,.15)',width:`${progressPct}%`,transition:'width .4s ease'}}/></div>}
          <div style={{display:'flex',gap:6,marginBottom:6}}>
            <input onKeyDown={e=>{if(e.key==='Enter'&&(e.target as HTMLInputElement).value.trim()){addTask((e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value=''}}} placeholder="task nou…" style={{flex:1,background:'transparent',border:'none',borderBottom:'0.5px solid rgba(255,255,255,.06)',padding:'3px 0',color:'rgba(255,255,255,.4)',fontSize:11,outline:'none',fontFamily:'Georgia,serif'}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:80,overflowY:'auto',scrollbarWidth:'none'}}>
            {tasks.map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:8}}>
                <button onClick={()=>toggleTask(t.id)} style={{width:10,height:10,borderRadius:'50%',border:`0.5px solid ${t.done?'rgba(255,255,255,.25)':'rgba(255,255,255,.12)'}`,background:t.done?'rgba(255,255,255,.08)':'transparent',cursor:'pointer',flexShrink:0,fontSize:6,color:'rgba(255,255,255,.4)'}}>{t.done?'✓':''}</button>
                <span style={{flex:1,fontSize:11,color:t.done?'rgba(255,255,255,.18)':'rgba(255,255,255,.5)',textDecoration:t.done?'line-through':'none',fontFamily:'Georgia,serif'}}>{t.text}</span>
                <button onClick={()=>removeTask(t.id)} style={{background:'none',border:'none',color:'rgba(255,255,255,.06)',fontSize:10,cursor:'pointer',padding:0}}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CENTRU */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',zIndex:2,padding:'0 24px'}}>
        <div style={{position:'relative',animation:'breathe-av 5s ease-in-out infinite',marginBottom:24}}>
          <Burst mood={mood} trigger={burst}/>
          <Avatar mood={mood} speaking={speaking} size={130} waves={true}/>
        </div>
        {status&&<div style={{fontSize:10,color:'rgba(255,255,255,.12)',letterSpacing:'.1em',marginBottom:14,animation:'fade-in .4s ease-out',fontFamily:'Georgia,serif'}}>{status}</div>}
        <div style={{maxWidth:300,textAlign:'center',minHeight:80}}>
          {showTyping?(
            <div style={{display:'flex',gap:5,justifyContent:'center',alignItems:'center',height:80}}>
              {[0,.2,.4].map((d,i)=><span key={i} style={{width:4,height:4,borderRadius:'50%',background:'rgba(255,255,255,.18)',display:'inline-block',animation:`tdot 1.3s ${d}s infinite`}}/>)}
            </div>
          ):currentProposal?(
            <GameProposalCard proposal={currentProposal} botText={currentBotText} onAccept={handleAcceptGame} onDecline={handleDeclineGame}/>
          ):(
            <div key={currentBotText} style={{fontSize:16,lineHeight:1.9,color:'rgba(255,255,255,.75)',fontFamily:'Georgia,serif',fontWeight:300,letterSpacing:'.01em',animation:'text-appear .6s ease-out'}}>
              <TypingMsg text={currentBotText} speed={50}/>
            </div>
          )}
        </div>
        {pendingUserText&&<div style={{marginTop:18,fontSize:11,color:'rgba(255,255,255,.18)',fontFamily:'Georgia,serif',fontStyle:'italic',maxWidth:260,textAlign:'center',animation:'user-fade 2s ease-out forwards'}}>"{pendingUserText}"</div>}
      </div>

      {/* INPUT */}
      <div style={{padding:'0 14px 20px',flexShrink:0,position:'relative',zIndex:3}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'rgba(255,255,255,.025)',border:'0.5px solid rgba(255,255,255,.055)',borderRadius:24,padding:'8px 8px 8px 16px',backdropFilter:'blur(16px)'}}>
          <textarea value={input} onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,100)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(input.trim()){sendMsg(input);setInput('')}}}} placeholder="Scrie sau vorbește…" rows={1} style={{flex:1,background:'transparent',border:'none',color:'rgba(255,255,255,.5)',fontSize:14,outline:'none',resize:'none',fontFamily:'Georgia,serif',lineHeight:1.5,maxHeight:100,overflowY:'auto',padding:0}}/>
          <div style={{display:'flex',gap:5,alignItems:'center',flexShrink:0,paddingBottom:2}}>
            <button onClick={toggleMic} style={{width:30,height:30,borderRadius:'50%',border:`0.5px solid ${isListening?'rgba(224,75,74,.3)':'rgba(255,255,255,.07)'}`,background:isListening?'rgba(224,75,74,.05)':'transparent',color:isListening?'#E24B4A':'rgba(255,255,255,.18)',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined}}>🎤</button>
            <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:30,height:30,borderRadius:'50%',border:'none',background:input.trim()?'rgba(255,255,255,.12)':'rgba(255,255,255,.03)',color:input.trim()?'rgba(255,255,255,.7)':'rgba(255,255,255,.15)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>↑</button>
          </div>
        </div>
      </div>

      {/* OVERLAYS */}
      {showChat&&<ChatOverlay msgs={msgs} onClose={()=>setShowChat(false)}/>}
      {showFocus&&<FocusTimerOverlay onClose={()=>setShowFocus(false)}/>}
      {showBreath&&<BreathingOverlay onClose={()=>setShowBreath(false)}/>}
      {showMoodTracker&&<MoodTrackerOverlay entries={moodHistory} onClose={()=>setShowMoodTracker(false)}/>}
      {showGratitude&&<GratitudeOverlay entries={gratitude} onAdd={addGratitude} onClose={()=>setShowGratitude(false)}/>}
      {showJournal&&<JournalOverlay entries={journals} onAdd={addJournal} onClose={()=>setShowJournal(false)}/>}
      {showHabits&&<HabitTrackerOverlay habits={habits} onDone={doneHabit} onAdd={addHabit} onClose={()=>setShowHabits(false)}/>}
      {showRadar&&<LifeRadarOverlay areas={lifeAreas} onUpdate={updateLifeArea} onClose={()=>setShowRadar(false)}/>}
      {showDecision&&<DecisionOverlay onClose={()=>setShowDecision(false)} onSend={sendMsg}/>}
      {showCapsule&&<TimeCapsuleOverlay capsules={capsules} onAdd={addCapsule} onClose={()=>setShowCapsule(false)}/>}
      {showAlterEgo&&<AlterEgoOverlay current={alterEgo} onSelect={setAlterEgo} onClose={()=>setShowAlterEgo(false)}/>}
      {showEnergy&&<EnergyOverlay entries={energyHistory} onAdd={addEnergy} onClose={()=>setShowEnergy(false)}/>}
      {showRant&&<RantOverlay onClose={()=>setShowRant(false)} onSend={sendMsg}/>}
      {showConfess&&<ConfessOverlay onClose={()=>setShowConfess(false)} onSend={sendMsg}/>}
      {showWeekly&&<WeeklyInsightOverlay msgs={msgs} moodHistory={moodHistory} onClose={()=>setShowWeekly(false)}/>}
      {showIntentions&&<IntentionsOverlay intentions={intentions} onAdd={addIntention} onDone={doneIntention} onClose={()=>setShowIntentions(false)}/>}
      {showWisdom&&<WisdomOverlay onClose={()=>setShowWisdom(false)} onSend={sendMsg}/>}
      {showChallenge&&<ChallengeOverlay onClose={()=>setShowChallenge(false)} onAccept={sendMsg}/>}
      {showLetter&&<LetterOverlay onClose={()=>setShowLetter(false)}/>}

      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'rgba(4,4,8,.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:22,zIndex:100,animation:'fade-in .5s ease-out'}}>
          <DynamicBackground mood={bgMood} intensity={40}/>
          <button onClick={()=>{setVoiceOpen(false);stopSpeaking();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('happy')}} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'rgba(255,255,255,.1)',fontSize:18,cursor:'pointer',zIndex:1}}>✕</button>
          <div style={{position:'relative',zIndex:1,animation:'breathe-av 5s ease-in-out infinite'}}>
            <Avatar mood={mood} speaking={speaking} size={150} waves={true}/>
            <Burst mood={mood} trigger={burst}/>
          </div>
          <div style={{textAlign:'center',zIndex:1}}>
            <div style={{fontSize:13,fontWeight:300,color:'rgba(200,198,191,.5)',letterSpacing:'.2em',fontFamily:'Georgia,serif'}}>FLOW</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,.12)',marginTop:3,fontFamily:'Georgia,serif'}}>{voiceMode==='idle'?'':voiceMode==='recording'?'ascult':voiceMode==='analyzing'?'procesez':'răspund'}</div>
          </div>
          <div style={{maxWidth:240,textAlign:'center',fontSize:14,color:'rgba(255,255,255,.45)',minHeight:44,lineHeight:1.9,fontFamily:'Georgia,serif',fontStyle:voiceMode==='recording'?'italic':'normal',zIndex:1}}>{voText}</div>
          <button onClick={handleVoBtn} style={{width:56,height:56,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,cursor:'pointer',border:`0.5px solid rgba(180,178,169,${voiceMode==='recording'?.1:voiceMode==='responding'?.18:.05})`,background:voiceMode==='recording'?'rgba(224,75,74,.04)':voiceMode==='responding'?'rgba(180,178,169,.04)':'transparent',animation:voiceMode==='recording'?'rpulse 1s infinite':undefined,transition:'all .4s',color:'rgba(200,198,191,.4)',zIndex:1}}>
            {voiceMode==='idle'?'○':voiceMode==='recording'?'◼':voiceMode==='analyzing'?'◐':'◎'}
          </button>
        </div>
      )}

      <AchievementPopup achievement={achievement} onDone={dismiss} theme="dark"/>
      {showGames&&<CognitiveGames product="flow" onClose={()=>setShowGames(false)}/>}
    </div>
  )
}