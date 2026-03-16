const STORAGE_KEY = 'poker-tracker-v1';
const THEME_KEY = 'poker-theme';

const defaultState = {
  sessions: [],
  bankroll: {
    starting: 0,
    live: 0,
    online: 0,
    ledger: [],
  },
  settings: { dark: true },
};

const state = loadState();
let sortKey = 'date';
let sortDir = -1;
let editingId = null;

const sessionFields = [
  ['date', 'date', 'Date', true],
  ['location', 'text', 'Location / Site', true],
  ['mode', 'select', 'Live / Online', true, ['live', 'online']],
  ['format', 'select', 'Cash / Tournament', true, ['cash', 'tournament']],
  ['variant', 'select', 'Variant', true, ['NLH', 'PLO', 'Mixed', 'Other']],
  ['stakes', 'text', 'Stakes / Buy-In', true],
  ['moneyIn', 'number', 'Money In', true],
  ['moneyOut', 'number', 'Money Out', true],
  ['rebuys', 'number', 'Rebuys', false],
  ['durationHours', 'number', 'Duration (hours)', true],
  ['mood', 'select', 'Mood', false, ['great', 'good', 'neutral', 'bad']],
  ['focus', 'number', 'Focus (1-10)', false],
  ['tilt', 'number', 'Tilt (1-10)', false],
  ['energy', 'number', 'Energy (1-10)', false],
  ['quality', 'number', 'Quality of Play (1-10)', false],
  ['tableSoftness', 'number', 'Table Softness (1-10)', false],
  ['tags', 'text', 'Tags (comma-separated)', false],
  ['fieldSize', 'number', 'Field Size (Tourney)', false],
  ['finishPosition', 'number', 'Finish Position (Tourney)', false],
  ['payout', 'number', 'Payout (Tourney)', false],
  ['itm', 'select', 'ITM?', false, ['no', 'yes']],
  ['finalTable', 'select', 'Final Table?', false, ['no', 'yes']],
  ['notes', 'textarea', 'Notes (hands, reads, lessons)', false],
];

const el = {
  kpis: document.getElementById('kpis'),
  form: document.getElementById('sessionForm'),
  historyRows: document.getElementById('historyRows'),
  filters: document.getElementById('filters'),
  insights: document.getElementById('insights'),
  bankrollForm: document.getElementById('bankrollForm'),
  bankrollStats: document.getElementById('bankrollStats'),
  bankrollLedger: document.getElementById('bankrollLedger'),
  detailDialog: document.getElementById('detailDialog'),
  detailBody: document.getElementById('detailBody'),
  formTitle: document.getElementById('formTitle'),
};

init();

function init() {
  if (localStorage.getItem(THEME_KEY) === 'light') document.body.classList.add('light');
  buildSessionForm();
  buildFilters();
  buildBankrollForm();
  bindControls();
  render();
}

function bindControls() {
  document.getElementById('darkModeBtn').onclick = () => {
    document.body.classList.toggle('light');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('light') ? 'light' : 'dark');
    drawCharts();
  };
  document.getElementById('seedDemoBtn').onclick = seedDemoData;
  document.getElementById('backupBtn').onclick = backupJson;
  document.getElementById('restoreInput').onchange = restoreJson;
  document.getElementById('exportCsvBtn').onclick = exportCsv;
  document.getElementById('closeDetail').onclick = () => el.detailDialog.close();
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.onclick = () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir *= -1;
      else { sortKey = key; sortDir = 1; }
      renderHistory();
    };
  });
}

function buildSessionForm() {
  const recent = state.sessions.at(-1);
  const defaults = {
    date: new Date().toISOString().slice(0, 10),
    mode: recent?.mode || 'live',
    format: recent?.format || 'cash',
    variant: recent?.variant || 'NLH',
    itm: 'no',
    finalTable: 'no',
    rebuys: 0,
  };

  el.form.innerHTML = '';
  sessionFields.forEach(([name, type, label, required, opts]) => {
    const wrapper = document.createElement('label');
    wrapper.className = `field ${name === 'notes' ? 'wide' : ''}`;
    wrapper.innerHTML = `<span>${label}${required ? ' *' : ''}</span>`;
    let input;
    if (type === 'select') {
      input = document.createElement('select');
      opts.forEach((o) => {
        const op = document.createElement('option');
        op.value = o;
        op.textContent = o;
        input.append(op);
      });
    } else if (type === 'textarea') input = document.createElement('textarea');
    else {
      input = document.createElement('input');
      input.type = type;
      if (type === 'number') input.step = '0.01';
    }
    input.name = name;
    if (required) input.required = true;
    if (defaults[name] !== undefined) input.value = defaults[name];
    wrapper.append(input);
    el.form.append(wrapper);
  });

  const auto = document.createElement('div');
  auto.className = 'field';
  auto.innerHTML = '<span>Auto Net</span><input id="autoNet" readonly value="0" />';
  el.form.append(auto);

  ['moneyIn', 'moneyOut', 'rebuys'].forEach((name) => {
    el.form.elements[name].addEventListener('input', updateAutoNet);
  });
  updateAutoNet();

  const actions = document.createElement('div');
  actions.className = 'field wide';
  actions.innerHTML = `<div style="display:flex;gap:.5rem;flex-wrap:wrap">
    <button class="btn" type="submit">Save Session</button>
    <button id="cancelEdit" class="btn ghost" type="button">Cancel Edit</button>
  </div>`;
  el.form.append(actions);

  document.getElementById('cancelEdit').onclick = resetForm;
  el.form.onsubmit = saveSession;
}

function updateAutoNet() {
  const inAmt = n(el.form.elements.moneyIn.value) + n(el.form.elements.rebuys.value);
  const outAmt = n(el.form.elements.moneyOut.value);
  document.getElementById('autoNet').value = formatCurrency(outAmt - inAmt);
}

function saveSession(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(el.form).entries());
  const parsed = {
    ...data,
    id: editingId || crypto.randomUUID(),
    createdAt: editingId ? state.sessions.find((s) => s.id === editingId)?.createdAt : Date.now(),
    updatedAt: Date.now(),
    moneyIn: n(data.moneyIn), moneyOut: n(data.moneyOut), rebuys: n(data.rebuys), durationHours: n(data.durationHours),
    focus: n(data.focus), tilt: n(data.tilt), energy: n(data.energy), quality: n(data.quality), tableSoftness: n(data.tableSoftness),
    fieldSize: n(data.fieldSize), finishPosition: n(data.finishPosition), payout: n(data.payout),
  };

  parsed.net = parsed.moneyOut - (parsed.moneyIn + parsed.rebuys);
  parsed.roi = parsed.format === 'tournament' && parsed.moneyIn ? ((parsed.payout - parsed.moneyIn) / parsed.moneyIn) * 100 : null;

  if (!parsed.date || !parsed.location || !parsed.stakes) return alert('Please fill required fields.');
  if (parsed.durationHours <= 0) return alert('Duration must be positive.');

  const idx = state.sessions.findIndex((s) => s.id === parsed.id);
  if (idx >= 0) state.sessions[idx] = parsed;
  else state.sessions.push(parsed);

  saveState();
  resetForm();
  render();
}

function resetForm() {
  editingId = null;
  el.formTitle.textContent = 'Log Session';
  buildSessionForm();
}

function buildFilters() {
  el.filters.innerHTML = '';
  const fields = [
    ['query', 'Search'], ['mode', 'Mode'], ['format', 'Format'], ['variant', 'Variant'],
    ['stakes', 'Stakes'], ['location', 'Location'], ['result', 'Result'], ['from', 'From Date'], ['to', 'To Date'],
  ];
  fields.forEach(([name, label]) => {
    const input = document.createElement('input');
    input.placeholder = label;
    input.dataset.filter = name;
    if (name === 'from' || name === 'to') input.type = 'date';
    input.oninput = renderHistory;
    el.filters.append(input);
  });
}

function filteredSessions() {
  const f = Object.fromEntries([...el.filters.querySelectorAll('[data-filter]')].map((i) => [i.dataset.filter, i.value.toLowerCase()]));
  return state.sessions
    .filter((s) => !f.query || `${s.location} ${s.notes || ''} ${s.tags || ''}`.toLowerCase().includes(f.query))
    .filter((s) => !f.mode || s.mode.toLowerCase().includes(f.mode))
    .filter((s) => !f.format || s.format.toLowerCase().includes(f.format))
    .filter((s) => !f.variant || s.variant.toLowerCase().includes(f.variant))
    .filter((s) => !f.stakes || s.stakes.toLowerCase().includes(f.stakes))
    .filter((s) => !f.location || s.location.toLowerCase().includes(f.location))
    .filter((s) => !f.result || (f.result.startsWith('w') ? s.net > 0 : f.result.startsWith('l') ? s.net < 0 : true))
    .filter((s) => !f.from || s.date >= f.from)
    .filter((s) => !f.to || s.date <= f.to)
    .sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir);
}

function render() {
  renderDashboard();
  renderHistory();
  renderBankroll();
  drawCharts();
}

function renderDashboard() {
  const sessions = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date));
  const totalProfit = sum(sessions, 'net');
  const totalHours = sum(sessions, 'durationHours');
  const totalSessions = sessions.length;
  const avgSession = totalSessions ? totalProfit / totalSessions : 0;
  const hourly = totalHours ? totalProfit / totalHours : 0;
  const best = sessions.reduce((m, s) => (s.net > (m?.net ?? -Infinity) ? s : m), null);
  const worst = sessions.reduce((m, s) => (s.net < (m?.net ?? Infinity) ? s : m), null);
  const streak = currentStreak(sessions);
  const bankrollNow = state.bankroll.starting + totalProfit + sum(state.bankroll.ledger, 'amount');

  const kpis = [
    ['Total P/L', totalProfit], ['Current Bankroll', bankrollNow], ['Total Sessions', totalSessions], ['Total Hours', totalHours],
    ['Hourly Win Rate', hourly], ['Avg Session', avgSession], ['Best Session', best?.net || 0], ['Worst Session', worst?.net || 0], ['Current Streak', streak],
  ];

  el.kpis.innerHTML = kpis.map(([label, value]) => {
    const numeric = typeof value === 'number';
    return `<article class="kpi"><div class="label">${label}</div><div class="value ${numeric ? (value >= 0 ? 'good' : 'bad') : ''}">${numeric ? formatCurrency(value) : value}</div></article>`;
  }).join('');

  const insights = [];
  if (sessions.length) {
    insights.push(`You're ${totalProfit >= 0 ? 'up' : 'down'} ${formatCurrency(Math.abs(totalProfit))} across ${totalSessions} sessions.`);
    const byMode = groupNet(sessions, 'mode');
    if (byMode.live && byMode.online) insights.push(`${byMode.live > byMode.online ? 'Live' : 'Online'} sessions are currently stronger for you.`);
    const byVariant = groupNet(sessions, 'variant');
    const topVariant = Object.entries(byVariant).sort((a, b) => b[1] - a[1])[0];
    if (topVariant) insights.push(`${topVariant[0]} is your best-performing game (${formatCurrency(topVariant[1])}).`);
    const weakMood = sessions.filter((s) => (s.tilt || 0) >= 7);
    if (weakMood.length) insights.push(`High-tilt sessions (${weakMood.length}) combine for ${formatCurrency(sum(weakMood, 'net'))}.`);
  } else {
    insights.push('No sessions yet. Add one now and start building your personal poker performance journal.');
  }
  el.insights.innerHTML = insights.map((text) => `<div class="insight">${text}</div>`).join('');
}

function renderHistory() {
  const rows = filteredSessions();
  el.historyRows.innerHTML = rows.map((s) => `
    <tr>
      <td>${s.date}</td><td>${s.location}</td><td>${s.mode}</td><td>${s.variant}</td><td>${s.stakes}</td>
      <td>${s.durationHours.toFixed(1)}</td><td class="${s.net >= 0 ? 'good' : 'bad'}">${formatCurrency(s.net)}</td>
      <td>
        <button class="btn ghost small" data-act="view" data-id="${s.id}">View</button>
        <button class="btn ghost small" data-act="edit" data-id="${s.id}">Edit</button>
        <button class="btn ghost small" data-act="dup" data-id="${s.id}">Duplicate</button>
        <button class="btn danger small" data-act="del" data-id="${s.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  el.historyRows.querySelectorAll('button').forEach((btn) => {
    btn.onclick = () => handleRowAction(btn.dataset.act, btn.dataset.id);
  });
}

function handleRowAction(act, id) {
  const session = state.sessions.find((s) => s.id === id);
  if (!session) return;
  if (act === 'view') return openDetail(session);
  if (act === 'edit') {
    editingId = id;
    el.formTitle.textContent = 'Edit Session';
    buildSessionForm();
    Object.entries(session).forEach(([k, v]) => {
      if (el.form.elements[k]) el.form.elements[k].value = v ?? '';
    });
    updateAutoNet();
  }
  if (act === 'dup') {
    const dup = { ...session, id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), createdAt: Date.now(), updatedAt: Date.now() };
    state.sessions.push(dup);
    saveState();
    render();
  }
  if (act === 'del' && confirm('Delete this session?')) {
    state.sessions = state.sessions.filter((s) => s.id !== id);
    saveState();
    render();
  }
}

function openDetail(s) {
  const stakePeers = state.sessions.filter((x) => x.stakes === s.stakes);
  const locPeers = state.sessions.filter((x) => x.location === s.location);
  const avg = sum(state.sessions, 'net') / Math.max(state.sessions.length, 1);
  const html = `
    <h3>${s.date} • ${s.location} • ${s.variant}</h3>
    <p class="muted">${s.mode} ${s.format} @ ${s.stakes}</p>
    <h4>Financial</h4>
    <ul>
      <li>Money In: ${formatCurrency(s.moneyIn)}</li><li>Money Out: ${formatCurrency(s.moneyOut)}</li>
      <li>Rebuys: ${formatCurrency(s.rebuys)}</li><li>Net: <strong class="${s.net >= 0 ? 'good' : 'bad'}">${formatCurrency(s.net)}</strong></li>
      <li>Duration: ${s.durationHours}h (${formatCurrency(s.net / Math.max(s.durationHours, 1))}/h)</li>
      ${s.format === 'tournament' ? `<li>Position: ${s.finishPosition || '-'} / ${s.fieldSize || '-'}</li><li>Payout: ${formatCurrency(s.payout || 0)}</li><li>ROI: ${s.roi?.toFixed(1) || 0}%</li>` : ''}
    </ul>
    <h4>Context</h4>
    <ul>
      <li>${s.net >= avg ? 'Above' : 'Below'} your overall average session (${formatCurrency(avg)}).</li>
      <li>At this stake (${s.stakes}): ${formatCurrency(sum(stakePeers, 'net'))} across ${stakePeers.length} sessions.</li>
      <li>At this location/site (${s.location}): ${formatCurrency(sum(locPeers, 'net'))} across ${locPeers.length} sessions.</li>
    </ul>
    <h4>Qualitative Journal</h4>
    <p>Mood: ${s.mood || '-'}, Focus: ${s.focus || '-'}, Tilt: ${s.tilt || '-'}, Energy: ${s.energy || '-'}, Quality: ${s.quality || '-'}, Table Softness: ${s.tableSoftness || '-'}</p>
    <p><strong>Tags:</strong> ${s.tags || '-'}</p>
    <p><strong>Notes:</strong> ${s.notes || '—'}</p>
  `;
  el.detailBody.innerHTML = html;
  el.detailDialog.showModal();
}

function buildBankrollForm() {
  el.bankrollForm.innerHTML = `
    <label class="field"><span>Starting Bankroll</span><input name="starting" type="number" step="0.01" value="${state.bankroll.starting || 0}" /></label>
    <label class="field"><span>Live Bucket</span><input name="live" type="number" step="0.01" value="${state.bankroll.live || 0}" /></label>
    <label class="field"><span>Online Bucket</span><input name="online" type="number" step="0.01" value="${state.bankroll.online || 0}" /></label>
    <label class="field"><span>Ledger Type</span><select name="type"><option>deposit</option><option>withdrawal</option><option>transfer</option></select></label>
    <label class="field"><span>Ledger Amount</span><input name="amount" type="number" step="0.01" value="0" /></label>
    <label class="field"><span>Ledger Note</span><input name="note" type="text" placeholder="Reason / source" /></label>
    <div class="field"><span>&nbsp;</span><button class="btn" type="submit">Update Bankroll</button></div>
  `;

  el.bankrollForm.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(el.bankrollForm).entries());
    state.bankroll.starting = n(data.starting);
    state.bankroll.live = n(data.live);
    state.bankroll.online = n(data.online);
    if (n(data.amount)) {
      state.bankroll.ledger.unshift({
        id: crypto.randomUUID(),
        type: data.type,
        amount: data.type === 'withdrawal' ? -Math.abs(n(data.amount)) : Math.abs(n(data.amount)),
        note: data.note,
        at: new Date().toISOString(),
      });
    }
    saveState();
    buildBankrollForm();
    renderBankroll();
    renderDashboard();
    drawCharts();
  };
}

function renderBankroll() {
  const points = bankrollPoints();
  const peak = Math.max(...points, 0);
  const current = points.at(-1) || 0;
  const drawdown = peak - current;
  const trough = Math.min(...points, current);
  const recovery = peak ? ((current - trough) / Math.max(peak - trough, 1)) * 100 : 0;

  const stats = [
    ['Peak Bankroll', peak], ['Current Bankroll', current], ['Biggest Drawdown', -Math.abs(drawdown)], ['Recovery Progress', `${Math.max(0, recovery).toFixed(1)}%`],
    ['Ledger Entries', state.bankroll.ledger.length],
  ];
  el.bankrollStats.innerHTML = stats.map(([k, v]) => `<article class="kpi"><div class="label">${k}</div><div class="value ${typeof v === 'number' ? (v >= 0 ? 'good' : 'bad') : ''}">${typeof v === 'number' ? formatCurrency(v) : v}</div></article>`).join('');

  el.bankrollLedger.innerHTML = state.bankroll.ledger.slice(0, 12).map((l) => `<li><span>${new Date(l.at).toLocaleString()} • ${l.type} • ${l.note || '—'}</span><strong class="${l.amount >= 0 ? 'good' : 'bad'}">${formatCurrency(l.amount)}</strong></li>`).join('');
}

function drawCharts() {
  const sessions = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date));
  lineChart('profitChart', sessions.map((s, i) => [i + 1, sum(sessions.slice(0, i + 1), 'net')]));
  lineChart('bankrollChart', bankrollPoints().map((v, i) => [i + 1, v]));
  barChart('stakesChart', Object.entries(groupNet(sessions, 'stakes')).slice(0, 8));
  barChart('activityChart', Object.entries(groupCountByMonth(sessions)));
}

function bankrollPoints() {
  const base = state.bankroll.starting + sum(state.bankroll.ledger, 'amount');
  const sessions = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date));
  let running = base;
  return sessions.map((s) => (running += s.net));
}

function lineChart(id, points) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth; const h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  if (!points.length) return;
  const vals = points.map(([, y]) => y);
  const min = Math.min(...vals); const max = Math.max(...vals); const range = max - min || 1;
  ctx.lineWidth = 2; ctx.strokeStyle = getCss('--accent'); ctx.beginPath();
  points.forEach(([x, y], i) => {
    const px = (i / Math.max(points.length - 1, 1)) * (w - 20) + 10;
    const py = h - 10 - ((y - min) / range) * (h - 20);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.stroke();
}

function barChart(id, entries) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth; const h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  if (!entries.length) return;
  const max = Math.max(...entries.map(([, v]) => Math.abs(v)), 1);
  const barW = (w - 20) / entries.length;
  entries.forEach(([, v], i) => {
    const bh = (Math.abs(v) / max) * (h - 35);
    const x = 10 + i * barW + 2;
    const y = h - 15 - bh;
    ctx.fillStyle = v >= 0 ? getCss('--good') : getCss('--bad');
    ctx.fillRect(x, y, barW - 4, bh);
  });
}

function backupJson() {
  downloadFile(`poker-tracker-backup-${Date.now()}.json`, JSON.stringify(state, null, 2), 'application/json');
}

function restoreJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.sessions || !data.bankroll) throw new Error('invalid');
      Object.assign(state, data);
      saveState();
      buildSessionForm();
      buildBankrollForm();
      render();
      alert('Backup restored.');
    } catch {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
}

function exportCsv() {
  const cols = ['date', 'location', 'mode', 'format', 'variant', 'stakes', 'moneyIn', 'moneyOut', 'rebuys', 'durationHours', 'net', 'mood', 'focus', 'tilt', 'energy', 'quality', 'tableSoftness', 'fieldSize', 'finishPosition', 'payout', 'roi', 'itm', 'finalTable', 'tags', 'notes'];
  const lines = [cols.join(',')].concat(state.sessions.map((s) => cols.map((c) => JSON.stringify(s[c] ?? '')).join(',')));
  downloadFile(`sessions-${Date.now()}.csv`, lines.join('\n'), 'text/csv');
}

function seedDemoData() {
  if (!confirm('Replace current data with a rich demo dataset?')) return;
  const sites = ['Bellagio', 'Wynn', 'PokerStars', 'GGPoker', 'Aria', 'MGM'];
  const variants = ['NLH', 'PLO'];
  const stakes = ['1/3', '2/5', '$55 MTT', '$109 MTT', '5/10'];
  const modes = ['live', 'online'];
  state.sessions = Array.from({ length: 36 }, (_, i) => {
    const date = new Date(Date.now() - (35 - i) * 86400000 * 2).toISOString().slice(0, 10);
    const mode = modes[i % 2];
    const format = i % 4 === 0 ? 'tournament' : 'cash';
    const moneyIn = 100 + ((i * 33) % 300);
    const rebuys = format === 'tournament' ? (i % 3 === 0 ? 50 : 0) : (i % 6 === 0 ? 100 : 0);
    const net = Math.round((Math.sin(i * 0.5) * 300 + (i - 18) * 8));
    const moneyOut = Math.max(0, moneyIn + rebuys + net);
    return {
      id: crypto.randomUUID(), date, location: sites[i % sites.length], mode, format,
      variant: variants[i % variants.length], stakes: stakes[i % stakes.length],
      moneyIn, moneyOut, rebuys, durationHours: 2 + (i % 6),
      net, mood: ['great', 'good', 'neutral', 'bad'][i % 4], focus: 4 + (i % 7), tilt: 2 + (i % 8), energy: 3 + (i % 8), quality: 4 + (i % 7), tableSoftness: 3 + (i % 8),
      notes: 'Demo note: key hand analysis, exploit plan, mental game note.', tags: i % 2 ? 'aggressive,hero-call' : 'discipline,table-select',
      fieldSize: format === 'tournament' ? 120 + i * 3 : 0, finishPosition: format === 'tournament' ? 1 + (i * 7) % 150 : 0,
      payout: format === 'tournament' ? Math.max(0, moneyIn + net) : 0, roi: format === 'tournament' ? (net / moneyIn) * 100 : null,
      itm: format === 'tournament' && i % 3 === 0 ? 'yes' : 'no', finalTable: format === 'tournament' && i % 7 === 0 ? 'yes' : 'no',
      createdAt: Date.now() - i * 300000,
      updatedAt: Date.now() - i * 100000,
    };
  });
  state.bankroll = {
    starting: 5000,
    live: 3500,
    online: 1500,
    ledger: [
      { id: crypto.randomUUID(), type: 'deposit', amount: 1000, note: 'Initial top up', at: new Date(Date.now() - 86400000 * 90).toISOString() },
      { id: crypto.randomUUID(), type: 'withdrawal', amount: -400, note: 'Life expense', at: new Date(Date.now() - 86400000 * 30).toISOString() },
    ],
  };
  saveState();
  buildSessionForm();
  buildBankrollForm();
  render();
}

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(v || 0));
}
const n = (v) => Number(v || 0);
const sum = (arr, key) => arr.reduce((a, b) => a + n(b[key]), 0);
const getCss = (k) => getComputedStyle(document.body).getPropertyValue(k);
function groupNet(arr, key) {
  return arr.reduce((acc, s) => ((acc[s[key]] = (acc[s[key]] || 0) + s.net), acc), {});
}
function groupCountByMonth(arr) {
  return arr.reduce((acc, s) => {
    const m = s.date.slice(0, 7);
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
}
function currentStreak(sessions) {
  if (!sessions.length) return 'No streak';
  let wins = 0; let losses = 0;
  for (let i = sessions.length - 1; i >= 0; i -= 1) {
    if (sessions[i].net > 0 && losses === 0) wins += 1;
    else if (sessions[i].net < 0 && wins === 0) losses += 1;
    else break;
  }
  return wins ? `${wins} winning` : losses ? `${losses} losing` : 'Flat';
}
function downloadFile(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
