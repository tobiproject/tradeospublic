# PROJ-22 · Weekly AI Prep

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend + Backend (Claude Sonnet)

## Beschreibung
Eine Card im Dashboard mit einem "Generieren" Button. Analysiert die letzten 14 Tage Trades und das Strategie-Profil des Traders und erstellt ein personalisiertes wöchentliches Briefing mit 4 Abschnitten.

## Acceptance Criteria
- [ ] AC-1: `WeeklyPrepCard` im Dashboard sichtbar (unter Recent Trades, über KI Insights)
- [ ] AC-2: "Generieren" Button ruft API auf und zeigt Ladeindikator
- [ ] AC-3: Ergebnis wird in der Card angezeigt (expandierbar/kollapsierbar)
- [ ] AC-4: "Neu generieren" Button nach erstem Ergebnis sichtbar
- [ ] AC-5: API nutzt letzte 14 Tage Trades des Users
- [ ] AC-6: API nutzt `user_strategy` Profil als Kontext wenn vorhanden
- [ ] AC-7: Output hat 4 strukturierte Abschnitte: Performance-Rückblick, Erkenntnisse, Fokus, Mentaler Rahmen
- [ ] AC-8: Nur authentifizierte User (401 sonst)

## Tech Design
- **Komponente:** `src/components/dashboard/WeeklyPrepCard.tsx`
- **API:** `src/app/api/ai/weekly-prep/route.ts` (POST)
- **Model:** `claude-sonnet-4-6`
- **Datenquellen:** `trades` (letzte 14 Tage, max. 50), `user_strategy`
- **Kein DB-Caching** (on-demand generiert)

## Prompt-Struktur
1. Performance-Rückblick (3–4 Sätze)
2. Haupterkenntnisse (2–3 Punkte)
3. Fokus diese Woche (1–2 Punkte)
4. Mentaler Rahmen (1 Satz)
