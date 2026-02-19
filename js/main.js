// Activate preloaded Google Fonts (non-render-blocking)
// Note: Fonts are preloaded in HTML and activated here for optimal performance
(() => {
  const fontLink = document.getElementById('google-fonts-preload');
  if (fontLink) {
    fontLink.rel = 'stylesheet';
  }
})();

// Embed facade activation — replaces lightweight placeholders with real iframes on click
(() => {
  for (const facade of document.querySelectorAll('.embed-facade')) {
    facade.addEventListener('click', () => {
      const src = facade.dataset.src;
      const title = facade.dataset.title || '';
      const block = facade.closest('.embed-block');
      if (!src || !block) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = title;
      iframe.width = '560';
      iframe.height = '380';
      iframe.setAttribute('allowfullscreen', '');
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture';
      block.classList.add('embed-block--active');
      block.appendChild(iframe);
    });
  }
})();

// Dynamic copyright year
(() => {
  const el = document.getElementById('copyright-year');
  if (el) el.textContent = new Date().getFullYear();
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
    } catch (e) {
      console.warn('localStorage unavailable:', e);
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
    } catch (e) {
      console.warn('localStorage unavailable:', e);
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
  const navColorMap = {};
  const desktopMQ = window.matchMedia('(min-width: 800px)');

  // Analyze the nav region of an image to determine average luminance.
  // Replicates background-size:cover crop logic to sample the area
  // that actually appears behind the nav links on desktop.
  const analyzeNavRegion = (img) => {
    const canvasWidth = 100;
    const scale = canvasWidth / img.naturalWidth;
    const canvasHeight = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    // Simulate background-size:cover crop to find where nav sits in source image.
    // Assume a 16:9-ish viewport ratio for desktop (the exact ratio doesn't matter
    // much — we just need to know if the top-center is bright or dark).
    const vpAspect = 16 / 9;
    const imgAspect = canvasWidth / canvasHeight;

    let srcX, srcY, srcW, srcH;
    if (imgAspect > vpAspect) {
      // Image is wider than viewport — sides cropped
      srcH = canvasHeight;
      srcW = Math.round(canvasHeight * vpAspect);
      srcX = Math.round((canvasWidth - srcW) / 2);
      srcY = 0;
    } else {
      // Image is taller than viewport — top/bottom cropped
      srcW = canvasWidth;
      srcH = Math.round(canvasWidth / vpAspect);
      srcX = 0;
      srcY = Math.round((canvasHeight - srcH) / 2);
    }

    // Nav links sit at roughly y:5-15%, x:35-65% of the visible viewport area
    const sampleX = srcX + Math.round(srcW * 0.35);
    const sampleY = srcY + Math.round(srcH * 0.05);
    const sampleW = Math.round(srcW * 0.3);
    const sampleH = Math.round(srcH * 0.1);

    // Clamp to canvas bounds
    const clampedX = Math.max(0, Math.min(sampleX, canvasWidth - 1));
    const clampedY = Math.max(0, Math.min(sampleY, canvasHeight - 1));
    const clampedW = Math.max(1, Math.min(sampleW, canvasWidth - clampedX));
    const clampedH = Math.max(1, Math.min(sampleH, canvasHeight - clampedY));

    const data = ctx.getImageData(clampedX, clampedY, clampedW, clampedH).data;
    let totalLuminance = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      totalLuminance +=
        0.2126 * (data[i] / 255) +
        0.7152 * (data[i + 1] / 255) +
        0.0722 * (data[i + 2] / 255);
    }
    return totalLuminance / pixelCount;
  };

  const setNavColor = (imageSrc) => {
    if (!desktopMQ.matches) return;
    const color = navColorMap[imageSrc] || '#fff';
    document.documentElement.style.setProperty('--nav-link-color', color);
  };

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

    // Update nav link color for the incoming image
    setNavColor(nextImage);

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

    // Set initial nav color for the first image
    setNavColor(firstImage);

    // Start rotation with visibility-based pause/resume
    let rotationInterval = setInterval(crossfade, 9000);
    let isPaused = false;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(rotationInterval);
        isPaused = true;
      } else if (isPaused) {
        rotationInterval = setInterval(crossfade, 9000);
        isPaused = false;
      }
    });
  };

  // Preload images after initial page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      for (const src of images) {
        const img = new Image();
        img.onload = () => {
          const luminance = analyzeNavRegion(img);
          navColorMap[src] = luminance >= 0.5 ? '#1a1a1a' : '#fff';
          loadedImages.push(src);
          loadAttempts++;
          checkComplete();
        };
        img.onerror = () => {
          console.warn('Background image failed to load:', img.src);
          loadAttempts++;
          checkComplete();
        };
        img.src = src;
      }
    }, 1000);
  });
})();

// Contact form modal functionality (custom div-based for iOS compatibility)
(() => {
  const contactLink = document.getElementById('contact-link');
  const modal = document.getElementById('contact-dialog');
  const backdrop = modal?.querySelector('.contact-dialog__backdrop');
  const form = document.getElementById('contact-form');
  const content = modal?.querySelector('.contact-dialog__content');
  const closeBtn = modal?.querySelector('.contact-dialog__close');
  const successCloseBtn = modal?.querySelector('.contact-success__close');
  const errorRetryBtn = modal?.querySelector('.contact-error__retry');
  const submitBtn = form?.querySelector('.contact-form__submit');

  if (!contactLink || !modal || !form) return;

  // Open modal
  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    // Focus first input after a brief delay
    setTimeout(() => {
      form.querySelector('input')?.focus();
    }, 100);
  };

  // Close modal
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Reset form state
    content.dataset.state = 'form';
    form.reset();
    submitBtn.disabled = false;
    submitBtn.dataset.loading = 'false';
  };

  // Open modal when contact link is clicked
  contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  // Close handlers
  closeBtn?.addEventListener('click', closeModal);
  successCloseBtn?.addEventListener('click', closeModal);

  // Retry handler — return to form state so user can resubmit
  errorRetryBtn?.addEventListener('click', () => {
    content.dataset.state = 'form';
  });

  // Close on backdrop click
  backdrop?.addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
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
      // On error, show inline error state
      submitBtn.disabled = false;
      submitBtn.dataset.loading = 'false';
      content.dataset.state = 'error';
      console.error('Form submission error:', error);
    }
  });
})();
