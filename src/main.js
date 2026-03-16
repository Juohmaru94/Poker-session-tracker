import { bankrollTotal, euro, loadSessions, saveSessions } from './store.js';
import { sessionForm } from './components/sessionForm.js';
import { sessionTable } from './components/sessionTable.js';
import { sortByDateDesc, uid } from './utils/helpers.js';

const state = {
  sessions: sortByDateDesc(loadSessions()),
  draft: { gameType: 'cash', variant: 'NLH', date: today() },
  query: '',
  filters: { gameType: 'all', location: '' }
};

const app = document.querySelector('#app');

render();

function render() {
  const bankroll = bankrollTotal(state.sessions);
  const filtered = filteredSessions();

  app.innerHTML = `
    <main class="layout">
      <header class="top-bar">
        <div>
          <h1>♣ Funky Poker Session Tracker ♠</h1>
          <p>Local-first tracker built for rapid iteration and future Windows desktop packaging.</p>
        </div>
        <div class="bankroll ${bankroll >= 0 ? 'positive' : 'negative'}">
          <span>Current Bankroll</span>
          <strong>${euro(bankroll)}</strong>
        </div>
      </header>

      <section class="panel-grid">
        ${sessionForm({ draft: state.draft })}
        ${sessionTable({ sessions: filtered, query: state.query, filters: state.filters })}
      </section>
    </main>
  `;

  bindEvents();
}

function bindEvents() {
  const form = document.querySelector('#session-form');
  const search = document.querySelector('#search');
  const filterType = document.querySelector('#filter-gameType');
  const filterLocation = document.querySelector('#filter-location');

  form?.addEventListener('submit', onSubmit);
  form?.addEventListener('change', onFormChange);
  search?.addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });

  filterType?.addEventListener('change', (event) => {
    state.filters.gameType = event.target.value;
    render();
  });

  filterLocation?.addEventListener('input', (event) => {
    state.filters.location = event.target.value;
    render();
  });

  document.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = state.sessions.find((s) => s.id === button.dataset.id);
      if (!target) return;
      state.draft = { ...target };
      render();
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.sessions = state.sessions.filter((s) => s.id !== button.dataset.id);
      saveAndRender();
    });
  });
}

function onFormChange(event) {
  const formData = readForm(event.currentTarget);
  if (
    state.draft.gameType !== formData.gameType ||
    Boolean(state.draft.inMoney) !== Boolean(formData.inMoney)
  ) {
    state.draft = { ...state.draft, ...formData };
    render();
  }
}

function onSubmit(event) {
  event.preventDefault();
  const payload = readForm(event.currentTarget);

  if (payload.id) {
    state.sessions = state.sessions.map((s) => (s.id === payload.id ? payload : s));
  } else {
    payload.id = uid();
    state.sessions.unshift(payload);
  }

  state.sessions = sortByDateDesc(state.sessions);
  state.draft = { gameType: payload.gameType, variant: payload.variant || 'NLH', date: today() };
  saveAndRender();
}

function readForm(form) {
  const fd = new FormData(form);
  const gameType = fd.get('gameType');
  const base = {
    id: state.draft.id,
    date: fd.get('date'),
    location: fd.get('location')?.trim(),
    gameType,
    variant: fd.get('variant'),
    duration: fd.get('duration')?.trim()
  };

  if (gameType === 'cash') {
    return {
      ...base,
      moneyIn: fd.get('moneyIn'),
      moneyOut: fd.get('moneyOut')
    };
  }

  return {
    ...base,
    tournamentName: fd.get('tournamentName')?.trim(),
    buyIn: fd.get('buyIn'),
    amountWon: fd.get('amountWon'),
    positionFinished: fd.get('positionFinished'),
    inMoney: fd.get('inMoney') === 'on',
    entrants: fd.get('entrants')
  };
}

function filteredSessions() {
  const q = state.query.trim().toLowerCase();
  return state.sessions.filter((session) => {
    const text = [session.location, session.variant, session.tournamentName, session.date].join(' ').toLowerCase();
    const gameTypeMatch = state.filters.gameType === 'all' || session.gameType === state.filters.gameType;
    const locationMatch = !state.filters.location || session.location.toLowerCase().includes(state.filters.location.toLowerCase());
    const textMatch = !q || text.includes(q);
    return gameTypeMatch && locationMatch && textMatch;
  });
}

function saveAndRender() {
  saveSessions(state.sessions);
  render();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
