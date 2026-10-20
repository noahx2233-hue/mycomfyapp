/**
 * Sorenity — Central Application Controller
 * Coordinates User Accounts, Daily Sanctuary (Verse & Word),
 * Tab Routing, Dashboard, and Global Event Bus.
 */

class CausalSelfApp {
  constructor() {
    this.currentTab = 'dashboard';
  }

  init() {
    this.initTheme();
    this.initDateAndGreeting();
    this.initUserAccount();
    this.renderDailyCards();
    this.setupTabs();
    this.setupAccountModal();
    this.setupMidnightWatcher();

    // Initialize child modules
    if (window.causalLogger) window.causalLogger.init();
    if (window.personalCausalGraph) window.personalCausalGraph.init();
    if (window.journal) window.journal.init();

    this.renderDashboardMetrics();
  }

  // ===========================================================================
  // Date & Header Management
  // ===========================================================================

  initDateAndGreeting() {
    const dateChip = document.getElementById('current-date-text');
    const greetingEl = document.getElementById('daily-greeting');
    if (!dateChip) return;

    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    dateChip.textContent = now.toLocaleDateString(undefined, options);

    const activeUser = window.causalStorage.getActiveUser();
    const firstName = activeUser.name.split(' ')[0];

    const hours = now.getHours();
    if (hours < 12) {
      greetingEl.textContent = `Good morning, ${firstName}`;
    } else if (hours < 18) {
      greetingEl.textContent = `Good afternoon, ${firstName}`;
    } else {
      greetingEl.textContent = `Good evening, ${firstName}`;
    }
  }

  // ===========================================================================
  // User Profile & Account Management
  // ===========================================================================

  initUserAccount() {
    const activeUser = window.causalStorage.getActiveUser();
    const userBtn = document.getElementById('user-profile-btn');
    const avatarBadge = document.getElementById('user-avatar-badge');
    const userNameSpan = document.getElementById('user-display-name');

    if (avatarBadge && userNameSpan) {
      const initials = activeUser.name.substring(0, 2).toUpperCase();
      avatarBadge.textContent = initials;
      avatarBadge.style.backgroundColor = activeUser.avatarColor || '#3F6754';
      userNameSpan.textContent = activeUser.name;
    }
  }

  setupAccountModal() {
    const modal = document.getElementById('account-modal');
    const openBtn = document.getElementById('user-profile-btn');
    const closeBtn = document.getElementById('close-account-modal');
    const createForm = document.getElementById('create-user-form');
    const renameForm = document.getElementById('rename-user-form');
    const activeNameInput = document.getElementById('active-user-name');

    if (!modal || !openBtn) return;

    const openModal = () => {
      this.renderUsersList();
      if (activeNameInput) activeNameInput.value = window.causalStorage.getActiveUser().name;
      modal.classList.add('visible');
    };

    const closeModal = () => {
      modal.classList.remove('visible');
    };

    openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-user-name');
        if (!nameInput || !nameInput.value.trim()) return;

        try {
          const newUser = window.causalStorage.createUser(nameInput.value.trim());
          nameInput.value = '';
          this.initUserAccount();
          this.initDateAndGreeting();
          this.refreshAllComponents();
          this.showToast(`Logged into account: ${newUser.name}`);
          closeModal();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (renameForm) {
      renameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!activeNameInput || !activeNameInput.value.trim()) return;
        try {
          const user = window.causalStorage.renameActiveUser(activeNameInput.value);
          this.initUserAccount();
          this.initDateAndGreeting();
          this.renderUsersList();
          this.refreshAllComponents();
          this.showToast(`Profile renamed to: ${user.name}`);
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  renderUsersList() {
    const container = document.getElementById('existing-users-list');
    if (!container) return;

    const users = window.causalStorage.getUsers();
    const activeUser = window.causalStorage.getActiveUser();

    container.innerHTML = '';
    users.forEach(u => {
      const item = document.createElement('div');
      item.className = `user-account-item ${u.id === activeUser.id ? 'active' : ''}`;

      const logsCount = window.causalStorage.getLogs(u.id).length;
      const initials = u.name.substring(0, 2).toUpperCase();

      item.innerHTML = `
        <div class="user-item-left">
          <div class="user-mini-avatar" style="background-color: ${u.avatarColor || '#3F6754'}">${initials}</div>
          <div class="user-item-info">
            <strong>${escapeHtml(u.name)}</strong>
            <span>${logsCount} days recorded</span>
          </div>
        </div>
        <div class="user-item-actions">
          ${u.id === activeUser.id ? '<span class="active-pill">Current</span>' : '<button type="button" class="switch-user-btn">Switch</button>'}
          ${users.length > 1 ? '<button type="button" class="delete-user-btn" aria-label="Delete profile" title="Delete profile">×</button>' : ''}
        </div>
      `;

      if (u.id !== activeUser.id) {
        const switchBtn = item.querySelector('.switch-user-btn');
        switchBtn.addEventListener('click', () => {
          window.causalStorage.setActiveUserId(u.id);
          this.initUserAccount();
          this.initDateAndGreeting();
          this.refreshAllComponents();
          this.showToast(`Switched account to: ${u.name}`);
          document.getElementById('account-modal').classList.remove('visible');
        });
      }

      const deleteBtn = item.querySelector('.delete-user-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          const confirmed = window.confirm(`Delete the profile “${u.name}”? Its saved daily logs will also be removed.`);
          if (!confirmed) return;
          try {
            const result = window.causalStorage.deleteUser(u.id);
            this.initUserAccount();
            this.initDateAndGreeting();
            this.refreshAllComponents();
            this.renderUsersList();
            this.showToast(`Deleted profile: ${result.deletedUser.name}`);
          } catch (err) {
            alert(err.message);
          }
        });
      }

      container.appendChild(item);
    });
  }

  // ===========================================================================
  // Daily Sanctuary (Bible Verse & Word of the Day)
  // ===========================================================================

  renderDailyCards() {
    const today = new Date();
    const verse = getDailyVerse(today);
    const word = getDailyWord(today);

    // Verse Card
    const verseText = document.getElementById('verse-text');
    const verseRef = document.getElementById('verse-reference');
    const verseTheme = document.getElementById('verse-theme-tag');
    const verseRefl = document.getElementById('verse-reflection');
    const copyVerseBtn = document.getElementById('copy-verse-btn');
    const favVerseBtn = document.getElementById('favorite-verse-btn');

    if (verse && verseText) {
      verseText.textContent = `“${verse.text}”`;
      verseRef.textContent = `${verse.reference} (${verse.translation})`;
      verseTheme.textContent = verse.theme;
      verseRefl.textContent = verse.reflection;

      copyVerseBtn.onclick = () => {
        const text = `\"${verse.text}\"\n— ${verse.reference} (${verse.translation})`;
        this.copyToClipboard(text, 'Bible verse copied to clipboard');
      };

      favVerseBtn.onclick = () => {
        favVerseBtn.classList.toggle('active');
        this.showToast('Verse bookmarked in your sanctuary');
      };
    }

    // Word Card
    const wordTitle = document.getElementById('word-title');
    const wordPos = document.getElementById('word-pos');
    const wordPhonetic = document.getElementById('word-phonetic');
    const wordDef = document.getElementById('word-def');
    const wordExample = document.getElementById('word-example');
    const copyWordBtn = document.getElementById('copy-word-btn');
    const favWordBtn = document.getElementById('favorite-word-btn');

    if (word && wordTitle) {
      wordTitle.textContent = word.word;
      wordPos.textContent = word.partOfSpeech;
      wordPhonetic.textContent = word.phonetic;
      wordDef.textContent = word.definition;
      wordExample.textContent = `“${word.example}”`;

      copyWordBtn.onclick = () => {
        const text = `${word.word} [${word.phonetic}] (${word.partOfSpeech}): ${word.definition}\nExample: \"${word.example}\"`;
        this.copyToClipboard(text, 'Word of the day copied to clipboard');
      };

      favWordBtn.onclick = () => {
        favWordBtn.classList.toggle('active');
        this.showToast('Word saved to your vocabulary list');
      };
    }
  }

  // ===========================================================================
  // Navigation & Tab Switching
  // ===========================================================================

  setupTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const homeLogo = document.getElementById('brand-home-button');
    const dashboardTab = document.querySelector('.nav-tab-btn[data-tab="dashboard"]');

    if (homeLogo && dashboardTab) {
      homeLogo.addEventListener('click', () => dashboardTab.click());
    }

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        if (!targetTab) return;

        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const activePane = document.getElementById(`tab-pane-${targetTab}`);
        if (activePane) {
          activePane.classList.add('active');
        }

        this.currentTab = targetTab;

        // Trigger reactive updates for the view
        if (targetTab === 'graph' && window.personalCausalGraph) {
          window.personalCausalGraph.render();
        } else if (targetTab === 'dashboard') {
          this.renderDashboardMetrics();
        }
      });
    });
  }

  // ===========================================================================
  // Overview Dashboard (Step 3)
  // ===========================================================================

  renderDashboardMetrics() {
    const logs = window.causalStorage.getLogs();

    const avgMoodEl = document.getElementById('dash-avg-mood');
    const avgEnergyEl = document.getElementById('dash-avg-energy');
    const topDriverEl = document.getElementById('dash-top-driver');
    const daysTrackedEl = document.getElementById('dash-days-tracked');

    if (!avgMoodEl) return;

    if (logs.length === 0) {
      avgMoodEl.textContent = '—';
      avgEnergyEl.textContent = '—';
      topDriverEl.textContent = 'None yet';
      daysTrackedEl.textContent = '0 days';
      return;
    }

    const totalMood = logs.reduce((acc, l) => acc + l.mood, 0);
    const totalEnergy = logs.reduce((acc, l) => acc + l.energy, 0);
    const avgMood = Math.round((totalMood / logs.length) * 10) / 10;
    const avgEnergy = Math.round((totalEnergy / logs.length) * 10) / 10;

    avgMoodEl.textContent = `${avgMood} / 10`;
    avgEnergyEl.textContent = `${avgEnergy} / 10`;
    daysTrackedEl.textContent = `${logs.length} day${logs.length > 1 ? 's' : ''}`;

    // Compute top positive driver (activity/input associated with highest mood)
    const drivers = {};
    logs.forEach(l => {
      [...l.inputs, ...l.activities].forEach(tag => {
        if (!drivers[tag]) drivers[tag] = { count: 0, moodSum: 0 };
        drivers[tag].count++;
        drivers[tag].moodSum += l.mood;
      });
    });

    let bestDriver = 'Steady Flow';
    let highestAvg = 0;
    Object.keys(drivers).forEach(tag => {
      if (drivers[tag].count >= 2) {
        const tagAvg = drivers[tag].moodSum / drivers[tag].count;
        if (tagAvg > highestAvg) {
          highestAvg = tagAvg;
          bestDriver = tag;
        }
      }
    });

    topDriverEl.textContent = bestDriver;

    // Render 7-day flow rhythm on Dashboard
    this.renderDashboardRhythm(logs);
  }

  renderDashboardRhythm(logs) {
    const container = document.getElementById('dash-rhythm-container');
    if (!container) return;

    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const matchLog = logs.find(l => l.date === dStr);
      days.push({
        dayName: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
        shortDate: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        mood: matchLog ? matchLog.mood : 0,
        energy: matchLog ? matchLog.energy : 0,
        hasLog: !!matchLog,
        isToday: i === 0
      });
    }

    let pillarsHtml = '';
    days.forEach(d => {
      const moodHeight = d.hasLog ? Math.round((d.mood / 10) * 64) : 4;
      const moodClass = d.isToday ? 'dash-pillar-fill today' : 'dash-pillar-fill';
      pillarsHtml += `
        <div class="dash-rhythm-col">
          <div class="dash-pillar-track">
            <div class="${moodClass}" style="height: ${moodHeight}px;"></div>
          </div>
          <span class="dash-col-name ${d.isToday ? 'today-text' : ''}">${d.dayName}</span>
          <span class="dash-col-score">${d.hasLog ? `${d.mood}/10` : '—'}</span>
        </div>
      `;
    });

    container.innerHTML = pillarsHtml;
  }

  refreshAllComponents() {
    this.renderDashboardMetrics();
    if (window.causalLogger) window.causalLogger.renderRecentLogs();
    if (window.personalCausalGraph) window.personalCausalGraph.render();
  }

  // ===========================================================================
  // Theme & Watchers
  // ===========================================================================

  initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('causal_self_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initial);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('causal_self_theme', next);
        this.showToast(`Switched to ${next} theme`);

        if (window.personalCausalGraph) window.personalCausalGraph.render();
      });
    }
  }

  setupMidnightWatcher() {
    setInterval(() => {
      this.initDateAndGreeting();
      this.renderDailyCards();
    }, 60000);
  }

  // ===========================================================================
  // Clipboard & Toast Utilities
  // ===========================================================================

  copyToClipboard(text, successMsg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => this.showToast(successMsg))
        .catch(() => this.fallbackCopy(text, successMsg));
    } else {
      this.fallbackCopy(text, successMsg);
    }
  }

  fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-999999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast(successMsg);
    } catch (e) {
      this.showToast('Copied to clipboard');
    } finally {
      document.body.removeChild(ta);
    }
  }

  showToast(msg) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.app = new CausalSelfApp();
document.addEventListener('DOMContentLoaded', () => window.app.init());
