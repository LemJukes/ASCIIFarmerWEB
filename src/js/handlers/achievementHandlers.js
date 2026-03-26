import { getState, updateState } from "../state.js";
import { progressionConfig, getAchievementValues as getProgressionAchievementValues } from "../configs/progressionConfig.js";
import { addBulkSeedButton, addBulkCropSaleButton, addBulkWaterRefillButton, refreshPlotFeatureStoreSections } from "../ui/store.js";
import { wrapInMacWindow } from "../ui/macWindow.js";
import { showNotification } from "../ui/macNotifications.js";
import {
    initializeUpgradesTitle,
    initializeUpgrades,
    initializeWaterUpgradesSection,
    initializeClickUpgradesSection,
    updateUpgradeValues,
} from "../ui/upgrades.js";
import { updateToolboxDisplay } from "../ui/toolbox.js";
import { trackQuestUnlocks, trackQuestAutoCompletions } from "./questHandlers.js";

const cropTypes = ["wheat", "corn", "tomato"];

function getAchievementValues() {
    return getProgressionAchievementValues();
}

function announceAchievementUnlock(message) {
    showNotification(message, 'Achievement');
}

function unlockAchievement(achievementId, message) {
    const gameState = getState();
    if (gameState.achievementsUnlocked.includes(achievementId)) {
        return false;
    }

    updateState({
        achievementsUnlocked: [...gameState.achievementsUnlocked, achievementId],
    });

    announceAchievementUnlock(message);
    return true;
}

function ensureUpgradesContainer() {
    // Once wrapped in a mac-window the title element is removed from the DOM —
    // check for the wrapper directly to avoid re-creating a dangling title on
    // every subsequent trackAchievements() call.
    if (document.getElementById("mac-window-upgrades-container")) {
        return;
    }

    let upgradesTitle = document.getElementById("upgrades-container-title");
    let upgradesContainer = document.getElementById("upgrades-container");

    if (!upgradesTitle) {
        initializeUpgradesTitle();
        upgradesTitle = document.getElementById("upgrades-container-title");
    }

    if (!upgradesContainer) {
        initializeUpgrades();
        upgradesContainer = document.getElementById("upgrades-container");
    }

    if (upgradesTitle && upgradesContainer) {
        wrapInMacWindow(upgradesTitle, upgradesContainer);
    }
}

function applyUpgradeUnlocks(gameState) {
    const upgradeUnlocks = progressionConfig.unlocks;
    const upgradeUpdates = {};

    if (gameState.waterRefillsPurchased >= upgradeUnlocks.upgradeSections.waterUpgradesByWaterRefills) {
        ensureUpgradesContainer();
        initializeWaterUpgradesSection();
    }

    const shouldRenderClickUpgrades =
        gameState.totalCoinsEarned >= upgradeUnlocks.upgradeSections.clickUpgradesByCoinsEarned ||
        gameState.totalCoinsSpent >= upgradeUnlocks.expandedClickByCoinsSpent.mk1;

    if (shouldRenderClickUpgrades) {
        ensureUpgradesContainer();
        initializeClickUpgradesSection();
    }

    if (gameState.totalCoinsEarned >= upgradeUnlocks.toolAutoChangerChargePacksByCoinsEarned.pack100) {
        upgradeUpdates.toolAutoChangerChargePack100Unlocked = true;
    }

    if (gameState.totalCoinsEarned >= upgradeUnlocks.toolAutoChangerChargePacksByCoinsEarned.pack500) {
        upgradeUpdates.toolAutoChangerChargePack500Unlocked = true;
    }

    if (gameState.totalCoinsEarned >= upgradeUnlocks.toolAutoChangerChargePacksByCoinsEarned.pack1000) {
        upgradeUpdates.toolAutoChangerChargePack1000Unlocked = true;
    }

    if (gameState.totalCoinsSpent >= upgradeUnlocks.expandedClickByCoinsSpent.mk1) {
        upgradeUpdates.expandedClickMk1Unlocked = true;
    }

    if (gameState.totalCoinsSpent >= upgradeUnlocks.expandedClickByCoinsSpent.mk2) {
        upgradeUpdates.expandedClickMk2Unlocked = true;
    }

    if (gameState.totalCoinsSpent >= upgradeUnlocks.expandedClickByCoinsSpent.mk3) {
        upgradeUpdates.expandedClickMk3Unlocked = true;
    }

    if (gameState.totalCoinsSpent >= upgradeUnlocks.expandedClickByCoinsSpent.mk4) {
        upgradeUpdates.expandedClickMk4Unlocked = true;
    }

    if (gameState.totalCoinsSpent >= upgradeUnlocks.expandedClickByCoinsSpent.mk5) {
        upgradeUpdates.expandedClickMk5Unlocked = true;
    }

    if (gameState.totalCoinsSpent >= upgradeUnlocks.expandedClickByCoinsSpent.mk6) {
        upgradeUpdates.expandedClickMk6Unlocked = true;
    }

    if (Object.keys(upgradeUpdates).length > 0) {
        updateUpgradeValues(upgradeUpdates);

        if (shouldRenderClickUpgrades || upgradeUpdates.expandedClickMk1Unlocked) {
            initializeClickUpgradesSection();
        }
    }
}

function checkGeneralAchievementMilestones(gameState) {
    const achievementValues = getAchievementValues();

    achievementValues.totalCoinsSpent.forEach((threshold) => {
        if (gameState.totalCoinsSpent >= threshold) {
            unlockAchievement(
                `totalCoinsSpent-${threshold}`,
                `Achievement unlocked: Coins Spent - ${threshold}`,
            );
        }
    });

    achievementValues.totalCoinsEarned.forEach((threshold) => {
        if (gameState.totalCoinsEarned >= threshold) {
            unlockAchievement(
                `totalCoinsEarned-${threshold}`,
                `Achievement unlocked: Coins Earned - ${threshold}`,
            );
        }
    });

    achievementValues.waterRefillsPurchased.forEach((threshold) => {
        if (gameState.waterRefillsPurchased >= threshold) {
            unlockAchievement(
                `waterRefillsPurchased-${threshold}`,
                `Achievement unlocked: Water Refills Purchased - ${threshold}`,
            );
        }
    });
}

function trackAchievements() {
    const gameState = getState();

    checkCropUnlocks(gameState);
    checkFieldStoreUnlock(gameState);
    applyUpgradeUnlocks(gameState);
    checkGeneralAchievementMilestones(gameState);
    checkSeedsBoughtAchievements(gameState);
    checkCropsSoldAchievements(gameState);
    checkWaterRefillPurchaseAchievements(gameState);
    checkWaterRefillsAchievementsAndEnableButton(gameState);
    trackQuestUnlocks(gameState);
    trackQuestAutoCompletions(gameState);
    refreshPlotFeatureStoreSections();
}

function checkFieldStoreUnlock(currentState) {
    const gameState = currentState ?? getState();
    const fieldUnlocks = progressionConfig.unlocks.fieldsBySpendAndFirstFieldPlots;
    const firstField = gameState.fields?.['field-1'];
    const firstFieldPlots = Number(firstField?.plots) || 0;

    if (gameState.fieldStoreUnlocked) {
        showFieldPurchaseInStore();
        return;
    }

    const reachedSpentThreshold = gameState.totalCoinsSpent >= fieldUnlocks.coinsSpent;
    const reachedPlotThreshold = firstFieldPlots >= fieldUnlocks.firstFieldRequiredPlots;

    if (!reachedSpentThreshold || !reachedPlotThreshold) {
        return;
    }

    updateState({ fieldStoreUnlocked: true });
    announceAchievementUnlock('Field Expansion unlocked! You can now buy additional fields.');
    showFieldPurchaseInStore();
}

function updateSeedsBought(cropType, amount) {
    const gameState = getState();
    const seedsKey = `${cropType}SeedsBought`;

    updateState({
        seedsBought: gameState.seedsBought + amount,
        [seedsKey]: gameState[seedsKey] + amount,
    });

    trackAchievements();
}

function checkSeedsBoughtAchievements(currentState) {
    const gameState = currentState ?? getState();
    const seedThresholds = progressionConfig.achievements.seedsBought;

    cropTypes.forEach((cropType) => {
        const key = `${cropType}SeedsBought`;
        const thresholds = seedThresholds[cropType] || [];

        thresholds.forEach((threshold, index) => {
            if (gameState[key] >= threshold) {
                unlockAchievement(
                    `${key}-${threshold}`,
                    `${cropType} seeds bought achievement unlocked: ${threshold}`,
                );
                addBulkSeedButton(cropType, threshold, index + 1);
            }
        });
    });
}

function updateCropsSold(cropType, amount) {
    const gameState = getState();
    const cropSoldKey = `${cropType}Sold`;

    updateState({
        cropsSold: gameState.cropsSold + amount,
        [cropSoldKey]: gameState[cropSoldKey] + amount,
    });

    trackAchievements();
}

function checkCropsSoldAchievements(currentState) {
    const gameState = currentState ?? getState();
    const cropThresholds = progressionConfig.achievements.cropsSold;

    cropTypes.forEach((cropType) => {
        const key = `${cropType}Sold`;
        const thresholds = cropThresholds[cropType] || [];

        thresholds.forEach((threshold, index) => {
            if (gameState[key] >= threshold) {
                unlockAchievement(
                    `${key}-${threshold}`,
                    `${cropType} sold achievement unlocked: ${threshold}`,
                );
                addBulkCropSaleButton(cropType, threshold, index + 1);
            }
        });
    });
}

function checkWaterRefillPurchaseAchievements(currentState) {
    const gameState = currentState ?? getState();
    const thresholds = progressionConfig.achievements.waterRefillsPurchased;
    const achievedWaterAchievements = [];

    thresholds.forEach((threshold, index) => {
        if (gameState.waterRefillsPurchased >= threshold) {
            if (unlockAchievement(`waterRefillsPurchased-${threshold}`, `Water refill achievement unlocked: ${threshold}`)) {
                achievedWaterAchievements.push(threshold);
            }

            addBulkWaterRefillButton(threshold, index + 1);
        }
    });

    return achievedWaterAchievements;
}

function updateCoinsEarned(amount) {
    const gameState = getState();
    const newCoinsEarned = gameState.totalCoinsEarned + amount;
    updateState({ totalCoinsEarned: newCoinsEarned });
    trackAchievements();
}

function checkCropUnlocks(currentState) {
    const gameState = currentState ?? getState();
    const cropUnlocks = progressionConfig.unlocks.cropsByTotalCoinsEarned;

    if (!gameState.cornUnlocked && gameState.totalCoinsEarned >= cropUnlocks.corn) {
        updateState({ cornUnlocked: true });
        announceAchievementUnlock("Corn unlocked! You can now buy corn seeds.");
        showCornInStore();
        showCornInResource();
        updateToolboxDisplay();
    }

    if (!gameState.tomatoUnlocked && gameState.totalCoinsEarned >= cropUnlocks.tomato) {
        updateState({ tomatoUnlocked: true });
        announceAchievementUnlock("Tomato unlocked! You can now buy tomato seeds.");
        showTomatoInStore();
        showTomatoInResource();
        updateToolboxDisplay();
    }
}

function showCornInStore() {
    const cornSeedSection = document.getElementById("buyCornSeedsSection");
    const cornSellSection = document.getElementById("sellCornSection");
    if (cornSeedSection) cornSeedSection.style.display = "flex";
    if (cornSellSection) cornSellSection.style.display = "flex";
}

function showTomatoInStore() {
    const tomatoSeedSection = document.getElementById("buyTomatoSeedsSection");
    const tomatoSellSection = document.getElementById("sellTomatoSection");
    if (tomatoSeedSection) tomatoSeedSection.style.display = "flex";
    if (tomatoSellSection) tomatoSellSection.style.display = "flex";
}

function showCornInResource() {
    const cornSeeds = document.getElementById("corn-seeds-item");
    const cornCrops = document.getElementById("corn-item");
    if (cornSeeds) cornSeeds.style.display = "flex";
    if (cornCrops) cornCrops.style.display = "flex";
}

function showTomatoInResource() {
    const tomatoSeeds = document.getElementById("tomato-seeds-item");
    const tomatoCrops = document.getElementById("tomato-item");
    if (tomatoSeeds) tomatoSeeds.style.display = "flex";
    if (tomatoCrops) tomatoCrops.style.display = "flex";
}

function showFieldPurchaseInStore() {
    const fieldPurchaseSection = document.getElementById('buyFieldSection');
    if (fieldPurchaseSection) {
        fieldPurchaseSection.style.display = 'flex';
    }
}

function checkWaterRefillsAchievementsAndEnableButton(currentState) {
    const gameState = currentState ?? getState();
    const thresholds = progressionConfig.achievements.waterRefillsPurchased;

    thresholds.forEach((threshold) => {
        if (gameState.waterRefillsPurchased < threshold) {
            return;
        }

        const waterUpgradeCapButton = document.getElementById("water-upgrade-cap-button");
        if (!waterUpgradeCapButton) {
            return;
        }

        if (waterUpgradeCapButton.disabled) {
            waterUpgradeCapButton.disabled = false;
        }
    });
}

export {
    trackAchievements,
    getAchievementValues,
    updateSeedsBought,
    checkSeedsBoughtAchievements,
    updateCropsSold,
    checkCropsSoldAchievements,
    checkWaterRefillPurchaseAchievements,
    updateCoinsEarned,
    checkCropUnlocks,
    checkFieldStoreUnlock,
};
