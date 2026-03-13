import { test, expect } from '@playwright/test';

test.setTimeout(120000);

const uniqueName = `TestPeptide${Date.now().toString().slice(-6)}`;

test.describe('Admin Add New Product with AI Categories', () => {
  test('should submit product, show AI-generated category badges, save to Google Sheet, and verify product page', async ({ page }) => {
    await page.goto('/admin');

    const goToLogin = page.getByRole('button', { name: /Go to Login/i });
    if (await goToLogin.isVisible({ timeout: 5000 }).catch(() => false)) {
      await goToLogin.click();
    }

    try {
      await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    } catch {
      await page.goto('/admin/login');
      await page.waitForLoadState('networkidle');
    }

    await page.locator('#login-email').fill('admin@test.com');
    await page.locator('#login-password').fill('admin');
    await page.getByRole('button', { name: /Login/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');

    const addNewHeader = page.getByText('Add New Product').first();
    await addNewHeader.click();
    await page.waitForTimeout(500);

    const productNameInput = page.locator('#product-name');
    await productNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await productNameInput.fill(uniqueName);

    await page.locator('input[placeholder="e.g. 5mg"]').first().fill('5mg');
    await page.locator('input[placeholder="0.00"]').first().fill('29.99');
    await page.locator('input[placeholder="0"]').first().fill('100');

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

    await expect(page.getByText('Short Description')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'e2e/screenshots/categories-preview.png', fullPage: true });

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

    await page.screenshot({ path: 'e2e/screenshots/save-success.png', fullPage: true });

    const href = await viewLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('/peptides/');

    await page.goto(href!);
    await page.waitForLoadState('networkidle');

    const ageVerifyBtn = page.getByRole('button', { name: /I am 21/i });
    if (await ageVerifyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ageVerifyBtn.click();
      await page.waitForTimeout(500);
    }

    const productTitle = page.getByText(uniqueName, { exact: false });
    await expect(productTitle.first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'e2e/screenshots/product-page.png', fullPage: true });
  });
});
