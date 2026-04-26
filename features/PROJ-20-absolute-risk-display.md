# PROJ-20 · Absolute Risk Display (€/$)

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend

## Beschreibung
Der `CalcPreview` im Trade-Formular zeigt unter dem Risk%-Wert zusätzlich den absoluten Risikobetrag in der Kontowährung (z.B. `150.00 EUR`).

## Acceptance Criteria
- [ ] AC-1: Absoluter Betrag erscheint unterhalb der Risk %-Anzeige
- [ ] AC-2: Betrag wird in der Währung des aktiven Kontos angezeigt
- [ ] AC-3: Berechnung: `risk% * accountBalance / 100`
- [ ] AC-4: Nur angezeigt wenn Risk % berechenbar ist (alle Felder ausgefüllt)
- [ ] AC-5: Wechselt automatisch wenn das aktive Konto gewechselt wird

## Tech Design
- **Komponente:** `CalcPreview` in `src/components/journal/TradeFormSheet.tsx`
- **Neues Prop:** `currency?: string` (kommt von `activeAccount?.currency`)
- **Formel:** `riskAmount = risk * accountBalance / 100` (gerundet auf 2 Dezimalstellen)
