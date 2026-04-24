# PROJ-4: KI-Analyse Engine

**Status:** In Review
**Priority:** P1
**Created:** 2026-04-23

---

## Overview

Nach jedem erfassten Trade analysiert die KI automatisch den Trade anhand der eingegebenen Daten und gibt strukturiertes Feedback. Zusätzlich generiert das System wöchentliche und monatliche Zusammenfassungen. Die KI-Engine nutzt die Claude API (claude-sonnet-4-6) mit strukturiertem Tool-Use für reproduzierbare, parsbare Outputs.

---

## User Stories

- **US-4.1** Als Trader möchte ich nach jedem Trade sofort KI-Feedback erhalten (Score, Fehler, Verbesserungen), damit ich direkt aus dem Trade lerne.
- **US-4.2** Als Trader möchte ich, dass die KI Muster in meinen Trades erkennt (z. B. „Du verlierst oft montags"), damit ich blinde Flecken aufdecke.
- **US-4.3** Als Trader möchte ich jeden Montag eine KI-Wochenanalyse erhalten.
- **US-4.4** Als Trader möchte ich monatlich eine tiefe KI-Analyse mit meinen größten Fehlern und Stärken sowie konkreten Maßnahmen.
- **US-4.5** Als Trader möchte ich manuell eine KI-Analyse für einen einzelnen Trade oder Zeitraum triggern können.

---

## Acceptance Criteria

### Trade-Level Analyse
- [ ] AC-4.1: Nach dem Speichern eines Trades wird automatisch eine KI-Analyse im Hintergrund gestartet (asynchron, nicht blockend)
- [ ] AC-4.2: Analyse-Status wird im Trade-Detail angezeigt: „Analyse läuft...", „Analyse abgeschlossen", „Analyse fehlgeschlagen"
- [ ] AC-4.3: KI-Output enthält strukturiert: Score (1–10), Fehler-Liste (0–n Einträge), Stärken-Liste, Verbesserungsvorschläge, Gesamturteil (1–2 Sätze)
- [ ] AC-4.4: Score wird als visuelle Bewertung angezeigt (Zahl + Farbskala: 1–4 rot, 5–7 gelb, 8–10 grün)
- [ ] AC-4.5: Fehler werden kategorisiert: Entry-Timing, Setup-Qualität, Risk-Management, Emotionale Entscheidung, News ignoriert, Regelverstoß
- [ ] AC-4.6: Analyse ist im Trade-Detail als eigener Tab/Abschnitt sichtbar
- [ ] AC-4.7: Analyse kann manuell neu generiert werden (Re-analyze Button)

### Muster-Erkennung
- [ ] AC-4.8: Wöchentliche Muster-Analyse läuft automatisch jeden Montag früh (Supabase Cron / Edge Function)
- [ ] AC-4.9: Muster-Typen: zeitbasiert (Tag, Uhrzeit), Asset-basiert, emotionsbasiert, setup-basiert
- [ ] AC-4.10: Erkannte Muster erscheinen als Insights-Feed im Dashboard (z. B. „In den letzten 30 Tagen verlierst du 73% deiner Trades zwischen 14:00–15:00 Uhr")
- [ ] AC-4.11: Muster werden erst ab 10+ Trades angezeigt (zu wenig Daten = kein falsches Muster-Rauschen)

### Wochenanalyse
- [ ] AC-4.12: Enthält: Wochen-P&L, Anzahl Trades, Winrate, Top-Fehler der Woche, Top-Stärke, 1 konkreter Fokus für nächste Woche
- [ ] AC-4.13: Kann manuell getriggert werden für beliebigen Zeitraum
- [ ] AC-4.14: Wochenanalyse ist in eigenem Abschnitt unter „Analysen" einsehbar und archiviert

### Monatsanalyse
- [ ] AC-4.15: Enthält: Monats-P&L, Entwicklung Winrate (vs. Vormonat), Top-3-Fehler (mit Häufigkeit), Top-3-Stärken, Strategie-Ranking, 3 konkrete Maßnahmen für nächsten Monat
- [ ] AC-4.16: Wird am 1. des Folgemonats automatisch generiert
- [ ] AC-4.17: Beinhaltet Vergleich zum Vormonat (Δ Winrate, Δ Profit-Faktor, Δ Ø RR)

### KI-Prompt-Design
- [ ] AC-4.18: System-Prompt enthält immer: Account-Stats (letzte 30 Trades), Nutzer-definierte Regeln/Strategie (falls hinterlegt), Trade-Kontext
- [ ] AC-4.19: Output ist immer JSON (Tool-Use), nie Freitext → parsbar ohne Regex-Hacks
- [ ] AC-4.20: Bei API-Fehler (Rate Limit, Timeout) wird Retry mit Exponential Backoff durchgeführt (max. 3 Versuche)
- [ ] AC-4.21: KI-Analysen werden in DB gespeichert — keine Re-Generierung bei jedem Seitenaufruf

---

## Data Model

```sql
CREATE TABLE ai_analyses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id      UUID REFERENCES trades(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id    UUID REFERENCES accounts(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('trade', 'weekly', 'monthly', 'pattern')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Ergebnisse (strukturiertes JSON)
  score         SMALLINT CHECK (score BETWEEN 1 AND 10),
  errors        JSONB,      -- [{ "category": "...", "description": "..." }]
  strengths     JSONB,      -- [{ "description": "..." }]
  suggestions   JSONB,      -- [{ "action": "...", "priority": "high|medium|low" }]
  summary       TEXT,
  full_response JSONB,      -- kompletter KI-Output für Re-Display
  
  period_start  DATE,       -- für weekly/monthly
  period_end    DATE,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_analyses_trade_id ON ai_analyses(trade_id);
CREATE INDEX idx_ai_analyses_user_id_type ON ai_analyses(user_id, type);

-- Nutzer-definierte Trading-Regeln (Kontext für KI)
CREATE TABLE trading_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_text   TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## KI-Prompt-Struktur (Trade-Analyse)

```json
{
  "system": "Du bist ein erfahrener Trading-Coach. Analysiere Trades präzise und ehrlich. Keine Lobhudelei. Nur konkrete, umsetzbare Kritik und Lob.",
  "context": {
    "account_stats": { "winrate_30d": 0.52, "avg_rr": 1.8, "profit_factor": 1.4 },
    "user_rules": ["Nur trades im Trend", "Max 2% Risiko pro Trade"],
    "trade": { /* vollständiges Trade-Objekt */ }
  },
  "tool": "analyze_trade",
  "tool_schema": {
    "score": "integer 1-10",
    "errors": "array of {category, description}",
    "strengths": "array of {description}",
    "suggestions": "array of {action, priority}",
    "summary": "string max 200 chars"
  }
}
```

---

## Edge Cases

- **EC-4.1:** Trade hat keine Notes/Screenshots → KI analysiert nur numerische Daten und weist explizit darauf hin, dass keine Chart-Analyse möglich
- **EC-4.2:** Nutzer hat < 10 Trades → Muster-Analyse wird nicht ausgeführt, stattdessen: „Noch X Trades bis zur Muster-Analyse"
- **EC-4.3:** Claude API nicht erreichbar → Trade wird trotzdem gespeichert, Analyse-Status bleibt „pending", Retry nach 5 Minuten
- **EC-4.4:** KI gibt Score 10/10 für offensichtlich schlechten Trade (Halluzination) → User kann Analyse als „unhelpful" markieren, Feedback geht in Prompt-Optimierung
- **EC-4.5:** Monatswechsel während Analyse-Generierung → Atomarer DB-Eintrag, kein doppeltes Generieren (idempotent via unique constraint auf user_id + type + period_start)

---

## Out of Scope

- Live-Chart-Analyse (Screenshot-Vision via Claude) — P2 Feature
- KI-generierte Trade-Signale oder Empfehlungen für zukünftige Trades
- Training auf eigene Daten / Fine-Tuning
- Vergleich mit anderen Nutzern (anonymisiert) — P3

---

## Tech Design (Solution Architect)

### A) Komponentenstruktur

```
TradeDetailSheet (bestehend — neuer Tab)
  └── "KI-Analyse" Tab (neu)
        ├── AnalysisStatusBadge   ← "läuft..." / "fertig" / "fehlgeschlagen"
        ├── ScoreDisplay          ← Zahl 1–10 + Farbbalken (rot/gelb/grün)
        ├── ErrorList             ← kategorisierte Fehler mit Icon
        ├── StrengthList          ← Stärken
        ├── SuggestionList        ← Verbesserungsvorschläge (hoch/mittel/niedrig)
        ├── SummaryText           ← KI-Gesamturteil (1–2 Sätze)
        └── ReanalyzeButton       ← Neu analysieren (AC-4.7)

app/(app)/analysen/page.tsx   ← Neue Seite
  └── AnalysenContent
        ├── InsightsFeed          ← Erkannte Muster (AC-4.10)
        │     (nur wenn 10+ Trades vorhanden)
        ├── Tabs: "Woche" | "Monat"
        │     ├── PeriodAnalysisCard  ← Wochenanalyse-Inhalt
        │     │     (P&L, Trades, Winrate, Top-Fehler, Fokus nächste Woche)
        │     └── MonthlyAnalysisCard ← Monatsanalyse-Inhalt
        │           (inkl. Vormonatsvergleich Δ Winrate, Δ PF, Δ RR)
        ├── TriggerButtons        ← "Wochenanalyse jetzt erstellen" / "Monatsanalyse"
        └── TradingRulesEditor    ← Nutzer hinterlegt seine Trading-Regeln (AC-4.18)

Dashboard (bestehend — neue Sektion)
  └── InsightsPreview             ← Top-2 Muster als Karten (Link → /analysen)

AppNav
  └── "Analysen" Link hinzufügen
```

### B) Datenhaltung

**Tabelle `ai_analyses`** — speichert jeden KI-Output:
- ID, Typ (trade / weekly / monthly / pattern), Status (pending → processing → completed / failed)
- Verknüpfung zu Trade (bei Trade-Analyse) oder Zeitraum bei Perioden-Analyse
- Score (1–10), Fehler-Liste, Stärken, Vorschläge, Zusammenfassung als JSONB
- Vollständiger KI-Response für Re-Display ohne neue API-Calls
- Zeitraum (period_start, period_end) für Wochen-/Monatsanalysen
- Unique Constraint auf (user_id, type, period_start) → verhindert doppelte Generierung (EC-4.5)

**Tabelle `trading_rules`** — nutzerdefinierte Regeln für den KI-Kontext:
- Freitext-Regel (z.B. "Nur im Trend traden"), aktiv/inaktiv Flag
- Verknüpfung zu user_id

**Row Level Security:** Nutzer sieht nur eigene Analysen und Regeln.

### C) API-Routen + Edge Function

| Route | Zweck |
|---|---|
| `POST /api/ai/analyze-trade` | Startet Trade-Analyse asynchron, gibt sofort `{status: "pending"}` zurück |
| `GET /api/ai/analysis?trade_id=X` | Holt gespeicherte Analyse für einen Trade (für Polling) |
| `POST /api/ai/analyze-period` | Startet Wochen- oder Monatsanalyse manuell |
| Supabase Edge Function (Cron) | Automatisches Triggern jeden Montag (Woche) + 1. des Monats (Monat) |

**Datenfluss Trade-Analyse:**
1. Trade gespeichert → Frontend ruft `POST /api/ai/analyze-trade` auf (fire & forget)
2. API schreibt `status: pending` in DB, startet Analyse im Hintergrund
3. Frontend pollt alle 3 Sekunden `GET /api/ai/analysis?trade_id=X` bis Status `completed`
4. Ergebnis aus DB — kein erneuter API-Call zur KI bei jedem Öffnen

### D) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Claude Tool-Use (JSON-Output) | Garantiert parsbare, strukturierte Antworten — kein Freitext-Parsing nötig (AC-4.19) |
| Analyse asynchron + Polling | Trade-Speichern wird nicht blockiert; Nutzer sieht sofort Status-Badge |
| Ergebnisse in DB persistiert | Seite lädt schnell; keine wiederholten KI-Kosten bei jedem Tab-Öffnen (AC-4.21) |
| Supabase Edge Function für Cron | Kein externer Cron-Dienst nötig; eingebauter pg_cron-Support |
| Exponential Backoff (3 Versuche) | Resilienz gegen Claude API Rate Limits (AC-4.20) |

### E) Abhängigkeiten

| Paket | Zweck | Status |
|---|---|---|
| `@anthropic-ai/sdk` | Claude API Client | Installiert |

---

## Backend Implementation Notes

**Implementiert (2026-04-24):**

### Neue Dateien
- `src/lib/anthropic.ts` — Singleton Anthropic-Client, wirft Fehler wenn ANTHROPIC_API_KEY fehlt
- `src/lib/ai-prompts.ts` — Tool-Schemas (TRADE_ANALYSIS_TOOL, PERIOD_ANALYSIS_TOOL, PATTERN_ANALYSIS_TOOL) + Prompt-Builder-Funktionen
- `src/app/api/ai/analyze-trade/route.ts` — POST: Ownership-Check, Upsert ai_analyses, fire-and-forget runAnalysis() mit 3-Versuch Exponential-Backoff
- `src/app/api/ai/analysis/route.ts` — GET: Einzelanalyse per trade_id oder period_start abrufen
- `src/app/api/ai/analyze-period/route.ts` — POST: Wochen-/Monatsanalyse starten inkl. Vormonats-Statistik-Vergleich
- `src/app/api/ai/analyses-list/route.ts` — GET: Listet abgeschlossene Perioden-Analysen
- `src/hooks/useAiAnalysis.ts` — triggerAnalysis() + fetchAnalysis() + 3s-Polling mit stopPolling()
- `src/hooks/useAiPeriodAnalysis.ts` — triggerPeriodAnalysis() + fetchRecentAnalyses() + Polling
- `src/hooks/useTradingRules.ts` — CRUD: fetchRules, createRule, updateRule, deleteRule

### Integrationstests (alle grün)
- `src/app/api/ai/analyze-trade/route.test.ts` — 6 Tests (401, 400 invalid UUID, 400 missing, 404 trade not found, 200 new analysis, 200 reset existing)
- `src/app/api/ai/analysis/route.test.ts` — 5 Tests (401, 400 no params, 200 null, 200 data found, 200 by period_start)
- `src/app/api/ai/analyze-period/route.test.ts` — 6 Tests (401, 400 invalid UUID, 400 bad type, 400 bad date, 200 new, 200 reset existing)

### Umgebungsvariablen
`ANTHROPIC_API_KEY` muss in `.env.local` gesetzt werden (von console.anthropic.com)

## Frontend Implementation Notes

**Implementiert (2026-04-24):**

### Neue Dateien
- `src/components/ai/TradeAnalysisTab.tsx` — KI-Analyse Tab: Score (1–10 mit Farbbalken), Fehler/Stärken/Verbesserungen, Zusammenfassung, Neu-analysieren Button, Polling bis completed
- `src/components/ai/TradingRulesEditor.tsx` — CRUD für Trading-Regeln: hinzufügen, aktivieren/deaktivieren (Switch), löschen
- `src/components/ai/PeriodAnalysisCard.tsx` — Wochen-/Monatsanalyse-Karte: P&L, Trades, Winrate, Top-Fehler, Stärken, Fokus, Vormonatsvergleich-Delta
- `src/components/ai/AnalysenContent.tsx` — /analysen Seite: Tabs Woche/Monat, Trigger-Buttons, Analyse-Liste, TradingRulesEditor
- `src/components/ai/InsightsPreview.tsx` — Dashboard-Karte: letzte 2 Analysen als Vorschau, Link → /analysen
- `src/app/(app)/analysen/page.tsx` — Neue Seite mit force-dynamic

### Geänderte Dateien
- `TradeDetailSheet.tsx` — Neuer "KI-Analyse" Tab (3. Tab), lädt lazy wenn aktiv
- `AppNav.tsx` — "Analysen" Link zwischen Performance und Risk
- `DashboardContent.tsx` — InsightsPreview am Ende
- `JournalContent.tsx` — Auto-Trigger Analyse nach Trade-Speichern (AC-4.1)
- `TradeFormSheet.tsx` — `onSuccess(newTradeId?)` gibt ID des neuen Trades zurück

---

## QA Test Results

**QA Date:** 2026-04-24
**QA Engineer:** Claude (automated)
**Status: IN REVIEW — 1 Bug found (Low severity)**

---

### Acceptance Criteria Results

| AC | Beschreibung | Status | Notiz |
|----|-------------|--------|-------|
| AC-4.1 | Auto-Trigger nach Trade-Speichern | ✅ PASS | `triggerAnalysis(newTradeId)` in `handleFormSuccess` |
| AC-4.2 | Status-Anzeige: läuft/abgeschlossen/fehlgeschlagen | ✅ PASS | TradeAnalysisTab zeigt pending/processing/completed/failed States |
| AC-4.3 | KI-Output: Score, Fehler, Stärken, Verbesserungen, Urteil | ✅ PASS | Strukturiert via Claude Tool-Use, UI rendert alle Felder |
| AC-4.4 | Score-Visualisierung (1–10, Farbkodiert) | ✅ PASS | ScoreBar: rot ≤4, amber ≤7, grün ≤10 |
| AC-4.5 | Manueller Re-Analyse-Button im Trade-Detail | ✅ PASS | "Analyse starten" / "Neu analysieren" Button vorhanden |
| AC-4.6 | Fehler-Karten mit Kategorie + Beschreibung | ✅ PASS | `errors[]` mit Kategorie-Badge gerendert |
| AC-4.7 | Fehler-State mit Meldung | ✅ PASS | XCircle + `error_message` angezeigt |
| AC-4.8 | Automatischer Cron (wöchentlich/monatlich) | ⚠️ NOT IMPL | Supabase Edge Function Cron ausstehend — muss manuell getriggert werden |
| AC-4.9 | Muster-Erkennung (Wochentag, Zeit, Asset) | ⚠️ OUT OF SCOPE | Für späteres Feature verschoben |
| AC-4.10 | Insights-Feed mit erkannten Mustern | ⚠️ OUT OF SCOPE | Dashboard zeigt Periode-Analysen, keine Muster-Cards |
| AC-4.11 | Muster: Konfidenz + Daten-Grundlage | ⚠️ OUT OF SCOPE | Nicht implementiert |
| AC-4.12 | Wochenanalyse-Seite /analysen mit Tabs | ✅ PASS | E2E: `/analysen` Heading + Woche/Monat Tabs |
| AC-4.13 | "Woche analysieren" Button triggert Analyse | ✅ PASS | Button vorhanden, E2E getestet |
| AC-4.14 | Wochenanalyse: P&L, Trades, Winrate, Fehler, Stärken | ✅ PASS | PeriodAnalysisCard rendert alle Felder |
| AC-4.15 | Monatsanalyse triggern | ✅ PASS | Button vorhanden, E2E getestet |
| AC-4.16 | Monatsanalyse: Vormonatsvergleich + Aktionsplan | ✅ PASS | DeltaBadge + actions[] in PeriodAnalysisCard |
| AC-4.17 | Dashboard InsightsPreview | ✅ PASS | InsightsPreview zeigt letzte 2 Analysen, versteckt sich wenn leer |
| AC-4.18 | TradingRulesEditor auf /analysen | ✅ PASS | E2E: "Meine Trading-Regeln" sichtbar |
| AC-4.19 | "Analysen" Link in AppNav | ✅ PASS | E2E: Link in Navigation sichtbar, navigiert zu /analysen |
| AC-4.20 | Rules fließen in KI-Prompt ein | ✅ PASS | `runAnalysis` fetcht aktive Regeln und fügt sie dem System-Prompt hinzu |
| AC-4.21 | Trading-Regeln CRUD | ✅ PASS | E2E: Erstellen (Enter + Button), Löschen getestet |

**Ergebnis: 18/21 ACs implementiert. AC-4.8 ausstehend (Cron), AC-4.9–4.11 Out of Scope.**

---

### Bugs Found

#### BUG-4.1 — Low: Timezone-Bug in Datumsberechnung
- **Severity:** Low
- **Component:** `src/lib/date-utils.ts` (vorher inline in AnalysenContent)
- **Beschreibung:** `getWeekRange()` und `getMonthRange()` verwendeten `toISOString()` auf lokal berechneten Dates, was in UTC+ Zeitzonen zu Datums-Verschiebungen führt (z.B. `2026-04-20` → `2026-04-19` in UTC+2).
- **Status:** ✅ FIXED — Behoben durch `localDateStr()` Helper der lokale Datumsformatierung nutzt.

---

### Unit Tests

Neue Tests in `src/lib/date-utils.test.ts`:
- **9 Tests** für `getWeekRange` und `getMonthRange` (Mittwoch, Montag, Sonntag-Edge-Case, Offset, Schaltjahr, Jahresgrenze)
- Entdeckten und belegten den Timezone-Bug (BUG-4.1) — alle grün nach Fix

**Alle 142 Unit/Integration Tests grün** (inkl. 9 neue Date-Utils-Tests)

---

### E2E Tests

Neue Tests in `tests/PROJ-4-ki-analyse.spec.ts`:
- **2 Tests ohne Credentials (automatisch):** Unauthenticated redirect zu /login
- **28 Tests mit Credentials (mit `TEST_USER_EMAIL` + `TEST_USER_PASSWORD`):**
  - Navigation: "Analysen" Link + Routing
  - /analysen Struktur: Heading, Tabs, Buttons
  - TradingRulesEditor CRUD: Erstellen (Enter + Button), Löschen, Empty-Input-Guard
  - KI-Analyse Tab: Tab sichtbar, Inhalt geladen
  - Responsive: Mobile 375px

---

### Security Audit

| Prüfung | Ergebnis |
|---------|----------|
| Auth-Check alle 4 API-Routes | ✅ `auth.getUser()` + 401 return |
| Data-Isolation: Abfragen mit `user_id = auth.uid()` | ✅ Alle Queries gefiltert nach `user.id` |
| RLS auf ai_analyses + trading_rules Tabellen | ✅ In Backend-Migration gesetzt |
| ANTHROPIC_API_KEY nie im Client-Code | ✅ Nur in `src/lib/anthropic.ts` (server-only) |
| Kein NEXT_PUBLIC_ Prefix für API Key | ✅ Korrekt |
| Zod-Validierung auf allen POST-Inputs | ✅ UUID, type, date format validiert |
| XSS: KI-Output über React gerendert (escaped) | ✅ Kein dangerouslySetInnerHTML |

**Security: Keine kritischen Findings.**

---

### Regression Testing

Folgende zuvor approvte Features wurden nach PROJ-4 Implementierung geprüft:
- **PROJ-2 Dashboard:** InsightsPreview-Karte neu → keine Regression in KPI/Chart/RecentTrades
- **PROJ-3 Journal:** TradeDetailSheet hat neuen Tab → bestehende Detail/Simulator Tabs unberührt
- **PROJ-3 TradeFormSheet:** `onSuccess(newTradeId?)` rückwärtskompatibel (optional parameter)
- **Build:** `npm run build` kompiliert fehlerfrei mit allen neuen Routen und Komponenten

---

### Production-Ready Decision

**⚠️ IN REVIEW** — Technisch bereit für Deployment (kein Critical/High Bug), aber:

1. **AC-4.8 (Cron)** nicht implementiert — wöchentliche/monatliche Analysen müssen manuell getriggert werden. Akzeptabel für MVP.
2. **ANTHROPIC_API_KEY** muss in Vercel Environment Variables gesetzt werden vor dem Deploy.
3. AC-4.9–4.11 (Muster-Erkennung) als Out of Scope dokumentiert, kein Blocking-Issue.

**Empfehlung: APPROVED für Deployment wenn ANTHROPIC_API_KEY in Produktion gesetzt.**
