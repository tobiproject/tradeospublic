# PROJ-4: KI-Analyse Engine

**Status:** Architected
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
| `@anthropic-ai/sdk` | Claude API Client | Neu installieren |
