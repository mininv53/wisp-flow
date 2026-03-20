import { useState, useCallback, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function useConversationQuiz(triggerAfterMessages = 5) {
  const [showQuiz, setShowQuiz] = useState(false)
  const [summary, setSummary] = useState('')
  const messageCountRef = useRef(0)
  const lastQuizCountRef = useRef(0)

  const trackMessage = useCallback(async (messages: Message[]) => {
    const userMessages = messages.filter(m => m.role === 'user')
    messageCountRef.current = userMessages.length

    const sinceLastQuiz = messageCountRef.current - lastQuizCountRef.current

    if (sinceLastQuiz >= triggerAfterMessages && userMessages.length >= triggerAfterMessages) {
      // Build summary from last N messages
      const recent = messages.slice(-10)
      const text = recent.map(m => `${m.role === 'user' ? 'Utilizator' : 'AI'}: ${m.content}`).join('\n')
      setSummary(text)
      setShowQuiz(true)
    }
  }, [triggerAfterMessages])

  const dismissQuiz = useCallback(() => {
    setShowQuiz(false)
    lastQuizCountRef.current = messageCountRef.current
  }, [])

  const completeQuiz = useCallback(() => {
    setShowQuiz(false)
    lastQuizCountRef.current = messageCountRef.current
  }, [])

  return { showQuiz, summary, trackMessage, dismissQuiz, completeQuiz }
}