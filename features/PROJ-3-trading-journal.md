# PROJ-3: Trading Journal (Core)

**Status:** In Progress
**Priority:** P0 (MVP)
**Created:** 2026-04-23

---

## Overview

Das Trading Journal ist das Herzstück von Trade OS. Jeder Trade wird mit vollständigen Basis- und erweiterten Daten erfasst. Das System berechnet automatisch RR, Risiko % und P&L. Die Journal-Ansicht ermöglicht Filtern, Suchen und vollständiges Bearbeiten jedes Trades.

---

## User Stories

- **US-3.1** Als Trader möchte ich einen Trade schnell erfassen können (< 2 Minuten), damit die Erfassung kein Hindernis wird.
- **US-3.2** Als Trader möchte ich Entry, SL und TP eingeben und das System berechnet automatisch RR und Risiko, damit ich nichts manuell rechnen muss.
- **US-3.3** Als Trader möchte ich meine emotionale Verfassung vor und nach dem Trade dokumentieren, um emotionale Muster zu erkennen.
- **US-3.4** Als Trader möchte ich einen Chart-Screenshot hochladen und mit Freitext kommentieren.
- **US-3.5** Als Trader möchte ich alle vergangenen Trades in einer Tabelle sehen, filtern und suchen.
- **US-3.6** Als Trader möchte ich einen bereits erfassten Trade bearbeiten oder löschen.
- **US-3.7** Als Trader möchte ich einem Trade Tags zuweisen (Setup-Typ, Strategie, Marktphase), damit ich später nach ihnen filtern kann.

---

## Acceptance Criteria

### Trade erfassen (New Trade Form)
- [ ] AC-3.1: Formular enthält alle Pflichtfelder: Datum/Uhrzeit, Asset, Richtung (Long/Short), Entry, SL, TP, Lotgröße, Ergebnis (€)
- [ ] AC-3.2: RR wird automatisch berechnet sobald Entry, SL, TP eingegeben sind: `RR = |TP - Entry| / |Entry - SL|`
- [ ] AC-3.3: Risiko % wird berechnet: `Risk % = (|Entry - SL| × Lots × PipValue) / AccountBalance × 100`
- [ ] AC-3.4: Pflichtfelder werden inline validiert — Submit-Button ist disabled solange Fehler vorhanden
- [ ] AC-3.5: Freitextfeld für Analyse (min. 0, max. 5000 Zeichen) mit Zeichenzähler
- [ ] AC-3.6: Screenshot-Upload: max. 5 Bilder, je max. 10 MB, Formate: PNG, JPG, WEBP
- [ ] AC-3.7: Hochgeladene Screenshots werden als Thumbnails mit Lösch-Option angezeigt

### Erweiterte Felder
- [ ] AC-3.8: Setup-Typ: Dropdown mit vordefinierten Optionen + „Eigenen Tag hinzufügen" Funktion; gespeicherte Tags werden bei nächstem Trade vorgeschlagen
- [ ] AC-3.9: Strategie: Freitext oder aus bestehenden Strategien auswählen (aus vorherigen Trades)
- [ ] AC-3.10: Marktphase: Dropdown mit Optionen: Trend (bullish), Trend (bearish), Range, Breakout, Reversal, News-driven
- [ ] AC-3.11: Emotion vor Trade: Dropdown mit Optionen: Ruhig, Fokussiert, Nervös, Ungeduldig, Overconfident, FOMO, Müde
- [ ] AC-3.12: Emotion nach Trade: gleiche Optionen wie vor dem Trade
- [ ] AC-3.13: Ergebnis-Felder: Gewinn/Verlust in € (Pflicht) — Gewinn/Verlust in % wird automatisch berechnet

### Trade-Liste (Journal View)
- [ ] AC-3.14: Tabelle zeigt: Datum, Asset, Richtung, Entry, SL, TP, Lots, Ergebnis (€ + %), RR, Setup, Strategie, Emotion (Icon), Screenshot-Indikator
- [ ] AC-3.15: Spalten sind sortierbar (Klick auf Header)
- [ ] AC-3.16: Filter verfügbar: Datum-Range, Asset (Multi-Select), Richtung, Ergebnis (Win/Loss/BE), Setup-Typ, Strategie, Emotion
- [ ] AC-3.17: Freitextsuche über Asset, Kommentar und Setup
- [ ] AC-3.18: Pagination: 25 Trades pro Seite mit Gesamtanzahl-Anzeige

### Trade-Detail
- [ ] AC-3.19: Klick auf Trade öffnet Detail-Ansicht (Side-Panel oder Modal) mit allen Feldern inklusive Screenshots
- [ ] AC-3.20: Screenshots sind anklickbar und öffnen in Lightbox-View

### Bearbeiten & Löschen
- [ ] AC-3.21: Jeder Trade kann vollständig bearbeitet werden — alle Felder sind editierbar
- [ ] AC-3.22: Löschen erfordert Bestätigungs-Prompt — gelöschte Trades sind dauerhaft entfernt
- [ ] AC-3.23: Nach Bearbeitung werden abgeleitete Werte (RR, Risk %) automatisch neu berechnet

---

## Data Model

```sql
CREATE TABLE trades (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basisdaten
  traded_at        TIMESTAMPTZ NOT NULL,
  asset            TEXT NOT NULL,
  direction        TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price      NUMERIC(20,8) NOT NULL,
  sl_price         NUMERIC(20,8) NOT NULL,
  tp_price         NUMERIC(20,8) NOT NULL,
  lot_size         NUMERIC(10,4) NOT NULL,
  
  -- Berechnete Felder (gespeichert für Performance)
  rr_ratio         NUMERIC(6,2),
  risk_percent     NUMERIC(6,4),
  result_currency  NUMERIC(12,2),  -- positiv = Gewinn, negativ = Verlust
  result_percent   NUMERIC(8,4),
  outcome          TEXT CHECK (outcome IN ('win', 'loss', 'breakeven')),
  
  -- Tags & Kategorisierung
  setup_type       TEXT,
  strategy         TEXT,
  market_phase     TEXT,
  tags             TEXT[],
  
  -- Emotionen
  emotion_before   TEXT,
  emotion_after    TEXT,
  
  -- Analyse
  notes            TEXT,
  
  -- Medien
  screenshot_urls  TEXT[],
  
  -- Meta
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für Performance
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_traded_at ON trades(traded_at DESC);
CREATE INDEX idx_trades_user_id ON trades(user_id);
```

---

## Edge Cases

- **EC-3.1:** SL = Entry oder TP = Entry → Validierungsfehler „SL und TP müssen sich von Entry unterscheiden"
- **EC-3.2:** SL auf der falschen Seite (Long: SL > Entry) → Warnung mit Erklärung, aber kein Block (User kann override)
- **EC-3.3:** Screenshot-Upload schlägt fehl (Netzwerkfehler) → Partial save möglich — Trade wird gespeichert, Screenshot-Fehler wird als Toast gemeldet
- **EC-3.4:** Nutzer verlässt Formular mit unsaved Daten → Bestätigungs-Dialog „Änderungen verwerfen?"
- **EC-3.5:** Asset-Feld mit unbekanntem Symbol → keine Whitelist, freie Eingabe erlaubt (Forex, Crypto, Aktien, Futures gemischt)
- **EC-3.6:** Gleichzeitiges Bearbeiten desselben Trades in zwei Tabs → Last-write-wins mit `updated_at` Check; Warnung beim Submit wenn veraltet
- **EC-3.7:** Risk % Berechnung ohne bekannte Pip-Value → Nutzer kann Risk-€ direkt eingeben als Override

---

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
app/(app)/journal/
└── page.tsx                    ← Journal-Hauptseite

components/journal/
├── TradeTable                  ← Sortierbare Tabelle aller Trades
├── TradeFilters                ← Filter-Bar (Datum, Asset, Richtung, etc.)
├── TradeFormSheet              ← Slide-in Panel: Neuer Trade + Bearbeiten
│   ├── TradeFormBase           ← Pflichtfelder (Datum, Asset, Entry/SL/TP)
│   ├── RRDisplay               ← Auto-Berechnung RR + Risk % (live)
│   ├── TradeFormExtended       ← Setup, Strategie, Emotion, Tags
│   ├── ScreenshotUploader      ← Multi-Bild Upload mit Vorschau
│   └── NotesField              ← Freitext mit Zeichenzähler
├── TradeDetailSheet            ← Slide-in Panel: Trade-Detail (read-only)
│   └── ScreenshotLightbox      ← Vollbild-Ansicht für Charts
└── TradeDeleteDialog           ← Bestätigungs-Dialog

hooks/
├── useTrades                   ← Trades laden, erstellen, bearbeiten, löschen
└── useTradeCalculations        ← RR + Risk % + Result % berechnen

lib/
└── trade-calculations.ts       ← Reine Berechnungs-Funktionen (testbar)
```

### B) Datenhaltung

| Daten | Wo | Warum |
|---|---|---|
| Trade-Daten | DB — `trades` Tabelle | RLS, geräteübergreifend, für Statistiken |
| Berechnete Felder (RR, Risk %, Result %) | DB gespeichert | Dashboard/Stats können direkt abfragen ohne neu zu rechnen |
| Screenshots | Supabase Storage (`screenshots` Bucket) | Bis 10 MB/Bild, CDN-URLs direkt im Trade gespeichert |
| Filter-State | URL Query Params | Teilbar, Back-Button-fähig |

### C) Seitenfluss

```
/journal
  └── Tabelle leer → "Ersten Trade erfassen" Button
  └── Tabelle mit Trades → Filter-Bar oben, Pagination unten
        │
        ├── "+ Neuer Trade" → TradeFormSheet (Slide-in von rechts)
        │     └── Speichern → Sheet schließt, Tabelle aktualisiert
        │
        ├── Klick auf Trade-Zeile → TradeDetailSheet (read-only)
        │     └── "Bearbeiten" → TradeFormSheet mit vorausgefüllten Daten
        │
        └── "Löschen" → TradeDeleteDialog → Trade wird entfernt
```

### D) Auto-Berechnungen (live, ohne Submit)

- **RR** = `|TP - Entry| / |Entry - SL|`
- **Risk %** = `(|Entry - SL| × Lots) / Kontobalance × 100`
- **Result %** = `Result_€ / Kontobalance × 100`
- **Outcome** = automatisch: positiv → Win, negativ → Loss, ~0 → Breakeven

### E) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Sheet statt eigener Seite | Nutzer verliert nicht den Kontext der Tabelle |
| URL Query Params für Filter | Filter-State überlebt Page-Reload, ist kopierbar |
| Berechnungen als pure Funktionen in `lib/` | Einfach unit-testbar |
| Supabase Storage für Screenshots | Bereits im Stack, keine externen Services nötig |

### F) Abhängigkeiten

| Paket | Zweck |
|---|---|
| `date-fns` | Datumsformatierung |
| shadcn `Sheet` | Slide-in Panel ✅ installiert |
| shadcn `Table` | Trade-Liste ✅ installiert |
| shadcn `Calendar` + `Popover` | Datepicker ✅ installiert |
| shadcn `Command` | Combobox für Tags/Assets |

---

## Backend Implementation Notes (2026-04-23)

### Supabase Migration Applied: `proj3_trading_journal`
- `trades` table created with full schema (see Data Model above)
- RLS enabled — 4 policies: SELECT/INSERT/UPDATE/DELETE all scoped to `auth.uid() = user_id`
- 6 indexes: `account_id`, `traded_at DESC`, `user_id`, `outcome`, `asset`, `(account_id, traded_at DESC)` composite
- `updated_at` auto-update trigger via `moddatetime` extension
- `screenshots` Storage bucket created: 10 MB per-file limit, public read, user-scoped write/delete (`{user_id}/**`)

### Files Created
- `src/lib/trade-calculations.ts` — Pure functions: `calculateTrade`, `calcRR`, `calcRiskPercent`, `calcResultPercent`, `calcOutcome`, `validateSLSide`
- `src/lib/trade-calculations.test.ts` — 27 unit tests, all passing
- `src/hooks/useTrades.ts` — Full CRUD hook: `fetchTrades` (pagination + 7 filter types), `createTrade` (auto-calculates RR/risk%/outcome), `updateTrade` (recalculates derived fields when price fields change), `deleteTrade`, `uploadScreenshot`, `deleteScreenshot`, `getUniqueValues`

### Deviations from Spec
- No separate API routes — frontend calls Supabase directly via RLS-protected queries (consistent with PROJ-1 pattern)
- Storage path convention: `{user_id}/{trade_id}/{timestamp}.{ext}` (no `screenshots/` prefix needed since bucket name is `screenshots`)

## Frontend Implementation Notes (2026-04-23)

### Files Created
- `src/components/journal/JournalContent.tsx` — Orchestration client component (URL params → filters → fetch → render)
- `src/components/journal/TradeTable.tsx` — Sortable table with pagination, outcome/direction badges, emotion icons
- `src/components/journal/TradeFilters.tsx` — Filter bar: text search, date range, direction, outcome, expandable secondary filters (asset, setup, strategy, emotion); URL-persisted
- `src/components/journal/TradeFormSheet.tsx` — Slide-in form sheet: all 15 fields, live RR/Risk%/Result% preview, SL-side warning, screenshot upload (max 5 × 10 MB), tag chip input
- `src/components/journal/TradeDetailSheet.tsx` — Read-only detail view with lightbox for screenshots
- `src/components/journal/TradeDeleteDialog.tsx` — AlertDialog confirmation for delete
- `src/app/(app)/journal/page.tsx` — Route entry with Suspense boundary

### Component Updated
- `src/components/layout/AppNav.tsx` — Added "Journal" nav item

### Key Decisions
- URL query params for filter state (`q`, `from`, `to`, `dir`, `outcome`, `setup`, `strategy`, `emotion`, `assets`, `page`)
- HTML `<datalist>` for asset/setup/strategy autocomplete (simpler than Command combobox, fully accessible)
- Client-side sorting on current 25-item page (server-side sort would require extra API params)
- Screenshots: upload after trade creation to get trade ID; update trade with URLs; partial failures shown as toasts

---

## Out of Scope

- Multi-Leg Trades (Spreads, Hedges)
- Automatischer Chart-Screenshot aus Broker-Plattform
- Trade-Import aus Broker-History (CSV Import ist PROJ-9)
- Zeichenwerkzeuge direkt auf dem Screenshot
- Versionierung von Trade-Bearbeitungen (Audit-Trail)
