/**
 * Unit tests for contact form modal functionality
 * Tests open/close behavior, form state management, and submission logic
 *
 * Note: innerHTML usage in these tests is intentional for setting up test fixtures
 * with static HTML content in jsdom - not a security concern in test environment.
 */

describe('Contact Form Modal', () => {
  let modal;
  let form;
  let contactLink;
  let closeBtn;
  let successCloseBtn;
  let errorRetryBtn;
  let submitBtn;
  let content;
  let backdrop;
  let listenerController;

  beforeEach(() => {
    // AbortController removes the leaked document-level listener in afterEach
    listenerController = new AbortController();

    document.body.innerHTML = `
      <a href="#contact" id="contact-link">Contact</a>
      <div id="contact-dialog" class="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-title" aria-hidden="true">
        <div class="contact-dialog__backdrop"></div>
        <div class="contact-dialog__content" data-state="form">
          <div class="contact-dialog__form-view">
            <button type="button" class="contact-dialog__close" aria-label="Close contact form"></button>
            <form id="contact-form" class="contact-form" name="contact" method="POST">
              <input type="text" id="contact-name" name="name" required autocomplete="name" />
              <input type="email" id="contact-email" name="email" required autocomplete="email" />
              <textarea id="contact-message" name="message" required rows="4"></textarea>
              <button type="submit" class="contact-form__submit">
                <span class="contact-form__submit-text">Send Message</span>
              </button>
            </form>
          </div>
          <div class="contact-dialog__error-view">
            <button type="button" class="contact-error__retry">Try Again</button>
          </div>
          <div class="contact-dialog__success-view">
            <button type="button" class="contact-success__close">Close</button>
          </div>
        </div>
      </div>
    `;

    modal = document.getElementById('contact-dialog');
    form = document.getElementById('contact-form');
    contactLink = document.getElementById('contact-link');
    closeBtn = modal.querySelector('.contact-dialog__close');
    successCloseBtn = modal.querySelector('.contact-success__close');
    errorRetryBtn = modal.querySelector('.contact-error__retry');
    submitBtn = form.querySelector('.contact-form__submit');
    content = modal.querySelector('.contact-dialog__content');
    backdrop = modal.querySelector('.contact-dialog__backdrop');

    // Wire up the same logic from main.js
    const openModal = () => {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      content.dataset.state = 'form';
      form.reset();
      submitBtn.disabled = false;
    };

    contactLink.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    closeBtn.addEventListener('click', closeModal);
    successCloseBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    errorRetryBtn.addEventListener('click', () => {
      content.dataset.state = 'form';
    });

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
          closeModal();
        }
      },
      { signal: listenerController.signal },
    );
  });

  afterEach(() => {
    listenerController.abort();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  test('should open modal when contact link is clicked', () => {
    contactLink.click();

    expect(modal.classList.contains('is-open')).toBe(true);
    expect(modal.getAttribute('aria-hidden')).toBe('false');
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('should close modal when close button is clicked', () => {
    contactLink.click();
    expect(modal.classList.contains('is-open')).toBe(true);

    closeBtn.click();

    expect(modal.classList.contains('is-open')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
    expect(document.body.style.overflow).toBe('');
  });

  test('should close modal when success close button is clicked', () => {
    contactLink.click();
    content.dataset.state = 'success';

    successCloseBtn.click();

    expect(modal.classList.contains('is-open')).toBe(false);
  });

  test('should close modal when backdrop is clicked', () => {
    contactLink.click();
    expect(modal.classList.contains('is-open')).toBe(true);

    backdrop.click();

    expect(modal.classList.contains('is-open')).toBe(false);
  });

  test('should close modal on Escape key', () => {
    contactLink.click();
    expect(modal.classList.contains('is-open')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(modal.classList.contains('is-open')).toBe(false);
  });

  test('should not close on Escape when modal is not open', () => {
    expect(modal.classList.contains('is-open')).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(modal.classList.contains('is-open')).toBe(false);
  });

  test('should reset form state on close', () => {
    contactLink.click();
    content.dataset.state = 'success';

    closeBtn.click();

    expect(content.dataset.state).toBe('form');
    expect(submitBtn.disabled).toBe(false);
  });

  test('should restore body scroll on close', () => {
    contactLink.click();
    expect(document.body.style.overflow).toBe('hidden');

    closeBtn.click();
    expect(document.body.style.overflow).toBe('');
  });

  test('should return to form state when retry button is clicked', () => {
    contactLink.click();
    content.dataset.state = 'error';

    errorRetryBtn.click();

    expect(content.dataset.state).toBe('form');
  });

  test('should start with form state', () => {
    expect(content.dataset.state).toBe('form');
  });

  test('should start with modal hidden', () => {
    expect(modal.classList.contains('is-open')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
  });

  test('should prevent default on contact link click', () => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefault = jest.spyOn(event, 'preventDefault');

    contactLink.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });
});

describe('Contact Form Validation', () => {
  let form;
  let nameInput;
  let emailInput;
  let messageInput;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form">
        <input type="text" id="contact-name" name="name" required />
        <input type="email" id="contact-email" name="email" required />
        <textarea id="contact-message" name="message" required></textarea>
        <button type="submit" class="contact-form__submit">Send</button>
      </form>
    `;

    form = document.getElementById('contact-form');
    nameInput = document.getElementById('contact-name');
    emailInput = document.getElementById('contact-email');
    messageInput = document.getElementById('contact-message');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('all form fields should have required attribute', () => {
    expect(nameInput.required).toBe(true);
    expect(emailInput.required).toBe(true);
    expect(messageInput.required).toBe(true);
  });

  test('email input should have type="email"', () => {
    expect(emailInput.type).toBe('email');
  });

  test('form should be invalid when fields are empty', () => {
    expect(form.checkValidity()).toBe(false);
  });

  test('form should be invalid when email format is wrong', () => {
    nameInput.value = 'Test User';
    emailInput.value = 'not-an-email';
    messageInput.value = 'Hello';

    expect(emailInput.checkValidity()).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });

  test('form should be valid with all fields filled correctly', () => {
    nameInput.value = 'Test User';
    emailInput.value = 'test@example.com';
    messageInput.value = 'Hello, this is a test message.';

    expect(form.checkValidity()).toBe(true);
  });

  test('form should be invalid when name is empty', () => {
    nameInput.value = '';
    emailInput.value = 'test@example.com';
    messageInput.value = 'Hello';

    expect(nameInput.checkValidity()).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });

  test('form should be invalid when message is empty', () => {
    nameInput.value = 'Test User';
    emailInput.value = 'test@example.com';
    messageInput.value = '';

    expect(messageInput.checkValidity()).toBe(false);
    expect(form.checkValidity()).toBe(false);
  });

  test('email validation should accept valid formats', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.co.uk',
      'user+tag@example.org',
    ];

    for (const email of validEmails) {
      emailInput.value = email;
      expect(emailInput.checkValidity()).toBe(true);
    }
  });
});
