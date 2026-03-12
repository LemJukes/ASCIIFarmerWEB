// main.js
import { initializeCurrencyBarTitle, initializeCurrencyBar } from './ui/currency.js'
import { initializeField, initializeFieldTitle, updateField } from './ui/field.js';
import { initializeStore, initializeStoreTitle } from './ui/store.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeCurrencyBarTitle();
    initializeCurrencyBar();
    initializeFieldTitle();
    initializeField();
    updateField();
    initializeStoreTitle();
    initializeStore();

});