# PROJ-9: Automatisierung & Smart Features

**Status:** Architected
**Priority:** P2
**Created:** 2026-04-23

---

## Overview

Smart Features, die den Trading-Alltag vereinfachen: CSV-Import aus Broker-Exporten, automatische Journal-Prompts wenn ein Trade unvollständig ist, intelligente Setup-Vorschläge basierend auf vergangenen Trades und ein Tages-Planungs-Assistent.

---

## User Stories

- **US-9.1** Als Trader möchte ich Trades aus einem Broker-CSV-Export importieren, damit ich nicht alles manuell eingeben muss.
- **US-9.2** Als Trader möchte ich erinnert werden, wenn ich einen Trade ohne Kommentar oder Screenshot gespeichert habe.
- **US-9.3** Als Trader möchte ich, dass Setup-Typ und Strategie automatisch vorgeschlagen werden basierend auf ähnlichen vergangenen Trades.
- **US-9.4** Als Trader möchte ich vor meiner Trading-Session eine strukturierte Tagesplanung machen (Biases, zu vermeidende Fehler des Vortages).

---

## Acceptance Criteria

### CSV-Import
- [ ] AC-9.1: Import-Funktion akzeptiert CSV-Dateien von MT4/MT5 (Standard-Export-Format)
- [ ] AC-9.2: Import-Wizard: Upload → Spalten-Mapping → Vorschau (erste 10 Zeilen) → Bestätigen
- [ ] AC-9.3: Felder die aus CSV gemappt werden können: Datum, Asset, Richtung, Entry, SL, TP, Lots, P&L
- [ ] AC-9.4: Felder die manuell ergänzt werden müssen (kein Auto-Import): Emotion, Setup-Typ, Notes, Screenshots
- [ ] AC-9.5: Doppelte Trades werden erkannt (gleiche Zeit + Asset + Richtung + Entry) und übersprungen mit Warnung
- [ ] AC-9.6: Import-Zusammenfassung nach Abschluss: X Trades importiert, Y Duplikate übersprungen, Z Fehler

### Completion-Prompts
- [ ] AC-9.7: Wenn ein Trade gespeichert wird ohne Notes → In-App-Notification: „Dein letzter Trade hat keinen Kommentar. Jetzt ergänzen?"
- [ ] AC-9.8: Wenn ein Trade ohne Screenshot gespeichert wird → gleiche Notification mit direktem Link zur Bearbeitung
- [ ] AC-9.9: Notifications sind dismissable und nerven nicht: max. 1 pro Trade, max. 3 gleichzeitig sichtbar

### Smart-Vorschläge
- [ ] AC-9.10: Im Trade-Formular: Setup-Typ-Feld schlägt die 3 häufigsten Setup-Typen der letzten 30 Trades vor
- [ ] AC-9.11: Strategie-Feld zeigt Auto-Complete mit allen bisher verwendeten Strategien

### Tagesplanung (Trading Plan)
- [ ] AC-9.12: Eigener Bereich „Tagesplan": Felder: Markt-Bias (Bullish/Bearish/Neutral), Fokus-Assets, Zu vermeidende Fehler heute (Multi-Select aus KI-Fehler-Historie), Sonstiges
- [ ] AC-9.13: Tagesplan ist pro Tag gespeichert und im Journal-Eintrag des Tages verknüpft
- [ ] AC-9.14: Wenn kein Tagesplan vorhanden → Dashboard zeigt CTA „Tagesplan für heute erstellen"

---

## Data Model

```sql
-- Tagesplan
CREATE TABLE daily_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date        DATE NOT NULL,
  market_bias      TEXT CHECK (market_bias IN ('bullish', 'bearish', 'neutral')),
  focus_assets     TEXT[],
  errors_to_avoid  TEXT[],
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, plan_date)
);

-- Import-Log
CREATE TABLE import_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  account_id      UUID NOT NULL REFERENCES accounts(id),
  imported_count  INTEGER NOT NULL DEFAULT 0,
  skipped_count   INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  error_details   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Edge Cases

- **EC-9.1:** CSV hat anderes Format als MT4/MT5 → Spalten-Mapping-Schritt ermöglicht manuelle Zuordnung
- **EC-9.2:** Import-Datei enthält 1000+ Trades → Batch-Insert in Chunks von 100, Progressbar anzeigen
- **EC-9.3:** Import wird abgebrochen (Tab geschlossen) → bereits importierte Trades bleiben erhalten (kein Rollback)
- **EC-9.4:** Smart-Vorschlag für Setup-Typ ist irrelevant → Nutzer ignoriert ihn, kein Lerneffekt notwendig

---

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
A) CSV-Import Wizard (Dialog im Journal)
+-- ImportWizardDialog (Stepper, 4 Steps)
    +-- Step 1: Upload
    |   +-- Drag-&-Drop CSV-Feld
    |   +-- Datei-Name & Größe Preview
    +-- Step 2: Spalten-Mapping
    |   +-- ColumnMapper
    |       +-- Pro Trade-OS-Feld ein Dropdown → welche CSV-Spalte?
    +-- Step 3: Vorschau
    |   +-- PreviewTable (erste 10 Zeilen, bereits gemappt)
    |   +-- Duplikat-Warnungen
    +-- Step 4: Import-Zusammenfassung
        +-- ImportSummaryCard: X importiert / Y Duplikate / Z Fehler

B) Completion Prompts (integriert in Trade-Speicher-Flow)
+-- Nach Trade-Speichern → Sonner Toast
    +-- "Kein Kommentar vorhanden" → Link öffnet TradeFormSheet
    +-- "Kein Screenshot vorhanden" → gleicher Link
    +-- Max. 1 pro Trade, max. 3 gleichzeitig

C) Smart Vorschläge (integriert in TradeFormSheet)
+-- SetupSuggestions (unter Setup-Typ-Feld)
    +-- 3 Badge-Chips: häufigste Setups der letzten 30 Trades
    +-- Klick füllt Feld automatisch
+-- StrategyAutocomplete (ersetzt Text-Input)
    +-- Combobox mit allen bisher genutzten Strategien

D) Tagesplan (neue Seite + Dashboard-Widget)
+-- /tagesplan (neue Route, in AppNav nach Kalender)
    +-- DailyPlanForm
        +-- MarketBiasSelector (Bullish / Bearish / Neutral)
        +-- FocusAssetsInput (Multi-Tag-Input)
        +-- ErrorsToAvoidSelector (Multi-Select aus KI-Fehler-Historie)
        +-- NotesTextarea
        +-- Speichern-Button (Upsert — überschreibt heutigen Plan)
    +-- PlanHistoryList (vergangene Pläne, zusammenklappbar)
+-- Dashboard: DailyPlanCTA
    +-- Kein Plan heute → CTA-Banner "Tagesplan erstellen"
    +-- Plan vorhanden → Mini-Preview des heutigen Plans
```

### Neue API-Routen

| Route | Zweck |
|-------|-------|
| `POST /api/import/csv` | CSV-Trades parsen, Duplikate prüfen, Batch-Insert, Import-Log speichern |
| `GET /api/trades/suggestions` | Top-3 Setup-Typen (letzte 30 Trades) + alle Strategien für Autocomplete |
| `GET /api/daily-plan` | Heutigen Tagesplan laden (oder leer) |
| `POST /api/daily-plan` | Tagesplan speichern (Upsert per account_id + plan_date) |

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| PapaParse für CSV-Parsing | Client-seitig im Browser — kein File-Upload auf Server, nur Trade-Objekte an API |
| Batch-Insert (100er-Chunks) | Verhindert Timeouts bei 1000+ Trades, ermöglicht Fortschrittsanzeige |
| Sonner Toasts für Completion Prompts | Bereits installiert, max. 3 gleichzeitig steuerbar |
| Tagesplan als eigene Seite | Braucht Platz für alle Felder; Dashboard zeigt nur CTA + Mini-Preview |
| Smart Suggestions via API | Setup-Häufigkeit serverseitig aus DB berechnet, kurz gecacht |

### Neue Datenbank-Tabellen

```
daily_plans
  - id, account_id, user_id, plan_date (unique pro Konto+Tag)
  - market_bias (bullish/bearish/neutral)
  - focus_assets (Text-Array)
  - errors_to_avoid (Text-Array)
  - notes (Freitext), created_at

import_logs
  - id, user_id, account_id
  - imported_count, skipped_count, error_count
  - error_details (JSONB), created_at
```

### Abhängigkeiten

| Package | Zweck |
|---------|-------|
| `papaparse` | Client-seitiges CSV-Parsing |
| `@types/papaparse` | TypeScript-Typen |

---

## Out of Scope

- Live-API-Verbindung zu Brokern (MT4/MT5 via Expert Advisor)
- Automatisches Screenshotten von Chart-Plattformen
- KI-basierter Tagesplan-Vorschlag (kommt nach PROJ-4 vollständig implementiert ist)
- Import aus Interactive Brokers, TastyTrade, etc. (MT4/MT5 genug für MVP)
