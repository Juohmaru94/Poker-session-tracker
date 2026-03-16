export const gameTypes = [
  { value: 'cash', label: 'Cash' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'sit-go', label: 'Sit & Go' }
];

export const variants = ['NLH', 'PLO', 'Mixed', 'Stud', 'Short Deck', 'Other'];

export function uid() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function inMoney(session) {
  return session.gameType !== 'cash' && Boolean(session.inMoney);
}

export function sortByDateDesc(sessions) {
  return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
}
