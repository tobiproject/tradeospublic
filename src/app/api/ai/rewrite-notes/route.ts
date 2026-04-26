import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { notes } = await req.json()
  if (!notes?.trim()) return NextResponse.json({ error: 'Kein Text vorhanden' }, { status: 400 })

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Du bist ein Trading-Journal-Assistent. Der folgende Text wurde per Spracheingabe (z.B. Wispr Flow) diktiert und enthält typische Diktierfehler, Füllwörter und unstrukturierte Gedanken eines Traders.

Bereinige den Text: korrigiere Fehler, entferne Füllwörter ("ähm", "also", "irgendwie"), strukturiere die Gedanken klar und präzise. Behalte alle inhaltlichen Details und den Trading-Kontext vollständig. Schreibe in der ersten Person. Antworte NUR mit dem bereinigten Text — keine Erklärungen, keine Präambel.

Originaltext:
${notes}`,
    }],
  })

  const rewritten = (message.content[0] as { type: string; text: string }).text
  return NextResponse.json({ rewritten })
}
