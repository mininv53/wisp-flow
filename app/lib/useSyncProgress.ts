import { useEffect, useRef, useCallback } from 'react'
import type { MotivationState } from './motivation'
import { getLevel } from './motivation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getAnonId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = localStorage.getItem('wisp-anon-id')
  if (!id) {
    id = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('wisp-anon-id', id)
  }
  return id
}

function getStoredUsername(product: string): string {
  if (typeof window === 'undefined') return 'Utilizator'
  return localStorage.getItem(`${product}-username`) || 'Utilizator'
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

async function syncToSupabase(motivation: MotivationState, product: string): Promise<void> {
  if (typeof window === 'undefined') return
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  const anonId = getAnonId()
  const username = getStoredUsername(product)
  const initials = getInitials(username)
  const level = getLevel(motivation.xp).level

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/user_progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        anon_id: anonId,
        username,
        avatar_initials: initials,
        product,
        xp: motivation.xp,
        level,
        streak: motivation.streak,
        total_sessions: motivation.totalSessions,
        last_active: new Date().toISOString(),
      }),
    })
  } catch (e) {
    console.warn('Sync failed:', e)
  }
}

export function useSyncProgress(
  motivation: MotivationState,
  options: { product: 'junior' | 'teen' | 'flow' }
) {
  const { product } = options
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevXP = useRef(motivation.xp)
  const prevStreak = useRef(motivation.streak)

  const sync = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      syncToSupabase(motivation, product)
    }, 3000)
  }, [motivation, product])

  useEffect(() => {
    if (motivation.xp !== prevXP.current || motivation.streak !== prevStreak.current) {
      prevXP.current = motivation.xp
      prevStreak.current = motivation.streak
      sync()
    }
  }, [motivation.xp, motivation.streak, sync])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])
}