/* Sorenity's gentle color theme picker. The selection stays in this browser. */
(function () {
  const THEME_KEY = 'sorenity_color_theme';
  const themes = ['sage', 'dusk', 'warm-paper'];

  function initColorThemes() {
    const dialog = document.getElementById('color-theme-dialog');
    const openButton = document.getElementById('color-theme-open');
    const closeButton = document.getElementById('color-theme-close');
    const options = Array.from(document.querySelectorAll('[data-color-theme]'));
    if (!dialog || !openButton || !closeButton || !options.length) return;

    let savedTheme = '';
    try { savedTheme = localStorage.getItem(THEME_KEY) || ''; } catch (_) {}
    const legacyTheme = document.documentElement.getAttribute('data-theme');
    let activeTheme = themes.includes(savedTheme)
      ? savedTheme
      : (legacyTheme === 'dark' ? 'dusk' : 'sage');

    function applyTheme(theme, persist = true) {
      if (!themes.includes(theme)) return;
      activeTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      options.forEach((option) => {
        option.setAttribute('aria-pressed', String(option.dataset.colorTheme === theme));
      });
      if (persist) {
        try {
          localStorage.setItem(THEME_KEY, theme);
          localStorage.setItem('causal_self_theme', theme === 'dusk' ? 'dark' : 'light');
        } catch (_) {}
      }
      if (window.personalCausalGraph && typeof window.personalCausalGraph.render === 'function') {
        window.personalCausalGraph.render();
      }
    }

    applyTheme(activeTheme, false);
    openButton.addEventListener('click', () => dialog.showModal());
    closeButton.addEventListener('click', () => dialog.close());
    options.forEach((option) => option.addEventListener('click', () => applyTheme(option.dataset.colorTheme)));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    // Keep the existing light/dark control in sync with the saved palette.
    const legacyToggle = document.getElementById('theme-toggle');
    if (legacyToggle) {
      legacyToggle.addEventListener('click', () => {
        const next = activeTheme === 'dusk' ? 'sage' : 'dusk';
        applyTheme(next);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initColorThemes, { once: true });
  } else {
    initColorThemes();
  }
})();
