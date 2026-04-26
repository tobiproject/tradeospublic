import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get last 14 days of trades
  const since = new Date(Date.now() - 14 * 86400000).toISOString()
  const { data: trades } = await supabase
    .from('trades')
    .select('asset, direction, outcome, rr_ratio, result_currency, setup_type, strategy, traded_at, notes')
    .eq('user_id', user.id)
    .gte('traded_at', since)
    .order('traded_at', { ascending: false })
    .limit(50)

  // Get user strategy if exists
  const { data: strategy } = await supabase
    .from('user_strategy')
    .select('name, description, rules, preferred_timeframes, instruments')
    .eq('user_id', user.id)
    .maybeSingle()

  const tradesSummary = !trades?.length
    ? 'Keine Trades in den letzten 14 Tagen.'
    : trades.map(t =>
        `${t.traded_at.split('T')[0]} | ${t.asset} ${t.direction?.toUpperCase()} | ${t.outcome ?? '?'} | RR: ${t.rr_ratio ?? '?'} | P&L: ${t.result_currency ?? '?'}€ | Setup: ${t.setup_type ?? '-'}`
      ).join('\n')

  const strategyContext = strategy
    ? `\nMeine Strategie: ${strategy.name}\n${strategy.description ?? ''}\nRegeln: ${strategy.rules?.join(', ') ?? '-'}\nTimeframes: ${strategy.preferred_timeframes?.join(', ') ?? '-'}\nInstrumente: ${strategy.instruments?.join(', ') ?? '-'}`
    : ''

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Du bist ein erfahrener Trading-Coach. Erstelle eine strukturierte Wochenvorbereitung für den Trader basierend auf seinen letzten Trades und seiner Strategie.
${strategyContext}

Trades der letzten 14 Tage:
${tradesSummary}

Erstelle eine kompakte Wochenvorbereitung mit diesen Abschnitten:
1. **Performance-Rückblick** — Was lief gut, was nicht? (3–4 Sätze)
2. **Haupterkenntnisse** — 2–3 konkrete Learnings aus den Daten
3. **Fokus diese Woche** — 1–2 spezifische Dinge, auf die sich der Trader konzentrieren soll
4. **Mentaler Rahmen** — Ein kurzer motivierender/fokussierender Satz

Halte jeden Abschnitt prägnant. Sprich den Trader direkt an (du-Form).`,
    }],
  })

  const prep = (message.content[0] as { type: string; text: string }).text
  return NextResponse.json({ prep })
}
