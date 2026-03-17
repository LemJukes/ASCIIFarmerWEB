// ./handlers/upgradeHandlers.js

import { getState, updateState, incrementTotalClicks } from "../state.js";
import { updateCurrencyBar } from "../ui/currency.js";
import {
    getUpgradeValues,
    updateUpgradeValues,
    renderClickUpgradesSection,
} from "../ui/upgrades.js";
import { updateClicksDisplay } from "../ui/clicks.js";

function finalizeClickUpgradeInteraction() {
    renderClickUpgradesSection();
    updateCurrencyBar();
    incrementTotalClicks();
    updateClicksDisplay();
}

function buyToolAutoChangerChargePack(amount, cost) {
    const gameState = getState();
    const upgradeValues = getUpgradeValues();

    if (gameState.coins < cost) {
        alert('Not enough coins for this upgrade.');
        return;
    }

    updateState({ coins: gameState.coins - cost });
    updateUpgradeValues({
        toolAutoChangerCharges: upgradeValues.toolAutoChangerCharges + amount,
    });

    finalizeClickUpgradeInteraction();
}

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
        incrementTotalClicks();
        updateClicksDisplay();

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
    console.log(`ExpandedClickMk1Purchased is now: ${upgradeValues.expandedClickMk1Purchased}`);

    console.log('Expanded Click Upgrade Purchased');
    finalizeClickUpgradeInteraction();
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
        console.log(`ExpandedClickMk2Purchased is now: ${upgradeValues.expandedClickMk2Purchased}`);

        console.log('Expanded Click Mk.2 Upgrade Purchased');
        finalizeClickUpgradeInteraction();
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
        console.log(`ExpandedClickMk3Purchased is now: ${upgradeValues.expandedClickMk3Purchased}`);

        console.log('Expanded Click Mk.3 Upgrade Purchased');
        finalizeClickUpgradeInteraction();
    } else {
        alert('Not enough coins for this upgrade.');
    }
}

function buyToolAutoChangerUpgrade() {
    const gameState = getState();
    const upgradeValues = getUpgradeValues();

    if (gameState.coins < upgradeValues.toolAutoChangerCost) {
        alert('Not enough coins for this upgrade.');
        return;
    }

    updateState({ coins: gameState.coins - upgradeValues.toolAutoChangerCost });
    updateUpgradeValues({ toolAutoChangerPurchased: true });
    finalizeClickUpgradeInteraction();
}

function buyToolAutoChangerChargePack100() {
    const upgradeValues = getUpgradeValues();
    buyToolAutoChangerChargePack(100, upgradeValues.toolAutoChangerChargePack100Cost);
}

function buyToolAutoChangerChargePack500() {
    const upgradeValues = getUpgradeValues();
    buyToolAutoChangerChargePack(500, upgradeValues.toolAutoChangerChargePack500Cost);
}

function buyToolAutoChangerChargePack1000() {
    const upgradeValues = getUpgradeValues();
    buyToolAutoChangerChargePack(1000, upgradeValues.toolAutoChangerChargePack1000Cost);
}


export {
    buyWaterCapacityUpgrade,
    updateWaterRefillsPurchased,
    buyExpandedClickUpgradeMk1,
    buyExpandedClickUpgradeMk2,
    buyExpandedClickUpgradeMk3,
    buyToolAutoChangerUpgrade,
    buyToolAutoChangerChargePack100,
    buyToolAutoChangerChargePack500,
    buyToolAutoChangerChargePack1000,
};
