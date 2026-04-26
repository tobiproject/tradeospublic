# PROJ-26 — Weekly Push Notifications

**Status:** Deployed  
**Created:** 2026-04-26  

## Summary
Browser Push Notifications (Web Push API) für wöchentliche Erinnerungen zur Wochenvorbereitung. Samstag und Sonntag um 8:00 UTC.

## Acceptance Criteria
- [x] Nutzer kann Push-Benachrichtigungen in Einstellungen aktivieren/deaktivieren
- [x] Service Worker registriert und zeigt Benachrichtigungen an
- [x] Klick auf Benachrichtigung öffnet /wochenvorbereitung
- [x] Vercel Cron Job triggert Sa + So 08:00 UTC
- [x] Abgelaufene Subscriptions werden automatisch bereinigt (statusCode 410)
- [x] E-Mail optional (nur wenn RESEND_API_KEY gesetzt)

## Tech
- Web Push API + VAPID keys
- `public/sw.js` — Service Worker
- `src/hooks/usePushNotifications.ts`
- `src/app/api/notifications/subscribe/route.ts` — POST/DELETE
- `src/app/api/notifications/settings/route.ts` — GET/POST
- `src/app/api/cron/weekly-reminder/route.ts` — Cron Handler
- `vercel.json` — Cron Schedule
- Supabase: `notification_settings` Tabelle (user_id, push_enabled, push_subscription, email_enabled, email_address)

## Env Vars Required
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`
- `CRON_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional: `RESEND_API_KEY`, `NOUS_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`
