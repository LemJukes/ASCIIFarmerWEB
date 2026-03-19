// ./ui/field.js
import { getState, updateState, reconcileAllFieldsProgress } from "../state.js";
import { handlePlotClick } from '../handlers/plotHandlers.js'; 

const TITLEBAR_SELECT_ID = 'field-title-select';

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

    const gameState = getState();
    const ownedFieldIds = Array.isArray(gameState.ownedFieldIds) ? gameState.ownedFieldIds : [];

    if (ownedFieldIds.length < 2) {
        titleContainer.textContent = 'The Field';
        return;
    }

    titleContainer.textContent = '';
    const existingSelect = titleContainer.querySelector(`#${TITLEBAR_SELECT_ID}`);
    if (existingSelect) {
        existingSelect.remove();
    }

    const fieldSelect = document.createElement('select');
    fieldSelect.id = TITLEBAR_SELECT_ID;
    fieldSelect.classList.add('store-button');
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

    titleContainer.appendChild(fieldSelect);
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
        plot.textContent = plotState.symbol; // Set the text from plot state
        plot.disabled = Number(plotState.disabledUntil) > now;
        plot.className = 'plotButton'; // Set the class for styling the plot button
        plot.dataset.plotIndex = i; // Store the plot index for reference
        plot.addEventListener('click', () => handlePlotClick(plot, i)); // Pass index to handler
        fieldElement.appendChild(plot); // Append the plot button to the field element
    }

    refreshFieldTitlebarControl();
}

export { initializeFieldTitle, initializeField, updateField, refreshFieldTitlebarControl, switchToField }