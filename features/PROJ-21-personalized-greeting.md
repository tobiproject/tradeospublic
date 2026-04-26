# PROJ-21 · Personalized Greeting (display_name)

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend + Backend + DB

## Beschreibung
User trägt in `/einstellungen` seinen Namen ein. TradeOS nutzt diesen für personalisierte Begrüßungen im Dashboard und im Morning Briefing.

## Acceptance Criteria
- [ ] AC-1: Name-Input in `/einstellungen` unter "Dein Profil"
- [ ] AC-2: Speichern-Button mit Lade- und Erfolgs-Feedback
- [ ] AC-3: Dashboard-Greeting zeigt "Guten Morgen, [Name]." wenn Name gesetzt
- [ ] AC-4: Ohne gesetzten Namen: normales "Guten Morgen."
- [ ] AC-5: Morning Briefing zeigt "Guten Morgen, [Name]." als Überschrift
- [ ] AC-6: Name wird in `profiles.display_name` gespeichert (max. 50 Zeichen)
- [ ] AC-7: Nur authentifizierte User können eigenes Profil lesen/schreiben

## Tech Design
- **DB Migration:** `ALTER TABLE profiles ADD COLUMN display_name TEXT DEFAULT NULL`
- **API:** `src/app/api/profile/route.ts` (GET + POST)
- **Dashboard:** `src/components/dashboard/DashboardContent.tsx` → `displayName` State
- **Morning Briefing:** `src/components/layout/MorningBriefing.tsx` → fetch `/api/profile`
- **Einstellungen:** `src/app/(app)/einstellungen/page.tsx` → "Dein Profil" Section
