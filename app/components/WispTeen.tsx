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

type Mood = 'idle'|'process'|'focus'|'low'|'error'|'boost'|'sync'
type VoiceMode = 'idle'|'recording'|'analyzing'|'responding'
type AlterEgo = 'none'|'hacker'|'artist'|'filosof'|'rebel'|'geniu'
interface Msg{role:'user'|'bot';text:string;mood:Mood;ts:string;isVoice?:boolean}
interface GameProposal{gameId:string;gameName:string;gameIcon:string;gameColor:string;declined?:boolean}
interface Mission{id:string;text:string;xp:number;done:boolean;date:string}
interface MoodEntry{date:string;mood:Mood;score:number}

const MOODS:Record<Mood,{sym:string;label:string;color:string;bursts:string[];bg:BgMood}> = {
  idle:    {sym:'◎',label:'chill',  color:'rgba(160,170,255,.8)',bursts:['◎','○','·','◦'],bg:'neutral'},
  process: {sym:'◐',label:'gândesc',color:'rgba(200,170,255,.8)',bursts:['◐','◑','◒','·'],bg:'process'},
  focus:   {sym:'◈',label:'focus',  color:'rgba(130,180,255,.8)',bursts:['◈','◆','▸','·'],bg:'focus'},
  low:     {sym:'◌',label:'obosit', color:'rgba(140,140,180,.6)',bursts:['◌','○','·','◦'],bg:'low'},
  error:   {sym:'◍',label:'greu',   color:'rgba(220,130,130,.8)',bursts:['◍','○','·'],bg:'error'},
  boost:   {sym:'◉',label:'rebel',  color:'rgba(160,220,180,.8)',bursts:['◉','◎','○','·'],bg:'rebel'},
  sync:    {sym:'⟡',label:'ok',     color:'rgba(180,170,255,.8)',bursts:['⟡','◎','○','·'],bg:'sync'},
}

const ALTER_EGO_DATA:Record<AlterEgo,{icon:string;name:string;color:string;prompt:string}> = {
  none:    {icon:'◎',name:'default',color:'rgba(160,170,255,.8)',prompt:''},
  hacker:  {icon:'⌨',name:'Hacker',color:'#43D9A3',prompt:'Răspunde ca un hacker cool — tehnic, cu referințe la cod, terminale, sisteme. Folosește termeni tech dar rămâi ușor de înțeles.'},
  artist:  {icon:'🎨',name:'Artist',color:'#FF6584',prompt:'Răspunde ca un artist sensibil — metafore, emoții, culori, muzică. Totul are o dimensiune artistică.'},
  filosof: {icon:'∞',name:'Filosof',color:'#E040FB',prompt:'Răspunde ca un filosof tânăr — întrebări profunde, paradoxuri, gândire critică. Pune totul sub semnul întrebării.'},
  rebel:   {icon:'⚡',name:'Rebel',color:'#FFEB3B',prompt:'Răspunde ca un rebel autentic — anti-sistem, sarcastic față de reguli, dar cu substanță. Nu moralizezi, dar nici nu ești iresponsabil.'},
  geniu:   {icon:'◈',name:'Geniu',color:'#00BCD4',prompt:'Răspunde ca un geniu — date rapide, conexiuni neașteptate între subiecte, fascinat de detalii neobișnuite.'},
}

const MISSIONS_POOL:Omit<Mission,'done'|'date'>[] = [
  {id:'m1',text:'Vorbește cu cineva cu care nu ai mai vorbit de o săptămână',xp:20},
  {id:'m2',text:'Învață un lucru random fascinant azi',xp:15},
  {id:'m3',text:'Fă ceva ce ți-e puțin frică — orice mic lucru',xp:25},
  {id:'m4',text:'Oprește telefonul 30 de minute și nu face nimic',xp:30},
  {id:'m5',text:'Scrie 3 lucruri pentru care ești recunoscător azi',xp:10},
  {id:'m6',text:'Fă mișcare — măcar 10 minute',xp:15},
  {id:'m7',text:'Citește ceva — orice, măcar o pagină',xp:10},
  {id:'m8',text:'Ascultă un album întreg fără să faci altceva',xp:20},
  {id:'m9',text:'Explică ceva ce știi cuiva care nu știe',xp:15},
  {id:'m10',text:'Fă ceva creativ — desenează, scrie, construiește ceva',xp:25},
]

const ROASTS = [
  'bro... asta e cel mai mic scor pe care l-am văzut vreodată 💀',
  'serios? și tu te consideri deștept? 😭',
  'creierul tău era în vacanță sau ce?',
  'nici bunica mea nu ar fi dat un scor atât de mic',
  'ok dar... poate încearcă cu ochii deschiși data viitoare',
  'știi că un hamster a bătut asta odată?',
]

const GAME_SUGGESTIONS = [
  {gameId:'math',gameName:'Math Sprint',gameIcon:'⚡',gameColor:'#43D9A3'},
  {gameId:'stroop',gameName:'Stroop',gameIcon:'🌈',gameColor:'#E040FB'},
  {gameId:'reaction',gameName:'Reaction',gameIcon:'⚡',gameColor:'#FFEB3B'},
  {gameId:'oddone',gameName:'Odd One Out',gameIcon:'🧩',gameColor:'#00BCD4'},
  {gameId:'schulte',gameName:'Schulte',gameIcon:'🔢',gameColor:'#6C63FF'},
  {gameId:'wordchain',gameName:'Word Chain',gameIcon:'📝',gameColor:'#FF5722'},
]

const BORED_TEXTS_TEEN = [
  'bă, hai să jucăm ceva — 60 secunde și creierul tău o să zboare.',
  'stai, am ceva mai interesant. un joc rapid, dacă te plictisești.',
  'știi ce? un mini-joc ar fi mai util acum.',
  'pauză de gânduri grele. ai chef de o provocare rapidă?',
  'ok serios, ai nevoie de un break. 60 secunde, hai.',
]

function shouldProposeGame(msgs:Msg[],msgCount:number,lastProposedAt:number):boolean{
  if(msgCount-lastProposedAt<4)return false
  if(msgCount-lastProposedAt>=4)return Math.random()<0.6
  return false
}

function detectMood(t:string):Mood{
  const s=t.toLowerCase()
  if(/super|wow|fire|tare|hype|rebel|scap/.test(s))return 'boost'
  if(/de ce|cum|explic|înțeleg|hmm|lecție|tema/.test(s))return 'process'
  if(/trist|rău|greu|nu pot|ajutor|deprimat/.test(s))return 'error'
  if(/obosit|somnoros|epuizat|nu mai/.test(s))return 'low'
  if(/cod|build|proiect|muzic|scri|dev|tema/.test(s))return 'focus'
  if(/mulțumesc|mișto|respect|cool|ok/.test(s))return 'sync'
  return 'idle'
}

function moodScore(m:Mood):number{
  return{idle:5,process:6,focus:8,low:2,error:1,boost:9,sync:7}[m]||5
}

function useTypingText(fullText:string,active:boolean,speed=35){
  const [d,setD]=useState('')
  useEffect(()=>{
    if(!active||!fullText){setD(fullText);return}
    setD('');let i=0
    const id=setInterval(()=>{i++;setD(fullText.slice(0,i));if(i>=fullText.length)clearInterval(id)},speed)
    return()=>clearInterval(id)
  },[fullText,active,speed])
  return d
}
function TypingMsg({text,speed=35,color}:{text:string;speed?:number;color:string}){
  const d=useTypingText(text,true,speed)
  return <>{d}<span style={{color,opacity:d.length<text.length?1:0,animation:'blink-cur 1.4s infinite'}}>|</span></>
}

// ─── OVERLAY COMPONENTS ───────────────────────────────────────────────────────

function RantOverlay({onClose,onSend}:{onClose:()=>void;onSend:(t:string)=>void}){
  const [text,setText]=useState('')
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,3,10,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:'rgba(220,130,130,.9)'}}>💢 RANT MODE</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>scrie tot ce ai pe suflet. fără filtru. fără judecată.</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="dă-i drumul..." autoFocus
        style={{flex:1,background:'rgba(220,130,130,.04)',border:'1px solid rgba(220,130,130,.15)',borderRadius:16,padding:16,color:'rgba(255,255,255,.8)',fontSize:14,outline:'none',resize:'none',fontFamily:'system-ui',lineHeight:1.7}}/>
      <div style={{display:'flex',gap:10,marginTop:14}}>
        <button onClick={()=>{if(text.trim()){onSend(text);onClose()}}} disabled={!text.trim()} style={{flex:1,padding:'12px 0',borderRadius:20,border:'none',background:text.trim()?'rgba(220,130,130,.6)':'rgba(255,255,255,.05)',color:'white',fontSize:13,fontWeight:700,cursor:text.trim()?'pointer':'default',transition:'all .3s'}}>trimite & eliberează</button>
        <button onClick={onClose} style={{padding:'12px 18px',borderRadius:20,border:'1px solid rgba(255,255,255,.08)',background:'transparent',color:'rgba(255,255,255,.3)',fontSize:12,cursor:'pointer'}}>anulează</button>
      </div>
    </div>
  )
}

function HomeworkOverlay({onClose,onSend}:{onClose:()=>void;onSend:(t:string)=>void}){
  const [subject,setSubject]=useState('')
  const [question,setQuestion]=useState('')
  const subjects=['Matematică','Fizică','Chimie','Biologie','Istorie','Geografie','Română','Engleză','Informatică','Altceva']
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,3,10,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:'rgba(130,180,255,.9)'}}>📚 HOMEWORK HELPER</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>explică-mi ca și cum ai fi cel mai cool profesor</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginBottom:8}}>Materia:</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
        {subjects.map(s=>(
          <button key={s} onClick={()=>setSubject(s)} style={{padding:'5px 12px',borderRadius:20,fontSize:11,border:`1px solid ${subject===s?'rgba(130,180,255,.5)':'rgba(255,255,255,.08)'}`,background:subject===s?'rgba(130,180,255,.15)':'transparent',color:subject===s?'rgba(130,180,255,.9)':'rgba(255,255,255,.4)',cursor:'pointer',transition:'all .2s'}}>{s}</button>
        ))}
      </div>
      <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginBottom:8}}>Ce nu înțelegi?</div>
      <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="scrie problema sau conceptul..." autoFocus
        style={{flex:1,background:'rgba(130,180,255,.04)',border:'1px solid rgba(130,180,255,.12)',borderRadius:16,padding:16,color:'rgba(255,255,255,.8)',fontSize:14,outline:'none',resize:'none',fontFamily:'system-ui',lineHeight:1.7}}/>
      <button onClick={()=>{if(question.trim()){onSend(`[HOMEWORK${subject?` - ${subject}`:''}] ${question}`);onClose()}}} disabled={!question.trim()} style={{marginTop:14,padding:'12px 0',borderRadius:20,border:'none',background:question.trim()?'rgba(130,180,255,.6)':'rgba(255,255,255,.05)',color:'white',fontSize:13,fontWeight:700,cursor:question.trim()?'pointer':'default',transition:'all .3s'}}>explică-mi step by step</button>
    </div>
  )
}

function AlterEgoOverlay({current,onSelect,onClose}:{current:AlterEgo;onSelect:(e:AlterEgo)=>void;onClose:()=>void}){
  const egos:AlterEgo[]=['none','hacker','artist','filosof','rebel','geniu']
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,3,10,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:'white'}}>ALTER EGO</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>alege cum vrei să vorbesc cu tine</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10,flex:1}}>
        {egos.map(e=>{
          const d=ALTER_EGO_DATA[e]
          return(
            <button key={e} onClick={()=>{onSelect(e);onClose()}} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:14,border:`1px solid ${current===e?d.color+'66':'rgba(255,255,255,.06)'}`,background:current===e?d.color+'11':'rgba(255,255,255,.02)',cursor:'pointer',transition:'all .2s',textAlign:'left'}}>
              <span style={{fontSize:22,fontFamily:'monospace',color:d.color}}>{d.icon}</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:current===e?d.color:'rgba(255,255,255,.8)'}}>{e==='none'?'Default (normal)':d.name}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:2}}>{e==='none'?'tonul obișnuit WISP':d.prompt.slice(0,60)+'...'}</div>
              </div>
              {current===e&&<div style={{marginLeft:'auto',fontSize:10,color:d.color}}>activ</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MissionsOverlay({missions,onComplete,onClose}:{missions:Mission[];onComplete:(id:string)=>void;onClose:()=>void}){
  const today=new Date().toDateString()
  const todayMissions=missions.filter(m=>m.date===today)
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,3,10,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:'rgba(160,220,180,.9)'}}>⚡ SECRET MISSIONS</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>misiuni zilnice — rebel XP bonus</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{fontSize:10,color:'rgba(160,220,180,.4)',marginBottom:16,fontFamily:'monospace'}}>{todayMissions.filter(m=>m.done).length}/{todayMissions.length} completate azi</div>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10,scrollbarWidth:'none'}}>
        {todayMissions.map(m=>(
          <div key={m.id} style={{padding:'14px 16px',borderRadius:14,border:`1px solid ${m.done?'rgba(160,220,180,.2)':'rgba(255,255,255,.06)'}`,background:m.done?'rgba(160,220,180,.05)':'rgba(255,255,255,.02)',transition:'all .3s'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:m.done?'rgba(255,255,255,.3)':'rgba(255,255,255,.8)',textDecoration:m.done?'line-through':'none',lineHeight:1.5}}>{m.text}</div>
                <div style={{fontSize:10,color:'rgba(160,220,180,.5)',marginTop:4}}>+{m.xp} Rebel XP</div>
              </div>
              {!m.done&&(
                <button onClick={()=>onComplete(m.id)} style={{padding:'6px 14px',borderRadius:20,border:'1px solid rgba(160,220,180,.3)',background:'rgba(160,220,180,.1)',color:'rgba(160,220,180,.8)',fontSize:11,cursor:'pointer',flexShrink:0,transition:'all .2s'}}>am făcut-o</button>
              )}
              {m.done&&<span style={{fontSize:16}}>✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MoodTrackerOverlay({entries,onClose}:{entries:MoodEntry[];onClose:()=>void}){
  const last7=entries.slice(-7)
  const days=['D','L','M','M','J','V','S']
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,3,10,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:'white'}}>📊 MOOD TRACKER</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>cum ai fost în ultimele zile</div>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      {last7.length===0?(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'rgba(255,255,255,.2)'}}>începe să vorbești cu mine — îți voi urmări starea</div>
      ):(
        <>
          <div style={{display:'flex',gap:8,alignItems:'flex-end',justifyContent:'center',flex:1,maxHeight:180}}>
            {last7.map((e,i)=>{
              const h=Math.max(20,e.score*18)
              const col=MOODS[e.mood].color
              return(
                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flex:1}}>
                  <div style={{width:'100%',height:h,background:col.replace('.8','.4'),borderRadius:'6px 6px 0 0',transition:'all .5s',position:'relative'}}>
                    <div style={{position:'absolute',bottom:4,left:'50%',transform:'translateX(-50%)',fontSize:8,color:'rgba(255,255,255,.6)',fontFamily:'monospace',whiteSpace:'nowrap'}}>{e.score}</div>
                  </div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,.25)',fontFamily:'monospace'}}>{new Date(e.date).getDay()!==undefined?days[new Date(e.date).getDay()]:'?'}</div>
                  <div style={{fontSize:8,color:col.replace('.8','.6')}}>{MOODS[e.mood].sym}</div>
                </div>
              )
            })}
          </div>
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,.25)',marginBottom:10}}>legenda</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {(Object.keys(MOODS) as Mood[]).map(m=>(
                <div key={m} style={{display:'flex',alignItems:'center',gap:4}}>
                  <span style={{fontSize:10,color:MOODS[m].color}}>{MOODS[m].sym}</span>
                  <span style={{fontSize:9,color:'rgba(255,255,255,.3)'}}>{MOODS[m].label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ConfessOverlay({onClose,onSend}:{onClose:()=>void;onSend:(t:string)=>void}){
  const [text,setText]=useState('')
  const [sent,setSent]=useState(false)
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,3,10,.98)',zIndex:180,display:'flex',flexDirection:'column',padding:24,animation:'fade-in .3s ease-out'}}>
      {sent?(
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,textAlign:'center'}}>
          <div style={{fontSize:32}}>🔒</div>
          <div style={{fontSize:16,fontWeight:700,color:'rgba(180,170,255,.8)'}}>primit.</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.7,maxWidth:260}}>nu judec. nu țin minte. tu știi că ai spus-o — asta e tot ce contează.</div>
          <button onClick={onClose} style={{marginTop:10,padding:'10px 28px',borderRadius:20,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(255,255,255,.4)',cursor:'pointer'}}>închide</button>
        </div>
      ):(
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:'rgba(180,170,255,.9)'}}>🔒 CONFESS</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>anonim. fără judecată. fără memorie.</div>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.2)',fontSize:20,cursor:'pointer'}}>✕</button>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="ce ai pe suflet..." autoFocus
            style={{flex:1,background:'rgba(180,170,255,.04)',border:'1px solid rgba(180,170,255,.12)',borderRadius:16,padding:16,color:'rgba(255,255,255,.8)',fontSize:14,outline:'none',resize:'none',fontFamily:'system-ui',lineHeight:1.7}}/>
          <button onClick={()=>{if(text.trim()){onSend(`[CONFESS] ${text}`);setSent(true)}}} disabled={!text.trim()} style={{marginTop:14,padding:'12px 0',borderRadius:20,border:'none',background:text.trim()?'rgba(180,170,255,.5)':'rgba(255,255,255,.05)',color:'white',fontSize:13,fontWeight:700,cursor:text.trim()?'pointer':'default',transition:'all .3s'}}>trimite în gol</button>
        </>
      )}
    </div>
  )
}

function BattleOverlay({onClose,lastScore,gameName}:{onClose:()=>void;lastScore:number;gameName:string}){
  const botScore=useRef(Math.floor(Math.random()*80)+20).current
  const won=lastScore>botScore
  const roast=ROASTS[Math.floor(Math.random()*ROASTS.length)]
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(3,3,10,.98)',zIndex:180,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:16,animation:'fade-in .3s ease-out',textAlign:'center'}}>
      <div style={{fontSize:13,color:'rgba(255,255,255,.3)',letterSpacing:'.1em',fontFamily:'monospace'}}>BATTLE RESULTS · {gameName}</div>
      <div style={{display:'flex',gap:32,alignItems:'center'}}>
        <div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginBottom:4}}>TU</div>
          <div style={{fontSize:48,fontWeight:900,color:won?'#43D9A3':'rgba(220,130,130,.8)'}}>{lastScore}</div>
        </div>
        <div style={{fontSize:24,color:'rgba(255,255,255,.2)'}}>vs</div>
        <div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginBottom:4}}>WISP</div>
          <div style={{fontSize:48,fontWeight:900,color:won?'rgba(220,130,130,.8)':'#43D9A3'}}>{botScore}</div>
        </div>
      </div>
      <div style={{fontSize:18,fontWeight:700,color:won?'#43D9A3':'rgba(255,255,255,.6)'}}>
        {won?'ai câștigat. respect. 🔥':'ai pierdut. 💀'}
      </div>
      {!won&&<div style={{fontSize:13,color:'rgba(255,255,255,.4)',maxWidth:260,lineHeight:1.6}}>{roast}</div>}
      {won&&<div style={{fontSize:13,color:'rgba(160,220,180,.6)',maxWidth:260,lineHeight:1.6}}>n-am crezut că poți. dar uite că poți.</div>}
      <button onClick={onClose} style={{marginTop:8,padding:'10px 28px',borderRadius:20,border:'none',background:'rgba(255,255,255,.1)',color:'white',cursor:'pointer',fontSize:13}}>înapoi</button>
    </div>
  )
}

// ─── GAME PROPOSAL CARD ───────────────────────────────────────────────────────
function GameProposalCard({proposal,onAccept,onDecline,botText,mc}:{
  proposal:GameProposal;onAccept:()=>void;onDecline:()=>void;botText:string;mc:string
}){
  if(proposal.declined)return(
    <div style={{fontSize:15,color:'rgba(255,255,255,.4)',animation:'text-appear .5s ease-out',fontFamily:'monospace',letterSpacing:'.02em'}}>
      ok, știi unde sunt. oricând.
    </div>
  )
  return(
    <div style={{animation:'text-appear .6s ease-out',textAlign:'center'}}>
      <div style={{fontSize:15,lineHeight:1.8,color:'rgba(255,255,255,.8)',marginBottom:14}}>{botText}</div>
      <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:10,padding:'12px 18px',borderRadius:14,background:`${proposal.gameColor}10`,border:`1px solid ${proposal.gameColor}33`}}>
        <div style={{fontSize:26}}>{proposal.gameIcon}</div>
        <div style={{fontSize:13,fontWeight:700,color:'white',letterSpacing:'.02em'}}>{proposal.gameName}</div>
        <div style={{fontSize:10,color:'rgba(255,255,255,.35)',fontFamily:'monospace'}}>60s · cognitiv</div>
        <div style={{display:'flex',gap:8,marginTop:2}}>
          <button onClick={onAccept} style={{padding:'7px 18px',borderRadius:20,border:'none',background:proposal.gameColor,color:'white',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all .2s'}}>hai, dă-i</button>
          <button onClick={onDecline} style={{padding:'7px 14px',borderRadius:20,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(255,255,255,.3)',fontSize:11,cursor:'pointer'}}>nu acum</button>
        </div>
      </div>
    </div>
  )
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({mood,speaking,size=140,waves=false}:{mood:Mood;speaking:boolean;size?:number;waves?:boolean}){
  const col=MOODS[mood].color
  const eyeRy=mood==='low'?2.5:mood==='boost'||mood==='focus'?7:6
  const bTL=mood==='process'?'rotate(-5 30 27)':mood==='error'?'rotate(8 30 27)':mood==='boost'?'translate(0,-4)':mood==='low'?'translate(0,4)':''
  const bTR=mood==='process'?'rotate(5 60 27)':mood==='error'?'rotate(-8 60 27)':mood==='boost'?'translate(0,-4)':mood==='low'?'translate(0,4)':''
  const mouth=mood==='boost'?'M26 57 Q45 71 64 57':mood==='process'?'M33 61 Q45 61 57 61':mood==='low'?'M34 60 Q45 62 56 60':mood==='error'?'M33 64 Q45 57 57 64':'M30 58 Q45 68 60 58'
  const [mf,setMf]=useState(0)
  useEffect(()=>{if(!speaking)return;const id=setInterval(()=>setMf(f=>(f+1)%3),115);return()=>clearInterval(id)},[speaking])
  return(
    <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
      {waves&&[1,2,3].map(i=>(
        <div key={i} style={{position:'absolute',width:size+i*26,height:size+i*26,borderRadius:'50%',border:`0.5px solid ${col.replace(/[\d.]+\)$/,`${speaking?.12-.03*i:.05-.01*i})`)}`,top:'50%',left:'50%',transform:'translate(-50%,-50%)',animation:`wave ${2+i*.6}s ease-in-out infinite ${i*.4}s`,pointerEvents:'none'}}/>
      ))}
      <svg viewBox="0 0 90 90" width={size} height={size} style={{position:'relative',zIndex:1}}>
        <circle cx="45" cy="45" r="42" fill="#16152a"/>
        <circle cx="45" cy="51" r="33" fill="#1a1930"/>
        <ellipse cx="30" cy="39" rx="6" ry={eyeRy} fill={col}/>
        <ellipse cx="60" cy="39" rx="6" ry={eyeRy} fill={col}/>
        <circle cx="32" cy="37" r="2" fill="white" opacity="0.85"/><circle cx="62" cy="37" r="2" fill="white" opacity="0.85"/>
        <ellipse cx="30" cy="28" rx="9" ry="2.5" fill="#1a1930"/><ellipse cx="60" cy="28" rx="9" ry="2.5" fill="#1a1930"/>
        <rect x="22" y="25.5" width="16" height="3.5" rx="1.75" fill={col} opacity="0.7" transform={bTL}/>
        <rect x="52" y="25.5" width="16" height="3.5" rx="1.75" fill={col} opacity="0.7" transform={bTR}/>
        {speaking?<path d={[mouth,'M32 59 Q45 65 58 59','M34 58 Q45 62 56 58'][mf]} fill="none" stroke={col} strokeWidth="2.4" strokeLinecap="round"/>:<path d={mouth} fill="none" stroke={col} strokeWidth="2.4" strokeLinecap="round"/>}
        <circle cx="17" cy="54" r="7" fill="rgba(120,130,255,.15)"/>
        <circle cx="73" cy="54" r="7" fill="rgba(120,130,255,.15)"/>
      </svg>
    </div>
  )
}

function Burst({mood,trigger}:{mood:Mood;trigger:number}){
  const [ps,setPs]=useState<any[]>([])
  useEffect(()=>{if(!trigger)return;const col=MOODS[mood].color;const items=Array.from({length:6+Math.floor(Math.random()*4)},(_,i)=>{const a=Math.random()*Math.PI*2,d=60+Math.random()*80;return{id:Date.now()+i,e:MOODS[mood].bursts[Math.floor(Math.random()*MOODS[mood].bursts.length)],tx:Math.cos(a)*d,ty:Math.sin(a)*d,rot:-90+Math.random()*180,delay:Math.random()*300,size:11+Math.random()*10,col}});setPs(items);setTimeout(()=>setPs([]),2500)},[trigger])
  return(<div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:50,overflow:'hidden'}}>{ps.map(p=><span key={p.id} style={{position:'absolute',fontSize:p.size,left:'50%',top:'50%',color:p.col,fontFamily:'monospace',animationName:'burst',animationDuration:'2s',animationTimingFunction:'ease-out',animationDelay:`${p.delay}ms`,animationFillMode:'forwards',['--tx' as any]:`${p.tx}px`,['--ty' as any]:`${p.ty}px`,['--rot' as any]:`${p.rot}deg`}}>{p.e}</span>)}</div>)
}

function RebelBar({level,streak}:{level:number;streak:number}){
  const lbl=['normie','rebel','anarhist','legend'][Math.min(Math.floor(level/25),3)]
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 18px'}}>
      <span style={{fontSize:9,color:'rgba(160,220,180,.4)',letterSpacing:'.1em',fontFamily:'monospace'}}>REBEL</span>
      <div style={{flex:1,height:2,background:'rgba(120,130,255,.1)',borderRadius:2,position:'relative'}}>
        <div style={{position:'absolute',left:0,top:0,height:'100%',background:'linear-gradient(90deg,rgba(120,130,255,.4),rgba(160,220,180,.6))',width:`${Math.min(level,100)}%`,borderRadius:2,transition:'width .6s ease'}}/>
      </div>
      <span style={{fontSize:9,color:'rgba(160,220,180,.5)',fontFamily:'monospace'}}>{lbl}</span>
      {streak>0&&<span style={{fontSize:9,color:'rgba(255,180,80,.6)',fontFamily:'monospace'}}>🔥{streak}z</span>}
    </div>
  )
}

function ChatOverlay({msgs,onClose,mc}:{msgs:Msg[];onClose:()=>void;mc:string}){
  return(
    <div style={{position:'absolute',inset:0,background:'rgba(5,5,13,.97)',zIndex:200,display:'flex',flexDirection:'column',animation:'fade-in .3s ease-out'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'0.5px solid rgba(120,130,255,.1)',flexShrink:0}}>
        <span style={{fontSize:11,color:'rgba(120,130,255,.35)',letterSpacing:'.08em',fontFamily:'monospace'}}>WISP TEEN · conversație</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(120,130,255,.3)',fontSize:18,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'14px 18px',display:'flex',flexDirection:'column',gap:8,scrollbarWidth:'none'}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:m.role==='bot'?'flex-start':'flex-end'}}>
            <div style={{fontSize:9,color:'rgba(120,130,255,.18)',marginBottom:3}}>{m.role==='bot'?`WISP · ${m.ts}`:m.ts}</div>
            <div style={{maxWidth:'75%',padding:'8px 14px',borderRadius:m.role==='bot'?'16px 16px 16px 3px':'16px 16px 3px 16px',fontSize:13,lineHeight:1.6,color:m.role==='bot'?'rgba(255,255,255,.8)':'rgba(255,255,255,.9)',background:m.role==='bot'?'rgba(120,130,255,.1)':'rgba(120,130,255,.18)',border:`0.5px solid rgba(120,130,255,${m.role==='bot'?.12:.2})`}}>
              {m.isVoice&&m.role==='user'?`🎤 "${m.text}"`:m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── QUICK ACTIONS BAR ────────────────────────────────────────────────────────
function QuickActions({mc,onRant,onHomework,onAlterEgo,onMissions,onMoodTracker,onConfess,alterEgo,missionsToday}:{
  mc:string;onRant:()=>void;onHomework:()=>void;onAlterEgo:()=>void;
  onMissions:()=>void;onMoodTracker:()=>void;onConfess:()=>void;
  alterEgo:AlterEgo;missionsToday:number
}){
  const btns=[
    {icon:'💢',label:'rant',onClick:onRant,color:'rgba(220,130,130,.7)'},
    {icon:'📚',label:'teme',onClick:onHomework,color:'rgba(130,180,255,.7)'},
    {icon:ALTER_EGO_DATA[alterEgo].icon,label:'ego',onClick:onAlterEgo,color:ALTER_EGO_DATA[alterEgo].color},
    {icon:'⚡',label:`misiuni${missionsToday>0?` (${missionsToday})`:''}`,onClick:onMissions,color:'rgba(160,220,180,.7)'},
    {icon:'📊',label:'mood',onClick:onMoodTracker,color:'rgba(200,170,255,.7)'},
    {icon:'🔒',label:'confess',onClick:onConfess,color:'rgba(180,170,255,.7)'},
  ]
  return(
    <div style={{display:'flex',gap:6,padding:'4px 18px',overflowX:'auto',scrollbarWidth:'none',flexShrink:0,position:'relative',zIndex:3}}>
      {btns.map(b=>(
        <button key={b.label} onClick={b.onClick} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'6px 10px',borderRadius:12,border:`0.5px solid ${b.color.replace('.7','.2')}`,background:`${b.color.replace('.7','.06')}`,cursor:'pointer',flexShrink:0,transition:'all .2s'}}>
          <span style={{fontSize:14}}>{b.icon}</span>
          <span style={{fontSize:8,color:b.color,fontFamily:'monospace',letterSpacing:'.05em',whiteSpace:'nowrap'}}>{b.label}</span>
        </button>
      ))}
    </div>
  )
}

const defaultMotivation:MotivationState={xp:0,level:1,streak:0,lastActiveDate:'',graceDayUsed:false,totalSessions:0,badges:[],weeklyXP:[]}

export default function WispTeen({userId}:{userId?:string}){
  const [msgs,setMsgs]=useState<Msg[]>([{role:'bot',text:'yo. ce-i cu tine azi — temele te omoară sau altceva?',mood:'idle',ts:'acum'}])
  const [mood,setMood]=useState<Mood>('idle')
  const [speaking,setSpeaking]=useState(false)
  const [voiceOpen,setVoiceOpen]=useState(false)
  const [voiceMode,setVoiceMode]=useState<VoiceMode>('idle')
  const [voText,setVoText]=useState('Apasă și vorbește.')
  const [input,setInput]=useState('')
  const [status,setStatus]=useState('')
  const [burst,setBurst]=useState(0)
  const [isListening,setIsListening]=useState(false)
  const [showChat,setShowChat]=useState(false)
  const [showGames,setShowGames]=useState(false)
  const [currentBotText,setCurrentBotText]=useState('yo. ce-i cu tine azi — temele te omoară sau altceva?')
  const [showTyping,setShowTyping]=useState(false)
  const [pendingUserText,setPendingUserText]=useState('')
  const [rebelXP,setRebelXP]=useState(0)
  const [rebelStreak,setRebelStreak]=useState(()=>{
    if(typeof window==='undefined')return 0
    return parseInt(localStorage.getItem('teen-streak')||'0')
  })
  const [currentProposal,setCurrentProposal]=useState<GameProposal|null>(null)
  const msgCountRef=useRef(0)
  const lastProposedAtRef=useRef(0)
  // New features state
  const [alterEgo,setAlterEgo]=useState<AlterEgo>('none')
  const [missions,setMissions]=useState<Mission[]>(()=>{
    if(typeof window==='undefined')return[]
    const s=localStorage.getItem('teen-missions');
    if(s)return JSON.parse(s)
    const today=new Date().toDateString()
    const pool=[...MISSIONS_POOL].sort(()=>Math.random()-.5).slice(0,3)
    return pool.map(m=>({...m,done:false,date:today}))
  })
  const [moodHistory,setMoodHistory]=useState<MoodEntry[]>(()=>{
    if(typeof window==='undefined')return[]
    const s=localStorage.getItem('teen-mood-history');return s?JSON.parse(s):[]
  })
  const [lastGameScore,setLastGameScore]=useState(0)
  const [lastGameName,setLastGameName]=useState('')
  // Overlay states
  const [showRant,setShowRant]=useState(false)
  const [showHomework,setShowHomework]=useState(false)
  const [showAlterEgo,setShowAlterEgo]=useState(false)
  const [showMissions,setShowMissions]=useState(false)
  const [showMoodTracker,setShowMoodTracker]=useState(false)
  const [showConfess,setShowConfess]=useState(false)
  const [showBattle,setShowBattle]=useState(false)
  const [motivation,setMotivation]=useState<MotivationState>(()=>{if(typeof window==='undefined')return defaultMotivation;const s=localStorage.getItem('wisptteen-motivation');return s?JSON.parse(s):defaultMotivation})
  const [newBadges,setNewBadges]=useState<string[]>([])
  const {current:achievement,dismiss,checkAndShow}=useAchievements()
  const voiceBuffer=useRef('')
  const recRef=useRef<any>(null)
  const sessionStart=useRef(Date.now())
  const avAnimRef=useRef<number|null>(null)
  const [avY,setAvY]=useState(0)
  const {bgMood,intensity,kwParticles}=useDynamicBg(msgs,MOODS[mood].bg)
  useSyncProgress(motivation,{product:'teen'})
  useEffect(()=>{return()=>{stopSpeaking();try{recRef.current?.stop()}catch(e){};if(avAnimRef.current)cancelAnimationFrame(avAnimRef.current)}},[])
  useEffect(()=>{let t=0;const tick=()=>{t+=0.005;setAvY(Math.sin(t)*9);avAnimRef.current=requestAnimationFrame(tick)};avAnimRef.current=requestAnimationFrame(tick);return()=>{if(avAnimRef.current)cancelAnimationFrame(avAnimRef.current)}},[])
  // Refresh missions daily
  useEffect(()=>{
    const today=new Date().toDateString()
    const hasTodayMissions=missions.some(m=>m.date===today)
    if(!hasTodayMissions){
      const pool=[...MISSIONS_POOL].sort(()=>Math.random()-.5).slice(0,3)
      const newM=pool.map(m=>({...m,done:false,date:today}))
      const updated=[...missions,...newM]
      setMissions(updated)
      localStorage.setItem('teen-missions',JSON.stringify(updated))
    }
  },[])
  const now=()=>new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})

  const calcRebelXP=(text:string)=>{const s=text.toLowerCase();let b=0;if(/haha|lol|mort|scap|bă|mă|dracu/.test(s))b+=8;if(/profu|directoru|sistem|regul|aiurea/.test(s))b+=6;if(text.length>80)b+=5;if(/tema|lecție|materie|fizică|mate|chimie/.test(s))b+=3;return Math.min(b,15)}

  const trackMood=(m:Mood)=>{
    const today=new Date().toDateString()
    const entry:MoodEntry={date:today,mood:m,score:moodScore(m)}
    const updated=[...moodHistory.filter(e=>e.date!==today),entry]
    setMoodHistory(updated)
    localStorage.setItem('teen-mood-history',JSON.stringify(updated))
  }

  const completeMission=(id:string)=>{
    const m=missions.find(x=>x.id===id)
    if(!m||m.done)return
    const updated=missions.map(x=>x.id===id?{...x,done:true}:x)
    setMissions(updated)
    localStorage.setItem('teen-missions',JSON.stringify(updated))
    setRebelXP(p=>Math.min(p+m.xp,100))
    awardXP(Math.floor(m.xp/5))
  }

  const awardXP=useCallback((count:number)=>{
    const mins=Math.floor((Date.now()-sessionStart.current)/60000);const earned=calcXP(count,'😊',mins)
    let updated=updateStreak(motivation);updated={...updated,xp:updated.xp+earned,totalSessions:updated.totalSessions+1,weeklyXP:[...(updated.weeklyXP||[]).slice(-6),earned]}
    const unlocked=checkNewBadges(updated);updated.badges=[...updated.badges,...unlocked]
    setNewBadges(unlocked);setMotivation(updated);localStorage.setItem('wisptteen-motivation',JSON.stringify(updated));checkAndShow(motivation,updated,earned,{})
  },[motivation,checkAndShow])

  const wispSpeak=useCallback((text:string,m:Mood,onDone?:()=>void)=>{
    speak(text,'teen',{onStart:()=>{setSpeaking(true);setMood(m);setStatus('vorbesc')},onEnd:()=>{setSpeaking(false);setMood('idle');setStatus('');onDone?.()},onError:()=>{setSpeaking(false);setMood('idle');setStatus('');onDone?.()}})
  },[])

  const buildSystemPrompt=()=>{
    let base=`Ești WISP, companionul secret al adolescenților de 13-18 ani. Ești mereu puțin "pe partea lor" față de sistem — școală, reguli, adulți plictisitori — dar fără să-i îndemni la prostii reale. Tonul tău: sarcastic, direct, cu umor negru ușor, ca un prieten mai mare și mai cool. Când te întreabă de teme sau lecții, ajuți dar o faci cu stil — nu ca un profesor. Asculți fără să judeci. Nu moralizezi niciodată direct. Răspunsuri scurte — max 2 propoziții. Fără asteriscuri. Răspunzi în română.`
    if(alterEgo!=='none')base+=` IMPORTANT: ${ALTER_EGO_DATA[alterEgo].prompt}`
    return base
  }

  const getReply=async(history:Msg[],text:string)=>{
    // Special handling
    if(text.startsWith('[HOMEWORK'))return{text:`ok, hai să rezolvăm asta step by step. prima întrebare: ce parte nu înțelegi cel mai mult?`,mood:'process' as Mood}
    if(text.startsWith('[CONFESS'))return{text:`primit. nu judec. continuă dacă vrei — sau nu.`,mood:'sync' as Mood}
    if(text.startsWith('[RANT'))return{text:`ok, ai eliberat-o. cum te simți acum? mai greu sau mai ușor?`,mood:'idle' as Mood}
    try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...history.map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text})),{role:'user',content:text}],systemContext:buildSystemPrompt()})});const d=await res.json();return{text:d.message||'interesant.',mood:detectMood(d.message||'')}}
    catch{return{text:'ceva a crăpat. încearcă din nou.',mood:'error' as Mood}}
  }

  const proposeGame=(currentMsgs:Msg[])=>{
    const game=GAME_SUGGESTIONS[Math.floor(Math.random()*GAME_SUGGESTIONS.length)]
    const text=BORED_TEXTS_TEEN[Math.floor(Math.random()*BORED_TEXTS_TEEN.length)]
    lastProposedAtRef.current=msgCountRef.current
    setTimeout(()=>{
      setCurrentProposal({...game})
      setCurrentBotText(text)
      setMsgs(p=>[...p,{role:'bot' as const,text,mood:'boost',ts:now()}])
      wispSpeak(text,'boost')
    },1000)
  }

  const sendMsg=async(text:string,isVoice=false)=>{
    if(!text.trim())return
    setCurrentProposal(null)
    const rxp=calcRebelXP(text);setRebelXP(p=>Math.min(p+rxp,100))
    const m=detectMood(text);trackMood(m)
    msgCountRef.current+=1
    setPendingUserText(text)
    const currentMsgs=[...msgs,{role:'user' as const,text,mood:m,ts:now(),isVoice}]
    setMsgs(currentMsgs)
    setMood('process');setStatus('procesez');setShowTyping(true);setCurrentBotText('')
    const reply=await getReply(msgs,text)
    setShowTyping(false);setPendingUserText('')
    setMsgs(p=>[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice}])
    setCurrentBotText(reply.text)
    setMood(reply.mood);setBurst(b=>b+1);awardXP(1);wispSpeak(reply.text,reply.mood)
    if(shouldProposeGame(currentMsgs,msgCountRef.current,lastProposedAtRef.current)){
      proposeGame(currentMsgs)
    }
  }

  const handleAcceptGame=()=>{setShowGames(true);setCurrentProposal(null)}
  const handleDeclineGame=()=>{
    setCurrentProposal(prev=>prev?{...prev,declined:true}:null)
    setTimeout(()=>{setCurrentBotText('ok, știi unde sunt. oricând.');setCurrentProposal(null)},1200)
  }

  const startVoiceRec=()=>{const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){setVoText('Necesită Chrome.');return}voiceBuffer.current='';const rec=new SR();rec.lang='ro-RO';rec.continuous=true;rec.interimResults=true;rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)voiceBuffer.current+=e.results[i][0].transcript+' ';else t+=e.results[i][0].transcript}setVoText((voiceBuffer.current+t)||'...')};rec.onerror=()=>{};rec.start();recRef.current=rec;setVoiceMode('recording');setVoText('...');setMood('focus');setIsListening(true)}
  const finishVoiceRec=()=>{try{recRef.current?.stop()}catch(e){};setIsListening(false);const text=voiceBuffer.current.trim();if(!text){setVoiceMode('idle');setVoText('Nu am auzit nimic.');return}setVoiceMode('analyzing');setMood('process');sendVoiceMsg(text)}
  const sendVoiceMsg=async(text:string)=>{
    const m=detectMood(text);trackMood(m)
    setPendingUserText(text)
    setMsgs(p=>[...p,{role:'user' as const,text,mood:m,ts:now(),isVoice:true}])
    setShowTyping(true);setCurrentBotText('')
    const reply=await getReply(msgs,text)
    setShowTyping(false);setPendingUserText('')
    setMsgs(p=>[...p,{role:'bot' as const,text:reply.text,mood:reply.mood,ts:now(),isVoice:true}])
    setCurrentBotText(reply.text)
    setMood(reply.mood);setVoText(reply.text);setBurst(b=>b+1);awardXP(1)
    setVoiceMode('responding');wispSpeak(reply.text,reply.mood,()=>{setVoiceMode('idle');setVoText('Sunt gata.')})
  }
  const toggleMic=()=>{if(isListening){try{recRef.current?.stop()}catch(e){};setIsListening(false);setStatus('');return}const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){alert('Necesită Chrome.');return}const rec=new SR();rec.lang='ro-RO';rec.continuous=false;rec.interimResults=true;rec.onstart=()=>{setIsListening(true);setMood('focus');setStatus('ascult')};rec.onresult=(e:any)=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setInput(t);if(e.results[e.results.length-1].isFinal){try{rec.stop()}catch(e){};setIsListening(false);setStatus('');sendMsg(t)}};rec.onerror=()=>{setIsListening(false);setStatus('')};rec.start();recRef.current=rec}
  const handleVoBtn=()=>{if(voiceMode==='idle')startVoiceRec();else if(voiceMode==='recording')finishVoiceRec();else if(voiceMode==='responding'){stopSpeaking();setSpeaking(false);setVoiceMode('idle');setVoText('Sunt gata.')}}
  const mc=MOODS[mood].color
  const todayMissionsDone=missions.filter(m=>m.date===new Date().toDateString()&&!m.done).length

  return(
    <div style={{height:'100vh',background:'#07080f',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',position:'relative',overflow:'hidden',color:'rgba(255,255,255,.85)'}}>
      <style>{`
        @keyframes burst{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.2) rotate(var(--rot))}}
        @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wave{0%,100%{opacity:.05;transform:translate(-50%,-50%) scale(1)}50%{opacity:.14;transform:translate(-50%,-50%) scale(1.06)}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes blink-cur{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes text-appear{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes user-fade{0%{opacity:.5}60%{opacity:.3}100%{opacity:.1}}
      `}</style>

      <DynamicBackground mood={bgMood} intensity={intensity} keywordParticles={kwParticles}/>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 18px',flexShrink:0,position:'relative',zIndex:3,borderBottom:'0.5px solid rgba(120,130,255,.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:14,fontWeight:600,color:'rgba(180,190,255,.8)',letterSpacing:'.08em'}}>WISP</span>
          <span style={{fontSize:10,color:'rgba(120,130,255,.35)',background:'rgba(120,130,255,.07)',padding:'1px 8px',borderRadius:20,border:'0.5px solid rgba(120,130,255,.1)'}}>Teen · 13–18</span>
          {alterEgo!=='none'&&<span style={{fontSize:9,color:ALTER_EGO_DATA[alterEgo].color,fontFamily:'monospace',background:`${ALTER_EGO_DATA[alterEgo].color.replace('.8','.1')}`,padding:'1px 6px',borderRadius:10}}>{ALTER_EGO_DATA[alterEgo].icon} {ALTER_EGO_DATA[alterEgo].name}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:10,color:mc}}>
            <div style={{width:4,height:4,borderRadius:'50%',background:mc,animation:status?'rpulse .7s infinite':undefined}}/>
            {status||MOODS[mood].label}
          </div>
          <button onClick={()=>setShowChat(true)} style={{padding:'3px 8px',borderRadius:16,fontSize:10,border:'0.5px solid rgba(120,130,255,.18)',background:'rgba(120,130,255,.06)',color:'rgba(160,170,255,.6)',cursor:'pointer'}}>≡</button>
          <button onClick={()=>setShowGames(true)} style={{padding:'3px 8px',borderRadius:16,fontSize:10,border:'0.5px solid rgba(120,130,255,.18)',background:'rgba(120,130,255,.06)',color:'rgba(160,170,255,.6)',cursor:'pointer'}}>🧠</button>
          <button onClick={()=>{if(lastGameScore>0){setShowBattle(true)}else{setCurrentBotText('joacă un joc mai întâi, apoi te bat eu 😏')}}} style={{padding:'3px 8px',borderRadius:16,fontSize:10,border:'0.5px solid rgba(255,200,80,.18)',background:'rgba(255,200,80,.06)',color:'rgba(255,200,80,.6)',cursor:'pointer'}}>⚔</button>
          <button onClick={()=>setVoiceOpen(true)} style={{padding:'4px 10px',borderRadius:20,fontSize:10,border:'0.5px solid rgba(120,130,255,.2)',background:'rgba(120,130,255,.07)',color:'rgba(160,170,255,.7)',cursor:'pointer'}}>🎤 voice</button>
        </div>
      </div>

      {/* XP + REBEL */}
      <div style={{padding:'6px 18px 0',flexShrink:0,position:'relative',zIndex:3}}><XPBar state={motivation} newBadges={newBadges}/></div>
      <RebelBar level={rebelXP} streak={rebelStreak}/>

      {/* QUICK ACTIONS */}
      <QuickActions
        mc={mc}
        onRant={()=>setShowRant(true)}
        onHomework={()=>setShowHomework(true)}
        onAlterEgo={()=>setShowAlterEgo(true)}
        onMissions={()=>setShowMissions(true)}
        onMoodTracker={()=>setShowMoodTracker(true)}
        onConfess={()=>setShowConfess(true)}
        alterEgo={alterEgo}
        missionsToday={todayMissionsDone}
      />

      {/* CENTRU */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',zIndex:2,padding:'0 22px'}}>
        <div style={{position:'relative',transform:`translateY(${avY}px)`,transition:'transform .08s linear',marginBottom:22}}>
          <Burst mood={mood} trigger={burst}/>
          <Avatar mood={mood} speaking={speaking} size={140} waves={true}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <span style={{fontSize:12,color:mc,fontFamily:'monospace'}}>{MOODS[mood].sym}</span>
          <span style={{fontSize:11,color:'rgba(120,130,255,.3)',letterSpacing:'.1em',fontFamily:'monospace'}}>WISP</span>
          {status&&<span style={{fontSize:10,color:mc,animation:'fade-in .3s ease-out'}}>{status}</span>}
        </div>
        <div style={{maxWidth:300,textAlign:'center',minHeight:70}}>
          {showTyping?(
            <div style={{display:'flex',gap:4,justifyContent:'center',alignItems:'center',height:70}}>
              {[0,.18,.36].map((d,i)=><span key={i} style={{width:6,height:6,borderRadius:'50%',background:mc.replace(/[\d.]+\)$/,'.35)'),display:'inline-block',animation:`tdot 1.1s ${d}s infinite`}}/>)}
            </div>
          ):currentProposal?(
            <GameProposalCard proposal={currentProposal} botText={currentBotText} onAccept={handleAcceptGame} onDecline={handleDeclineGame} mc={mc}/>
          ):(
            <div key={currentBotText} style={{fontSize:16,lineHeight:1.8,color:'rgba(255,255,255,.85)',fontWeight:400,animation:'text-appear .5s ease-out'}}>
              <TypingMsg text={currentBotText} speed={33} color={mc}/>
            </div>
          )}
        </div>
        {pendingUserText&&(
          <div style={{marginTop:14,fontSize:11,color:'rgba(255,255,255,.2)',fontFamily:'monospace',maxWidth:260,textAlign:'center',animation:'user-fade 2.5s ease-out forwards',letterSpacing:'.02em'}}>
            {pendingUserText}
          </div>
        )}
      </div>

      {/* INPUT */}
      <div style={{padding:'0 16px 18px',flexShrink:0,position:'relative',zIndex:3}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'rgba(120,130,255,.06)',border:'0.5px solid rgba(120,130,255,.14)',borderRadius:28,padding:'8px 8px 8px 16px',backdropFilter:'blur(16px)',transition:'all .4s'}}>
          <textarea value={input} onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,100)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(input.trim()){sendMsg(input);setInput('')}}}} placeholder="scrie ceva…" rows={1} style={{flex:1,background:'transparent',border:'none',color:'rgba(255,255,255,.7)',fontSize:13,outline:'none',resize:'none',fontFamily:'system-ui',lineHeight:1.5,maxHeight:100,overflowY:'auto',padding:0,transition:'color .3s'}}/>
          <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0,paddingBottom:2}}>
            <button onClick={toggleMic} style={{width:32,height:32,borderRadius:'50%',border:`0.5px solid ${isListening?'rgba(220,100,100,.4)':'rgba(120,130,255,.2)'}`,background:isListening?'rgba(220,100,100,.1)':'rgba(120,130,255,.08)',color:isListening?'rgba(220,130,130,.9)':'rgba(160,170,255,.5)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',animation:isListening?'rpulse .6s infinite':undefined,transition:'all .3s'}}>⏺</button>
            <button onClick={()=>{if(input.trim()){sendMsg(input);setInput('')}}} style={{width:32,height:32,borderRadius:'50%',border:'none',background:input.trim()?mc.replace(/[\d.]+\)$/,'.5)'):'rgba(120,130,255,.1)',color:input.trim()?'white':'rgba(160,170,255,.3)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .3s'}}>↑</button>
          </div>
        </div>
      </div>

      {/* OVERLAYS */}
      {showChat&&<ChatOverlay msgs={msgs} onClose={()=>setShowChat(false)} mc={mc}/>}
      {showRant&&<RantOverlay onClose={()=>setShowRant(false)} onSend={(t)=>{sendMsg(`[RANT] ${t}`)}}/>}
      {showHomework&&<HomeworkOverlay onClose={()=>setShowHomework(false)} onSend={sendMsg}/>}
      {showAlterEgo&&<AlterEgoOverlay current={alterEgo} onSelect={setAlterEgo} onClose={()=>setShowAlterEgo(false)}/>}
      {showMissions&&<MissionsOverlay missions={missions} onComplete={completeMission} onClose={()=>setShowMissions(false)}/>}
      {showMoodTracker&&<MoodTrackerOverlay entries={moodHistory} onClose={()=>setShowMoodTracker(false)}/>}
      {showConfess&&<ConfessOverlay onClose={()=>setShowConfess(false)} onSend={sendMsg}/>}
      {showBattle&&<BattleOverlay onClose={()=>setShowBattle(false)} lastScore={lastGameScore} gameName={lastGameName}/>}
      {voiceOpen&&(
        <div style={{position:'absolute',inset:0,background:'rgba(5,5,13,.97)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:22,zIndex:100,animation:'fade-in .4s ease-out'}}>
          <DynamicBackground mood={bgMood} intensity={50}/>
          <button onClick={()=>{setVoiceOpen(false);stopSpeaking();try{recRef.current?.stop()}catch(e){};setVoiceMode('idle');setSpeaking(false);setIsListening(false);setMood('idle')}} style={{position:'absolute',top:18,right:18,background:'none',border:'none',color:'rgba(120,130,255,.25)',fontSize:18,cursor:'pointer',zIndex:1}}>✕</button>
          <div style={{position:'relative',zIndex:1,transform:`translateY(${avY}px)`,transition:'transform .08s linear'}}>
            <Avatar mood={mood} speaking={speaking} size={170} waves={true}/>
            <Burst mood={mood} trigger={burst}/>
          </div>
          <div style={{textAlign:'center',zIndex:1}}>
            <div style={{fontSize:15,fontWeight:400,color:'rgba(180,190,255,.75)',letterSpacing:'.14em'}}>WISP</div>
            <div style={{fontSize:10,color:'rgba(120,130,255,.3)',marginTop:3,letterSpacing:'.08em'}}>{voiceMode==='idle'?'':voiceMode==='recording'?'ascult':voiceMode==='analyzing'?'procesez':'răspund'}</div>
          </div>
          <div style={{maxWidth:240,textAlign:'center',fontSize:14,color:'rgba(255,255,255,.5)',minHeight:44,lineHeight:1.75,padding:'10px 18px',background:'rgba(120,130,255,.06)',borderRadius:12,border:'0.5px solid rgba(120,130,255,.1)',fontStyle:voiceMode==='recording'?'italic':'normal',zIndex:1}}>{voText}</div>
          <button onClick={handleVoBtn} style={{width:62,height:62,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:'pointer',border:`0.5px solid rgba(120,130,255,${voiceMode==='recording'?.15:voiceMode==='responding'?.25:.08})`,background:voiceMode==='recording'?'rgba(220,100,100,.06)':voiceMode==='responding'?'rgba(120,130,255,.08)':'transparent',animation:voiceMode==='recording'?'rpulse .8s infinite':undefined,transition:'all .4s',color:voiceMode==='recording'?'rgba(220,130,130,.7)':'rgba(160,170,255,.5)',zIndex:1}}>{voiceMode==='idle'?'○':voiceMode==='recording'?'◼':voiceMode==='analyzing'?'◐':'◎'}</button>
        </div>
      )}
      <AchievementPopup achievement={achievement} onDone={dismiss} theme="dark"/>
     {showGames&&<CognitiveGames product="teen" onClose={()=>{
  setShowGames(false)
  setTimeout(()=>{
    const best=parseInt(localStorage.getItem('best-math')||localStorage.getItem('best-stroop')||localStorage.getItem('best-reaction')||'0')
    if(best>0){setLastGameScore(best);setLastGameName('Joc');setShowBattle(true)}
  },500)
}}/>}
    </div>
  )
}