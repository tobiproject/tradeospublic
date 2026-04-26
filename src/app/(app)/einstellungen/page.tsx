'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

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

const TIMEFRAME_OPTIONS = ['1m', '5m', '15m', '30m', '1h', '4h', 'D', 'W']

export default function EinstellungenPage() {
  const [strategy, setStrategy] = useState<Strategy>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newRule, setNewRule] = useState('')
  const [newInstrument, setNewInstrument] = useState('')

  useEffect(() => {
    fetch('/api/strategy')
      .then(r => r.json())
      .then(data => {
        if (data.strategy) {
          setStrategy({
            name: data.strategy.name || '',
            description: data.strategy.description || '',
            rules: data.strategy.rules || [],
            preferred_timeframes: data.strategy.preferred_timeframes || [],
            instruments: data.strategy.instruments || [],
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

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

  const addInstrument = () => {
    const v = newInstrument.trim().toUpperCase()
    if (!v || strategy.instruments.includes(v)) return
    setStrategy(s => ({ ...s, instruments: [...s.instruments, v] }))
    setNewInstrument('')
  }

  const removeInstrument = (i: number) =>
    setStrategy(s => ({ ...s, instruments: s.instruments.filter((_, j) => j !== i) }))

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

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Name */}
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
          <Section title="Instrumente / Märkte" subtitle="Welche Assets tradest du?">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {strategy.instruments.map((inst, i) => (
                  <span
                    key={i}
                    className="ticker text-xs flex items-center gap-1.5 px-2.5 py-1 rounded"
                    style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', border: '1px solid var(--border-raw)' }}
                  >
                    {inst}
                    <button onClick={() => removeInstrument(i)}>
                      <Trash2 className="h-3 w-3" style={{ color: 'var(--fg-4)' }} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newInstrument}
                  onChange={e => setNewInstrument(e.target.value)}
                  placeholder="EURUSD, NQ, BTC…"
                  className="ticker uppercase"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInstrument())}
                />
                <Button
                  type="button"
                  onClick={addInstrument}
                  className="h-8 px-3 shrink-0 rounded"
                  style={{ background: 'var(--bg-3)', color: 'var(--fg-1)', border: '1px solid var(--border-raw)' }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
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
