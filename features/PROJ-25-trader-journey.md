# PROJ-25: Trader Journey & KI-Roadmap

**Status:** In Progress
**Created:** 2026-04-26

## Problem
Die App hat alle Features, aber keinen roten Faden. Der Trader weiß nicht, in welcher Phase des Tages/der Woche er sich befindet. Außerdem fehlt eine motivierende Langzeit-Perspektive: Wo bin ich, wohin gehe ich, wann werde ich profitabel?

## Solution
Zwei Ebenen:

### Ebene 1 — Täglicher Workflow (Struktur)
Klare 4-Phasen-Navigation die den Trading-Tag strukturiert:
1. **Wochenvorbereitung** — News, KI Weekly Prep, Wochenplan
2. **Morning Briefing** — Tagesplan + Checkliste (bereits vorhanden)
3. **Trade eintragen** — Journal (bereits vorhanden)
4. **Nachbereitung** — Post-Trade Review: Was lief wie, was mitnehmen?

### Ebene 2 — KI-Roadmap (Langzeit-Motivation)
KI analysiert alle Trades und berechnet:
- **Trading-Level** (Beginner / Developing / Consistent / Profitabel) mit Kriterien
- **Stärken** (z.B. "Gutes RR, disziplinierter SL")
- **Entwicklungsfelder** (z.B. "Overtrading an Montagen, FOMO in Volatilität")
- **Fortschritts-Score** (0–100) basierend auf Konsistenz, Win-Rate-Trend, RR-Trend
- **Geschätzte Zeit bis Profitabilität** — ehrliche KI-Einschätzung, keine leeren Versprechen
- **Nächster Meilenstein** — konkrete nächste Wachstumsstufe

## Acceptance Criteria

### Täglicher Workflow
- [ ] Wochenvorbereitung-Seite bei `/wochenvorbereitung` mit News, KI-Analyse, Wochenplan-Formular
- [ ] Nachbereitungs-Tab im Trade-Detail: "Was lief besser/schlechter? Was mitnehmen?"
- [ ] Dashboard-Widget "Dein Trading-Tag" zeigt aktuelle Phase + Status

### KI-Roadmap
- [ ] Roadmap-Seite bei `/roadmap` (oder als eigene Section im Dashboard)
- [ ] Trading-Level als visueller Fortschrittsbalken mit 4 Stufen
- [ ] KI-generierter Bericht: Stärken, Schwächen, konkreter nächster Schritt
- [ ] Meilensteine-Timeline (erreichte + nächste Ziele)
- [ ] "Generieren"-Button mit Ladeanimation (Claude Sonnet analysiert alle Trades)
- [ ] Ergebnis bleibt gespeichert, kann jederzeit neu generiert werden

## Tech Design

### KI-Roadmap API
- `POST /api/ai/roadmap` — Claude Sonnet
  - Input: letzte 90 Tage Trades + Strategie + häufigste Fehler aus Tagesplan
  - Output: JSON mit level, score, strengths[], weaknesses[], timeEstimate, nextMilestone, narrative
  - Gespeichert in `user_roadmap` Tabelle (user_id, data JSONB, generated_at)

### Nachbereitung (Post-Trade Review)
- Neues Tab "Nachbereitung" in TradeDetailSheet
- Felder: `review_notes` (Text), `what_went_well` (Text), `what_to_improve` (Text), `lesson_learned` (Text)
- DB: 4 neue TEXT Spalten auf `trades` Tabelle

### Wochenvorbereitung
- Neue Seite `/wochenvorbereitung`
- Nutzt bestehende WeeklyPrepCard-Logik
- Ergänzt um: Wochenplan-Formular (Ziele, Focus-Assets, Max-Trades, Max-Drawdown)
- DB: `weekly_plans` Tabelle

### Dashboard-Widget
- "Dein Trading-Tag" — zeigt welche Phase heute noch fehlt (Tagesplan? Trades? Nachbereitung?)
- Roadmap-Preview: Level-Badge + Score
