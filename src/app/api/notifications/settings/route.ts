import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('notification_settings')
    .select('push_enabled, email_enabled, email_address, prop_firm_reminder_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    push_enabled: data?.push_enabled ?? false,
    email_enabled: data?.email_enabled ?? false,
    email_address: data?.email_address ?? '',
    prop_firm_reminder_enabled: data?.prop_firm_reminder_enabled ?? false,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  await supabase.from('notification_settings').upsert(
    {
      user_id: user.id,
      email_enabled: body.email_enabled ?? false,
      email_address: body.email_address ?? null,
      prop_firm_reminder_enabled: body.prop_firm_reminder_enabled ?? false,
    },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ ok: true })
}
