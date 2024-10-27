// ui/currency.js
import { getState, logGameState } from "../state.js";
import { trackMilestones } from "../handlers/milestoneHandlers.js";
import { getStoreValues, initializeStore } from "./store.js";
import { logUpgradeValues } from "./upgrades.js";

function initializeCurrencyBar(){ 
    // Create the currency bar container
    const currencyBar = document.createElement('section')
    currencyBar.classList.add('currency-bar');
    currencyBar.id = 'currency-bar';
    currencyBar.setAttribute('aria-label', 'Currency Bar');

    const gameState = getState(); // Retrieves the initial player currency values
    const storeValues = getStoreValues();
    const currencyItems = [
        { label: 'Coins', id: 'coins', value: gameState.coins, ariaLabel: 'Player coins' },
        { label: 'Seeds', id: 'seeds', value: gameState.seeds, ariaLabel: 'Player seeds' },
        { label: 'Water', id: 'water', value: gameState.water, ariaLabel: 'Current water' },
        { label: 'Water Capacity', id: 'water-capacity', value: gameState.waterCapacity, ariaLabel: 'Water capacity' },
        { label: 'Crops', id: 'crops', value: gameState.crops, ariaLabel: 'Player crops' }
    ];

    currencyItems.forEach(item => {
        const currencyItem = document.createElement('div');
        currencyItem.classList.add('currency-item');
        currencyItem.innerHTML = `${item.label}:<br> <span id="${item.id}" aria-label="${item.ariaLabel}">${item.value}</span>`;
        currencyBar.appendChild(currencyItem);
    });

    const htmlMain = document.querySelector('main');
    htmlMain.insertBefore(currencyBar, htmlMain.firstChild)
}

function updateCurrencyBar() {
    const gameState = getState();
    const storeValues = getStoreValues();

    // Update the currency values in the UI
    document.getElementById('coins').innerText = gameState.coins;
    document.getElementById('seeds').innerText = gameState.seeds;
    document.getElementById('crops').innerText = gameState.crops;
    document.getElementById('water').innerText = gameState.water;
    document.getElementById('water-capacity').innerText = gameState.waterCapacity;
    updatePlotCostDisplay();
    trackMilestones();
    logGameState();
    logUpgradeValues();    
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

export { initializeCurrencyBar, updateCurrencyBar };