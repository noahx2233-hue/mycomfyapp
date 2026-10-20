/* Study Zone Pomodoro timer and Milo's gentle encouragement. */
(function () {
  const STORAGE_KEY = 'sorenity_pomodoro_state';
  const FOCUS_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;
  const CIRCUMFERENCE = 2 * Math.PI * 96;
  const quotes = [
    'You don’t have to do it all at once. Just begin.',
    'Small steps still move you forward.',
    'Give this moment your attention. That is enough.',
    'You are allowed to learn at your own pace.',
    'A little progress is still progress.',
    'Take a breath. You’re doing better than you think.',
    'Stay curious. You are growing every time you try.'
  ];

  function initStudyZone() {
    const pane = document.getElementById('tab-pane-study');
    const clock = document.getElementById('pomodoro-time');
    const phaseLabel = document.getElementById('pomodoro-phase');
    const hint = document.getElementById('pomodoro-hint');
    const startButton = document.getElementById('pomodoro-start');
    const resetButton = document.getElementById('pomodoro-reset');
    const progress = document.getElementById('pomodoro-progress');
    const roundLabel = document.getElementById('pomodoro-round-label');
    const quote = document.getElementById('milo-quote');
    const caption = document.getElementById('milo-caption');
    if (!pane || !clock || !startButton || !resetButton || !progress) return;

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) {}
    let phase = saved.phase === 'break' ? 'break' : 'focus';
    const expiredWhileAway = Boolean(saved.running && Number(saved.endsAt) <= Date.now());
    let running = Boolean(saved.running && !expiredWhileAway);
    let endsAt = running ? Number(saved.endsAt) : null;
    let remaining = running
      ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      : Math.max(1, Math.min(Number(saved.remaining) || (phase === 'break' ? BREAK_SECONDS : FOCUS_SECONDS), phase === 'break' ? BREAK_SECONDS : FOCUS_SECONDS));
    let completedRounds = Math.max(0, Number(saved.completedRounds) || 0);
    if (expiredWhileAway && phase === 'focus') {
      completedRounds += 1;
      phase = 'break';
      remaining = BREAK_SECONDS;
      running = true;
      endsAt = Date.now() + BREAK_SECONDS * 1000;
    } else if (expiredWhileAway) {
      phase = 'focus';
      remaining = FOCUS_SECONDS;
      running = false;
      endsAt = null;
    }
    let quoteIndex = 0;

    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ phase, running, endsAt, remaining, completedRounds }));
    }

    function showToast(message) {
      if (window.app && typeof window.app.showToast === 'function') window.app.showToast(message);
    }

    function formatTime(seconds) {
      const safe = Math.max(0, seconds);
      return String(Math.floor(safe / 60)).padStart(2, '0') + ':' + String(safe % 60).padStart(2, '0');
    }

    function render() {
      const duration = phase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
      const ratio = Math.max(0, Math.min(1, remaining / duration));
      const roundsThisCycle = completedRounds % 4;
      const currentRound = roundsThisCycle + 1;
      clock.textContent = formatTime(remaining);
      phaseLabel.textContent = phase === 'focus' ? 'Focus session' : 'Gentle break';
      pane.classList.toggle('break-mode', phase === 'break');
      progress.style.strokeDasharray = String(CIRCUMFERENCE);
      progress.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - ratio));
      startButton.textContent = running ? 'Pause' : (remaining < duration ? (phase === 'focus' ? 'Resume focus' : 'Resume break') : (phase === 'focus' ? 'Start focus' : 'Start break'));
      hint.textContent = running
        ? (phase === 'focus' ? 'You’re doing great. Keep your attention here.' : 'Let your mind rest. Your next focus round is waiting.')
        : (phase === 'focus' ? 'Ready when you are. Start a 25-minute focus session.' : 'Break time is ready whenever you are.');
      roundLabel.textContent = 'Round ' + currentRound + ' of 4';
      for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById('round-dot-' + i);
        if (dot) {
          dot.classList.toggle('done', i <= roundsThisCycle);
          dot.classList.toggle('active', i === currentRound);
        }
      }
      caption.textContent = phase === 'focus'
        ? (running ? 'I’m cheering you on. One thing at a time.' : 'I’ll be right here when you’re ready.')
        : (running ? 'Stretch, sip some water, and let your thoughts wander.' : 'Your break is complete. Start again when you feel ready.');
    }

    function begin() {
      running = true;
      endsAt = Date.now() + remaining * 1000;
      save();
      render();
    }

    function completePhase() {
      if (phase === 'focus') {
        completedRounds += 1;
        phase = 'break';
        remaining = BREAK_SECONDS;
        running = true;
        endsAt = Date.now() + BREAK_SECONDS * 1000;
        showToast('Focus session complete. Your 5-minute break has started.');
      } else {
        phase = 'focus';
        remaining = FOCUS_SECONDS;
        running = false;
        endsAt = null;
        showToast('Break complete. Start your next focus round whenever you’re ready.');
      }
      save();
      render();
    }

    startButton.addEventListener('click', function () {
      if (running) {
        remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        running = false;
        endsAt = null;
        save();
        render();
      } else {
        begin();
      }
    });

    resetButton.addEventListener('click', function () {
      phase = 'focus';
      remaining = FOCUS_SECONDS;
      running = false;
      endsAt = null;
      save();
      render();
    });

    quote.textContent = '“' + quotes[quoteIndex] + '”';
    render();
    setInterval(function () {
      if (!running) return;
      remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (remaining <= 0) completePhase();
      else render();
    }, 250);
    setInterval(function () {
      quoteIndex = (quoteIndex + 1) % quotes.length;
      quote.style.opacity = '0';
      setTimeout(function () {
        quote.textContent = '“' + quotes[quoteIndex] + '”';
        quote.style.opacity = '1';
      }, 220);
    }, 26000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStudyZone);
  else initStudyZone();
})();
