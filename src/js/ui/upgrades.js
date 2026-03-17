//src/js/ui/upgrades.js+

import { savePartialSnapshot } from "../persistence.js";
import { incrementTotalClicks } from "../state.js";
import { updateClicksDisplay } from "./clicks.js";
import {
    buyWaterCapacityUpgrade,
    buyExpandedClickUpgradeMk1,
    buyExpandedClickUpgradeMk2,
    buyExpandedClickUpgradeMk3,
    buyToolAutoChangerUpgrade,
    buyToolAutoChangerChargePack100,
    buyToolAutoChangerChargePack500,
    buyToolAutoChangerChargePack1000,
} from "../handlers/upgradeHandlers.js";

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

    toolAutoChangerCost: 75,
    toolAutoChangerPurchased: false,
    toolAutoChangerEnabled: false,
    toolAutoChangerCharges: 0,
    toolAutoChangerChargePack100Cost: 25,
    toolAutoChangerChargePack500Cost: 100,
    toolAutoChangerChargePack1000Cost: 175,
    toolAutoChangerChargePack100Unlocked: false,
    toolAutoChangerChargePack500Unlocked: false,
    toolAutoChangerChargePack1000Unlocked: false,
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
    let waterUpgradesSection = document.getElementById('water-upgrades-section');

    if (waterUpgradesSection) {
        addWaterUpgradeButton();
        return;
    }

    // Max Water Capacity Upgrades Section
    waterUpgradesSection = document.createElement('section');
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

    if (document.getElementById('water-upgrade-cap-button') || document.getElementById('water-upgrade-cap-cost')) {
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
    const waterUpgradeCost = Math.max(0, Number.parseInt(upgradeValues.waterUpgradeCost, 10) || 0);
    upgradeWaterCapCost.textContent = `${waterUpgradeCost} coins`;
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
    const numericWaterUpgradeCost = Math.max(0, Number.parseInt(waterUpgradeCost, 10) || 0);
    upgradeWaterCapCost.textContent = `${numericWaterUpgradeCost} coins`;
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
        expandedClickUpgradesTitle.textContent = 'Click Upgrades';
        expandedClickUpgradesSection.appendChild(expandedClickUpgradesTitle);

        const expandedClickGroup = document.createElement('section');
        expandedClickGroup.classList.add('click-upgrade-group');
        expandedClickGroup.id = 'expanded-click-upgrade-group';

        const expandedClickGroupTitle = document.createElement('h4');
        expandedClickGroupTitle.classList.add('click-upgrade-group-title');
        expandedClickGroupTitle.textContent = 'Expanded Click';
        expandedClickGroup.appendChild(expandedClickGroupTitle);

        const toolAutoChangerGroup = document.createElement('section');
        toolAutoChangerGroup.classList.add('click-upgrade-group');
        toolAutoChangerGroup.id = 'tool-auto-changer-upgrade-group';

        const toolAutoChangerGroupTitle = document.createElement('h4');
        toolAutoChangerGroupTitle.classList.add('click-upgrade-group-title');
        toolAutoChangerGroupTitle.textContent = 'Tool Auto-Changer';
        toolAutoChangerGroup.appendChild(toolAutoChangerGroupTitle);

        expandedClickUpgradesSection.appendChild(expandedClickGroup);
        expandedClickUpgradesSection.appendChild(toolAutoChangerGroup);

        // Add the Upgrades section to the store or main window
        const mainDiv = document.getElementById('upgrades-container'); // Assuming 'main' is the main container
        if (mainDiv) {
            mainDiv.appendChild(expandedClickUpgradesSection);
        } else {
            console.error('Upgrades Container not found');
            return;
        }
    }

    renderClickUpgradesSection();
}

function renderClickUpgradesSection() {
    addExpandedClickUpgradeButton();
    addToolAutoChangerControls();
}

function addExpandedClickUpgradeButton() {
    const expandedClickUpgradesSection = document.getElementById('expanded-click-upgrade-group');

    if (!expandedClickUpgradesSection) {
        console.error('Expanded Click Upgrades Group not found in the DOM');
        return;
    }

    const existingRows = expandedClickUpgradesSection.querySelectorAll('.click-upgrade-row');
    existingRows.forEach((row) => row.remove());

    const ensureMkToggle = (level, enabledKey) => {
        const toggleId = `expanded-click-mk${level}-toggle-checkbox`;
        const row = document.createElement('div');
        row.classList.add('click-upgrade-row');
        row.id = `expanded-click-row-${level}`;

        const label = document.createElement('label');
        label.classList.add('expanded-click-label');
        label.id = `expanded-click-mk${level}-toggle-label`;
        label.textContent = `Mk. ${level}`;
        label.htmlFor = toggleId;

        const toggle = document.createElement('input');
        toggle.classList.add('expanded-click-checkbox');
        toggle.type = 'checkbox';
        toggle.id = toggleId;
        toggle.checked = Boolean(upgradeValues[enabledKey]);
        toggle.addEventListener('change', function() {
            updateUpgradeValues({ [enabledKey]: this.checked });
            incrementTotalClicks();
            updateClicksDisplay();
        });

        row.appendChild(label);
        row.appendChild(toggle);
        expandedClickUpgradesSection.appendChild(row);
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

    const buyRow = document.createElement('div');
    buyRow.classList.add('click-upgrade-row');

    const expandedClickUpgradeBuyButton = document.createElement('button');
    expandedClickUpgradeBuyButton.classList.add('upgrade-button');
    expandedClickUpgradeBuyButton.id = `expanded-click-upgrade-mk${nextLevel}-buy-button`;
    expandedClickUpgradeBuyButton.textContent = `Unlock Mk.${nextLevel}`;
    expandedClickUpgradeBuyButton.addEventListener('click', nextHandler);
    buyRow.appendChild(expandedClickUpgradeBuyButton);

    const expandedClickUpgradeCost = document.createElement('span');
    expandedClickUpgradeCost.classList.add('upgrade-price');
    expandedClickUpgradeCost.id = nextCostId;
    expandedClickUpgradeCost.textContent = `${nextCost} coins`;
    buyRow.appendChild(expandedClickUpgradeCost);

    expandedClickUpgradesSection.appendChild(buyRow);
}

function addToolAutoChangerControls() {
    const clickUpgradesSection = document.getElementById('tool-auto-changer-upgrade-group');

    if (!clickUpgradesSection) {
        console.error('Tool Auto-Changer Upgrades Group not found in the DOM');
        return;
    }

    const existingRows = clickUpgradesSection.querySelectorAll('.click-upgrade-row');
    existingRows.forEach((row) => row.remove());

    const currentUpgradeValues = getUpgradeValues();

    if (!currentUpgradeValues.toolAutoChangerPurchased) {
        const buyRow = document.createElement('div');
        buyRow.classList.add('click-upgrade-row');

        const buyButton = document.createElement('button');
        buyButton.classList.add('upgrade-button');
        buyButton.id = 'tool-auto-changer-buy-button';
        buyButton.textContent = 'Unlock Tool Auto-Changer';
        buyButton.addEventListener('click', buyToolAutoChangerUpgrade);
        buyRow.appendChild(buyButton);

        const buyCost = document.createElement('span');
        buyCost.classList.add('upgrade-price');
        buyCost.id = 'tool-auto-changer-buy-cost';
        buyCost.textContent = `${currentUpgradeValues.toolAutoChangerCost} coins`;
        buyRow.appendChild(buyCost);
        clickUpgradesSection.appendChild(buyRow);
        return;
    }

    const toggleRow = document.createElement('div');
    toggleRow.classList.add('click-upgrade-row');

    const toggleLabel = document.createElement('label');
    toggleLabel.classList.add('expanded-click-label');
    toggleLabel.id = 'tool-auto-changer-toggle-label';
    toggleLabel.textContent = 'Enabled';
    toggleLabel.htmlFor = 'tool-auto-changer-toggle-checkbox';

    const toggle = document.createElement('input');
    toggle.classList.add('expanded-click-checkbox');
    toggle.type = 'checkbox';
    toggle.id = 'tool-auto-changer-toggle-checkbox';
    toggle.checked = Boolean(currentUpgradeValues.toolAutoChangerEnabled);
    toggle.addEventListener('change', function() {
        updateUpgradeValues({ toolAutoChangerEnabled: this.checked });
        incrementTotalClicks();
        updateClicksDisplay();
    });

    const chargeDisplay = document.createElement('span');
    chargeDisplay.classList.add('upgrade-price');
    chargeDisplay.id = 'tool-auto-changer-charge-display';
    chargeDisplay.textContent = `Charges: ${currentUpgradeValues.toolAutoChangerCharges}`;

    toggleRow.appendChild(toggleLabel);
    toggleRow.appendChild(toggle);
    toggleRow.appendChild(chargeDisplay);
    clickUpgradesSection.appendChild(toggleRow);

    const chargePacks = [
        {
            amount: 100,
            buttonId: 'tool-auto-changer-charge-pack-100-button',
            costId: 'tool-auto-changer-charge-pack-100-cost',
            unlocked: currentUpgradeValues.toolAutoChangerChargePack100Unlocked,
            cost: currentUpgradeValues.toolAutoChangerChargePack100Cost,
            handler: buyToolAutoChangerChargePack100,
        },
        {
            amount: 500,
            buttonId: 'tool-auto-changer-charge-pack-500-button',
            costId: 'tool-auto-changer-charge-pack-500-cost',
            unlocked: currentUpgradeValues.toolAutoChangerChargePack500Unlocked,
            cost: currentUpgradeValues.toolAutoChangerChargePack500Cost,
            handler: buyToolAutoChangerChargePack500,
        },
        {
            amount: 1000,
            buttonId: 'tool-auto-changer-charge-pack-1000-button',
            costId: 'tool-auto-changer-charge-pack-1000-cost',
            unlocked: currentUpgradeValues.toolAutoChangerChargePack1000Unlocked,
            cost: currentUpgradeValues.toolAutoChangerChargePack1000Cost,
            handler: buyToolAutoChangerChargePack1000,
        },
    ];

    chargePacks.forEach(({ amount, buttonId, costId, unlocked, cost, handler }) => {
        if (!unlocked) {
            return;
        }

        const packRow = document.createElement('div');
        packRow.classList.add('click-upgrade-row');

        const packButton = document.createElement('button');
        packButton.classList.add('upgrade-button');
        packButton.id = buttonId;
        packButton.textContent = `Buy ${amount}x Charges`;
        packButton.addEventListener('click', handler);
        packRow.appendChild(packButton);

        const packCost = document.createElement('span');
        packCost.classList.add('upgrade-price');
        packCost.id = costId;
        packCost.textContent = `${cost} coins`;
        packRow.appendChild(packCost);

        clickUpgradesSection.appendChild(packRow);
    });
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
         renderClickUpgradesSection,
         addExpandedClickUpgradeButton,
         addToolAutoChangerControls,
         //updateExpandedClickUpgradeButton,
}

