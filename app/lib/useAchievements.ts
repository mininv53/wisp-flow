import { useState, useCallback } from 'react'
import type { Achievement } from '../components/AchievementPopup'
import { getLevel, getNextLevel, type MotivationState } from './motivation'

export function useAchievements() {
  const [current, setCurrent] = useState<Achievement | null>(null)
  const [queue, setQueue] = useState<Achievement[]>([])

  const show = useCallback((a: Achievement) => {
    setCurrent(prev => {
      if (prev) {
        setQueue(q => [...q, a])
        return prev
      }
      return a
    })
  }, [])

  const dismiss = useCallback(() => {
    setQueue(q => {
      if (q.length === 0) {
        setCurrent(null)
        return q
      }
      const [next, ...rest] = q
      setCurrent(next)
      return rest
    })
  }, [])

  const checkAndShow = useCallback((
    prev: MotivationState,
    next: MotivationState,
    extraXP: number,
    context?: { puzzleCorrect?: boolean; missionDone?: boolean; taskDone?: boolean }
  ) => {
    const prevLevel = getLevel(prev.xp)
    const nextLevel = getLevel(next.xp)

    // Level up
    if (nextLevel.level > prevLevel.level) {
      show({
        id: `levelup-${nextLevel.level}`,
        type: 'levelup',
        title: nextLevel.name,
        subtitle: `Ai ajuns la nivelul ${nextLevel.level}!`,
        xp: extraXP,
        level: nextLevel.level,
      })
    }

    // Streak milestones
    if (next.streak === 3 && prev.streak < 3) {
      show({
        id: 'streak-3',
        type: 'streak',
        title: '3 zile la rând!',
        subtitle: 'Obiceiul se formează. Continuă!',
        xp: 30,
        emoji: '🔥',
      })
    } else if (next.streak === 7 && prev.streak < 7) {
      show({
        id: 'streak-7',
        type: 'streak',
        title: 'O săptămână!',
        subtitle: 'Creierul tău s-a reconfigurat deja.',
        xp: 100,
        emoji: '🔥🔥',
      })
    } else if (next.streak === 30 && prev.streak < 30) {
      show({
        id: 'streak-30',
        type: 'streak',
        title: 'O lună consecutiv!',
        subtitle: 'Ești în top 1% dintre utilizatori.',
        xp: 500,
        emoji: '🏆',
      })
    }

    // Puzzle correct
    if (context?.puzzleCorrect) {
      show({
        id: `puzzle-${Date.now()}`,
        type: 'puzzle',
        title: 'Răspuns corect!',
        subtitle: 'Creierul tău a rezolvat-o!',
        xp: extraXP,
      })
    }

    // Mission done
    if (context?.missionDone) {
      show({
        id: `mission-${Date.now()}`,
        type: 'mission',
        title: 'Misiune completă!',
        subtitle: '8 minute de concentrare totală.',
        xp: extraXP,
        emoji: '⭐',
      })
    }

    // Task done in Teen
    if (context?.taskDone) {
      show({
        id: `task-${Date.now()}`,
        type: 'xp',
        title: `+${extraXP} XP`,
        subtitle: 'Task bifat. Continuă!',
        xp: extraXP,
      })
    }

    // XP milestones
    if (prev.xp < 500 && next.xp >= 500) {
      show({ id: 'xp-500', type: 'badge', title: '500 XP!', subtitle: 'Ești serios în ceea ce faci.', emoji: '💜', xp: 50 })
    }
    if (prev.xp < 1000 && next.xp >= 1000) {
      show({ id: 'xp-1000', type: 'badge', title: '1000 XP!', subtitle: 'Un utilizator din 10 ajunge aici.', emoji: '🏆', xp: 100 })
    }

    // First session
    if (prev.totalSessions === 0 && next.totalSessions === 1) {
      show({ id: 'first-session', type: 'badge', title: 'Prima sesiune!', subtitle: 'Bun venit în ecosistem.', emoji: '👋', xp: 10 })
    }
  }, [show])

  return { current, dismiss, show, checkAndShow }
}