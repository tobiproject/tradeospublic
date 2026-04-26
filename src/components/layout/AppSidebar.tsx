'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  LayoutDashboard, BookOpen, TrendingUp, Brain, ShieldCheck,
  CalendarDays, ClipboardList, GraduationCap, Settings,
  LogOut, Plus, GripVertical, Star, Map as MapIcon, Telescope, BookMarked,
} from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AccountSwitcher } from '@/components/accounts/AccountSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { useAccountContext } from '@/contexts/AccountContext'
import { cn } from '@/lib/utils'

type NavItem =
  | { id: string; href: string; label: string; icon: React.ElementType; kbd: string | null; tooltip: string; isDivider?: false }
  | { id: string; isDivider: true; href?: never; label?: never; icon?: never; kbd?: never; tooltip?: never }

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',          href: '/dashboard',          label: 'Dashboard',          icon: LayoutDashboard, kbd: 'G D', tooltip: 'Deine wichtigsten KPIs, offene Trades und tägliche Zusammenfassung' },
  { id: 'journal',            href: '/journal',            label: 'Journal',            icon: BookOpen,        kbd: 'G J', tooltip: 'Trades erfassen, bearbeiten und mit KI analysieren lassen' },
  { id: 'performance',        href: '/performance',        label: 'Performance',        icon: TrendingUp,      kbd: 'G P', tooltip: 'Statistiken, Equity-Kurve, Win-Rate und Setup-Auswertung' },
  { id: 'divider-1',          isDivider: true },
  { id: 'analysen',           href: '/analysen',           label: 'Analysen',           icon: Brain,           kbd: 'G A', tooltip: 'KI-generierte Muster und Verhaltensanalysen aus deinem Journal' },
  { id: 'risk',               href: '/risk',               label: 'Risk',               icon: ShieldCheck,     kbd: 'G R', tooltip: 'Risiko-Regeln, Max-Drawdown, Tageslimit und Prop-Firm-Grenzen' },
  { id: 'divider-2',          isDivider: true },
  { id: 'wochenvorbereitung', href: '/wochenvorbereitung', label: 'Wochenvorbereitung', icon: Telescope,       kbd: null,  tooltip: 'Ziele für die Woche setzen, Fokus-Assets wählen und Events tracken' },
  { id: 'kalender',           href: '/kalender',           label: 'Kalender',           icon: CalendarDays,    kbd: null,  tooltip: 'Wirtschaftskalender und High-Impact-Events in deiner Zeitzone' },
  { id: 'tagesplan',          href: '/tagesplan',          label: 'Tagesplan',          icon: ClipboardList,   kbd: null,  tooltip: 'Tägliche Routine: Pre-Market Checklist, Fokus-Assets und Tagesnotizen' },
  { id: 'divider-3',          isDivider: true },
  { id: 'lernmodus',          href: '/lernmodus',          label: 'Lernen',             icon: GraduationCap,   kbd: null,  tooltip: 'Quiz, Chart-Replay und KI-Coach zum Verbessern deiner Entscheidungen' },
  { id: 'watchlist',          href: '/watchlist',          label: 'Watchlist',          icon: Star,            kbd: null,  tooltip: 'Deine gehandelten Assets mit Kontraktwerten für die Risikoberechnung' },
  { id: 'roadmap',            href: '/roadmap',            label: 'Roadmap',            icon: MapIcon,         kbd: null,  tooltip: 'Deine Trader-Journey: Level, Stärken/Schwächen und nächste Schritte' },
  { id: 'knowledge-base',     href: '/knowledge-base',     label: 'Knowledge Base',     icon: BookMarked,      kbd: null,  tooltip: 'Deine Trading-Strategie als Wissensbasis für personalisierte KI-Ratschläge' },
]

const STORAGE_KEY = 'nous-sidebar-order'

function loadOrder(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveOrder(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {}
}

function applyOrder(items: NavItem[], order: string[]) {
  if (!order.length) return items
  const map = new Map(items.map(i => [i.id, i]))
  const ordered = order.flatMap(id => {
    const item = map.get(id)
    return item ? [item] : []
  })
  const known = new Set(order)
  items.forEach(i => { if (!known.has(i.id)) ordered.push(i) })
  return ordered
}

function SortableDivider({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="group flex items-center gap-1 px-2 py-0.5 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="flex-1 h-px" style={{ background: 'var(--border-raw)' }} />
      <GripVertical className="h-2.5 w-2.5 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" style={{ color: 'var(--fg-4)' }} />
    </div>
  )
}

interface NavItemProps {
  item: Extract<NavItem, { isDivider?: false }>
  isActive: boolean
  hasTodayPlan?: boolean
  showTooltips?: boolean
}

function SortableNavItem({ item, isActive, hasTodayPlan, showTooltips }: NavItemProps) {
  const [hovered, setHovered] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const showTagesplanDot = item.id === 'tagesplan' && hasTodayPlan

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle — only visible on hover */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="flex items-center justify-center w-4 h-6 shrink-0 cursor-grab active:cursor-grabbing ml-1"
        style={{
          color: 'var(--fg-4)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 100ms',
        }}
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <Tooltip delayDuration={600}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'flex flex-1 items-center gap-2.5 px-2 py-1.5 rounded text-[13px] transition-colors duration-100',
              isActive ? 'font-semibold' : 'font-medium'
            )}
            style={{
              background: isActive ? 'var(--bg-3)' : hovered ? 'var(--bg-3)' : 'transparent',
              color: isActive ? 'var(--fg-1)' : 'var(--fg-2)',
            }}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>

            {showTagesplanDot && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--long)' }}
              />
            )}

            {item.kbd && !showTagesplanDot && (
              <span className="text-[10px] font-mono" style={{ color: 'var(--fg-4)' }}>
                {item.kbd}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        {showTooltips && item.tooltip && (
          <TooltipContent side="right" className="max-w-[220px] text-xs">
            {item.tooltip}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { activeAccount } = useAccountContext()
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS)
  const [hasTodayPlan, setHasTodayPlan] = useState(false)

  // Restore saved order from localStorage (client-side only)
  useEffect(() => {
    const order = loadOrder()
    if (order.length) setNavItems(applyOrder(DEFAULT_NAV_ITEMS, order))
  }, [])

  // Green dot on Tagesplan = morning briefing fully completed today
  useEffect(() => {
    const check = () => {
      const today = new Date().toISOString().split('T')[0]
      setHasTodayPlan(!!localStorage.getItem(`nous-morning-${today}`))
    }
    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setNavItems(prev => {
      const oldIdx = prev.findIndex(i => i.id === active.id)
      const newIdx = prev.findIndex(i => i.id === over.id)
      const next = arrayMove(prev, oldIdx, newIdx)
      saveOrder(next.map(i => i.id))
      return next
    })
  }, [])

  // suppress unused-var warning — activeAccount used for future features
  void activeAccount

  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border-raw)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 pb-3">
        <Image
          src="/logo/nous-mark-white.svg"
          alt="NOUS"
          width={22}
          height={22}
          className="shrink-0"
          priority
        />
        <span
          className="font-bold text-[15px] tracking-tight"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}
        >
          NOUS
        </span>
      </div>

      {/* Log trade CTA */}
      <div className="px-3 pb-3">
        <Button
          asChild
          className="w-full justify-start gap-2 h-8 text-[13px] font-semibold rounded"
          style={{ background: 'var(--brand-blue)', color: '#fff', border: 'none' }}
        >
          <Link href="/journal?new=1">
            <Plus className="h-3.5 w-3.5" />
            Log trade
          </Link>
        </Button>
      </div>

      {/* Navigation — draggable */}
      <nav className="flex-1 flex flex-col gap-0 px-1 overflow-y-auto">
        <TooltipProvider>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={navItems.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {navItems.map(item => {
                if (item.isDivider) {
                  return <SortableDivider key={item.id} id={item.id} />
                }
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    isActive={isActive}
                    hasTodayPlan={hasTodayPlan}
                    showTooltips
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        </TooltipProvider>
      </nav>

      {/* Bottom: account + logout */}
      <div
        className="mt-auto px-2 pb-3 pt-3 flex flex-col gap-1"
        style={{ borderTop: '1px solid var(--border-raw)' }}
      >
        <div className="px-2 py-1">
          <AccountSwitcher />
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/einstellungen"
            className="flex flex-1 items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] transition-colors duration-100"
            style={{ color: 'var(--fg-3)', background: 'transparent' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--fg-1)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--fg-3)'
            }}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Einstellungen
          </Link>
          <button
            onClick={logout}
            title="Abmelden"
            className="flex items-center justify-center w-8 h-8 rounded transition-colors duration-100 shrink-0"
            style={{ color: 'var(--fg-3)', background: 'transparent' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--fg-1)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--fg-3)'
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
