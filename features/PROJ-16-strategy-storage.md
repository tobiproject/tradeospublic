# PROJ-16 · Strategie-Profil (Strategy Storage)

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend + Backend + DB

## Beschreibung
User definiert seine Trading-Strategie einmalig in `/einstellungen`. Das Profil wird von allen KI-Funktionen (Analyse, Weekly Prep, Coach) als Kontext verwendet.

## Acceptance Criteria
- [ ] AC-1: Strategie-Name (max. 100 Zeichen)
- [ ] AC-2: Freitext-Beschreibung (max. 5000 Zeichen)
- [ ] AC-3: Bis zu 30 Trading-Regeln (per Enter oder Button hinzufügen, einzeln löschbar)
- [ ] AC-4: Timeframe-Toggles: 1m / 5m / 15m / 30m / 1h / 4h / D / W
- [ ] AC-5: Instrumente/Assets als Tags (per Enter hinzufügen, einzeln löschbar)
- [ ] AC-6: Speichern-Button mit Lade- und Erfolgs-Feedback
- [ ] AC-7: Beim erneuten Öffnen werden gespeicherte Daten geladen
- [ ] AC-8: Nur ein Strategie-Profil pro User (UNIQUE auf user_id)
- [ ] AC-9: RLS: User sieht/bearbeitet nur eigene Strategie
- [ ] AC-10: KI-Prompts in `/api/ai/weekly-prep` und `/api/ai` nutzen Strategie als Kontext

## Tech Design
- **Seite:** `src/app/(app)/einstellungen/page.tsx`
- **API:** `src/app/api/strategy/route.ts` (GET + POST mit upsert)
- **DB Tabelle:** `user_strategy` (user_id UNIQUE, name, description, rules[], preferred_timeframes[], instruments[])
- **RLS:** `auth.uid() = user_id`
- **Validierung:** Zod schema auf API-Ebene

## DB Schema
```sql
CREATE TABLE user_strategy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Meine Strategie',
  description TEXT,
  rules TEXT[] DEFAULT '{}',
  preferred_timeframes TEXT[] DEFAULT '{}',
  instruments TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
```
