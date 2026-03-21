// app/lib/useSyncProgress.ts
// Sincronizează automat XP + streak în Supabase după fiecare update

import { useEffect, useRef, useCallback } from 'react'
import type { MotivationState } from './motivation'
import { getLevel } from './motivation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Generează sau recuperează un ID anonim stabil din localStorage
function getAnonId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = localStorage.getItem('wisp-anon-id')
  if (!id) {
    id = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('wisp-anon-id', id)
  }
  return id
}

// Recuperează username salvat local
function getStoredUsername(product: string): string {
  if (typeof window === 'undefined') return 'Utilizator'
  return localStorage.getItem(`${product}-username`) || 'Utilizator'
}

// Inițiale din username
function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

async function upsertProgress(
  anonId: string,
  username: string,
  product: string,
  state: MotivationState
) {
  const level = getLevel(state.xp)
  const initials = getInitials(username)

  // Upsert — dacă există updatează, dacă nu creează
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_progress`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      anon_id: anonId,
      username,
      avatar_initials: initials,
      product,
      xp: state.xp,
      level: level.level,
      streak: state.streak,
      total_sessions: state.totalSessions,
      last_active: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.warn('[useSyncProgress] Supabase error:', err)
  }
}

interface SyncOptions {
  product: 'junior' | 'teen' | 'flow'
  username?: string
}

export function useSyncProgress(state: MotivationState, options: SyncOptions) {
  const anonId = useRef<string>('')
  const lastSyncedXP = useRef<number>(-1)
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    anonId.current = getAnonId()
  }, [])

  // Sincronizează cu debounce de 3s — nu spamăm Supabase
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!anonId.current) return
    if (state.xp === lastSyncedXP.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const username = options.username || getStoredUsername(options.product)
      lastSyncedXP.current = state.xp
      upsertProgress(anonId.current, username, options.product, state)
    }, 3000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [state.xp, state.streak, state.totalSessions, options.product, options.username])

  // Funcție pentru a seta username manual
  const setUsername = useCallback((name: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(`${options.product}-username`, name)
  }, [options.product])

  return { setUsername, anonId: anonId.current }
}