// Activate preloaded Google Fonts (non-render-blocking)
// Note: Fonts are preloaded in HTML and activated here for optimal performance
(() => {
  const fontLink = document.getElementById('google-fonts-preload');
  if (fontLink) {
    fontLink.rel = 'stylesheet';
  }
})();

// Mobile navigation toggle
(() => {
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-navigation');
  let focusTimeout = null;

  if (!navToggle || !nav) return;

  // Helper function to cancel pending focus timeout
  const cancelFocusTimeout = () => {
    if (focusTimeout) {
      clearTimeout(focusTimeout);
      focusTimeout = null;
    }
  };

  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.contains('nav-open');

    if (isOpen) {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      cancelFocusTimeout();
    } else {
      nav.classList.add('nav-open');
      navToggle.setAttribute('aria-expanded', 'true');
      // Wait for link opacity transition to complete (250ms duration + 100ms delay = 350ms)
      // Nav transform (200ms) completes before link transition finishes
      focusTimeout = setTimeout(() => {
        // Check menu is still open before focusing
        if (nav.classList.contains('nav-open')) {
          nav.querySelector('a')?.focus();
        }
        focusTimeout = null;
      }, 350);
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && nav.classList.contains('nav-open')) {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
      cancelFocusTimeout();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (evt) => {
    if (
      nav.classList.contains('nav-open') &&
      !nav.contains(evt.target) &&
      !navToggle.contains(evt.target)
    ) {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
      cancelFocusTimeout();
    }
  });

  // Close menu when navigating to a link
  for (const link of nav.querySelectorAll('a')) {
    link.addEventListener('click', () => {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      cancelFocusTimeout();
    });
  }
})();

// Cookie toast functionality using native <dialog> element
(() => {
  const dialog = document.querySelector('.cookie-toast');
  if (!dialog) return;

  const storageKey = 'rlrCookieToastDismissed-v1';

  const persistDismissal = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // Ignore storage errors so dismissal still works
    }
  };

  // Persist when dialog closes by ANY method (button, Escape, click outside)
  dialog.addEventListener('close', persistDismissal);

  // Handle Escape key (non-modal dialogs don't auto-close on Escape)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dialog.open) {
      dialog.close();
    }
  });

  // Handle click outside to dismiss
  document.addEventListener('click', (e) => {
    if (dialog.open && !dialog.contains(e.target)) {
      dialog.close();
    }
  });

  window.addEventListener('load', () => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(storageKey) === '1';
    } catch {
      // Ignore storage errors so the notice can still show
    }
    if (!dismissed) {
      dialog.show(); // Non-modal: doesn't trap focus or add backdrop
    }
  });
})();

// Background image rotation with permutation-based ordering
// Uses dual-layer crossfade for smooth transitions
// Cycles through ALL possible orderings before repeating
(() => {
  const layers = document.querySelectorAll('.bg-layer');
  if (layers.length < 2) return;

  const images = [
    'images/images_50/Sub_Focus_Blue_Lightbeams_02_50.webp',
    'images/images_50/Sub_Focus_Lazers_03_50.webp',
    'images/images_50/Sub_Focus_Opening_Jib_Shot50.webp',
    'images/images_50/FFD_Venue_Wide_50.webp',
    'images/images_50/FFD_Hands_02_50.webp',
  ];

  const loadedImages = [];
  let loadAttempts = 0;

  // Generate all permutations of an array (Heap's algorithm)
  const generatePermutations = (arr) => {
    const result = [];
    const heapPermute = (n, current) => {
      if (n === 1) {
        result.push([...current]);
        return;
      }
      for (let i = 0; i < n; i++) {
        heapPermute(n - 1, current);
        if (n % 2 === 0) {
          [current[i], current[n - 1]] = [current[n - 1], current[i]];
        } else {
          [current[0], current[n - 1]] = [current[n - 1], current[0]];
        }
      }
    };
    heapPermute(arr.length, [...arr]);
    return result;
  };

  // Fisher-Yates shuffle
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  let permutations = [];
  let permIndex = 0;
  let imageIndex = 0;
  let activeLayerIndex = 0;

  const getNextImage = () => {
    // If we've shown all images in current permutation, move to next
    if (imageIndex >= permutations[permIndex].length) {
      imageIndex = 0;
      permIndex++;
      // If we've exhausted all permutations, reshuffle and restart
      if (permIndex >= permutations.length) {
        permIndex = 0;
        shuffle(permutations);
      }
    }
    return permutations[permIndex][imageIndex++];
  };

  const crossfade = () => {
    const nextImage = getNextImage();
    const currentLayer = layers[activeLayerIndex];
    const nextLayerIndex = (activeLayerIndex + 1) % 2;
    const nextLayer = layers[nextLayerIndex];

    // Set the next image on the hidden layer
    nextLayer.style.backgroundImage = `url(${nextImage})`;

    // Crossfade: fade out current, fade in next
    currentLayer.classList.remove('bg-layer--active');
    nextLayer.classList.add('bg-layer--active');

    // Swap active layer for next iteration
    activeLayerIndex = nextLayerIndex;
  };

  const checkComplete = () => {
    if (loadAttempts === images.length && loadedImages.length > 0) {
      startAnimation();
    }
  };

  const startAnimation = () => {
    // Generate and shuffle all permutations
    permutations = generatePermutations(loadedImages);
    shuffle(permutations);

    // Set initial image on the active layer
    const firstImage = getNextImage();
    layers[0].style.backgroundImage = `url(${firstImage})`;

    // Start rotation
    setInterval(crossfade, 9000);
  };

  // Preload images after initial page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      for (const src of images) {
        const img = new Image();
        img.onload = () => {
          loadedImages.push(src);
          loadAttempts++;
          checkComplete();
        };
        img.onerror = () => {
          loadAttempts++;
          checkComplete();
        };
        img.src = src;
      }
    }, 1000);
  });
})();

// Contact form dialog functionality
(() => {
  const contactLink = document.getElementById('contact-link');
  const dialog = document.getElementById('contact-dialog');
  const form = document.getElementById('contact-form');
  const content = dialog?.querySelector('.contact-dialog__content');
  const closeBtn = dialog?.querySelector('.contact-dialog__close');
  const successCloseBtn = dialog?.querySelector('.contact-success__close');
  const submitBtn = form?.querySelector('.contact-form__submit');

  if (!contactLink || !dialog || !form) return;

  // Open dialog when contact link is clicked
  contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    dialog.showModal();
  });

  // Close dialog handlers
  const closeDialog = () => {
    dialog.close();
  };

  closeBtn?.addEventListener('click', closeDialog);
  successCloseBtn?.addEventListener('click', closeDialog);

  // Close on backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeDialog();
    }
  });

  // Reset form state when dialog closes
  dialog.addEventListener('close', () => {
    content.dataset.state = 'form';
    form.reset();
    submitBtn.disabled = false;
    submitBtn.dataset.loading = 'false';
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.dataset.loading = 'true';

    try {
      const formData = new FormData(form);

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      // Success - transition to success state
      content.dataset.state = 'success';
    } catch (error) {
      // On error, re-enable form and show alert
      submitBtn.disabled = false;
      submitBtn.dataset.loading = 'false';
      alert('Sorry, there was an error sending your message. Please try again or email us directly.');
      console.error('Form submission error:', error);
    }
  });
})();
