import { test, expect } from '@playwright/test'

const targetUrl = process.env.ENVIRONMENT_URL ?? 'https://planetlion.com'

test('planetlion.com homepage loads with key content', async ({ page }) => {
  const response = await page.goto(targetUrl)
  expect(response?.status()).toBe(200)

  // Hero section
  await expect(page.getByRole('heading', { level: 1, name: /Your AI Employee for growing your business/i })).toBeVisible()

  // Navigation buttons (scoped to nav)
  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('button', { name: 'How it works' })).toBeVisible()
  await expect(nav.getByRole('button', { name: 'AI Employees' })).toBeVisible()
  await expect(nav.getByRole('button', { name: 'Pricing' })).toBeVisible()

  // How it works section
  await expect(page.getByRole('heading', { level: 2, name: /How it works/i })).toBeVisible()

  // AI Employees section
  await expect(page.getByRole('heading', { level: 2, name: /Meet your AI employees/i })).toBeVisible()

  // Pricing section with all four plans
  await expect(page.getByRole('heading', { level: 2, name: /Simple, honest pricing/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Free' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Starter' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Growth' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Pro' })).toBeVisible()

  // FAQ section
  await expect(page.getByRole('heading', { level: 2, name: /Frequently asked questions/i })).toBeVisible()

  // CTA button
  await expect(page.getByRole('button', { name: /Get Your Free AI Audit/i }).first()).toBeVisible()
})
