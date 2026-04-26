'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, Target, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Milestone {
  label: string
  achieved: boolean
  description: string
}

interface RoadmapData {
  level: 'Beginner' | 'Developing' | 'Consistent' | 'Profitabel'
  score: number
  level_description: string
  next_level: string | null
  strengths: string[]
  weaknesses: string[]
  next_milestone: string
  time_estimate: string
  narrative: string
  milestones: Milestone[]
}

const LEVELS = ['Beginner', 'Developing', 'Consistent', 'Profitabel'] as const

const LEVEL_COLORS: Record<string, string> = {
  Beginner:   '#F23645',
  Developing: '#FF9800',
  Consistent: '#2962FF',
  Profitabel: '#089981',
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/ai/roadmap')
    const data = await res.json()
    setRoadmap(data.roadmap)
    setGeneratedAt(data.generated_at)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    setGenerating(true)
    setError(null)
    const res = await fetch('/api/ai/roadmap', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Generieren')
    } else {
      setRoadmap(data.roadmap)
      setGeneratedAt(new Date().toISOString())
    }
    setGenerating(false)
  }

  const levelIndex = roadmap ? LEVELS.indexOf(roadmap.level) : -1
  const color = roadmap ? (LEVEL_COLORS[roadmap.level] ?? 'var(--brand-blue)') : 'var(--brand-blue)'

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-1">KI-Analyse</div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}>
            Deine Trading-Roadmap
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-3)' }}>
            Wo stehst du? Was kommt als nächstes? KI analysiert deine letzten 90 Tage.
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={generating}
          className="h-8 px-4 text-[13px] font-semibold rounded gap-2"
          style={{ background: 'var(--brand-blue)', color: '#fff', border: 'none' }}
        >
          {generating
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analysiere…</>
            : <><RefreshCw className="h-3.5 w-3.5" /> {roadmap ? 'Neu analysieren' : 'Jetzt analysieren'}</>
          }
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(242,54,69,0.1)', color: 'var(--short)', border: '1px solid rgba(242,54,69,0.2)' }}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8" style={{ color: 'var(--fg-4)' }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Lade Roadmap…</span>
        </div>
      ) : !roadmap ? (
        <div
          className="rounded-lg p-8 text-center space-y-3"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}
        >
          <Star className="h-10 w-10 mx-auto opacity-20" style={{ color: 'var(--fg-4)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--fg-2)' }}>Noch keine Roadmap generiert</p>
          <p className="text-xs" style={{ color: 'var(--fg-4)' }}>
            Klicke auf "Jetzt analysieren" — du brauchst mindestens 5 geloggte Trades.
          </p>
        </div>
      ) : (
        <>
          {/* Level Card */}
          <div
            className="rounded-lg p-6 space-y-4"
            style={{ background: 'var(--bg-2)', border: `1px solid ${color}30` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ background: `${color}20`, color }}
                  >
                    {roadmap.level}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>{roadmap.level_description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold tabular-nums" style={{ color, fontFamily: 'Manrope, sans-serif' }}>
                  {roadmap.score}
                </p>
                <p className="text-xs" style={{ color: 'var(--fg-4)' }}>/ 100</p>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between">
                {LEVELS.map((l, i) => (
                  <span
                    key={l}
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: i <= levelIndex ? color : 'var(--fg-4)' }}
                  >
                    {l}
                  </span>
                ))}
              </div>
              <div className="relative h-2 rounded-full" style={{ background: 'var(--bg-4)' }}>
                {/* Overall level progress */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{
                    width: `${(levelIndex / (LEVELS.length - 1)) * 100 + (roadmap.score / 100) * (100 / (LEVELS.length - 1))}%`,
                    background: color,
                  }}
                />
                {/* Level tick marks */}
                {LEVELS.map((_, i) => i > 0 && (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{
                      left: `${(i / (LEVELS.length - 1)) * 100}%`,
                      background: 'var(--bg-1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {roadmap.next_level && (
              <p className="text-xs" style={{ color: 'var(--fg-4)' }}>
                Nächste Stufe: <span style={{ color: 'var(--fg-2)' }}>{roadmap.next_level}</span>
              </p>
            )}
          </div>

          {/* Narrative */}
          <div className="rounded-lg p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-2)' }}>{roadmap.narrative}</p>
          </div>

          {/* Strengths + Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--long)' }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--long)' }}>Stärken</p>
              </div>
              <ul className="space-y-2">
                {roadmap.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--fg-2)' }}>
                    <span className="shrink-0 mt-0.5" style={{ color: 'var(--long)' }}>✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'var(--short)' }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--short)' }}>Entwicklungsfelder</p>
              </div>
              <ul className="space-y-2">
                {roadmap.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--fg-2)' }}>
                    <span className="shrink-0 mt-0.5" style={{ color: 'var(--short)' }}>→</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Step + Time Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg p-4 space-y-2" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}>
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" style={{ color: 'var(--brand-blue)' }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>Nächster Schritt</p>
              </div>
              <p className="text-sm" style={{ color: 'var(--fg-1)' }}>{roadmap.next_milestone}</p>
            </div>
            <div className="rounded-lg p-4 space-y-2" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" style={{ color: 'var(--fg-3)' }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-4)' }}>Zeitschätzung</p>
              </div>
              <p className="text-sm" style={{ color: 'var(--fg-2)' }}>{roadmap.time_estimate}</p>
            </div>
          </div>

          {/* Milestones */}
          {roadmap.milestones?.length > 0 && (
            <div className="rounded-lg p-5 space-y-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}>
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" style={{ color: 'var(--brand-blue)' }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-4)' }}>Meilensteine</p>
              </div>
              <div className="space-y-3">
                {roadmap.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{
                        background: m.achieved ? 'var(--long)' : 'var(--bg-4)',
                        border: m.achieved ? 'none' : '1px solid var(--border-raw)',
                      }}
                    >
                      {m.achieved && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={cn('text-sm font-medium', !m.achieved && 'opacity-60')} style={{ color: 'var(--fg-1)' }}>
                        {m.label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--fg-4)' }}>{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generatedAt && (
            <p className="text-xs text-center" style={{ color: 'var(--fg-4)' }}>
              Zuletzt analysiert: {new Date(generatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </>
      )}
    </div>
  )
}
