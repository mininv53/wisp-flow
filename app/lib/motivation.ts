export interface MotivationState {
  xp: number
  level: number
  streak: number
  lastActiveDate: string
  graceDayUsed: boolean
  totalSessions: number
  badges: string[]
  weeklyXP: number[]
}

export const LEVELS = [
  { level: 1, name: 'Începător',  minXP: 0    },
  { level: 2, name: 'Curios',     minXP: 100  },
  { level: 3, name: 'Constant',   minXP: 250  },
  { level: 4, name: 'Focusat',    minXP: 500  },
  { level: 5, name: 'Dedicat',    minXP: 900  },
  { level: 6, name: 'Performant', minXP: 1400 },
  { level: 7, name: 'Expert',     minXP: 2000 },
  { level: 8, name: 'Maestru',    minXP: 3000 },
]

export const MOOD_MULTIPLIER: Record<string, number> = {
  '😊': 1.0,
  '😐': 1.2,
  '😴': 1.5,
  '😤': 1.3,
  '🔥': 0.8,
}

export const BADGES = [
  { id: 'first_session', label: 'Prima sesiune',  condition: (s: MotivationState) => s.totalSessions >= 1 },
  { id: 'streak_3',      label: '3 zile la rând', condition: (s: MotivationState) => s.streak >= 3        },
  { id: 'streak_7',      label: 'O săptămână',    condition: (s: MotivationState) => s.streak >= 7        },
  { id: 'streak_30',     label: 'O lună',         condition: (s: MotivationState) => s.streak >= 30       },
  { id: 'level_3',       label: 'Constant',       condition: (s: MotivationState) => s.level >= 3         },
  { id: 'level_5',       label: 'Dedicat',        condition: (s: MotivationState) => s.level >= 5         },
  { id: 'xp_500',        label: '500 XP',         condition: (s: MotivationState) => s.xp >= 500          },
  { id: 'xp_1000',       label: '1000 XP',        condition: (s: MotivationState) => s.xp >= 1000         },
]

export function calcXP(tasksCompleted: number, mood: string, sessionMinutes: number): number {
  const base = tasksCompleted * 20 + Math.floor(sessionMinutes / 5) * 5
  const multiplier = MOOD_MULTIPLIER[mood] ?? 1.0
  return Math.round(base * multiplier)
}

export function getLevel(xp: number) {
  return [...LEVELS].reverse().find(l => xp >= l.minXP) ?? LEVELS[0]
}

export function getNextLevel(xp: number) {
  return LEVELS.find(l => l.minXP > xp) ?? null
}

export function updateStreak(state: MotivationState): MotivationState {
  const today = new Date().toLocaleDateString('ro-RO')
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('ro-RO')

  if (state.lastActiveDate === today) return state

  let newStreak = state.streak
  let graceDayUsed = state.graceDayUsed

  if (state.lastActiveDate === yesterday) {
    newStreak += 1
    graceDayUsed = false
  } else {
    const twoDaysAgo = new Date(Date.now() - 172800000).toLocaleDateString('ro-RO')
    if (state.lastActiveDate === twoDaysAgo && !graceDayUsed) {
      newStreak += 1
      graceDayUsed = true
    } else {
      newStreak = 1
      graceDayUsed = false
    }
  }

  return { ...state, streak: newStreak, lastActiveDate: today, graceDayUsed }
}

export function checkNewBadges(state: MotivationState): string[] {
  return BADGES
    .filter(b => !state.badges.includes(b.id) && b.condition(state))
    .map(b => b.id)
}

export function getMotivationMessage(state: MotivationState, mood: string): string {
  if (state.streak >= 7) return `${state.streak} zile consecutiv. Creierul tău s-a reconfigurat deja.`
  if (state.streak >= 3) return `3 zile la rând. Obiceiul se formează.`
  if (mood === '😴' || mood === '😐') return `Energie scăzută azi — XP dublu pentru fiecare task finalizat.`
  if (mood === '🔥') return `Energie maximă. Zi bună pentru taskuri dificile.`
  return `Ziua ${state.streak > 0 ? state.streak : 1} din seria ta.`
}

export interface StyleProfile {
  tone: 'formal' | 'informal' | 'unknown'
  avgMessageLength: 'short' | 'medium' | 'long'
  emojis: string[]
  language: 'ro' | 'en' | 'mix'
  sampleMessages: string[]
}

export function analyzeStyle(messages: string[]): StyleProfile {
  if (messages.length === 0) return {
    tone: 'unknown', avgMessageLength: 'medium',
    emojis: [], language: 'ro', sampleMessages: []
  }

  const text = messages.join(' ')

  // Detectare ton
  const informalSignals = ['bă', 'frate', 'ok', 'oke', 'da', 'nu', 'mișto', 'tare', 'super', 'hai', 'lasă', 'uite', 'bre', 'ngl', 'tbh', 'lol', 'omg']
  const informalCount = informalSignals.filter(w => text.toLowerCase().includes(w)).length
  const tone = informalCount >= 2 ? 'informal' : 'formal'

  // Lungime medie
  const avgLen = messages.reduce((sum, m) => sum + m.length, 0) / messages.length
  const avgMessageLength = avgLen < 30 ? 'short' : avgLen < 100 ? 'medium' : 'long'

  // Emoji-uri folosite
  const emojiRegex = /[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const foundEmojis = [...new Set(text.match(emojiRegex) ?? [])]

  // Limbă
  const roWords = ['și', 'că', 'nu', 'da', 'este', 'sunt', 'am', 'eu', 'tu', 'hai', 'bine', 'azi', 'acum', 'fac', 'ai', 'îmi', 'îți']
  const enWords = ['the', 'is', 'are', 'and', 'you', 'ok', 'okay', 'yeah', 'nope', 'cant', 'dont', 'im', 'its']
  const roCount = roWords.filter(w => text.toLowerCase().includes(w)).length
  const enCount = enWords.filter(w => text.toLowerCase().includes(w)).length
  const language = roCount > enCount * 2 ? 'ro' : enCount > roCount * 2 ? 'en' : 'mix'

  return {
    tone, avgMessageLength, emojis: foundEmojis.slice(0, 5),
    language, sampleMessages: messages.slice(-3)
  }
}

export function buildStylePrompt(profile: StyleProfile): string {
  if (profile.tone === 'unknown') return ''

  const parts: string[] = []

  if (profile.tone === 'informal') {
    parts.push('Vorbește casual și relaxat, ca un prieten bun. Fără limbaj corporativ sau formal.')
  } else {
    parts.push('Vorbește profesional dar cald, fără a fi rece.')
  }

  if (profile.avgMessageLength === 'short') {
    parts.push('Mesajele tale să fie SCURTE — maxim 2-3 propoziții. Utilizatorul preferă răspunsuri concise.')
  } else if (profile.avgMessageLength === 'long') {
    parts.push('Poți fi mai detaliat — utilizatorul scrie mult și apreciază explicații complete.')
  }

  if (profile.emojis.length > 0) {
    parts.push(`Folosește emoji-uri natural în răspunsuri, în special: ${profile.emojis.join(' ')}`)
  }

  if (profile.language === 'en') {
    parts.push('Răspunde în engleză.')
  } else if (profile.language === 'mix') {
    parts.push('Utilizatorul mixează română și engleză — poți face la fel natural.')
  } else {
    parts.push('Răspunde în română.')
  }

  if (profile.sampleMessages.length > 0) {
    parts.push(`Stilul utilizatorului din mesaje recente: "${profile.sampleMessages[profile.sampleMessages.length - 1]}"`)
  }

  return '\n\nADAPTARE STIL UTILIZATOR:\n' + parts.join('\n')
}