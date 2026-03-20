'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Timer, CheckCircle, Circle, Zap, RotateCcw, TrendingUp, Brain, Star } from 'lucide-react'
import XPBar from './XPBar'
import AchievementPopup from './AchievementPopup'
import { useAchievements } from '../lib/useAchievements'
import {
  calcXP, updateStreak, checkNewBadges, getMotivationMessage,
  analyzeStyle, buildStylePrompt,
  type MotivationState, type StyleProfile
} from '../lib/motivation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Task {
  id: number
  text: string
  done: boolean
}

interface Session {
  date: string
  mood: string
  tasksCompleted: number
  totalTasks: number
  startHour: number
}

const defaultMotivation: MotivationState = {
  xp: 0, level: 1, streak: 0, lastActiveDate: '',
  graceDayUsed: false, totalSessions: 0, badges: [], weeklyXP: []
}

const defaultStyle: StyleProfile = {
  tone: 'unknown', avgMessageLength: 'medium',
  emojis: [], language: 'ro', sampleMessages: []
}

export default function Flow({ userId }: { userId?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60)
  const [checkedIn, setCheckedIn] = useState(false)
  const [mood, setMood] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionStart] = useState(new Date().getHours())
  const [sessionStartTime] = useState(Date.now())
  const [activeTab, setActiveTab] = useState<'tasks' | 'pattern' | 'xp'>('tasks')
  const [motivation, setMotivation] = useState<MotivationState>(defaultMotivation)
  const [newBadges, setNewBadges] = useState<string[]>([])
  const [styleProfile, setStyleProfile] = useState<StyleProfile>(defaultStyle)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { current: achievement, dismiss, checkAndShow } = useAchievements()

  useEffect(() => {
    const saved = localStorage.getItem('flow-messages')
    const savedTasks = localStorage.getItem('flow-tasks')
    const savedSessions = localStorage.getItem('flow-sessions')
    const savedMood = localStorage.getItem('flow-mood-today')
    const savedDate = localStorage.getItem('flow-date')
    const savedMotivation = localStorage.getItem('flow-motivation')
    const savedStyle = localStorage.getItem('flow-style')
    const today = new Date().toLocaleDateString('ro-RO')

    if (savedSessions) setSessions(JSON.parse(savedSessions))
    if (savedTasks) setTasks(JSON.parse(savedTasks))
    if (savedMotivation) setMotivation(JSON.parse(savedMotivation))
    if (savedStyle) setStyleProfile(JSON.parse(savedStyle))

    if (savedDate !== today) {
      localStorage.setItem('flow-date', today)
      localStorage.removeItem('flow-mood-today')
    } else if (savedMood) {
      setMood(savedMood)
      setCheckedIn(true)
    }

    if (saved) {
      setMessages(JSON.parse(saved))
    } else {
      setMessages([{
        role: 'assistant',
        content: 'Bună! Sunt Flow, partenerul tău de productivitate. Cum te simți azi? Alege un emoji ca să începem. 😊'
      }])
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('flow-messages', JSON.stringify(messages.slice(-50)))
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('flow-tasks', JSON.stringify(tasks))
    }
  }, [tasks])

  useEffect(() => {
    if (!timerActive) return
    if (timerSeconds === 0) {
      setTimerActive(false)
      setTimerSeconds(25 * 60)
      addMessage('assistant', '⏰ Sesiunea s-a terminat! Ia o pauză de 5 minute. Ce ai reușit să faci?')
      return
    }
    const interval = setInterval(() => setTimerSeconds(s => s - 1), 1000)
    return () => clearInterval(interval)
  }, [timerActive, timerSeconds])

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content }])
  }

  const updateStyle = (userMessages: string[]) => {
    if (userMessages.length < 3) return
    const profile = analyzeStyle(userMessages)
    setStyleProfile(profile)
    localStorage.setItem('flow-style', JSON.stringify(profile))
  }

  const saveSession = (currentMood: string, currentTasks: Task[]) => {
    const sessionMinutes = Math.floor((Date.now() - sessionStartTime) / 60000)
    const completedCount = currentTasks.filter(t => t.done).length

    const prev = motivation
    let updated = updateStreak(prev)
    const earned = calcXP(completedCount, currentMood, sessionMinutes)
    updated = {
      ...updated,
      xp: updated.xp + earned,
      totalSessions: updated.totalSessions + 1,
      weeklyXP: [...(updated.weeklyXP ?? []).slice(-6), earned]
    }

    const unlocked = checkNewBadges(updated)
    updated.badges = [...updated.badges, ...unlocked]
    setNewBadges(unlocked)
    setMotivation(updated)
    localStorage.setItem('flow-motivation', JSON.stringify(updated))

    checkAndShow(prev, updated, earned, {})

    const newSession: Session = {
      date: new Date().toLocaleDateString('ro-RO'),
      mood: currentMood,
      tasksCompleted: completedCount,
      totalTasks: currentTasks.length,
      startHour: sessionStart
    }
    const updatedSessions = [...sessions.slice(-13), newSession]
    setSessions(updatedSessions)
    localStorage.setItem('flow-sessions', JSON.stringify(updatedSessions))

    return earned
  }

  const getPattern = () => {
    if (sessions.length < 3) return null
    const byHour: Record<number, number[]> = {}
    sessions.forEach(s => {
      if (!byHour[s.startHour]) byHour[s.startHour] = []
      byHour[s.startHour].push(s.tasksCompleted / Math.max(s.totalTasks, 1))
    })
    let bestHour = -1, bestRate = 0
    Object.entries(byHour).forEach(([h, rates]) => {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length
      if (avg > bestRate) { bestRate = avg; bestHour = Number(h) }
    })
    if (bestHour === -1) return null
    const period = bestHour < 12 ? 'dimineața' : bestHour < 17 ? 'după-amiaza' : 'seara'
    return `Ești cel mai productiv ${period} (${bestHour}:00) cu ${Math.round(bestRate * 100)}% taskuri completate.`
  }

  const getMoodTrend = () => {
    if (sessions.length < 2) return null
    const recent = sessions.slice(-5)
    const moodScore: Record<string, number> = { '🔥': 5, '😊': 4, '😐': 3, '😴': 2, '😰': 1 }
    const avg = recent.reduce((sum, s) => sum + (moodScore[s.mood] || 3), 0) / recent.length
    if (avg >= 4) return '📈 Trend pozitiv în ultima săptămână!'
    if (avg <= 2) return '⚠️ Energie scăzută recent. Poate e nevoie de o pauză mai lungă.'
    return '➡️ Energie constantă, stabilă.'
  }

  const handleMood = async (emoji: string) => {
    setMood(emoji)
    setCheckedIn(true)
    localStorage.setItem('flow-mood-today', emoji)
    addMessage('user', emoji)
    setLoading(true)

    const moodMap: Record<string, string> = {
      '😊': 'bine și energic',
      '😐': 'neutru, nici bine nici rău',
      '😴': 'obosit și fără energie',
      '😰': 'stresat și anxios',
      '🔥': 'super motivat și gata de orice'
    }

    const pattern = getPattern()
    const patternContext = pattern ? `\n\nPattern detectat: ${pattern}` : ''
    const motivationMsg = getMotivationMessage(motivation, emoji)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: emoji }],
        systemContext: `Utilizatorul se simte ${moodMap[emoji] || 'ok'} azi.${patternContext}
        Context motivație: ${motivationMsg}. Streak curent: ${motivation.streak} zile. Nivel: ${motivation.level}.
        Dacă energia e scăzută, menționează că XP-ul e mai mare azi.
        Calibrează răspunsul după stare. Dacă e obosit, sugerează taskuri mici. Dacă e motivat, propune ceva ambițios.
        Fii scurt (max 3 propoziții), cald, și direct. Întreabă ce are de făcut azi.`,
        stylePrompt: buildStylePrompt(styleProfile)
      })
    })

    const data = await response.json()
    addMessage('assistant', data.message)
    setLoading(false)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    addMessage('user', userMessage)
    setLoading(true)

    const allUserMessages = [...messages.filter(m => m.role === 'user').map(m => m.content), userMessage]
    if (allUserMessages.length === 3 || allUserMessages.length % 5 === 0) {
      updateStyle(allUserMessages)
    }

    const pattern = getPattern()
    const patternContext = pattern ? `\n\nPattern utilizator: ${pattern}` : ''

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, { role: 'user', content: userMessage }],
        systemContext: `Ești Flow, un asistent AI de productivitate pentru oameni cu ADHD sau deficit de concentrare.${patternContext}
        Ajuți utilizatorul să-și organizeze ziua, să spargă taskuri mari în pași mici de 25 minute, și să rămână focusat.
        Când utilizatorul îți spune ce are de făcut, sparge taskul în 3-5 pași concreți și numerotați.
        Fiecare pas trebuie să fie realizabil în 25 de minute.
        Dacă detectezi că utilizatorul e blocat sau procrastinează, oferă primul pas atât de mic încât e imposibil să refuze.`,
        stylePrompt: buildStylePrompt(styleProfile)
      })
    })

    const data = await response.json()
    const assistantMessage = data.message

    const taskRegex = /\d+\.\s+(.+)/g
    const extractedTasks: Task[] = []
    let match
    while ((match = taskRegex.exec(assistantMessage)) !== null) {
      extractedTasks.push({ id: Date.now() + extractedTasks.length, text: match[1], done: false })
    }
    if (extractedTasks.length > 0) setTasks(extractedTasks)

    addMessage('assistant', assistantMessage)
    setLoading(false)
  }

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const formatTimer = () => {
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0')
    const s = (timerSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const timerProgress = ((25 * 60 - timerSeconds) / (25 * 60)) * 100
  const completedTasks = tasks.filter(t => t.done).length

  return (
    <div className="min-h-screen bg-gray-950 text-white flex font-sans">

      <AchievementPopup achievement={achievement} onDone={dismiss} theme="dark" />

      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">Flow</span>
          {mood && <span className="ml-auto text-lg">{mood}</span>}
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Timer size={11} /> Deep Work
            </p>
            {timerActive && <span className="text-xs text-purple-400 animate-pulse">● Live</span>}
          </div>

          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#374151" strokeWidth="6" />
              <circle
                cx="48" cy="48" r="40" fill="none"
                stroke={timerActive ? '#a855f7' : '#6b7280'}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - timerProgress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-mono font-bold text-white">{formatTimer()}</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (!timerActive) addMessage('assistant', '🎯 Sesiune de 25 min începută! Focusat total.')
              setTimerActive(!timerActive)
            }}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
              timerActive ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
            } text-white`}
          >
            {timerActive ? 'Oprește' : 'Începe 25 min'}
          </button>
          {timerActive && (
            <button
              onClick={() => { setTimerActive(false); setTimerSeconds(25 * 60) }}
              className="w-full mt-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center gap-1"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
          {(['tasks', 'pattern', 'xp'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'tasks' && <><CheckCircle size={11} /> Taskuri</>}
              {tab === 'pattern' && <><Brain size={11} /> Pattern</>}
              {tab === 'xp' && <><Star size={11} /> XP</>}
            </button>
          ))}
        </div>

        {activeTab === 'tasks' && tasks.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Taskuri</p>
              <span className="text-xs text-purple-400 font-medium">{completedTasks}/{tasks.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1 mb-3">
              <div
                className="bg-purple-500 h-1 rounded-full transition-all duration-500"
                style={{ width: tasks.length > 0 ? `${(completedTasks / tasks.length) * 100}%` : '0%' }}
              />
            </div>
            <div className="space-y-1">
              {tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-start gap-2 text-left hover:bg-gray-700 rounded-lg p-2 transition-all group"
                >
                  {task.done
                    ? <CheckCircle size={15} className="text-green-400 mt-0.5 shrink-0" />
                    : <Circle size={15} className="text-gray-600 mt-0.5 shrink-0 group-hover:text-gray-400" />
                  }
                  <span className={`text-xs leading-relaxed ${task.done ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                    {task.text}
                  </span>
                </button>
              ))}
            </div>
            {completedTasks === tasks.length && tasks.length > 0 && (
              <p className="text-center text-green-400 text-xs mt-3 font-medium">🎉 Toate completate!</p>
            )}
          </div>
        )}

        {activeTab === 'pattern' && (
          <div className="bg-gray-800 rounded-xl p-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-1 mb-3">
              <TrendingUp size={12} className="text-purple-400" />
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pattern</p>
            </div>
            {sessions.length < 3 ? (
              <p className="text-xs text-gray-500 leading-relaxed">
                Mai ai {3 - sessions.length} sesiuni până la primul pattern.
              </p>
            ) : (
              <>
                <p className="text-xs text-purple-300 mb-3 leading-relaxed">{getPattern()}</p>
                {getMoodTrend() && <p className="text-xs text-gray-400 mb-4 leading-relaxed">{getMoodTrend()}</p>}
                <div className="space-y-2">
                  {sessions.slice(-7).reverse().map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs w-14 shrink-0">{s.date}</span>
                      <span className="text-sm">{s.mood || '–'}</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: s.totalTasks > 0 ? `${(s.tasksCompleted / s.totalTasks) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{s.tasksCompleted}/{s.totalTasks}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'xp' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <XPBar state={motivation} newBadges={newBadges} />
            {mood && (
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Multiplicator azi</p>
                <p className="text-xs text-purple-300">
                  {['😴', '😐', '😰'].includes(mood)
                    ? `${mood} energie scăzută → XP x${mood === '😴' ? '1.5' : '1.3'}`
                    : `${mood} energie bună → XP x${mood === '🔥' ? '0.8' : '1.0'}`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">Lucrezi obosit? Câștigi mai mult XP.</p>
              </div>
            )}
            {styleProfile.tone !== 'unknown' && (
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Stil detectat</p>
                <p className="text-xs text-teal-300">
                  {styleProfile.tone === 'informal' ? 'Casual' : 'Formal'} ·{' '}
                  {styleProfile.language === 'ro' ? 'Română' : styleProfile.language === 'en' ? 'Engleză' : 'Mix'} ·{' '}
                  {styleProfile.avgMessageLength === 'short' ? 'Mesaje scurte' : styleProfile.avgMessageLength === 'long' ? 'Mesaje lungi' : 'Mediu'}
                </p>
                {styleProfile.emojis.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{styleProfile.emojis.join(' ')}</p>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => {
            const earned = saveSession(mood, tasks)
            localStorage.removeItem('flow-messages')
            localStorage.removeItem('flow-tasks')
            localStorage.removeItem('flow-mood-today')
            setMessages([{ role: 'assistant', content: `Zi salvată! +${earned} XP. Zi nouă, start proaspăt! 😊` }])
            setTasks([])
            setCheckedIn(false)
            setMood('')
            setNewBadges([])
          }}
          className="mt-auto text-xs text-gray-600 hover:text-gray-400 transition-all flex items-center justify-center gap-1 py-1"
        >
          <RotateCcw size={10} /> Resetează ziua
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-white">Flow AI</h1>
            <p className="text-xs text-gray-500">Partenerul tău de productivitate</p>
          </div>
          <div className="flex items-center gap-3">
            {motivation.streak > 0 && (
              <span className="text-xs text-amber-400 bg-gray-800 px-3 py-1.5 rounded-full">
                🔥 {motivation.streak} zile
              </span>
            )}
            {styleProfile.tone !== 'unknown' && (
              <span className="text-xs text-teal-400 bg-gray-800 px-3 py-1.5 rounded-full">
                stil adaptat
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Zap size={13} className="text-white" />
                </div>
              )}
              <div className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-gray-800 text-gray-100 rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {!checkedIn && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Zap size={13} className="text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-sm text-gray-300 mb-3">Cum te simți azi?</p>
                <div className="flex gap-3">
                  {['😊', '😐', '😴', '😰', '🔥'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleMood(emoji)}
                      className="text-2xl hover:scale-125 transition-transform active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Zap size={13} className="text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <div className="flex gap-2 items-end">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ce ai de făcut azi? Spune-mi și spargem în pași mici..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-all active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Enter pentru trimite · Resetează ziua ca să salvezi XP-ul
            {styleProfile.tone !== 'unknown' && ` · stil ${styleProfile.tone} detectat`}
          </p>
        </div>
      </div>
    </div>
  )
}