# PROJ-6: Performance & Statistik

**Status:** Architected
**Priority:** P0 (MVP)
**Created:** 2026-04-23

---

## Overview

Die Performance-Seite bietet tiefe statistische Auswertungen über alle erfassten Trades. Heatmaps, Charts und Kennzahlen helfen dem Trader seine Stärken und Schwächen datenbasiert zu verstehen. Alle Auswertungen sind filterbar nach Zeitraum, Asset, Strategie und Setup.

---

## User Stories

- **US-6.1** Als Trader möchte ich meine Winrate nach Uhrzeit, Wochentag und Asset sehen, um herauszufinden wann und womit ich am besten trade.
- **US-6.2** Als Trader möchte ich meinen Profit-Faktor und Durchschnittsgewinn vs. Durchschnittsverlust kennen.
- **US-6.3** Als Trader möchte ich eine Heatmap sehen, die zeigt welche Tages-/Uhrzeitkombinationen profitabel sind.
- **US-6.4** Als Trader möchte ich meinen maximalen Drawdown und Drawdown-Verlauf sehen.
- **US-6.5** Als Trader möchte ich alle Statistiken für einen frei wählbaren Zeitraum filtern können.

---

## Acceptance Criteria

### Kennzahlen-Übersicht (KPI Block)
- [ ] AC-6.1: Anzeige folgender Kennzahlen: Total Trades, Winrate %, Profit-Faktor, Ø Gewinn (€), Ø Verlust (€), Ø RR (Gewinn-Trades), Ø RR (alle Trades), Beste Serie (Wins in Folge), Schlechteste Serie (Losses in Folge), Max Drawdown %
- [ ] AC-6.2: Profit-Faktor = Summe Gewinne / Summe Verluste (absolut); Anzeige auf 2 Dezimalstellen
- [ ] AC-6.3: Alle KPIs berechnen sich nur aus gefilterten Trades

### Heatmap: Uhrzeit × Wochentag
- [ ] AC-6.4: 7×24-Matrix (Wochentage × Stunden), Farbintensität = Profit-Faktor oder Winrate (wählbar)
- [ ] AC-6.5: Hover-Tooltip zeigt: Anzahl Trades, Winrate, Ø P&L für diese Zelle
- [ ] AC-6.6: Zellen mit < 3 Trades werden ausgegraut (statistisch nicht signifikant)

### Winrate-Charts
- [ ] AC-6.7: Bar Chart: Winrate nach Asset (Top 10 Assets nach Handelsvolumen)
- [ ] AC-6.8: Bar Chart: Winrate nach Setup-Typ
- [ ] AC-6.9: Bar Chart: Winrate nach Strategie
- [ ] AC-6.10: Alle Charts zeigen Anzahl Trades als sekundäre Achse / Label

### Drawdown-Analyse
- [ ] AC-6.11: Area Chart: Drawdown-Verlauf über Zeit (% der Peak-Balance)
- [ ] AC-6.12: Tabelle: Top-5 Drawdown-Phasen mit Start-Datum, End-Datum, Tiefpunkt % und Recovery-Zeit
- [ ] AC-6.13: Aktueller Drawdown prominent angezeigt

### Zeitbasierte Auswertung
- [ ] AC-6.14: Monthly P&L Bar Chart (letzten 12 Monate)
- [ ] AC-6.15: Weekly P&L Bar Chart (letzte 12 Wochen)
- [ ] AC-6.16: Best / Worst Day of Week (Bar Chart mit Ø P&L pro Wochentag)

### Filter
- [ ] AC-6.17: Globaler Filter für Statistik-Seite: Zeitraum (Quick-Select: 7T, 30T, 90T, 1J, Gesamt + Custom Range), Asset (Multi), Strategie (Multi), Setup-Typ (Multi)
- [ ] AC-6.18: Filter-Status wird persistent im URL gespeichert (Shareable Link)
- [ ] AC-6.19: „Filter zurücksetzen" Button setzt alle Filter auf Standard

### Minimum-Daten-Hinweise
- [ ] AC-6.20: Wenn weniger als 20 Trades im gewählten Filter → Hinweis „Für statistisch valide Aussagen werden mehr Trades empfohlen" — aber Auswertung wird trotzdem angezeigt

---

## Berechnungsformeln

```
Profit-Faktor = Σ(Gewinne) / Σ(|Verluste|)  [> 1.0 = profitabel]
Winrate = Gewinn-Trades / (Gewinn-Trades + Verlust-Trades) × 100
Ø RR = Σ(RR der Gewinn-Trades) / Anzahl Gewinn-Trades
Max Drawdown = max(Peak - Trough) / Peak × 100  [über alle Trade-Zeitpunkte]
Profit-Expectancy = (Winrate × Ø Gewinn) - (Verlustrate × Ø Verlust)  [€]
```

---

## Edge Cases

- **EC-6.1:** Alle Trades sind Break-Even → Profit-Faktor = undefined; Anzeige: „N/A (keine Verluste)"
- **EC-6.2:** Nutzer filtert auf Zeitraum ohne Trades → alle Charts zeigen leeren State mit Erklärung
- **EC-6.3:** Single Trade im Filter → Winrate = 100% oder 0%; Hinweis: „Nur 1 Trade im Filter"
- **EC-6.4:** Heatmap-Zelle hat 100 Trades — Performance-kritisch → Heatmap berechnet aggregiert in DB, nicht client-seitig
- **EC-6.5:** Asset enthält Sonderzeichen (z. B. „BTC/USD") → URL-Encoding beim Filter-Persistence

---

## Out of Scope

- Monte-Carlo Simulation
- Benchmark-Vergleich (z. B. vs. S&P 500)
- Steuer-Auswertung / GuV-Berechnung nach Steuerrecht
- Inter-Konto-Vergleich auf einer Seite

---

## Tech Design (Solution Architect)

### A) Komponentenstruktur

```
app/(app)/performance/page.tsx     ← Neue Seite (force-dynamic + Suspense)
  └── PerformanceContent           ← Orchestriert Filter + alle Sektionen
        │
        ├── StatsFilter            ← Globaler Filter (oben, persistent in URL)
        │     Zeitraum: 7T/30T/90T/1J/Gesamt + Custom Date Range
        │     Asset (Multi-Select), Strategie (Multi-Select),
        │     Setup-Typ (Multi-Select), „Filter zurücksetzen" Button
        │
        ├── KpiBlock               ← 10 Kennzahlen-Karten (2 Reihen à 5)
        │     Total Trades, Winrate, Profit-Faktor, Ø Gewinn,
        │     Ø Verlust, Ø RR (Wins), Ø RR (alle), Beste Serie,
        │     Schlechteste Serie, Max Drawdown %
        │
        ├── Hinweis-Banner         ← Wenn < 20 Trades im Filter (AC-6.20)
        │
        └── Tabs (4 Bereiche, shadcn Tabs)
              │
              ├── "Übersicht"
              │     ├── MonthlyPnlChart      ← Bar Chart, letzte 12 Monate
              │     ├── WeeklyPnlChart       ← Bar Chart, letzte 12 Wochen
              │     └── DayOfWeekChart       ← Bar Chart, Ø P&L nach Wochentag
              │
              ├── "Winrate"
              │     ├── WinrateByAssetChart      ← Horizontal Bar Chart (Top 10)
              │     ├── WinrateBySetupChart      ← Horizontal Bar Chart
              │     └── WinrateByStrategyChart   ← Horizontal Bar Chart
              │         (alle zeigen Trade-Anzahl als Label — AC-6.10)
              │
              ├── "Heatmap"
              │     └── TradeHeatmap        ← Custom 7×24 CSS-Grid
              │           Y-Achse = Wochentage (Mo–So)
              │           X-Achse = Stunden (0–23)
              │           Farbintensität = Winrate oder Profit-Faktor (Toggle)
              │           Zellen < 3 Trades: ausgegraut (AC-6.6)
              │           Hover-Tooltip: Anzahl, Winrate, Ø P&L (AC-6.5)
              │
              └── "Drawdown"
                    ├── DrawdownChart        ← Area Chart, Verlauf in %
                    │   (X = Datum, Y = Drawdown % von Peak)
                    └── DrawdownPhaseTable  ← Top-5 Phasen
                          (Start, Ende, Tiefpunkt %, Recovery-Tage)
```

### B) Datenhaltung

Kein neues Backend nötig — alle Daten aus bestehender `trades`-Tabelle:

| Metrik | Quelle | Berechnung |
|---|---|---|
| Alle 10 KPI-Kennzahlen | `trades` gefiltert | Client-seitig |
| Monthly/Weekly/DoW Charts | `trades`, nach Datum gruppiert | Client-seitig |
| Winrate-Charts | `trades`, nach Asset/Setup/Strategie gruppiert | Client-seitig |
| Heatmap | `trades`, nach Wochentag + Stunde | Client-seitig (DB-Aggregation als spätere Optimierung, EC-6.4) |
| Drawdown-Verlauf | `trades` chronologisch, kumulativ | Client-seitig (gleiche Logik wie useRiskMetrics) |
| Drawdown-Phasen Top-5 | Aus Drawdown-Verlauf abgeleitet | Client-seitig |
| Filter-Werte (Assets, Strategien, Setups) | `trades` unique Werte | Client-seitig nach Laden |

**Neuer Hook:** `usePerformanceStats` — lädt alle Trades für aktives Konto, wendet Filter an, berechnet alle Statistiken. Gleiche Architektur wie `useDashboardMetrics`.

**URL-Filter-Persistence:** `useSearchParams` + `router.replace` — identisches Pattern wie in Journal (PROJ-3, bewährt und QA-getestet).

### C) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| `recharts` für alle Charts | Bereits installiert seit PROJ-2 — konsistentes Chart-System im Produkt |
| Heatmap als Custom CSS-Grid | 168 Zellen (7×24), kein extra Package; Tailwind Grid + Farbstufen via Opacity |
| shadcn Tabs für 4 Sektionen | Bereits installiert; hält die Seite übersichtlich ohne eigenes Routing |
| Alles clientseitig | Für MVP-Datenmengen (100–1000 Trades) performant; DB-Aggregation später bei Bedarf |
| URL-Filter statt State | Shareable Links ohne Extra-Aufwand; gleicher Ansatz wie bewährter Journal-Filter |

### D) Abhängigkeiten

| Paket | Zweck | Status |
|---|---|---|
| `recharts` | Bar Chart, Area Chart | ✅ Bereits installiert |
| shadcn `Tabs` | 4 Analyse-Bereiche | ✅ Bereits installiert |
| shadcn `Calendar` / `Popover` | Custom Date Range | ✅ Bereits installiert |

**Kein neues Paket nötig.**
