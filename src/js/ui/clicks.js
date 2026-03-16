// ui/clicks.js
import { getState } from '../state.js';

function initializeClicksDisplay() {
    const container = document.createElement('div');
    container.id = 'clicks-display';
    container.classList.add('clicks-display');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Total Clicks');

    const label = document.createTextNode('Clicks: ');
    const count = document.createElement('span');
    count.id = 'clicks-display-count';
    count.textContent = String(getState().totalClicksClicked);

    container.appendChild(label);
    container.appendChild(count);
    document.body.appendChild(container);
}

function updateClicksDisplay() {
    const countEl = document.getElementById('clicks-display-count');
    if (countEl) {
        countEl.textContent = String(getState().totalClicksClicked);
    }
}

export { initializeClicksDisplay, updateClicksDisplay };
