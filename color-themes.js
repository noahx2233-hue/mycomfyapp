/* Sorenity's gentle color theme picker. The selection stays in this browser. */
(function () {
  const THEME_KEY = 'sorenity_color_theme';
  const themes = ['sage', 'dusk', 'warm-paper'];

  function initColorThemes() {
    const options = Array.from(document.querySelectorAll('[data-color-theme]'));
    if (!options.length) return;

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

    function updateProfileOverview() {
      const name = document.getElementById('user-display-name')?.textContent?.trim() || 'Your profile';
      const avatar = document.getElementById('user-avatar-badge')?.textContent?.trim() || name.slice(0, 2).toUpperCase();
      const nameTarget = document.getElementById('profile-overview-name');
      const avatarTarget = document.getElementById('profile-overview-avatar');
      if (nameTarget) nameTarget.textContent = name;
      if (avatarTarget) avatarTarget.textContent = avatar;
    }

    applyTheme(activeTheme, false);
    options.forEach((option) => option.addEventListener('click', () => applyTheme(option.dataset.colorTheme)));
    updateProfileOverview();
    document.getElementById('user-profile-btn')?.addEventListener('click', updateProfileOverview);
    window.addEventListener('sorenity-profile-changed', updateProfileOverview);

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
