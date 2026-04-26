# PROJ-23: Watchlist

**Status:** Deployed
**Created:** 2026-04-26

## Problem
Every form that needed an asset symbol (Trade, Tagesplan, Strategy) required free-text input. Users had to retype the same symbols repeatedly with no consistency.

## Solution
A centrally managed Watchlist of assets. All forms pull from this list via a searchable combobox or multi-picker, eliminating free-text repetition.

## Acceptance Criteria

- [x] Users can manage their watchlist at `/watchlist`
- [x] Quick-add popular instruments (NQ, ES, EURUSD, BTC/USD, DAX, etc.) in one click
- [x] Custom symbol + optional name + category can be added manually
- [x] Items are grouped by category (Futures, Forex, Crypto, Stocks, Indices, CFD, Other)
- [x] Items can be deleted
- [x] Asset field in Trade form uses watchlist combobox (searchable, free-text fallback)
- [x] Focus Assets in Tagesplan uses watchlist multi-picker
- [x] Instruments in Einstellungen/Strategy uses watchlist multi-picker
- [x] Watchlist accessible from sidebar nav

## Tech Design

### Database
- Table: `watchlist_items` (id, user_id, symbol, name, category, sort_order)
- UNIQUE(user_id, symbol) — no duplicates per user
- RLS: user sees only own items

### API
- `GET /api/watchlist` — list all items, ordered by sort_order + created_at
- `POST /api/watchlist` — add item (Zod: symbol min1/max20/uppercase, name optional, category enum)
- `DELETE /api/watchlist/[id]` — remove item

### Frontend
- `useWatchlist` hook — items, symbols, loading, addItem, removeItem, reload
- `AssetCombobox` — Popover + Command, single-select, free-text fallback if symbol not in list
- `AssetMultiPicker` — Popover + Command, multi-select chips, free-text fallback
- `WatchlistPage` — management UI at `/watchlist`

## Implementation Notes
- Both pickers link to `/watchlist` when the list is empty
- `assetSuggestions` prop removed from `TradeFormSheet` (replaced by internal `useWatchlist`)
- DailyPlanForm: removed manual `addAsset`/`assetInput` state, replaced with `AssetMultiPicker`
- Einstellungen: instruments section replaced with `AssetMultiPicker`
