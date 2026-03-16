import { gameTypes, variants } from '../utils/helpers.js';

function optionMarkup(options, selectedValue) {
  return options
    .map((option) => {
      if (typeof option === 'string') {
        return `<option value="${option}" ${option === selectedValue ? 'selected' : ''}>${option}</option>`;
      }

      return `<option value="${option.value}" ${option.value === selectedValue ? 'selected' : ''}>${option.label}</option>`;
    })
    .join('');
}

function showTournamentFields(gameType) {
  return gameType === 'tournament' || gameType === 'sit-go';
}

export function sessionForm({ draft }) {
  const tournamentMode = showTournamentFields(draft.gameType);

  return `
    <form id="session-form" class="card session-form">
      <div class="card-title-row">
        <h2>${draft.id ? 'Edit session' : 'Log new session'}</h2>
        <button type="submit" class="btn btn-primary">${draft.id ? 'Update session' : 'Save session'}</button>
      </div>

      <div class="grid">
        <label>Date
          <input type="date" name="date" required value="${draft.date || ''}" />
        </label>

        <label>Location
          <input type="text" name="location" placeholder="Casino, home game, online site" required value="${draft.location || ''}" />
        </label>

        <label>Game type
          <select name="gameType" required>
            ${optionMarkup(gameTypes, draft.gameType || 'cash')}
          </select>
        </label>

        <label>Variant
          <select name="variant" required>
            ${optionMarkup(variants, draft.variant || 'NLH')}
          </select>
        </label>

        <label>Session duration (optional)
          <input type="text" name="duration" placeholder="e.g. 3h 20m" value="${draft.duration || ''}" />
        </label>

        ${tournamentMode ? `
          <label>Tournament name
            <input type="text" name="tournamentName" placeholder="Name of event" value="${draft.tournamentName || ''}" />
          </label>
        ` : ''}
      </div>

      ${tournamentMode ? `
        <div class="dynamic-block">
          <label>Stakes / Buy-in (EUR)
            <input type="number" min="0" step="0.01" name="buyIn" required value="${draft.buyIn ?? ''}" />
          </label>
          <label>Amount won (EUR)
            <input type="number" min="0" step="0.01" name="amountWon" required value="${draft.amountWon ?? ''}" />
          </label>
          <label>Position finished
            <input type="number" min="1" step="1" name="positionFinished" required value="${draft.positionFinished ?? ''}" />
          </label>
          <label>Number of entrants (optional)
            <input type="number" min="2" step="1" name="entrants" value="${draft.entrants ?? ''}" />
          </label>
        </div>
      ` : `
        <div class="dynamic-block">
          <label>Money in (EUR)
            <input type="number" min="0" step="0.01" name="moneyIn" required value="${draft.moneyIn ?? ''}" />
          </label>
          <label>Money out (EUR)
            <input type="number" min="0" step="0.01" name="moneyOut" required value="${draft.moneyOut ?? ''}" />
          </label>
        </div>
      `}
    </form>
  `;
}
