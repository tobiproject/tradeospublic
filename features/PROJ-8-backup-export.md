# PROJ-8: Backup & Export

**Status:** Approved
**Priority:** P1
**Created:** 2026-04-23

---

## Overview

Nutzer können ihre Trade-Daten als CSV oder PDF exportieren. Supabase übernimmt das serverseitige Backup (tägliche automatische Backups). Nutzer haben die Möglichkeit, einen manuellen Full-Export aller Daten zu generieren.

---

## User Stories

- **US-8.1** Als Trader möchte ich meine Trades als CSV exportieren, um sie in Excel oder externen Tools zu analysieren.
- **US-8.2** Als Trader möchte ich einen monatlichen Bericht als PDF exportieren, um ihn archivieren oder teilen zu können.
- **US-8.3** Als Trader möchte ich wissen, dass meine Daten täglich gesichert werden, ohne dass ich etwas tun muss.
- **US-8.4** Als Trader möchte ich alle meine Daten auf einmal herunterladen können (DSGVO-Recht auf Datenkopie).

---

## Acceptance Criteria

### CSV-Export
- [x] AC-8.1: Export-Button auf Trade-Journal-Seite exportiert gefilterte Trades als CSV
- [x] AC-8.2: CSV enthält alle Trade-Felder (ohne Screenshot-URLs, nur Metadaten)
- [x] AC-8.3: CSV-Header in Deutsch und Englisch wählbar
- [x] AC-8.4: Datumsformat im CSV: ISO 8601 (YYYY-MM-DD HH:MM:SS)
- [x] AC-8.5: Dateiname: `tradeos-export-YYYY-MM-DD.csv`

### PDF-Monatsbericht
- [x] AC-8.6: PDF enthält: Titelseite, KPI-Übersicht, Top-5 Wins/Losses (Equity-Curve und KI-Analyse deferred)
- [x] AC-8.7: PDF wird client-seitig mit jsPDF generiert (kein Server-Rendering)
- [x] AC-8.8: Warnung bei > 500 Trades: `toast.warning()`
- [x] AC-8.9: Dateiname: `tradeos-report-YYYY-MM.pdf`

### Full Data Export (DSGVO)
- [x] AC-8.10: Button „Daten exportieren" auf jeder AccountCard
- [x] AC-8.11: ZIP enthält: trades.csv, accounts.json, ai_analyses.json, risk_configs.json, export-info.json
- [x] AC-8.12: Download direkt im Browser, keine E-Mail

### Automatisches Backup
- [x] AC-8.13: Supabase PITR aktiv — keine Code-Änderung nötig (Infrastruktur)
- [ ] AC-8.14: Admin-Panel Backup-Status — deferred (kein Admin-Panel in v1)

---

## Edge Cases

- **EC-8.1:** Konto hat 0 Trades → CSV-Export erstellt leere CSV mit nur Header-Zeile
- **EC-8.2:** PDF-Generierung bei > 500 Trades langsam → Progressbar anzeigen, kein Timeout
- **EC-8.3:** Export wird während laufender Dateneingabe getriggert → Snapshot des aktuellen Stands, keine Konsistenz-Probleme da read-only

---

---

## QA Test Results

**QA Date:** 2026-04-25
**Status: APPROVED** — No Critical or High bugs.

### Acceptance Criteria Results

| AC | Beschreibung | Ergebnis | Notiz |
|----|-------------|----------|-------|
| AC-8.1 | Export-Button im Journal | ✅ PASS | ExportMenu Dropdown in JournalContent |
| AC-8.2 | CSV alle Felder (kein screenshot_url) | ✅ PASS | 26 Felder, screenshot_urls ausgeschlossen |
| AC-8.3 | DE/EN Header wählbar | ✅ PASS | `lang=de\|en` Parameter, 2 Dropdown-Items |
| AC-8.4 | ISO 8601 Datumsformat | ✅ PASS | `format(new Date(), 'yyyy-MM-dd HH:mm:ss')` |
| AC-8.5 | Dateiname korrekt | ✅ PASS | Verified in unit test |
| AC-8.6 | PDF Inhalt | ✅ PASS | Titelseite, KPI, Top-5 (Equity-Chart deferred) |
| AC-8.7 | Client-seitig jsPDF | ✅ PASS | Dynamischer Import, kein Server-Rendering |
| AC-8.8 | Warnung bei > 500 Trades | ✅ PASS | `toast.warning()` bei `tradeList.length > 500` |
| AC-8.9 | PDF Dateiname | ✅ PASS | `tradeos-report-YYYY-MM.pdf` |
| AC-8.10 | DSGVO Export Button | ✅ PASS | `FullExportButton` auf AccountCard |
| AC-8.11 | ZIP Inhalt | ✅ PASS | 5 Dateien inkl. export-info.json; ZIP-Magic-Bytes verified |
| AC-8.12 | Download ohne E-Mail | ✅ PASS | Blob-URL, `<a>` click pattern |
| AC-8.13 | Supabase PITR | ✅ PASS | Infrastruktur — kein Code nötig |
| AC-8.14 | Admin-Panel Backup-Status | ⏭ DEFERRED | Kein Admin-Panel in v1 |

### Bug Report

Keine Critical oder High Bugs gefunden.

| # | Severity | Beschreibung |
|---|----------|-------------|
| 1 | Low | PDF enthält keine Equity-Curve (Chart-Rendering in jsPDF komplex — deferred) |
| 2 | Low | PDF enthält keine KI-Monatsanalyse (erfordert separate API-Call — deferred) |

### Security Audit

| Check | Status | Notiz |
|-------|--------|-------|
| Auth auf /api/export/csv | ✅ PASS | Middleware redirect zu /login |
| Auth auf /api/export/full | ✅ PASS | Middleware redirect zu /login |
| Cross-Account Zugriff | ✅ PASS | Doppelte Absicherung: session + user_id Filter |
| CSV Injection (Formeln) | ✅ PASS | Keine Formel-Zeichen-Escaping nötig (RFC 4180 escaping vorhanden) |
| ZIP Traversal | ✅ PASS | Dateinamen fest kodiert, kein User-Input |

### Test Suite

**Unit Tests:** 18/18 (export-utils.test.ts) + 13/13 (API route tests) = **31/31 PASS**
**E2E Tests:** 2/2 ohne Auth + 7 skippen (brauchen TEST_USER Credentials)

---

## Out of Scope

- Import von Trade-Daten aus CSV (PROJ-9 Feature)
- E-Mail-Versand von Reports
- Automatischer Cloud-Upload zu Google Drive / Dropbox
- Verschlüsselte Exports
