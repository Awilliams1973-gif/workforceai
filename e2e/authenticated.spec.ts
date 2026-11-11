import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const authenticated = Boolean(email && password);
const allowStagingWrites = process.env.E2E_ALLOW_STAGING_WRITES === 'true';
const stagingProjectRef = 'bltkvkocevpcefwuppje';

test.describe('authenticated dashboard smoke tests', () => {
  test.skip(!authenticated, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated tests.');

  test.beforeEach(async ({ page }) => {
    let authRequestUrl = '';
    page.on('request', (request) => {
      if (request.url().includes('/auth/v1/token')) {
        authRequestUrl = request.url();
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    await page.getByPlaceholder('john@smithplumbing.com').fill(email!);
    await page.getByPlaceholder('Your password').fill(password!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
    await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    expect(authRequestUrl, 'Authenticated E2E tests must use the documented staging Supabase project.')
      .toContain(`${stagingProjectRef}.supabase.co`);
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

  test('creates, updates, and removes a synthetic lead', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!allowStagingWrites, 'Set E2E_ALLOW_STAGING_WRITES=true to enable staging-only record changes.');

    const runId = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const leadName = `E2E Test Lead ${runId}`;
    const followUpDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await page.getByRole('button', { name: 'Leads', exact: true }).click();
    const staleSyntheticLeads = page
      .getByRole('row')
      .filter({ hasText: 'E2E Test Lead' })
      .filter({ hasText: 'E2E synthetic service' });
    for (let index = await staleSyntheticLeads.count() - 1; index >= 0; index -= 1) {
      await staleSyntheticLeads.nth(index).click();
      await page.getByRole('button', { name: 'Delete lead', exact: true }).click();
    }

    await page.getByRole('button', { name: 'Add Lead' }).first().click();
    await page.getByPlaceholder('John Smith').fill(leadName);
    await page.getByPlaceholder('(555) 123-4567').fill('(202) 555-0142');
    await page.getByPlaceholder('john@email.com').fill(`e2e-${runId}@example.invalid`);
    await page.getByPlaceholder('Emergency leak repair').fill('E2E synthetic service');
    await page.getByPlaceholder('Any details about this lead...').fill(`Synthetic E2E record ${runId}`);
    await page.getByRole('button', { name: 'Add Lead' }).last().click();

    const leadRow = page.getByRole('row').filter({ hasText: leadName });
    await expect(leadRow).toBeVisible();

    try {
      await leadRow.click();
      await page.getByRole('button', { name: 'contacted', exact: true }).click();
      await expect(leadRow.getByText('contacted', { exact: true })).toBeVisible();
      await page.getByLabel('Next follow-up date').fill(followUpDate);
      await page.getByRole('button', { name: 'Save date', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Save date', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: 'Close lead details' }).click();

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible();
      await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Leads', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Leads', exact: true }).click();
      const persistedLeadRow = page.getByRole('row').filter({ hasText: leadName });
      await expect(persistedLeadRow).toBeVisible();
      await persistedLeadRow.click();
      await expect(page.getByLabel('Next follow-up date')).toHaveValue(followUpDate);
      await page.getByRole('button', { name: 'Clear date', exact: true }).click();
      await expect(page.getByText('Not scheduled')).toBeVisible();
    } finally {
      if (await leadRow.count()) {
        const deleteButton = page.getByRole('button', { name: 'Delete lead', exact: true });
        if (!(await deleteButton.isVisible())) {
          await leadRow.click();
        }
        await deleteButton.click();
        await expect(leadRow).toHaveCount(0);
      }
    }
  });

  test('rejects invalid phone numbers and duplicate lead emails', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!allowStagingWrites, 'Set E2E_ALLOW_STAGING_WRITES=true to enable staging-only record changes.');

    const runId = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const leadName = `E2E Test Lead ${runId}`;
    const leadEmail = `e2e-dup-${runId}@example.invalid`;
    const leadRow = page.getByRole('row').filter({ hasText: leadName });

    const fillLeadForm = async (phone: string) => {
      await page.getByPlaceholder('John Smith').fill(leadName);
      await page.getByPlaceholder('(555) 123-4567').fill(phone);
      await page.getByPlaceholder('john@email.com').fill(leadEmail);
      await page.getByPlaceholder('Emergency leak repair').fill('E2E synthetic service');
    };

    await page.getByRole('button', { name: 'Leads', exact: true }).click();
    await page.getByRole('button', { name: 'Add Lead' }).first().click();
    await fillLeadForm('123');
    await page.getByRole('button', { name: 'Add Lead' }).last().click();
    await expect(page.getByRole('alert')).toContainText('Invalid phone format');
    await expect(leadRow).toHaveCount(0);

    try {
      await page.getByPlaceholder('(555) 123-4567').fill('(202) 555-0144');
      await page.getByRole('button', { name: 'Add Lead' }).last().click();
      await expect(leadRow).toBeVisible();

      await page.getByRole('button', { name: 'Add Lead' }).first().click();
      await fillLeadForm('(202) 555-0144');
      await page.getByRole('button', { name: 'Add Lead' }).last().click();
      await expect(page.getByRole('alert')).toContainText('already exists');
      await expect(leadRow).toHaveCount(1);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    } finally {
      if (await leadRow.count()) {
        await leadRow.first().click();
        await page.getByRole('button', { name: 'Delete lead', exact: true }).click();
        await expect(leadRow).toHaveCount(0);
      }
    }
  });

  test('creates, updates, cancels, and removes a synthetic appointment', async ({ page }) => {
    test.skip(!allowStagingWrites, 'Set E2E_ALLOW_STAGING_WRITES=true to enable staging-only record changes.');

    const runId = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const customerName = `E2E Test Appointment ${runId}`;
    const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await page.getByRole('button', { name: 'Appointments', exact: true }).click();
    await page.getByRole('button', { name: 'Add Appointment' }).first().click();
    await page.getByPlaceholder('John Smith').fill(customerName);
    await page.getByPlaceholder('(555) 123-4567').fill('(202) 555-0143');
    await page.getByPlaceholder('Emergency leak repair').fill('E2E synthetic service');
    await page.locator('input[type="date"]').fill(appointmentDate);
    await page.locator('input[type="time"]').fill('10:00');
    await page.getByPlaceholder('Any details about this appointment...').fill(`Synthetic E2E record ${runId}`);
    await page.getByRole('button', { name: 'Add Appointment' }).last().click();

    const appointmentCard = page.getByRole('button').filter({ hasText: customerName }).first();
    const appointmentModal = page
      .locator('.fixed.inset-0')
      .filter({ has: page.getByRole('heading', { name: customerName }) });
    try {
      await expect(appointmentCard).toBeVisible();
      await appointmentCard.click();
      await page.getByRole('button', { name: 'Confirm', exact: true }).click();
      await expect(page.getByText('confirmed', { exact: true }).first()).toBeVisible();
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(page.getByText('cancelled', { exact: true }).first()).toBeVisible();
    } finally {
      if (await appointmentCard.count()) {
        if (!(await appointmentModal.isVisible())) {
          await appointmentCard.click();
        }
        page.once('dialog', (dialog) => dialog.accept());
        await appointmentModal.getByRole('button', { name: 'Delete appointment', exact: true }).click();
        await expect(appointmentCard).toHaveCount(0);
      }
    }
  });
});
