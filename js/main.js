// Activate preloaded Google Fonts (non-render-blocking)
(function () {
  var fontLink = document.getElementById('google-fonts-preload');
  if (fontLink) {
    fontLink.rel = 'stylesheet';
  }
})();

// Mobile navigation toggle
(function () {
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-navigation');
  
  if (!navToggle || !nav) {
    return;
  }

  navToggle.addEventListener('click', function () {
    var isOpen = nav.classList.contains('nav-open');
    
    if (isOpen) {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    } else {
      nav.classList.add('nav-open');
      navToggle.setAttribute('aria-expanded', 'true');
      // Focus first navigation link when menu opens
      setTimeout(function() {
        var firstLink = nav.querySelector('a');
        if (firstLink) {
          firstLink.focus();
        }
      }, 150);
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', function (evt) {
    if (evt.key === 'Escape' && nav.classList.contains('nav-open')) {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', function (evt) {
    if (nav.classList.contains('nav-open') && 
        !nav.contains(evt.target) && 
        !navToggle.contains(evt.target)) {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu when navigating to a link
  var navLinks = nav.querySelectorAll('a');
  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Cookie toast functionality
(function () {
  var notice = document.querySelector('.cookie-toast');
  if (!notice) {
    return;
  }
  var closeButton = notice.querySelector('.cookie-toast__close');
  var storageKey = 'rlrCookieToastDismissed-v1';

  var hide = function () {
    notice.classList.add('is-hidden');
  };

  var show = function () {
    notice.classList.remove('is-hidden');
  };

  window.addEventListener('load', function () {
    var dismissed = false;
    try {
      dismissed = window.localStorage.getItem(storageKey) === '1';
    } catch (err) {
      // ignore storage errors so the notice can still show
    }
    if (!dismissed) {
      show();
    }
  });

  if (closeButton) {
    closeButton.addEventListener('click', function () {
      hide();
      try {
        window.localStorage.setItem(storageKey, '1');
      } catch (err) {
        // ignore storage errors so dismissal still works
      }
    });
  }

  document.addEventListener('keydown', function (evt) {
    if (evt.key === 'Escape' && !notice.classList.contains('is-hidden')) {
      hide();
      try {
        window.localStorage.setItem(storageKey, '1');
      } catch (err) {
        // ignore storage errors
      }
    }
  });
})();

// Background image rotation
(function () {
  // Lazy-load background images after page load to prevent CLS
  var bgContainer = document.querySelector('.background-container');
  if (!bgContainer) return;

  var images = [
    'images/images_50/Sub_Focus_Blue_Lightbeams_02_50.webp',
    'images/images_50/Sub_Focus_Lazers_03_50.webp',
    'images/images_50/Sub_Focus_Opening_Jib_Shot50.webp',
    'images/images_50/FFD_Venue_Wide_50.webp',
    'images/images_50/FFD_Hands_02_50.webp',
  ];

  var loadedImages = [];
  var totalToLoad = images.length;
  var loadAttempts = 0;

  // Preload images after initial page load
  window.addEventListener('load', function () {
    setTimeout(function () {
      images.forEach(function (src) {
        var img = new Image();
        img.onload = function () {
          loadedImages.push(src);
          loadAttempts++;
          checkComplete();
        };
        img.onerror = function () {
          // Gracefully handle missing images - just skip them
          loadAttempts++;
          checkComplete();
        };
        img.src = src;
      });
    }, 1000); // Delay preloading by 1 second to prioritize critical content
  });

  function checkComplete() {
    // Start animation when all load attempts are done (success or failure)
    if (loadAttempts === totalToLoad && loadedImages.length > 0) {
      startAnimation();
    }
  }

  function startAnimation() {
    var currentIndex = 0;
    setInterval(function () {
      currentIndex = (currentIndex + 1) % loadedImages.length;
      bgContainer.style.backgroundImage =
        'url(' + loadedImages[currentIndex] + ')';
    }, 9000); // 45s / 5 images = 9s per image
  }
})();
