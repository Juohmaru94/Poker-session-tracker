import { euro, sessionProfit } from '../store.js';

export function sessionTable({ sessions, query, filters }) {
  return `
    <section class="card history-card">
      <div class="history-head">
        <h2>Session history</h2>
        <div class="filters">
          <input id="search" type="search" placeholder="Search location, tournament, variant..." value="${query}" />
          <select id="filter-gameType">
            <option value="all" ${filters.gameType === 'all' ? 'selected' : ''}>All game types</option>
            <option value="cash" ${filters.gameType === 'cash' ? 'selected' : ''}>Cash</option>
            <option value="tournament" ${filters.gameType === 'tournament' ? 'selected' : ''}>Tournament</option>
            <option value="sit-go" ${filters.gameType === 'sit-go' ? 'selected' : ''}>Sit & Go</option>
          </select>
          <input id="filter-location" type="text" placeholder="Filter location" value="${filters.location}" />
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Location</th><th>Game</th><th>Variant</th><th>Details</th><th>Net</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sessions.length === 0 ? `
              <tr><td colspan="7" class="empty">No sessions match your filters yet.</td></tr>
            ` : sessions.map((s) => `
              <tr>
                <td>${s.date || '-'}</td>
                <td>${s.location || '-'}</td>
                <td>${labelType(s.gameType)}</td>
                <td>${s.variant || '-'}</td>
                <td>${detailText(s)}</td>
                <td class="${sessionProfit(s) >= 0 ? 'pos' : 'neg'}">${euro(sessionProfit(s))}</td>
                <td>
                  <button class="btn-small" data-action="edit" data-id="${s.id}">Edit</button>
                  <button class="btn-small danger" data-action="delete" data-id="${s.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function labelType(type) {
  if (type === 'sit-go') return 'Sit & Go';
  if (type === 'tournament') return 'Tournament';
  return 'Cash';
}

function detailText(session) {
  if (session.gameType === 'cash') {
    return `In: ${euro(Number(session.moneyIn || 0))} · Out: ${euro(Number(session.moneyOut || 0))}`;
  }
  const itm = session.inMoney ? ` · ITM/${session.entrants || '?'} entrants` : '';
  return `${session.tournamentName || 'Event'} · Buy-in ${euro(Number(session.buyIn || 0))} · Won ${euro(Number(session.amountWon || 0))} · Pos ${session.positionFinished || '-'}${itm}`;
}
