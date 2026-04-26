'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, TrendingUp, Brain, ShieldCheck,
  CalendarDays, ClipboardList, GraduationCap, Wallet, Settings,
  LogOut, Plus, BarChart2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountSwitcher } from '@/components/accounts/AccountSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, kbd: 'G D' },
  { href: '/journal',     label: 'Journal',      icon: BookOpen,        kbd: 'G J' },
  { href: '/performance', label: 'Performance',  icon: TrendingUp,      kbd: 'G P' },
  { href: '/analysen',    label: 'Analysen',     icon: Brain,           kbd: 'G A' },
  { href: '/risk',        label: 'Risk',         icon: ShieldCheck,     kbd: 'G R' },
  { href: '/kalender',    label: 'Kalender',     icon: CalendarDays,    kbd: null  },
  { href: '/tagesplan',   label: 'Tagesplan',    icon: ClipboardList,   kbd: null  },
  { href: '/lernmodus',   label: 'Lernen',       icon: GraduationCap,   kbd: null  },
  { href: '/accounts',    label: 'Konten',       icon: Wallet,          kbd: null  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

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
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--fg-1)' }}>
          <path d="M6 5 L6 27 L19 27" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" fill="none"/>
          <circle cx="25" cy="25" r="3" fill="currentColor"/>
        </svg>
        <span
          className="font-bold text-[15px] tracking-tight"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}
        >
          TradeOS
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

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, kbd }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] transition-colors duration-100',
                isActive
                  ? 'font-semibold'
                  : 'font-medium hover:text-foreground'
              )}
              style={{
                background: isActive ? 'var(--bg-3)' : 'transparent',
                color: isActive ? 'var(--fg-1)' : 'var(--fg-2)',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {kbd && (
                <span
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--fg-4)' }}
                >
                  {kbd}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: account + logout */}
      <div
        className="mt-auto px-2 pb-3 pt-3 flex flex-col gap-1"
        style={{ borderTop: '1px solid var(--border-raw)' }}
      >
        <div className="px-2 py-1">
          <AccountSwitcher />
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] w-full text-left transition-colors duration-100"
          style={{ color: 'var(--fg-3)', background: 'transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--fg-1)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--fg-3)'
          }}
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </div>
    </aside>
  )
}
