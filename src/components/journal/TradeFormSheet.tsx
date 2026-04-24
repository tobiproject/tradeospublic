'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Upload, Loader2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { useTrades, type Trade, type CreateTradeInput } from '@/hooks/useTrades'
import { useRiskConfig } from '@/hooks/useRiskConfig'
import { calcRR, calcRiskPercent, calcResultPercent, calcOutcome, validateSLSide } from '@/lib/trade-calculations'
import { useAccountContext } from '@/contexts/AccountContext'
import { cn } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

function utcToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nowDatetimeLocal(): string {
  return utcToDatetimeLocal(new Date().toISOString())
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
  traded_at: z.string().min(1, 'Pflichtfeld'),
  asset: z.string().min(1, 'Pflichtfeld').max(50),
  direction: z.enum(['long', 'short'], { error: 'Pflichtfeld' }),
  entry_price: z.number({ error: 'Pflichtfeld' }).positive('Muss positiv sein'),
  sl_price: z.number({ error: 'Pflichtfeld' }).positive('Muss positiv sein'),
  tp_price: z.number({ error: 'Pflichtfeld' }).positive('Muss positiv sein'),
  lot_size: z.number({ error: 'Pflichtfeld' }).positive('Muss positiv sein'),
  result_currency: z.number({ error: 'Pflichtfeld' }),
  setup_type: z.string().optional(),
  strategy: z.string().optional(),
  market_phase: z.string().optional(),
  emotion_before: z.string().optional(),
  emotion_after: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(5000, 'Maximal 5000 Zeichen').optional(),
}).superRefine((data, ctx) => {
  if (data.entry_price && data.sl_price && data.sl_price === data.entry_price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SL muss sich vom Entry unterscheiden', path: ['sl_price'] })
  }
  if (data.entry_price && data.tp_price && data.tp_price === data.entry_price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'TP muss sich vom Entry unterscheiden', path: ['tp_price'] })
  }
})

type FormValues = z.infer<typeof schema>

// ─── Live Calc Preview ───────────────────────────────────────────────────────

function CalcPreview({ values, accountBalance, maxRiskPct }: {
  values: Partial<Pick<FormValues, 'entry_price' | 'sl_price' | 'tp_price' | 'lot_size' | 'result_currency' | 'direction'>>
  accountBalance: number
  maxRiskPct?: number | null
}) {
  const rr = calcRR(values.entry_price, values.sl_price, values.tp_price)
  const risk = calcRiskPercent(values.entry_price, values.sl_price, values.lot_size, accountBalance)
  const resultPct = calcResultPercent(values.result_currency, accountBalance)
  const outcome = calcOutcome(values.result_currency)
  const slWarning = values.direction && values.entry_price && values.sl_price
    ? validateSLSide(values.direction, values.entry_price, values.sl_price)
    : null
  const riskExceeded = risk !== null && maxRiskPct != null && risk > maxRiskPct

  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">RR</p>
          <p className="text-lg font-bold tabular-nums">{rr !== null ? `1:${rr}` : '–'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Risk %</p>
          <p className={cn('text-lg font-bold tabular-nums', riskExceeded ? 'text-red-400' : 'text-amber-400')}>
            {risk !== null ? `${risk.toFixed(2)}%` : '–'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Result %</p>
          <p className={cn(
            'text-lg font-bold tabular-nums',
            outcome === 'win' ? 'text-emerald-400' : outcome === 'loss' ? 'text-red-400' : outcome === 'breakeven' ? 'text-amber-400' : ''
          )}>
            {resultPct !== null ? `${resultPct >= 0 ? '+' : ''}${resultPct.toFixed(2)}%` : '–'}
          </p>
        </div>
      </div>
      {outcome && (
        <div className="flex justify-center">
          <Badge variant="outline" className={cn(
            outcome === 'win' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
            outcome === 'loss' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
            'bg-amber-500/15 text-amber-400 border-amber-500/30'
          )}>
            {outcome === 'win' ? 'Win' : outcome === 'loss' ? 'Loss' : 'Breakeven'}
          </Badge>
        </div>
      )}
      {riskExceeded && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-md p-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Risk {risk!.toFixed(2)}% überschreitet dein Limit von {maxRiskPct}%</span>
        </div>
      )}
      {slWarning && (
        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-md p-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{slWarning}</span>
        </div>
      )}
    </div>
  )
}

// ─── Screenshot Upload ───────────────────────────────────────────────────────

interface ScreenshotFile {
  file: File
  preview: string
}

function ScreenshotSection({
  existingUrls,
  onRemoveExisting,
  newFiles,
  onAddFiles,
  onRemoveNew,
  disabled,
}: {
  existingUrls: string[]
  onRemoveExisting: (url: string) => void
  newFiles: ScreenshotFile[]
  onAddFiles: (files: ScreenshotFile[]) => void
  onRemoveNew: (index: number) => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const totalCount = existingUrls.length + newFiles.length

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (totalCount + files.length > 5) {
      toast.error('Maximal 5 Screenshots erlaubt')
      return
    }
    const valid = files.filter(f => {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
        toast.error(`${f.name}: Nur PNG, JPG, WEBP erlaubt`)
        return false
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: Maximal 10 MB`)
        return false
      }
      return true
    })
    const newEntries = valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    onAddFiles(newEntries)
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {existingUrls.map(url => (
          <div key={url} className="relative group w-24 h-16 rounded-md overflow-hidden border border-border/60 bg-muted">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(url)}
              disabled={disabled}
              className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        {newFiles.map((sf, i) => (
          <div key={sf.preview} className="relative group w-24 h-16 rounded-md overflow-hidden border border-primary/40 bg-muted">
            <img src={sf.preview} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveNew(i)}
              disabled={disabled}
              className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        {totalCount < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="w-24 h-16 rounded-md border border-dashed border-border/60 hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors bg-transparent"
          >
            <Upload className="h-4 w-4" />
            <span className="text-xs">Hinzufügen</span>
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{totalCount}/5 · PNG, JPG, WEBP · max. 10 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({ value, onChange, disabled }: {
  value: string[]
  onChange: (tags: string[]) => void
  disabled: boolean
}) {
  const [inputValue, setInputValue] = useState('')

  const addTag = () => {
    const tag = inputValue.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInputValue('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addTag() }
          }}
          placeholder="Tag eingeben, Enter drücken…"
          disabled={disabled}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={disabled || !inputValue.trim()}>
          +
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} disabled={disabled} className="hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTrade: Trade | null
  assetSuggestions: string[]
  setupSuggestions: string[]
  strategySuggestions: string[]
  onSuccess: (newTradeId?: string) => void
}

export function TradeFormSheet({
  open,
  onOpenChange,
  editingTrade,
  assetSuggestions,
  setupSuggestions,
  strategySuggestions,
  onSuccess,
}: Props) {
  const { activeAccount } = useAccountContext()
  const { createTrade, updateTrade, uploadScreenshot, isMutating } = useTrades()
  const { fetchRiskConfig } = useRiskConfig()
  const [maxRiskPct, setMaxRiskPct] = useState<number | null>(null)

  const [existingUrls, setExistingUrls] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<ScreenshotFile[]>([])

  const isEdit = !!editingTrade

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      traded_at: nowDatetimeLocal(),
      asset: '',
      direction: 'long',
      entry_price: undefined,
      sl_price: undefined,
      tp_price: undefined,
      lot_size: undefined,
      result_currency: undefined,
      setup_type: '',
      strategy: '',
      market_phase: '',
      emotion_before: '',
      emotion_after: '',
      tags: [],
      notes: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (open && editingTrade) {
      form.reset({
        traded_at: utcToDatetimeLocal(editingTrade.traded_at),
        asset: editingTrade.asset,
        direction: editingTrade.direction,
        entry_price: editingTrade.entry_price,
        sl_price: editingTrade.sl_price,
        tp_price: editingTrade.tp_price,
        lot_size: editingTrade.lot_size,
        result_currency: editingTrade.result_currency ?? undefined,
        setup_type: editingTrade.setup_type ?? '',
        strategy: editingTrade.strategy ?? '',
        market_phase: editingTrade.market_phase ?? '',
        emotion_before: editingTrade.emotion_before ?? '',
        emotion_after: editingTrade.emotion_after ?? '',
        tags: editingTrade.tags ?? [],
        notes: editingTrade.notes ?? '',
      })
      setExistingUrls(editingTrade.screenshot_urls ?? [])
      setNewFiles([])
    } else if (open && !editingTrade) {
      form.reset({
        traded_at: nowDatetimeLocal(),
        asset: '',
        direction: 'long',
        entry_price: undefined,
        sl_price: undefined,
        tp_price: undefined,
        lot_size: undefined,
        result_currency: undefined,
        setup_type: '',
        strategy: '',
        market_phase: '',
        emotion_before: '',
        emotion_after: '',
        tags: [],
        notes: '',
      })
      setExistingUrls([])
      setNewFiles([])
    }
  }, [open, editingTrade, form])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => { newFiles.forEach(f => URL.revokeObjectURL(f.preview)) }
  }, [newFiles])

  // Load risk config when sheet opens
  useEffect(() => {
    if (!open || !activeAccount) return
    fetchRiskConfig().then(cfg => {
      setMaxRiskPct(cfg?.max_risk_per_trade_pct ?? null)
    })
  }, [open, activeAccount, fetchRiskConfig])

  const handleClose = useCallback(() => {
    if (form.formState.isDirty && !isMutating) {
      if (!confirm('Änderungen verwerfen?')) return
    }
    onOpenChange(false)
  }, [form.formState.isDirty, isMutating, onOpenChange])

  const onSubmit = async (values: FormValues) => {
    if (!activeAccount) return

    const input: CreateTradeInput = {
      traded_at: new Date(values.traded_at).toISOString(),
      asset: values.asset,
      direction: values.direction,
      entry_price: values.entry_price,
      sl_price: values.sl_price,
      tp_price: values.tp_price,
      lot_size: values.lot_size,
      result_currency: values.result_currency,
      setup_type: values.setup_type || undefined,
      strategy: values.strategy || undefined,
      market_phase: values.market_phase || undefined,
      tags: values.tags ?? [],
      emotion_before: values.emotion_before || undefined,
      emotion_after: values.emotion_after || undefined,
      notes: values.notes || undefined,
      screenshot_urls: existingUrls,
    }

    if (isEdit && editingTrade) {
      const { error } = await updateTrade(editingTrade.id, input)
      if (error) { toast.error('Fehler beim Speichern'); return }

      // Upload new files
      if (newFiles.length > 0) {
        const urls: string[] = [...existingUrls]
        for (const sf of newFiles) {
          const { url, error: uploadError } = await uploadScreenshot(editingTrade.id, sf.file)
          if (uploadError) toast.error(`${sf.file.name}: Upload fehlgeschlagen`)
          else if (url) urls.push(url)
        }
        if (urls.length !== existingUrls.length) {
          await updateTrade(editingTrade.id, { screenshot_urls: urls })
        }
      }

      toast.success('Trade gespeichert')
    } else {
      const { data: trade, error } = await createTrade(input)
      if (error || !trade) { toast.error('Fehler beim Erstellen'); return }

      // Upload screenshots after trade creation
      if (newFiles.length > 0) {
        const urls: string[] = []
        for (const sf of newFiles) {
          const { url, error: uploadError } = await uploadScreenshot(trade.id, sf.file)
          if (uploadError) toast.error(`${sf.file.name}: Upload fehlgeschlagen`)
          else if (url) urls.push(url)
        }
        if (urls.length > 0) {
          await updateTrade(trade.id, { screenshot_urls: urls })
        }
      }

      toast.success('Trade erfasst')
      onOpenChange(false)
      onSuccess(trade.id)
      return
    }

    onOpenChange(false)
    onSuccess()
  }

  const watchedValues = form.watch(['entry_price', 'sl_price', 'tp_price', 'lot_size', 'result_currency', 'direction'])
  const liveValues = {
    entry_price: watchedValues[0],
    sl_price: watchedValues[1],
    tp_price: watchedValues[2],
    lot_size: watchedValues[3],
    result_currency: watchedValues[4],
    direction: watchedValues[5],
  }

  const notes = form.watch('notes') ?? ''

  const numberField = (name: keyof FormValues, label: string, placeholder: string, allowNegative = false) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="any"
              min={allowNegative ? undefined : 0}
              placeholder={placeholder}
              {...field}
              value={field.value === undefined ? '' : String(field.value)}
              onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="sm:max-w-[580px] flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b border-border/60">
          <SheetTitle>{isEdit ? 'Trade bearbeiten' : 'Neuer Trade'}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

              {/* ── Basisdaten ─────────────────────────── */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Basisdaten</p>

                <FormField
                  control={form.control}
                  name="traded_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum & Uhrzeit</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="asset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset</FormLabel>
                        <FormControl>
                          <>
                            <Input list="asset-suggestions" placeholder="EURUSD, BTC/USD…" {...field} />
                            <datalist id="asset-suggestions">
                              {assetSuggestions.map(a => <option key={a} value={a} />)}
                            </datalist>
                          </>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Richtung</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="long">
                              <span className="flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Long
                              </span>
                            </SelectItem>
                            <SelectItem value="short">
                              <span className="flex items-center gap-1.5">
                                <TrendingDown className="h-3.5 w-3.5 text-red-400" /> Short
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Preise & Größe ─────────────────────── */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preise & Größe</p>
                <div className="grid grid-cols-2 gap-3">
                  {numberField('entry_price', 'Entry', '1.08500')}
                  {numberField('sl_price', 'Stop Loss', '1.08000')}
                  {numberField('tp_price', 'Take Profit', '1.09500')}
                  {numberField('lot_size', 'Lot-Größe', '0.10')}
                  {numberField('result_currency', 'Ergebnis (€)', '+150.00', true)}
                </div>

                {/* Live Preview */}
                <CalcPreview
                  values={liveValues}
                  accountBalance={activeAccount?.start_balance ?? 10000}
                  maxRiskPct={maxRiskPct}
                />
              </div>

              <Separator />

              {/* ── Analyse ───────────────────────────── */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Analyse</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="setup_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup-Typ</FormLabel>
                        <FormControl>
                          <>
                            <Input list="setup-suggestions" placeholder="z.B. Breakout" {...field} />
                            <datalist id="setup-suggestions">
                              {setupSuggestions.map(s => <option key={s} value={s} />)}
                            </datalist>
                          </>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategie</FormLabel>
                        <FormControl>
                          <>
                            <Input list="strategy-suggestions" placeholder="z.B. ICT Concepts" {...field} />
                            <datalist id="strategy-suggestions">
                              {strategySuggestions.map(s => <option key={s} value={s} />)}
                            </datalist>
                          </>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="market_phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marktphase</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Marktphase auswählen…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trend_bullish">Trend (bullish)</SelectItem>
                          <SelectItem value="trend_bearish">Trend (bearish)</SelectItem>
                          <SelectItem value="range">Range</SelectItem>
                          <SelectItem value="breakout">Breakout</SelectItem>
                          <SelectItem value="reversal">Reversal</SelectItem>
                          <SelectItem value="news_driven">News-driven</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Emotionen & Tags ──────────────────── */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Emotionen & Tags</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="emotion_before"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emotion vor Trade</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Auswählen…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="calm">Ruhig</SelectItem>
                            <SelectItem value="focused">Fokussiert</SelectItem>
                            <SelectItem value="nervous">Nervös</SelectItem>
                            <SelectItem value="impatient">Ungeduldig</SelectItem>
                            <SelectItem value="overconfident">Overconfident</SelectItem>
                            <SelectItem value="fomo">FOMO</SelectItem>
                            <SelectItem value="tired">Müde</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emotion_after"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emotion nach Trade</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Auswählen…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="calm">Ruhig</SelectItem>
                            <SelectItem value="focused">Fokussiert</SelectItem>
                            <SelectItem value="nervous">Nervös</SelectItem>
                            <SelectItem value="impatient">Ungeduldig</SelectItem>
                            <SelectItem value="overconfident">Overconfident</SelectItem>
                            <SelectItem value="fomo">FOMO</SelectItem>
                            <SelectItem value="tired">Müde</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <TagInput value={field.value ?? []} onChange={field.onChange} disabled={isMutating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* ── Notizen ───────────────────────────── */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notizen & Screenshots</p>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">
                        <span>Notizen</span>
                        <span className={cn(
                          'text-xs tabular-nums',
                          notes.length > 4800 ? 'text-amber-400' : 'text-muted-foreground'
                        )}>
                          {notes.length}/5000
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Trade-Analyse, Gedanken, Lernpunkte…"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Screenshots</p>
                  <ScreenshotSection
                    existingUrls={existingUrls}
                    onRemoveExisting={url => setExistingUrls(prev => prev.filter(u => u !== url))}
                    newFiles={newFiles}
                    onAddFiles={files => setNewFiles(prev => [...prev, ...files])}
                    onRemoveNew={idx => setNewFiles(prev => prev.filter((_, i) => i !== idx))}
                    disabled={isMutating}
                  />
                </div>
              </div>
            </div>

            {/* ── Footer ────────────────────────────── */}
            <SheetFooter className="px-6 py-4 border-t border-border/60 gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isMutating} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" disabled={isMutating || (form.formState.isDirty && !form.formState.isValid)} className="flex-1">
                {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Speichern' : 'Erfassen'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
