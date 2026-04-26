'use client'

import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Trade } from '@/hooks/useTrades'

interface Props {
  trades: Trade[]
  onTradeClick: (trade: Trade) => void
}

export function RecentTradesTable({ trades, onTradeClick }: Props) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-raw)' }}>
        <div>
          <div className="eyebrow mb-0.5">Recent trades</div>
          <div className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}>
            {trades.length > 0 ? `${trades.length} Trades` : 'Noch keine Trades'}
          </div>
        </div>
      </div>

      {trades.length === 0 ? (
        <p className="text-sm px-5 py-6" style={{ color: 'var(--fg-3)' }}>
          No trades yet. Start logging to build your edge.
        </p>
      ) : (
        <>
          {/* Column headers */}
          <div
            className="grid px-5 py-2 text-[10.5px] font-semibold tracking-widest uppercase"
            style={{
              gridTemplateColumns: '90px 1fr 80px 110px 70px 70px',
              gap: '16px',
              color: 'var(--fg-3)',
              borderBottom: '1px solid var(--border-raw)',
            }}
          >
            <div>Datum</div>
            <div>Asset · Setup</div>
            <div>Richtung</div>
            <div style={{ textAlign: 'right' }}>P&L</div>
            <div style={{ textAlign: 'right' }}>R:R</div>
            <div>Status</div>
          </div>

          {/* Rows */}
          {trades.map(trade => {
            const pnl = trade.result_currency
            const pnlStyle: React.CSSProperties =
              pnl === null ? { color: 'var(--fg-3)' }
              : pnl > 0   ? { color: 'var(--long)' }
              : pnl < 0   ? { color: 'var(--short)' }
              : { color: 'var(--fg-3)' }

            const dirColor = trade.direction === 'long' ? 'var(--long)' : 'var(--short)'
            const dirLabel = trade.direction === 'long' ? '↗ LONG' : '↘ SHORT'

            const outcomeBg =
              trade.outcome === 'win'       ? 'var(--long-soft)'
              : trade.outcome === 'loss'    ? 'var(--short-soft)'
              : 'rgba(255,152,0,0.14)'
            const outcomeColor =
              trade.outcome === 'win'       ? 'var(--long)'
              : trade.outcome === 'loss'    ? 'var(--short)'
              : 'var(--warn)'
            const outcomeLabel =
              trade.outcome === 'win'  ? '+ WIN'
              : trade.outcome === 'loss' ? '− LOSS'
              : 'BE'

            return (
              <div
                key={trade.id}
                onClick={() => onTradeClick(trade)}
                className="grid px-5 items-center cursor-pointer"
                style={{
                  gridTemplateColumns: '90px 1fr 80px 110px 70px 70px',
                  gap: '16px',
                  padding: '11px 20px',
                  borderBottom: '1px solid var(--border-raw)',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Date */}
                <div className="num text-xs" style={{ color: 'var(--fg-3)' }}>
                  {format(parseISO(trade.traded_at), 'dd.MM.yy', { locale: de })}
                  <div style={{ color: 'var(--fg-4)', fontSize: '10px', marginTop: '1px' }}>
                    {format(parseISO(trade.traded_at), 'HH:mm', { locale: de })}
                  </div>
                </div>

                {/* Asset + Setup */}
                <div>
                  <span className="ticker text-[13px]" style={{ color: 'var(--fg-1)' }}>{trade.asset}</span>
                  {trade.setup_type && (
                    <span className="text-xs ml-2" style={{ color: 'var(--fg-3)' }}>{trade.setup_type}</span>
                  )}
                </div>

                {/* Direction */}
                <div className="num text-[11px] font-semibold" style={{ color: dirColor }}>
                  {dirLabel}
                </div>

                {/* P&L */}
                <div className="num text-sm font-semibold text-right" style={pnlStyle}>
                  {pnl !== null
                    ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} €`
                    : '—'}
                </div>

                {/* R:R */}
                <div className="num text-xs text-right" style={{ color: 'var(--fg-3)' }}>
                  {trade.rr_ratio !== null ? `${trade.rr_ratio}R` : '—'}
                </div>

                {/* Outcome badge */}
                <div>
                  {trade.outcome ? (
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: outcomeBg, color: outcomeColor }}
                    >
                      {outcomeLabel}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--fg-4)', fontSize: '12px' }}>—</span>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
