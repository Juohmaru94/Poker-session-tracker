import { euro, sessionProfit } from '../store.js';

function optionMarkup(options, selectedValue) {
  return options
    .map((option) => `<option value="${option.value}" ${option.value === selectedValue ? 'selected' : ''}>${option.label}</option>`)
    .join('');
}

export function sessionTable({ sessions, filters, detailOptions }) {
  return `
    <section class="card history-card">
      <div class="history-head">
        <h2>Session history</h2>
        <div class="filters">
          <select id="filter-gameType">
            <option value="all" ${filters.gameType === 'all' ? 'selected' : ''}>All game types</option>
            <option value="cash" ${filters.gameType === 'cash' ? 'selected' : ''}>Cash</option>
            <option value="tournament" ${filters.gameType === 'tournament' ? 'selected' : ''}>Tournament</option>
            <option value="sit-go" ${filters.gameType === 'sit-go' ? 'selected' : ''}>Sit & Go</option>
          </select>
          <select id="filter-detail">
            ${optionMarkup(detailOptions, filters.detail)}
          </select>
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
            ` : sessions.map((session) => `
              <tr>
                <td>${session.date || '-'}</td>
                <td>${session.location || '-'}</td>
                <td>${labelType(session.gameType)}</td>
                <td>${session.variant || '-'}</td>
                <td>${detailText(session)}</td>
                <td class="${sessionProfit(session) >= 0 ? 'pos' : 'neg'}">${euro(sessionProfit(session))}</td>
                <td class="actions-cell">
                  <button class="btn-small" data-action="edit" data-id="${session.id}">Edit</button>
                  <button class="btn-small danger" data-action="delete" data-id="${session.id}">Delete</button>
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
    return `In: ${euro(Number(session.moneyIn || 0))} | Out: ${euro(Number(session.moneyOut || 0))}`;
  }

  const entrants = session.entrants ? ` | Entrants ${session.entrants}` : '';
  return `${session.tournamentName || 'Event'} | Buy-in ${euro(Number(session.buyIn || 0))} | Won ${euro(Number(session.amountWon || 0))} | Pos ${session.positionFinished || '-'}${entrants}`;
}
