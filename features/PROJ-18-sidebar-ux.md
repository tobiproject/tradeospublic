# PROJ-18 · Sidebar UX (Drag & Drop + Indikatoren)

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend

## Beschreibung
Zwei UX-Verbesserungen an der Sidebar:
1. Nav-Reihenfolge per Drag & Drop änderbar (dnd-kit)
2. Tagesplan-Item zeigt grünen Dot wenn heute ein Plan erfasst wurde

Außerdem: "Konten" aus Nav entfernt (→ AccountSwitcher unten), ersetzt durch "Einstellungen".

## Acceptance Criteria
- [ ] AC-1: Grip-Icon erscheint on hover links neben dem Nav-Item
- [ ] AC-2: Items per Drag & Drop neu sortierbar
- [ ] AC-3: Neue Reihenfolge wird in `localStorage` (`tradeos-sidebar-order`) gespeichert
- [ ] AC-4: Gespeicherte Reihenfolge wird beim Seitenneuladen wiederhergestellt
- [ ] AC-5: Neue Items (nach Code-Update) werden ans Ende der gespeicherten Liste angehängt
- [ ] AC-6: Grüner Dot neben "Tagesplan" wenn `daily_plans` Eintrag für heute existiert
- [ ] AC-7: Dot verschwindet wenn kein Plan für heute vorhanden

## Tech Design
- **Bibliothek:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Komponente:** `src/components/layout/AppSidebar.tsx`
- **Tagesplan-Check:** Supabase-Query auf `daily_plans` in `useEffect` (einmalig beim Mount)
- **PointerSensor** mit `activationConstraint: { distance: 5 }` (verhindert versehentliches Drag)
