'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type View = 'login' | 'register'

interface Props {
  children: (user: User | null, signOut: () => void) => React.ReactNode
}

export default function AuthWrapper({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    if (view === 'register') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setError('Verifică emailul — ți-am trimis un link de confirmare.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email sau parolă greșită.')
    }
    setSubmitting(false)
  }

  const signOut = () => supabase.auth.signOut()

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-white text-2xl font-light">Flow</h1>
          <p className="text-gray-600 text-sm">
            {view === 'login' ? 'Bine ai revenit' : 'Creează cont nou'}
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-900 text-white text-sm px-4 py-3 rounded-xl border border-gray-800 focus:border-gray-600 focus:outline-none placeholder-gray-600"
          />
          <input
            type="password"
            placeholder="Parolă"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-gray-900 text-white text-sm px-4 py-3 rounded-xl border border-gray-800 focus:border-gray-600 focus:outline-none placeholder-gray-600"
          />
        </div>
        {error && (
          <p className={`text-xs text-center ${error.includes('Verifică') ? 'text-green-400' : 'text-red-400'}`}>
            {error}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !email || !password}
          className="w-full bg-white text-black text-sm font-medium py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? '...' : view === 'login' ? 'Intră în cont' : 'Creează cont'}
        </button>
        <p className="text-center text-xs text-gray-600">
          {view === 'login' ? 'Nu ai cont?' : 'Ai deja cont?'}{' '}
          <button
            onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError('') }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {view === 'login' ? 'Înregistrează-te' : 'Loghează-te'}
          </button>
        </p>
      </div>
    </div>
  )

  return <>{children(user, signOut)}</>
}
