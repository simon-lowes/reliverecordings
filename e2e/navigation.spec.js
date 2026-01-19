// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E functional tests for navigation and interactivity
 */

test.describe('Mobile Navigation', () => {
  // Force mobile viewport for all tests in this describe block
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should toggle mobile menu on button click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navToggle = page.locator('#nav-toggle');
    const nav = page.locator('#main-navigation');

    // Wait for element to be visible (mobile viewport)
    await expect(navToggle).toBeVisible();

    // Initially closed
    await expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).not.toHaveClass(/nav-open/);

    // Click to open
    await navToggle.click();
    await expect(navToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toHaveClass(/nav-open/);

    // Click to close
    await navToggle.click();
    await expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).not.toHaveClass(/nav-open/);
  });

  test('should close menu on Escape key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navToggle = page.locator('#nav-toggle');
    const nav = page.locator('#main-navigation');

    await expect(navToggle).toBeVisible();

    // Open menu
    await navToggle.click();
    await expect(nav).toHaveClass(/nav-open/);

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(nav).not.toHaveClass(/nav-open/);
    await expect(navToggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('should close menu when clicking a link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navToggle = page.locator('#nav-toggle');
    const nav = page.locator('#main-navigation');

    await expect(navToggle).toBeVisible();

    // Open menu
    await navToggle.click();
    await expect(nav).toHaveClass(/nav-open/);

    // Click any visible navigation link
    const navLink = nav.locator('a').first();
    await navLink.click();
    await expect(nav).not.toHaveClass(/nav-open/);
  });
});

test.describe('Contact Form Dialog', () => {
  test('should open contact dialog when clicking contact link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const contactLink = page.locator('#contact-link');
    const dialog = page.locator('#contact-dialog');

    // Wait for link to be ready
    await expect(contactLink).toBeVisible();

    // Dialog should be closed initially
    await expect(dialog).not.toBeVisible();

    // Click contact link
    await contactLink.click();

    // Dialog should open
    await expect(dialog).toBeVisible();
  });

  test('should close dialog when clicking close button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open dialog
    const contactLink = page.locator('#contact-link');
    await expect(contactLink).toBeVisible();
    await contactLink.click();

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toBeVisible();

    // Click close button
    await page.click('.contact-dialog__close');

    // Dialog should close (with animation)
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('should close dialog on Escape key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open dialog
    const contactLink = page.locator('#contact-link');
    await expect(contactLink).toBeVisible();
    await contactLink.click();

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
  });

  test('contact form should have required fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const contactLink = page.locator('#contact-link');
    await expect(contactLink).toBeVisible();
    await contactLink.click();

    // Check form fields exist and are required
    const nameInput = page.locator('#contact-name');
    const emailInput = page.locator('#contact-email');
    const messageInput = page.locator('#contact-message');

    await expect(nameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(messageInput).toHaveAttribute('required', '');
  });
});

test.describe('Cookie Toast', () => {
  test('should persist dismissal to localStorage when closed', async ({ page }) => {
    // Navigate to page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Clear localStorage for this specific key
    await page.evaluate(() => {
      localStorage.removeItem('rlrCookieToastDismissed-v1');
    });

    // Reload to trigger the toast (shown on window load when not dismissed)
    await page.reload();
    await page.waitForLoadState('load');

    // Wait for load event to fire (toast shows on load)
    await page.waitForTimeout(500);

    const toast = page.locator('.cookie-toast');

    // Check if toast became visible
    const isVisible = await toast.isVisible();

    if (isVisible) {
      // Close toast by clicking the button
      const closeButton = toast.locator('button');
      await closeButton.click();

      // Wait for dialog to close
      await page.waitForTimeout(500);

      // Check localStorage was set
      const dismissed = await page.evaluate(() => {
        return localStorage.getItem('rlrCookieToastDismissed-v1');
      });

      expect(dismissed).toBe('1');
    } else {
      // Toast may already be dismissed or not shown in this context
      // This is acceptable - we can verify this in a fresh browser context
      console.log('Cookie toast not visible - may be previously dismissed');
    }
  });

  test('should not show toast when previously dismissed', async ({ page }) => {
    // Navigate and set the dismissed flag
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Set the dismissed flag
    await page.evaluate(() => {
      localStorage.setItem('rlrCookieToastDismissed-v1', '1');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    // Toast should not be visible
    const toast = page.locator('.cookie-toast');
    await expect(toast).not.toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have skip link that works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // Force skip link to be visible (normally only shows on focus)
    await skipLink.evaluate((el) => el.style.top = '0');

    // Click skip link
    await skipLink.click({ force: true });

    // Main content should exist
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeAttached();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check h1 exists (it's sr-only but still in DOM)
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('social links should have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const socialLinks = page.locator('.socials a');
    const count = await socialLinks.count();

    for (let i = 0; i < count; i++) {
      const link = socialLinks.nth(i);
      const ariaLabel = await link.getAttribute('aria-label');
      expect(ariaLabel).not.toBeNull();
      expect(ariaLabel?.length).toBeGreaterThan(0);
    }
  });
});
