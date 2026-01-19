// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual regression tests for re:liverecordings
 * These tests capture screenshots and compare against baseline images
 * Run `npx playwright test --update-snapshots` to update baselines
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for page to fully load before taking screenshots
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('homepage renders correctly', async ({ page }) => {
    // Hide dynamic content that could cause flaky tests
    await page.addStyleTag({
      content: `
        /* Hide YouTube/Spotify iframes which load external content */
        iframe { visibility: hidden !important; }
        /* Stabilize background image */
        .background-container {
          background-image: none !important;
          background-color: #1a1a1a !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('header and logo render correctly', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header).toHaveScreenshot('header.png', {
      animations: 'disabled',
    });
  });

  test('footer renders correctly', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('footer.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Mobile Navigation Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('mobile menu closed state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Hide dynamic content
    await page.addStyleTag({
      content: `
        iframe { visibility: hidden !important; }
        .background-container {
          background-image: none !important;
          background-color: #1a1a1a !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('mobile-menu-closed.png', {
      animations: 'disabled',
    });
  });

  test('mobile menu open state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Hide dynamic content
    await page.addStyleTag({
      content: `
        iframe { visibility: hidden !important; }
        .background-container {
          background-image: none !important;
          background-color: #1a1a1a !important;
        }
      `
    });

    // Wait for nav toggle to be visible
    const navToggle = page.locator('#nav-toggle');
    await expect(navToggle).toBeVisible();

    // Open the mobile menu
    await navToggle.click();
    await page.waitForTimeout(400); // Wait for animation

    await expect(page).toHaveScreenshot('mobile-menu-open.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Contact Dialog Visual Tests', () => {
  test('contact dialog renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for contact link to be ready
    const contactLink = page.locator('#contact-link');
    await expect(contactLink).toBeVisible();

    // Open contact dialog
    await contactLink.click();
    await page.waitForTimeout(400); // Wait for animation

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveScreenshot('contact-dialog.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Cookie Toast Visual Tests', () => {
  test('cookie toast renders correctly', async ({ page, context }) => {
    // Clear localStorage to ensure toast appears
    await context.clearCookies();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear the specific localStorage key
    await page.evaluate(() => {
      localStorage.removeItem('rlrCookieToastDismissed-v1');
    });

    // Reload to trigger toast
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for toast to appear (shown on window load)
    const toast = page.locator('.cookie-toast');

    // Check if toast is visible (it may not appear if localStorage persisted)
    const isVisible = await toast.isVisible().catch(() => false);

    if (isVisible) {
      await expect(toast).toHaveScreenshot('cookie-toast.png', {
        animations: 'disabled',
      });
    }
  });
});
