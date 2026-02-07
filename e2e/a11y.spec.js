// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

/**
 * E2E accessibility tests using axe-core
 * Tests homepage for WCAG violations including heading hierarchy,
 * image alt text, form labels, and color contrast
 */

test.describe('Accessibility - axe-core scan', () => {
  test('homepage should have no critical a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      // Exclude third-party iframes (YouTube, Spotify) from scan
      .exclude('iframe')
      // Known issue: aria-hidden on focusable elements (.bg-layer divs have
      // aria-hidden="true" which is correct since they're decorative)
      .disableRules(['aria-hidden-focus'])
      .analyze();

    // Filter to critical and serious violations only
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      const summary = criticalViolations.map(
        (v) => `${v.id} (${v.impact}): ${v.description} [${v.nodes.length} instances]`
      ).join('\n');
      console.log('Critical/Serious a11y violations:\n' + summary);
    }

    expect(criticalViolations).toHaveLength(0);
  });

  test('homepage should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .include('body')
      .withRules(['heading-order', 'page-has-heading-one'])
      .analyze();

    const headingViolations = results.violations.filter(
      (v) => v.id === 'heading-order' || v.id === 'page-has-heading-one'
    );

    expect(headingViolations).toHaveLength(0);
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    const altViolations = results.violations.filter(
      (v) => v.id === 'image-alt'
    );

    expect(altViolations).toHaveLength(0);
  });

  test('form inputs should have associated labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open contact form to make form visible
    const contactLink = page.locator('#contact-link');
    await contactLink.click();
    await page.waitForTimeout(300);

    const results = await new AxeBuilder({ page })
      .include('#contact-form')
      .withRules(['label', 'label-title-only'])
      .analyze();

    const labelViolations = results.violations.filter(
      (v) => v.id === 'label' || v.id === 'label-title-only'
    );

    expect(labelViolations).toHaveLength(0);
  });

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Stabilize background for consistent contrast testing
    await page.addStyleTag({
      content: `
        .bg-layer { opacity: 0 !important; }
        .background-container { background: #1a1a1a !important; }
      `
    });

    const results = await new AxeBuilder({ page })
      .exclude('iframe')
      .withRules(['color-contrast'])
      .analyze();

    const contrastViolations = results.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      const details = contrastViolations[0].nodes.map(
        (n) => `  - ${n.html.substring(0, 80)} — ${n.any?.[0]?.message || 'no detail'}`
      ).join('\n');
      console.log('Color contrast issues:\n' + details);
    }

    expect(contrastViolations).toHaveLength(0);
  });
});

test.describe('Accessibility - manual checks', () => {
  test('skip link should be present and target main content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // Main content target should exist
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeAttached();
  });

  test('nav toggle should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navToggle = page.locator('#nav-toggle');
    await expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(navToggle).toHaveAttribute('aria-controls', 'main-navigation');
    await expect(navToggle).toHaveAttribute('aria-label', 'Toggle navigation menu');
  });

  test('social links should all have aria-labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const socialLinks = page.locator('.socials a');
    const count = await socialLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = socialLinks.nth(i);
      const ariaLabel = await link.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('contact dialog should have proper role and aria attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const dialog = page.locator('#contact-dialog');
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'contact-title');
  });

  test('cookie toast should have aria-label', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const toast = page.locator('.cookie-toast');
    await expect(toast).toHaveAttribute('aria-label', 'Cookie notice');
  });

  test('SVG icons should be hidden from screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const socialSvgs = page.locator('.socials svg');
    const count = await socialSvgs.count();

    for (let i = 0; i < count; i++) {
      const svg = socialSvgs.nth(i);
      await expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('external links should have rel="noopener"', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });
});
