# PROJ-10: Lernmodus (Replay, Quiz, KI-Coach)

**Status:** Architected
**Priority:** P2
**Created:** 2026-04-23

---

## Overview

Der Lernmodus erlaubt Tradern, vergangene Trades systematisch zu reflektieren und aktiv daraus zu lernen. Ein Quiz-Modus stellt Fragen zu eigenen Trades, ein KI-Coach führt ein Gespräch über Trade-Entscheidungen und ein Replay-Modus ermöglicht das mentale Durchspielen eines Trades.

---

## User Stories

- **US-10.1** Als Trader möchte ich durch vergangene Trades quizzed werden (war das ein guter Einstieg?), um mein Urteilsvermögen zu schärfen.
- **US-10.2** Als Trader möchte ich mit einem KI-Coach über einen Trade diskutieren, der Fragen stellt statt direkte Antworten gibt.
- **US-10.3** Als Trader möchte ich einen Trade-Replay machen: meine damalige Entscheidung rekonstruieren und mit dem tatsächlichen Ergebnis vergleichen.
- **US-10.4** Als Trader möchte ich meinen Lernfortschritt tracken, um motiviert zu bleiben.

---

## Acceptance Criteria

### Quiz-Modus
- [ ] AC-10.1: Quiz präsentiert einen zufälligen vergangenen Trade (Screenshot + Setup-Info, aber OHNE Ergebnis versteckt)
- [ ] AC-10.2: Fragen: „War das ein guter Einstieg? (Ja/Nein/Unsicher)", „Was war das Setup?", „Was hättest du anders gemacht?"
- [ ] AC-10.3: Nach Antwort: Aufdeckung des tatsächlichen Ergebnisses + KI-Kommentar zum Trade
- [ ] AC-10.4: Quiz-Session: 5 Trades pro Session, Zusammenfassung am Ende (Übereinstimmungs-Rate mit tatsächlichen Ergebnissen)
- [ ] AC-10.5: Nur Trades mit Screenshot sind für Quiz verwendbar
- [ ] AC-10.6: Einmal gequizte Trades werden markiert — kein sofortiger Re-Quiz des gleichen Trades

### KI-Coach Gespräch
- [ ] AC-10.7: Nutzer wählt einen Trade aus → öffnet Chat-Interface mit KI-Coach
- [ ] AC-10.8: KI-Coach startet immer mit einer offenen Frage (nicht mit einer Bewertung)
- [ ] AC-10.9: Coach-Modus: KI stellt Fragen (Sokrates-Methode), gibt erst am Ende eine Bewertung
- [ ] AC-10.10: Gespräch wird gespeichert und ist im Trade-Detail einsehbar
- [ ] AC-10.11: Maximale Gesprächslänge: 20 Nachrichten (danach: „Lass uns das Gespräch zusammenfassen")

### Trade-Replay
- [ ] AC-10.12: Replay-Modus zeigt Trade-Infos ohne Ergebnis: Asset, Datum, Setup, Chart-Screenshot, Entry
- [ ] AC-10.13: Nutzer gibt ein: „Hätte ich diesen Trade genommen? (Ja/Nein)", „Mein Re-Evaluation-SL/TP"
- [ ] AC-10.14: System berechnet: Hätte die Re-Evaluation zu besserem/schlechterem Ergebnis geführt?
- [ ] AC-10.15: Replay-Ergebnisse werden aggregiert → „Deine Re-Evaluations hätten 12% mehr Gewinn generiert"

### Lernfortschritt
- [ ] AC-10.16: Lern-Dashboard zeigt: Quizze diese Woche, Ø Quiz-Übereinstimmungsrate (letzte 30 Tage), KI-Coach-Gespräche, Streak (aufeinanderfolgende Lerntage)
- [ ] AC-10.17: Streak wird zurückgesetzt wenn 2 Tage ohne Lernaktivität — nicht 1 Tag (Wochenende-tolerant)

---

## Edge Cases

- **EC-10.1:** Nutzer hat < 5 Trades mit Screenshots → Quiz-Modus zeigt Hinweis „Lade mindestens 5 Trades mit Screenshots hoch um den Lernmodus zu starten"
- **EC-10.2:** KI-Coach-Gespräch bricht ab (Netzwerkfehler) → Bisheriges Gespräch bleibt gespeichert, Nutzer kann fortsetzen
- **EC-10.3:** Alle Trades bereits gequizzt → Quiz-Modus fragt ob alte Trades wiederholt werden sollen

---

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
A) Quiz-Modus (/lernmodus/quiz)
+-- QuizPage
    +-- QuizStart (CTA, Mindest-5-Trades-Check)
    +-- QuizSession (5 Trades pro Session)
    |   +-- QuizCard
    |       +-- TradeInfo (Asset, Datum, Setup, Screenshot — OHNE Ergebnis)
    |       +-- QuizForm
    |           +-- GoodEntryToggle ("War das ein guter Einstieg?" Ja/Nein/Unsicher)
    |           +-- SetupTypeInput ("Was war das Setup?")
    |           +-- ImprovementText ("Was hättest du anders gemacht?")
    |           +-- SubmitButton → reveals result
    |       +-- QuizResult (aufgedeckt nach Antwort)
    |           +-- ActualOutcome (P&L, Win/Loss)
    |           +-- AiComment (KI-Kommentar zum Trade)
    +-- QuizSummary (nach 5 Trades)
        +-- MatchRate ("3/5 Übereinstimmungen")
        +-- PerTrade-List (kurze Zusammenfassung jedes Trade)
        +-- RestartButton

B) KI-Coach (/lernmodus/coach)
+-- CoachPage
    +-- TradeSelector (Dropdown: alle Trades mit Screenshot)
    +-- CoachChat (wenn Trade ausgewählt)
        +-- MessageList (Verlauf aller Nachrichten)
        |   +-- AiMessage (Fragen des Coaches, blau links)
        |   +-- UserMessage (Antworten des Traders, grau rechts)
        +-- ChatInput (Texteingabe + Senden)
        +-- MessageCounter ("12/20 Nachrichten")
        +-- SummaryBanner (ab Nachricht 20: "Lass uns zusammenfassen")

C) Trade-Replay (/lernmodus/replay)
+-- ReplayPage
    +-- TradeSelector (alle Trades, auch ohne Screenshot)
    +-- ReplayCard (wenn Trade ausgewählt)
        +-- TradeInfo (Asset, Datum, Setup, Screenshot — OHNE Ergebnis)
        +-- ReplayForm
            +-- WouldTakeToggle ("Hätte ich diesen Trade genommen? Ja/Nein")
            +-- ReEvalSL (Zahl-Input: "Mein Re-Evaluation SL")
            +-- ReEvalTP (Zahl-Input: "Mein Re-Evaluation TP")
            +-- SubmitButton → berechnet Ergebnis
        +-- ReplayResult (nach Submit)
            +-- ActualVsReEval (Vergleich: Original vs. Re-Evaluation)
            +-- ImprovementBadge ("Re-Eval hätte +2.3R gebracht")

D) Lernfortschritt (/lernmodus)
+-- LearnDashboard (Übersichtsseite / Entry Point)
    +-- StreakCard (Aktuelle Streak: X Tage)
    +-- WeeklyQuizCard (Quizze diese Woche: X)
    +-- MatchRateCard (Ø Übereinstimmungsrate letzte 30 Tage)
    +-- CoachConversationsCard (KI-Coach-Gespräche gesamt)
    +-- QuickActions
        +-- StartQuizButton → /lernmodus/quiz
        +-- StartCoachButton → /lernmodus/coach
        +-- StartReplayButton → /lernmodus/replay
```

### Datenbank-Tabellen

```
quiz_sessions
  - id, account_id, user_id
  - started_at, completed_at
  - match_rate (0.0 – 1.0, berechnet am Ende)

quiz_answers
  - id, session_id, trade_id, account_id
  - good_entry (yes/no/unsure)
  - setup_guess (Text)
  - improvement_notes (Text)
  - ai_comment (Text, generiert nach Antwort)
  - answered_at

coach_conversations
  - id, trade_id, account_id, user_id
  - messages (JSONB Array: [{role, content, created_at}])
  - message_count (Integer)
  - created_at, updated_at

replay_evaluations
  - id, trade_id, account_id, user_id
  - would_take (Boolean)
  - reeval_sl (Decimal)
  - reeval_tp (Decimal)
  - reeval_result (Decimal, berechnet: was wäre das Ergebnis gewesen?)
  - original_result (Decimal, Kopie von Trade P&L)
  - evaluated_at

learn_activity
  - id, account_id, user_id, activity_date (DATE)
  - activity_type (quiz/coach/replay)
  - (UNIQUE: account_id + user_id + activity_date + activity_type)
  Zweck: Streak-Berechnung ohne alle Tabellen scannen
```

### API-Routen

| Route | Zweck |
|-------|-------|
| `GET /api/quiz/start` | 5 zufällige ungequizte Trades mit Screenshot zurückgeben |
| `POST /api/quiz/session` | Session erstellen, Antworten speichern, KI-Kommentar generieren, match_rate berechnen |
| `GET /api/coach/conversation?trade_id=X` | Bestehende Unterhaltung laden oder neue starten |
| `POST /api/coach/conversation` | Neue Nachricht senden → KI antwortet (Streaming), Nachricht in messages JSONB persistieren |
| `POST /api/replay` | Replay-Evaluation speichern + Re-Eval-Ergebnis berechnen |
| `GET /api/learn/stats` | Streak, Quiz-Anzahl, Match-Rate, Coach-Gespräche für Dashboard |

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| KI-Kommentar im Quiz via Claude API (non-streaming) | Einmaliger Kommentar nach Trade-Aufdeckung, kein Live-Chat — einfacher als Streaming |
| KI-Coach via Claude API (Streaming) | Chat-Erfahrung erfordert schnelle Response — Streaming sieht natürlicher aus |
| messages als JSONB in einer Spalte | Gespräch ist immer ein zusammenhängendes Objekt — kein JOIN nötig, einfacher Append |
| learn_activity separate Tabelle | Streak-Berechnung ohne Joins auf allen drei Aktivitäts-Tabellen — schnell und skalierbar |
| Quiz-Trades: nur Trades mit Screenshot | Screenshot ist visueller Anker für Lerneffekt — ohne ihn hat Quiz wenig Wert |
| Re-Eval-Ergebnis server-seitig berechnen | Entry-Preis + Direction aus Trade bekannt → (TP-Entry)/Entry für Long, server-seitig sicher |

### Neue Datenbank-Tabellen

```
quiz_sessions, quiz_answers, coach_conversations,
replay_evaluations, learn_activity
```

### Abhängigkeiten

| Package | Zweck |
|---------|-------|
| `ai` (Vercel AI SDK) | Streaming von Claude API Response im KI-Coach Chat |
| `@anthropic-ai/sdk` | Bereits installiert (PROJ-4) — Claude API für Quiz-Kommentare |

---

## Out of Scope

- Live Chart-Replay mit echten historischen Kursdaten (Datenkosten + Komplexität)
- Gamification-Punkte / Achievements (PROJ-11 Social/Gamification)
- Öffentliche Quiz-Challenges mit anderen Nutzern
