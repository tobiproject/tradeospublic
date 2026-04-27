export const dynamic = 'force-dynamic'

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AccountProvider } from '@/contexts/AccountContext'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { MorningBriefing } from '@/components/layout/MorningBriefing'
import { AnalysisReminderBanner } from '@/components/layout/AnalysisReminderBanner'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AccountProvider>
      <MorningBriefing />
      <AnalysisReminderBanner />
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-0)' }}>
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 w-full">
            {children}
          </div>
        </main>
      </div>
    </AccountProvider>
  )
}
