// ./handlers/upgradeHandlers.js

import { getState, updateState } from "../state.js";
import { updateCurrencyBar } from "../ui/currency.js";
import { getUpgradeValues, updateUpgradeValues, updateWaterUpgradeButton } from "../ui/upgrades.js";

function buyWaterCapacityUpgrade() {
    console.log('Water Capacity Upgrade Purchased')
    const gameState = getState();
    const upgradeValues = getUpgradeValues();

    if (gameState.coins >= upgradeValues.waterUpgradeCost) {
        gameState.waterCapacity += 10;
        gameState.coins -= upgradeValues.waterUpgradeCost;

        const newWaterUpgradeCost = Math.ceil(upgradeValues.waterUpgradeCost * 1.15);
        updateUpgradeValues({ waterUpgradeCost: newWaterUpgradeCost + ' coins' });

        updateState(gameState);
        updateCurrencyBar();

        // Disable the waterUpgradeCapButton
        document.getElementById('water-upgrade-cap-button').disabled = true;
    } else {
        alert('Not enough coins for this upgrade.');
    }
}


function updateWaterRefillsPurchased() {
    const gameState = getState();
    gameState.waterRefillsPurchased++;
    updateState({ waterRefillsPurchased: gameState.waterRefillsPurchased });
}

function buyExpandedClickUpgradeMk1() {
    const upgradeValues = getUpgradeValues();
    upgradeValues.expandedClickUpgradeLVL++;
    upgradeValues.expandedClickMk1Purchased = true;
    updateUpgradeValues(upgradeValues);
    document.getElementById('expanded-click-upgrade-mk1-buy-button').remove();
    document.getElementById('expanded-click-upgrade-cost').remove();
    console.log(`ExpandedClickMk1Purchased is now: ${upgradeValues.expandedClickMk1Purchased}`);

    const clickUpgradesSection = document.getElementById('click-upgrades-section');

    // Create label
    const mk1Label = document.createElement('label');
    mk1Label.classList.add('expanded-click-label');
    mk1Label.id = "expanded-click-mk1-toggle-lable"
    mk1Label.textContent = "Mk. 1 - ";
    mk1Label.htmlFor = "expanded-click-mk1-toggle";

    // Create checkbox
    const mk1Toggle = document.createElement('input');
    mk1Toggle.classList.add('expanded-click-checkbox');
    mk1Toggle.type = "checkbox";
    mk1Toggle.id = "expanded-click-mk1-toggle-checkbox";
    mk1Toggle.checked = upgradeValues.expandedClickMk1Enabled || false; // Initialize based on current state

    // Add event listener to checkbox
    mk1Toggle.addEventListener('change', function() {
        upgradeValues.expandedClickMk1Enabled = this.checked;
        updateUpgradeValues(upgradeValues);
        console.log(`ExpandedClickMk1Enabled is now: ${upgradeValues.expandedClickMk1Enabled}`);
        console.log("The Expanded Click Mk.1 is NOT a smart tool and will not track inventory stock levels. Users are encouraged to maintain stock levels manually.");

    });

    // Append elements to the section
    clickUpgradesSection.appendChild(mk1Label);
    clickUpgradesSection.appendChild(mk1Toggle);

    console.log('Expanded Click Upgrade Purchased');
    
    // Add Mk.2 upgrade button
    addNextExpandedClickButton();
}

function buyExpandedClickUpgradeMk2() {
    const gameState = getState();
    const upgradeValues = getUpgradeValues();
    
    if (gameState.coins >= upgradeValues.expandedClickMk2Cost) {
        gameState.coins -= upgradeValues.expandedClickMk2Cost;
        upgradeValues.expandedClickUpgradeLVL++;
        upgradeValues.expandedClickMk2Purchased = true;
        updateState(gameState);
        updateUpgradeValues(upgradeValues);
        
        document.getElementById('expanded-click-upgrade-mk2-buy-button').remove();
        document.getElementById('expanded-click-upgrade-mk2-cost').remove();
        console.log(`ExpandedClickMk2Purchased is now: ${upgradeValues.expandedClickMk2Purchased}`);

        const clickUpgradesSection = document.getElementById('click-upgrades-section');

        // Create label
        const mk2Label = document.createElement('label');
        mk2Label.classList.add('expanded-click-label');
        mk2Label.id = "expanded-click-mk2-toggle-label"
        mk2Label.textContent = "Mk. 2 - ";
        mk2Label.htmlFor = "expanded-click-mk2-toggle";

        // Create checkbox
        const mk2Toggle = document.createElement('input');
        mk2Toggle.classList.add('expanded-click-checkbox');
        mk2Toggle.type = "checkbox";
        mk2Toggle.id = "expanded-click-mk2-toggle-checkbox";
        mk2Toggle.checked = upgradeValues.expandedClickMk2Enabled || false;

        // Add event listener to checkbox
        mk2Toggle.addEventListener('change', function() {
            upgradeValues.expandedClickMk2Enabled = this.checked;
            updateUpgradeValues(upgradeValues);
            console.log(`ExpandedClickMk2Enabled is now: ${upgradeValues.expandedClickMk2Enabled}`);
        });

        // Append elements to the section
        clickUpgradesSection.appendChild(mk2Label);
        clickUpgradesSection.appendChild(mk2Toggle);

        console.log('Expanded Click Mk.2 Upgrade Purchased');
        updateCurrencyBar();
        
        // Add Mk.3 upgrade button
        addNextExpandedClickButton();
    } else {
        alert('Not enough coins for this upgrade.');
    }
}

function buyExpandedClickUpgradeMk3() {
    const gameState = getState();
    const upgradeValues = getUpgradeValues();
    
    if (gameState.coins >= upgradeValues.expandedClickMk3Cost) {
        gameState.coins -= upgradeValues.expandedClickMk3Cost;
        upgradeValues.expandedClickUpgradeLVL++;
        upgradeValues.expandedClickMk3Purchased = true;
        updateState(gameState);
        updateUpgradeValues(upgradeValues);
        
        document.getElementById('expanded-click-upgrade-mk3-buy-button').remove();
        document.getElementById('expanded-click-upgrade-mk3-cost').remove();
        console.log(`ExpandedClickMk3Purchased is now: ${upgradeValues.expandedClickMk3Purchased}`);

        const clickUpgradesSection = document.getElementById('click-upgrades-section');

        // Create label
        const mk3Label = document.createElement('label');
        mk3Label.classList.add('expanded-click-label');
        mk3Label.id = "expanded-click-mk3-toggle-label"
        mk3Label.textContent = "Mk. 3 - ";
        mk3Label.htmlFor = "expanded-click-mk3-toggle";

        // Create checkbox
        const mk3Toggle = document.createElement('input');
        mk3Toggle.classList.add('expanded-click-checkbox');
        mk3Toggle.type = "checkbox";
        mk3Toggle.id = "expanded-click-mk3-toggle-checkbox";
        mk3Toggle.checked = upgradeValues.expandedClickMk3Enabled || false;

        // Add event listener to checkbox
        mk3Toggle.addEventListener('change', function() {
            upgradeValues.expandedClickMk3Enabled = this.checked;
            updateUpgradeValues(upgradeValues);
            console.log(`ExpandedClickMk3Enabled is now: ${upgradeValues.expandedClickMk3Enabled}`);
        });

        // Append elements to the section
        clickUpgradesSection.appendChild(mk3Label);
        clickUpgradesSection.appendChild(mk3Toggle);

        console.log('Expanded Click Mk.3 Upgrade Purchased');
        updateCurrencyBar();
    } else {
        alert('Not enough coins for this upgrade.');
    }
}

// Helper function to add the next expanded click upgrade button
function addNextExpandedClickButton() {
    const upgradeValues = getUpgradeValues();
    const clickUpgradesSection = document.getElementById('click-upgrades-section');
    
    if (!clickUpgradesSection) {
        console.error('Click Upgrades Section not found');
        return;
    }
    
    const currentLevel = upgradeValues.expandedClickUpgradeLVL;
    
    // Determine which button to create based on current level
    if (currentLevel === 2 && !upgradeValues.expandedClickMk2Purchased) {
        // Create Mk.2 button
        const mk2BuyButton = document.createElement('button');
        mk2BuyButton.classList.add('upgrade-button');
        mk2BuyButton.id = 'expanded-click-upgrade-mk2-buy-button';
        mk2BuyButton.textContent = 'Unlock Mk. 2';
        mk2BuyButton.addEventListener('click', buyExpandedClickUpgradeMk2);
        clickUpgradesSection.appendChild(mk2BuyButton);
        
        const mk2Cost = document.createElement('span');
        mk2Cost.classList.add('upgrade-price');
        mk2Cost.id = 'expanded-click-upgrade-mk2-cost';
        mk2Cost.textContent = upgradeValues.expandedClickMk2Cost + ' coins';
        clickUpgradesSection.appendChild(mk2Cost);
    } else if (currentLevel === 3 && !upgradeValues.expandedClickMk3Purchased) {
        // Create Mk.3 button
        const mk3BuyButton = document.createElement('button');
        mk3BuyButton.classList.add('upgrade-button');
        mk3BuyButton.id = 'expanded-click-upgrade-mk3-buy-button';
        mk3BuyButton.textContent = 'Unlock Mk. 3';
        mk3BuyButton.addEventListener('click', buyExpandedClickUpgradeMk3);
        clickUpgradesSection.appendChild(mk3BuyButton);
        
        const mk3Cost = document.createElement('span');
        mk3Cost.classList.add('upgrade-price');
        mk3Cost.id = 'expanded-click-upgrade-mk3-cost';
        mk3Cost.textContent = upgradeValues.expandedClickMk3Cost + ' coins';
        clickUpgradesSection.appendChild(mk3Cost);
    }
}



export { buyWaterCapacityUpgrade, updateWaterRefillsPurchased, buyExpandedClickUpgradeMk1, buyExpandedClickUpgradeMk2, buyExpandedClickUpgradeMk3 };
