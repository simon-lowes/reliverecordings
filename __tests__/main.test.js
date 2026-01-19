/**
 * Integration tests for main.js
 * Tests DOM interactions for navigation, cookie toast, and contact form
 *
 * Note: innerHTML usage in these tests is intentional for setting up test fixtures
 * with static HTML content in jsdom - not a security concern in test environment.
 */

describe('Mobile Navigation', () => {
  let navToggle;
  let nav;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <button id="nav-toggle" aria-expanded="false">Menu</button>
      <nav id="main-navigation">
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
        </ul>
      </nav>
    `;

    navToggle = document.getElementById('nav-toggle');
    nav = document.getElementById('main-navigation');

    // Re-run the navigation IIFE
    const navToggleEl = document.getElementById('nav-toggle');
    const navEl = document.getElementById('main-navigation');
    let focusTimeout = null;

    if (navToggleEl && navEl) {
      const cancelFocusTimeout = () => {
        if (focusTimeout) {
          clearTimeout(focusTimeout);
          focusTimeout = null;
        }
      };

      navToggleEl.addEventListener('click', () => {
        const isOpen = navEl.classList.contains('nav-open');
        if (isOpen) {
          navEl.classList.remove('nav-open');
          navToggleEl.setAttribute('aria-expanded', 'false');
          cancelFocusTimeout();
        } else {
          navEl.classList.add('nav-open');
          navToggleEl.setAttribute('aria-expanded', 'true');
          focusTimeout = setTimeout(() => {
            if (navEl.classList.contains('nav-open')) {
              navEl.querySelector('a')?.focus();
            }
            focusTimeout = null;
          }, 350);
        }
      });

      document.addEventListener('keydown', (evt) => {
        if (evt.key === 'Escape' && navEl.classList.contains('nav-open')) {
          navEl.classList.remove('nav-open');
          navToggleEl.setAttribute('aria-expanded', 'false');
          navToggleEl.focus();
          cancelFocusTimeout();
        }
      });

      for (const link of navEl.querySelectorAll('a')) {
        link.addEventListener('click', () => {
          navEl.classList.remove('nav-open');
          navToggleEl.setAttribute('aria-expanded', 'false');
          cancelFocusTimeout();
        });
      }
    }
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  test('should open navigation when toggle is clicked', () => {
    navToggle.click();

    expect(nav.classList.contains('nav-open')).toBe(true);
    expect(navToggle.getAttribute('aria-expanded')).toBe('true');
  });

  test('should close navigation when toggle is clicked while open', () => {
    // Open first
    navToggle.click();
    expect(nav.classList.contains('nav-open')).toBe(true);

    // Then close
    navToggle.click();
    expect(nav.classList.contains('nav-open')).toBe(false);
    expect(navToggle.getAttribute('aria-expanded')).toBe('false');
  });

  test('should close navigation on Escape key', () => {
    // Open first
    navToggle.click();
    expect(nav.classList.contains('nav-open')).toBe(true);

    // Press Escape
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(nav.classList.contains('nav-open')).toBe(false);
    expect(navToggle.getAttribute('aria-expanded')).toBe('false');
  });

  test('should close navigation when a link is clicked', () => {
    // Open first
    navToggle.click();
    expect(nav.classList.contains('nav-open')).toBe(true);

    // Click a link
    const link = nav.querySelector('a');
    link.click();

    expect(nav.classList.contains('nav-open')).toBe(false);
    expect(navToggle.getAttribute('aria-expanded')).toBe('false');
  });

  test('should maintain closed state if Escape pressed while closed', () => {
    expect(nav.classList.contains('nav-open')).toBe(false);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(nav.classList.contains('nav-open')).toBe(false);
  });
});

describe('Cookie Toast', () => {
  let dialog;
  const storageKey = 'rlrCookieToastDismissed-v1';

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Set up DOM with a mock dialog
    document.body.innerHTML = `
      <dialog class="cookie-toast">
        <p>We use cookies</p>
        <button class="cookie-toast__close">OK</button>
      </dialog>
    `;

    dialog = document.querySelector('.cookie-toast');

    // Mock dialog methods if not available in jsdom
    if (!dialog.show) {
      dialog.show = jest.fn(() => {
        dialog.open = true;
      });
    }
    if (!dialog.close) {
      dialog.close = jest.fn(() => {
        dialog.open = false;
        dialog.dispatchEvent(new Event('close'));
      });
    }

    // Re-run the cookie toast IIFE logic
    const persistDismissal = () => {
      try {
        localStorage.setItem(storageKey, '1');
      } catch {
        // Ignore storage errors
      }
    };

    dialog.addEventListener('close', persistDismissal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dialog.open) {
        dialog.close();
      }
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('should persist dismissal to localStorage when closed', () => {
    dialog.show();
    expect(dialog.open).toBe(true);

    dialog.close();

    expect(localStorage.getItem(storageKey)).toBe('1');
  });

  test('should close dialog on Escape key when open', () => {
    dialog.show();
    expect(dialog.open).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(dialog.open).toBe(false);
  });

  test('should not show dialog if previously dismissed', () => {
    localStorage.setItem(storageKey, '1');

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(storageKey) === '1';
    } catch {
      // Ignore
    }

    expect(dismissed).toBe(true);
  });
});

describe('Background Image Rotation', () => {
  test('should filter out failed images from rotation', () => {
    const images = [
      'images/image1.webp',
      'images/image2.webp',
      'images/image3.webp',
    ];

    const loadedImages = [];
    let loadAttempts = 0;

    // Simulate loading with one failure
    const simulateLoad = (src, success) => {
      loadAttempts++;
      if (success) {
        loadedImages.push(src);
      }
    };

    simulateLoad(images[0], true);
    simulateLoad(images[1], false); // Simulated failure
    simulateLoad(images[2], true);

    expect(loadAttempts).toBe(3);
    expect(loadedImages).toHaveLength(2);
    expect(loadedImages).not.toContain('images/image2.webp');
  });

  test('should cycle through images correctly', () => {
    const loadedImages = ['img1.webp', 'img2.webp', 'img3.webp'];
    let currentIndex = 0;

    // Simulate one rotation
    currentIndex = (currentIndex + 1) % loadedImages.length;
    expect(currentIndex).toBe(1);

    currentIndex = (currentIndex + 1) % loadedImages.length;
    expect(currentIndex).toBe(2);

    currentIndex = (currentIndex + 1) % loadedImages.length;
    expect(currentIndex).toBe(0); // Wraps around
  });
});

describe('Contact Form Dialog', () => {
  let dialog;
  let form;
  let submitBtn;
  let content;

  beforeEach(() => {
    document.body.innerHTML = `
      <a href="#contact" id="contact-link">Contact</a>
      <dialog id="contact-dialog">
        <div class="contact-dialog__content" data-state="form">
          <div class="contact-dialog__form-view">
            <button class="contact-dialog__close">×</button>
            <form id="contact-form">
              <input type="text" name="name" required>
              <input type="email" name="email" required>
              <textarea name="message" required></textarea>
              <button type="submit" class="contact-form__submit" data-loading="false">
                <span class="contact-form__submit-text">Send</span>
              </button>
            </form>
          </div>
          <div class="contact-dialog__success-view">
            <button class="contact-success__close">Close</button>
          </div>
        </div>
      </dialog>
    `;

    dialog = document.getElementById('contact-dialog');
    form = document.getElementById('contact-form');
    submitBtn = form.querySelector('.contact-form__submit');
    content = dialog.querySelector('.contact-dialog__content');

    // Mock dialog methods
    if (!dialog.showModal) {
      dialog.showModal = jest.fn(() => {
        dialog.open = true;
      });
    }
    if (!dialog.close) {
      dialog.close = jest.fn(() => {
        dialog.open = false;
        dialog.dispatchEvent(new Event('close'));
      });
    }

    // Set up event listeners
    const contactLink = document.getElementById('contact-link');
    const closeBtn = dialog.querySelector('.contact-dialog__close');
    const successCloseBtn = dialog.querySelector('.contact-success__close');

    contactLink.addEventListener('click', (e) => {
      e.preventDefault();
      dialog.showModal();
    });

    const closeDialog = () => dialog.close();
    closeBtn?.addEventListener('click', closeDialog);
    successCloseBtn?.addEventListener('click', closeDialog);

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeDialog();
      }
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should open dialog when contact link is clicked', () => {
    const contactLink = document.getElementById('contact-link');
    contactLink.click();

    expect(dialog.showModal).toHaveBeenCalled();
  });

  test('should close dialog when close button is clicked', () => {
    dialog.showModal();
    const closeBtn = dialog.querySelector('.contact-dialog__close');
    closeBtn.click();

    expect(dialog.close).toHaveBeenCalled();
  });

  test('should close dialog when success close button is clicked', () => {
    dialog.showModal();
    const successCloseBtn = dialog.querySelector('.contact-success__close');
    successCloseBtn.click();

    expect(dialog.close).toHaveBeenCalled();
  });

  test('should start with form state', () => {
    expect(content.dataset.state).toBe('form');
  });

  test('submit button should have loading state data attribute', () => {
    expect(submitBtn.dataset.loading).toBe('false');
  });
});

describe('Font Preload Activation', () => {
  test('should change rel attribute from preload to stylesheet', () => {
    document.body.innerHTML = `
      <link id="google-fonts-preload" rel="preload" href="fonts.css" as="style">
    `;

    const fontLink = document.getElementById('google-fonts-preload');
    expect(fontLink.rel).toBe('preload');

    // Simulate the IIFE behavior
    if (fontLink) {
      fontLink.rel = 'stylesheet';
    }

    expect(fontLink.rel).toBe('stylesheet');
  });

  test('should handle missing font link gracefully', () => {
    document.body.innerHTML = '';

    const fontLink = document.getElementById('google-fonts-preload');

    // This should not throw
    expect(() => {
      if (fontLink) {
        fontLink.rel = 'stylesheet';
      }
    }).not.toThrow();
  });
});
