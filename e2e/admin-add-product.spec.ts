import { test, expect } from '@playwright/test';

test.setTimeout(120000);

const uniqueName = `TestPeptide-${Date.now()}`;

test.describe('Admin Add New Product with AI Categories', () => {
  test('should generate AI content with categories, display badges, and save to Google Sheet', async ({ page }) => {
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

    const addNewHeader = page.getByText('Add New Product');
    await addNewHeader.first().click();
    await page.waitForTimeout(500);

    const productNameInput = page.getByLabel(/product name/i).or(page.locator('input[placeholder*="product name" i]')).or(page.locator('input[placeholder*="e.g." i]'));
    await productNameInput.first().waitFor({ state: 'visible', timeout: 10000 });
    await productNameInput.first().fill(uniqueName);

    const variantInputs = page.locator('input[placeholder*="Variant" i], input[placeholder*="variant" i], input[placeholder*="name" i]');
    const priceInputs = page.locator('input[placeholder*="Price" i], input[placeholder*="price" i]');
    const stockInputs = page.locator('input[placeholder*="Stock" i], input[placeholder*="stock" i], input[placeholder*="quantity" i]');

    const variantSection = page.locator('text=Variant').first().locator('..').locator('..');
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute('placeholder') || '';
      const isVisible = await input.isVisible();
      if (!isVisible) continue;

      if (placeholder.toLowerCase().includes('variant') || placeholder.toLowerCase().includes('e.g.')) {
        const value = await input.inputValue();
        if (!value) {
          await input.fill('5mg');
          break;
        }
      }
    }

    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute('placeholder') || '';
      const type = await input.getAttribute('type') || '';
      const isVisible = await input.isVisible();
      if (!isVisible) continue;

      if (placeholder.toLowerCase().includes('price') || placeholder.includes('0.00')) {
        const value = await input.inputValue();
        if (!value) {
          await input.fill('34.99');
          break;
        }
      }
    }

    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute('placeholder') || '';
      const isVisible = await input.isVisible();
      if (!isVisible) continue;

      if (placeholder.toLowerCase().includes('stock') || placeholder.toLowerCase().includes('quantity') || placeholder === '0') {
        const value = await input.inputValue();
        if (!value || value === '0') {
          await input.fill('50');
          break;
        }
      }
    }

    const generateBtn = page.getByRole('button', { name: /Generate.*Preview|Generate/i });
    await generateBtn.first().click();

    await page.waitForTimeout(3000);

    const categoryBadges = page.locator('span.inline-flex.items-center.rounded-full');
    await categoryBadges.first().waitFor({ state: 'visible', timeout: 60000 });

    const badgeCount = await categoryBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(1);
    expect(badgeCount).toBeLessThanOrEqual(3);

    const firstCategory = await categoryBadges.first().textContent();
    expect(firstCategory).toBeTruthy();
    expect(firstCategory!.trim().length).toBeGreaterThan(2);

    const shortDesc = page.getByText(/Short Description/i);
    await expect(shortDesc).toBeVisible({ timeout: 5000 });

    const saveBtn = page.getByRole('button', { name: /Save to Google Sheet/i });
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    const successIndicator = page.locator('text=/successfully|saved|created/i').or(
      page.locator('[class*="green"]').filter({ hasText: /success|saved|created/i })
    ).or(
      page.locator('text=/Product.*saved/i')
    );
    await successIndicator.first().waitFor({ state: 'visible', timeout: 30000 });

    const successText = await successIndicator.first().textContent();
    expect(successText).toBeTruthy();
  });
});
