/* Study Zone Pomodoro timer and Milo's gentle encouragement. */
(function () {
  const STORAGE_KEY = 'sorenity_pomodoro_state';
  const FOCUS_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;
  const STAR_REWARD_SECONDS = FOCUS_SECONDS;
  const STAR_REWARD_POINTS = 10;
  const CIRCUMFERENCE = 2 * Math.PI * 96;
  const quotes = [
    { text: 'Don’t count the days, make the days count.', source: 'Muhammad Ali' },
    { text: 'I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.', source: 'Attributed to Bruce Lee' },
    { text: 'Suffer the pain of discipline or suffer the pain of regret.', source: 'Attributed to Jim Rohn' },
    { text: 'Discipline equals freedom.', source: 'Jocko Willink' },
    { text: 'The only easy day was yesterday.', source: 'U.S. Navy SEAL motto' },
    { text: 'Everybody wants to be a beast until it’s time to do what beasts do.', source: 'Eric Thomas' },
    { text: 'I’ve failed over and over and over again in my life. And that is why I succeed.', source: 'Michael Jordan' },
    { text: 'Stay hungry, stay foolish.', source: 'Steve Jobs' },
    { text: 'It’s not whether you get knocked down, it’s whether you get up.', source: 'Vince Lombardi' },
    { text: 'Tough times never last, but tough people do.', source: 'Robert H. Schuller' },
    { text: 'What stands in the way becomes the way.', source: 'Marcus Aurelius' },
    { text: 'Waste no more time arguing what a good man should be. Be one.', source: 'Marcus Aurelius' },
    { text: 'Luck is what happens when preparation meets opportunity.', source: 'Seneca' },
    { text: 'He who has a why to live can bear almost any how.', source: 'Friedrich Nietzsche' },
    { text: 'Amor fati: love your fate, even the brutal exam week.', source: 'Nietzsche, with a study twist' },
    { text: 'We are what we repeatedly do.', source: 'Will Durant, on Aristotle' },
    { text: 'Be so good they can’t ignore you.', source: 'Steve Martin' },
    { text: 'Courage is not the absence of fear, but the triumph over it.', source: 'Nelson Mandela' },
    { text: 'If you’re going through hell, keep going.', source: 'Attributed to Winston Churchill' },
    { text: 'Hard choices, easy life. Easy choices, hard life.', source: 'Jerzy Gregorek' },
    { text: 'You can’t cross the sea merely by standing and staring at the water.', source: 'Rabindranath Tagore' },
    { text: 'A river cuts through rock not because of its power, but because of its persistence.', source: 'Jim Watkins' },
    { text: 'Rest if you must, but don’t you quit.', source: 'Edgar Guest' },
    { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', source: 'Chinese proverb' },
    { text: 'Fall seven times, stand up eight.', source: 'Japanese proverb' },
    { text: 'Your phone can wait. Your future can’t.', source: 'Study Bot · zero fluff' },
    { text: 'Open the book. That’s the hardest part. Done? Good. Keep going.', source: 'Study Bot · zero fluff' },
    { text: 'Nobody is coming to study for you. Lucky for you, you’ve got this.', source: 'Study Bot · zero fluff' },
    { text: 'Comfort is the enemy. Crush this chapter.', source: 'Study Bot · zero fluff' },
    { text: 'You’re not behind. You’re about to catch up. Move.', source: 'Study Bot · zero fluff' },
    { text: 'Every minute you waste is a minute your competition is using.', source: 'Study Bot · zero fluff' },
    { text: 'Be the one still studying when everyone else gives up.', source: 'Study Bot · zero fluff' },
    { text: 'Sleep is for after the exam. Okay, not really, but focus now.', source: 'Study Bot · zero fluff' },
    { text: 'Stop negotiating with yourself. Start the timer.', source: 'Study Bot · zero fluff' },
    { text: 'Pain now, flex later.', source: 'Study Bot · zero fluff' },
    { text: 'Don’t wish it were easier. Get stronger.', source: 'Study Bot · zero fluff' },
    { text: 'Twenty-five minutes. Zero distractions. Go.', source: 'Study Bot · zero fluff' },
    { text: 'You didn’t come this far to only come this far.', source: 'Study Bot · zero fluff' },
    { text: 'Bored? Good. Boredom is where the real learning starts.', source: 'Study Bot · zero fluff' },
    { text: 'That topic scaring you? Attack it first.', source: 'Study Bot · zero fluff' },
    { text: 'Winners study when they don’t feel like it.', source: 'Study Bot · zero fluff' },
    { text: 'Your excuses are weaker than your potential.', source: 'Study Bot · zero fluff' },
    { text: 'One more chapter. Then one more. That’s how legends are built.', source: 'Study Bot · zero fluff' },
    { text: 'Make Future You say ‘thank God I did that.’', source: 'Study Bot · zero fluff' },
    { text: 'This is your arena. Show up like it.', source: 'Study Bot · zero fluff' },
    { text: 'Turn the fear into fuel. Burn it on the syllabus.', source: 'Study Bot · zero fluff' },
    { text: 'Average people wait for motivation. You’re not average. Start.', source: 'Study Bot · zero fluff' },
    { text: 'You’re one focused session away from feeling unstoppable.', source: 'Study Bot · zero fluff' },
    { text: 'Eyes on the goal. Ignore the noise. Execute.', source: 'Study Bot · zero fluff' },
    { text: 'Close the tabs. Lock in. Let’s go.', source: 'Study Bot · zero fluff' }
  ];

  function localDateKey(timestamp = Date.now()) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function localDayStart(timestamp = Date.now()) {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  function initStudyZone() {
    const pane = document.getElementById('tab-pane-study');
    const clock = document.getElementById('pomodoro-time');
    const phaseLabel = document.getElementById('pomodoro-phase');
    const hint = document.getElementById('pomodoro-hint');
    const startButton = document.getElementById('pomodoro-start');
    const resetButton = document.getElementById('pomodoro-reset');
    const progress = document.getElementById('pomodoro-progress');
    const totalLabel = document.getElementById('study-total-time');
    const starCount = document.getElementById('star-points-count');
    const starChip = document.getElementById('star-points-chip');
    const quote = document.getElementById('milo-quote');
    const quoteSource = document.getElementById('milo-quote-source');
    if (!pane || !clock || !startButton || !resetButton || !progress || !totalLabel) return;

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) {}

    let phase = saved.phase === 'break' ? 'break' : 'focus';
    const today = localDateKey();
    let studyDate = saved.studyDate || '';
    const dayChangedAtLoad = studyDate !== today;
    let totalFocusSeconds = Math.max(0, Number(saved.totalFocusSeconds) || 0);
    if (dayChangedAtLoad) totalFocusSeconds = 0;
    studyDate = today;
    let lifetimeFocusSeconds = Math.max(0, Number(saved.lifetimeFocusSeconds) || 0);
    // Preserve existing points and progress from the former hourly reward.
    // Going forward, each accumulated 25 minutes of focus earns 10 points.
    let rewardedFocusSessions = Number.isFinite(Number(saved.rewardedFocusSessions))
      ? Math.max(0, Number(saved.rewardedFocusSessions))
      : Math.floor(lifetimeFocusSeconds / STAR_REWARD_SECONDS);
    let starPoints = Number.isFinite(Number(saved.starPoints))
      ? Math.max(0, Number(saved.starPoints))
      : Math.max(0, Number(saved.rewardedHours) || 0) * STAR_REWARD_POINTS;
    const expiredWhileAway = Boolean(saved.running && Number(saved.endsAt) <= Date.now());
    let running = Boolean(saved.running && !expiredWhileAway);
    let endsAt = running ? Number(saved.endsAt) : null;
    let remaining = running
      ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      : Math.max(1, Math.min(Number(saved.remaining) || (phase === 'break' ? BREAK_SECONDS : FOCUS_SECONDS), phase === 'break' ? BREAK_SECONDS : FOCUS_SECONDS));
    const hasSavedFocusSegment = Number.isFinite(Number(saved.focusSegmentSeconds));
    let focusSegmentSeconds = phase === 'focus' && saved.running
      ? Math.max(0, Math.min(FOCUS_SECONDS, hasSavedFocusSegment ? Number(saved.focusSegmentSeconds) : (Number(saved.remaining) || FOCUS_SECONDS)))
      : 0;
    let focusSegmentStartedAt = phase === 'focus' && saved.running
      ? (Number(saved.focusSegmentStartedAt) || (Number(saved.endsAt) - focusSegmentSeconds * 1000))
      : null;

    if (dayChangedAtLoad && running && phase === 'focus' && focusSegmentStartedAt && !expiredWhileAway) {
      const elapsedBeforeMidnight = Math.max(0, Math.min(focusSegmentSeconds,
        Math.floor((localDayStart() - focusSegmentStartedAt) / 1000)));
      lifetimeFocusSeconds += elapsedBeforeMidnight;
      awardCompletedFocusSessions();
      focusSegmentSeconds = Math.max(0, focusSegmentSeconds - elapsedBeforeMidnight);
      focusSegmentStartedAt = Math.max(localDayStart(), focusSegmentStartedAt);
    }

    function awardCompletedFocusSessions() {
      const completedFocusSessions = Math.floor(lifetimeFocusSeconds / STAR_REWARD_SECONDS);
      if (completedFocusSessions > rewardedFocusSessions) {
        starPoints += (completedFocusSessions - rewardedFocusSessions) * STAR_REWARD_POINTS;
        rewardedFocusSessions = completedFocusSessions;
        window.dispatchEvent(new CustomEvent('sorenity-star-points-changed', { detail: { balance: starPoints } }));
      }
    }

    if (expiredWhileAway && phase === 'focus') {
      const segmentStart = focusSegmentStartedAt || (endsAt - focusSegmentSeconds * 1000);
      const elapsedToday = Math.max(0, Math.min(focusSegmentSeconds,
        Math.floor((Math.min(Number(saved.endsAt), Date.now()) - Math.max(segmentStart, localDayStart())) / 1000)));
      totalFocusSeconds += elapsedToday;
      lifetimeFocusSeconds += focusSegmentSeconds;
      awardCompletedFocusSessions();
      phase = 'break';
      remaining = BREAK_SECONDS;
      running = true;
      endsAt = Date.now() + BREAK_SECONDS * 1000;
      focusSegmentSeconds = 0;
      focusSegmentStartedAt = null;
    } else if (expiredWhileAway) {
      phase = 'focus';
      remaining = FOCUS_SECONDS;
      running = false;
      endsAt = null;
      focusSegmentSeconds = 0;
      focusSegmentStartedAt = null;
    }

    let quoteOrder = quotes.map((_, index) => index);
    let quotePosition = 0;
    let lastQuoteIndex = null;

    function shuffleQuoteOrder() {
      for (let i = quoteOrder.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [quoteOrder[i], quoteOrder[j]] = [quoteOrder[j], quoteOrder[i]];
      }
      // Avoid an identical quote at the boundary between two shuffled cycles.
      if (quoteOrder.length > 1 && quoteOrder[0] === lastQuoteIndex) {
        const swapIndex = 1 + Math.floor(Math.random() * (quoteOrder.length - 1));
        [quoteOrder[0], quoteOrder[swapIndex]] = [quoteOrder[swapIndex], quoteOrder[0]];
      }
    }

    shuffleQuoteOrder();

    function renderQuote() {
      const currentQuoteIndex = quoteOrder[quotePosition];
      const currentQuote = quotes[currentQuoteIndex];
      lastQuoteIndex = currentQuoteIndex;
      quote.textContent = `“${currentQuote.text}”`;
      if (quoteSource) quoteSource.textContent = currentQuote.source ? `— ${currentQuote.source}` : '';
    }

    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        phase, running, endsAt, remaining, studyDate, totalFocusSeconds,
        lifetimeFocusSeconds, rewardedFocusSessions, starPoints,
        focusSegmentStartedAt, focusSegmentSeconds
      }));
    }

    function ensureStudyDay(now = Date.now()) {
      const today = localDateKey(now);
      if (studyDate === today) return false;

      const midnight = localDayStart(now);
      if (phase === 'focus' && running && focusSegmentStartedAt) {
        const elapsedBeforeMidnight = Math.max(0, Math.min(focusSegmentSeconds,
          Math.floor((midnight - focusSegmentStartedAt) / 1000)));
        lifetimeFocusSeconds += elapsedBeforeMidnight;
        awardCompletedFocusSessions();
        focusSegmentSeconds = Math.max(0, focusSegmentSeconds - elapsedBeforeMidnight);
        focusSegmentStartedAt = Math.max(midnight, focusSegmentStartedAt);
      }
      studyDate = today;
      totalFocusSeconds = 0;
      save();
      return true;
    }

    function showToast(message) {
      if (window.app && typeof window.app.showToast === 'function') window.app.showToast(message);
    }

    function formatTime(seconds) {
      const safe = Math.max(0, seconds);
      return String(Math.floor(safe / 60)).padStart(2, '0') + ':' + String(safe % 60).padStart(2, '0');
    }

    function formatStudyDuration(seconds) {
      const minutes = Math.floor(Math.max(0, seconds) / 60);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return hours ? `${hours}h ${String(remainingMinutes).padStart(2, '0')}m` : `${minutes} min`;
    }

    function currentFocusSeconds() {
      if (!running || phase !== 'focus' || !focusSegmentStartedAt) return totalFocusSeconds;
      const elapsed = Math.min(focusSegmentSeconds, Math.max(0, Math.floor((Date.now() - focusSegmentStartedAt) / 1000)));
      return totalFocusSeconds + elapsed;
    }

    function commitFocusSegment(now = Date.now()) {
      if (phase === 'focus' && running && focusSegmentStartedAt) {
        const elapsed = Math.min(focusSegmentSeconds, Math.max(0, Math.floor((now - focusSegmentStartedAt) / 1000)));
        totalFocusSeconds += elapsed;
        lifetimeFocusSeconds += elapsed;
        awardCompletedFocusSessions();
      }
      focusSegmentStartedAt = null;
      focusSegmentSeconds = 0;
    }

    function render() {
      const duration = phase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
      const ratio = Math.max(0, Math.min(1, remaining / duration));
      clock.textContent = formatTime(remaining);
      phaseLabel.textContent = phase === 'focus' ? 'Focus session' : 'Gentle break';
      pane.classList.toggle('break-mode', phase === 'break');
      progress.style.strokeDasharray = String(CIRCUMFERENCE);
      progress.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - ratio));
      startButton.textContent = running ? 'Pause' : (remaining < duration ? (phase === 'focus' ? 'Resume focus' : 'Resume break') : (phase === 'focus' ? 'Start focus' : 'Start break'));
      hint.textContent = running
        ? (phase === 'focus' ? 'You’re doing great. Keep your attention here.' : 'Let your mind rest. Your next focus session is waiting.')
        : (phase === 'focus'
          ? (remaining < FOCUS_SECONDS ? 'You’ve already made a start. Take a breath, then resume—one focused minute at a time.' : 'Ready when you are. Start a 25-minute focus session.')
          : 'Break time is ready whenever you are.');
      totalLabel.textContent = formatStudyDuration(currentFocusSeconds());
      if (starCount) starCount.textContent = String(starPoints);
      if (starChip) starChip.setAttribute('aria-label', `${starPoints} Star Points`);
    }

    window.sorenityStarWallet = {
      getBalance: () => starPoints,
      spend(amount) {
        const cost = Math.floor(Number(amount));
        if (!Number.isFinite(cost) || cost <= 0 || starPoints < cost) return false;
        starPoints -= cost;
        save();
        render();
        window.dispatchEvent(new CustomEvent('sorenity-star-points-changed', { detail: { balance: starPoints } }));
        return true;
      }
    };

    function begin() {
      ensureStudyDay();
      running = true;
      endsAt = Date.now() + remaining * 1000;
      if (phase === 'focus') {
        focusSegmentStartedAt = Date.now();
        focusSegmentSeconds = remaining;
      }
      save();
      render();
    }

    function completePhase() {
      if (phase === 'focus') {
        commitFocusSegment();
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
        showToast('Break complete. Start your next focus session whenever you’re ready.');
      }
      save();
      render();
    }

    startButton.addEventListener('click', function () {
      ensureStudyDay();
      if (running) {
        remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        commitFocusSegment();
        running = false;
        endsAt = null;
        save();
        render();
      } else {
        begin();
      }
    });

    resetButton.addEventListener('click', function () {
      ensureStudyDay();
      commitFocusSegment();
      phase = 'focus';
      remaining = FOCUS_SECONDS;
      running = false;
      endsAt = null;
      save();
      render();
    });

    renderQuote();
    if (expiredWhileAway) save();
    render();
    setInterval(function () {
      const dayChanged = ensureStudyDay();
      if (!running) {
        if (dayChanged) render();
        return;
      }
      remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (remaining <= 0) completePhase();
      else render();
    }, 250);
    setInterval(function () {
      if (!running || phase !== 'focus') return;
      if (quotePosition === quoteOrder.length - 1) {
        shuffleQuoteOrder();
        quotePosition = 0;
      } else {
        quotePosition += 1;
      }
      quote.style.opacity = '0';
      if (quoteSource) quoteSource.style.opacity = '0';
      setTimeout(function () {
        if (!running || phase !== 'focus') {
          quote.style.opacity = '1';
          if (quoteSource) quoteSource.style.opacity = '1';
          return;
        }
        renderQuote();
        quote.style.opacity = '1';
        if (quoteSource) quoteSource.style.opacity = '1';
      }, 220);
    }, 26000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStudyZone);
  else initStudyZone();
})();
