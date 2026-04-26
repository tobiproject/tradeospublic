# PROJ-27 — Futures Contract Sizes

**Status:** Deployed  
**Created:** 2026-04-26  

## Summary
Tick-Größen und Kontraktwerte (tick_size, tick_value, point_value) für Futures-Assets in der Watchlist. CME-Standardwerte werden automatisch beim Hinzufügen bekannter Symbole gesetzt. Risikocalculator im Trade-Formular nutzt point_value für korrekte Futures-Berechnung.

## Acceptance Criteria
- [x] DB: watchlist_items bekommt tick_size, tick_value, point_value Spalten
- [x] CME-Presets für NQ/MNQ/ES/MES/YM/MYM/RTY/CL/MCL/GC/MGC auto-gesetzt beim Hinzufügen
- [x] Watchlist: Futures-Zeilen zeigen Kontraktwert-Badge ("$20/Pt")
- [x] Watchlist: Inline-Editor mit "CME-Standard laden" Button
- [x] PATCH /api/watchlist/[id] zum Aktualisieren der Werte
- [x] Trade-Formular: point_value aus Watchlist für aktives Asset
- [x] CalcPreview: Risk% mit `SL-Distanz × point_value × Kontrakte` berechnet
- [x] CalcPreview: zeigt "Futures: $X/Punkt" wenn aktiv

## Tech
- `calcRiskPercent()` in `src/lib/trade-calculations.ts` — neuer `pointValue` Parameter
- `src/hooks/useWatchlist.ts` — WatchlistItem-Typ + `updateItem()`
- `src/app/api/watchlist/route.ts` — CME-Presets bei POST
- `src/app/api/watchlist/[id]/route.ts` — PATCH
- `src/app/(app)/watchlist/page.tsx` — FuturesTickEditor Komponente
- `src/components/journal/TradeFormSheet.tsx` — Watchlist-Lookup + pointValue an CalcPreview
