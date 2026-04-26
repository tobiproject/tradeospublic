# PROJ-14 · Trade Analysis Reminder

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend-only (localStorage)

## Beschreibung
Nach dem Erfassen eines Trades kann der Trader eine Nachanalyse-Erinnerung setzen (1h–48h). Wenn die Zeit abgelaufen ist, erscheint ein floating Banner mit direktem Link zum Trade im Journal.

## Acceptance Criteria
- [ ] AC-1: Reminder-Selector erscheint nur beim Erstellen (nicht beim Bearbeiten) eines Trades
- [ ] AC-2: Optionen: Keine / 1h / 4h / 8h / 1 Tag / 2 Tage
- [ ] AC-3: Default: "Keine"
- [ ] AC-4: Nach Trade-Save wird Reminder in localStorage gespeichert
- [ ] AC-5: Banner erscheint wenn `dueAt <= now` (Prüfung alle 60 Sekunden)
- [ ] AC-6: Banner zeigt Asset, Richtung (↗/↘) und "Öffnen" Link zum Journal
- [ ] AC-7: "Öffnen" und "×" entfernen den Reminder aus localStorage
- [ ] AC-8: Mehrere fällige Reminder werden als Stack angezeigt

## Tech Design
- **Komponente:** `src/components/layout/AnalysisReminderBanner.tsx`
- **Eingebunden in:** `src/app/(app)/layout.tsx`
- **Integration:** `TradeFormSheet.tsx` importiert `addReminder()` aus AnalysisReminderBanner
- **Persistenz:** localStorage Key `tradeos-analysis-reminders` (Array von Reminder-Objekten)
- **Kein Backend nötig**

## Datenstruktur
```ts
interface AnalysisReminder {
  tradeId: string
  asset: string
  direction: string
  dueAt: string // ISO timestamp
}
```
