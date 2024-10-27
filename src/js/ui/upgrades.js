//src/js/ui/upgrades.js+

import { buyWaterCapacityUpgrade, buyExpandedClickUpgradeMk1 } from "../handlers/upgradeHandlers.js";

const upgradeValues = {
    waterUpgradeCost: 50,
    
    //Epanded Click Values
    expandedClickUpgradeCost: 100,
    expandedClickUpgradeLVL: 1,

        //Mk1 Values
        expandedClickMk1Purchased: false, // Flag indicating whether the expanded click upgrade has been purchased
        expandedClickMk1Enabled: false,   // Flag indicating whether the expanded click upgrade is enabled
}

function getUpgradeValues() {
    return { ...upgradeValues};
}

function updateUpgradeValues(updates) {
    Object.assign(upgradeValues, updates);
}

function logUpgradeValues() {
    const upgadeValues = getUpgradeValues();
    console.log('Upgrade Values:', upgradeValues);
}


function initializeUpgradesTitle() {
    // Store Title as a Button
    const upgradesTitle = document.createElement('section');
    upgradesTitle.classList.add('container-title');
    upgradesTitle.id = 'upgrades-container-title';
    upgradesTitle.setAttribute('aria-label', 'Upgrades Container Title');
    upgradesTitle.textContent = 'Upgrades';

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(upgradesTitle);
    } else {
        console.error('Main div not found');
    }
}

function initializeUpgrades() {

    // Upgrades Section Container
    const upgradesContainer = document.createElement('section');
    upgradesContainer.classList.add('upgrades-container');
    upgradesContainer.id = 'upgrades-container';
    upgradesContainer.setAttribute('aria-label', 'Upgrades Container');

    // Add the Upgrades section to the store or main window
    const mainDiv = document.querySelector('main'); // Assuming 'main' is the main container
    if (mainDiv) {
        mainDiv.appendChild(upgradesContainer);
    } else {
        console.error('Main div not found');
    }
}

function initializeWaterUpgradesSection() {
    // Max Water Capacity Upgrades Section
    const waterUpgradesSection = document.createElement('section');
    waterUpgradesSection.classList.add('upgrades-section');
    waterUpgradesSection.id = 'water-upgrades-section';
    waterUpgradesSection.setAttribute('aria-label', 'Maximum Water Capacity Upgrades Section');

    // Max Water Capacity Upgrades Section Title
    const waterUpgradesTitle = document.createElement('h3');
    waterUpgradesTitle.classList.add('upgrades-section-title');
    waterUpgradesTitle.id = 'water-upgrades-title';
    waterUpgradesTitle.textContent = 'Water Capacity Upgrades';
    waterUpgradesTitle.setAttribute('aria-label', 'Upgrades Section Title');
    waterUpgradesSection.appendChild(waterUpgradesTitle);

    // Add the Upgrades section to the store or main window
    const mainDiv = document.getElementById('upgrades-container'); // Assuming 'main' is the main container
    if (mainDiv) {
        mainDiv.appendChild(waterUpgradesSection);
        addWaterUpgradeButton();
    } else {
        console.error('Upgrades Container not found');
    }
}

function addWaterUpgradeButton() {
    const waterUpgradesSection = document.getElementById('water-upgrades-section');

    if (!waterUpgradesSection) {
        console.error('Water Upgrades Section not found in the DOM');
        return;
    }

    // Water Capacity Upgrade Purchase Button
    const upgradeWaterCapButton = document.createElement('button');
    upgradeWaterCapButton.classList.add('upgrade-button');
    upgradeWaterCapButton.id = 'water-upgrade-cap-button';
    upgradeWaterCapButton.textContent = '+10 Capacity';
    upgradeWaterCapButton.addEventListener('click', buyWaterCapacityUpgrade); // Assign the buyWaterUpgrade function as the click handler
    waterUpgradesSection.appendChild(upgradeWaterCapButton);

    // Water Capacity Upgrade Cost text
    const upgradeWaterCapCost = document.createElement('span');
    upgradeWaterCapCost.classList.add('upgrade-price');
    upgradeWaterCapCost.id = 'water-upgrade-cap-cost';
    upgradeWaterCapCost.textContent = upgradeValues.waterUpgradeCost + ' coins';
    waterUpgradesSection.appendChild(upgradeWaterCapCost);
}

function updateWaterUpgradeButton() {
    const upgradeWaterCapButton = document.getElementById('water-upgrade-cap-button');
    const upgradeWaterCapCost = document.getElementById('water-upgrade-cap-cost');

    if (!upgradeWaterCapButton || !upgradeWaterCapCost) {
        console.error('Water Upgrade Button or Cost Element not found in the DOM');
        return;
    }

    const { waterUpgradeCost } = getUpgradeValues();
    upgradeWaterCapCost.textContent = waterUpgradeCost + ' coins';
}

function initializeClickUpgradesSection() {
    
    // Expanded Click Upgrades Section
    const expandedClickUpgradesSection = document.createElement('section');
    expandedClickUpgradesSection.classList.add('upgrades-section');
    expandedClickUpgradesSection.id = 'click-upgrades-section';

    // Expanded Click Upgrades Section Title
    const expandedClickUpgradesTitle = document.createElement('h3');
    expandedClickUpgradesTitle.classList.add('upgrades-section-title');
    expandedClickUpgradesTitle.id = 'expanded-click-upgrades-title';
    expandedClickUpgradesTitle.textContent = 'Expanded Click Upgrades';
    expandedClickUpgradesSection.appendChild(expandedClickUpgradesTitle);

    // Add the Upgrades section to the store or main window
    const mainDiv = document.getElementById('upgrades-container'); // Assuming 'main' is the main container
    if (mainDiv) {
        mainDiv.appendChild(expandedClickUpgradesSection);
        addExpandedClickUpgradeButton();
    } else {
        console.error('Upgrades Container not found');
    }

}

function addExpandedClickUpgradeButton() {
    const expandedClickUpgradesSection = document.getElementById('click-upgrades-section');

    if (!expandedClickUpgradesSection) {
        console.error('Click Upgrades Section not found in the DOM');
        return;
    }

    // Expanded Click Upgrade Purchase Button
    const expandedClickUpgradeLVL = upgradeValues.expandedClickUpgradeLVL;
    const expandedClickUpgradeBuyButton = document.createElement('button');
    expandedClickUpgradeBuyButton.classList.add('upgrade-button');
    expandedClickUpgradeBuyButton.id = `expanded-click-upgrade-mk${expandedClickUpgradeLVL}-buy-button`;
    expandedClickUpgradeBuyButton.textContent = 'Unlock Mk.' + expandedClickUpgradeLVL ;
    // Map levels to their corresponding functions
    const buyExpandedClickUpgrade = () => {
        switch (expandedClickUpgradeLVL) {
            case 1:
                return buyExpandedClickUpgradeMk1;
            case 2:
                return buyExpandedClickUpgradeMk2;
            case 3:
                return buyExpandedClickUpgradeMk3;
            // Add more cases as needed
            default:
                throw new Error(`Unknown expanded click upgrade level: ${expandedClickUpgradeLVL}`);
        }
    };

    expandedClickUpgradeBuyButton.addEventListener('click', buyExpandedClickUpgrade());
    expandedClickUpgradesSection.appendChild(expandedClickUpgradeBuyButton);

    // Expanded Click Upgrade Cost text
    const expandedClickUpgradeCost = document.createElement('span');
    expandedClickUpgradeCost.classList.add('upgrade-price');
    expandedClickUpgradeCost.id = 'expanded-click-upgrade-cost'
    expandedClickUpgradeCost.textContent = upgradeValues.expandedClickUpgradeCost + ' coins';
    expandedClickUpgradesSection.appendChild(expandedClickUpgradeCost);
}

/*
function updateExpandedClickUpgradeButton() {
    const expandedClickUpgradesSection = document.getElementById('expanded-click-upgrades-section');
    const expandedClickUpgradeBuyButton = document.getElementById('expanded-click-upgrade-buy-button');
    const expandedClickUpgradeCost = document.getElementById('expanded-click-upgrade-cost')
    if (!expandedClickUpgradeBuyButton || !expandedClickUpgradeCost) {
        console.error('Water Upgrade Button or Cost Element not found in the DOM');
        return;
    }

    const { waterUpgradeCost } = getUpgradeValues();

    expandedClickUpgradeCost.textContent = expandedClickUpgradeCost;
}  
*/

export { getUpgradeValues,
         updateUpgradeValues,
         logUpgradeValues,
         initializeUpgradesTitle, 
         initializeUpgrades,
         initializeWaterUpgradesSection,
         addWaterUpgradeButton,
         updateWaterUpgradeButton,
         initializeClickUpgradesSection,
         addExpandedClickUpgradeButton,
         //updateExpandedClickUpgradeButton,
}

