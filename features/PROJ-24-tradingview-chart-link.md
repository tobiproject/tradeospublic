# PROJ-24: TradingView Chart Link

**Status:** Deployed
**Created:** 2026-04-26

## Problem
Screenshot-Uploads belegen Supabase Storage (max. 1 GB im Free Tier). TradingView-Charts lassen sich als permanente Links teilen — kein Storage-Verbrauch nötig.

## Solution
Optionales URL-Feld im Trade-Formular. Wird als klickbarer Link im Trade-Detail angezeigt.

## Acceptance Criteria

- [x] Trade-Formular hat ein URL-Eingabefeld unterhalb der Screenshot-Upload-Section
- [x] URL wird Zod-validiert (muss gültige URL sein oder leer)
- [x] Chart-Link wird zusammen mit dem Trade gespeichert (`chart_url` Spalte)
- [x] Trade-Detail zeigt "TradingView Chart öffnen" Link wenn gesetzt
- [x] Link öffnet in neuem Tab
- [x] Beim Bearbeiten eines Trades wird der bestehende Link vorausgefüllt
- [x] Feld ist optional — keine Pflicht

## Tech Design

### Database
- `ALTER TABLE trades ADD COLUMN chart_url TEXT`

### Frontend
- `TradeFormSheet`: `chart_url` Feld im Zod-Schema + Formular-UI
- `TradeDetailSheet`: Klickbarer Link-Button mit ExternalLink-Icon
- `Trade` interface + `CreateTradeInput`: `chart_url: string | null`

## Implementation Notes
- URL-Feld ist inline im Screenshot-Bereich platziert (logische Gruppierung: Chart-Referenzen)
- Freies Textfeld mit Link-Icon als visuellen Hinweis
- Spart Storage: Wenn TradingView-Link gesetzt, kein Upload nötig
