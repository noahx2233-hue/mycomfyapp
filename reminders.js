/* Local to-do list with browser notification reminders. */
(function () {
  const STORAGE_KEY = 'sorenity_daily_reminders';

  function initReminders() {
    const form = document.getElementById('reminder-form');
    const list = document.getElementById('reminder-list');
    const empty = document.getElementById('reminder-empty');
    const count = document.getElementById('reminder-count');
    const dateInput = document.getElementById('reminder-date');
    const timeInput = document.getElementById('reminder-time');
    const permissionButton = document.getElementById('enable-reminders-notifications');
    const permissionStatus = document.getElementById('reminders-notification-status');
    if (!form || !list || !dateInput || !permissionButton) return;

    let reminders = loadReminders();
    let filter = 'all';
    let timerId;

    function localDateString(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    dateInput.value = localDateString(new Date());

    function loadReminders() {
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(data) ? data : [];
      } catch (_) {
        return [];
      }
    }

    function saveReminders() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
      } catch (_) {
        setPermissionStatus('Could not save tasks in this browser.', 'warning');
      }
    }

    function setPermissionStatus(message, kind) {
      permissionStatus.textContent = message;
      permissionStatus.className = 'reminders-notification-status' + (kind ? ' ' + kind : '');
    }

    function updatePermissionStatus() {
      if (!('Notification' in window)) {
        permissionButton.disabled = true;
        permissionButton.classList.remove('enabled');
        permissionButton.querySelector('span').textContent = 'Notifications unavailable';
        setPermissionStatus('This browser does not support desktop notifications. Your tasks will still appear here.', 'warning');
      } else if (Notification.permission === 'granted') {
        permissionButton.disabled = false;
        permissionButton.classList.add('enabled');
        permissionButton.querySelector('span').textContent = 'Notifications enabled';
        setPermissionStatus('Task alerts are enabled. Keep Sorenity open to receive scheduled reminders.', 'success');
      } else if (Notification.permission === 'denied') {
        permissionButton.disabled = false;
        permissionButton.classList.remove('enabled');
        permissionButton.querySelector('span').textContent = 'Notifications blocked';
        setPermissionStatus('Notifications are blocked by your browser. Change this site’s notification permission in browser settings.', 'warning');
      } else {
        permissionButton.disabled = false;
        permissionButton.classList.remove('enabled');
        permissionButton.querySelector('span').textContent = 'Enable notifications';
        setPermissionStatus('Allow notifications to receive task alerts while Sorenity is open.', '');
      }
    }

    function getDueTimestamp(reminder) {
      if (!reminder.date || !reminder.time) return null;
      const due = new Date(reminder.date + 'T' + reminder.time);
      return Number.isNaN(due.getTime()) ? null : due.getTime();
    }

    function formatDue(reminder) {
      const date = new Date(reminder.date + 'T12:00:00');
      const dateText = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!reminder.time) return dateText + ' · no alert time';
      const time = new Date('2000-01-01T' + reminder.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      const today = localDateString(new Date());
      const prefix = reminder.date === today ? 'Today' : dateText;
      return prefix + ' · ' + time;
    }

    function isVisible(reminder) {
      if (filter === 'completed') return reminder.completed;
      if (reminder.completed) return false;
      if (filter === 'today') return reminder.date === localDateString(new Date());
      if (filter === 'upcoming') return reminder.date > localDateString(new Date());
      return true;
    }

    function render() {
      list.replaceChildren();
      const visibleReminders = reminders
        .filter(isVisible)
        .sort((a, b) => {
          const aDue = getDueTimestamp(a) ?? new Date(a.date + 'T23:59:59').getTime();
          const bDue = getDueTimestamp(b) ?? new Date(b.date + 'T23:59:59').getTime();
          return Number(a.completed) - Number(b.completed) || aDue - bDue || a.createdAt - b.createdAt;
        });

      visibleReminders.forEach((reminder) => {
        const row = document.createElement('article');
        const dueAt = getDueTimestamp(reminder);
        row.className = 'reminder-item' + (reminder.completed ? ' completed' : '') + (dueAt && dueAt < Date.now() ? ' overdue' : '');
        row.dataset.id = reminder.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'reminder-check';
        checkbox.checked = Boolean(reminder.completed);
        checkbox.setAttribute('aria-label', 'Mark ' + reminder.title + ' complete');
        checkbox.dataset.action = 'toggle';

        const copy = document.createElement('div');
        copy.className = 'reminder-task-copy';
        const title = document.createElement('p');
        title.className = 'reminder-task-title';
        title.textContent = reminder.title;
        const due = document.createElement('p');
        due.className = 'reminder-due';
        due.textContent = formatDue(reminder);
        copy.append(title, due);

        const badge = document.createElement('span');
        badge.className = 'reminder-state';
        badge.textContent = reminder.completed ? 'Done' : (reminder.notified ? 'Alert sent' : '');

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'reminder-delete';
        remove.dataset.action = 'delete';
        remove.setAttribute('aria-label', 'Delete ' + reminder.title);
        remove.title = 'Delete task';
        remove.textContent = '×';
        row.append(checkbox, copy, badge, remove);
        list.appendChild(row);
      });

      const activeCount = reminders.filter((reminder) => !reminder.completed).length;
      count.textContent = activeCount ? activeCount + ' task' + (activeCount === 1 ? '' : 's') + ' left' : (reminders.length ? 'All tasks complete' : 'No tasks yet');
      empty.classList.toggle('visible', visibleReminders.length === 0);
      empty.querySelector('p').textContent = reminders.length && filter === 'all' ? 'All done for now.' : (filter === 'today' ? 'Nothing planned for today.' : filter === 'upcoming' ? 'No upcoming tasks.' : filter === 'completed' ? 'No completed tasks yet.' : 'Your list is clear.');
    }

    function notifyDueReminders() {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = Date.now();
      let changed = false;
      reminders.forEach((reminder) => {
        const dueAt = getDueTimestamp(reminder);
        if (reminder.completed || reminder.notified || dueAt === null || dueAt > now) return;
        try {
          const notification = new Notification('Sorenity reminder', {
            body: reminder.title,
            tag: 'sorenity-reminder-' + reminder.id
          });
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (_) {
          setPermissionStatus('Your browser could not show this notification. The task remains in your list.', 'warning');
        }
        reminder.notified = true;
        changed = true;
      });
      if (changed) {
        saveReminders();
        render();
      }
    }

    permissionButton.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        updatePermissionStatus();
        return;
      }
      if (Notification.permission === 'granted') {
        updatePermissionStatus();
        return;
      }
      try {
        const result = await Notification.requestPermission();
        updatePermissionStatus();
        if (result === 'granted') {
          notifyDueReminders();
          if (window.app && window.app.showToast) window.app.showToast('Reminders notifications enabled');
        }
      } catch (_) {
        setPermissionStatus('Your browser could not request notification permission. Check its site settings.', 'warning');
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const titleInput = document.getElementById('reminder-title');
      const title = titleInput.value.trim();
      if (!title) return;
      reminders.push({
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
        title,
        date: dateInput.value || localDateString(new Date()),
        time: timeInput.value,
        completed: false,
        notified: false,
        createdAt: Date.now()
      });
      saveReminders();
      render();
      titleInput.value = '';
      titleInput.focus();
      notifyDueReminders();
    });

    list.addEventListener('change', (event) => {
      if (event.target.dataset.action !== 'toggle') return;
      const row = event.target.closest('.reminder-item');
      const reminder = reminders.find((item) => item.id === row.dataset.id);
      if (!reminder) return;
      reminder.completed = event.target.checked;
      saveReminders();
      render();
    });

    list.addEventListener('click', (event) => {
      if (event.target.dataset.action !== 'delete') return;
      const row = event.target.closest('.reminder-item');
      reminders = reminders.filter((item) => item.id !== row.dataset.id);
      saveReminders();
      render();
    });

    document.querySelectorAll('[data-reminder-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        filter = button.dataset.reminderFilter;
        document.querySelectorAll('[data-reminder-filter]').forEach((item) => item.classList.toggle('active', item === button));
        render();
      });
    });

    updatePermissionStatus();
    render();
    notifyDueReminders();
    timerId = window.setInterval(notifyDueReminders, 10000);
    window.addEventListener('focus', notifyDueReminders);
    window.addEventListener('pagehide', () => window.clearInterval(timerId), { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReminders);
  else initReminders();
})();
