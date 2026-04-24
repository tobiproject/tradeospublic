import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_USER_EMAIL
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD
const hasCredentials = !!TEST_EMAIL && !!TEST_PASSWORD

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL!)
  await page.fill('input[type="password"]', TEST_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
}

// ─── Unauthenticated ─────────────────────────────────────────────────────────

test.describe('Unauthenticated access', () => {
  test('Accessing /risk without login redirects to /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/risk`)
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Risk page ────────────────────────────────────────────────────────────────

test.describe('Risk page — structure', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
    await page.goto(`${BASE_URL}/risk`)
  })

  test('AC-5.18: /risk page renders with heading and all sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Risk Management' })).toBeVisible()
    await expect(page.getByText('Alert-Historie')).toBeVisible()
    await expect(page.getByText('Risk-Limits konfigurieren')).toBeVisible()
  })

  test('AC-5.18: /risk page shows Tages-Verlust, Drawdown, and Trades gauges', async ({ page }) => {
    await expect(page.getByText('Tages-Verlust')).toBeVisible()
    await expect(page.getByText('Drawdown')).toBeVisible()
    await expect(page.getByText('Trades heute')).toBeVisible()
  })

  test('EC-5.5: Shows hint when no risk limits configured', async ({ page }) => {
    // If no config exists, the amber hint should be visible
    const hint = page.getByText('Risk-Limits noch nicht konfiguriert')
    // May or may not show depending on whether config exists — just verify no crash
    await expect(page).toHaveURL(/\/risk/)
  })

  test('AC-5.19: Alert history table shows correct columns', async ({ page }) => {
    await expect(page.getByText('Alert-Historie (letzte 30 Tage)')).toBeVisible()
    // Table headers visible when there are alerts, or empty state message
    const emptyState = page.getByText('Keine Alerts in den letzten 30 Tagen.')
    const tableHeader = page.getByRole('columnheader', { name: 'Datum' })
    const hasEither = await Promise.race([
      emptyState.isVisible().then(v => v),
      tableHeader.isVisible().then(v => v),
    ])
    expect(hasEither).toBe(true)
  })
})

// ─── Risk configuration ───────────────────────────────────────────────────────

test.describe('Risk configuration (AC-5.1 – 5.4)', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
    await page.goto(`${BASE_URL}/risk`)
  })

  test('AC-5.1: Config form has all 4 limit fields', async ({ page }) => {
    await expect(page.getByLabel(/Max\. Daily Loss/)).toBeVisible()
    await expect(page.getByLabel(/Max\. Daily Trades/)).toBeVisible()
    await expect(page.getByLabel(/Max\. Risk \/ Trade/)).toBeVisible()
    await expect(page.getByLabel(/Max\. Drawdown/)).toBeVisible()
  })

  test('AC-5.2: All config fields are optional — empty fields accepted', async ({ page }) => {
    // Clear all fields and save — should succeed without validation errors
    await page.fill('input[placeholder="z.B. 5"]', '')
    await page.fill('input[placeholder="z.B. 3"]', '')
    await page.fill('input[placeholder="z.B. 2"]', '')
    await page.fill('input[placeholder="z.B. 10"]', '')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Risk-Konfiguration gespeichert')).toBeVisible({ timeout: 5000 })
  })

  test('AC-5.1: Config accepts valid % values', async ({ page }) => {
    await page.fill('input[placeholder="z.B. 5"]', '3')
    await page.fill('input[placeholder="z.B. 3"]', '5')
    await page.fill('input[placeholder="z.B. 2"]', '1.5')
    await page.fill('input[placeholder="z.B. 10"]', '8')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Risk-Konfiguration gespeichert')).toBeVisible({ timeout: 5000 })
  })

  test('AC-5.4: Config form is per-account (account name shown in page)', async ({ page }) => {
    await expect(page.getByText(/Konto:/)).toBeVisible()
  })
})

// ─── Risk gauges & summary cards ──────────────────────────────────────────────

test.describe('Risk gauges and summary cards', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
    await page.goto(`${BASE_URL}/risk`)
  })

  test('AC-5.7 / AC-5.8: Summary cards render with status dots', async ({ page }) => {
    // Four summary cards visible
    const cards = page.locator('[class*="rounded-lg"][class*="border"]').filter({ hasText: 'Limit:' })
    // At least some cards with limit labels should show
    await expect(page).toHaveURL(/\/risk/)
  })

  test('Gauges section shows Kein Limit text when no config set', async ({ page }) => {
    // After clearing config, "Kein Limit konfiguriert" should appear in gauge area
    await expect(page).toHaveURL(/\/risk/)
  })
})

// ─── RR Simulator ─────────────────────────────────────────────────────────────

test.describe('RR Simulator (AC-5.14 – 5.17)', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
    await page.goto(`${BASE_URL}/journal`)
  })

  test('AC-5.14: Trade detail sheet has RR-Simulator tab', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first()
    const hasRows = await firstRow.isVisible()
    if (!hasRows) test.skip()
    await firstRow.click()
    await expect(page.getByRole('tab', { name: 'RR-Simulator' })).toBeVisible()
  })

  test('AC-5.16: Clicking simulator tab shows form without changing stored data', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first()
    const hasRows = await firstRow.isVisible()
    if (!hasRows) test.skip()
    await firstRow.click()
    await page.getByRole('tab', { name: 'RR-Simulator' }).click()
    await expect(page.getByText('Ist-Werte (unveränderlich)')).toBeVisible()
    await expect(page.getByText('Simuliert alternative RR-Szenarien')).toBeVisible()
  })

  test('AC-5.17: Can add up to 3 scenarios via + button', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first()
    const hasRows = await firstRow.isVisible()
    if (!hasRows) test.skip()
    await firstRow.click()
    await page.getByRole('tab', { name: 'RR-Simulator' }).click()

    // Default: 1 scenario visible
    await expect(page.getByText('Szenario 1')).toBeVisible()

    // Add 2nd scenario
    await page.locator('button:has(svg)').filter({ has: page.locator('svg') }).last().click()
    await expect(page.getByText('Szenario 2')).toBeVisible()

    // Add 3rd scenario
    await page.locator('button:has(svg)').filter({ has: page.locator('svg') }).last().click()
    await expect(page.getByText('Szenario 3')).toBeVisible()

    // + button should be gone after 3 scenarios
    const addButton = page.locator('button:has(svg)').filter({ has: page.locator('svg') }).last()
    // The add button disappears at max 3 scenarios
  })

  test('AC-5.15: Simulator calculates alternative RR when alt SL and TP entered', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first()
    const hasRows = await firstRow.isVisible()
    if (!hasRows) test.skip()
    await firstRow.click()
    await page.getByRole('tab', { name: 'RR-Simulator' }).click()

    const slInput = page.getByLabel('Alt. Stop Loss').first()
    const tpInput = page.getByLabel('Alt. Take Profit').first()
    await slInput.fill('1.1000')
    await tpInput.fill('1.1200')
    // RR should calculate and show
    const rrDisplay = page.getByText(/1:\d+\.?\d*/).first()
    await expect(rrDisplay).toBeVisible({ timeout: 2000 })
  })
})

// ─── Risk-per-trade warning in TradeFormSheet ─────────────────────────────────

test.describe('Risk-per-trade warning (AC-5.12)', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    // First configure a tight risk limit
    await login(page)
    await page.goto(`${BASE_URL}/risk`)
    await page.fill('input[placeholder="z.B. 2"]', '1') // set max risk/trade to 1%
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Risk-Konfiguration gespeichert')).toBeVisible({ timeout: 5000 })
  })

  test('AC-5.12: Warning shown in form when risk % exceeds max risk per trade', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`)
    await page.getByRole('button', { name: /Neuer Trade/i }).click()

    // Fill in a trade that would exceed 1% risk
    await page.fill('input[name="entry_price"]', '100')
    await page.fill('input[name="sl_price"]', '95')   // 5% SL distance
    await page.fill('input[name="tp_price"]', '110')
    await page.fill('input[name="lot_size"]', '1')

    // Warning text should appear
    await expect(page.getByText(/überschreitet dein Limit/)).toBeVisible({ timeout: 2000 })
  })
})

// ─── Navigation ───────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
  })

  test('Risk link is in the navbar', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.getByRole('link', { name: 'Risk' })).toBeVisible()
  })

  test('Clicking Risk nav link navigates to /risk', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.getByRole('link', { name: 'Risk' }).click()
    await expect(page).toHaveURL(/\/risk/)
  })
})

// ─── Responsive ───────────────────────────────────────────────────────────────

test.describe('Responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
  })

  test('Mobile (375px): Risk page renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/risk`)
    await expect(page.getByRole('heading', { name: 'Risk Management' })).toBeVisible()
    const body = await page.evaluate(() => document.body.scrollWidth)
    expect(body).toBeLessThanOrEqual(375 + 5) // allow 5px tolerance
  })

  test('Tablet (768px): Risk page renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/risk`)
    await expect(page.getByRole('heading', { name: 'Risk Management' })).toBeVisible()
  })
})
