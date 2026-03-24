// ui/clicks.js
import { getState, getPlayTimeMs, flushPlayTime } from '../state.js';

let cpmUpdateIntervalId = null;
let playtimeIntervalId = null;

function formatPlayTime(ms) {
    const totalCs = Math.floor(ms / 10);
    const centiseconds = totalCs % 100;
    const totalSeconds = Math.floor(totalCs / 100);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const cs = String(centiseconds).padStart(2, '0');

    return `${hh}:${mm}:${ss}.${cs}`;
}

function formatGameStartedAt(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function calculateClicksPerMinute(totalClicksClicked, gameStartedAt) {
    const elapsedMilliseconds = Date.now() - gameStartedAt;
    const elapsedMinutes = elapsedMilliseconds / 60000;

    if (!Number.isFinite(elapsedMinutes) || elapsedMinutes <= 0) {
        return 0;
    }

    return totalClicksClicked / elapsedMinutes;
}

function createStatsRow(labelText, valueId) {
    const row = document.createElement('div');
    row.classList.add('stats-row');

    const label = document.createElement('span');
    label.classList.add('clicks-display-label');
    label.textContent = labelText;

    const value = document.createElement('span');
    value.id = valueId;

    row.appendChild(label);
    row.appendChild(value);

    return row;
}

function initializeClicksDisplay() {
    const mountTarget = document.getElementById('stats-content-inner') || document.body;

    const container = document.createElement('div');
    container.id = 'clicks-display';
    container.classList.add('clicks-display');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Game statistics');

    const gameStartedRow = createStatsRow('Game Started', 'game-started-display-value');
    const playTimeRow = createStatsRow('Play Time', 'play-time-display-value');
    const clicksRow = createStatsRow('Clicks', 'clicks-display-count');
    const clicksPerMinuteRow = createStatsRow('Clicks / Min', 'clicks-per-minute-display-count');

    container.appendChild(gameStartedRow);
    container.appendChild(playTimeRow);
    container.appendChild(clicksRow);
    container.appendChild(clicksPerMinuteRow);
    mountTarget.appendChild(container);

    updateClicksDisplay();

    if (!cpmUpdateIntervalId) {
        cpmUpdateIntervalId = window.setInterval(updateClicksDisplay, 1000);
    }

    if (!playtimeIntervalId) {
        playtimeIntervalId = window.setInterval(updatePlayTimeDisplay, 100);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushPlayTime();
        }
    });

    window.addEventListener('beforeunload', () => {
        flushPlayTime();
    });
}

function updateClicksDisplay() {
    const gameState = getState();
    const gameStartedAt = Number(gameState.gameStartedAt) || Date.now();

    const gameStartedEl = document.getElementById('game-started-display-value');
    const countEl = document.getElementById('clicks-display-count');
    const clicksPerMinuteEl = document.getElementById('clicks-per-minute-display-count');

    if (gameStartedEl) {
        gameStartedEl.textContent = formatGameStartedAt(gameStartedAt);
    }

    if (countEl) {
        countEl.textContent = String(gameState.totalClicksClicked);
    }

    if (clicksPerMinuteEl) {
        const clicksPerMinute = calculateClicksPerMinute(gameState.totalClicksClicked, gameStartedAt);
        clicksPerMinuteEl.textContent = clicksPerMinute.toFixed(1);
    }
}

function updatePlayTimeDisplay() {
    const el = document.getElementById('play-time-display-value');
    if (el) {
        el.textContent = formatPlayTime(getPlayTimeMs());
    }
}

export { initializeClicksDisplay, updateClicksDisplay };
