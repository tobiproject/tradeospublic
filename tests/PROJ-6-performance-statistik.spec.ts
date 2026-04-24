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
  test('Accessing /performance without login redirects to /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/performance`)
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Navigation ───────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
  })

  test('Performance link is in the navbar', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Performance' })).toBeVisible()
  })

  test('Clicking Performance nav link navigates to /performance', async ({ page }) => {
    await page.getByRole('link', { name: 'Performance' }).click()
    await expect(page).toHaveURL(/\/performance/)
  })
})

// ─── Page structure ───────────────────────────────────────────────────────────

test.describe('Performance page structure', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
    await page.goto(`${BASE_URL}/performance`)
    await page.waitForLoadState('networkidle')
  })

  test('AC-6.1: Page renders with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Performance & Statistik' })).toBeVisible()
  })

  test('AC-6.17: Filter bar with quick presets is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: '7T' })).toBeVisible()
    await expect(page.getByRole('button', { name: '30T' })).toBeVisible()
    await expect(page.getByRole('button', { name: '90T' })).toBeVisible()
    await expect(page.getByRole('button', { name: '1J' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gesamt' })).toBeVisible()
  })

  test('AC-6.19: Filter reset button appears when filter is active', async ({ page }) => {
    await page.getByRole('button', { name: '30T' }).click()
    await expect(page.getByRole('button', { name: /Filter zurücksetzen/ })).toBeVisible()
  })

  test('AC-6.19: Filter reset button clears the active filter', async ({ page }) => {
    await page.getByRole('button', { name: '7T' }).click()
    await expect(page).toHaveURL(/from=/)
    await page.getByRole('button', { name: /Filter zurücksetzen/ }).click()
    await expect(page).not.toHaveURL(/from=/)
  })
})

// ─── KPI Block (AC-6.1 – 6.3) ────────────────────────────────────────────────

test.describe('KPI Block (AC-6.1)', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
    await page.goto(`${BASE_URL}/performance`)
    await page.waitForLoadState('networkidle')
  })

  test('AC-6.1: Shows 10 KPI cards', async ({ page }) => {
    const kpis = [
      'Trades gesamt',
      'Winrate',
      'Profit-Faktor',
      'Ø Gewinn',
      'Ø Verlust',
      'Ø RR (Gewinner)',
      'Ø RR (alle)',
      'Beste Serie',
      'Schlechteste Serie',
      'Max Drawdown',
    ]
    for (const label of kpis) {
      await expect(page.getByText(label).first()).toBeVisible()
    }
  })

  test('AC-6.3: KPI block renders without error', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Performance & Statistik' })).toBeVisible()
    await expect(page.getByText('Trades gesamt')).toBeVisible()
  })
})

// ─── Tabs (AC-6.4, 6.7, 6.11, 6.14) ─────────────────────────────────────────

test.describe('Analysis tabs', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
    await page.goto(`${BASE_URL}/performance`)
    await page.waitForLoadState('networkidle')
  })

  test('Four tabs are visible when trades exist', async ({ page }) => {
    const tabsExist = await page.getByRole('tab', { name: 'Übersicht' }).isVisible()
    if (!tabsExist) test.skip() // no trades in this account
    await expect(page.getByRole('tab', { name: 'Übersicht' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Winrate' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Heatmap' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Drawdown' })).toBeVisible()
  })

  test('AC-6.14 / AC-6.15: Übersicht tab shows monthly, weekly, and DoW charts', async ({ page }) => {
    const tabExists = await page.getByRole('tab', { name: 'Übersicht' }).isVisible()
    if (!tabExists) test.skip()
    await page.getByRole('tab', { name: 'Übersicht' }).click()
    await expect(page.getByText(/Monatliches P&L|Wöchentliches P&L|Ø P&L nach Wochentag/).first()).toBeVisible()
  })

  test('AC-6.7 / AC-6.8 / AC-6.9: Winrate tab shows asset/setup/strategy charts', async ({ page }) => {
    const tabExists = await page.getByRole('tab', { name: 'Winrate' }).isVisible()
    if (!tabExists) test.skip()
    await page.getByRole('tab', { name: 'Winrate' }).click()
    await expect(page.getByText(/Winrate nach Asset|Winrate nach Setup|Winrate nach Strategie/).first()).toBeVisible()
  })

  test('AC-6.4: Heatmap tab renders grid', async ({ page }) => {
    const tabExists = await page.getByRole('tab', { name: 'Heatmap' }).isVisible()
    if (!tabExists) test.skip()
    await page.getByRole('tab', { name: 'Heatmap' }).click()
    await expect(page.getByText('Trade-Heatmap (Uhrzeit × Wochentag)')).toBeVisible()
  })

  test('AC-6.4: Heatmap has Winrate/Profit-Faktor toggle', async ({ page }) => {
    const tabExists = await page.getByRole('tab', { name: 'Heatmap' }).isVisible()
    if (!tabExists) test.skip()
    await page.getByRole('tab', { name: 'Heatmap' }).click()
    await expect(page.getByRole('button', { name: 'Winrate' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Profit-Faktor' })).toBeVisible()
  })

  test('AC-6.11 / AC-6.12 / AC-6.13: Drawdown tab shows chart and phase table', async ({ page }) => {
    const tabExists = await page.getByRole('tab', { name: 'Drawdown' }).isVisible()
    if (!tabExists) test.skip()
    await page.getByRole('tab', { name: 'Drawdown' }).click()
    await expect(page.getByText('Drawdown-Verlauf')).toBeVisible()
    await expect(page.getByText('Top-5 Drawdown-Phasen')).toBeVisible()
  })

  test('AC-6.13: Current drawdown is prominently displayed on Drawdown tab', async ({ page }) => {
    const tabExists = await page.getByRole('tab', { name: 'Drawdown' }).isVisible()
    if (!tabExists) test.skip()
    await page.getByRole('tab', { name: 'Drawdown' }).click()
    await expect(page.getByText(/Aktuell:/)).toBeVisible()
  })
})

// ─── Filter (AC-6.17, 6.18, 6.19) ────────────────────────────────────────────

test.describe('Filter persistence (AC-6.18)', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
  })

  test('AC-6.18: Quick preset updates URL searchParams (shareable link)', async ({ page }) => {
    await page.goto(`${BASE_URL}/performance`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '30T' }).click()
    await expect(page).toHaveURL(/from=/)
  })

  test('AC-6.18: URL filter persists on page reload', async ({ page }) => {
    await page.goto(`${BASE_URL}/performance?from=2026-01-01`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/from=2026-01-01/)
    await expect(page.getByRole('heading', { name: 'Performance & Statistik' })).toBeVisible()
  })

  test('AC-6.17: Asset multi-select dropdown is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/performance`)
    await page.waitForLoadState('networkidle')
    const assetBtn = page.getByRole('button', { name: /^Asset/ })
    const assetBtnExists = await assetBtn.isVisible()
    if (!assetBtnExists) test.skip() // no assets available
    await assetBtn.click()
    await expect(page.getByRole('menu')).toBeVisible()
  })
})

// ─── Low trade warning (AC-6.20) ──────────────────────────────────────────────

test.describe('Low data warning (AC-6.20)', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
  })

  test('AC-6.20: Page renders even with fewer than 20 trades in filter', async ({ page }) => {
    // Filter to a narrow date range likely to have <20 trades
    await page.goto(`${BASE_URL}/performance?from=2026-01-01&to=2026-01-02`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Performance & Statistik' })).toBeVisible()
    // Either shows warning or empty state — both are valid, not an error
    const hasWarning = await page.getByText(/statistisch valide/).isVisible()
    const hasEmpty = await page.getByText(/Keine Trades für den gewählten Filter/).isVisible()
    const hasKpiBlock = await page.getByText('Trades gesamt').isVisible()
    expect(hasWarning || hasEmpty || hasKpiBlock).toBe(true)
  })
})

// ─── Responsive layout ────────────────────────────────────────────────────────

test.describe('Responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
  })

  test('Desktop (1280px): Performance page renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/performance`)
    await expect(page.getByRole('heading', { name: 'Performance & Statistik' })).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(1285)
  })

  test('Mobile (375px): Performance page renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/performance`)
    await expect(page.getByRole('heading', { name: 'Performance & Statistik' })).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(380)
  })

  test('Tablet (768px): Performance page renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/performance`)
    await expect(page.getByRole('heading', { name: 'Performance & Statistik' })).toBeVisible()
  })
})

// ─── Security ─────────────────────────────────────────────────────────────────

test.describe('Security', () => {
  test('Unauthenticated: /performance is not accessible without login', async ({ page }) => {
    await page.goto(`${BASE_URL}/performance`)
    await expect(page).toHaveURL(/\/login/)
  })

  test.describe('Authenticated security', () => {
    test.beforeEach(async ({ page }) => {
      if (!hasCredentials) test.skip()
      await login(page)
    })

    test('No secrets or tokens visible in page source after render', async ({ page }) => {
      await page.goto(`${BASE_URL}/performance`)
      await page.waitForLoadState('networkidle')
      const content = await page.content()
      expect(content).not.toMatch(/supabase_session|service_role|anon_key/)
    })
  })
})

// ─── Regression: existing pages unaffected ───────────────────────────────────

test.describe('Regression: existing pages still work', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCredentials) test.skip()
    await login(page)
  })

  test('Dashboard still loads after nav change', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('Journal still loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/journal`)
    await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible()
  })

  test('Risk page still loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/risk`)
    await expect(page.getByRole('heading', { name: /Risk|Risiko/ })).toBeVisible()
  })

  test('All 5 nav items are present', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Journal' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Performance' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Risk' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Konten' })).toBeVisible()
  })
})
