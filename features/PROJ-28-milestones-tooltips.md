# PROJ-28 — Trade Milestones & Sidebar Tooltips

**Status:** Deployed  
**Created:** 2026-04-26  

## Summary
Zwei UX-Verbesserungen: (1) Konfetti-Celebration bei Trade-Meilensteinen, (2) Hover-Tooltips für alle Sidebar-Nav-Items.

## Acceptance Criteria

### Milestones
- [x] Konfetti-Feuerwerk bei 10, 30, 50, 100, 150, 200, 500 Trades
- [x] Toast-Benachrichtigung mit Emoji + motivierender Nachricht
- [x] Jeder Meilenstein triggert nur einmal (localStorage)
- [x] Wird nach jedem neuen Trade geprüft (nicht bei Edits)
- [x] Auto-Dismiss nach 5 Sekunden

### Sidebar Tooltips
- [x] Alle 12 Nav-Items haben beschreibenden Tooltip
- [x] Tooltip erscheint nach 600ms Hover-Delay rechts neben dem Item
- [x] Tooltips funktionieren unabhängig von Drag&Drop-Reihenfolge

## Tech
- `canvas-confetti` npm package
- `src/hooks/useMilestones.ts` — Milestone-Check + localStorage-Tracking
- `src/components/journal/MilestoneCelebration.tsx` — Konfetti + Toast UI
- `src/components/journal/JournalContent.tsx` — Integration nach Trade-Save
- `src/components/layout/AppSidebar.tsx` — Tooltip-Texte + TooltipProvider
