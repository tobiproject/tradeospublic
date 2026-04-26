# PROJ-13 · Notes AI-Rewrite (Wispr Flow)

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend + Backend (Claude Haiku)

## Beschreibung
Ein "✨ Rewrite" Button im Notizen-Feld des Trade-Formulars. Bereinigt per Spracheingabe (Wispr Flow) diktierten Text: entfernt Füllwörter, korrigiert Diktierfehler, strukturiert Gedanken.

## Acceptance Criteria
- [ ] AC-1: Rewrite-Button erscheint nur wenn das Notizen-Feld Text enthält
- [ ] AC-2: Button zeigt `Loader2` Icon während API-Call läuft
- [ ] AC-3: Nach Erfolg: Textarea-Inhalt wird durch bereinigten Text ersetzt
- [ ] AC-4: Bei Fehler: `toast.error()` wird angezeigt
- [ ] AC-5: Nur authentifizierte User können die API aufrufen (401 sonst)
- [ ] AC-6: Leerer Text wird mit 400 abgelehnt

## Tech Design
- **API Route:** `src/app/api/ai/rewrite-notes/route.ts` (POST)
- **Model:** `claude-haiku-4-5-20251001`
- **UI:** Button in `FormLabel` des Notizen-Feldes in `TradeFormSheet.tsx`
- **State:** `notesRewriting: boolean` in TradeFormSheet
- **Prompt:** Bereinigt Diktierfehler, entfernt Füllwörter, behält Trading-Kontext
