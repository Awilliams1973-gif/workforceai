import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const authenticated = Boolean(email && password);

test.describe('authenticated dashboard smoke tests', () => {
  test.skip(!authenticated, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated tests.');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    await page.getByPlaceholder('john@smithplumbing.com').fill(email!);
    await page.getByPlaceholder('Your password').fill(password!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('opens the leads and appointments views', async ({ page }) => {
    await page.getByRole('button', { name: 'Leads', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Leads', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Appointments', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Appointments', exact: true })).toBeVisible();
  });

  test('opens conversations and AI receptionist views', async ({ page }) => {
    await page.getByRole('button', { name: 'Conversations', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Conversations', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'AI Receptionist', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'AI Receptionist', exact: true })).toBeVisible();
  });
});
