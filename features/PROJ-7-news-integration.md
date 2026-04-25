# PROJ-7: News-Integration & Analyse

**Status:** In Progress
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
- [ ] AC-7.1: Im Trade-Formular gibt es einen optionalen Bereich „News-Event"
- [ ] AC-7.2: Felder: War ein News-Event aktiv? (Ja/Nein/Nicht bekannt), Event-Name (Freitext, z. B. „NFP", „FOMC"), Impact-Level (High/Medium/Low), Minuten vor/nach Event (Dropdown: -60min, -30min, -15min, Während Event, +15min, +30min)
- [ ] AC-7.3: Wenn „Ja" gewählt → werden die weiteren Felder sichtbar (progressive Disclosure)
- [ ] AC-7.4: Trade-Tabelle zeigt News-Event-Indikator-Icon wenn Event verknüpft

### News-Performance Statistik
- [ ] AC-7.5: Eigener Tab/Abschnitt in Performance-Seite: „News-Analyse"
- [ ] AC-7.6: Zeigt: Winrate bei News vs. ohne News, Ø P&L bei News vs. ohne News, Performance nach Impact-Level (High/Medium/Low)
- [ ] AC-7.7: Balkendiagramm: Performance nach Timing (vor Event, während, nach Event)
- [ ] AC-7.8: Daten erst angezeigt wenn ≥ 5 News-getaggte Trades vorhanden

### KI-Empfehlung
- [ ] AC-7.9: KI analysiert News-Handelsmuster ab 10+ News-getaggten Trades
- [ ] AC-7.10: Output: Klares Urteil („Meide News-Trades" / „Du performst gut bei News" / „Gemischtes Bild"), Begründung mit konkreten Zahlen aus den Trades
- [ ] AC-7.11: Empfehlung wird im Dashboard-Insights-Feed angezeigt
- [ ] AC-7.12: Empfehlung wird monatlich neu berechnet (nicht täglich, um Rauschen zu vermeiden)

### Wirtschaftskalender (Light Version)
- [ ] AC-7.13: Eingebetteter iFrame oder Link zur Forex Factory / Investing.com Kalenderseite als externe Referenz — kein eigener Kalender-Datensatz in v1
- [ ] AC-7.14: Kalender-Tab in der Navigation sichtbar

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

## Out of Scope

- Automatisches News-Pulling aus einer API (z. B. Bloomberg, Reuters)
- Real-time News-Feed
- Sentiment-Analyse von News-Texten
- Push-Notifications vor anstehenden News-Events
