// ./ui/field.js
import { getState, updateState, reconcileAllFieldsProgress } from "../state.js";
import { handlePlotClick } from '../handlers/plotHandlers.js'; 
import { getPlotDisabledTime } from '../handlers/plotHandlers.js';
import { syncPlotButtonPresentation } from '../handlers/plotHandlers.js';
import { AUTO_FARMER_BASE_TICK_MS, AUTO_FARMER_MIN_TICK_MS } from '../configs/autoFarmerConfig.js';

const TITLEBAR_SELECT_ID = 'field-title-select';
const FIELD_SUBTITLE_ID = 'field-subtitlebar';
const FIELD_SUBTITLE_PLOTS_ID = 'field-subtitle-plots';
const FIELD_SUBTITLE_SELECTOR_ID = 'field-subtitle-selector';
const FIELD_SUBTITLE_FALLOW_ID = 'field-subtitle-fallow';
const FIELD_TIMER_SYNC_INTERVAL_MS = 200;

let fieldTimerSyncIntervalId = null;

function getActiveFieldFromSnapshot(gameState) {
    if (!gameState?.fields || !gameState?.activeFieldId) {
        return null;
    }

    return gameState.fields[gameState.activeFieldId] || null;
}

function ensureActiveFieldPlotStates(gameState) {
    const activeField = getActiveFieldFromSnapshot(gameState);
    if (!activeField) {
        return null;
    }

    const plots = Math.max(1, Number(activeField.plots) || 1);
    const currentPlotStates = Array.isArray(activeField.plotStates) ? activeField.plotStates : [];

    if (currentPlotStates.length === plots) {
        return activeField;
    }

    const normalizedPlotStates = [];
    for (let i = 0; i < plots; i++) {
        const existing = currentPlotStates[i];
        normalizedPlotStates.push({
            symbol: existing?.symbol ?? '~',
            cropType: existing?.cropType ?? null,
            waterCount: Number(existing?.waterCount) || 0,
            disabledUntil: Number(existing?.disabledUntil) || 0,
            lastUpdatedAt: Number(existing?.lastUpdatedAt) || Date.now(),
            destroyed: Boolean(existing?.destroyed),
            autoFarmer: existing?.autoFarmer && typeof existing.autoFarmer === 'object'
                ? {
                    level: Math.max(1, Number(existing.autoFarmer.level) || 1),
                    tickMs: Math.max(AUTO_FARMER_MIN_TICK_MS, Number(existing.autoFarmer.tickMs) || AUTO_FARMER_BASE_TICK_MS),
                    lastTickAt: Number(existing.autoFarmer.lastTickAt) || 0,
                    preferredTargetPlotIndex: Number.isInteger(existing.autoFarmer.preferredTargetPlotIndex)
                        ? Number(existing.autoFarmer.preferredTargetPlotIndex)
                        : null,
                    lastErrorCode: typeof existing.autoFarmer.lastErrorCode === 'string' ? existing.autoFarmer.lastErrorCode : null,
                    lastErrorMessage: typeof existing.autoFarmer.lastErrorMessage === 'string' ? existing.autoFarmer.lastErrorMessage : '',
                    flashingUntil: Number(existing.autoFarmer.flashingUntil) || 0,
                    preferredSeedType: existing.autoFarmer.preferredSeedType === 'wheat'
                        || existing.autoFarmer.preferredSeedType === 'corn'
                        || existing.autoFarmer.preferredSeedType === 'tomato'
                        ? existing.autoFarmer.preferredSeedType
                        : null,
                    isPaused: Boolean(existing.autoFarmer.isPaused),
                    suppressWarnings: Boolean(existing.autoFarmer.suppressWarnings),
                }
                : null,
        });
    }

    const updatedField = {
        ...activeField,
        plots,
        plotStates: normalizedPlotStates,
    };

    const updatedFields = {
        ...gameState.fields,
        [gameState.activeFieldId]: updatedField,
    };

    updateState({ fields: updatedFields });
    return updatedField;
}

function switchToField(fieldId) {
    const gameState = getState();
    if (!gameState.fields?.[fieldId]) {
        return;
    }

    if (gameState.activeFieldId === fieldId) {
        return;
    }

    updateState({ activeFieldId: fieldId });
    updateField();
}

function refreshFieldTitlebarControl() {
    const fieldWindow = document.getElementById('mac-window-field');
    if (!fieldWindow) {
        return;
    }

    const titleContainer = fieldWindow.querySelector('.mac-title');
    if (!titleContainer) {
        return;
    }

    titleContainer.textContent = 'The Field';
    refreshFieldSubtitlebarControl(fieldWindow);
}

function formatFallowSeconds(durationMs) {
    const seconds = Math.max(0, Number(durationMs) || 0) / 1000;
    return `${seconds.toFixed(1)}s`;
}

function getOrCreateSubtitleElement(fieldWindow) {
    let subtitleBar = fieldWindow.querySelector(`#${FIELD_SUBTITLE_ID}`);
    const macContentInner = fieldWindow.querySelector('.mac-content-inner');

    if (!subtitleBar) {
        subtitleBar = document.createElement('div');
        subtitleBar.id = FIELD_SUBTITLE_ID;
        subtitleBar.classList.add('mac-subtitlebar');

        const plotsDisplay = document.createElement('span');
        plotsDisplay.id = FIELD_SUBTITLE_PLOTS_ID;
        plotsDisplay.classList.add('mac-subtitle-value', 'mac-subtitle-left');

        const selectorSlot = document.createElement('div');
        selectorSlot.id = FIELD_SUBTITLE_SELECTOR_ID;
        selectorSlot.classList.add('mac-subtitle-center');

        const fallowDisplay = document.createElement('span');
        fallowDisplay.id = FIELD_SUBTITLE_FALLOW_ID;
        fallowDisplay.classList.add('mac-subtitle-value', 'mac-subtitle-right');

        subtitleBar.appendChild(plotsDisplay);
        subtitleBar.appendChild(selectorSlot);
        subtitleBar.appendChild(fallowDisplay);
    }

    if (macContentInner) {
        macContentInner.prepend(subtitleBar);
        return subtitleBar;
    }

    if (!subtitleBar.parentElement) {
        const titlebar = fieldWindow.querySelector('.mac-titlebar');
        if (!titlebar || !titlebar.parentElement) {
            return null;
        }

        titlebar.insertAdjacentElement('afterend', subtitleBar);
    }

    return subtitleBar;
}

function refreshFieldSubtitlebarControl(fieldWindow) {
    const gameState = getState();
    const ownedFieldIds = Array.isArray(gameState.ownedFieldIds) ? gameState.ownedFieldIds : [];
    const activeField = getActiveFieldFromSnapshot(gameState);
    if (!activeField) {
        return;
    }

    const subtitleBar = getOrCreateSubtitleElement(fieldWindow);
    if (!subtitleBar) {
        return;
    }

    const plotsDisplay = subtitleBar.querySelector(`#${FIELD_SUBTITLE_PLOTS_ID}`);
    const selectorSlot = subtitleBar.querySelector(`#${FIELD_SUBTITLE_SELECTOR_ID}`);
    const fallowDisplay = subtitleBar.querySelector(`#${FIELD_SUBTITLE_FALLOW_ID}`);
    if (!plotsDisplay || !selectorSlot || !fallowDisplay) {
        return;
    }

    plotsDisplay.textContent = `Plots: ${activeField.plots}`;
    fallowDisplay.textContent = `Fallow Period: ${formatFallowSeconds(getPlotDisabledTime(activeField.plots))}`;

    selectorSlot.textContent = '';

    if (ownedFieldIds.length < 2) {
        const singleFieldLabel = document.createElement('span');
        singleFieldLabel.classList.add('mac-subtitle-center-label');
        singleFieldLabel.textContent = activeField.name || gameState.activeFieldId;
        selectorSlot.appendChild(singleFieldLabel);
        return;
    }

    const fieldSelect = document.createElement('select');
    fieldSelect.id = TITLEBAR_SELECT_ID;
    fieldSelect.classList.add('store-button', 'field-subtitle-select');
    fieldSelect.setAttribute('aria-label', 'Select Active Field');

    ownedFieldIds.forEach((fieldId) => {
        const field = gameState.fields[fieldId];
        if (!field) {
            return;
        }

        const option = document.createElement('option');
        option.value = fieldId;
        option.textContent = field.name || fieldId;
        if (fieldId === gameState.activeFieldId) {
            option.selected = true;
        }

        fieldSelect.appendChild(option);
    });

    fieldSelect.addEventListener('change', (event) => {
        const selectedFieldId = event.target.value;
        switchToField(selectedFieldId);
    });

    selectorSlot.appendChild(fieldSelect);
}

function initializeFieldTitle() {
    // Store Title as a Button
    const fieldTitleButton = document.createElement('section');
    fieldTitleButton.classList.add('container-title');
    fieldTitleButton.id = 'field-section-title';
    fieldTitleButton.setAttribute('aria-label', 'Field Section Title');
    fieldTitleButton.textContent = 'The Field';

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(fieldTitleButton);
    } else {
        console.error('Main div not found');
    }
}

function initializeField(){
    // Store Section
    const field = document.createElement('section');
    field.classList.add('field-container');
    field.id = 'field';
    field.setAttribute('aria-label', 'The Field');

    // Append the field section to the main element
    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(field);
    } else {
        console.error('Main div not found');
    }
}

function updateField() {
    reconcileAllFieldsProgress();
    const gameState = getState();
    const activeField = ensureActiveFieldPlotStates(gameState);
    if (!activeField) {
        return;
    }
    
    const fieldElement = document.getElementById('field'); // Get the field element
    if (!fieldElement) {
        console.error('Field element not found');
        return;
    }
    fieldElement.innerHTML = ''; // Clear the field element's content

    const plots = activeField.plots;
    const plotStates = activeField.plotStates;
    const now = Date.now();

    // Create and append plot buttons for the number of plots owned by the player
    for (let i = 0; i < plots; i++) {
        const plot = document.createElement('button');
        const plotState = plotStates[i];
        plot.className = 'plotButton'; // Set the class for styling the plot button
        plot.dataset.plotIndex = i; // Store the plot index for reference
        syncPlotButtonPresentation(plot, plotState, i, now);
        plot.addEventListener('click', () => handlePlotClick(plot, i)); // Pass index to handler
        fieldElement.appendChild(plot); // Append the plot button to the field element
    }

    refreshFieldTitlebarControl();
}

function syncActiveFieldButtons() {
    reconcileAllFieldsProgress();

    const gameState = getState();
    const activeField = getActiveFieldFromSnapshot(gameState);
    if (!activeField || !Array.isArray(activeField.plotStates)) {
        return;
    }

    const fieldElement = document.getElementById('field');
    if (!fieldElement) {
        return;
    }

    const plotButtons = fieldElement.querySelectorAll('.plotButton');
    if (plotButtons.length !== activeField.plots) {
        updateField();
        return;
    }

    const now = Date.now();
    for (let i = 0; i < plotButtons.length; i++) {
        const plotButton = plotButtons[i];
        const plotState = activeField.plotStates[i];

        if (!plotState) {
            continue;
        }

        syncPlotButtonPresentation(plotButton, plotState, i, now);
    }
}

function startFieldTimerSync() {
    if (fieldTimerSyncIntervalId !== null) {
        return;
    }

    fieldTimerSyncIntervalId = window.setInterval(syncActiveFieldButtons, FIELD_TIMER_SYNC_INTERVAL_MS);
}

export { initializeFieldTitle, initializeField, updateField, refreshFieldTitlebarControl, switchToField, startFieldTimerSync }