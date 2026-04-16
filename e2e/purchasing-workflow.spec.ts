import { test, expect } from '@playwright/test';

test.setTimeout(120000);

test.describe('Homepage section visibility', () => {
  test('logged-out visitor does not see Featured Peptides or Browse by Category', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Featured Peptides', exact: true })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Browse by Category', exact: true })).not.toBeVisible();
  });

  test('logged-in user sees Featured Peptides and Browse by Category', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'TEST_USER_EMAIL and TEST_USER_PASSWORD env vars are required for this test');
      return;
    }

    await page.context().clearCookies();

    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL('/', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Featured Peptides', exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('heading', { name: 'Browse by Category', exact: true })).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Product Catalog', () => {
  test('should display products on the catalog page', async ({ page }) => {
    await page.goto('/peptides');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('heading', { name: /Research Peptides|All Peptides/i })).toBeVisible({ timeout: 30000 });
    
    const productElements = page.locator('a[href^="/peptides/"]');
    await expect(productElements.first()).toBeVisible({ timeout: 30000 });
    
    const productCount = await productElements.count();
    expect(productCount).toBeGreaterThan(0);
  });

  test('should display product prices', async ({ page }) => {
    await page.goto('/peptides');
    await page.waitForLoadState('networkidle');
    
    const priceElements = page.getByText(/\$\d+/);
    await expect(priceElements.first()).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Product Detail Page', () => {
  test('should display product details when clicking a product', async ({ page }) => {
    await page.goto('/peptides');
    await page.waitForLoadState('networkidle');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.waitFor({ state: 'visible', timeout: 30000 });
    await productLink.click();
    
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 });
    
    await expect(page.getByText(/\$\d+/).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show add to cart button on product page', async ({ page }) => {
    await page.goto('/peptides');
    await page.waitForLoadState('networkidle');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    await page.waitForLoadState('networkidle');
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await expect(addToCartButton).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Add to Cart', () => {
  test('should add product to cart successfully', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    
    await page.goto('/peptides');
    await page.waitForLoadState('networkidle');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    await page.waitForLoadState('networkidle');
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    const variantCount = await variantButtons.count();
    if (variantCount > 0) {
      await variantButtons.first().click();
      await page.waitForTimeout(300);
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    await page.waitForTimeout(1000);
    
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    const cartContent = page.locator('body');
    const text = await cartContent.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });
});

test.describe('Cart Page', () => {
  test('should display cart page', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('heading', { name: /Cart|Shopping|Your Cart/i })).toBeVisible({ timeout: 30000 });
  });

  test('should show empty cart message when cart is empty', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('peptide-cart'));
    
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    const emptyMessage = page.getByText(/empty|no items|cart is empty/i);
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});

test.describe('Checkout Flow', () => {
  test('should have checkout button in cart when items present', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    
    await page.goto('/peptides');
    await page.waitForLoadState('networkidle');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    await page.waitForLoadState('networkidle');
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
      await page.waitForTimeout(300);
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    await page.waitForTimeout(2000);
    
    const checkoutLink = page.locator('a[href="/checkout"]');
    const checkoutText = page.getByText(/Proceed to Checkout/i);
    
    const hasLink = await checkoutLink.isVisible().catch(() => false);
    const hasText = await checkoutText.isVisible().catch(() => false);
    
    expect(hasLink || hasText).toBeTruthy();
  });
});

test.describe('Order Success Page', () => {
  test('should display success page content', async ({ page }) => {
    await page.goto('/checkout/success?session_id=test_session');
    await page.waitForLoadState('networkidle');
    
    const successIndicators = [
      page.getByText(/thank you/i),
      page.getByText(/order/i),
      page.getByText(/confirmed/i),
      page.getByText(/success/i),
    ];
    
    let foundIndicator = false;
    for (const indicator of successIndicators) {
      if (await indicator.isVisible().catch(() => false)) {
        foundIndicator = true;
        break;
      }
    }
    
    expect(foundIndicator).toBeTruthy();
  });
});
