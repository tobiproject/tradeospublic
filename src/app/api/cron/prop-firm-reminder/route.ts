import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vapidEmail = process.env.VAPID_EMAIL
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (vapidEmail && vapidPublic && vapidPrivate) {
    const subject = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`
    webpush.setVapidDetails(subject, vapidPublic, vapidPrivate)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch users with prop-firm reminder enabled + push subscription
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('user_id, push_subscription')
    .eq('prop_firm_reminder_enabled', true)
    .eq('push_enabled', true)
    .not('push_subscription', 'is', null)

  if (!settings?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const s of settings) {
    // Get the most recently updated prop-firm rule for this user
    const { data: rules } = await supabase
      .from('prop_firm_rules')
      .select('firm_name, max_daily_loss_pct, max_total_drawdown_pct, profit_target_pct, trailing_drawdown, notes')
      .eq('user_id', s.user_id)
      .order('updated_at', { ascending: false })
      .limit(1)

    const rule = rules?.[0]

    const lines: string[] = []
    if (rule?.max_daily_loss_pct) lines.push(`Max. Tagesverlust: ${rule.max_daily_loss_pct}%`)
    if (rule?.max_total_drawdown_pct) lines.push(`Max. Drawdown: ${rule.max_total_drawdown_pct}%`)
    if (rule?.profit_target_pct) lines.push(`Profit Target: ${rule.profit_target_pct}%`)
    if (rule?.trailing_drawdown) lines.push('⚠ Trailing Drawdown aktiv')

    const firmName = rule?.firm_name ?? 'Prop-Firm'
    const body = lines.length
      ? lines.join(' · ')
      : 'Bleib diszipliniert und halte deine Regeln ein.'

    const payload = JSON.stringify({
      title: `📋 ${firmName} — Regeln vor dem Trading`,
      body,
      url: '/risk',
      tag: `prop-firm-reminder-${new Date().toISOString().split('T')[0]}`,
    })

    try {
      await webpush.sendNotification(s.push_subscription as webpush.PushSubscription, payload)
      sent++
    } catch (err: unknown) {
      if ((err as { statusCode?: number }).statusCode === 410) {
        await supabase
          .from('notification_settings')
          .update({ push_enabled: false, push_subscription: null })
          .eq('user_id', s.user_id)
      }
    }
  }

  return NextResponse.json({ sent })
}
