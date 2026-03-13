//src/js/ui/upgrades.js+

import { savePartialSnapshot } from "../persistence.js";
import { buyWaterCapacityUpgrade, buyExpandedClickUpgradeMk1, buyExpandedClickUpgradeMk2, buyExpandedClickUpgradeMk3 } from "../handlers/upgradeHandlers.js";

const initialUpgradeValues = {
    waterUpgradeCost: 50,
    
    //Epanded Click Values
    expandedClickUpgradeCost: 100,
    expandedClickUpgradeLVL: 1,

        //Mk1 Values
        expandedClickMk1Purchased: false, // Flag indicating whether the expanded click upgrade has been purchased
        expandedClickMk1Enabled: false,   // Flag indicating whether the expanded click upgrade is enabled
        
        //Mk2 Values
        expandedClickMk2Cost: 500,
        expandedClickMk2Purchased: false,
        expandedClickMk2Enabled: false,
        
        //Mk3 Values
        expandedClickMk3Cost: 2000,
        expandedClickMk3Purchased: false,
        expandedClickMk3Enabled: false,
}

const upgradeValues = { ...initialUpgradeValues };

function getUpgradeValues() {
    return { ...upgradeValues};
}

function getUpgradeValuesSnapshot() {
    return { ...upgradeValues };
}

function applyUpgradeValuesSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return;
    }

    const merged = { ...initialUpgradeValues };
    for (const key of Object.keys(initialUpgradeValues)) {
        if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
            merged[key] = snapshot[key];
        }
    }

    Object.assign(upgradeValues, merged);
}

function updateUpgradeValues(updates) {
    Object.assign(upgradeValues, updates);
    savePartialSnapshot({ upgradeValues: getUpgradeValuesSnapshot() });
}

//function logUpgradeValues() {
//    const upgadeValues = getUpgradeValues();
//    console.log('Upgrade Values:', upgradeValues);
//}


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
    let expandedClickUpgradesSection = document.getElementById('click-upgrades-section');

    if (!expandedClickUpgradesSection) {
        // Expanded Click Upgrades Section
        expandedClickUpgradesSection = document.createElement('section');
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
        } else {
            console.error('Upgrades Container not found');
            return;
        }
    }

    addExpandedClickUpgradeButton();
}

function addExpandedClickUpgradeButton() {
    const expandedClickUpgradesSection = document.getElementById('click-upgrades-section');

    if (!expandedClickUpgradesSection) {
        console.error('Click Upgrades Section not found in the DOM');
        return;
    }

    const ensureMkToggle = (level, enabledKey) => {
        const toggleId = `expanded-click-mk${level}-toggle-checkbox`;
        if (document.getElementById(toggleId)) {
            return;
        }

        const label = document.createElement('label');
        label.classList.add('expanded-click-label');
        label.id = `expanded-click-mk${level}-toggle-label`;
        label.textContent = `Mk. ${level} - `;
        label.htmlFor = toggleId;

        const toggle = document.createElement('input');
        toggle.classList.add('expanded-click-checkbox');
        toggle.type = 'checkbox';
        toggle.id = toggleId;
        toggle.checked = Boolean(upgradeValues[enabledKey]);
        toggle.addEventListener('change', function() {
            updateUpgradeValues({ [enabledKey]: this.checked });
        });

        expandedClickUpgradesSection.appendChild(label);
        expandedClickUpgradesSection.appendChild(toggle);
    };

    if (upgradeValues.expandedClickMk1Purchased) {
        ensureMkToggle(1, 'expandedClickMk1Enabled');
    }

    if (upgradeValues.expandedClickMk2Purchased) {
        ensureMkToggle(2, 'expandedClickMk2Enabled');
    }

    if (upgradeValues.expandedClickMk3Purchased) {
        ensureMkToggle(3, 'expandedClickMk3Enabled');
    }

    const existingBuyButtons = expandedClickUpgradesSection.querySelectorAll('[id^="expanded-click-upgrade-mk"][id$="-buy-button"]');
    existingBuyButtons.forEach((button) => button.remove());

    const existingCostElements = expandedClickUpgradesSection.querySelectorAll('#expanded-click-upgrade-cost, #expanded-click-upgrade-mk2-cost, #expanded-click-upgrade-mk3-cost');
    existingCostElements.forEach((costElement) => costElement.remove());

    let nextLevel = null;
    let nextCost = null;
    let nextCostId = null;
    let nextHandler = null;

    if (!upgradeValues.expandedClickMk1Purchased) {
        nextLevel = 1;
        nextCost = upgradeValues.expandedClickUpgradeCost;
        nextCostId = 'expanded-click-upgrade-cost';
        nextHandler = buyExpandedClickUpgradeMk1;
    } else if (!upgradeValues.expandedClickMk2Purchased) {
        nextLevel = 2;
        nextCost = upgradeValues.expandedClickMk2Cost;
        nextCostId = 'expanded-click-upgrade-mk2-cost';
        nextHandler = buyExpandedClickUpgradeMk2;
    } else if (!upgradeValues.expandedClickMk3Purchased) {
        nextLevel = 3;
        nextCost = upgradeValues.expandedClickMk3Cost;
        nextCostId = 'expanded-click-upgrade-mk3-cost';
        nextHandler = buyExpandedClickUpgradeMk3;
    }

    if (!nextLevel || !nextHandler) {
        return;
    }

    const expandedClickUpgradeBuyButton = document.createElement('button');
    expandedClickUpgradeBuyButton.classList.add('upgrade-button');
    expandedClickUpgradeBuyButton.id = `expanded-click-upgrade-mk${nextLevel}-buy-button`;
    expandedClickUpgradeBuyButton.textContent = `Unlock Mk.${nextLevel}`;
    expandedClickUpgradeBuyButton.addEventListener('click', nextHandler);
    expandedClickUpgradesSection.appendChild(expandedClickUpgradeBuyButton);

    const expandedClickUpgradeCost = document.createElement('span');
    expandedClickUpgradeCost.classList.add('upgrade-price');
    expandedClickUpgradeCost.id = nextCostId;
    expandedClickUpgradeCost.textContent = `${nextCost} coins`;
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
         getUpgradeValuesSnapshot,
         applyUpgradeValuesSnapshot,
         updateUpgradeValues,
         //logUpgradeValues,
         initializeUpgradesTitle, 
         initializeUpgrades,
         initializeWaterUpgradesSection,
         addWaterUpgradeButton,
         updateWaterUpgradeButton,
         initializeClickUpgradesSection,
         addExpandedClickUpgradeButton,
         //updateExpandedClickUpgradeButton,
}

