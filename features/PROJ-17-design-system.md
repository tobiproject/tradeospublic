# PROJ-17 · Design System (TradingView DNA)

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend (Styling)

## Beschreibung
Vollständiges Re-Design von TradeOS im TradingView-Stil: dark-first, terminal-ästhetisch, keine Pill-Buttons, konsequente Farbsemantik mit CSS Custom Properties.

## Was geändert wurde
- **`globals.css`**: Google Fonts (Manrope / Inter / JetBrains Mono), CSS Custom Properties (`--bg-0..4`, `--fg-1..4`, `--long`, `--short`, `--brand-blue`, `--border-raw`), shadcn-Vars als HSL-Werte remapped
- **`tailwind.config.ts`**: fontFamily (display/body/mono), colors (long/short/brand), borderRadius ohne `full: pill`
- **`AppSidebar.tsx`**: 224px linke Sidebar ersetzt Top-Navbar
- **`(app)/layout.tsx`**: flex-Layout mit Sidebar + scrollbarem Main-Bereich
- **`button.tsx`**: Kompaktere Größen (h-8 default), `rounded` statt `rounded-full`
- **`badge.tsx`**: Neue Varianten (long/short/win/loss/info/warn), kein Pill
- **`card.tsx`**: Shadow entfernt, kompaktere Padding
- **`input.tsx`**: h-8, rounded
- **`KpiRow.tsx`**: CSS vars direkt, `.eyebrow` / `.metric` / `.num` Utility-Klassen
- **`RecentTradesTable.tsx`**: Terminal-Style CSS Grid, kein shadcn Table

## Utility CSS Klassen
```css
.eyebrow   /* uppercase, tracking-widest, fg-3, 10.5px */
.ticker    /* JetBrains Mono, fg-1 */
.num       /* JetBrains Mono, tabular-nums */
.metric    /* Manrope, 24px+ für KPI-Werte */
```
