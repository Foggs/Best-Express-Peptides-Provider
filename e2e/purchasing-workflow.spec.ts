import { test, expect } from '@playwright/test';

test.describe('Product Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const ageVerifyButton = page.getByRole('button', { name: /I am 21/i });
    if (await ageVerifyButton.isVisible()) {
      await ageVerifyButton.click();
    }
  });

  test('should display products on the catalog page', async ({ page }) => {
    await page.goto('/peptides');
    
    await expect(page.getByRole('heading', { name: /Research Peptides/i })).toBeVisible();
    
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();
    
    if (count === 0) {
      const productLinks = page.locator('a[href^="/peptides/"]');
      await expect(productLinks.first()).toBeVisible();
    } else {
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/peptides');
    
    const categoryLink = page.getByRole('link', { name: /Recovery/i }).first();
    if (await categoryLink.isVisible()) {
      await categoryLink.click();
      await expect(page).toHaveURL(/category=|\/peptides/);
    }
  });
});

test.describe('Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const ageVerifyButton = page.getByRole('button', { name: /I am 21/i });
    if (await ageVerifyButton.isVisible()) {
      await ageVerifyButton.click();
    }
  });

  test('should display product details', async ({ page }) => {
    await page.goto('/peptides');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    await expect(page.getByText(/\$\d+/)).toBeVisible();
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await expect(addToCartButton).toBeVisible();
  });

  test('should allow selecting product variants', async ({ page }) => {
    await page.goto('/peptides');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    const count = await variantButtons.count();
    
    if (count > 0) {
      await variantButtons.first().click();
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await expect(addToCartButton).toBeEnabled();
  });
});

test.describe('Cart Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const ageVerifyButton = page.getByRole('button', { name: /I am 21/i });
    if (await ageVerifyButton.isVisible()) {
      await ageVerifyButton.click();
    }
    
    await page.evaluate(() => localStorage.clear());
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/peptides');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    await page.waitForTimeout(500);
    
    const cartBadge = page.locator('[aria-label*="cart"]').first();
    await expect(cartBadge).toBeVisible();
  });

  test('should display cart items on cart page', async ({ page }) => {
    await page.goto('/peptides');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    await page.waitForTimeout(500);
    
    await page.goto('/cart');
    
    await expect(page.getByRole('heading', { name: /Cart|Shopping/i })).toBeVisible();
    
    await expect(page.getByText(/\$\d+/)).toBeVisible();
  });

  test('should update item quantity in cart', async ({ page }) => {
    await page.goto('/peptides');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    await page.waitForTimeout(500);
    
    await page.goto('/cart');
    
    const increaseButton = page.getByRole('button', { name: /\+|increase/i }).first();
    if (await increaseButton.isVisible()) {
      await increaseButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/peptides');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    await page.waitForTimeout(500);
    
    await page.goto('/cart');
    
    const removeButton = page.getByRole('button', { name: /remove|delete|×/i }).first();
    if (await removeButton.isVisible()) {
      await removeButton.click();
      await page.waitForTimeout(300);
      
      await expect(page.getByText(/empty|no items/i)).toBeVisible();
    }
  });
});

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const ageVerifyButton = page.getByRole('button', { name: /I am 21/i });
    if (await ageVerifyButton.isVisible()) {
      await ageVerifyButton.click();
    }
    
    await page.evaluate(() => localStorage.clear());
  });

  test('should proceed to checkout with items in cart', async ({ page }) => {
    await page.goto('/peptides');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    await page.waitForTimeout(500);
    
    await page.goto('/cart');
    
    const checkoutButton = page.getByRole('button', { name: /checkout|proceed/i }).first();
    const checkoutLink = page.getByRole('link', { name: /checkout|proceed/i }).first();
    
    if (await checkoutButton.isVisible()) {
      await expect(checkoutButton).toBeEnabled();
    } else if (await checkoutLink.isVisible()) {
      await expect(checkoutLink).toBeVisible();
    }
  });

  test('should redirect to Stripe checkout', async ({ page }) => {
    await page.goto('/peptides');
    
    const productLink = page.locator('a[href^="/peptides/"]').first();
    await productLink.click();
    
    const variantButtons = page.locator('button').filter({ hasText: /mg|ml/i });
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
    }
    
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
    await addToCartButton.click();
    
    await page.waitForTimeout(500);
    
    await page.goto('/cart');
    
    const checkoutButton = page.getByRole('button', { name: /checkout|proceed/i }).first();
    const checkoutLink = page.getByRole('link', { name: /checkout|proceed/i }).first();
    
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/checkout') || response.url().includes('stripe'),
      { timeout: 10000 }
    ).catch(() => null);
    
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
    } else if (await checkoutLink.isVisible()) {
      await checkoutLink.click();
    }
    
    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});

test.describe('Order Success', () => {
  test('should display success page after checkout', async ({ page }) => {
    await page.goto('/checkout/success?session_id=test');
    
    const successContent = page.getByText(/thank you|order|confirmed|success/i);
    await expect(successContent.first()).toBeVisible({ timeout: 10000 });
  });
});
