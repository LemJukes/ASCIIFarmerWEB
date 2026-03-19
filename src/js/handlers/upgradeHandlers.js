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
import { progressionConfig } from "../../configs/progressionConfig.js";

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
        gameState.waterCapacity += progressionConfig.upgradesEconomy.waterCapacity.capacityIncrease;
        gameState.coins -= currentWaterUpgradeCost;
        gameState.totalCoinsSpent += currentWaterUpgradeCost;

        const newWaterUpgradeCost = Math.ceil(currentWaterUpgradeCost * progressionConfig.upgradesEconomy.waterCapacity.scalingMultiplier);
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

function buyExpandedClickUpgrade(level) {
    const gameState = getState();
    const upgradeValues = getUpgradeValues();
    const unlockedKey = `expandedClickMk${level}Unlocked`;
    const purchasedKey = `expandedClickMk${level}Purchased`;
    const costKey = level === 1 ? 'expandedClickUpgradeCost' : `expandedClickMk${level}Cost`;
    const upgradeCost = upgradeValues[costKey];

    if (!upgradeValues[unlockedKey]) {
        alert(`Expanded Click Mk.${level} is still locked.`);
        return;
    }

    if (gameState.coins >= upgradeCost) {
        gameState.coins -= upgradeCost;
        gameState.totalCoinsSpent += upgradeCost;
        upgradeValues.expandedClickUpgradeLVL++;
        upgradeValues[purchasedKey] = true;
        updateState(gameState);
        updateUpgradeValues(upgradeValues);
        console.log(`${purchasedKey} is now: ${upgradeValues[purchasedKey]}`);

        console.log(`Expanded Click Mk.${level} Upgrade Purchased`);
        finalizeClickUpgradeInteraction();
    } else {
        alert('Not enough coins for this upgrade.');
    }
}

function buyExpandedClickUpgradeMk1() {
    buyExpandedClickUpgrade(1);
}

function buyExpandedClickUpgradeMk2() {
    buyExpandedClickUpgrade(2);
}

function buyExpandedClickUpgradeMk3() {
    buyExpandedClickUpgrade(3);
}

function buyExpandedClickUpgradeMk4() {
    buyExpandedClickUpgrade(4);
}

function buyExpandedClickUpgradeMk5() {
    buyExpandedClickUpgrade(5);
}

function buyExpandedClickUpgradeMk6() {
    buyExpandedClickUpgrade(6);
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
    buyExpandedClickUpgradeMk4,
    buyExpandedClickUpgradeMk5,
    buyExpandedClickUpgradeMk6,
    buyToolAutoChangerUpgrade,
    buyToolAutoChangerChargePack100,
    buyToolAutoChangerChargePack500,
    buyToolAutoChangerChargePack1000,
};
