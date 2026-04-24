import { test, expect, type Page } from '@playwright/test'

/**
 * Test credentials — add to .env.local for login-dependent tests:
 *   TEST_USER_EMAIL=your@email.com
 *   TEST_USER_PASSWORD=yourpassword
 */
const TEST_EMAIL = process.env.TEST_USER_EMAIL || ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || ''
const HAS_CREDENTIALS = !!TEST_EMAIL && !!TEST_PASSWORD

// ── Helpers ────────────────────────────────────────────────────────────────

async function login(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Einloggen' }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

function requireCredentials() {
  if (!HAS_CREDENTIALS) {
    test.skip(!HAS_CREDENTIALS, 'TEST_USER_EMAIL und TEST_USER_PASSWORD in .env.local setzen')
  }
}

// ── Registrierung ──────────────────────────────────────────────────────────

test.describe('Registrierung', () => {
  test('AC-1.1: Formular hat Pflichtfelder E-Mail, Passwort, Bestätigung', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByLabel('Passwort', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Passwort bestätigen')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Konto erstellen' })).toBeVisible()
  })

  test('AC-1.2: Inline-Fehler bei ungültiger E-Mail', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('E-Mail').fill('keine-email')
    await page.getByLabel('Passwort', { exact: true }).fill('password123')
    await page.getByLabel('Passwort bestätigen').fill('password123')
    await page.getByRole('button', { name: 'Konto erstellen' }).click()
    await expect(page.getByText(/gültige E-Mail/i)).toBeVisible()
    await expect(page).toHaveURL(/register/)
  })

  test('AC-1.2: Inline-Fehler bei zu kurzem Passwort (< 8 Zeichen)', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('E-Mail').fill('test@test.de')
    await page.getByLabel('Passwort', { exact: true }).fill('kurz')
    await page.getByLabel('Passwort bestätigen').fill('kurz')
    await page.getByRole('button', { name: 'Konto erstellen' }).click()
    await expect(page.getByText(/8 Zeichen/i)).toBeVisible()
    await expect(page).toHaveURL(/register/)
  })

  test('AC-1.2: Inline-Fehler bei nicht übereinstimmenden Passwörtern', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('E-Mail').fill('test@test.de')
    await page.getByLabel('Passwort', { exact: true }).fill('password123')
    await page.getByLabel('Passwort bestätigen').fill('anderes456')
    await page.getByRole('button', { name: 'Konto erstellen' }).click()
    await expect(page.getByText(/stimmen nicht überein/i)).toBeVisible()
  })

  test('AC-1.4: Doppelte E-Mail zeigt klare Fehlermeldung ohne technische Details', async ({ page }) => {
    requireCredentials()
    await page.goto('/register')
    await page.getByLabel('E-Mail').fill(TEST_EMAIL)
    await page.getByLabel('Passwort', { exact: true }).fill(TEST_PASSWORD)
    await page.getByLabel('Passwort bestätigen').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Konto erstellen' }).click()

    const errorMsg = page.getByRole('alert')
    await expect(errorMsg).toBeVisible({ timeout: 10000 })
    const text = await errorMsg.textContent()
    expect(text).not.toContain('stack')
    expect(text).not.toContain('SQL')
    expect(text).not.toContain('unique')
  })
})

// ── Login / Logout ─────────────────────────────────────────────────────────

test.describe('Login / Logout', () => {
  test('AC-1.5: Login mit korrekten Credentials leitet auf Dashboard', async ({ page }) => {
    requireCredentials()
    await page.goto('/login')
    await page.getByLabel('E-Mail').fill(TEST_EMAIL)
    await page.getByLabel('Passwort', { exact: true }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Einloggen' }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })
  })

  test('AC-1.6: Login mit falschen Credentials zeigt generische Fehlermeldung', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-Mail').fill('irgendjemand@test.de')
    await page.getByLabel('Passwort', { exact: true }).fill('FalschesPasswort123!')
    await page.getByRole('button', { name: 'Einloggen' }).click()

    const error = page.getByRole('alert')
    await expect(error).toBeVisible({ timeout: 10000 })
    const text = await error.textContent()
    expect(text).not.toMatch(/E-Mail.*falsch/i)
    expect(text).not.toMatch(/Passwort.*falsch/i)
  })

  test('AC-1.7: Nach Logout wird Session invalidiert', async ({ page }) => {
    requireCredentials()
    await login(page)
    await expect(page).toHaveURL(/dashboard/)

    await page.getByRole('button', { name: 'Abmelden' }).click()
    await expect(page).toHaveURL(/login/, { timeout: 10000 })

    await page.goBack()
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })

  test('Route protection: Nicht-eingeloggte werden auf /login umgeleitet', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: 8000 })

    await page.goto('/accounts')
    await expect(page).toHaveURL(/login/, { timeout: 8000 })
  })

  test('Auth-Redirect: Eingeloggte Nutzer werden von /login wegumgeleitet', async ({ page }) => {
    requireCredentials()
    await login(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/dashboard/, { timeout: 8000 })
  })
})

// ── Multi-Account ──────────────────────────────────────────────────────────

test.describe('Multi-Account', () => {
  test.beforeEach(async ({ page }) => {
    requireCredentials()
    await login(page)
    await page.goto('/accounts')
  })

  test('AC-1.10: Konto-Formular hat alle Pflichtfelder und optionale Felder', async ({ page }) => {
    await page.getByRole('button', { name: 'Konto anlegen' }).click()
    await expect(page.getByLabel('Kontoname *')).toBeVisible()
    await expect(page.getByLabel('Startbalance *')).toBeVisible()
    await expect(page.getByLabel(/Währung \*/)).toBeVisible()
    await expect(page.getByLabel(/Broker/)).toBeVisible()
    await expect(page.getByLabel(/Beschreibung/)).toBeVisible()
  })

  test('AC-1.10: Formular-Validierung — leerer Name wird abgelehnt', async ({ page }) => {
    await page.getByRole('button', { name: 'Konto anlegen' }).click()
    await page.getByLabel('Startbalance *').fill('5000')
    await page.getByRole('button', { name: 'Konto erstellen' }).click()
    await expect(page.getByText(/erforderlich/i)).toBeVisible()
  })

  test('AC-1.10: Formular-Validierung — Startbalance 0 wird abgelehnt (EC-1.5)', async ({ page }) => {
    await page.getByRole('button', { name: 'Konto anlegen' }).click()
    await page.getByLabel('Kontoname *').fill('Test Konto')
    await page.getByLabel('Startbalance *').fill('0')
    await page.getByRole('button', { name: 'Konto erstellen' }).click()
    await expect(page.getByText(/mindestens 1/i)).toBeVisible()
  })

  test('AC-1.12: Account-Switcher ist in der Navbar sichtbar', async ({ page }) => {
    const nav = page.getByRole('banner')
    const switcher = nav.locator('button').filter({ hasText: /EUR|USD|GBP|CHF|Konto anlegen/i })
    await expect(switcher.first()).toBeVisible()
  })

  test('AC-1.14: Konto löschen erfordert Namens-Bestätigung', async ({ page }) => {
    await page.getByRole('button', { name: 'Konto anlegen' }).click()
    const accountName = `Delete-Test-${Date.now()}`
    await page.getByLabel('Kontoname *').fill(accountName)
    await page.getByLabel('Startbalance *').fill('1000')
    await page.getByRole('button', { name: 'Konto erstellen' }).click()
    await page.waitForTimeout(1500)

    const card = page.locator('[role="button"]').filter({ hasText: accountName })
    await card.getByRole('button', { name: 'Löschen' }).click()

    await expect(page.getByRole('alertdialog')).toBeVisible()
    const confirmBtn = page.getByRole('button', { name: /endgültig löschen/i })
    await expect(confirmBtn).toBeDisabled()

    await page.getByPlaceholder(accountName).fill('Falsch')
    await expect(confirmBtn).toBeDisabled()

    await page.getByPlaceholder(accountName).fill(accountName)
    await expect(confirmBtn).toBeEnabled()

    await confirmBtn.click()
    await expect(card).not.toBeVisible({ timeout: 5000 })
  })

  test('EC-1.1: Doppelter Kontoname zeigt Fehlermeldung', async ({ page }) => {
    const testName = `Duplikat-${Date.now()}`

    await page.getByRole('button', { name: 'Konto anlegen' }).click()
    await page.getByLabel('Kontoname *').fill(testName)
    await page.getByLabel('Startbalance *').fill('1000')
    await page.getByRole('button', { name: 'Konto erstellen' }).click()
    await page.waitForTimeout(1500)

    await page.getByRole('button', { name: 'Konto anlegen' }).click()
    await page.getByLabel('Kontoname *').fill(testName)
    await page.getByLabel('Startbalance *').fill('2000')
    await page.getByRole('button', { name: 'Konto erstellen' }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
  })
})

// ── Passwort-Reset ─────────────────────────────────────────────────────────

test.describe('Passwort-Reset', () => {
  test('Reset-Formular ist erreichbar über /reset-password', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByLabel('E-Mail-Adresse')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset-Link senden' })).toBeVisible()
  })

  test('Link "Passwort vergessen?" führt zu /reset-password', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('Passwort vergessen?').click()
    await expect(page).toHaveURL(/reset-password/)
  })

  test('Reset-Formular validiert E-Mail-Format', async ({ page }) => {
    await page.goto('/reset-password')
    await page.getByLabel('E-Mail-Adresse').fill('keine-email')
    await page.getByRole('button', { name: 'Reset-Link senden' }).click()
    await expect(page.getByText(/gültige E-Mail/i)).toBeVisible()
  })
})

// ── Responsiveness ─────────────────────────────────────────────────────────

test.describe('Responsive Design', () => {
  test('Login-Seite ist auf 375px (Mobile) nutzbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Einloggen' })).toBeVisible()
  })

  test('Register-Seite ist auf 768px (Tablet) nutzbar', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/register')
    await expect(page.getByRole('button', { name: 'Konto erstellen' })).toBeVisible()
  })
})
