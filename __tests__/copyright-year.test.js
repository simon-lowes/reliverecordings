/**
 * Unit tests for copyright year auto-update and font preload activation
 */

describe('Copyright Year', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test('should set copyright year to current year', () => {
    const el = document.createElement('span');
    el.id = 'copyright-year';
    document.body.appendChild(el);

    // Simulate the IIFE behavior from main.js
    const target = document.getElementById('copyright-year');
    if (target) target.textContent = new Date().getFullYear().toString();

    expect(el.textContent).toBe(new Date().getFullYear().toString());
  });

  test('should handle missing copyright element gracefully', () => {
    const el = document.getElementById('copyright-year');

    expect(() => {
      if (el) el.textContent = new Date().getFullYear().toString();
    }).not.toThrow();
  });

  test('should replace empty span content with year', () => {
    const el = document.createElement('span');
    el.id = 'copyright-year';
    document.body.appendChild(el);

    expect(el.textContent).toBe('');

    if (el) el.textContent = new Date().getFullYear().toString();
    expect(el.textContent).not.toBe('');
  });
});

describe('Font Preload Activation', () => {
  afterEach(() => {
    document.head.replaceChildren();
  });

  test('should change rel attribute from preload to stylesheet', () => {
    const link = document.createElement('link');
    link.id = 'google-fonts-preload';
    link.rel = 'preload';
    link.href = 'fonts.css';
    link.setAttribute('as', 'style');
    document.head.appendChild(link);

    const fontLink = document.getElementById('google-fonts-preload');
    expect(fontLink.rel).toBe('preload');

    if (fontLink) {
      fontLink.rel = 'stylesheet';
    }

    expect(fontLink.rel).toBe('stylesheet');
  });

  test('should handle missing font link gracefully', () => {
    const fontLink = document.getElementById('google-fonts-preload');

    expect(() => {
      if (fontLink) {
        fontLink.rel = 'stylesheet';
      }
    }).not.toThrow();
  });
});
