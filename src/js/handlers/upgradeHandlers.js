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


    console.log('Expanded Click Upgrade Purchased')

}



export { buyWaterCapacityUpgrade, updateWaterRefillsPurchased, buyExpandedClickUpgradeMk1 };
