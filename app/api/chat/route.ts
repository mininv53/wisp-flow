import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const { messages, systemContext, stylePrompt } = await request.json()

    const fullSystem = (systemContext || 'Ești Flow, un asistent AI de productivitate. Răspunde în română.')
      + (stylePrompt || '')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: fullSystem,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ message: text })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ message: 'Eroare server. Încearcă din nou.' }, { status: 500 })
  }
}