# PROJ-19 · Account Type Field

**Status:** Deployed  
**Erstellt:** 2026-04-26  
**Typ:** Frontend + Backend + DB

## Beschreibung
Neues Pflicht-/Optional-Feld beim Konto anlegen: Konto-Typ (Futures / CFD / Prop Firm / Eigenhandel).

## Acceptance Criteria
- [ ] AC-1: Dropdown "Konto-Typ" im AccountCreateDialog (optional)
- [ ] AC-2: Optionen: Futures, CFD, Prop Firm, Eigenhandel
- [ ] AC-3: Wert wird beim Erstellen in DB gespeichert
- [ ] AC-4: `Account` TypeScript-Interface enthält `account_type`
- [ ] AC-5: DB-Constraint: nur erlaubte Werte (`futures`, `cfd`, `prop`, `eigenhandel`, NULL)

## Tech Design
- **DB Migration:** `ALTER TABLE accounts ADD COLUMN account_type TEXT CHECK (...)`
- **Interface:** `src/contexts/AccountContext.tsx` → `Account.account_type`
- **Hook:** `src/hooks/useAccounts.ts` → `CreateAccountInput.account_type`
- **Dialog:** `src/components/accounts/AccountCreateDialog.tsx`
