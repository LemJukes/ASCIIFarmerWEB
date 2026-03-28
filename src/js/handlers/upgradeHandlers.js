// ./handlers/upgradeHandlers.js

import { getState, updateState, incrementTotalClicks } from "../state.js";
import { updateResourceBar } from "../ui/resource.js";
import { updateField } from "../ui/field.js";
import {
    getUpgradeValues,
    updateUpgradeValues,
    updateWaterUpgradeButton,
    renderClickUpgradesSection,
} from "../ui/upgrades.js";
import { updateClicksDisplay } from "../ui/clicks.js";
import { showConfirmation, showDialog, showNotification } from "../ui/macNotifications.js";
import { progressionConfig } from "../configs/progressionConfig.js";

const AUTO_FARMER_MAX_LEVEL = Math.max(1, Number(progressionConfig.upgradesEconomy?.autoFarmerUpgrade?.maxLevel) || 8);

function getAutoFarmerUpgradeCostForCurrentLevel(currentLevel) {
    const normalizedCurrentLevel = Math.max(1, Number(currentLevel) || 1);
    if (normalizedCurrentLevel >= AUTO_FARMER_MAX_LEVEL) {
        return 0;
    }

    const baseCost = Math.max(1, Number(progressionConfig.upgradesEconomy?.autoFarmerUpgrade?.mk2Cost) || 200);
    const costStep = Math.max(1, Number(progressionConfig.upgradesEconomy?.autoFarmerUpgrade?.costStep) || 200);
    const nextLevel = normalizedCurrentLevel + 1;
    const stepsFromMk2 = Math.max(0, nextLevel - 2);
    return baseCost + (stepsFromMk2 * costStep);
}

function getEligibleAutoFarmerPlots(gameState) {
    const activeFieldId = gameState.activeFieldId;
    const activeField = gameState.fields?.[activeFieldId];
    if (!activeField || !Array.isArray(activeField.plotStates)) {
        return [];
    }

    return activeField.plotStates.reduce((rows, plotState, index) => {
        if (!plotState?.autoFarmer) {
            return rows;
        }

        const currentLevel = Math.min(AUTO_FARMER_MAX_LEVEL, Math.max(1, Number(plotState.autoFarmer.level) || 1));
        if (currentLevel >= AUTO_FARMER_MAX_LEVEL) {
            return rows;
        }

        rows.push({
            plotIndex: index,
            plotNumber: index + 1,
            currentLevel,
            nextLevel: currentLevel + 1,
            cost: getAutoFarmerUpgradeCostForCurrentLevel(currentLevel),
        });
        return rows;
    }, []);
}

function buildAutoFarmerSelectionBody(eligiblePlots) {
    const wrapper = document.createElement('div');
    wrapper.className = 'mac-dialog-content';

    const message = document.createElement('p');
    message.className = 'mac-dialog-message';
    message.textContent = 'Select an AutoFarmer to calibrate to the next Mk tier.';
    wrapper.appendChild(message);

    const list = document.createElement('ul');
    list.className = 'quest-popup-requirements';

    eligiblePlots.forEach((entry) => {
        const item = document.createElement('li');
        item.textContent = `Plot ${entry.plotNumber}: Mk.${entry.currentLevel} -> Mk.${entry.nextLevel} (${entry.cost} coins)`;
        list.appendChild(item);
    });

    wrapper.appendChild(list);
    return wrapper;
}

function finalizeClickUpgradeInteraction() {
    renderClickUpgradesSection();
    updateResourceBar();
    incrementTotalClicks();
    updateClicksDisplay();
}

function buyToolAutoChangerChargePack(amount, cost) {
    const gameState = getState();
    const upgradeValues = getUpgradeValues();

    if (gameState.coins < cost) {
        showNotification('Not enough coins for this upgrade.', 'Upgrades');
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
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
        showNotification('Not enough coins for this upgrade.', 'Upgrades');
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
        showNotification(`Expanded Click Mk.${level} is still locked.`, 'Upgrades');
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
        showNotification('Not enough coins for this upgrade.', 'Upgrades');
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
        showNotification('Not enough coins for this upgrade.', 'Upgrades');
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

async function buyAutoFarmerUpgrade() {
    const gameState = getState();

    if (!gameState.autoFarmerUpgradeUnlocked) {
        showNotification('AutoFarmer upgrades are not unlocked yet.', 'Upgrades');
        return;
    }

    const eligiblePlots = getEligibleAutoFarmerPlots(gameState);
    if (!eligiblePlots.length) {
        showNotification('No AutoFarmer below Mk.8 is available to upgrade.', 'AutoFarmer Upgrade');
        return;
    }

    const selectedPlotIndex = await showDialog({
        title: 'AutoFarmer Upgrade',
        body: buildAutoFarmerSelectionBody(eligiblePlots),
        closeValue: null,
        buttons: [
            ...eligiblePlots.map((entry, index) => ({
                label: `Plot ${entry.plotNumber} Mk.${entry.currentLevel} -> Mk.${entry.nextLevel}`,
                value: entry.plotIndex,
                autofocus: index === 0,
            })),
            {
                label: 'Cancel',
                value: null,
            },
        ],
    });

    if (!Number.isInteger(selectedPlotIndex)) {
        return;
    }

    const freshState = getState();
    const activeFieldId = freshState.activeFieldId;
    const activeField = freshState.fields?.[activeFieldId];
    const targetPlotState = activeField?.plotStates?.[selectedPlotIndex];
    const currentLevel = Math.min(AUTO_FARMER_MAX_LEVEL, Math.max(1, Number(targetPlotState?.autoFarmer?.level) || 1));

    if (!targetPlotState?.autoFarmer || currentLevel >= AUTO_FARMER_MAX_LEVEL) {
        showNotification('That AutoFarmer is no longer eligible for upgrade.', 'AutoFarmer Upgrade');
        return;
    }

    const upgradeCost = getAutoFarmerUpgradeCostForCurrentLevel(currentLevel);
    if (freshState.coins < upgradeCost) {
        showNotification('Not enough coins for this upgrade.', 'Upgrades');
        return;
    }

    const confirmed = await showConfirmation(
        `Upgrade AutoFarmer on plot ${selectedPlotIndex + 1} from Mk.${currentLevel} to Mk.${currentLevel + 1} for ${upgradeCost} coins?`,
        {
            title: 'Confirm AutoFarmer Upgrade',
        },
    );

    if (!confirmed) {
        return;
    }

    const finalState = getState();
    const finalFieldId = finalState.activeFieldId;
    const finalField = finalState.fields?.[finalFieldId];
    const finalTarget = finalField?.plotStates?.[selectedPlotIndex];
    if (!finalField || !Array.isArray(finalField.plotStates) || !finalTarget?.autoFarmer) {
        showNotification('AutoFarmer was removed before upgrade completed.', 'AutoFarmer Upgrade');
        return;
    }

    const finalCurrentLevel = Math.min(AUTO_FARMER_MAX_LEVEL, Math.max(1, Number(finalTarget.autoFarmer.level) || 1));
    const finalCost = getAutoFarmerUpgradeCostForCurrentLevel(finalCurrentLevel);

    if (finalCurrentLevel >= AUTO_FARMER_MAX_LEVEL) {
        showNotification('That AutoFarmer is already Mk.8.', 'AutoFarmer Upgrade');
        return;
    }

    if (finalState.coins < finalCost) {
        showNotification('Not enough coins for this upgrade.', 'Upgrades');
        return;
    }

    const nextPlotStates = [...finalField.plotStates];
    nextPlotStates[selectedPlotIndex] = {
        ...finalTarget,
        autoFarmer: {
            ...finalTarget.autoFarmer,
            level: finalCurrentLevel + 1,
            lastErrorCode: null,
            lastErrorMessage: '',
            flashingUntil: 0,
        },
        lastUpdatedAt: Date.now(),
    };

    updateState({
        coins: finalState.coins - finalCost,
        totalCoinsSpent: finalState.totalCoinsSpent + finalCost,
        fields: {
            ...finalState.fields,
            [finalFieldId]: {
                ...finalField,
                plotStates: nextPlotStates,
            },
        },
    });

    updateField();
    renderClickUpgradesSection();
    updateResourceBar();
    incrementTotalClicks();
    updateClicksDisplay();
    showNotification(`AutoFarmer on plot ${selectedPlotIndex + 1} upgraded to Mk.${finalCurrentLevel + 1}.`, 'AutoFarmer Upgrade');
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
    buyAutoFarmerUpgrade,
};
