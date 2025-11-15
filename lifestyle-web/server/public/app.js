const state = {
  token: null,
  user: null,
  charts: {},
  viewing: null,
  subject: null,
  roster: [],
};

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginPanel = document.getElementById('loginPanel');
const loginFeedback = document.getElementById('loginFeedback');
const signupFeedback = document.getElementById('signupFeedback');
const dashboard = document.getElementById('dashboard');
const greeting = document.getElementById('greeting');
const readinessHeadline = document.getElementById('readinessHeadline');
const profileCard = document.getElementById('profileCard');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const sideNav = document.getElementById('sideNav');
const pageContainers = document.querySelectorAll('[data-subpage]');
const authTabs = document.getElementById('authTabs');
const logoutButton = document.getElementById('logoutButton');
const avatarValueInput = document.getElementById('avatarValue');
const customAvatarInput = document.getElementById('customAvatarInput');
const avatarOptionButtons = Array.from(document.querySelectorAll('[data-avatar-option]'));
const coachPanel = document.getElementById('coachPanel');
const coachRanking = document.getElementById('coachRanking');
const athleteSwitcher = document.getElementById('athleteSwitcher');
const viewingChip = document.getElementById('viewingChip');
const sharePanel = document.getElementById('sharePanel');
const shareForm = document.getElementById('shareForm');
const shareEmailInput = document.getElementById('shareEmail');
const shareFeedback = document.getElementById('shareFeedback');
const adminFeedback = document.getElementById('adminFeedback');

const formatNumber = (value) => Intl.NumberFormat().format(value);
const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));

const pageCopy = {
  overview: {
    title: 'Daily Readiness + Fuel',
    subtitle: 'Live snapshot of movement, fuel, and recovery.',
  },
  sessions: {
    title: 'Session Planner',
    subtitle: 'Blend intensity and skill work with guardrails from your data.',
  },
  readiness: {
    title: 'Readiness Signals',
    subtitle: 'Monitor stress, sleep, and adaptation trends.',
  },
  nutrition: {
    title: 'Fuel & Hydration',
    subtitle: 'Macro ratios and hydration rhythm for the current block.',
  },
};

let activeAuthMode = 'login';
let lastPresetAvatar = avatarValueInput?.value || '';
const normalizeRole = (role = '') => String(role).trim().toLowerCase();
const hasCoachPermissions = (role = '') => normalizeRole(role).includes('coach');
const isHeadCoachRole = (role = '') => normalizeRole(role).includes('head coach');

function setAuthMode(mode = 'login') {
  activeAuthMode = mode;
  document.querySelectorAll('[data-auth-mode]').forEach((button) => {
    const isActive = button.dataset.authMode === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  loginForm?.classList.toggle('hidden', mode !== 'login');
  signupForm?.classList.toggle('hidden', mode !== 'signup');

  if (loginFeedback) loginFeedback.textContent = '';
  if (signupFeedback) signupFeedback.textContent = '';
}

function setAvatarValue(value) {
  if (avatarValueInput) {
    avatarValueInput.value = value;
  }
}

function setActiveAvatarButton(target) {
  avatarOptionButtons.forEach((button) => {
    button.classList.toggle('active', button === target);
  });
}

function initializeAvatarPicker() {
  if (!avatarOptionButtons.length) {
    return;
  }

  avatarOptionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.avatarOption || '';
      if (value === 'custom') {
        setActiveAvatarButton(button);
        customAvatarInput?.focus();
        const typed = customAvatarInput?.value.trim();
        setAvatarValue(typed);
        return;
      }

      lastPresetAvatar = value;
      setAvatarValue(value);
      if (customAvatarInput) {
        customAvatarInput.value = '';
      }
      setActiveAvatarButton(button);
    });
  });

  customAvatarInput?.addEventListener('input', (event) => {
    const value = event.target.value.trim();
    const customButton = avatarOptionButtons.find((btn) => btn.dataset.avatarOption === 'custom');
    if (value) {
      setAvatarValue(value);
      if (customButton) {
        setActiveAvatarButton(customButton);
      }
      return;
    }

    if (lastPresetAvatar) {
      const fallbackButton = avatarOptionButtons.find(
        (btn) => btn.dataset.avatarOption === lastPresetAvatar
      );
      if (fallbackButton) {
        setAvatarValue(lastPresetAvatar);
        setActiveAvatarButton(fallbackButton);
      }
    }
  });
}

function updateViewingChip(subject) {
  if (!viewingChip) return;
  if (!subject || !state.user) {
    viewingChip.textContent = 'Viewing your own performance';
    return;
  }
  viewingChip.textContent =
    subject.id === state.user.id
      ? 'Viewing your own performance'
      : `Viewing ${subject.name}'s performance`;
}

function updateSubjectContext(subject) {
  if (!subject) return;
  state.subject = subject;
  const goalSteps = subject.goal_steps ? `${formatNumber(subject.goal_steps)} steps` : 'Custom goals';
  readinessHeadline.textContent = `${subject.role || 'Athlete'} • ${goalSteps}`;
  updateViewingChip(subject);
}

function updateSharePanelVisibility(user) {
  if (!sharePanel) return;
  const showShare = user && !hasCoachPermissions(user.role);
  sharePanel.classList.toggle('hidden', !showShare);
  if (!showShare && shareFeedback) {
    shareFeedback.textContent = '';
  }
  if (!showShare) {
    shareForm?.reset();
  }
}

function setAdminFeedback(message = '') {
  if (adminFeedback) {
    adminFeedback.textContent = message;
  }
}

async function handleAdminAction(action, userId) {
  if (!userId || !state.user || !isHeadCoachRole(state.user.role)) {
    return;
  }

  const prompts = {
    promote: {
      confirm: 'Promote this member to Coach?',
      pending: 'Promoting member...',
      success: 'Member promoted to Coach.',
    },
    demote: {
      confirm: 'Demote this coach back to Athlete?',
      pending: 'Demoting coach...',
      success: 'Coach demoted to Athlete.',
    },
    delete: {
      confirm: 'Delete this account and all related data? This cannot be undone.',
      pending: 'Deleting account...',
      success: 'Account deleted.',
    },
  };

  const meta = prompts[action];
  if (!meta) return;

  const confirmed =
    typeof window !== 'undefined' ? window.confirm(meta.confirm) : true;
  if (!confirmed) return;

  setAdminFeedback(meta.pending);

  try {
    if (action === 'delete') {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${state.token}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Unable to delete account.');
      }
      setAdminFeedback(meta.success);
    } else {
      const endpoint = action === 'promote' ? '/api/admin/promote' : '/api/admin/demote';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        throw new Error(payload?.message || 'Unable to update member.');
      }
      setAdminFeedback(payload.message || meta.success);
    }
    await fetchRoster();
  } catch (error) {
    setAdminFeedback(error.message);
  }
}

function highlightRanking(athleteId) {
  if (!coachRanking) return;
  coachRanking.querySelectorAll('li').forEach((item) => {
    const isActive = athleteId && item.dataset.athleteId === String(athleteId);
    item.classList.toggle('active', Boolean(isActive));
  });
}

function renderCoachPanel() {
  if (!athleteSwitcher || !coachRanking) return;

  athleteSwitcher.innerHTML = '<option value="self">My dashboard</option>';
  state.roster.forEach((athlete) => {
    if (!state.user || athlete.id === state.user.id) {
      return;
    }
    const option = document.createElement('option');
    option.value = String(athlete.id);
    option.textContent = athlete.name;
    athleteSwitcher.appendChild(option);
  });

  const selectedValue =
    state.viewing && state.viewing.id !== state.user.id ? String(state.viewing.id) : 'self';
  athleteSwitcher.value = selectedValue;

  coachRanking.innerHTML = '';
  state.roster.forEach((athlete) => {
    const readinessLabel =
      typeof athlete.readinessScore === 'number' ? `${athlete.readinessScore}%` : '—';
    const stepsLabel = athlete.steps ? `${formatNumber(athlete.steps)} steps` : 'Awaiting sync';
    const avatarMarkup = athlete.avatar_url
      ? `<img class="coach-avatar" src="${athlete.avatar_url}" alt="${athlete.name}" />`
      : '<div class="coach-avatar fallback"></div>';
    const isHeadCoachUser = isHeadCoachRole(state.user?.role);
    const targetIsHeadCoach = isHeadCoachRole(athlete.role);
    const targetIsCoach = hasCoachPermissions(athlete.role) && !targetIsHeadCoach;
    let adminControls = '';
    if (isHeadCoachUser && athlete.id !== state.user.id && !targetIsHeadCoach) {
      const promoteButton = !targetIsCoach
        ? `<button type="button" class="promote-btn" data-admin-action="promote" data-user-id="${athlete.id}">Promote</button>`
        : '';
      const demoteButton = targetIsCoach
        ? `<button type="button" class="demote-btn" data-admin-action="demote" data-user-id="${athlete.id}">Demote</button>`
        : '';
      const deleteButton = `<button type="button" class="danger-btn" data-admin-action="delete" data-user-id="${athlete.id}">Delete</button>`;
      adminControls = `
        <div class="admin-inline">
          ${promoteButton}
          ${demoteButton}
          ${deleteButton}
        </div>
      `;
    }
    const li = document.createElement('li');
    li.dataset.athleteId = String(athlete.id);
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    if (state.viewing && state.viewing.id === athlete.id) {
      li.classList.add('active');
    }
    li.innerHTML = `
      <span class="rank-pill">${athlete.rank}</span>
      ${avatarMarkup}
      <div class="athlete-info">
        <h4>${athlete.name}</h4>
        <p>${athlete.role || 'Athlete'} • ${stepsLabel}</p>
        ${adminControls}
      </div>
      <span class="score">${readinessLabel}</span>
    `;
    coachRanking.appendChild(li);
  });
}

async function fetchRoster() {
  if (!coachPanel) return;
  try {
    const response = await fetch('/api/athletes', {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    if (!response.ok) {
      throw new Error('Unable to load athletes.');
    }
    const payload = await response.json();
    state.roster = payload.athletes || [];

    if (!state.roster.length) {
      coachPanel.classList.add('hidden');
      if (coachRanking) {
        coachRanking.innerHTML = '';
      }
      if (athleteSwitcher) {
        athleteSwitcher.innerHTML = '<option value="self">My dashboard</option>';
        athleteSwitcher.value = 'self';
      }
      state.viewing = state.user;
      highlightRanking(null);
      setAdminFeedback('');
      return;
    }

    coachPanel.classList.remove('hidden');

    if (!state.viewing) {
      state.viewing = state.user;
    } else if (state.viewing.id !== state.user.id) {
      const match = state.roster.find((athlete) => athlete.id === state.viewing.id);
      state.viewing = match || state.user;
    }

    renderCoachPanel();
    const activeId =
      state.viewing && state.viewing.id !== state.user.id ? state.viewing.id : null;
    highlightRanking(activeId);
  } catch (error) {
    coachPanel.classList.add('hidden');
    state.roster = [];
    state.viewing = state.user;
    highlightRanking(null);
    setAdminFeedback(error.message);
  }
}

function handleAthleteSelection(selection) {
  if (!state.user) return;
  if (!selection || selection === 'self') {
    state.viewing = state.user;
    updateSubjectContext(state.user);
    highlightRanking(null);
    if (athleteSwitcher) {
      athleteSwitcher.value = 'self';
    }
    loadMetrics();
    return;
  }

  const athlete = state.roster.find((item) => String(item.id) === String(selection));
  if (!athlete) {
    return;
  }
  state.viewing = athlete;
  updateSubjectContext(athlete);
  highlightRanking(athlete.id);
  if (athleteSwitcher) {
    athleteSwitcher.value = String(athlete.id);
  }
  loadMetrics(athlete.id);
}
function setActivePage(targetPage = 'overview') {
  document.querySelectorAll('#sideNav [data-page]').forEach((button) => {
    const isActive = button.dataset.page === targetPage;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  pageContainers.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.subpage !== targetPage);
  });

  const copy = pageCopy[targetPage] || pageCopy.overview;
  if (pageTitle) pageTitle.textContent = copy.title;
  if (pageSubtitle) pageSubtitle.textContent = copy.subtitle;
}

function resetToAuth(message = '') {
  state.token = null;
  state.user = null;
  state.viewing = null;
  state.subject = null;
  state.roster = [];
  dashboard.classList.add('hidden');
  loginPanel.classList.remove('hidden');
  setActivePage('overview');
  setAuthMode('login');
  loginForm?.reset();
  signupForm?.reset();
  if (avatarOptionButtons.length) {
    const defaultButton = avatarOptionButtons.find(
      (button) => button.dataset.avatarOption !== 'custom'
    );
    if (defaultButton) {
      lastPresetAvatar = defaultButton.dataset.avatarOption;
      setAvatarValue(lastPresetAvatar);
      setActiveAvatarButton(defaultButton);
    }
  }
  if (customAvatarInput) {
    customAvatarInput.value = '';
  }
  if (coachPanel) {
    coachPanel.classList.add('hidden');
  }
  if (coachRanking) {
    coachRanking.innerHTML = '';
  }
  if (athleteSwitcher) {
    athleteSwitcher.innerHTML = '<option value="self">My dashboard</option>';
    athleteSwitcher.value = 'self';
  }
  updateViewingChip(null);
  updateSharePanelVisibility(null);
  setAdminFeedback('');
  if (loginFeedback) loginFeedback.textContent = message;
  if (signupFeedback) signupFeedback.textContent = '';
}

if (sideNav) {
  sideNav.addEventListener('click', (event) => {
    const target = event.target.closest('[data-page]');
    if (!target) return;
    setActivePage(target.dataset.page);
  });
}

setActivePage('overview');
if (authTabs) {
  authTabs.addEventListener('click', (event) => {
    const target = event.target.closest('[data-auth-mode]');
    if (!target) return;
    setAuthMode(target.dataset.authMode);
  });
}
setAuthMode('login');
initializeAvatarPicker();
athleteSwitcher?.addEventListener('change', (event) =>
  handleAthleteSelection(event.target.value)
);
const handleRankingSelection = (target) => {
  if (!target) return;
  const selectedId = target.dataset.athleteId;
  const value = selectedId === String(state.user?.id) ? 'self' : selectedId;
  handleAthleteSelection(value);
  if (athleteSwitcher && value) {
    athleteSwitcher.value = value;
  }
};

coachRanking?.addEventListener('click', (event) => {
  const adminButton = event.target.closest('[data-admin-action]');
  if (adminButton) {
    event.stopPropagation();
    handleAdminAction(adminButton.dataset.adminAction, adminButton.dataset.userId);
    return;
  }
  const target = event.target.closest('[data-athlete-id]');
  handleRankingSelection(target);
});

coachRanking?.addEventListener('keydown', (event) => {
  const adminButton = event.target.closest('[data-admin-action]');
  if (adminButton && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    handleAdminAction(adminButton.dataset.adminAction, adminButton.dataset.userId);
    return;
  }
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target.closest('[data-athlete-id]');
  if (!target) return;
  event.preventDefault();
  handleRankingSelection(target);
});

shareForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!shareEmailInput) return;
  const coachEmail = shareEmailInput.value.trim();
  if (!coachEmail) {
    shareFeedback.textContent = 'Enter a coach email.';
    return;
  }
  if (shareFeedback) {
    shareFeedback.textContent = 'Sending access...';
  }
  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({ coachEmail }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      throw new Error(payload?.message || 'Unable to share access.');
    }
    if (shareFeedback) {
      shareFeedback.textContent = payload.message;
    }
    shareForm.reset();
  } catch (error) {
    if (shareFeedback) {
      shareFeedback.textContent = error.message;
    }
  }
});

promoteButton?.addEventListener('click', promoteSelectedUser);
deleteButton?.addEventListener('click', deleteSelectedUser);
logoutButton?.addEventListener('click', handleLogout);

async function completeAuthentication(session) {
  if (!session || !session.token || !session.user) {
    throw new Error('Invalid session payload.');
  }

  state.token = session.token;
  state.user = session.user;
  state.viewing = session.user;
  state.subject = session.user;

  personalizeDashboard(session.user);
  updateSharePanelVisibility(session.user);
  updateSubjectContext(session.user);
  await fetchRoster();
  await loadMetrics();

  loginPanel.classList.add('hidden');
  dashboard.classList.remove('hidden');
  loginForm?.reset();
  signupForm?.reset();
  if (loginFeedback) loginFeedback.textContent = '';
  if (signupFeedback) signupFeedback.textContent = '';
}

async function handleLogout(event) {
  if (event) {
    event.preventDefault();
  }

  if (!state.token) {
    resetToAuth();
    return;
  }

  try {
    await fetch('/api/login/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${state.token}`,
      },
    });
  } catch (error) {
    // no-op: even if the request fails we still clear local state
  } finally {
    resetToAuth('You have been signed out.');
  }
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const email = formData.get('email');
  const password = formData.get('password');

  loginFeedback.textContent = 'Signing you in...';

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      const errorMessage = payload?.message || 'Invalid email or password.';
      throw new Error(errorMessage);
    }

    loginFeedback.textContent = '';
    await completeAuthentication(payload);
  } catch (error) {
    loginFeedback.textContent = error.message;
  }
});

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = data.get('name');
  const email = data.get('email');
  const password = data.get('password');
  const avatar = data.get('avatar');

  if (signupFeedback) {
    signupFeedback.textContent = 'Creating your account...';
  }

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, avatar }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      const fallback = payload?.message || 'Unable to create your account right now.';
      throw new Error(fallback);
    }

    if (signupFeedback) {
      signupFeedback.textContent = '';
    }
    await completeAuthentication(payload);
  } catch (error) {
    if (signupFeedback) {
      signupFeedback.textContent = error.message;
    }
  }
});

async function loadMetrics(subjectOverrideId) {
  if (!state.user) return;
  const targetId = subjectOverrideId ?? state.viewing?.id ?? state.user.id;
  const query =
    targetId && targetId !== state.user.id ? `?athleteId=${encodeURIComponent(targetId)}` : '';

  const response = await fetch(`/api/metrics${query}`, {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      resetToAuth('Session expired. Please log in again.');
    } else if (response.status === 403) {
      handleAthleteSelection('self');
      if (loginFeedback) {
        loginFeedback.textContent = 'Access revoked for that athlete.';
      }
    } else if (response.status === 404) {
      handleAthleteSelection('self');
      if (loginFeedback) {
        loginFeedback.textContent = 'That athlete is no longer available.';
      }
    } else if (loginFeedback) {
      loginFeedback.textContent = 'Unable to fetch metrics.';
    }
    return;
  }

  const metrics = await response.json();
  if (metrics.subject) {
    updateSubjectContext(metrics.subject);
    if (metrics.subject.id !== state.user.id) {
      state.viewing = metrics.subject;
      highlightRanking(metrics.subject.id);
    } else {
      highlightRanking(null);
    }
  } else if (state.viewing) {
    updateSubjectContext(state.viewing);
  }
  renderSummary(metrics.summary);
  renderHydration(metrics.hydration);
  renderHeartRate(metrics.heartRateZones);
  renderSleep(metrics.sleepStages);
  renderSessions(metrics.timeline);
  renderReadinessDetails(metrics.readiness);
  renderNutritionDetails(metrics.macros, metrics.hydration);
  updateCharts(metrics);
}

function personalizeDashboard(user) {
  const displayName = (user.name || '').trim() || 'there';
  greeting.textContent = `Hello ${displayName}`;

  profileCard.innerHTML = '';

  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.alt = user.name;
  if (user.avatar_url) {
    avatar.src = user.avatar_url;
  } else {
    avatar.style.background = 'var(--gradient)';
  }
  avatar.onerror = () => {
    avatar.removeAttribute('src');
    avatar.style.background = 'var(--gradient)';
  };

  const info = document.createElement('div');
  info.innerHTML = `
    <p class="label">${user.role}</p>
    <h3>${user.name}</h3>
  `;

  profileCard.appendChild(avatar);
  profileCard.appendChild(info);
}

function renderSummary(summary) {
  if (!summary) return;

  document.getElementById('stepsValue').textContent = `${formatNumber(summary.steps)} steps`;
  document.getElementById('caloriesValue').textContent = `${formatNumber(summary.calories)} kcal`;
  document.getElementById('sleepValue').textContent = `${summary.sleepHours.toFixed(1)} hrs`;
  document.getElementById('readinessValue').textContent = `${summary.readiness}%`;

  document.getElementById('stepsTrend').textContent = 'Pacing above goal';
  document.getElementById('caloriesTrend').textContent = 'Fuel match optimal';
  document.getElementById('sleepTrend').textContent = 'Sleep rhythm steady';
  document.getElementById('readinessTrend').textContent = 'Recovery trending up';
}

function renderHydration(entries = []) {
  const list = document.getElementById('hydrationList');
  list.innerHTML = '';
  entries.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${formatDate(item.date)}</span><span>${item.ounces} oz</span>`;
    list.appendChild(li);
  });
}

function renderHeartRate(zones = []) {
  const list = document.getElementById('heartRateList');
  list.innerHTML = '';
  zones.forEach((zone) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${zone.zone}</span><span>${zone.minutes} min</span>`;
    list.appendChild(li);
  });
}

function renderSleep(sleepStages) {
  if (!sleepStages) return;
  const container = document.getElementById('sleepSummary');
  container.innerHTML = '';
  ['deep', 'rem', 'light'].forEach((stage) => {
    const row = document.createElement('div');
    row.innerHTML = `<span>${stage.toUpperCase()}</span><span>${sleepStages[stage]} min</span>`;
    container.appendChild(row);
  });
}

function updateCharts(data) {
  renderActivityChart(data.timeline);
  renderMacroChart(data.macros);
  renderReadinessChart(data.readiness);
}

function renderActivityChart(timeline = []) {
  const ctx = document.getElementById('activityChart').getContext('2d');
  const labels = timeline.map((entry) => formatDate(entry.date));
  const steps = timeline.map((entry) => entry.steps);
  const calories = timeline.map((entry) => entry.calories);

  state.charts.activity?.destroy();
  state.charts.activity = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Steps',
          data: steps,
          borderColor: '#4df5ff',
          backgroundColor: 'rgba(77, 245, 255, 0.15)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Calories',
          data: calories,
          borderColor: '#a95dff',
          borderDash: [6, 4],
          tension: 0.4,
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: '#dfe6ff' } } },
      scales: {
        x: { ticks: { color: '#9bb0d6' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#9bb0d6' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      },
    },
  });
}

function renderMacroChart(macros) {
  if (!macros) return;
  const ctx = document.getElementById('macroChart').getContext('2d');
  state.charts.macros?.destroy();
  state.charts.macros = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Protein', 'Carbs', 'Fats'],
      datasets: [
        {
          data: [macros.protein, macros.carbs, macros.fats],
          backgroundColor: ['#27d2fe', '#5f6bff', '#a95dff'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { color: '#dfe6ff' } },
      },
    },
  });
}

function renderReadinessChart(readiness = []) {
  const ctx = document.getElementById('readinessChart').getContext('2d');
  const labels = readiness.map((entry) => formatDate(entry.date));
  const scores = readiness.map((entry) => entry.readiness);

  state.charts.readiness?.destroy();
  state.charts.readiness = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Readiness',
          data: scores,
          backgroundColor: scores.map((score) =>
            score >= 85 ? 'rgba(77, 245, 255, 0.7)' : 'rgba(169, 93, 255, 0.6)'
          ),
          borderRadius: 12,
          borderSkipped: false,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#9bb0d6' }, grid: { display: false } },
        y: {
          ticks: { color: '#9bb0d6' },
          suggestedMin: 60,
          suggestedMax: 100,
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
      },
    },
  });
}

function renderSessions(timeline = []) {
  const list = document.getElementById('sessionsList');
  const summary = document.getElementById('sessionsSummary');
  if (!list) return;

  list.innerHTML = '';

  const recentSessions = timeline.slice(-5).reverse();
  if (!recentSessions.length) {
    const li = document.createElement('li');
    li.className = 'session-item';
    li.innerHTML = '<p class="muted">No sessions logged yet.</p>';
    list.appendChild(li);
    if (summary) {
      summary.textContent = 'Sessions will populate once your tracker syncs activity.';
    }
    return;
  }

  let cumulativeLoad = 0;

  recentSessions.forEach((entry) => {
    const load = Math.round(entry.calories / 12 + entry.steps / 500);
    cumulativeLoad += load;
    const li = document.createElement('li');
    li.className = 'session-item';
    const effort =
      load >= 40 ? 'High output day' : load >= 25 ? 'Solid aerobic effort' : 'Recovery biased';
    li.innerHTML = `
      <div>
        <p class="session-title">${formatDate(entry.date)}</p>
        <p class="muted">${effort}</p>
      </div>
      <div class="session-metrics">
        <span>${formatNumber(entry.steps)} steps</span>
        <span>${formatNumber(entry.calories)} kcal</span>
      </div>
    `;
    list.appendChild(li);
  });

  if (summary) {
    const avgLoad = Math.round(cumulativeLoad / recentSessions.length);
    summary.textContent =
      avgLoad >= 40
        ? 'Dial in parasympathetic work—pair tough days with breath work or easy spins.'
        : avgLoad >= 25
        ? 'Load is balanced. Keep two intensity waves and anchor sleep before peak sessions.'
        : 'Volume is light. Layer in one longer aerobic builder plus a short strength primer.';
  }
}

function renderReadinessDetails(entries = []) {
  const grid = document.getElementById('readinessGrid');
  const notes = document.getElementById('readinessNotes');
  if (!grid || !notes) return;

  grid.innerHTML = '';
  notes.innerHTML = '';

  if (!entries.length) {
    notes.innerHTML = '<li class="muted">No readiness data yet.</li>';
    return;
  }

  const recent = entries.slice(-4).reverse();
  recent.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'readiness-card';
    const cue =
      entry.readiness >= 85 ? 'Prime' : entry.readiness >= 70 ? 'Hold steady' : 'Recovery bias';
    card.innerHTML = `
      <p class="muted">${formatDate(entry.date)}</p>
      <h3>${entry.readiness}%</h3>
      <p class="trend">${cue}</p>
    `;
    grid.appendChild(card);
  });

  const latest = recent[0];
  const earliest = recent[recent.length - 1];
  const delta = latest.readiness - earliest.readiness;

  const primaryNote = document.createElement('li');
  primaryNote.textContent =
    latest.readiness >= 85
      ? 'Green window for quality work—stack intervals or a heavy lift.'
      : latest.readiness >= 70
      ? 'Solid readiness. Keep fuel and mobility on point.'
      : 'Flagged readiness—bias easy aerobic work and prioritize sleep.';
  notes.appendChild(primaryNote);

  const trendNote = document.createElement('li');
  trendNote.textContent =
    delta === 0
      ? 'Trend is flat; lean on hydration and evening routines to nudge it upward.'
      : delta > 0
      ? `Up ${delta} pts over the window—add load gradually to capture the upswing.`
      : `Down ${Math.abs(delta)} pts—pull back loading until HRV normalizes.`;
  notes.appendChild(trendNote);
}

function renderNutritionDetails(macros, hydration = []) {
  const macroBreakdown = document.getElementById('macroBreakdown');
  const hydrationStats = document.getElementById('hydrationStats');

  if (macroBreakdown) {
    macroBreakdown.innerHTML = '';
    if (!macros) {
      macroBreakdown.innerHTML = '<p class="muted">Macro targets not set for this athlete.</p>';
    } else {
      const keys = ['protein', 'carbs', 'fats'];
      const total = keys.reduce((sum, key) => sum + (Number(macros[key]) || 0), 0) || 1;
      keys.forEach((key) => {
        const value = Number(macros[key]) || 0;
        const percent = Math.round((value / total) * 100);
        const row = document.createElement('div');
        row.className = 'macro-row';
        row.innerHTML = `
          <span class="label">${key.toUpperCase()}</span>
          <div class="macro-bar"><span style="width:${percent}%;"></span></div>
          <span class="macro-value">${value} g</span>
        `;
        macroBreakdown.appendChild(row);
      });
    }
  }

  if (hydrationStats) {
    hydrationStats.innerHTML = '';
    if (!hydration.length) {
      hydrationStats.innerHTML = '<p class="muted">Hydration log is empty.</p>';
      return;
    }

    const total = hydration.reduce((sum, entry) => sum + entry.ounces, 0);
    const avg = Math.round(total / hydration.length);
    const lastEntry = hydration[hydration.length - 1];
    hydrationStats.innerHTML = `
      <p class="label">7-day total</p>
      <h3>${formatNumber(total)} oz</h3>
      <p class="label">Daily rhythm</p>
      <p class="muted">${avg} oz avg • Last logged: ${formatDate(lastEntry.date)}</p>
    `;
  }
}
