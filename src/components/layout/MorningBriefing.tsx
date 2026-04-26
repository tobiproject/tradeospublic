'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

const CHECKLIST = [
  'Ich bin ausgeschlafen und mental fokussiert',
  'Ich habe meinen Tagesplan ausgefüllt',
  'Ich kenne die heutigen High-Impact Events',
  'Ich kenne mein Tageslimit und werde es respektieren',
  'Ich trade nur mein Setup — kein FOMO, kein Revenge Trading',
]

export function MorningBriefing() {
  const [visible, setVisible] = useState(false)
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false))
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const key = `tradeos-morning-${today}`
    if (!localStorage.getItem(key)) {
      setVisible(true)
      fetch('/api/profile').then(r => r.json()).then(d => setDisplayName(d.display_name ?? null))
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`tradeos-morning-${today}`, '1')
    setVisible(false)
  }

  const allChecked = checked.every(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-[440px] mx-4 rounded-lg p-7 flex flex-col gap-6"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}
      >
        {/* Header */}
        <div>
          <div className="eyebrow mb-1">
            {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
          </div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}
          >
            {displayName ? `Guten Morgen, ${displayName}.` : 'Bereit für den Tag?'}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>
            Hak ab, bevor du anfängst zu traden.
          </p>
        </div>

        {/* Checklist */}
        <ul className="flex flex-col gap-3">
          {CHECKLIST.map((item, i) => (
            <li
              key={i}
              onClick={() => setChecked(prev => prev.map((v, j) => j === i ? !v : v))}
              className="flex items-start gap-3 cursor-pointer select-none"
            >
              {/* Checkbox */}
              <span className="shrink-0 mt-0.5" style={{ color: checked[i] ? 'var(--long)' : 'var(--fg-4)' }}>
                {checked[i] ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect width="16" height="16" rx="3" fill="currentColor"/>
                    <path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="0.5" y="0.5" width="15" height="15" rx="2.5" stroke="currentColor"/>
                  </svg>
                )}
              </span>
              {/* Label */}
              <span
                className="text-sm leading-snug transition-all"
                style={{
                  color: checked[i] ? 'var(--fg-3)' : 'var(--fg-1)',
                  textDecoration: checked[i] ? 'line-through' : 'none',
                }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={dismiss}
            className="text-xs transition-colors"
            style={{ color: 'var(--fg-4)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--fg-2)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--fg-4)')}
          >
            Überspringen
          </button>
          <Button
            onClick={dismiss}
            disabled={!allChecked}
            className="h-8 px-4 text-[13px] font-semibold rounded"
            style={{
              background: allChecked ? 'var(--brand-blue)' : 'var(--bg-3)',
              color: allChecked ? '#fff' : 'var(--fg-4)',
              border: 'none',
              opacity: 1,
            }}
          >
            Bereit zum Traden →
          </Button>
        </div>
      </div>
    </div>
  )
}
