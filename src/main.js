import { bankrollTotal, euro, loadSessions, saveSessions, toNumber } from './store.js';
import { sessionForm } from './components/sessionForm.js';
import { sessionTable } from './components/sessionTable.js';
import { sortByDateDesc, uid } from './utils/helpers.js';

const state = {
  sessions: sortByDateDesc(loadSessions()),
  draft: { gameType: 'cash', variant: 'NLH', date: today() },
  filters: { gameType: 'all', detail: 'all' },
  pendingDeleteId: null
};

const app = document.querySelector('#app');

render();

function render() {
  const bankroll = bankrollTotal(state.sessions);
  const filtered = filteredSessions();
  const detailOptions = buildDetailOptions(state.sessions);

  app.innerHTML = `
    <main class="layout">
      <header class="top-bar">
        <div>
          <h1>Poker Session Tracker</h1>
          <p>Track your poker sessions and analyze your performance over time.</p>
        </div>
        <div class="bankroll ${bankroll >= 0 ? 'positive' : 'negative'}">
          <span>Current Bankroll</span>
          <strong>${euro(bankroll)}</strong>
        </div>
      </header>

      <section class="panel-grid">
        ${sessionForm({ draft: state.draft, maxDate: today() })}
        ${sessionTable({ sessions: filtered, filters: state.filters, detailOptions, pendingDeleteId: state.pendingDeleteId })}
      </section>
    </main>
  `;

  bindEvents();
}

function bindEvents() {
  const form = document.querySelector('#session-form');
  const filterType = document.querySelector('#filter-gameType');
  const filterDetail = document.querySelector('#filter-detail');

  form?.addEventListener('submit', onSubmit);
  form?.addEventListener('change', onFormChange);
  form?.addEventListener('input', onFormInput);

  filterType?.addEventListener('change', (event) => {
    state.filters.gameType = event.target.value;
    render();
  });

  filterDetail?.addEventListener('change', (event) => {
    state.filters.detail = event.target.value;
    render();
  });

  document.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = state.sessions.find((session) => session.id === button.dataset.id);
      if (!target) return;
      state.pendingDeleteId = null;
      state.draft = { ...target };
      render();
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.pendingDeleteId = button.dataset.id;
      render();
    });
  });

  document.querySelectorAll('[data-action="confirm-delete"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.sessions = state.sessions.filter((session) => session.id !== button.dataset.id);
      state.pendingDeleteId = null;
      saveAndRender();
    });
  });

  document.querySelectorAll('[data-action="cancel-delete"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.pendingDeleteId = null;
      render();
    });
  });
}

function onFormChange(event) {
  const formData = readForm(event.currentTarget);
  if (state.draft.gameType !== formData.gameType) {
    state.draft = { ...state.draft, ...formData };
    render();
  }
}

function onFormInput(event) {
  if (event.target.name !== 'date') return;
  event.target.setCustomValidity(event.target.value > today() ? 'Date cannot be in the future.' : '');
}

function onSubmit(event) {
  event.preventDefault();
  const payload = readForm(event.currentTarget);
  const dateInput = event.currentTarget.querySelector('[name="date"]');

  if (payload.date > today()) {
    dateInput?.setCustomValidity('Date cannot be in the future.');
    dateInput?.reportValidity();
    return;
  }

  dateInput?.setCustomValidity('');

  if (payload.id) {
    state.sessions = state.sessions.map((session) => (session.id === payload.id ? payload : session));
  } else {
    payload.id = uid();
    state.sessions.unshift(payload);
  }

  state.sessions = sortByDateDesc(state.sessions);
  state.pendingDeleteId = null;
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
    entrants: fd.get('entrants')
  };
}

function filteredSessions() {
  return state.sessions.filter((session) => {
    const gameTypeMatch = state.filters.gameType === 'all' || session.gameType === state.filters.gameType;
    const detailMatch = matchesDetailFilter(session, state.filters.detail);
    return gameTypeMatch && detailMatch;
  });
}

function saveAndRender() {
  saveSessions(state.sessions);
  render();
}

function buildDetailOptions(sessions) {
  const options = [{ value: 'all', label: 'All details' }];
  const locations = uniqueSorted(sessions.map((session) => session.location));
  const gameTypes = uniqueSorted(sessions.map((session) => session.gameType));
  const variants = uniqueSorted(sessions.map((session) => session.variant));
  const tournamentNames = uniqueSorted(sessions.map((session) => session.tournamentName));
  const buyIns = [...new Set(
    sessions
      .filter((session) => session.gameType !== 'cash' && session.buyIn !== '' && session.buyIn != null)
      .map((session) => String(toNumber(session.buyIn)))
  )].sort((left, right) => Number(left) - Number(right));

  locations.forEach((location) => {
    options.push({ value: `location::${location}`, label: `Location: ${location}` });
  });

  gameTypes.forEach((gameType) => {
    options.push({ value: `gameType::${gameType}`, label: `Game type: ${formatGameType(gameType)}` });
  });

  variants.forEach((variant) => {
    options.push({ value: `variant::${variant}`, label: `Variant: ${variant}` });
  });

  tournamentNames.forEach((tournamentName) => {
    options.push({ value: `tournamentName::${tournamentName}`, label: `Tournament: ${tournamentName}` });
  });

  buyIns.forEach((buyIn) => {
    options.push({ value: `buyIn::${buyIn}`, label: `Buy-in: ${euro(Number(buyIn))}` });
  });

  return options;
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => value != null && value !== ''))].sort((left, right) =>
    String(left).localeCompare(String(right))
  );
}

function matchesDetailFilter(session, filterValue) {
  if (filterValue === 'all') return true;

  const [kind, rawValue = ''] = filterValue.split('::');

  if (kind === 'location') return session.location === rawValue;
  if (kind === 'gameType') return session.gameType === rawValue;
  if (kind === 'variant') return session.variant === rawValue;
  if (kind === 'tournamentName') return session.tournamentName === rawValue;
  if (kind === 'buyIn') return String(toNumber(session.buyIn)) === rawValue;

  return true;
}

function formatGameType(gameType) {
  if (gameType === 'sit-go') return 'Sit & Go';
  if (gameType === 'tournament') return 'Tournament';
  return 'Cash';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
