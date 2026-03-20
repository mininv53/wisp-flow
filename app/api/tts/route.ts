// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server'

const VOICES: Record<string, string> = {
  junior: process.env.ELEVENLABS_VOICE_JUNIOR || 'S98OhkhaxeAKHEbhoLi7',
  teen:   process.env.ELEVENLABS_VOICE_TEEN   || 'S98OhkhaxeAKHEbhoLi7',
  flow:   process.env.ELEVENLABS_VOICE_FLOW   || 'S98OhkhaxeAKHEbhoLi7',
}

export async function POST(req: NextRequest) {
  try {
    const { text, segment } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }

    const voiceId = VOICES[segment as string] || VOICES.flow
    const apiKey  = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key not set' }, { status: 500 })
    }

    const el = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.slice(0, 500), // limit per request
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!el.ok) {
      const err = await el.text()
      console.error('ElevenLabs error:', err)
      return NextResponse.json({ error: 'ElevenLabs failed', detail: err }, { status: 502 })
    }

    const audioBuffer = await el.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('TTS route error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}