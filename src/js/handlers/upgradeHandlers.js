// ./handlers/upgradeHandlers.js

import { getState, updateState, incrementTotalClicks } from "../state.js";
import { updateCurrencyBar } from "../ui/currency.js";
import {
    getUpgradeValues,
    updateUpgradeValues,
    updateWaterUpgradeButton,
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

    updateState({
        coins: gameState.coins - cost,
        totalCoinsSpent: gameState.totalCoinsSpent + cost,
    });
    updateUpgradeValues({
        toolAutoChangerCharges: upgradeValues.toolAutoChangerCharges + amount,
    });

    finalizeClickUpgradeInteraction();
}

function buyWaterCapacityUpgrade() {
    console.log('Water Capacity Upgrade Purchased')
    const gameState = getState();
    const upgradeValues = getUpgradeValues();
    const currentWaterUpgradeCost = Math.max(0, Number.parseInt(upgradeValues.waterUpgradeCost, 10) || 0);

    if (gameState.coins >= currentWaterUpgradeCost) {
        gameState.waterCapacity += 10;
        gameState.coins -= currentWaterUpgradeCost;
        gameState.totalCoinsSpent += currentWaterUpgradeCost;

        const newWaterUpgradeCost = Math.ceil(currentWaterUpgradeCost * 1.15);
        updateUpgradeValues({ waterUpgradeCost: newWaterUpgradeCost });
        updateWaterUpgradeButton();

        updateState(gameState);
        updateCurrencyBar();
        incrementTotalClicks();
        updateClicksDisplay();
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
    const gameState = getState();
    const upgradeValues = getUpgradeValues();

    if (!upgradeValues.expandedClickMk1Unlocked) {
        alert('Expanded Click Mk.1 is still locked.');
        return;
    }

    if (gameState.coins >= upgradeValues.expandedClickUpgradeCost) {
        gameState.coins -= upgradeValues.expandedClickUpgradeCost;
        gameState.totalCoinsSpent += upgradeValues.expandedClickUpgradeCost;
        upgradeValues.expandedClickUpgradeLVL++;
        upgradeValues.expandedClickMk1Purchased = true;
        updateState(gameState);
        updateUpgradeValues(upgradeValues);
        console.log(`ExpandedClickMk1Purchased is now: ${upgradeValues.expandedClickMk1Purchased}`);

        console.log('Expanded Click Upgrade Purchased');
        finalizeClickUpgradeInteraction();
    } else {
        alert('Not enough coins for this upgrade.');
    }
}

function buyExpandedClickUpgradeMk2() {
    const gameState = getState();
    const upgradeValues = getUpgradeValues();

    if (!upgradeValues.expandedClickMk2Unlocked) {
        alert('Expanded Click Mk.2 is still locked.');
        return;
    }
    
    if (gameState.coins >= upgradeValues.expandedClickMk2Cost) {
        gameState.coins -= upgradeValues.expandedClickMk2Cost;
        gameState.totalCoinsSpent += upgradeValues.expandedClickMk2Cost;
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

    if (!upgradeValues.expandedClickMk3Unlocked) {
        alert('Expanded Click Mk.3 is still locked.');
        return;
    }
    
    if (gameState.coins >= upgradeValues.expandedClickMk3Cost) {
        gameState.coins -= upgradeValues.expandedClickMk3Cost;
        gameState.totalCoinsSpent += upgradeValues.expandedClickMk3Cost;
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

    updateState({
        coins: gameState.coins - upgradeValues.toolAutoChangerCost,
        totalCoinsSpent: gameState.totalCoinsSpent + upgradeValues.toolAutoChangerCost,
    });
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
