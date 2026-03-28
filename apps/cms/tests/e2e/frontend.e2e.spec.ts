import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, _testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async () => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/TZBlog CMS/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Payload admin is ready to become the content control center.')
  })
})
