# PROJ-30 — Multi-AI Provider

**Status:** Deployed  
**Created:** 2026-04-26  

## Summary
Nutzer können ihren eigenen API-Key (Anthropic Claude oder OpenAI GPT-4o) hinterlegen.
NOUS nutzt dann den eigenen Key statt des Server-Budgets — wichtig für Marketing / "Bring Your Own Key".
Alle KI-Routen wurden auf den universalen `callAI()` Helper migriert.

## Acceptance Criteria
- [x] DB: `user_ai_settings` Tabelle (provider, api_key, model) mit RLS
- [x] API: GET/POST /api/ai-settings
- [x] `src/lib/ai-client.ts` — universaler `callAI()` Helper (Anthropic + OpenAI)
- [x] Anthropic: tool_use für strukturiertes JSON Output
- [x] OpenAI: function_call für strukturiertes JSON Output
- [x] User-Key hat Vorrang vor Server-Env-Key (Fallback-Kette)
- [x] Einstellungen: Provider-Toggle (Claude/GPT) + API-Key-Feld
- [x] Einstellungen: Links zu Billing/Usage je nach Provider
- [x] Alle AI-Routen migriert: analyze-trade, analyze-period, roadmap, weekly-prep, rewrite-notes
- [x] Vision-Route (analyze-simulation) und Coach (streaming) nutzen user key via getAnthropicClient()

## Tech
- `src/lib/ai-client.ts` — `callAI()` mit Provider-Routing
- `src/lib/anthropic.ts` — `getAnthropicClient(userKey?)` mit Fallback
- `src/app/api/ai-settings/route.ts`
- `src/app/(app)/einstellungen/page.tsx` — KI-Provider Sektion

## Supported Providers
| Provider | Model | Structured Output |
|----------|-------|-------------------|
| Anthropic | claude-sonnet-4-6 | tool_use |
| OpenAI | gpt-4o | function_call |
