// ui/currency.js
import { getState, logGameState } from "../state.js";
import { trackAchievements } from "../handlers/achievementHandlers.js";
import { getStoreValues, initializeStore } from "./store.js";
import { logUpgradeValues } from "./upgrades.js";

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
    const currencyBar = document.createElement('section')
    currencyBar.classList.add('currency-bar');
    currencyBar.id = 'currency-bar';
    currencyBar.setAttribute('aria-label', 'Currency Bar');

    const gameState = getState(); // Retrieves the initial player currency values
    
    // Coins
    const coinsItem = document.createElement('div');
    coinsItem.classList.add('currency-item');
    coinsItem.innerHTML = `Coins:<br> <span id="coins" aria-label="Player coins">${gameState.coins}</span>`;
    currencyBar.appendChild(coinsItem);

    // Seeds Group
    const seedsGroup = document.createElement('div');
    seedsGroup.classList.add('currency-group');
    seedsGroup.innerHTML = `<strong>Seeds</strong>`;
    
    const wheatSeedsItem = document.createElement('div');
    wheatSeedsItem.classList.add('currency-item', 'currency-subitem');
    wheatSeedsItem.innerHTML = `Wheat:<br> <span id="wheat-seeds" aria-label="Wheat seeds">${gameState.wheatSeeds}</span>`;
    seedsGroup.appendChild(wheatSeedsItem);
    
    const cornSeedsItem = document.createElement('div');
    cornSeedsItem.classList.add('currency-item', 'currency-subitem');
    cornSeedsItem.id = 'corn-seeds-item';
    cornSeedsItem.style.display = gameState.cornUnlocked ? 'flex' : 'none';
    cornSeedsItem.innerHTML = `Corn:<br> <span id="corn-seeds" aria-label="Corn seeds">${gameState.cornSeeds}</span>`;
    seedsGroup.appendChild(cornSeedsItem);
    
    const tomatoSeedsItem = document.createElement('div');
    tomatoSeedsItem.classList.add('currency-item', 'currency-subitem');
    tomatoSeedsItem.id = 'tomato-seeds-item';
    tomatoSeedsItem.style.display = gameState.tomatoUnlocked ? 'flex' : 'none';
    tomatoSeedsItem.innerHTML = `Tomato:<br> <span id="tomato-seeds" aria-label="Tomato seeds">${gameState.tomatoSeeds}</span>`;
    seedsGroup.appendChild(tomatoSeedsItem);
    
    currencyBar.appendChild(seedsGroup);

    // Water
    const waterItem = document.createElement('div');
    waterItem.classList.add('currency-item');
    waterItem.innerHTML = `Water:<br> <span id="water" aria-label="Current water">${gameState.water}</span>`;
    currencyBar.appendChild(waterItem);
    
    const waterCapItem = document.createElement('div');
    waterCapItem.classList.add('currency-item');
    waterCapItem.innerHTML = `Water Cap:<br> <span id="water-capacity" aria-label="Water capacity">${gameState.waterCapacity}</span>`;
    currencyBar.appendChild(waterCapItem);

    // Crops Group
    const cropsGroup = document.createElement('div');
    cropsGroup.classList.add('currency-group');
    cropsGroup.innerHTML = `<strong>Crops</strong>`;
    
    const wheatItem = document.createElement('div');
    wheatItem.classList.add('currency-item', 'currency-subitem');
    wheatItem.id = 'wheat-item';
    wheatItem.innerHTML = `Wheat:<br> <span id="wheat" aria-label="Wheat crops">${gameState.wheat}</span>`;
    cropsGroup.appendChild(wheatItem);
    
    const cornItem = document.createElement('div');
    cornItem.classList.add('currency-item', 'currency-subitem');
    cornItem.id = 'corn-item';
    cornItem.style.display = gameState.cornUnlocked ? 'flex' : 'none';
    cornItem.innerHTML = `Corn:<br> <span id="corn" aria-label="Corn crops">${gameState.corn}</span>`;
    cropsGroup.appendChild(cornItem);
    
    const tomatoItem = document.createElement('div');
    tomatoItem.classList.add('currency-item', 'currency-subitem');
    tomatoItem.id = 'tomato-item';
    tomatoItem.style.display = gameState.tomatoUnlocked ? 'flex' : 'none';
    tomatoItem.innerHTML = `Tomato:<br> <span id="tomato" aria-label="Tomato crops">${gameState.tomato}</span>`;
    cropsGroup.appendChild(tomatoItem);
    
    currencyBar.appendChild(cropsGroup);

    const htmlMain = document.querySelector('main');
    htmlMain.insertBefore(currencyBar, htmlMain.firstChild)
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

export { initializeCurrencyBarTitle, initializeCurrencyBar, updateCurrencyBar };