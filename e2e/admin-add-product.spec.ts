import { test, expect } from '@playwright/test';

test.setTimeout(120000);

const uniqueName = `TestPeptide${Date.now().toString().slice(-6)}`;

test.describe('Admin Add New Product with AI Categories', () => {
  test('should submit product, show AI-generated category badges, and save to Google Sheet', async ({ page }) => {
    await page.goto('/admin');

    const goToLogin = page.getByRole('button', { name: /Go to Login/i });
    if (await goToLogin.isVisible({ timeout: 5000 }).catch(() => false)) {
      await goToLogin.click();
    }

    await page.waitForURL(/\/admin\/login/, { timeout: 10000 }).catch(() => {
      page.goto('/admin/login');
    });

    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/password/i).fill('admin');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');

    const addNewHeader = page.getByText('Add New Product').first();
    await addNewHeader.click();
    await page.waitForTimeout(500);

    const productNameInput = page.locator('#product-name');
    await productNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await productNameInput.fill(uniqueName);

    const variantNameInput = page.locator('input[placeholder="e.g. 5mg"]').first();
    await variantNameInput.fill('5mg');

    const priceInput = page.locator('input[placeholder="0.00"]').first();
    await priceInput.fill('29.99');

    const stockInput = page.locator('input[placeholder="0"]').first();
    await stockInput.fill('100');

    const submitBtn = page.getByRole('button', { name: /^Submit$/i }).first();
    await submitBtn.click();

    const categoryLabel = page.getByText('Categories', { exact: false });
    await categoryLabel.waitFor({ state: 'visible', timeout: 60000 });

    const categoryBadges = page.locator('span.inline-flex.items-center.rounded-full');
    const badgeCount = await categoryBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(1);
    expect(badgeCount).toBeLessThanOrEqual(3);

    const firstBadgeText = await categoryBadges.first().textContent();
    expect(firstBadgeText!.trim().length).toBeGreaterThan(2);

    const shortDesc = page.getByText('Short Description');
    await expect(shortDesc).toBeVisible({ timeout: 5000 });

    const saveBtn = page.getByRole('button', { name: /Save to Google Sheet/i });
    await saveBtn.scrollIntoViewIfNeeded();
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    const successMsg = page.locator('text=/saved with/i');
    await successMsg.waitFor({ state: 'visible', timeout: 30000 });

    const successText = await successMsg.textContent();
    expect(successText).toContain('saved');
    expect(successText).toContain('variant');

    const viewLink = page.getByText('View product page');
    await expect(viewLink).toBeVisible({ timeout: 5000 });
  });
});
