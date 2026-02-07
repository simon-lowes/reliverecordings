// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E tests for the contact form modal
 * Tests form opening, field interaction, validation, and closing
 * Does NOT submit the form (Netlify form handler)
 */

test.describe('Contact Form - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open contact dialog when clicking contact link', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await expect(contactLink).toBeVisible();

    await contactLink.click();

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toHaveClass(/is-open/);
    await expect(dialog).toHaveAttribute('aria-hidden', 'false');
  });

  test('should set focus inside the form after opening', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();

    // main.js calls form.querySelector('input')?.focus() after 100ms delay.
    // Note: the first input found is the honeypot field (sr-only), not
    // the visible name field. Verify focus moves into the form area.
    await page.waitForTimeout(200);

    const activeTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeTag).toBe('INPUT');
  });

  test('should fill in all form fields', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();
    await page.waitForTimeout(200);

    const nameInput = page.locator('#contact-name');
    const emailInput = page.locator('#contact-email');
    const messageInput = page.locator('#contact-message');

    await nameInput.fill('John Doe');
    await emailInput.fill('john@example.com');
    await messageInput.fill('I am interested in your recording services.');

    await expect(nameInput).toHaveValue('John Doe');
    await expect(emailInput).toHaveValue('john@example.com');
    await expect(messageInput).toHaveValue('I am interested in your recording services.');
  });

  test('should show validation error for empty required fields on submit attempt', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();
    await page.waitForTimeout(200);

    // Try to submit without filling fields
    const submitBtn = page.locator('.contact-form__submit');
    await submitBtn.click();

    // Browser should show validation — form should still be visible
    const form = page.locator('#contact-form');
    await expect(form).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();
    await page.waitForTimeout(200);

    const nameInput = page.locator('#contact-name');
    const emailInput = page.locator('#contact-email');
    const messageInput = page.locator('#contact-message');

    await nameInput.fill('John Doe');
    await emailInput.fill('not-an-email');
    await messageInput.fill('Test message');

    // Try to submit — browser validation should prevent it
    const submitBtn = page.locator('.contact-form__submit');
    await submitBtn.click();

    // Email field should be invalid (CSS :invalid pseudo-class)
    const isInvalid = await emailInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test('should close dialog when close button is clicked', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toHaveClass(/is-open/);

    const closeBtn = page.locator('.contact-dialog__close');
    await closeBtn.click();

    await expect(dialog).not.toHaveClass(/is-open/);
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
  });

  test('should close dialog on Escape key', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toHaveClass(/is-open/);

    await page.keyboard.press('Escape');

    await expect(dialog).not.toHaveClass(/is-open/);
  });

  test('should close dialog when clicking backdrop', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toHaveClass(/is-open/);

    // Click the backdrop area — use position to click outside the content panel
    const backdrop = page.locator('.contact-dialog__backdrop');
    await backdrop.click({ position: { x: 10, y: 10 }, force: true });

    await expect(dialog).not.toHaveClass(/is-open/, { timeout: 2000 });
  });

  test('should reset form when dialog is closed and reopened', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();
    await page.waitForTimeout(200);

    // Fill in fields
    const nameInput = page.locator('#contact-name');
    await nameInput.fill('John Doe');

    // Close
    const closeBtn = page.locator('.contact-dialog__close');
    await closeBtn.click();

    // Reopen
    await contactLink.click();
    await page.waitForTimeout(200);

    // Field should be cleared
    await expect(nameInput).toHaveValue('');
  });

  test('should prevent background scroll when dialog is open', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();

    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');

    // Close and verify scroll is restored
    await page.keyboard.press('Escape');

    const overflowAfter = await page.evaluate(() => document.body.style.overflow);
    expect(overflowAfter).toBe('');
  });

  test('form should have honeypot field for spam protection', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();

    // Honeypot field should exist but be hidden (sr-only class on parent)
    const honeypot = page.locator('input[name="bot-field"]');
    await expect(honeypot).toBeAttached();

    // Parent should have sr-only class that hides it from sighted users
    const parentHasSrOnly = await honeypot.evaluate((el) => {
      const parent = el.closest('.sr-only');
      return parent !== null;
    });
    expect(parentHasSrOnly).toBe(true);
  });

  test('form should have hidden form-name field for Netlify', async ({ page }) => {
    const contactLink = page.locator('#contact-link');
    await contactLink.click();

    const formName = page.locator('input[name="form-name"]');
    await expect(formName).toHaveAttribute('type', 'hidden');
    await expect(formName).toHaveValue('contact');
  });
});

test.describe('Contact Form - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open contact dialog via mobile nav', async ({ page }) => {
    // Open mobile nav first
    const navToggle = page.locator('#nav-toggle');
    await expect(navToggle).toBeVisible();
    await navToggle.click();

    // Wait for menu animation
    await page.waitForTimeout(400);

    // Click contact link
    const contactLink = page.locator('#contact-link');
    await contactLink.click();

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toHaveClass(/is-open/);
  });

  test('should render form correctly on mobile viewport', async ({ page }) => {
    // Open mobile nav and then contact
    const navToggle = page.locator('#nav-toggle');
    await navToggle.click();
    await page.waitForTimeout(400);

    const contactLink = page.locator('#contact-link');
    await contactLink.click();
    await page.waitForTimeout(200);

    // All form fields should be visible
    await expect(page.locator('#contact-name')).toBeVisible();
    await expect(page.locator('#contact-email')).toBeVisible();
    await expect(page.locator('#contact-message')).toBeVisible();
    await expect(page.locator('.contact-form__submit')).toBeVisible();
  });
});
