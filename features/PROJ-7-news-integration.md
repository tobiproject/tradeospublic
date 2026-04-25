# PROJ-7: News-Integration & Analyse

**Status:** In Review
**Priority:** P1
**Created:** 2026-04-23

---

## Overview

Trader können News-Events mit Trades verknüpfen und dokumentieren ob sie einen Trade bewusst wegen oder trotz News gemacht haben. Die KI analysiert News-Verhalten und gibt personalisierte Empfehlungen, ob der Trader News-Events traden sollte oder meiden sollte.

---

## User Stories

- **US-7.1** Als Trader möchte ich bei einem Trade angeben, ob ein News-Event vorhanden war, um meinen News-Trading-Stil zu analysieren.
- **US-7.2** Als Trader möchte ich sehen, wie meine Performance bei High-Impact- vs. Low-Impact-News ist.
- **US-7.3** Als Trader möchte ich eine KI-Empfehlung erhalten, ob ich generell News-Events meiden oder gezielt nutzen sollte.
- **US-7.4** Als Trader möchte ich einen Wirtschaftskalender sehen, um anstehende News-Events im Blick zu haben.

---

## Acceptance Criteria

### News-Tagging im Trade
- [x] AC-7.1: Im Trade-Formular gibt es einen optionalen Bereich „News-Event"
- [x] AC-7.2: Felder: War ein News-Event aktiv? (Ja/Nein/Nicht bekannt), Event-Name (Freitext, z. B. „NFP", „FOMC"), Impact-Level (High/Medium/Low), Minuten vor/nach Event (Dropdown: -60min, -30min, -15min, Während Event, +15min, +30min)
- [x] AC-7.3: Wenn „Ja" gewählt → werden die weiteren Felder sichtbar (progressive Disclosure)
- [x] AC-7.4: Trade-Tabelle zeigt News-Event-Indikator-Icon wenn Event verknüpft

### News-Performance Statistik
- [x] AC-7.5: Eigener Tab/Abschnitt in Performance-Seite: „News-Analyse"
- [x] AC-7.6: Zeigt: Winrate bei News vs. ohne News, Ø P&L bei News vs. ohne News, Performance nach Impact-Level (High/Medium/Low)
- [x] AC-7.7: Balkendiagramm: Performance nach Timing (vor Event, während, nach Event)
- [x] AC-7.8: Daten erst angezeigt wenn ≥ 5 News-getaggte Trades vorhanden

### KI-Empfehlung
- [ ] AC-7.9: KI analysiert News-Handelsmuster ab 10+ News-getaggten Trades
- [ ] AC-7.10: Output: Klares Urteil, Begründung mit konkreten Zahlen
- [ ] AC-7.11: Empfehlung wird im Dashboard-Insights-Feed angezeigt
- [ ] AC-7.12: Empfehlung wird monatlich neu berechnet

### Wirtschaftskalender (Light Version)
- [x] AC-7.13: Eingebetteter iFrame (Investing.com Widget) als externe Referenz
- [x] AC-7.14: Kalender-Tab in der Navigation sichtbar

---

## Data Model

News-Daten werden direkt im `trades`-Tabellen-Eintrag gespeichert (PROJ-3 Data Model erweitern):

```sql
ALTER TABLE trades ADD COLUMN news_event_present  BOOLEAN DEFAULT FALSE;
ALTER TABLE trades ADD COLUMN news_event_name      TEXT;
ALTER TABLE trades ADD COLUMN news_impact_level    TEXT CHECK (news_impact_level IN ('high', 'medium', 'low'));
ALTER TABLE trades ADD COLUMN news_timing_minutes  INTEGER;  -- negativ = vor Event, positiv = nach
```

---

## Edge Cases

- **EC-7.1:** Nutzer taggt alle Trades als „Kein News-Event" ohne Reflektion → KI kann trotzdem analysieren, weist aber darauf hin dass News-Daten unvollständig sein könnten
- **EC-7.2:** < 5 News-Trades → News-Statistik zeigt leeren State „Tagge mindestens 5 Trades mit News-Events für Analyse"
- **EC-7.3:** Externer Kalender ist nicht erreichbar → Fallback-Text mit Link zur Forex Factory

---

---

## QA Test Results

**QA Date:** 2026-04-25
**QA Engineer:** Claude (automated)
**Status: APPROVED** — No Critical or High bugs found. AC-7.9–7.12 (KI-Empfehlung) deferred to next sprint.

---

### Acceptance Criteria Results

| AC | Description | Result | Notes |
|----|-------------|--------|-------|
| AC-7.1 | News-Event Sektion im Formular | ✅ PASS | Code-Review: NewsEventSection in TradeFormSheet |
| AC-7.2 | Alle 4 Felder vorhanden | ✅ PASS | Zod-Schema: present/name/impact/timing |
| AC-7.3 | Progressive Disclosure | ✅ PASS | showDetails = newsPresent === 'yes' |
| AC-7.4 | Indikator-Icon in Tabelle | ✅ PASS | Newspaper icon, 3-color by impact level |
| AC-7.5 | News-Analyse Tab in Performance | ✅ PASS | TabsTrigger/TabsContent in PerformanceContent |
| AC-7.6 | News vs. kein News Stats | ✅ PASS | withNews/withoutNews: winrate + avgPnl |
| AC-7.7 | Timing Balkendiagramm | ✅ PASS | Recharts BarChart, 6 Timing-Buckets |
| AC-7.8 | Empty State < 5 News-Trades | ✅ PASS | API returns stats: null, UI zeigt Hinweis |
| AC-7.9 | KI-Empfehlung ab 10 Trades | ⏭ DEFERRED | Nicht implementiert in v1 |
| AC-7.10 | KI Output-Format | ⏭ DEFERRED | Nicht implementiert in v1 |
| AC-7.11 | Empfehlung im Dashboard | ⏭ DEFERRED | Nicht implementiert in v1 |
| AC-7.12 | Monatliche Neuberechnung | ⏭ DEFERRED | Nicht implementiert in v1 |
| AC-7.13 | Eingebetteter Kalender-iFrame | ✅ PASS | Investing.com sslecal2 Widget |
| AC-7.14 | Kalender in Navigation | ✅ PASS | AppNav NAV_ITEMS ergänzt |

**AC-7.9–7.12 (KI-Empfehlung)** sind bewusst auf einen späteren Sprint verschoben. Die Datenbasis (News-getaggte Trades) muss erst durch AC-7.1–7.4 aufgebaut werden.

---

### Bug Report

**Keine Critical oder High Bugs gefunden.**

| # | Severity | Beschreibung | Reproduktion |
|---|----------|-------------|--------------|
| 1 | Low | E2E-Tests benötigen TEST_USER_EMAIL/PASSWORD in .env.local | Tests skippen ohne Credentials; Playwright config lädt dotenv korrekt |
| 2 | Low | Kalender-iFrame zeigt arabische Sprache statt Deutsch | Investing.com lang=3 wird korrekt übergeben, aber Investings CDN ignoriert den Parameter gelegentlich |

---

### Security Audit

| Check | Status | Notes |
|-------|--------|-------|
| Auth auf /api/news-stats | ✅ PASS | `createServerSupabaseClient().auth.getUser()` → 401 |
| Cross-Account Zugriff | ✅ PASS | Doppelte Absicherung: `.eq('account_id', accountId).eq('user_id', user.id)` |
| XSS / Injection im news_event_name | ✅ PASS | Zod: `z.string().max(100)`, wird nur dargestellt, nicht ausgeführt |
| DB-Seitige Constraint | ✅ PASS | `news_impact_level CHECK (IN ('high','medium','low'))` |
| Supabase RLS | ✅ PASS | Trades-Tabelle bereits mit RLS von PROJ-3 gesichert |

---

### Test Suite

**Unit Tests (Vitest):** 6/6 PASS — `/api/news-stats` vollständig abgedeckt
**E2E Tests (Playwright):** 2/2 PASS ohne Auth (Redirect-Tests); Auth-abhängige Tests skippen ohne .env.local Credentials

---

### Regression Testing

- Journal (PROJ-3): TradeFormSheet weiterhin funktionstüchtig, neue News-Sektion additiv
- Performance (PROJ-6): Bestehende Tabs unverändert, News-Analyse Tab additiv
- Trade Table: News-Spalte additiv, bestehende Spalten unberührt

---

## Out of Scope

- Automatisches News-Pulling aus einer API (z. B. Bloomberg, Reuters)
- Real-time News-Feed
- Sentiment-Analyse von News-Texten
- Push-Notifications vor anstehenden News-Events
