// main.js
import { initializeCurrencyBarTitle, initializeCurrencyBar } from './ui/currency.js'
import { clearSnapshot, loadSnapshot } from './persistence.js';
import { applyStateSnapshot } from './state.js';
import { initializeField, initializeFieldTitle, updateField } from './ui/field.js';
import { applyStoreValuesSnapshot, initializeStore, initializeStoreTitle } from './ui/store.js';
import { applyUpgradeValuesSnapshot } from './ui/upgrades.js';
import { initializeToolbox, initializeToolboxTitle, selectTool, selectSeedType } from './ui/toolbox.js';

function initializeResetSaveButton() {
    const resetSaveButton = document.createElement('button');
    resetSaveButton.id = 'reset-save-button';
    resetSaveButton.classList.add('reset-save-button');
    resetSaveButton.textContent = 'Reset Save';
    resetSaveButton.setAttribute('aria-label', 'Reset Save Data');

    resetSaveButton.addEventListener('click', () => {
        const confirmed = window.confirm('Delete save data and reload the page?');
        if (!confirmed) {
            return;
        }

        clearSnapshot();
        window.location.reload();
    });

    document.body.appendChild(resetSaveButton);
}

function isEditableElement(element) {
    if (!element) {
        return false;
    }

    const tagName = element.tagName;
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || element.isContentEditable;
}

function initializeKeyboardShortcuts() {
    const toolShortcutMap = {
        a: 'Plow',
        s: 'Seed Bag',
        d: 'Watering Can',
        f: 'Scythe',
    };

    const seedShortcutMap = {
        z: 'wheat',
        x: 'corn',
        c: 'tomato',
    };

    document.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (isEditableElement(document.activeElement)) {
            return;
        }

        const pressedKey = event.key.toLowerCase();
        const mappedTool = toolShortcutMap[pressedKey];

        if (mappedTool) {
            event.preventDefault();
            selectTool(mappedTool);
            return;
        }

        const mappedSeed = seedShortcutMap[pressedKey];
        if (mappedSeed) {
            event.preventDefault();
            selectSeedType(mappedSeed);
            return;
        }

        if (!/^[0-9]$/.test(pressedKey)) {
            return;
        }

        const plotButtons = document.querySelectorAll('.plotButton');
        const plotIndex = pressedKey === '0' ? 9 : Number(pressedKey) - 1;
        const targetPlotButton = plotButtons[plotIndex];

        if (!targetPlotButton || targetPlotButton.disabled) {
            return;
        }

        event.preventDefault();
        targetPlotButton.click();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const snapshot = loadSnapshot();
    if (snapshot) {
        applyStateSnapshot(snapshot.gameState);
        applyStoreValuesSnapshot(snapshot.storeValues);
        applyUpgradeValuesSnapshot(snapshot.upgradeValues);
    }

    initializeCurrencyBarTitle();
    initializeCurrencyBar();
    initializeToolboxTitle();
    initializeToolbox();
    initializeFieldTitle();
    initializeField();
    updateField();
    initializeStoreTitle();
    initializeStore();
    initializeResetSaveButton();
    initializeKeyboardShortcuts();

});