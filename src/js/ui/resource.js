// ui/resource.js
import { getState, logGameState } from "../state.js";
import { trackAchievements } from "../handlers/achievementHandlers.js";
import { getStoreValues, initializeStore } from "./store.js";
//import { logUpgradeValues } from "./upgrades.js";

const RESOURCES_UPDATED_EVENT = 'resources:updated';

function createResourceItem(label, value, elementId, ariaLabel, options = {}) {
    const resourceItem = document.createElement('div');
    resourceItem.classList.add('resource-item');

    if (options.offset) {
        resourceItem.classList.add('resource-item--offset');
    }

    if (options.subitem) {
        resourceItem.classList.add('resource-subitem');
    }

    if (options.itemId) {
        resourceItem.id = options.itemId;
    }

    if (options.display) {
        resourceItem.style.display = options.display;
    }

    const labelEl = document.createElement('span');
    labelEl.classList.add('resource-item-label');
    labelEl.textContent = `${label}:`;

    const valueEl = document.createElement('span');
    valueEl.id = elementId;
    valueEl.setAttribute('aria-label', ariaLabel);
    valueEl.textContent = String(value);

    resourceItem.appendChild(labelEl);
    resourceItem.appendChild(valueEl);
    return resourceItem;
}

function createResourceGroup(title, items) {
    const resourceGroup = document.createElement('div');
    resourceGroup.classList.add('resource-group');
    resourceGroup.innerHTML = `<strong>${title}</strong>`;

    items.forEach((item) => {
        resourceGroup.appendChild(createResourceItem(item.label, item.value, item.elementId, item.ariaLabel, {
            subitem: true,
            itemId: item.itemId,
            display: item.display,
        }));
    });

    return resourceGroup;
}

function initializeResourceBarTitle() {
    // Resource Bar Title
    const resourceBarTitle = document.createElement('section');
    resourceBarTitle.classList.add('container-title');
    resourceBarTitle.id = 'resource-bar-title';
    resourceBarTitle.setAttribute('aria-label', 'Resource Bar Title');
    resourceBarTitle.textContent = 'Player Resources';

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(resourceBarTitle);
    } else {
        console.error('Main div not found');
    }
}

function initializeResourceBar(){ 
    // Create the resource bar container
    const resourcePanel = document.createElement('section');
    resourcePanel.classList.add('resource-panel');
    resourcePanel.id = 'resource-bar';
    resourcePanel.setAttribute('aria-label', 'Resource Bars');

    const primaryResourceBar = document.createElement('div');
    primaryResourceBar.classList.add('resource-bar');
    primaryResourceBar.id = 'resource-bar-primary';
    primaryResourceBar.setAttribute('aria-label', 'Primary Resource Bar');

    const secondaryResourceBar = document.createElement('div');
    secondaryResourceBar.classList.add('resource-bar');
    secondaryResourceBar.id = 'resource-bar-secondary';
    secondaryResourceBar.setAttribute('aria-label', 'Secondary Resource Bar');

    const tertiaryResourceBar = document.createElement('div');
    tertiaryResourceBar.classList.add('resource-bar');
    tertiaryResourceBar.id = 'resource-bar-tertiary';
    tertiaryResourceBar.setAttribute('aria-label', 'Tertiary Resource Bar');

    const gameState = getState(); // Retrieves the initial player resource values
    
    // Coins Section
    primaryResourceBar.appendChild(createResourceGroup('Coins', [
        {
            label: 'Balance',
            value: gameState.coins,
            elementId: 'coins',
            ariaLabel: 'Player coins',
        },
    ]));

    // Equipment Resources Section
    secondaryResourceBar.appendChild(createResourceGroup('Equipment Resources', [
        {
            label: 'Water',
            value: gameState.water,
            elementId: 'water',
            ariaLabel: 'Current water',
        },
        {
            label: 'Water Cap',
            value: gameState.waterCapacity,
            elementId: 'water-capacity',
            ariaLabel: 'Water capacity',
        },
    ]));

    // Seeds Group
    tertiaryResourceBar.appendChild(createResourceGroup('Seeds', [
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

    // Crops Group
    tertiaryResourceBar.appendChild(createResourceGroup('Crops', [
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

    resourcePanel.appendChild(primaryResourceBar);
    resourcePanel.appendChild(secondaryResourceBar);
    resourcePanel.appendChild(tertiaryResourceBar);

    const htmlMain = document.querySelector('main');
    htmlMain.appendChild(resourcePanel);
}

function updateResourceBar() {
    const gameState = getState();
    const storeValues = getStoreValues();

    // Update the resource values in the UI
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
    document.dispatchEvent(new CustomEvent(RESOURCES_UPDATED_EVENT));
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

export { RESOURCES_UPDATED_EVENT, initializeResourceBarTitle, initializeResourceBar, updateResourceBar };