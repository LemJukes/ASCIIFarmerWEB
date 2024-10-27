// main.js
import { initializeCurrencyBar } from './ui/currency.js'
import { initializeField, initializeFieldTitle, updateField } from './ui/field.js';
import { initializeStore, initializeStoreTitle } from './ui/store.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeFieldTitle();
    initializeField();
    updateField();
    initializeCurrencyBar();
    initializeStoreTitle();
    initializeStore();

});