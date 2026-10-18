import { expect, test } from '@playwright/test';

test('landing page renders the primary marketing sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your AI Employee for growing your business' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How it works', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Meet your AI employees', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Frequently asked questions', exact: true })).toBeVisible();
});

test('unknown paths show the 404 page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('button', { name: /back to home/i })).toBeVisible();
});

test('audit form blocks incomplete first step and accepts valid first step', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /free ai audit/i }).first().click();
  await expect(page.getByRole('heading', { name: /find your missed revenue/i })).toBeVisible();

  const continueButton = page.getByRole('button', { name: 'Continue' });
  await expect(continueButton).toBeDisabled();

  await page.getByPlaceholder('John Smith').fill('Jane Doe');
  await page.getByPlaceholder('Smith Plumbing Co.').fill('Jane Plumbing');
  await page.getByPlaceholder('john@smithplumbing.com').fill('jane@example.com');
  await page.locator('select').selectOption({ label: 'Plumbing' });
  await expect(continueButton).toBeEnabled();
});

test('public navigation returns home from audit page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /free ai audit/i }).first().click();
  await page.getByRole('button', { name: /workforceai/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Your AI Employee for growing your business' })).toBeVisible();
});
