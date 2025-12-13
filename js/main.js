// Activate preloaded Google Fonts (non-render-blocking)
(function () {
  var fontLink = document.getElementById('google-fonts-preload');
  if (fontLink) {
    fontLink.rel = 'stylesheet';
  }
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

// Spotify fallback functionality
(function () {
  var spotifyFrame = document.querySelector('.spotify iframe');
  var spotifyFallback = document.querySelector('.spotify-fallback');
  if (!spotifyFrame || !spotifyFallback) {
    return;
  }
  var isLocal =
    ['localhost', '127.0.0.1'].indexOf(window.location.hostname) !== -1;
  var isSecure = window.location.protocol === 'https:';

  // Fallback starts hidden (via HTML attribute); only show if iframe fails.

  // If we are not secure (and not on localhost), show the fallback.
  if (!isSecure && !isLocal) {
    spotifyFallback.hidden = false;
    return;
  }

  var showFallback = function () {
    spotifyFallback.hidden = false;
  };

  // Give the iframe a few seconds to load; if it doesn't, show the link.
  var timeout = setTimeout(showFallback, 4000);

  spotifyFrame.addEventListener('load', function () {
    clearTimeout(timeout);
    // Keep fallback hidden on successful load
  });

  spotifyFrame.addEventListener('error', function () {
    showFallback();
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

  var currentIndex = 0;
  var imagesLoaded = 0;
  var loadedImages = [];

  // Preload images after initial page load
  window.addEventListener('load', function () {
    setTimeout(function () {
      images.forEach(function (src) {
        var img = new Image();
        img.onload = function () {
          loadedImages.push(src);
          imagesLoaded++;
          if (imagesLoaded === images.length) {
            startAnimation();
          }
        };
        img.src = src;
      });
    }, 1000); // Delay preloading by 1 second to prioritize critical content
  });

  function startAnimation() {
    setInterval(function () {
      currentIndex = (currentIndex + 1) % loadedImages.length;
      bgContainer.style.backgroundImage =
        'url(' + loadedImages[currentIndex] + ')';
    }, 9000); // 45s / 5 images = 9s per image
  }
})();
