/**
 * Causal Self — Storage & User Account Management Module
 * Handles multi-user isolation, profile management, and CRUD for logs & beliefs.
 */

const STORAGE_KEYS = {
  USERS: 'causal_self_users',
  ACTIVE_USER_ID: 'causal_self_active_user_id',
  THEME: 'causal_self_theme',
  FAVORITES: 'causal_self_favorites'
};

class CausalStorage {
  constructor() {
    this.initDefaultUserIfNone();
  }

  // ==========================================================================
  // User Profile Management
  // ==========================================================================

  getUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed reading users:', e);
      return [];
    }
  }

  saveUsers(users) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed saving users:', e);
    }
  }

  getActiveUserId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || 'usr_emmanuel';
  }

  setActiveUserId(userId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
  }

  getActiveUser() {
    const users = this.getUsers();
    const activeId = this.getActiveUserId();
    const found = users.find(u => u.id === activeId);
    if (found) return found;

    if (users.length > 0) {
      this.setActiveUserId(users[0].id);
      return users[0];
    }

    return this.initDefaultUserIfNone();
  }

  createUser(name, email = '') {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('User name cannot be empty');

    const users = this.getUsers();
    const newId = 'usr_' + Date.now();
    const colors = ['#3F6754', '#A46F38', '#42687A', '#6B5282', '#4B735B'];
    const avatarColor = colors[users.length % colors.length];

    const newUser = {
      id: newId,
      name: trimmed,
      email: email.trim(),
      avatarColor,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setActiveUserId(newId);
    return newUser;
  }

  renameActiveUser(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Profile name cannot be empty');
    const users = this.getUsers();
    const activeId = this.getActiveUserId();
    const user = users.find(item => item.id === activeId);
    if (!user) throw new Error('Active profile could not be found');
    user.name = trimmed;
    this.saveUsers(users);
    return user;
  }

  deleteUser(userId) {
    const users = this.getUsers();
    if (users.length <= 1) {
      throw new Error('At least one profile must remain.');
    }

    const deletedUser = users.find(user => user.id === userId);
    if (!deletedUser) throw new Error('Profile could not be found.');

    const remainingUsers = users.filter(user => user.id !== userId);
    this.saveUsers(remainingUsers);
    localStorage.removeItem(this.getUserLogsKey(userId));
    localStorage.removeItem(this.getUserBeliefsKey(userId));

    if (this.getActiveUserId() === userId) {
      this.setActiveUserId(remainingUsers[0].id);
    }

    return { deletedUser, activeUser: this.getActiveUser() };
  }

  initDefaultUserIfNone() {
    let users = this.getUsers();
    if (!users || users.length === 0) {
      const defaultUser = {
        id: 'usr_emmanuel',
        name: 'Emmanuel',
        email: 'emmanuel@causalself.app',
        avatarColor: '#3F6754',
        createdAt: new Date().toISOString()
      };
      users = [defaultUser];
      this.saveUsers(users);
      this.setActiveUserId('usr_emmanuel');
      // this.seedUserLogs('usr_emmanuel'); // Seed data disabled
      return defaultUser;
    }
    return this.getActiveUser();
  }

  // ==========================================================================
  // User-Scoped Daily Logs
  // ==========================================================================

  getUserLogsKey(userId) {
    const uid = userId || this.getActiveUserId();
    return `causal_self_${uid}_logs`;
  }

  getLogs(userId) {
    try {
      const key = this.getUserLogsKey(userId);
      const data = localStorage.getItem(key);
      const logs = data ? JSON.parse(data) : [];
      // Sort descending by date
      return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      console.error('Failed reading logs:', e);
      return [];
    }
  }

  saveLogs(logs, userId) {
    try {
      const key = this.getUserLogsKey(userId);
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed saving logs:', e);
    }
  }

  addOrUpdateLog(logData, userId) {
    const uid = userId || this.getActiveUserId();
    const logs = this.getLogs(uid);
    
    // Check if entry for this date already exists
    const existingIndex = logs.findIndex(l => l.date === logData.date);
    const newLog = {
      ...logData,
      id: logData.id || `log_${logData.date}_${Date.now()}`,
      userId: uid,
      timestamp: Date.now()
    };

    if (existingIndex > -1) {
      logs[existingIndex] = newLog;
    } else {
      logs.unshift(newLog);
    }

    this.saveLogs(logs, uid);
    return newLog;
  }

  deleteLog(logId, userId) {
    const uid = userId || this.getActiveUserId();
    let logs = this.getLogs(uid);
    logs = logs.filter(l => l.id !== logId);
    this.saveLogs(logs, uid);
  }

  // ==========================================================================
  // User-Scoped Beliefs
  // ==========================================================================

  getUserBeliefsKey(userId) {
    const uid = userId || this.getActiveUserId();
    return `causal_self_${uid}_beliefs`;
  }

  getBeliefs(userId) {
    try {
      const key = this.getUserBeliefsKey(userId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed reading beliefs:', e);
      return [];
    }
  }

  saveBeliefs(beliefs, userId) {
    try {
      const key = this.getUserBeliefsKey(userId);
      localStorage.setItem(key, JSON.stringify(beliefs));
    } catch (e) {
      console.error('Failed saving beliefs:', e);
    }
  }

  addBelief(beliefData, userId) {
    const uid = userId || this.getActiveUserId();
    const beliefs = this.getBeliefs(uid);
    const newBelief = {
      id: 'blf_' + Date.now(),
      userId: uid,
      createdAt: new Date().toISOString(),
      ...beliefData
    };
    beliefs.unshift(newBelief);
    this.saveBeliefs(beliefs, uid);
    return newBelief;
  }

  deleteBelief(beliefId, userId) {
    const uid = userId || this.getActiveUserId();
    let beliefs = this.getBeliefs(uid);
    beliefs = beliefs.filter(b => b.id !== beliefId);
    this.saveBeliefs(beliefs, uid);
  }

  getDefaultBeliefs(userId) {
    const defaults = [
      {
        id: 'blf_1',
        userId: userId || 'usr_emmanuel',
        hypothesis: 'Getting 7.5+ hours of sleep significantly improves my focus & flow state',
        causeVar: '7.5h+ Sleep',
        effectVar: 'Flow State',
        userExpectation: 'positive',
        notes: 'Noticeable difference in morning cognitive clarity after consistent sleep.'
      },
      {
        id: 'blf_2',
        userId: userId || 'usr_emmanuel',
        hypothesis: 'Drinking more than 2 coffees increases my evening anxiety and brain fog',
        causeVar: 'Coffee > 2',
        effectVar: 'Restless / Anxious',
        userExpectation: 'positive',
        notes: 'Excess caffeine late in the day seems to trigger restlessness.'
      },
      {
        id: 'blf_3',
        userId: userId || 'usr_emmanuel',
        hypothesis: 'Starting the morning with a walk & prayer creates higher daytime energy',
        causeVar: 'Morning Walk',
        effectVar: 'High Energy',
        userExpectation: 'positive',
        notes: 'Gentle aerobic movement and quiet reflection seem to stabilize mood all afternoon.'
      }
    ];
    this.saveBeliefs(defaults, userId);
    return defaults;
  }

  // ==========================================================================
  // Realistic Seed Logs (14 Days)
  // Provides immediate, rich data for Causal Discovery & Graph Visualization
  // ==========================================================================

  seedUserLogs(userId) {
    const uid = userId || this.getActiveUserId();
    const existing = this.getLogs(uid);
    if (existing && existing.length > 0) return; // Don't overwrite if logs already exist

    const seedLogs = [];
    const today = new Date();

    const sampleDays = [
      {
        daysAgo: 13,
        mood: 8,
        energy: 8,
        activities: ['Deep Work 3h', 'Gym Session', 'Reading'],
        inputs: ['7.5h+ Sleep', 'Coffee x2', 'Hydration 2L', 'Clean Diet'],
        people: ['Solo', 'Family'],
        outcomes: ['Flow State', 'High Energy', 'Calm Mind'],
        notes: 'Felt very clear-headed and focused today. Solid morning routine.'
      },
      {
        daysAgo: 12,
        mood: 7,
        energy: 7,
        activities: ['Deep Work 2h', 'Morning Walk'],
        inputs: ['7h Sleep', 'Coffee x2', 'Hydration 2L'],
        people: ['Colleagues'],
        outcomes: ['Completed Goal', 'Calm Mind'],
        notes: 'Collaborative meetings went smoothly. Balanced day.'
      },
      {
        daysAgo: 11,
        mood: 5,
        energy: 4,
        activities: ['Screen Time > 4h'],
        inputs: ['Sleep < 6h', 'Coffee > 2', 'Fast Food'],
        people: ['Solo'],
        outcomes: ['Brain Fog', 'Fatigue'],
        notes: 'Late night reading disrupted my rest. Felt sluggish in the afternoon.'
      },
      {
        daysAgo: 10,
        mood: 8,
        energy: 9,
        activities: ['Gym Session', 'Deep Work 3h', 'Meditation'],
        inputs: ['8h Sleep', 'Coffee x1', 'Hydration 2L', 'Clean Diet'],
        people: ['Close Friends'],
        outcomes: ['Flow State', 'High Energy', 'Joyful'],
        notes: 'Excellent workout followed by quiet deep work. Feeling renewed.'
      },
      {
        daysAgo: 9,
        mood: 6,
        energy: 6,
        activities: ['Reading', 'Deep Work 2h'],
        inputs: ['7h Sleep', 'Coffee x2'],
        people: ['Colleagues', 'Family'],
        outcomes: ['Calm Mind'],
        notes: 'Quiet steady progress on the project roadmap.'
      },
      {
        daysAgo: 8,
        mood: 4,
        energy: 4,
        activities: ['Screen Time > 4h'],
        inputs: ['Sleep < 6h', 'Coffee > 2'],
        people: ['Colleagues'],
        outcomes: ['Restless / Anxious', 'Brain Fog'],
        notes: 'Had three cups of coffee to push through deadlines; felt jittery.'
      },
      {
        daysAgo: 7,
        mood: 9,
        energy: 8,
        activities: ['Morning Walk', 'Gym Session', 'Reading'],
        inputs: ['7.5h+ Sleep', 'Coffee x1', 'Clean Diet', 'Hydration 2L'],
        people: ['Close Friends', 'Family'],
        outcomes: ['Flow State', 'Calm Mind', 'Joyful'],
        notes: 'Peaceful weekend balance with good community and nature.'
      },
      {
        daysAgo: 6,
        mood: 8,
        energy: 7,
        activities: ['Deep Work 3h', 'Meditation'],
        inputs: ['7.5h+ Sleep', 'Coffee x2', 'Hydration 2L'],
        people: ['Colleagues'],
        outcomes: ['Flow State', 'Completed Goal'],
        notes: 'Very productive focus block in the morning.'
      },
      {
        daysAgo: 5,
        mood: 7,
        energy: 8,
        activities: ['Gym Session', 'Morning Walk'],
        inputs: ['8h Sleep', 'Coffee x2', 'Clean Diet'],
        people: ['Solo'],
        outcomes: ['High Energy', 'Calm Mind'],
        notes: 'Great physical stamina throughout the day.'
      },
      {
        daysAgo: 4,
        mood: 5,
        energy: 5,
        activities: ['Screen Time > 4h'],
        inputs: ['6h Sleep', 'Coffee > 2', 'Fast Food'],
        people: ['Colleagues'],
        outcomes: ['Fatigue'],
        notes: 'Need to dial back screen exposure in the evenings.'
      },
      {
        daysAgo: 3,
        mood: 8,
        energy: 8,
        activities: ['Deep Work 3h', 'Gym Session', 'Reading'],
        inputs: ['7.5h+ Sleep', 'Coffee x1', 'Hydration 2L'],
        people: ['Close Friends'],
        outcomes: ['Flow State', 'High Energy'],
        notes: 'Solid mental stamina. Evening conversation was uplifting.'
      },
      {
        daysAgo: 2,
        mood: 8,
        energy: 7,
        activities: ['Morning Walk', 'Deep Work 2h', 'Meditation'],
        inputs: ['7.5h+ Sleep', 'Coffee x2', 'Clean Diet'],
        people: ['Family'],
        outcomes: ['Calm Mind', 'Completed Goal'],
        notes: 'Mindful pacing prevented any rush or burnout.'
      },
      {
        daysAgo: 1,
        mood: 7,
        energy: 8,
        activities: ['Gym Session', 'Reading'],
        inputs: ['7h Sleep', 'Coffee x2', 'Hydration 2L'],
        people: ['Colleagues'],
        outcomes: ['Flow State', 'High Energy'],
        notes: 'Good momentum leading into today.'
      }
    ];

    sampleDays.forEach(s => {
      const d = new Date(today);
      d.setDate(today.getDate() - s.daysAgo);
      const dateStr = d.toISOString().split('T')[0];

      seedLogs.push({
        id: `log_${dateStr}_seed`,
        userId: uid,
        date: dateStr,
        timestamp: d.getTime(),
        mood: s.mood,
        energy: s.energy,
        activities: s.activities,
        inputs: s.inputs,
        people: s.people,
        outcomes: s.outcomes,
        notes: s.notes
      });
    });

    this.saveLogs(seedLogs, uid);
  }
}

// Global singleton instance
window.causalStorage = new CausalStorage();
