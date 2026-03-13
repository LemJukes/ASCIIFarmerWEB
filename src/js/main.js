// main.js
import { initializeCurrencyBarTitle, initializeCurrencyBar } from './ui/currency.js'
import { clearSnapshot, loadSnapshot } from './persistence.js';
import { applyStateSnapshot } from './state.js';
import { initializeField, initializeFieldTitle, updateField } from './ui/field.js';
import { applyStoreValuesSnapshot, initializeStore, initializeStoreTitle } from './ui/store.js';
import { applyUpgradeValuesSnapshot } from './ui/upgrades.js';

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

document.addEventListener('DOMContentLoaded', () => {
    const snapshot = loadSnapshot();
    if (snapshot) {
        applyStateSnapshot(snapshot.gameState);
        applyStoreValuesSnapshot(snapshot.storeValues);
        applyUpgradeValuesSnapshot(snapshot.upgradeValues);
    }

    initializeCurrencyBarTitle();
    initializeCurrencyBar();
    initializeFieldTitle();
    initializeField();
    updateField();
    initializeStoreTitle();
    initializeStore();
    initializeResetSaveButton();

});