import { test, expect, type Page } from '@playwright/test'

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function requireCredentials() {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD
  if (!email || !password) {
    test.skip(true, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local to run this test')
  }
  return { email: email!, password: password! }
}

async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort', { exact: true }).fill(password)
  await page.getByRole('button', { name: /einloggen/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// ─── Unauthenticated ─────────────────────────────────────────────────────────

test.describe('Unauthenticated access', () => {
  test('Accessing /analysen without login redirects to /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysen`)
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Navigation ──────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
  })

  test('AC-4.19: AppNav contains "Analysen" link', async ({ page }) => {
    requireCredentials()
    await expect(page.getByRole('link', { name: 'Analysen' })).toBeVisible()
  })

  test('Clicking "Analysen" navigates to /analysen', async ({ page }) => {
    requireCredentials()
    await page.getByRole('link', { name: 'Analysen' }).click()
    await expect(page).toHaveURL(/\/analysen/)
  })
})

// ─── /analysen page structure ─────────────────────────────────────────────────

test.describe('/analysen page structure', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto(`${BASE_URL}/analysen`)
    await page.waitForLoadState('networkidle')
  })

  test('AC-4.12: /analysen page has heading "Analysen"', async ({ page }) => {
    requireCredentials()
    await expect(page.getByRole('heading', { name: 'Analysen' })).toBeVisible()
  })

  test('AC-4.12: /analysen page has "Woche" and "Monat" tabs', async ({ page }) => {
    requireCredentials()
    await expect(page.getByRole('tab', { name: 'Woche' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Monat' })).toBeVisible()
  })

  test('AC-4.13: "Woche analysieren" button is visible on Woche tab', async ({ page }) => {
    requireCredentials()
    await page.getByRole('tab', { name: 'Woche' }).click()
    await expect(page.getByRole('button', { name: /woche analysieren/i })).toBeVisible()
  })

  test('AC-4.15: "Monat analysieren" button is visible on Monat tab', async ({ page }) => {
    requireCredentials()
    await page.getByRole('tab', { name: 'Monat' }).click()
    await expect(page.getByRole('button', { name: /monat analysieren/i })).toBeVisible()
  })

  test('AC-4.18: TradingRulesEditor section is visible on /analysen', async ({ page }) => {
    requireCredentials()
    // TradingRulesEditor has a heading "Meine Trading-Regeln"
    await expect(page.getByText(/meine trading-regeln/i)).toBeVisible()
  })
})

// ─── TradingRulesEditor CRUD ──────────────────────────────────────────────────

test.describe('TradingRulesEditor CRUD', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto(`${BASE_URL}/analysen`)
    await page.waitForLoadState('networkidle')
  })

  test('AC-4.21: Can add a new trading rule', async ({ page }) => {
    requireCredentials()
    const ruleText = `QA-Test-Regel-${Date.now()}`
    const input = page.getByPlaceholder(/neue regel/i)
    await expect(input).toBeVisible()
    await input.fill(ruleText)
    await page.getByRole('button', { name: /hinzufügen/i }).click()
    await expect(page.getByText(ruleText)).toBeVisible({ timeout: 5000 })
  })

  test('AC-4.21: Can add a rule by pressing Enter', async ({ page }) => {
    requireCredentials()
    const ruleText = `QA-Enter-Regel-${Date.now()}`
    const input = page.getByPlaceholder(/neue regel/i)
    await input.fill(ruleText)
    await input.press('Enter')
    await expect(page.getByText(ruleText)).toBeVisible({ timeout: 5000 })
  })

  test('AC-4.21: Can delete a trading rule', async ({ page }) => {
    requireCredentials()
    // Create a rule first
    const ruleText = `QA-Delete-Regel-${Date.now()}`
    await page.getByPlaceholder(/neue regel/i).fill(ruleText)
    await page.getByRole('button', { name: /hinzufügen/i }).click()
    await expect(page.getByText(ruleText)).toBeVisible({ timeout: 5000 })

    // Delete it — find the row and click its trash button
    const ruleRow = page.locator('li', { hasText: ruleText })
    await ruleRow.getByRole('button', { name: /löschen/i }).click()
    await expect(page.getByText(ruleText)).not.toBeVisible({ timeout: 5000 })
  })

  test('AC-4.21: Empty input does not add a rule', async ({ page }) => {
    requireCredentials()
    const countBefore = await page.locator('li').count()
    await page.getByRole('button', { name: /hinzufügen/i }).click()
    const countAfter = await page.locator('li').count()
    expect(countAfter).toBe(countBefore)
  })
})

// ─── KI-Analyse tab in TradeDetailSheet ──────────────────────────────────────

test.describe('KI-Analyse tab in TradeDetailSheet', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto(`${BASE_URL}/journal`)
    await page.waitForLoadState('networkidle')
  })

  test('AC-4.5: KI-Analyse tab is visible when opening trade details', async ({ page }) => {
    requireCredentials()
    // Click first trade row to open detail sheet
    const firstRow = page.locator('table tbody tr').first()
    const rowCount = await page.locator('table tbody tr').count()
    if (rowCount === 0) {
      test.skip(true, 'No trades in journal — add test data first')
      return
    }
    await firstRow.click()
    // Wait for sheet to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    // Verify KI-Analyse tab exists
    await expect(page.getByRole('tab', { name: /ki-analyse/i })).toBeVisible()
  })

  test('AC-4.5: Clicking KI-Analyse tab shows analysis content area', async ({ page }) => {
    requireCredentials()
    const rowCount = await page.locator('table tbody tr').count()
    if (rowCount === 0) {
      test.skip(true, 'No trades in journal — add test data first')
      return
    }
    await page.locator('table tbody tr').first().click()
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.getByRole('tab', { name: /ki-analyse/i }).click()
    // Should show either a loading state, empty state with "Analyse starten" button, or analysis content
    const hasButton = await page.getByRole('button', { name: /analyse starten/i }).isVisible().catch(() => false)
    const hasScore = await page.getByText(/score/i).isVisible().catch(() => false)
    const hasLoading = await page.locator('.animate-pulse').isVisible().catch(() => false)
    expect(hasButton || hasScore || hasLoading).toBe(true)
  })
})

// ─── Responsive layout ────────────────────────────────────────────────────────

test.describe('Responsive layout', () => {
  test('/analysen renders correctly on mobile (375px)', async ({ page }) => {
    requireCredentials()
    const { email, password } = requireCredentials()
    await page.setViewportSize({ width: 375, height: 812 })
    await loginUser(page, email, password)
    await page.goto(`${BASE_URL}/analysen`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Analysen' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Woche' })).toBeVisible()
  })
})
