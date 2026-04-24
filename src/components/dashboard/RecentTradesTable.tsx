'use client'

import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Trade } from '@/hooks/useTrades'

interface Props {
  trades: Trade[]
  onTradeClick: (trade: Trade) => void
}

function OutcomeBadge({ outcome }: { outcome: Trade['outcome'] }) {
  if (!outcome) return <span className="text-xs text-muted-foreground">–</span>
  const map = {
    win: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    loss: 'bg-red-500/15 text-red-400 border-red-500/30',
    breakeven: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  }
  const labels = { win: 'Win', loss: 'Loss', breakeven: 'BE' }
  return (
    <Badge variant="outline" className={cn('text-xs', map[outcome])}>
      {labels[outcome]}
    </Badge>
  )
}

export function RecentTradesTable({ trades, onTradeClick }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Letzte Trades</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 pb-4">Noch keine Trades vorhanden.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead>Datum</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Richtung</TableHead>
                <TableHead className="text-right">Ergebnis</TableHead>
                <TableHead className="text-right">RR</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map(trade => (
                <TableRow
                  key={trade.id}
                  className="cursor-pointer border-border/40 hover:bg-muted/40"
                  onClick={() => onTradeClick(trade)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(trade.traded_at), 'dd.MM.yy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{trade.asset}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        trade.direction === 'long'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      )}
                    >
                      {trade.direction === 'long' ? 'L' : 'S'}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    'text-right text-sm tabular-nums font-medium',
                    trade.result_currency === null ? 'text-muted-foreground' :
                    trade.result_currency > 0 ? 'text-emerald-400' :
                    trade.result_currency < 0 ? 'text-red-400' : 'text-muted-foreground'
                  )}>
                    {trade.result_currency !== null
                      ? `${trade.result_currency >= 0 ? '+' : ''}${trade.result_currency.toFixed(2)} €`
                      : '–'}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {trade.rr_ratio !== null ? `1:${trade.rr_ratio}` : '–'}
                  </TableCell>
                  <TableCell>
                    <OutcomeBadge outcome={trade.outcome} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
