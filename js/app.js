const app = document.getElementById('app');
const title = document.getElementById('title');
const backBtn = document.getElementById('backBtn');
const resetBtn = document.getElementById('resetBtn');

const STORAGE_KEY = 'workout-checks-v2';
const LOG_KEY = 'workout-log-v2';
const NAV_KEY = 'workout-nav-v2';
const IMG_BASE = 'https://cdn.jsdelivr.net/npm/@bryllim/workout-guide@1.0.0/assets';

let data = null;
let view = { screen: 'home', workoutId: null };

function loadChecks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveChecks(checks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function checkKey(workoutId) {
  return `${workoutId}__${todayStr()}`;
}

function loadLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; }
  catch { return []; }
}
function saveLog(entries) {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries));
}
function findLogEntry(workoutId, date, i) {
  const log = loadLog();
  return log.find(e => e.workoutId === workoutId && e.date === date && e.i === i);
}
function lastLogForSlug(slug) {
  if (!slug) return null;
  const log = loadLog().filter(e => e.slug === slug);
  if (!log.length) return null;
  log.sort((a, b) => (a.date + a.ts).localeCompare(b.date + b.ts));
  return log[log.length - 1];
}
function upsertLog(entry) {
  const log = loadLog();
  const idx = log.findIndex(e => e.workoutId === entry.workoutId && e.date === entry.date && e.i === entry.i);
  if (idx >= 0) log[idx] = entry;
  else log.push(entry);
  saveLog(log);
}

function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(d.getDate() - day);
  return s;
}
function endOfWeek(d) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function parseDate(str) {
  return new Date(str + 'T00:00:00');
}

function saveNav() {
  localStorage.setItem(NAV_KEY, JSON.stringify(view));
}
function loadNav() {
  try { return JSON.parse(localStorage.getItem(NAV_KEY)); }
  catch { return null; }
}

function dayProgress(workoutId) {
  const checks = loadChecks()[checkKey(workoutId)] || {};
  const total = data[workoutId].exercises.length;
  const done = Object.values(checks).filter(Boolean).length;
  return { done, total };
}

function render() {
  backBtn.hidden = view.screen === 'home';
  resetBtn.hidden = view.screen !== 'workout';

  if (view.screen === 'home') {
    title.textContent = 'Mes Séances';
    renderHome();
  } else if (view.screen === 'workout') {
    title.textContent = data[view.workoutId].label;
    renderWorkout();
  } else if (view.screen === 'stats') {
    title.textContent = 'Statistiques';
    renderStats();
  }
}

function renderHome() {
  app.innerHTML = `<div class="section-label">Choisis ta séance</div><div class="grid" id="grid"></div>`;
  const grid = document.getElementById('grid');
  Object.keys(data).forEach(workoutId => {
    const w = data[workoutId];
    const { done, total } = dayProgress(workoutId);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    btn.innerHTML = `
      ${w.label}<span class="sub">${w.days.join(' & ')} · ${total} exercices · ${done}/${total} faits</span>
      <span class="chevron">›</span>
      <div class="progress"><span style="width:${pct}%"></span></div>
    `;
    btn.onclick = () => { view = { screen: 'workout', workoutId }; saveNav(); render(); };
    grid.appendChild(btn);
  });
  const statsBtn = document.createElement('button');
  statsBtn.className = 'card-btn stats-entry';
  statsBtn.innerHTML = `📊 Statistiques<span class="sub">Séances, volume, sauvegarde</span><span class="chevron">›</span>`;
  statsBtn.onclick = () => { view = { screen: 'stats', workoutId: null }; saveNav(); render(); };
  grid.appendChild(statsBtn);
}

function renderWorkout() {
  const w = data[view.workoutId];
  const exercises = w.exercises;
  const checks = loadChecks();
  const key = checkKey(view.workoutId);
  const dayChecks = checks[key] || {};

  app.innerHTML = `<div class="section-label">${w.days.join(' & ')}</div><div class="grid" id="grid"></div><p class="attribution">Illustrations : Everkinetic / Bryl Lim, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a></p>`;
  const grid = document.getElementById('grid');

  const today = todayStr();

  exercises.forEach((ex, i) => {
    const isWarmup = ex.ordre.toLowerCase().includes('échauffement');
    const isChecked = !!dayChecks[i];
    const logged = findLogEntry(view.workoutId, today, i);
    const card = document.createElement('div');
    card.className = `exo-card ${isWarmup ? 'warmup' : ''} ${isChecked ? 'done' : ''}`;
    const img = ex.slug
      ? `<img class="exo-img" src="${IMG_BASE}/${ex.slug}/frame-1.png" alt="" loading="lazy" data-slug="${ex.slug}" onerror="this.remove()">`
      : '';
    const loggedLine = logged
      ? `<div class="exo-logged">Fait : ${logged.weight ?? '?'} kg × ${logged.reps ?? '?'}</div>`
      : '';
    card.innerHTML = `
      ${img}
      <button class="checkbox ${isChecked ? 'checked' : ''}" aria-label="Marquer fait">✓</button>
      <div class="exo-body">
        <span class="exo-order">${ex.ordre}</span>
        <div class="exo-name">${ex.exercice}</div>
        <div class="exo-reps">${ex.series_x_reps}</div>
        ${loggedLine}
      </div>
    `;
    const imgEl = card.querySelector('.exo-img');
    if (imgEl) imgEl.onclick = () => playAnimation(ex.slug);

    card.querySelector('.exo-body').onclick = () => openLogEditor(ex, i);

    card.querySelector('.checkbox').onclick = (evt) => {
      evt.stopPropagation();
      const all = loadChecks();
      const dc = all[key] || {};
      dc[i] = !dc[i];
      all[key] = dc;
      saveChecks(all);
      renderWorkout();
    };
    grid.appendChild(card);
  });
}

function openLogEditor(ex, i) {
  const today = todayStr();
  const existing = findLogEntry(view.workoutId, today, i);
  const last = lastLogForSlug(ex.slug);
  const prefWeight = existing ? existing.weight : (last ? last.weight : '');
  const prefReps = existing ? existing.reps : (last ? last.reps : '');

  const overlay = document.createElement('div');
  overlay.className = 'anim-overlay';
  overlay.innerHTML = `
    <div class="log-card">
      <div class="exo-name">${ex.exercice}</div>
      <div class="exo-reps" style="margin-bottom:14px">${ex.series_x_reps}</div>
      <label class="log-label">Poids (kg)</label>
      <input class="log-input" id="logWeight" type="number" inputmode="decimal" step="0.5" min="0" value="${prefWeight}">
      <label class="log-label">Reps</label>
      <input class="log-input" id="logReps" type="number" inputmode="numeric" min="0" value="${prefReps}">
      <div class="log-actions">
        <button class="log-btn secondary" id="logCancel">Annuler</button>
        <button class="log-btn primary" id="logSave">Enregistrer</button>
      </div>
    </div>
  `;
  overlay.onclick = () => overlay.remove();
  overlay.querySelector('.log-card').onclick = (e) => e.stopPropagation();
  document.body.appendChild(overlay);

  overlay.querySelector('#logCancel').onclick = () => overlay.remove();
  overlay.querySelector('#logSave').onclick = () => {
    const weight = parseFloat(overlay.querySelector('#logWeight').value) || null;
    const reps = parseInt(overlay.querySelector('#logReps').value, 10) || null;
    upsertLog({
      workoutId: view.workoutId, date: today, i,
      slug: ex.slug, exercice: ex.exercice,
      weight, reps, ts: Date.now()
    });
    const all = loadChecks();
    const key = checkKey(view.workoutId);
    const dc = all[key] || {};
    dc[i] = true;
    all[key] = dc;
    saveChecks(all);
    overlay.remove();
    renderWorkout();
  };
}

function renderStats() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthPrefix = now.toISOString().slice(0, 7);

  const checks = loadChecks();
  const log = loadLog();

  const sessionsTarget = Object.values(data).reduce((sum, w) => sum + w.days.length, 0);

  let sessionsWeek = 0, sessionsMonth = 0;
  Object.entries(checks).forEach(([key, dc]) => {
    const anyDone = Object.values(dc).some(Boolean);
    if (!anyDone) return;
    const [, dateStr] = key.split('__');
    const d = parseDate(dateStr);
    if (d >= weekStart && d <= weekEnd) sessionsWeek++;
    if (dateStr.startsWith(monthPrefix)) sessionsMonth++;
  });

  let volumeWeek = 0, volumeMonth = 0;
  log.forEach(entry => {
    const vol = (entry.weight || 0) * (entry.reps || 0);
    const d = parseDate(entry.date);
    if (d >= weekStart && d <= weekEnd) volumeWeek += vol;
    if (entry.date.startsWith(monthPrefix)) volumeMonth += vol;
  });

  app.innerHTML = `
    <div class="section-label">Cette semaine</div>
    <div class="stat-row">
      <div class="stat-tile"><div class="stat-value">${sessionsWeek}/${sessionsTarget}</div><div class="stat-label">séances</div></div>
      <div class="stat-tile"><div class="stat-value">${Math.round(volumeWeek)}</div><div class="stat-label">kg soulevés (volume)</div></div>
    </div>
    <div class="section-label">Ce mois-ci</div>
    <div class="stat-row">
      <div class="stat-tile"><div class="stat-value">${sessionsMonth}</div><div class="stat-label">séances</div></div>
      <div class="stat-tile"><div class="stat-value">${Math.round(volumeMonth)}</div><div class="stat-label">kg soulevés (volume)</div></div>
    </div>
    <div class="section-label">Sauvegarde</div>
    <div class="grid">
      <button class="card-btn" id="exportBtn">Exporter mes données<span class="sub">Télécharge un fichier JSON de secours</span></button>
      <button class="card-btn" id="importBtn">Importer une sauvegarde<span class="sub">Remplace les données actuelles</span></button>
    </div>
    <input type="file" id="importFile" accept="application/json" hidden>
  `;

  document.getElementById('exportBtn').onclick = exportData;
  document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
  document.getElementById('importFile').onchange = importData;
}

function exportData() {
  const payload = {
    checks: loadChecks(),
    log: loadLog(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mes-seances-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importData(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!confirm('Remplacer les données actuelles par cette sauvegarde ?')) return;
      saveChecks(parsed.checks || {});
      saveLog(parsed.log || []);
      alert('Sauvegarde importée.');
      renderStats();
    } catch (e) {
      alert('Fichier invalide.');
    }
  };
  reader.readAsText(file);
}

function playAnimation(slug) {
  if (!slug) return;
  const overlay = document.createElement('div');
  overlay.className = 'anim-overlay';
  overlay.innerHTML = `<img class="anim-img" src="${IMG_BASE}/${slug}/frame-1.png" alt="">`;
  overlay.onclick = () => { clearInterval(timer); overlay.remove(); };
  document.body.appendChild(overlay);
  const img = overlay.querySelector('.anim-img');

  const sequence = [1, 2, 3, 2, 1, 2, 3, 2, 1]; // 2 loops, lands back on frame 1
  let i = 0;
  const timer = setInterval(() => {
    img.src = `${IMG_BASE}/${slug}/frame-${sequence[i]}.png`;
    i++;
    if (i >= sequence.length) clearInterval(timer);
  }, 250);
}

backBtn.onclick = () => {
  view = { screen: 'home', workoutId: null };
  saveNav();
  render();
};

resetBtn.onclick = () => {
  if (view.screen !== 'workout') return;
  if (!confirm('Réinitialiser les cases cochées de cette séance ?')) return;
  const all = loadChecks();
  delete all[checkKey(view.workoutId)];
  saveChecks(all);
  renderWorkout();
};

fetch('data/workouts.json')
  .then(r => r.json())
  .then(json => {
    data = json;
    const saved = loadNav();
    if (saved && saved.workoutId && data[saved.workoutId]) {
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
