# PROJ-2: Dashboard (Zentrale Übersicht)

**Status:** In Progress
**Priority:** P0 (MVP)
**Created:** 2026-04-23

---

## Overview

Das Dashboard ist die erste Seite nach dem Login. Es zeigt auf einen Blick alle relevanten KPIs des ausgewählten Trading-Kontos. Keine Scrollen nötig für die wichtigsten Metriken. Alle Daten sind kontogebunden und reagieren sofort auf einen Account-Wechsel.

---

## User Stories

- **US-2.1** Als Trader möchte ich nach dem Login sofort sehen, wie mein heutiger Tag performt (P&L, Trades), damit ich meine Session einschätzen kann.
- **US-2.2** Als Trader möchte ich meine Wochen- und Monatsperformance sehen, ohne in Statistik-Seiten navigieren zu müssen.
- **US-2.3** Als Trader möchte ich meine Equity Curve sehen, um meinen langfristigen Fortschritt zu erkennen.
- **US-2.4** Als Trader möchte ich aktive Warnungen (z. B. „Max Daily Loss erreicht", „Overtrade-Risiko") prominent angezeigt bekommen, bevor ich einen weiteren Trade eröffne.
- **US-2.5** Als Trader möchte ich sehen, welche meiner Strategien aktuell am besten performt.
- **US-2.6** Als Trader möchte ich den aktuellen Drawdown auf einen Blick sehen.

---

## Acceptance Criteria

### KPI-Karten (Top Row)
- [ ] AC-2.1: Anzeige von 6 KPI-Karten: Tages-P&L (€ + %), Wochen-P&L, Monats-P&L, Winrate (gesamt), Ø Risk-Reward, aktueller Drawdown
- [ ] AC-2.2: Tages-P&L ist grün wenn positiv, rot wenn negativ, grau wenn 0
- [ ] AC-2.3: Alle Werte beziehen sich auf das aktuell ausgewählte Konto
- [ ] AC-2.4: Bei 0 Trades heute zeigt Tages-P&L „Noch keine Trades heute" statt 0

### Equity Curve
- [ ] AC-2.5: Line Chart zeigt Balance-Verlauf über Zeit (X: Datum, Y: Kontostand in €)
- [ ] AC-2.6: Zeitraum wählbar: 7 Tage, 30 Tage, 90 Tage, Gesamt
- [ ] AC-2.7: Chart zeigt Startbalance als gestrichelte Baseline
- [ ] AC-2.8: Hover-Tooltip zeigt Datum, Balance und Veränderung zum Vortag

### Drawdown-Anzeige
- [ ] AC-2.9: Aktueller Drawdown wird als Prozent der Peak-Balance angezeigt
- [ ] AC-2.10: Drawdown > 5% → gelbe Warnstufe; > 10% → rote Warnstufe mit Warnung im Alert-Bereich

### Alert-Bereich
- [ ] AC-2.11: Alerts erscheinen als Banner unter der KPI-Reihe, sortiert nach Schweregrad
- [ ] AC-2.12: Mögliche Alerts (v1): Max Daily Loss erreicht, Overtrade-Risiko (>X Trades/Tag), Drawdown-Warnung, kein Journal-Kommentar für letzten Trade
- [ ] AC-2.13: Alerts können einzeln als „gesehen" markiert (dismissed) werden — verschwinden bis zum nächsten Trigger

### Beste Strategie
- [ ] AC-2.14: Zeigt die Strategie mit höchstem Profit-Faktor (letzte 30 Tage) mit Name, Anzahl Trades und P&L
- [ ] AC-2.15: Wenn weniger als 5 Trades mit einer Strategie vorhanden → kein Ranking (zu wenig Daten)

### Performance-Tabelle
- [ ] AC-2.16: Tabelle zeigt die letzten 10 Trades mit: Datum, Asset, Richtung (L/S), Ergebnis (€), RR, Status (Win/Loss/BE)
- [ ] AC-2.17: Klick auf einen Trade öffnet Trade-Detail direkt aus dem Dashboard

### Responsiveness
- [ ] AC-2.18: Dashboard ist auf 1280px+ ohne Scrollen nutzbar (alle KPIs above the fold)
- [ ] AC-2.19: Auf <768px wird in eine 2-Spalten-Stack-Ansicht gewechselt

---

## Layout-Struktur

```
┌─────────────────────────────────────────────────────────────┐
│  [Alert Banner — wenn aktiv]                                │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────┤
│ Tages-   │ Wochen-  │ Monats-  │ Winrate  │ Ø RR     │ DD   │
│ P&L      │ P&L      │ P&L      │          │          │      │
├─────────────────────────────┬───────────────────────────────┤
│  Equity Curve (60% Breite)  │  Beste Strategie + Stats      │
│                             │  (40% Breite)                 │
├─────────────────────────────┴───────────────────────────────┤
│  Letzte 10 Trades (Tabelle)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Edge Cases

- **EC-2.1:** Konto hat 0 Trades → Dashboard zeigt leere States mit CTA „Ersten Trade erfassen"
- **EC-2.2:** Alle Trades sind Break-Even → Winrate zeigt „N/A — nur Break-Even Trades"
- **EC-2.3:** Equity Curve hat nur 1 Datenpunkt → Chart zeigt einzelnen Punkt mit Hinweis „Mehr Trades für Kurve nötig"
- **EC-2.4:** Account-Wechsel während Dashboard offen → alle Werte aktualisieren sich ohne Reload (Zustand via React Query invalidieren)
- **EC-2.5:** Nutzer hat Risk-Limit noch nicht konfiguriert → Drawdown-Alert zeigt „Risk-Limit noch nicht gesetzt" mit Link zu Einstellungen

---

## Out of Scope

- Live-Preise oder Broker-Verbindung
- Push-Notifications (Browser/Mobile)
- Dashboard-Konfiguration durch Nutzer (Widgets verschieben)
- Vergleich mehrerer Konten auf einem Dashboard

---

## Tech Design (Solution Architect)

### A) Komponentenstruktur

```
app/(app)/dashboard/page.tsx          ← bereits vorhanden, wird befüllt
  └── DashboardContent               ← orchestriert alle Daten, Suspense-Wrapper
        │
        ├── RiskAlertBanner           ← WIEDERVERWENDET aus components/risk/
        │     (aktive Alerts für heute, dismissbar — AC-2.11–2.13)
        │
        ├── KpiRow                    ← 6 kompakte Karten nebeneinander (AC-2.1–2.4)
        │     ├── KpiCard: Tages-P&L (€ + %) — grün/rot/grau je nach Vorzeichen
        │     ├── KpiCard: Wochen-P&L
        │     ├── KpiCard: Monats-P&L
        │     ├── KpiCard: Winrate gesamt
        │     ├── KpiCard: Ø Risk-Reward
        │     └── KpiCard: Aktueller Drawdown (gelb >5%, rot >10% — AC-2.9/2.10)
        │
        ├── MiddleRow (Raster 60% / 40%)
        │     ├── EquityCurveChart    ← Line-Chart (AC-2.5–2.8)
        │     │     ├── PeriodSelector: 7T / 30T / 90T / Gesamt
        │     │     ├── Gestrichelte Baseline = Startbalance
        │     │     └── Hover-Tooltip: Datum, Balance, Δ Vortag
        │     └── TopStrategyCard     ← Beste Strategie letzte 30 Tage (AC-2.14/2.15)
        │           (Name, Trade-Anzahl, P&L, Profit-Faktor — min. 5 Trades)
        │
        └── RecentTradesTable         ← Letzte 10 Trades (AC-2.16/2.17)
              (Datum, Asset, L/S, Ergebnis €, RR, Win/Loss/BE)
              └── Klick → TradeDetailSheet WIEDERVERWENDET aus components/journal/
```

### B) Datenhaltung

Kein neues Backend nötig — alle Werte werden aus bestehenden Tabellen abgeleitet:

| Metrik | Quelle | Berechnung |
|---|---|---|
| Tages-/Wochen-/Monats-P&L | `trades`, gefiltert nach Datum | Summierung im Client |
| Winrate | `trades`, alle abgeschlossenen | Wins / (Wins + Losses) |
| Ø RR | `trades` mit rr_ratio | Durchschnitt aller rr_ratio-Werte |
| Drawdown | `trades` chronologisch | `fetchDrawdown()` aus useRiskMetrics bereits vorhanden |
| Equity-Curve | `trades` chronologisch, kumulativ | Tages-Endstände aus Startbalance + kumulierten Ergebnissen |
| Aktive Alerts | `risk_alerts` | `fetchTodayAlerts()` aus useRiskAlerts bereits vorhanden |
| Letzte 10 Trades | `trades` ORDER BY traded_at DESC LIMIT 10 | Einfache Query |
| Top-Strategie | `trades` letzte 30 Tage | Client-seitige Gruppierung nach strategy-Feld |

**Neuer Hook:** `useDashboardMetrics` — lädt alle Trades einmalig und leitet alle Metriken clientseitig ab. Kein separater API-Aufruf pro Metrik.

### C) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| `recharts` für Equity Curve | Im PRD als Charting-Library vorgesehen; React-nativ, kein Wrapper-Setup nötig |
| Metriken clientseitig | Alle Trades ohnehin geladen — serverseitige Aggregation wäre Over-Engineering |
| `RiskAlertBanner` wiederverwendet | Bereits in PROJ-5 gebaut und QA-getestet |
| `TradeDetailSheet` wiederverwendet | Kein Duplikat-Code; Dashboard öffnet denselben Sheet wie Journal |
| Account-Wechsel reaktiv | `useAccountContext` → alle Hooks reagieren automatisch auf activeAccount-Änderung |
| `force-dynamic` auf der Page | Verhindert statisches Pre-Rendering von Echtzeit-Daten |

### D) Abhängigkeiten

| Paket | Zweck | Status |
|---|---|---|
| `recharts` | Line-Chart für Equity Curve | ❌ Noch nicht installiert — `npm install recharts` |
