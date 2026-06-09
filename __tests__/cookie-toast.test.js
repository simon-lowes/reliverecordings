/**
 * Unit tests for cookie toast functionality
 * Tests localStorage persistence, dismissal logic, and keyboard interaction
 *
 * Note: innerHTML usage in these tests is intentional for setting up test fixtures
 * with static HTML content in jsdom - not a security concern in test environment.
 */

describe('Cookie Toast', () => {
  const storageKey = 'rlrCookieToastDismissed-v1';
  let dialog;
  let listenerController;

  beforeEach(() => {
    localStorage.clear();

    // AbortController removes leaked document-level listeners in afterEach
    listenerController = new AbortController();

    document.body.innerHTML = `
      <dialog class="cookie-toast" aria-label="Cookie notice">
        <p class="cookie-toast__body">This site uses cookies.</p>
        <form method="dialog">
          <button type="submit" class="cookie-toast__close" aria-label="Dismiss cookie notice">OK</button>
        </form>
      </dialog>
    `;

    dialog = document.querySelector('.cookie-toast');

    // Always install jest.fn mocks for the dialog methods (no `if (!dialog.x)`
    // guard) so assertions always target a spy regardless of whether the jsdom
    // build implements <dialog>. The element is recreated each test.
    dialog.show = jest.fn(() => {
      dialog.open = true;
    });
    dialog.close = jest.fn(() => {
      dialog.open = false;
      dialog.dispatchEvent(new Event('close'));
    });

    // Wire up the same logic from main.js
    const persistDismissal = () => {
      try {
        localStorage.setItem(storageKey, '1');
      } catch {
        // Ignore
      }
    };

    dialog.addEventListener('close', persistDismissal);

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' && dialog.open) {
          dialog.close();
        }
      },
      { signal: listenerController.signal },
    );

    // Mirror main.js: the OK button (<form method="dialog">) closes the dialog.
    // There is intentionally no outside-click auto-dismiss.
    dialog.querySelector('.cookie-toast__close').addEventListener('click', () => {
      dialog.close();
    });
  });

  afterEach(() => {
    listenerController.abort();
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('should show dialog when not previously dismissed', () => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(storageKey) === '1';
    } catch {
      // Ignore
    }
    expect(dismissed).toBe(false);

    // Simulate load behavior
    if (!dismissed) {
      dialog.show();
    }
    expect(dialog.open).toBe(true);
  });

  test('should not show dialog when previously dismissed', () => {
    localStorage.setItem(storageKey, '1');

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(storageKey) === '1';
    } catch {
      // Ignore
    }
    expect(dismissed).toBe(true);
  });

  test('should persist dismissal to localStorage when dialog is closed', () => {
    dialog.show();
    expect(dialog.open).toBe(true);

    dialog.close();

    expect(localStorage.getItem(storageKey)).toBe('1');
    expect(dialog.open).toBe(false);
  });

  test('should close dialog on Escape key when open', () => {
    dialog.show();
    expect(dialog.open).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(dialog.open).toBe(false);
    expect(localStorage.getItem(storageKey)).toBe('1');
  });

  test('should not close on Escape key when already closed', () => {
    expect(dialog.open).toBeFalsy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    // close() should not have been called
    expect(dialog.close).not.toHaveBeenCalled();
  });

  test('should NOT close when clicking outside (requires explicit dismissal)', () => {
    dialog.show();
    expect(dialog.open).toBe(true);

    // Click on body (outside dialog) — must not dismiss the notice, otherwise
    // the first click anywhere (e.g. opening the contact modal) would hide it.
    document.body.click();

    expect(dialog.open).toBe(true);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  test('should close and persist when the OK button is clicked', () => {
    dialog.show();
    expect(dialog.open).toBe(true);

    dialog.querySelector('.cookie-toast__close').click();

    expect(dialog.open).toBe(false);
    expect(localStorage.getItem(storageKey)).toBe('1');
  });

  test('should not close when clicking inside dialog', () => {
    dialog.show();
    expect(dialog.open).toBe(true);

    // Click inside dialog
    dialog.querySelector('.cookie-toast__body').click();

    expect(dialog.open).toBe(true);
  });

  test('should handle localStorage being unavailable', () => {
    // Mock localStorage to throw
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => {
      throw new Error('QuotaExceededError');
    });

    dialog.show();

    // Should not throw
    expect(() => dialog.close()).not.toThrow();

    localStorage.setItem = originalSetItem;
  });
});
