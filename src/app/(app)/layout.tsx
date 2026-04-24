export const dynamic = 'force-dynamic'

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AccountProvider } from '@/contexts/AccountContext'
import { AppNav } from '@/components/layout/AppNav'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AccountProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <AppNav />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </main>
      </div>
    </AccountProvider>
  )
}
