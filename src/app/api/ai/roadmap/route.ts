import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const client = new Anthropic()

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load last 90 days of trades
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: trades } = await supabase
    .from('trades')
    .select('asset, direction, outcome, rr_ratio, risk_percent, result_percent, emotion_before, emotion_after, setup_type, lesson_learned, what_went_well, what_to_improve, traded_at')
    .eq('user_id', user.id)
    .gte('traded_at', since)
    .order('traded_at', { ascending: true })
    .limit(200)

  // Load strategy
  const { data: strategyRow } = await supabase
    .from('user_strategy')
    .select('name, description, rules')
    .eq('user_id', user.id)
    .single()

  if (!trades || trades.length < 5) {
    return NextResponse.json({ error: 'Zu wenige Trades für eine Analyse (mind. 5 nötig).' }, { status: 422 })
  }

  const wins = trades.filter(t => t.outcome === 'win').length
  const losses = trades.filter(t => t.outcome === 'loss').length
  const winRate = Math.round((wins / trades.length) * 100)
  const avgRR = trades.filter(t => t.rr_ratio).reduce((s, t) => s + (t.rr_ratio ?? 0), 0) / trades.filter(t => t.rr_ratio).length

  const prompt = `Du bist ein erfahrener Trading-Coach. Analysiere die Trading-Performance des Traders und erstelle eine ehrliche, motivierende Roadmap.

STRATEGIE: ${strategyRow?.name ?? 'Unbekannt'} — ${strategyRow?.description ?? 'Keine Beschreibung'}
REGELN: ${(strategyRow?.rules ?? []).join('; ') || 'Keine'}

TRADES (letzte 90 Tage): ${trades.length} Trades
- Win-Rate: ${winRate}%
- Wins: ${wins}, Losses: ${losses}
- Durchschnittliches RR: ${avgRR.toFixed(2)}
- Assets: ${[...new Set(trades.map(t => t.asset))].join(', ')}
- Emotions vor Trades: ${[...new Set(trades.map(t => t.emotion_before).filter(Boolean))].join(', ')}
- Lektionen aus Nachbereitungen: ${trades.filter(t => t.lesson_learned).map(t => t.lesson_learned).slice(-10).join(' | ') || 'Keine'}

Antworte NUR mit einem JSON-Objekt in diesem exakten Format (kein Markdown, kein Text darum):
{
  "level": "Beginner" | "Developing" | "Consistent" | "Profitabel",
  "score": <Zahl 0-100 wie weit du in deiner aktuellen Stufe bist>,
  "level_description": "<1 Satz was diese Stufe bedeutet>",
  "next_level": "<Name der nächsten Stufe oder null wenn bereits Profitabel>",
  "strengths": ["<Stärke 1>", "<Stärke 2>", "<Stärke 3>"],
  "weaknesses": ["<Schwäche 1>", "<Schwäche 2>", "<Schwäche 3>"],
  "next_milestone": "<Konkreter nächster Schritt — was muss sich ändern>",
  "time_estimate": "<Ehrliche Einschätzung z.B. '3-6 Monate bei aktueller Entwicklung'>",
  "narrative": "<3-4 motivierende Sätze die den aktuellen Stand und die Reise beschreiben>",
  "milestones": [
    { "label": "<Meilenstein>", "achieved": <true|false>, "description": "<kurze Erklärung>" }
  ]
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  let roadmapData: Record<string, unknown>
  try {
    roadmapData = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'KI-Antwort konnte nicht verarbeitet werden.' }, { status: 500 })
  }

  // Upsert into user_roadmap
  await supabase.from('user_roadmap').upsert(
    { user_id: user.id, data: roadmapData, generated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ roadmap: roadmapData })
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('user_roadmap')
    .select('data, generated_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ roadmap: data?.data ?? null, generated_at: data?.generated_at ?? null })
}
