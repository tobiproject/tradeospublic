'use client'

import { TrendingUp, TrendingDown, CalendarDays, CalendarRange, Target, BarChart2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardMetrics } from '@/hooks/useDashboardMetrics'

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
  colorClass?: string
}

function KpiCard({ icon, label, value, sub, colorClass }: KpiCardProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className={cn('text-xl font-bold tabular-nums truncate', colorClass ?? 'text-foreground')}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function pnlColor(val: number) {
  if (val > 0) return 'text-emerald-400'
  if (val < 0) return 'text-red-400'
  return 'text-muted-foreground'
}

function formatPnl(val: number) {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)} €`
}

interface Props {
  metrics: DashboardMetrics
}

export function KpiRow({ metrics }: Props) {
  const ddColor = metrics.drawdownPct > 10
    ? 'text-red-400'
    : metrics.drawdownPct > 5
    ? 'text-amber-400'
    : 'text-emerald-400'

  const todayValue = metrics.todayTradeCount === 0
    ? <span className="text-sm text-muted-foreground font-normal">Noch keine Trades heute</span>
    : (
      <span className={pnlColor(metrics.todayPnl)}>
        {formatPnl(metrics.todayPnl)}
        <span className="text-sm font-normal ml-1">
          ({metrics.todayPnl >= 0 ? '+' : ''}{metrics.todayPnlPct.toFixed(2)}%)
        </span>
      </span>
    )

  const winrateValue = metrics.winRate === null
    ? <span className="text-sm text-muted-foreground font-normal">Keine Daten</span>
    : `${metrics.winRate.toFixed(1)}%`

  const rrValue = metrics.avgRR === null
    ? <span className="text-sm text-muted-foreground font-normal">Keine Daten</span>
    : `1:${metrics.avgRR.toFixed(2)}`

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Tages-P&L"
        value={todayValue}
      />
      <KpiCard
        icon={<CalendarDays className="h-4 w-4" />}
        label="Wochen-P&L"
        value={formatPnl(metrics.weekPnl)}
        colorClass={pnlColor(metrics.weekPnl)}
      />
      <KpiCard
        icon={<CalendarRange className="h-4 w-4" />}
        label="Monats-P&L"
        value={formatPnl(metrics.monthPnl)}
        colorClass={pnlColor(metrics.monthPnl)}
      />
      <KpiCard
        icon={<Target className="h-4 w-4" />}
        label="Winrate"
        value={winrateValue}
        sub={metrics.winRate !== null ? `${metrics.allTradeCount} Trades gesamt` : undefined}
      />
      <KpiCard
        icon={<BarChart2 className="h-4 w-4" />}
        label="Ø Risk-Reward"
        value={rrValue}
      />
      <KpiCard
        icon={<TrendingDown className="h-4 w-4" />}
        label="Drawdown"
        value={`${metrics.drawdownPct.toFixed(2)}%`}
        colorClass={ddColor}
        sub={metrics.drawdownPct > 10 ? '⚠ Kritisch' : metrics.drawdownPct > 5 ? '⚠ Erhöht' : undefined}
      />
    </div>
  )
}
