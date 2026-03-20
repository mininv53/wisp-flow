// app/lib/useVoice.ts
// ElevenLabs primary → Web Speech API fallback

type Segment = 'junior' | 'teen' | 'flow'

interface SpeakOptions {
  onStart?: () => void
  onEnd?:   () => void
  onError?: () => void
}

// Pitch/rate per segment pentru Web Speech fallback
const WS_SETTINGS: Record<Segment, { rate: number; pitch: number; volume: number }> = {
  junior: { rate: 1.05, pitch: 1.1,  volume: 1 },
  teen:   { rate: 1.0,  pitch: 1.0,  volume: 1 },
  flow:   { rate: 0.88, pitch: 0.92, volume: 1 },
}

let currentAudio: HTMLAudioElement | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
}

function speakWebSpeech(text: string, segment: Segment, opts: SpeakOptions) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    opts.onError?.()
    return
  }

  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  const cfg = WS_SETTINGS[segment]
  utter.rate   = cfg.rate
  utter.pitch  = cfg.pitch
  utter.volume = cfg.volume
  utter.lang   = 'ro-RO'

  // Alege cea mai bună voce disponibilă
  const voices = window.speechSynthesis.getVoices()
  const preferred = [
    'Microsoft Andrei',
    'Microsoft George',
    'Google română',
    'Google ro-RO',
  ]
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name))
    if (v) { utter.voice = v; break }
  }
  // fallback la orice voce română
  if (!utter.voice) {
    const ro = voices.find(v => v.lang.startsWith('ro'))
    if (ro) utter.voice = ro
  }

  utter.onstart = () => opts.onStart?.()
  utter.onend   = () => { currentUtterance = null; opts.onEnd?.() }
  utter.onerror = () => { currentUtterance = null; opts.onError?.() }

  currentUtterance = utter
  window.speechSynthesis.speak(utter)
}

export async function speak(text: string, segment: Segment, opts: SpeakOptions) {
  if (!text.trim()) return
  stopSpeaking()
  opts.onStart?.()

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, segment }),
    })

    if (!res.ok) throw new Error('ElevenLabs failed')

    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio

    audio.onended = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      opts.onEnd?.()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      currentAudio = null
      // fallback la Web Speech
      speakWebSpeech(text, segment, opts)
    }

    await audio.play()
  } catch {
    // ElevenLabs indisponibil → fallback Web Speech
    speakWebSpeech(text, segment, opts)
  }
}

export async function loadVoices(): Promise<void> {
  if (typeof window === 'undefined') return
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) { resolve(); return }
    window.speechSynthesis.onvoiceschanged = () => resolve()
  })
}