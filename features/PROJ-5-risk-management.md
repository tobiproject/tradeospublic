# PROJ-5: Risk Management System

**Status:** In Progress
**Priority:** P0 (MVP)
**Created:** 2026-04-23

---

## Overview

Das Risk Management System berechnet automatisch Risiko-Metriken auf Trade- und Konto-Ebene, prüft gegen nutzerdefinierte Limits und gibt Warnungen aus bevor kritische Grenzen überschritten werden. Zusätzlich ermöglicht ein Simulator die Auswirkung alternativer RR-Szenarien zu berechnen.

---

## User Stories

- **US-5.1** Als Trader möchte ich mein maximales Daily-Loss-Limit einstellen, damit das System mich warnt bevor ich es erreiche.
- **US-5.2** Als Trader möchte ich sehen, wie viel % meines Kontos ich heute bereits riskiert habe.
- **US-5.3** Als Trader möchte ich eine Warnung erhalten, wenn ich zu viele Trades an einem Tag mache (Overtrade-Schutz).
- **US-5.4** Als Trader möchte ich simulieren, was passiert wäre, wenn ich meinen TP oder SL anders gesetzt hätte.
- **US-5.5** Als Trader möchte ich meine Risiko-Regeln einmal konfigurieren und das System überwacht sie automatisch.

---

## Acceptance Criteria

### Risk-Konfiguration
- [ ] AC-5.1: Nutzer kann pro Konto folgende Limits konfigurieren: Max Daily Loss % (z. B. 5%), Max Daily Trades (z. B. 3), Max Risk per Trade % (z. B. 2%), Max Drawdown % (z. B. 10%)
- [ ] AC-5.2: Alle Konfigurationswerte sind optional — wenn nicht gesetzt, wird kein entsprechender Alert ausgelöst
- [ ] AC-5.3: Konfigurationsänderungen gelten ab sofort, nicht rückwirkend
- [ ] AC-5.4: Limits werden pro Konto gespeichert (nicht global)

### Echtzeit-Risk-Berechnung
- [ ] AC-5.5: Beim Erfassen eines neuen Trades wird Risk % automatisch aus Entry, SL, Lot-Größe und aktueller Balance berechnet
- [ ] AC-5.6: Tages-Risiko (Summe Risk % aller heutigen Trades) wird kontinuierlich berechnet und im Dashboard angezeigt
- [ ] AC-5.7: Wenn Tages-Risiko > 80% des konfigurierten Limits → gelbe Warnung
- [ ] AC-5.8: Wenn Tages-Risiko ≥ 100% des konfigurierten Limits → rote Warnung + Alert auf Dashboard

### Warnungen & Alerts
- [ ] AC-5.9: Max Daily Loss Alert: wird ausgelöst wenn heutige realisierte Verluste das Limit erreichen
- [ ] AC-5.10: Overtrade-Alert: wird ausgelöst wenn Trades heute ≥ Max Daily Trades Konfiguration
- [ ] AC-5.11: Drawdown-Alert: wird ausgelöst wenn aktueller Drawdown ≥ Max Drawdown Konfiguration
- [ ] AC-5.12: Risk-per-Trade-Warnung: wird beim Trade-Erfassen ausgelöst wenn berechnetes Risk % > Max Risk per Trade — kein Block, aber deutliche Warnung im Formular
- [ ] AC-5.13: Alle Warnungen erscheinen als Banner im Dashboard (PROJ-2 AC-2.11)

### RR-Simulator
- [ ] AC-5.14: Simulator-Tab im Trade-Detail: Nutzer kann alternative TP/SL-Werte eingeben
- [ ] AC-5.15: Simulator zeigt: alternatives Ergebnis (€), alternatives RR, Vergleich zum tatsächlichen Ergebnis
- [ ] AC-5.16: Simulator verändert keine gespeicherten Trade-Daten
- [ ] AC-5.17: Simulator kann für multiple Szenarien gleichzeitig berechnen (bis zu 3 Szenarien nebeneinander)

### Risk-Übersicht
- [ ] AC-5.18: Eigene Seite „Risk" zeigt: Tages-Risiko-Gauge, Wochenrisiko, Konfigurierte Limits, Alert-Historie (letzte 30 Tage)
- [ ] AC-5.19: Alert-Historie zeigt: Datum, Alert-Typ, Kontext (z. B. Trade-Anzahl zum Zeitpunkt des Alerts)

---

## Data Model

```sql
-- Risk-Konfiguration pro Konto
CREATE TABLE risk_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  max_daily_loss_pct    NUMERIC(5,2),   -- z.B. 5.00 für 5%
  max_daily_trades      SMALLINT,
  max_risk_per_trade_pct NUMERIC(5,2),
  max_drawdown_pct      NUMERIC(5,2),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert-Historie
CREATE TABLE risk_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type   TEXT NOT NULL CHECK (alert_type IN (
    'max_daily_loss', 'max_daily_trades', 'max_drawdown', 
    'risk_per_trade_warning', 'overtrade_warning'
  )),
  severity     TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  context_data JSONB,          -- { "current_value": 4.8, "limit": 5.0 }
  dismissed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_alerts_account_id ON risk_alerts(account_id);
CREATE INDEX idx_risk_alerts_created_at ON risk_alerts(created_at DESC);
```

---

## Edge Cases

- **EC-5.1:** Max Daily Loss = 5% und Nutzer macht einen Trade mit 4.9% Risiko, der gewinnt — kein Alert (Loss-Limit, nicht Risk-Limit)
- **EC-5.2:** Nutzer ändert Max Daily Trades von 3 auf 5 nachdem er bereits 4 Trades gemacht hat → Kein rückwirkender Alert
- **EC-5.3:** Balance = 0 oder negativ → Risk-Berechnung gibt Fehler, Nutzer wird gebeten Balance zu korrigieren
- **EC-5.4:** Trade wird im Nachhinein auf gestern geändert → Risk-Berechnung für diesen Tag neu berechnen
- **EC-5.5:** Nutzer hat kein Risk-Limit gesetzt und fragt warum keine Warnungen kommen → Dashboard zeigt Hinweis „Risk-Limits noch nicht konfiguriert"

---

## Out of Scope

- Automatisches Sperren von Trade-Eingabe wenn Limit erreicht (nur Warnung, kein harter Block)
- Portfolio-Risiko über mehrere Konten hinweg
- Broker-seitige Risk-Limits (MT4/MT5 Integration)
- Korrelations-Risiko (mehrere Positionen im gleichen Asset)

---

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
app/(app)/risk/
└── page.tsx                      ← Risk-Übersicht Seite

components/risk/
├── RiskConfigForm                ← Formular: 4 Limit-Werte konfigurieren (pro Konto)
├── RiskGauge                     ← Tages-Risiko Progress-Bar mit Farb-Semantik
│                                    grün < 80% · gelb 80–99% · rot ≥ 100%
├── RiskAlertBanner               ← Warning/Critical-Banner (wiederverwendbar im Dashboard)
├── RiskAlertHistory              ← Tabelle: letzte 30 Tage Alerts (Typ, Schwere, Kontext)
├── RiskSummaryCards              ← 4 kompakte Karten: Daily Loss, Daily Trades,
│                                    Risk/Trade, Drawdown — je mit Ist-Wert vs. Limit
└── RRSimulator                   ← Tab im Trade-Detail: bis zu 3 Szenarien nebeneinander

hooks/
├── useRiskConfig                 ← Lesen + Schreiben der risk_configs Tabelle
├── useRiskMetrics                ← Berechnet Echtzeit-Metriken aus trades-Daten:
│                                    täglicher Verlust, Trade-Anzahl heute, Drawdown
└── useRiskAlerts                 ← Liest risk_alerts, erstellt neue Alerts bei Limit-Bruch

Integration in bestehende Komponenten:
└── TradeFormSheet (PROJ-3)       ← Zeigt Risk-per-Trade-Warnung wenn Risk % > Limit (AC-5.12)
```

### B) Datenhaltung

| Daten | Wo | Warum |
|---|---|---|
| Risk-Konfiguration | DB — `risk_configs` (1 Zeile pro Konto) | Geräteübergreifend, RLS-geschützt |
| Alert-Historie | DB — `risk_alerts` | Dauerhaft, für 30-Tage-Ansicht; wird beim Limit-Bruch geschrieben |
| Echtzeit-Metriken (Daily Loss, Trade-Anzahl) | Clientseitig berechnet | Werden aus der `trades`-Tabelle abgeleitet — kein separater Speicher nötig |
| RR-Simulator-Szenarien | Nur im Browser (kein Speichern) | Rein explorative Berechnung, kein Datenbankbedarf |

### C) Seitenfluss

```
/risk
  ├── RiskSummaryCards (oben: Ist vs. Limit für alle 4 Metriken)
  ├── RiskGauge (Tages-Risiko visuell)
  ├── RiskConfigForm (Limits setzen/bearbeiten)
  └── RiskAlertHistory (Tabelle letzte 30 Tage)

TradeFormSheet (PROJ-3, bereits vorhanden)
  └── CalcPreview → zusätzliche Risk-per-Trade-Warnung wenn Risk % > Limit

TradeDetailSheet (PROJ-3, bereits vorhanden)
  └── Neuer Tab "Simulator"
        └── RRSimulator (3 Szenarien: alter TP/SL vs. alternative Werte)
```

### D) Alert-Logik (clientseitig, beim Laden der Risk-Seite)

```
Beim Öffnen der /risk Seite (und beim Trade-Erfassen):
  1. Lade risk_config für aktives Konto
  2. Berechne Metriken aus heutigen Trades
  3. Vergleiche jeden Wert mit dem konfigurierten Limit
  4. Bei Überschreitung → Schreibe risk_alert in DB (1× pro Tag pro Typ, Duplikate vermeiden)
  5. Zeige RiskAlertBanner für aktive Alerts
```

### E) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Metriken clientseitig | Trades-Daten sind bereits im Client — kein Extra-API-Aufruf nötig |
| shadcn `Progress` für Gauge | Bereits installiert, Farb-Codierung per Tailwind realisierbar |
| Alert-Duplikate via DB-Check | Verhindert Spam: ein Alert pro Typ pro Tag pro Konto (created_at Date-Check) |
| RR-Simulator als Tab | Nutzt bestehenden TradeDetailSheet — kein neues Routing nötig |
| `risk_configs` UNIQUE auf account_id | Upsert-Pattern: einfach schreiben, kein separates Create/Update nötig |

### F) Abhängigkeiten

| Paket | Zweck |
|---|---|
| shadcn `Progress` | Tages-Risiko Gauge ✅ installiert |
| shadcn `Tabs` | RR-Simulator Tab in TradeDetailSheet ✅ installiert |
| shadcn `Card` | Risk-Summary-Cards ✅ installiert |
| shadcn `Switch` | Toggle für Limits aktiv/inaktiv (optional) ✅ installiert |

---

## Backend Implementation Notes (2026-04-24)

### Supabase Migration Applied: `proj5_risk_management`
- `risk_configs` Tabelle: 1 Zeile pro Konto (UNIQUE auf account_id), Upsert-Pattern, 4 optionale Limit-Felder, `updated_at` Trigger
- `risk_alerts` Tabelle: Alert-Historie mit Typ-Check, Severity-Check, JSONB context_data, `dismissed_at`
- RLS auf beiden Tabellen: SELECT/INSERT/UPDATE/DELETE je auf `auth.uid() = user_id`
- 3 Indexes: `account_id`, `created_at DESC`, `(account_id, created_at DESC)` composite

### Files Created
- `src/hooks/useRiskConfig.ts` — Lesen + Upsert von `risk_configs` per Konto
- `src/hooks/useRiskMetrics.ts` — Tages-Verlust, Trade-Anzahl, Drawdown aus `trades`; `checkLimits()` gibt breached/warning Status
- `src/hooks/useRiskAlerts.ts` — Alert CRUD, Duplikate-Schutz (1×/Tag/Typ), `processAlerts()` wertet RiskCheckResult aus
- `src/hooks/useRiskMetrics.test.ts` — 15 Unit Tests für Berechnungslogik (alle grün)
