'use client'

import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccountContext } from '@/contexts/AccountContext'
import { useDashboardMetrics, type DashboardMetrics, type EquityPoint } from '@/hooks/useDashboardMetrics'
import { useRiskAlerts, type RiskAlert } from '@/hooks/useRiskAlerts'
import { RiskAlertBanner } from '@/components/risk/RiskAlertBanner'
import { KpiRow } from './KpiRow'
import { EquityCurveChart } from './EquityCurveChart'
import { TopStrategyCard } from './TopStrategyCard'
import { RecentTradesTable } from './RecentTradesTable'
import { TradeDetailSheet } from '@/components/journal/TradeDetailSheet'
import type { Trade } from '@/hooks/useTrades'

type PeriodDays = 7 | 30 | 90 | null

function filterByPeriod(points: EquityPoint[], days: PeriodDays): EquityPoint[] {
  if (days === null) return points
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
  return points.filter(p => p.date >= cutoff)
}

export function DashboardContent() {
  const { activeAccount } = useAccountContext()
  const { fetchMetrics } = useDashboardMetrics()
  const { fetchTodayAlerts, dismissAlert } = useRiskAlerts()

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodDays>(30)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const load = useCallback(async () => {
    if (!activeAccount) return
    setIsLoading(true)
    try {
      const [m, a] = await Promise.all([
        fetchMetrics(null), // fetch all trades; period filtering happens in UI
        fetchTodayAlerts(),
      ])
      setMetrics(m)
      setAlerts(a)
    } finally {
      setIsLoading(false)
    }
  }, [activeAccount, fetchMetrics, fetchTodayAlerts])

  useEffect(() => {
    load()
  }, [load])

  const handleDismiss = async (id: string) => {
    await dismissAlert(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade)
    setDetailOpen(true)
  }

  const visibleCurve = metrics ? filterByPeriod(metrics.equityCurve, period) : []

  if (!activeAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Kein aktives Konto</p>
        </div>
        <p className="text-muted-foreground text-sm border border-dashed border-border/60 rounded-lg p-8 text-center">
          Bitte wähle ein aktives Konto aus, um dein Dashboard zu sehen.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Konto: {activeAccount.name}</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <RiskAlertBanner alerts={alerts} onDismiss={handleDismiss} />
        )}

        {/* KPI row */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : metrics ? (
          <KpiRow metrics={metrics} />
        ) : null}

        {/* Middle row: chart + strategy */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Skeleton className="h-72 rounded-lg lg:col-span-3" />
            <Skeleton className="h-72 rounded-lg lg:col-span-2" />
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <EquityCurveChart
                allPoints={visibleCurve}
                startBalance={activeAccount.start_balance}
                currentPeriod={period}
                onPeriodChange={setPeriod}
              />
            </div>
            <div className="lg:col-span-2">
              <TopStrategyCard strategy={metrics.topStrategy} />
            </div>
          </div>
        ) : null}

        {/* Recent trades */}
        {isLoading ? (
          <Skeleton className="h-56 rounded-lg" />
        ) : metrics ? (
          <RecentTradesTable trades={metrics.recentTrades} onTradeClick={handleTradeClick} />
        ) : null}
      </div>

      <TradeDetailSheet
        trade={selectedTrade}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </>
  )
}
