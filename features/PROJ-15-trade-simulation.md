# PROJ-15 · Trade Simulation / True RRR

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend + Backend (Claude Vision optional)

## Beschreibung
Neuer "Simulation" Tab im Trade-Detail-Sheet. Trader gibt an, wie weit der Kurs nach ihrem Entry maximal in ihre Richtung gelaufen ist — TradeOS berechnet das **wahre RRR** unabhängig vom geplanten TP. Optional kann ein Chart-Screenshot hochgeladen werden für KI-Analyse.

## Acceptance Criteria
- [ ] AC-1: "Simulation" Tab im TradeDetailSheet (zwischen KI-Analyse und RR-Simulator)
- [ ] AC-2: Zeigt Entry, Stop Loss und geplantes RRR als Referenz
- [ ] AC-3: Input für Maximal-Kurs (Hochpunkt bei Long / Tiefpunkt bei Short)
- [ ] AC-4: Wahres RRR wird live berechnet: `(maxPrice - entry) / (entry - sl)` für Long
- [ ] AC-5: Farbe: grün wenn wahres RRR ≥ geplantes RRR, sonst rot
- [ ] AC-6: Vergleichstext unter dem Ergebnis ("X.XXR über deinem geplanten TP")
- [ ] AC-7: Screenshot-Upload für KI-Analyse (optional)
- [ ] AC-8: KI schätzt maximalen Preis aus Chart und füllt Input vor
- [ ] AC-9: Nur authentifizierte User können die API aufrufen

## Tech Design
- **Komponente:** `src/components/journal/TradeSimulationTab.tsx`
- **Tab in:** `src/components/journal/TradeDetailSheet.tsx`
- **API Route (KI):** `src/app/api/ai/analyze-simulation/route.ts` (POST, multipart/form-data)
- **Model:** `claude-sonnet-4-6` (Vision-fähig)
- **Kein DB-Speichern** (pure UI-Kalkulation, nicht persistiert)

## Formel
```
SL-Distanz = |entry - sl|
Wahres RRR = |maxPrice - entry| / SL-Distanz
```
