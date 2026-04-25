# PROJ-11: Trading Knowledge Base

**Status:** Planned
**Priority:** P2
**Created:** 2026-04-25

---

## Overview

Trader können ihre eigenen Trading-Unterlagen (PDFs, z.B. WSI-Kursmaterialien, eigene Regelsets, Strategie-Dokumente) hochladen. Die KI liest diese Dokumente und gibt danach Feedback und Coaching immer im Kontext der eigenen Strategie und Regeln des Traders — nicht generisch. Ziel: KI-Analysen und Coach-Gespräche sind konsistent mit dem was der Trader gelernt hat.

---

## User Stories

- **US-11.1** Als Trader möchte ich meine Trading-Unterlagen (PDFs) hochladen, damit die KI meine persönliche Strategie und Regeln kennt.
- **US-11.2** Als Trader möchte ich sehen welche Dokumente die KI kennt und einzelne Dokumente auch wieder entfernen können.
- **US-11.3** Als Trader möchte ich dass KI-Trade-Analysen (PROJ-4) explizit auf meine hochgeladenen Regeln verweisen wenn sie Fehler oder Stärken benennt.
- **US-11.4** Als Trader möchte ich dass der KI-Coach (PROJ-10) meine Unterlagen kennt und Fragen stellt die auf meine eigene Strategie abgestimmt sind.

---

## Acceptance Criteria

### Upload & Verwaltung
- [ ] AC-11.1: Upload-Bereich akzeptiert PDFs bis 20 MB
- [ ] AC-11.2: Mehrere Dokumente hochladbar (max. 10 Dokumente pro Account)
- [ ] AC-11.3: Jedes Dokument zeigt: Name, Größe, Upload-Datum, Status (Verarbeitung / Bereit)
- [ ] AC-11.4: Dokument kann gelöscht werden (inkl. Supabase Storage + DB-Eintrag)
- [ ] AC-11.5: Beim Upload wird der PDF-Text extrahiert und als durchsuchbarer Text gespeichert

### KI-Integration
- [ ] AC-11.6: KI-Trade-Analyse (PROJ-4) bezieht Knowledge Base ein — System-Prompt enthält relevante Auszüge
- [ ] AC-11.7: KI-Coach (PROJ-10) bezieht Knowledge Base ein — Fragen beziehen sich auf die eigene Strategie
- [ ] AC-11.8: Wenn keine Dokumente vorhanden → KI verhält sich wie bisher (kein breaking change)
- [ ] AC-11.9: Relevante Auszüge werden via Similarity-Suche ausgewählt (nicht das gesamte Dokument im Prompt)

### UX
- [ ] AC-11.10: Knowledge-Base-Seite ist unter `/knowledge-base` erreichbar
- [ ] AC-11.11: Dashboard zeigt Hinweis "Knowledge Base einrichten" wenn noch keine Dokumente vorhanden

---

## Edge Cases

- **EC-11.1:** PDF ist passwortgeschützt → Fehlermeldung "Dieses PDF ist passwortgeschützt und kann nicht verarbeitet werden"
- **EC-11.2:** PDF enthält nur Bilder (gescannt) → Fehlermeldung "Dieses PDF enthält keinen lesbaren Text"
- **EC-11.3:** Upload schlägt fehl (Netzwerkfehler) → Fehlermeldung, Dokument nicht in DB gespeichert
- **EC-11.4:** Nutzer löscht letztes Dokument → KI-Verhalten fällt auf generisch zurück (keine Fehlermeldung)
- **EC-11.5:** Dokument sehr groß / viele Seiten → Extraktion läuft asynchron, Status "Verarbeitung..." bis fertig

---

## Out of Scope

- Word/Excel/PowerPoint-Dateien (nur PDF für MVP)
- OCR für gescannte Dokumente (zu komplex für MVP)
- Versionierung von Dokumenten
- Team-Sharing von Knowledge Bases
