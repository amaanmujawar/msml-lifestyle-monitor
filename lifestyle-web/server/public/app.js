const state = {
  token: null,
  user: null,
  charts: {},
};

const loginForm = document.getElementById('loginForm');
const loginPanel = document.getElementById('loginPanel');
const loginFeedback = document.getElementById('loginFeedback');
const dashboard = document.getElementById('dashboard');
const greeting = document.getElementById('greeting');
const readinessHeadline = document.getElementById('readinessHeadline');
const profileCard = document.getElementById('profileCard');

const formatNumber = (value) => Intl.NumberFormat().format(value);
const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));

loginForm.addEventListener('submit', async (event) => {
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

    if (!response.ok) {
      throw new Error('Invalid email or password.');
    }

    const payload = await response.json();
    state.token = payload.token;
    state.user = payload.user;

    personalizeDashboard(payload.user);
    await loadMetrics();

    loginPanel.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loginFeedback.textContent = '';
  } catch (error) {
    loginFeedback.textContent = error.message;
  }
});

async function loadMetrics() {
  const response = await fetch('/api/metrics', {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    loginFeedback.textContent = 'Unable to fetch metrics.';
    return;
  }

  const metrics = await response.json();
  renderSummary(metrics.summary);
  renderHydration(metrics.hydration);
  renderHeartRate(metrics.heartRateZones);
  renderSleep(metrics.sleepStages);
  updateCharts(metrics);
}

function personalizeDashboard(user) {
  greeting.textContent = `Hello ${user.name.split(' ')[0]}`;
  const goalSteps = user.goal_steps ? `${formatNumber(user.goal_steps)} steps` : 'Custom goals';
  readinessHeadline.textContent = `${user.role} • ${goalSteps}`;

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
    <p class="muted">${user.email}</p>
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
