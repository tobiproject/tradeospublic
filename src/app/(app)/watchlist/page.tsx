'use client'

import { useState } from 'react'
import { Plus, Trash2, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWatchlist } from '@/hooks/useWatchlist'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'futures',  label: 'Futures' },
  { value: 'forex',    label: 'Forex' },
  { value: 'crypto',   label: 'Crypto' },
  { value: 'stocks',   label: 'Aktien' },
  { value: 'indices',  label: 'Indices' },
  { value: 'cfd',      label: 'CFD' },
  { value: 'other',    label: 'Sonstige' },
]

const QUICK_ADD: { symbol: string; name: string; category: string }[] = [
  { symbol: 'NQ',      name: 'Nasdaq 100 Futures',     category: 'futures' },
  { symbol: 'ES',      name: 'S&P 500 Futures',        category: 'futures' },
  { symbol: 'YM',      name: 'Dow Jones Futures',      category: 'futures' },
  { symbol: 'RTY',     name: 'Russell 2000 Futures',   category: 'futures' },
  { symbol: 'CL',      name: 'Crude Oil Futures',      category: 'futures' },
  { symbol: 'GC',      name: 'Gold Futures',           category: 'futures' },
  { symbol: 'EURUSD',  name: 'Euro / US Dollar',       category: 'forex' },
  { symbol: 'GBPUSD',  name: 'British Pound / USD',    category: 'forex' },
  { symbol: 'USDJPY',  name: 'US Dollar / Yen',        category: 'forex' },
  { symbol: 'AUDUSD',  name: 'Australian Dollar',      category: 'forex' },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar',    category: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar',   category: 'crypto' },
  { symbol: 'SOL/USD', name: 'Solana / US Dollar',     category: 'crypto' },
  { symbol: 'SPX',     name: 'S&P 500 Index',          category: 'indices' },
  { symbol: 'NDX',     name: 'Nasdaq 100 Index',       category: 'indices' },
  { symbol: 'DAX',     name: 'DAX Index',              category: 'indices' },
  { symbol: 'DE40',    name: 'DAX CFD',                category: 'cfd' },
  { symbol: 'US100',   name: 'Nasdaq 100 CFD',         category: 'cfd' },
  { symbol: 'US500',   name: 'S&P 500 CFD',            category: 'cfd' },
]

export default function WatchlistPage() {
  const { items, loading, addItem, removeItem } = useWatchlist()
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('futures')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const existingSymbols = new Set(items.map(i => i.symbol))

  const handleAdd = async (sym?: string, nm?: string, cat?: string) => {
    const s = (sym ?? symbol).trim().toUpperCase()
    const raw = nm ?? name.trim()
    const n = raw || undefined
    const c = cat ?? category
    if (!s) return
    setAdding(true)
    setError(null)
    const result = await addItem(s, n, c)
    setAdding(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSymbol('')
      setName('')
    }
  }

  const handleRemove = async (id: string) => {
    setRemovingId(id)
    await removeItem(id)
    setRemovingId(null)
  }

  // Group items by category preserving CATEGORIES order
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.value),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="eyebrow mb-1">Verwaltung</div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}
        >
          Watchlist
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-3)' }}>
          Deine gehandelten Assets — überall im Journal, Tagesplan und Einstellungen verfügbar.
        </p>
      </div>

      {/* Quick Add Popular */}
      <Section title="Schnell hinzufügen" subtitle="Beliebte Instrumente — klicken zum Hinzufügen">
        <div className="flex flex-wrap gap-2">
          {QUICK_ADD.map(q => {
            const already = existingSymbols.has(q.symbol)
            return (
              <button
                key={q.symbol}
                onClick={() => !already && handleAdd(q.symbol, q.name, q.category)}
                disabled={already || adding}
                className={cn(
                  'ticker text-xs px-2.5 py-1.5 rounded transition-colors',
                  already
                    ? 'opacity-40 cursor-default'
                    : 'cursor-pointer'
                )}
                style={{
                  background: already ? 'var(--bg-3)' : 'var(--bg-3)',
                  color: already ? 'var(--fg-4)' : 'var(--fg-1)',
                  border: `1px solid ${already ? 'transparent' : 'var(--border-raw)'}`,
                }}
                title={q.name}
              >
                {already ? '✓ ' : ''}{q.symbol}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Custom Add */}
      <Section title="Asset hinzufügen" subtitle="Eigenes Symbol manuell eintragen">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              placeholder="Symbol, z.B. USDCAD"
              className="ticker uppercase flex-1 h-9"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            />
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name (optional)"
              className="flex-1 h-9"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleAdd()}
              disabled={adding || !symbol.trim()}
              className="h-9 px-3 shrink-0 rounded"
              style={{ background: 'var(--brand-blue)', color: '#fff', border: 'none' }}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          {error && (
            <p className="text-xs" style={{ color: 'var(--short)' }}>{error}</p>
          )}
        </div>
      </Section>

      {/* Current Watchlist */}
      <Section
        title={`Deine Watchlist${items.length > 0 ? ` (${items.length})` : ''}`}
        subtitle="Sortiert nach Kategorie"
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--fg-4)' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Laden…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Star className="h-8 w-8 opacity-20" style={{ color: 'var(--fg-4)' }} />
            <p className="text-sm" style={{ color: 'var(--fg-4)' }}>
              Noch keine Assets — oben hinzufügen.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(group => (
              <div key={group.value}>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--fg-4)' }}
                >
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded px-3 py-2"
                      style={{ background: 'var(--bg-3)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="ticker text-sm font-semibold"
                          style={{ color: 'var(--fg-1)' }}
                        >
                          {item.symbol}
                        </span>
                        {item.name && (
                          <span className="text-xs" style={{ color: 'var(--fg-4)' }}>
                            {item.name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        className="rounded p-1 transition-colors"
                        style={{ color: 'var(--fg-4)' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--short)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--fg-4)')}
                      >
                        {removingId === item.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
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
