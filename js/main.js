// Activate preloaded Google Fonts (non-render-blocking)
(function () {
  var fontLink = document.getElementById('google-fonts-preload');
  if (fontLink) {
    fontLink.rel = 'stylesheet';
  }
})();

// Embed Facade Pattern - Load embeds only on user interaction
// This eliminates third-party cookies until the user clicks to play
(function () {
  document.querySelectorAll('.embed-facade').forEach(function (facade) {
    facade.addEventListener('click', function () {
      var embedSrc = facade.getAttribute('data-embed-src');
      var parent = facade.parentElement;

      if (!embedSrc || !parent) return;

      // Create iframe
      var iframe = document.createElement('iframe');
      iframe.src = embedSrc;
      iframe.width = '560';
      iframe.height = '380';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');

      // YouTube-specific attributes
      if (parent.classList.contains('youtube')) {
        iframe.title = 're:liverecordings YouTube playlist';
        iframe.allow =
          'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      }

      // Spotify-specific attributes
      if (parent.classList.contains('spotify')) {
        iframe.title = 're:liverecordings Spotify playlist';
        iframe.allow =
          'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        iframe.setAttribute('allowtransparency', 'true');
      }

      // Replace facade with iframe
      parent.classList.add('embed-block--active');
      parent.appendChild(iframe);
      facade.remove();
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
