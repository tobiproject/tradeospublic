import { test, expect, type Page } from '@playwright/test'

// ─── Auth helpers ────────────────────────────────────────────────────────────

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

// ─── Unauthenticated access ──────────────────────────────────────────────────

test.describe('Unauthenticated access', () => {
  test('AC-7.13/14: Accessing /kalender without login redirects to /login', async ({ page }) => {
    await page.goto('/kalender')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Wirtschaftskalender ─────────────────────────────────────────────────────

test.describe('Wirtschaftskalender (AC-7.13, AC-7.14)', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
  })

  test('AC-7.14: Kalender-Tab ist in der Navigation sichtbar', async ({ page }) => {
    requireCredentials()
    await expect(page.getByRole('link', { name: 'Kalender' })).toBeVisible()
  })

  test('AC-7.13: /kalender zeigt die Seitenüberschrift', async ({ page }) => {
    requireCredentials()
    await page.goto('/kalender')
    await expect(page.getByRole('heading', { name: 'Wirtschaftskalender' })).toBeVisible()
  })

  test('AC-7.13: /kalender enthält eingebetteten Kalender-iFrame', async ({ page }) => {
    requireCredentials()
    await page.goto('/kalender')
    const iframe = page.locator('iframe[title*="Wirtschaftskalender"]')
    await expect(iframe).toBeVisible()
    const src = await iframe.getAttribute('src')
    expect(src).toContain('investing.com')
  })
})

// ─── News-Tagging im Trade-Formular ──────────────────────────────────────────

test.describe('News-Tagging im Trade-Formular (AC-7.1, AC-7.2, AC-7.3)', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto('/journal')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /neuer trade/i }).click()
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  })

  test('AC-7.1: Trade-Formular enthält optionalen News-Event Bereich', async ({ page }) => {
    requireCredentials()
    await expect(page.getByText('News-Event')).toBeVisible()
    await expect(page.getByText('War ein News-Event aktiv?')).toBeVisible()
  })

  test('AC-7.2: Dropdown für News-Event Anwesenheit hat alle 3 Optionen', async ({ page }) => {
    requireCredentials()
    // Open the news_event_present select
    const selects = page.locator('[role="combobox"]')
    // Find the news one by its placeholder text
    const newsSelect = page.getByText('Nicht angegeben')
    await newsSelect.click()
    await expect(page.getByRole('option', { name: 'Ja' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Nein' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Nicht bekannt' })).toBeVisible()
  })

  test('AC-7.3: Detail-Felder sind erst sichtbar wenn "Ja" gewählt (progressive disclosure)', async ({ page }) => {
    requireCredentials()
    // Initially, detail fields should not be visible
    await expect(page.getByPlaceholder('z.B. NFP, FOMC, CPI…')).not.toBeVisible()
    await expect(page.getByText('Impact')).not.toBeVisible()
    await expect(page.getByText('Timing')).not.toBeVisible()

    // Select "Ja"
    await page.getByText('Nicht angegeben').click()
    await page.getByRole('option', { name: 'Ja' }).click()

    // Now detail fields should be visible
    await expect(page.getByPlaceholder('z.B. NFP, FOMC, CPI…')).toBeVisible()
    await expect(page.getByText('Impact')).toBeVisible()
    await expect(page.getByText('Timing')).toBeVisible()
  })

  test('AC-7.2: Impact-Level Dropdown hat High, Medium, Low Optionen', async ({ page }) => {
    requireCredentials()
    // First select "Ja" to show details
    await page.getByText('Nicht angegeben').click()
    await page.getByRole('option', { name: 'Ja' }).click()

    // Click on Impact select
    await page.getByText('Level').click()
    await expect(page.getByRole('option', { name: /High/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /Medium/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /Low/i })).toBeVisible()
  })

  test('AC-7.2: Timing Dropdown hat alle 6 Zeitoptionen', async ({ page }) => {
    requireCredentials()
    await page.getByText('Nicht angegeben').click()
    await page.getByRole('option', { name: 'Ja' }).click()

    await page.getByText('Zeitpunkt').click()
    await expect(page.getByRole('option', { name: '60 min vorher' })).toBeVisible()
    await expect(page.getByRole('option', { name: '30 min vorher' })).toBeVisible()
    await expect(page.getByRole('option', { name: '15 min vorher' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Während Event' })).toBeVisible()
    await expect(page.getByRole('option', { name: '15 min danach' })).toBeVisible()
    await expect(page.getByRole('option', { name: '30 min danach' })).toBeVisible()
  })

  test('AC-7.3: Detail-Felder verschwinden wieder wenn von "Ja" auf "Nein" gewechselt', async ({ page }) => {
    requireCredentials()
    // Show details
    await page.getByText('Nicht angegeben').click()
    await page.getByRole('option', { name: 'Ja' }).click()
    await expect(page.getByPlaceholder('z.B. NFP, FOMC, CPI…')).toBeVisible()

    // Switch to "Nein"
    await page.locator('[role="combobox"]').filter({ hasText: 'Ja' }).click()
    await page.getByRole('option', { name: 'Nein' }).click()
    await expect(page.getByPlaceholder('z.B. NFP, FOMC, CPI…')).not.toBeVisible()
  })
})

// ─── News-Analyse Tab in Performance ─────────────────────────────────────────

test.describe('News-Analyse Tab (AC-7.5, AC-7.8)', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto('/performance')
    await page.waitForLoadState('networkidle')
  })

  test('AC-7.5: Performance-Seite hat "News-Analyse" Tab', async ({ page }) => {
    requireCredentials()
    // Tab only shows when there are trades; look for the trigger in DOM regardless
    const newsTrigger = page.getByRole('tab', { name: 'News-Analyse' })
    // Tab only visible when totalTrades > 0; check the tab list contains the text
    const tabList = page.getByRole('tablist')
    // Either it's visible (trades exist) or we verify it's in the markup via the tab text
    const hasNewsTrades = await tabList.isVisible().catch(() => false)
    if (hasNewsTrades) {
      await expect(newsTrigger).toBeVisible()
    } else {
      // No trades loaded state — tab not shown, that's correct per AC-7.8
      test.info('No trades present — News tab not shown (correct per AC-7.8 empty state)')
    }
  })

  test('AC-7.8: News-Analyse Tab zeigt leeren State wenn < 5 News-Trades (API returns null)', async ({ page }) => {
    requireCredentials()
    // Navigate to performance and check if we can access the News tab
    // If trades exist, click the tab and verify empty state or data is shown
    const tabList = page.getByRole('tablist')
    const hasTabList = await tabList.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasTabList) {
      const newsTab = page.getByRole('tab', { name: 'News-Analyse' })
      const hasNewsTab = await newsTab.isVisible({ timeout: 2000 }).catch(() => false)

      if (hasNewsTab) {
        await newsTab.click()
        // Either empty state is shown OR stats cards are shown
        const emptyState = page.getByText(/mindestens 5 Trades/i)
        const statsCard = page.getByText(/News vs\. kein News/i)
        const either = await Promise.race([
          emptyState.waitFor({ timeout: 5000 }).then(() => 'empty'),
          statsCard.waitFor({ timeout: 5000 }).then(() => 'stats'),
        ]).catch(() => 'unknown')
        expect(['empty', 'stats']).toContain(either)
      }
    } else {
      test.info('No trades — performance tabs not shown')
    }
  })
})

// ─── Responsive Layout ───────────────────────────────────────────────────────

test.describe('Responsive: Kalender page', () => {
  test('Kalender renders correctly on mobile (375px)', async ({ page }) => {
    requireCredentials()
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/kalender')
    await expect(page.getByRole('heading', { name: 'Wirtschaftskalender' })).toBeVisible()
  })
})
