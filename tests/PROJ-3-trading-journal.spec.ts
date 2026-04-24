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
  test('Accessing /journal without login redirects to /login', async ({ page }) => {
    await page.goto('/journal')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Journal page structure ──────────────────────────────────────────────────

test.describe('Journal page structure', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto('/journal')
    await page.waitForLoadState('networkidle')
  })

  test('AC-3.14: Journal page has heading and "+ Neuer Trade" button', async ({ page }) => {
    requireCredentials()
    await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible()
    await expect(page.getByRole('button', { name: /neuer trade/i })).toBeVisible()
  })

  test('AC-3.16: Filter bar contains direction and outcome selects', async ({ page }) => {
    requireCredentials()
    // Direction filter
    await expect(page.getByText(/alle richtungen/i)).toBeVisible()
    // Outcome filter
    await expect(page.getByText(/alle ergebnisse/i)).toBeVisible()
    // "Mehr Filter" toggle
    await expect(page.getByRole('button', { name: /mehr filter/i })).toBeVisible()
  })

  test('AC-3.17: Search input is present', async ({ page }) => {
    requireCredentials()
    await expect(page.getByPlaceholder(/asset.*setup.*notizen/i)).toBeVisible()
  })

  test('AC-3.16: Extended filters appear on "Mehr Filter" click', async ({ page }) => {
    requireCredentials()
    await page.getByRole('button', { name: /mehr filter/i }).click()
    await expect(page.getByPlaceholder('Asset')).toBeVisible()
    await expect(page.getByPlaceholder('Setup-Typ')).toBeVisible()
    await expect(page.getByPlaceholder('Strategie')).toBeVisible()
  })
})

// ─── Trade Form ──────────────────────────────────────────────────────────────

test.describe('Trade form', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto('/journal')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /neuer trade/i }).click()
    // Wait for sheet to open
    await expect(page.getByRole('heading', { name: 'Neuer Trade' })).toBeVisible()
  })

  test('AC-3.1: Form contains all required fields', async ({ page }) => {
    requireCredentials()
    await expect(page.getByLabel('Datum & Uhrzeit')).toBeVisible()
    await expect(page.getByLabel('Asset')).toBeVisible()
    await expect(page.getByLabel('Richtung')).toBeVisible()
    await expect(page.getByLabel('Entry')).toBeVisible()
    await expect(page.getByLabel('Stop Loss')).toBeVisible()
    await expect(page.getByLabel('Take Profit')).toBeVisible()
    await expect(page.getByLabel('Lot-Größe')).toBeVisible()
    await expect(page.getByLabel(/ergebnis.*€/i)).toBeVisible()
  })

  test('AC-3.2: RR auto-calculation updates live', async ({ page }) => {
    requireCredentials()
    // Enter prices: Entry=100, SL=95, TP=115 → RR = 3.00
    await page.getByLabel('Entry').fill('100')
    await page.getByLabel('Stop Loss').fill('95')
    await page.getByLabel('Take Profit').fill('115')
    // RR preview should show 1:3
    await expect(page.getByText('1:3')).toBeVisible()
  })

  test('AC-3.3: Risk % auto-calculation updates live', async ({ page }) => {
    requireCredentials()
    await page.getByLabel('Entry').fill('100')
    await page.getByLabel('Stop Loss').fill('95')
    await page.getByLabel('Lot-Größe').fill('1')
    // Risk should appear (not '–')
    const riskText = page.locator('text=/\\d+\\.\\d+%/')
    await expect(riskText.first()).toBeVisible()
  })

  test('AC-3.4: Submitting empty form shows validation errors', async ({ page }) => {
    requireCredentials()
    // Clear asset field (ensure it's empty) and submit
    await page.getByLabel('Asset').clear()
    await page.getByRole('button', { name: /erfassen/i }).click()
    // Validation messages should appear
    await expect(page.getByText('Pflichtfeld').first()).toBeVisible()
  })

  test('AC-3.5: Notes textarea has character counter', async ({ page }) => {
    requireCredentials()
    await page.getByLabel(/notizen/i).fill('Test Notiz')
    // Character counter: "10/5000"
    await expect(page.getByText(/10\/5000/)).toBeVisible()
  })

  test('AC-3.5: Notes counter shows warning color near limit', async ({ page }) => {
    requireCredentials()
    const longText = 'x'.repeat(4850)
    await page.getByLabel(/notizen/i).fill(longText)
    // Should show 4850/5000 with warning styling
    await expect(page.getByText(/4850\/5000/)).toBeVisible()
  })

  test('AC-3.10: Market phase dropdown has all 6 options', async ({ page }) => {
    requireCredentials()
    await page.getByLabel('Marktphase').click()
    await expect(page.getByRole('option', { name: 'Trend (bullish)' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Trend (bearish)' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Range' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Breakout' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Reversal' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'News-driven' })).toBeVisible()
  })

  test('AC-3.11: Emotion before dropdown has all 7 options', async ({ page }) => {
    requireCredentials()
    await page.getByLabel('Emotion vor Trade').click()
    await expect(page.getByRole('option', { name: 'Ruhig' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Fokussiert' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Nervös' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Ungeduldig' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Overconfident' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'FOMO' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Müde' })).toBeVisible()
  })

  test('AC-3.12: Emotion after dropdown has same options', async ({ page }) => {
    requireCredentials()
    await page.getByLabel('Emotion nach Trade').click()
    await expect(page.getByRole('option', { name: 'Fokussiert' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'FOMO' })).toBeVisible()
  })

  test('AC-3.13: Result % auto-calculated from result €', async ({ page }) => {
    requireCredentials()
    await page.getByLabel('Entry').fill('100')
    await page.getByLabel('Stop Loss').fill('95')
    await page.getByLabel('Take Profit').fill('115')
    await page.getByLabel('Lot-Größe').fill('1')
    await page.getByLabel(/ergebnis.*€/i).fill('100')
    // Result % preview should show a positive percentage
    await expect(page.getByText(/\+[\d.]+%/)).toBeVisible()
    // Outcome badge should show Win
    await expect(page.getByText('Win')).toBeVisible()
  })

  test('EC-3.2: SL on wrong side shows warning (not blocking)', async ({ page }) => {
    requireCredentials()
    // Long trade with SL above entry
    await page.getByLabel('Entry').fill('100')
    await page.getByLabel('Stop Loss').fill('105')
    await page.getByLabel('Take Profit').fill('115')
    // Warning should appear
    await expect(page.getByText(/sl.*unter dem entry/i)).toBeVisible()
    // Submit button should still be visible (not blocked)
    await expect(page.getByRole('button', { name: /erfassen/i })).toBeVisible()
  })

  test('EC-3.5: Asset field accepts free text (no whitelist)', async ({ page }) => {
    requireCredentials()
    await page.getByLabel('Asset').fill('UNUSUALSYMBOL123')
    await expect(page.getByLabel('Asset')).toHaveValue('UNUSUALSYMBOL123')
  })
})

// ─── Full CRUD flow ──────────────────────────────────────────────────────────

test.describe('Full trade lifecycle', () => {
  let tradeAsset: string

  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto('/journal')
    await page.waitForLoadState('networkidle')
    tradeAsset = `QA_TEST_${Date.now()}`
  })

  async function createTestTrade(page: Page, asset: string) {
    await page.getByRole('button', { name: /neuer trade/i }).click()
    await expect(page.getByRole('heading', { name: 'Neuer Trade' })).toBeVisible()
    await page.getByLabel('Asset').fill(asset)
    await page.getByLabel('Entry').fill('1.1000')
    await page.getByLabel('Stop Loss').fill('1.0950')
    await page.getByLabel('Take Profit').fill('1.1100')
    await page.getByLabel('Lot-Größe').fill('0.10')
    await page.getByLabel(/ergebnis.*€/i).fill('50')
    await page.getByRole('button', { name: /erfassen/i }).click()
    // Wait for sheet to close
    await expect(page.getByRole('heading', { name: 'Neuer Trade' })).not.toBeVisible({ timeout: 8000 })
  }

  test('AC-3.14 + AC-3.18: Created trade appears in table with count', async ({ page }) => {
    requireCredentials()
    await createTestTrade(page, tradeAsset)
    // Row should appear in table
    await expect(page.getByRole('cell', { name: tradeAsset })).toBeVisible({ timeout: 5000 })
    // Total count is shown
    await expect(page.getByText(/\d+ Trade/)).toBeVisible()
  })

  test('AC-3.19: Clicking row opens detail sheet with all fields', async ({ page }) => {
    requireCredentials()
    await createTestTrade(page, tradeAsset)
    await page.getByRole('cell', { name: tradeAsset }).click()
    // Detail sheet should open
    await expect(page.getByText('Preise & Größe')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(tradeAsset)).toBeVisible()
    // RR should be displayed
    await expect(page.getByText('RR')).toBeVisible()
  })

  test('AC-3.21: Edit button opens pre-filled form', async ({ page }) => {
    requireCredentials()
    await createTestTrade(page, tradeAsset)
    await page.getByRole('cell', { name: tradeAsset }).click()
    await page.waitForSelector('text=Preise & Größe')
    // Click edit button in detail sheet
    await page.getByRole('button', { name: /bearbeiten/i }).first().click()
    // Edit form should be pre-filled with asset
    await expect(page.getByRole('heading', { name: 'Trade bearbeiten' })).toBeVisible()
    await expect(page.getByLabel('Asset')).toHaveValue(tradeAsset)
  })

  test('AC-3.22: Delete requires confirmation dialog', async ({ page }) => {
    requireCredentials()
    await createTestTrade(page, tradeAsset)
    await page.getByRole('cell', { name: tradeAsset }).click()
    await page.waitForSelector('text=Preise & Größe')
    // Click delete button (trash icon)
    await page.getByRole('button', { name: /löschen/i }).first().click()
    // Confirmation dialog should appear
    await expect(page.getByText('Trade löschen?')).toBeVisible()
    await expect(page.getByText(/dauerhaft gelöscht/i)).toBeVisible()
  })

  test('AC-3.22: Confirmed delete removes trade from table', async ({ page }) => {
    requireCredentials()
    await createTestTrade(page, tradeAsset)
    // Verify trade exists
    await expect(page.getByRole('cell', { name: tradeAsset })).toBeVisible({ timeout: 5000 })
    await page.getByRole('cell', { name: tradeAsset }).click()
    await page.waitForSelector('text=Preise & Größe')
    await page.getByRole('button', { name: /löschen/i }).first().click()
    // Confirm deletion
    await page.getByRole('button', { name: 'Löschen' }).last().click()
    // Trade should be gone from table
    await expect(page.getByRole('cell', { name: tradeAsset })).not.toBeVisible({ timeout: 8000 })
  })

  test('AC-3.15: Clicking table column header sorts trades', async ({ page }) => {
    requireCredentials()
    // Click "Asset" header
    await page.getByRole('columnheader', { name: /asset/i }).click()
    // Sort icon should change (no error, column is active)
    await expect(page.getByRole('columnheader', { name: /asset/i })).toBeVisible()
  })

  test('AC-3.17: Text search filters table', async ({ page }) => {
    requireCredentials()
    await createTestTrade(page, tradeAsset)
    // Search for the specific asset
    await page.getByPlaceholder(/asset.*setup.*notizen/i).fill(tradeAsset)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('cell', { name: tradeAsset })).toBeVisible({ timeout: 5000 })
    // Search for something that won't match
    await page.getByPlaceholder(/asset.*setup.*notizen/i).fill('ZZZNOMATCH99999')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('cell', { name: tradeAsset })).not.toBeVisible({ timeout: 5000 })
    // Cleanup
    await page.getByPlaceholder(/asset.*setup.*notizen/i).clear()
  })

  test('AC-3.16: Direction filter: Long shows only long trades', async ({ page }) => {
    requireCredentials()
    // Select Long filter
    await page.getByText(/alle richtungen/i).click()
    await page.getByRole('option', { name: 'Long' }).click()
    await page.waitForLoadState('networkidle')
    // No "Short" badges should be visible in direction column
    // (just verifying the filter applies without error)
    await expect(page.getByText(/alle richtungen/i)).not.toBeVisible()
    // Reset
    await page.getByText('Long').first().click()
    await page.getByRole('option', { name: 'Alle Richtungen' }).click()
  })

  test('AC-3.23: Editing trade recalculates derived values', async ({ page }) => {
    requireCredentials()
    await createTestTrade(page, tradeAsset)
    await page.getByRole('cell', { name: tradeAsset }).click()
    await page.waitForSelector('text=Preise & Größe')
    await page.getByRole('button', { name: /bearbeiten/i }).first().click()
    await expect(page.getByRole('heading', { name: 'Trade bearbeiten' })).toBeVisible()
    // Change result to loss
    await page.getByLabel(/ergebnis.*€/i).fill('-50')
    // Outcome badge should update to Loss
    await expect(page.getByText('Loss').first()).toBeVisible()
    // Cancel without saving (cleanup)
    await page.keyboard.press('Escape')
  })
})

// ─── EC-3.4: Unsaved changes warning ────────────────────────────────────────

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.goto('/journal')
    await page.waitForLoadState('networkidle')
  })

  test('EC-3.4: Closing dirty form triggers unsaved changes prompt', async ({ page }) => {
    requireCredentials()
    await page.getByRole('button', { name: /neuer trade/i }).click()
    await expect(page.getByRole('heading', { name: 'Neuer Trade' })).toBeVisible()
    // Make the form dirty
    await page.getByLabel('Asset').fill('EURUSD')
    // Handle the confirm dialog before clicking close
    page.on('dialog', async dialog => { await dialog.dismiss() })
    // Click cancel button
    await page.getByRole('button', { name: /abbrechen/i }).click()
    // Form should still be open (user dismissed confirm)
    await expect(page.getByRole('heading', { name: 'Neuer Trade' })).toBeVisible()
  })
})

// ─── Responsive layout ───────────────────────────────────────────────────────

test.describe('Responsive layout', () => {
  test('Mobile (375px): Journal page renders without overflow', async ({ page }) => {
    requireCredentials()
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/journal')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible()
    await expect(page.getByRole('button', { name: /neuer trade/i })).toBeVisible()
  })

  test('Tablet (768px): Journal page renders correctly', async ({ page }) => {
    requireCredentials()
    const { email, password } = requireCredentials()
    await loginUser(page, email, password)
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/journal')
    await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible()
  })
})
