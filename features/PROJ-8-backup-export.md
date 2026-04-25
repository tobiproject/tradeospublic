# PROJ-8: Backup & Export

**Status:** In Progress
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
- [ ] AC-8.1: Export-Button auf Trade-Journal-Seite exportiert gefilterte Trades als CSV
- [ ] AC-8.2: CSV enthält alle Trade-Felder (ohne Screenshot-URLs, nur Metadaten)
- [ ] AC-8.3: CSV-Header in Deutsch und Englisch wählbar
- [ ] AC-8.4: Datumsformat im CSV: ISO 8601 (YYYY-MM-DD HH:MM:SS)
- [ ] AC-8.5: Dateiname: `tradeos-export-YYYY-MM-DD.csv`

### PDF-Monatsbericht
- [ ] AC-8.6: PDF enthält: Titelseite mit Konto-Name und Zeitraum, KPI-Übersicht, Equity-Curve-Chart, Top-5 Gewinn-Trades, Top-5 Verlust-Trades, KI-Monatsanalyse (wenn vorhanden)
- [ ] AC-8.7: PDF wird client-seitig mit jsPDF generiert (kein Server-Rendering)
- [ ] AC-8.8: PDF-Generierung für Zeitraum > 1 Jahr zeigt Warnung „Das kann einen Moment dauern..."
- [ ] AC-8.9: Dateiname: `tradeos-report-YYYY-MM.pdf`

### Full Data Export (DSGVO)
- [ ] AC-8.10: Button in Account-Einstellungen: „Alle meine Daten exportieren"
- [ ] AC-8.11: Generiert ZIP mit: trades.csv, accounts.json, ai_analyses.json, risk_configs.json
- [ ] AC-8.12: Export wird als Download ausgelöst, keine E-Mail erforderlich

### Automatisches Backup
- [ ] AC-8.13: Supabase Point-in-Time Recovery (PITR) ist aktiviert — tägliche automatische Backups durch Supabase Infrastructure
- [ ] AC-8.14: Backup-Status-Anzeige in Admin-Panel (nur Admin-sichtbar): letztes Backup-Datum

---

## Edge Cases

- **EC-8.1:** Konto hat 0 Trades → CSV-Export erstellt leere CSV mit nur Header-Zeile
- **EC-8.2:** PDF-Generierung bei > 500 Trades langsam → Progressbar anzeigen, kein Timeout
- **EC-8.3:** Export wird während laufender Dateneingabe getriggert → Snapshot des aktuellen Stands, keine Konsistenz-Probleme da read-only

---

## Out of Scope

- Import von Trade-Daten aus CSV (PROJ-9 Feature)
- E-Mail-Versand von Reports
- Automatischer Cloud-Upload zu Google Drive / Dropbox
- Verschlüsselte Exports
