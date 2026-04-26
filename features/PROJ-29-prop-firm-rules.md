# PROJ-29 — Prop-Firm Regelwerk

**Status:** Deployed  
**Created:** 2026-04-26  

## Summary
Prop-Firm-Regeln (Tagesverlust-Limit, Max Drawdown, Profit-Ziel) pro Konto hinterlegbar.
Presets für Funded Next, FTMO, TopstepTrader, Apex, E8 Funding.
Fortschrittsbalken in der Risk-Seite zeigen, wie nah der Trader an seinen Grenzen ist.

## Acceptance Criteria
- [x] DB: `prop_firm_rules` Tabelle mit RLS (1 Zeile pro Account)
- [x] API: POST /api/prop-firm upserts Regeln, GET lädt sie
- [x] API: DELETE /api/prop-firm/[id] entfernt die Regeln
- [x] Risk-Seite: Prop-Firm-Sektion nur sichtbar wenn account_type === 'prop'
- [x] Presets für Funded Next, FTMO, TopstepTrader, Apex, E8
- [x] Fortschrittsbalken: Tagesverlust, Drawdown, Profit-Ziel (grün→gelb→rot)
- [x] Trailing-Drawdown-Flag

## Tech
- `src/app/api/prop-firm/route.ts` — GET/POST
- `src/app/api/prop-firm/[id]/route.ts` — DELETE
- `src/hooks/usePropFirmRules.ts`
- `src/components/risk/PropFirmSection.tsx`
- `src/components/risk/RiskContent.tsx` — Integration
