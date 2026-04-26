'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Loader2, Check, Plus, ExternalLink, Brain } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { AssetMultiPicker } from '@/components/watchlist/AssetMultiPicker'

interface Strategy {
  name: string
  description: string
  rules: string[]
  preferred_timeframes: string[]
  instruments: string[]
}

const EMPTY: Strategy = {
  name: 'Meine Strategie',
  description: '',
  rules: [],
  preferred_timeframes: [],
  instruments: [],
}

const EXAMPLE_STRATEGY: Strategy = {
  name: 'NQ/ES Momentum Breakout',
  description: 'Intraday Momentum-Strategie auf E-Mini Futures (NQ & ES). Ich trade ausschließlich in der ersten Handelsstunde (9:30–11:00 ET) und in der Nachmittagssession (14:00–16:00 ET). Einstiege erfolgen nach bestätigten Breakouts aus dem Opening Range oder nach Pullbacks an wichtige VWAP-Levels. Kein Trading gegen den Tagestrend.',
  rules: [
    'Kein Trade vor 9:45 ET — Opening-Volatilität abwarten',
    'Nur in Trendrichtung traden — H1 Trend bestimmt Bias für den Tag',
    'Entry nur nach Konsolidierung und Volumen-Bestätigung (kein Thin-Air-Entry)',
    'Stop Loss immer hinter letztem Swing High/Low — kein fester Pip-Stop',
    'Maximales Risiko pro Trade: 1% des Kontostands (ca. $100 bei $10k)',
    'Kein Trade nach 2 aufeinanderfolgenden Verlusten — Pause einlegen',
    'Nachrichten-Events (FOMC, NFP, CPI) meiden — 30min vor und nach',
    'Tagesgewinnlimit: +$300 — danach Bildschirm aus',
    'Tagesverlustlimit: -$200 — danach kein weiterer Trade',
  ],
  preferred_timeframes: ['5m', '15m', '1h'],
  instruments: ['NQ', 'ES'],
}

const TIMEFRAME_OPTIONS = ['1m', '5m', '15m', '30m', '1h', '4h', 'D', 'W']

export default function EinstellungenPage() {
  const [strategy, setStrategy] = useState<Strategy>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newRule, setNewRule] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/strategy').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([stratData, profileData]) => {
      if (stratData.strategy) {
        setStrategy({
          name: stratData.strategy.name || '',
          description: stratData.strategy.description || '',
          rules: stratData.strategy.rules || [],
          preferred_timeframes: stratData.strategy.preferred_timeframes || [],
          instruments: stratData.strategy.instruments || [],
        })
      }
      setDisplayName(profileData.display_name ?? '')
    }).finally(() => setLoading(false))
  }, [])

  const saveName = useCallback(async () => {
    setNameSaving(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName }),
    })
    setNameSaving(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2500)
  }, [displayName])

  const save = useCallback(async () => {
    setSaving(true)
    const res = await fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }, [strategy])

  const addRule = () => {
    const r = newRule.trim()
    if (!r) return
    setStrategy(s => ({ ...s, rules: [...s.rules, r] }))
    setNewRule('')
  }

  const removeRule = (i: number) =>
    setStrategy(s => ({ ...s, rules: s.rules.filter((_, j) => j !== i) }))

  const toggleTF = (tf: string) =>
    setStrategy(s => ({
      ...s,
      preferred_timeframes: s.preferred_timeframes.includes(tf)
        ? s.preferred_timeframes.filter(t => t !== tf)
        : [...s.preferred_timeframes, tf],
    }))


  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-1">Konfiguration</div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}
          >
            Strategie-Profil
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-3)' }}>
            Definiere deine Trading-Strategie — die KI nutzt dieses Profil für alle Analysen.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setStrategy(EXAMPLE_STRATEGY)}
            className="h-8 px-3 text-[13px] font-semibold rounded"
            style={{ background: 'var(--bg-3)', color: 'var(--fg-2)', border: '1px solid var(--border-raw)' }}
            title="Befüllt das Formular mit einer Beispielstrategie — du kannst sie danach anpassen oder löschen"
          >
            Beispiel laden
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="h-8 px-4 text-[13px] font-semibold rounded"
            style={{ background: 'var(--brand-blue)', color: '#fff', border: 'none' }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : saved ? <Check className="h-4 w-4 mr-2" /> : null}
            {saved ? 'Gespeichert' : 'Speichern'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Profile */}
          <Section title="Dein Profil" subtitle="Wird für personalisierte Begrüßungen und KI-Kontext verwendet">
            <div className="flex gap-2">
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Wie soll dich NOUS nennen? z.B. Tobi"
                className="flex-1"
              />
              <Button
                onClick={saveName}
                disabled={nameSaving}
                className="h-8 px-4 text-[13px] font-semibold rounded shrink-0"
                style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', border: '1px solid var(--border-raw)' }}
              >
                {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : nameSaved ? <Check className="h-4 w-4" /> : 'Speichern'}
              </Button>
            </div>
          </Section>

          {/* Strategy Name */}
          <Section title="Strategie-Name">
            <Input
              value={strategy.name}
              onChange={e => setStrategy(s => ({ ...s, name: e.target.value }))}
              placeholder="z.B. Trend-Following mit Breakout-Entries"
            />
          </Section>

          {/* Description */}
          <Section title="Beschreibung" subtitle="Kurze Zusammenfassung deines Ansatzes">
            <Textarea
              rows={4}
              value={strategy.description}
              onChange={e => setStrategy(s => ({ ...s, description: e.target.value }))}
              placeholder="Beschreibe deinen Trading-Stil, Ansatz und Philosophie…"
              className="resize-none"
            />
          </Section>

          {/* Trading Rules */}
          <Section title="Trading-Regeln" subtitle="Konkrete Regeln, die dein Setup definieren">
            <div className="space-y-2">
              {strategy.rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded px-3 py-2"
                  style={{ background: 'var(--bg-3)' }}
                >
                  <span className="num text-xs shrink-0 mt-0.5" style={{ color: 'var(--fg-4)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm flex-1" style={{ color: 'var(--fg-1)' }}>{rule}</span>
                  <button onClick={() => removeRule(i)}>
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--fg-4)' }} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  placeholder="Neue Regel hinzufügen…"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())}
                />
                <Button
                  type="button"
                  onClick={addRule}
                  className="h-8 px-3 shrink-0 rounded"
                  style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', border: '1px solid var(--border-raw)' }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Section>

          {/* Timeframes */}
          <Section title="Bevorzugte Timeframes">
            <div className="flex flex-wrap gap-2">
              {TIMEFRAME_OPTIONS.map(tf => {
                const active = strategy.preferred_timeframes.includes(tf)
                return (
                  <button
                    key={tf}
                    onClick={() => toggleTF(tf)}
                    className="num text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                    style={{
                      background: active ? 'var(--brand-blue)' : 'var(--bg-3)',
                      color: active ? '#fff' : 'var(--fg-2)',
                      border: `1px solid ${active ? 'var(--brand-blue)' : 'var(--border-raw)'}`,
                    }}
                  >
                    {tf}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Instruments */}
          <Section title="Instrumente / Märkte" subtitle="Welche Assets tradest du? Aus deiner Watchlist wählen.">
            <AssetMultiPicker
              value={strategy.instruments}
              onChange={instruments => setStrategy(s => ({ ...s, instruments }))}
              placeholder="Asset aus Watchlist…"
            />
          </Section>

          {/* Anthropic API Costs */}
          <Section title="KI-Kosten (Anthropic)" subtitle="NOUS nutzt Claude Sonnet für alle KI-Funktionen — hier deine Kosten im Blick behalten.">
            <div className="space-y-3">
              <div
                className="rounded px-4 py-3 flex items-start gap-3"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--border-raw)' }}
              >
                <Brain className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--brand-blue)' }} />
                <div className="text-sm space-y-1" style={{ color: 'var(--fg-3)' }}>
                  <p>Jede KI-Analyse (Trade-Analyse, Roadmap, Wochenvorbereitung) kostet ca. <span style={{ color: 'var(--fg-1)' }}>$0.002–$0.01</span> — bei normalem Nutzungsverhalten unter <span style={{ color: 'var(--fg-1)' }}>$5/Monat</span>.</p>
                  <p className="text-xs" style={{ color: 'var(--fg-4)' }}>Exakte Kosten und Verbrauch siehst du im Anthropic Console.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="https://console.anthropic.com/settings/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: 'var(--brand-blue)', color: '#fff' }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Billing & Kosten öffnen
                </Link>
                <Link
                  href="https://console.anthropic.com/settings/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: 'var(--bg-3)', color: 'var(--fg-2)', border: '1px solid var(--border-raw)' }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  API Usage ansehen
                </Link>
              </div>
            </div>
          </Section>

        </div>
      )}
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-5 space-y-3"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>{title}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
