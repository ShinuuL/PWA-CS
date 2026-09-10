import { test, expect } from '@playwright/test'
import { mockSignedIn } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === 'http://127.0.0.1:5174') return route.continue()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(url.pathname.endsWith('/session') ? { access_token: null, refresh_token: null, user: null } : {}),
    })
  })
})

test('login is readable on mobile with an accessible Google action', async ({ page }, testInfo) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'CoupleSpace' })).toBeVisible()
  const before = await page.locator('.login-page').evaluate(element => ({
    html: element.outerHTML,
    display: getComputedStyle(element).display,
    padding: getComputedStyle(element).padding,
    width: getComputedStyle(element).width,
    font: getComputedStyle(element).fontFamily,
  }))
  await testInfo.attach('login-dom-css', { body: JSON.stringify(before, null, 2), contentType: 'application/json' })
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true })
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('unknown routes provide navigation instead of a blank page', async ({ page }) => {
  await page.goto('/rota-inexistente')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('cancelled Google callback provides a retry action', async ({ page }) => {
  await page.goto('/auth/callback?error=access_denied')
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('link', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
})

test('settings and pairing layout stay usable on mobile', async ({ page }, testInfo) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await mockSignedIn(page)
  await page.goto('/settings')
  await expect(page.locator('.settings-page')).toBeVisible()
  await testInfo.attach('settings-dom-css', {
    body: JSON.stringify(await page.locator('.settings-page').evaluate(element => ({ html: element.outerHTML, width: getComputedStyle(element).width, padding: getComputedStyle(element).padding }))),
    contentType: 'application/json',
  })
  await page.screenshot({ path: testInfo.outputPath('settings.png'), fullPage: true })
  await page.locator('.header-menu').click()
  await expect(page.locator('.drawer')).toBeVisible()
  await testInfo.attach('drawer-dom-css', { body: await page.locator('.drawer').evaluate(element => JSON.stringify({ html: element.outerHTML, position: getComputedStyle(element).position, zIndex: getComputedStyle(element).zIndex })), contentType: 'application/json' })
  await page.goto('/home')
  await expect(page.locator('.pairing-gate')).toBeVisible()
  await testInfo.attach('pairing-dom', { body: await page.locator('.pairing-gate').evaluate(element => element.outerHTML), contentType: 'text/html' })
  expect(pageErrors).toEqual([])
})
