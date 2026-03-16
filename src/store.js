const STORAGE_KEY = 'poker-session-tracker:v1';

export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function bankrollTotal(sessions) {
  return sessions.reduce((sum, session) => sum + sessionProfit(session), 0);
}

export function sessionProfit(session) {
  if (session.gameType === 'cash') {
    return toNumber(session.moneyOut) - toNumber(session.moneyIn);
  }
  return toNumber(session.amountWon) - toNumber(session.buyIn);
}

export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function euro(value) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  }).format(value);
}
