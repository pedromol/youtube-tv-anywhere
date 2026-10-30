// YouTube TV: force tab visibility + User-Agent spoofing in background
// Must run at document_start to work in background tabs

(function() {
  // ===== VISIBILITY OVERRIDE =====
  // Force document.hidden to always report visible (false)
  Object.defineProperty(document, 'hidden', {
    get: function() { return false; },
    configurable: true,
    enumerable: true
  });

  // Force document.visibilityState to always report visible
  Object.defineProperty(document, 'visibilityState', {
    get: function() { return 'visible'; },
    configurable: true,
    enumerable: true
  });

  // Prevent visibility change events from firing
  document.addEventListener('visibilitychange', function(e) {
    e.stopImmediatePropagation();
    return false;
  }, { capture: true });

  // Re-enforce on blur (when tab loses focus)
  window.addEventListener('blur', function(e) {
    e.stopImmediatePropagation();
    Object.defineProperty(document, 'hidden', {
      get: function() { return false; },
      configurable: true,
      enumerable: true
    });
  }, { capture: true });

  // Continuous enforcement via RAF loop
  (function enforce() {
    if (document.hidden !== false || document.visibilityState !== 'visible') {
      try {
        Object.defineProperty(document, 'hidden', {
          get: function() { return false; },
          configurable: true,
          enumerable: true
        });
        Object.defineProperty(document, 'visibilityState', {
          get: function() { return 'visible'; },
          configurable: true,
          enumerable: true
        });
      } catch (e) {}
    }
    requestAnimationFrame(enforce);
  })();

  // ===== USER-AGENT OVERRIDE =====
  // Override navigator.userAgent before page reads it
  const TV_USER_AGENT = "Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.0 Chrome/108.0.5359.1 TV Safari/537.36";
  
  // Override userAgent property
  Object.defineProperty(navigator, 'userAgent', {
    value: TV_USER_AGENT,
    writable: false,
    configurable: false,
    enumerable: true
  });

  // Override appVersion as well (some sites check this)
  Object.defineProperty(navigator, 'appVersion', {
    value: TV_USER_AGENT,
    writable: false,
    configurable: false,
    enumerable: true
  });
})();