// ui/currency.js
import { getState, logGameState } from "../state.js";
import { trackAchievements } from "../handlers/achievementHandlers.js";
import { getStoreValues, initializeStore } from "./store.js";
//import { logUpgradeValues } from "./upgrades.js";

function createCurrencyItem(label, value, elementId, ariaLabel, options = {}) {
    const currencyItem = document.createElement('div');
    currencyItem.classList.add('currency-item');

    if (options.offset) {
        currencyItem.classList.add('currency-item--offset');
    }

    if (options.subitem) {
        currencyItem.classList.add('currency-subitem');
    }

    if (options.itemId) {
        currencyItem.id = options.itemId;
    }

    if (options.display) {
        currencyItem.style.display = options.display;
    }

    currencyItem.innerHTML = `${label}:<br> <span id="${elementId}" aria-label="${ariaLabel}">${value}</span>`;
    return currencyItem;
}

function createCurrencyGroup(title, items) {
    const currencyGroup = document.createElement('div');
    currencyGroup.classList.add('currency-group');
    currencyGroup.innerHTML = `<strong>${title}</strong>`;

    items.forEach((item) => {
        currencyGroup.appendChild(createCurrencyItem(item.label, item.value, item.elementId, item.ariaLabel, {
            subitem: true,
            itemId: item.itemId,
            display: item.display,
        }));
    });

    return currencyGroup;
}

function initializeCurrencyBarTitle() {
    // Currency Bar Title
    const currencyBarTitle = document.createElement('section');
    currencyBarTitle.classList.add('container-title');
    currencyBarTitle.id = 'currency-bar-title';
    currencyBarTitle.setAttribute('aria-label', 'Currency Bar Title');
    currencyBarTitle.textContent = 'The Farmer';

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(currencyBarTitle);
    } else {
        console.error('Main div not found');
    }
}

function initializeCurrencyBar(){ 
    // Create the currency bar container
    const currencyPanel = document.createElement('section');
    currencyPanel.classList.add('currency-panel');
    currencyPanel.id = 'currency-bar';
    currencyPanel.setAttribute('aria-label', 'Currency Bars');

    const primaryCurrencyBar = document.createElement('div');
    primaryCurrencyBar.classList.add('currency-bar');
    primaryCurrencyBar.id = 'currency-bar-primary';
    primaryCurrencyBar.setAttribute('aria-label', 'Primary Currency Bar');

    const secondaryCurrencyBar = document.createElement('div');
    secondaryCurrencyBar.classList.add('currency-bar');
    secondaryCurrencyBar.id = 'currency-bar-secondary';
    secondaryCurrencyBar.setAttribute('aria-label', 'Secondary Currency Bar');

    const gameState = getState(); // Retrieves the initial player currency values
    
    // Coins
    primaryCurrencyBar.appendChild(createCurrencyItem('Coins', gameState.coins, 'coins', 'Player coins', {
        offset: true,
    }));

    // Seeds Group
    secondaryCurrencyBar.appendChild(createCurrencyGroup('Seeds', [
        {
            label: 'Wheat',
            value: gameState.wheatSeeds,
            elementId: 'wheat-seeds',
            ariaLabel: 'Wheat seeds',
        },
        {
            label: 'Corn',
            value: gameState.cornSeeds,
            elementId: 'corn-seeds',
            ariaLabel: 'Corn seeds',
            itemId: 'corn-seeds-item',
            display: gameState.cornUnlocked ? 'flex' : 'none',
        },
        {
            label: 'Tomato',
            value: gameState.tomatoSeeds,
            elementId: 'tomato-seeds',
            ariaLabel: 'Tomato seeds',
            itemId: 'tomato-seeds-item',
            display: gameState.tomatoUnlocked ? 'flex' : 'none',
        },
    ]));

    // Water
    primaryCurrencyBar.appendChild(createCurrencyItem('Water', gameState.water, 'water', 'Current water', {
        offset: true,
    }));
    primaryCurrencyBar.appendChild(createCurrencyItem('Water Cap', gameState.waterCapacity, 'water-capacity', 'Water capacity', {
        offset: true,
    }));

    // Crops Group
    secondaryCurrencyBar.appendChild(createCurrencyGroup('Crops', [
        {
            label: 'Wheat',
            value: gameState.wheat,
            elementId: 'wheat',
            ariaLabel: 'Wheat crops',
            itemId: 'wheat-item',
        },
        {
            label: 'Corn',
            value: gameState.corn,
            elementId: 'corn',
            ariaLabel: 'Corn crops',
            itemId: 'corn-item',
            display: gameState.cornUnlocked ? 'flex' : 'none',
        },
        {
            label: 'Tomato',
            value: gameState.tomato,
            elementId: 'tomato',
            ariaLabel: 'Tomato crops',
            itemId: 'tomato-item',
            display: gameState.tomatoUnlocked ? 'flex' : 'none',
        },
    ]));

    currencyPanel.appendChild(primaryCurrencyBar);
    currencyPanel.appendChild(secondaryCurrencyBar);

    const htmlMain = document.querySelector('main');
    htmlMain.appendChild(currencyPanel);
}

function updateCurrencyBar() {
    const gameState = getState();
    const storeValues = getStoreValues();

    // Update the currency values in the UI
    document.getElementById('coins').innerText = gameState.coins;
    
    // Update seed counts
    document.getElementById('wheat-seeds').innerText = gameState.wheatSeeds;
    document.getElementById('corn-seeds').innerText = gameState.cornSeeds;
    document.getElementById('tomato-seeds').innerText = gameState.tomatoSeeds;
    
    // Update crop counts
    document.getElementById('wheat').innerText = gameState.wheat;
    document.getElementById('corn').innerText = gameState.corn;
    document.getElementById('tomato').innerText = gameState.tomato;
    
    document.getElementById('water').innerText = gameState.water;
    document.getElementById('water-capacity').innerText = gameState.waterCapacity;
    
    updatePlotCostDisplay();
    trackAchievements();
    logGameState();
//    logUpgradeValues();    
}


function updatePlotCostDisplay() {
    const gameState = getState();
    const storeValues = getStoreValues();
    const buyPlotCost = document.getElementById('plot-cost');
    if (buyPlotCost) {
        buyPlotCost.textContent = `${storeValues.plotCost} coin(s)`;
        //console.log(`Updated plot cost display to ${gameState.plotCost} coin(s)`); // Debug statement
    } else {
        console.log('Error: buyPlotCost element not found'); // Debug statement
    }
}

export { initializeCurrencyBarTitle, initializeCurrencyBar, updateCurrencyBar };