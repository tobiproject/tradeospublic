# PROJ-12 · Morning Briefing

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend-only (localStorage)

## Beschreibung
Täglich einmaliges Overlay beim ersten App-Aufruf mit einer Pre-Trade-Checkliste. Zwingt den Trader zu einem bewussten Start in den Tag.

## Acceptance Criteria
- [ ] AC-1: Overlay erscheint beim ersten App-Aufruf des Tages
- [ ] AC-2: Overlay erscheint nicht erneut, wenn es heute bereits geschlossen wurde
- [ ] AC-3: 5 Checklisten-Punkte mit klickbaren Checkboxen
- [ ] AC-4: "Bereit zum Traden →" Button ist erst aktiv wenn alle 5 Punkte gecheckt sind
- [ ] AC-5: "Überspringen" Link schließt das Overlay sofort ohne alle Punkte zu checken
- [ ] AC-6: Begrüßung zeigt `display_name` wenn gesetzt ("Guten Morgen, Tobi.")
- [ ] AC-7: Dismissal wird per `localStorage` Key `tradeos-morning-YYYY-MM-DD` gespeichert

## Checkliste (fest kodiert)
1. Ich bin ausgeschlafen und mental fokussiert
2. Ich habe meinen Tagesplan ausgefüllt
3. Ich kenne die heutigen High-Impact Events
4. Ich kenne mein Tageslimit und werde es respektieren
5. Ich trade nur mein Setup — kein FOMO, kein Revenge Trading

## Tech Design
- **Komponente:** `src/components/layout/MorningBriefing.tsx`
- **Eingebunden in:** `src/app/(app)/layout.tsx` (als Client-Komponente neben Sidebar)
- **Persistenz:** localStorage (`tradeos-morning-{date}`)
- **Personalisierung:** Fetch `/api/profile` bei erstem Aufruf für `display_name`
- **Kein Backend nötig**
