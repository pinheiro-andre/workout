const app = document.getElementById('app');
const title = document.getElementById('title');
const backBtn = document.getElementById('backBtn');
const resetBtn = document.getElementById('resetBtn');

const STORAGE_KEY = 'workout-checks-v1';
const NAV_KEY = 'workout-nav-v1';
const IMG_BASE = 'https://cdn.jsdelivr.net/npm/@bryllim/workout-guide@1.0.0/assets';

let data = null;
let view = { screen: 'weeks', week: null, day: null };

function loadChecks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveChecks(checks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
}
function checkKey(week, day) {
  const today = new Date().toISOString().slice(0, 10);
  return `${week}__${day}__${today}`;
}

function saveNav() {
  localStorage.setItem(NAV_KEY, JSON.stringify(view));
}
function loadNav() {
  try { return JSON.parse(localStorage.getItem(NAV_KEY)); }
  catch { return null; }
}

function weekLabel(key) {
  return key.replace('Semaine_', 'Semaine ');
}

function dayProgress(week, day) {
  const checks = loadChecks()[checkKey(week, day)] || {};
  const total = data[week][day].length;
  const done = Object.values(checks).filter(Boolean).length;
  return { done, total };
}

function render() {
  backBtn.hidden = view.screen === 'weeks';
  resetBtn.hidden = view.screen !== 'day';

  if (view.screen === 'weeks') {
    title.textContent = 'Mes Séances';
    renderWeeks();
  } else if (view.screen === 'days') {
    title.textContent = weekLabel(view.week);
    renderDays();
  } else if (view.screen === 'day') {
    title.textContent = view.day.charAt(0) + view.day.slice(1).toLowerCase();
    renderDay();
  }
}

function renderWeeks() {
  const weeks = Object.keys(data);
  app.innerHTML = `<div class="section-label">Choisis ta semaine</div><div class="grid" id="grid"></div>`;
  const grid = document.getElementById('grid');
  weeks.forEach(week => {
    const days = Object.keys(data[week]);
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    btn.innerHTML = `${weekLabel(week)}<span class="sub">${days.length} séances</span><span class="chevron">›</span>`;
    btn.onclick = () => { view = { screen: 'days', week, day: null }; saveNav(); render(); };
    grid.appendChild(btn);
  });
}

function renderDays() {
  const days = Object.keys(data[view.week]);
  app.innerHTML = `<div class="section-label">${weekLabel(view.week)}</div><div class="grid" id="grid"></div>`;
  const grid = document.getElementById('grid');
  days.forEach(day => {
    const { done, total } = dayProgress(view.week, day);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    const label = day.charAt(0) + day.slice(1).toLowerCase();
    btn.innerHTML = `
      <div class="row-flex">
        <span class="day-badge">${label.slice(0, 3)}</span>
        <div style="flex:1">
          ${label}
          <span class="sub">${data[view.week][day].length} exercices · ${done}/${total} faits</span>
        </div>
        <span class="chevron">›</span>
      </div>
      <div class="progress"><span style="width:${pct}%"></span></div>
    `;
    btn.onclick = () => { view = { screen: 'day', week: view.week, day }; saveNav(); render(); };
    grid.appendChild(btn);
  });
}

function renderDay() {
  const exercises = data[view.week][view.day];
  const checks = loadChecks();
  const key = checkKey(view.week, view.day);
  const dayChecks = checks[key] || {};

  app.innerHTML = `<div class="section-label">${weekLabel(view.week)}</div><div class="grid" id="grid"></div><p class="attribution">Illustrations : Everkinetic / Bryl Lim, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a></p>`;
  const grid = document.getElementById('grid');

  exercises.forEach((ex, i) => {
    const isWarmup = ex.ordre.toLowerCase().includes('échauffement');
    const isChecked = !!dayChecks[i];
    const card = document.createElement('div');
    card.className = `exo-card ${isWarmup ? 'warmup' : ''} ${isChecked ? 'done' : ''}`;
    const img = ex.slug
      ? `<img class="exo-img" src="${IMG_BASE}/${ex.slug}/frame-1.png" alt="" loading="lazy" onerror="this.remove()">`
      : '';
    card.innerHTML = `
      ${img}
      <button class="checkbox ${isChecked ? 'checked' : ''}" aria-label="Marquer fait">✓</button>
      <div class="exo-body">
        <span class="exo-order">${ex.ordre}</span>
        <div class="exo-name">${ex.exercice}</div>
        <div class="exo-reps">${ex.series_x_reps}</div>
      </div>
    `;
    card.querySelector('.checkbox').onclick = () => {
      const all = loadChecks();
      const dc = all[key] || {};
      dc[i] = !dc[i];
      all[key] = dc;
      saveChecks(all);
      renderDay();
    };
    grid.appendChild(card);
  });
}

backBtn.onclick = () => {
  if (view.screen === 'day') view = { screen: 'days', week: view.week, day: null };
  else if (view.screen === 'days') view = { screen: 'weeks', week: null, day: null };
  saveNav();
  render();
};

resetBtn.onclick = () => {
  if (view.screen !== 'day') return;
  if (!confirm('Réinitialiser les cases cochées de cette séance ?')) return;
  const all = loadChecks();
  delete all[checkKey(view.week, view.day)];
  saveChecks(all);
  renderDay();
};

fetch('data/workouts.json')
  .then(r => r.json())
  .then(json => {
    data = json;
    const saved = loadNav();
    if (saved && saved.week && data[saved.week]) {
      view = saved;
    }
    render();
  })
  .catch(err => {
    app.innerHTML = `<p style="color:#ff6b6b">Erreur de chargement des données: ${err.message}</p>`;
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
