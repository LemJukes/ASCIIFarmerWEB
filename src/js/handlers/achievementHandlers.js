// ./handlers/achievementHandlers.js

import { getState, updateState } from "../state.js"
import { addBulkSeedButton, addBulkCropSaleButton, addBulkWaterRefillButton } from "../ui/store.js";
import {
    initializeUpgradesTitle,
    initializeUpgrades,
    initializeWaterUpgradesSection,
    initializeClickUpgradesSection,
    updateUpgradeValues,
} from "../ui/upgrades.js";
import { updateToolboxDisplay } from "../ui/toolbox.js";

const achievementValues =  {
    totalCoinsSpent: [50, 100, 250, 500, 1000],
    totalCoinsEarned: [10, 50, 100, 500],
    wheatSold: [10, 50],
    cornSold: [10, 50],
    tomatoSold: [10, 50],
    wheatSeedsBought: [10, 50],
    cornSeedsBought: [10, 50],
    tomatoSeedsBought: [10, 50],
    waterRefillsPurchased: [3, 15],
}

function getAchievementValues() {
    return { ...achievementValues}
}

function announceAchievementUnlock(message) {
    alert(message);
}

function unlockAchievement(gameState, achievementId, message) {
    if (gameState.achievementsUnlocked.includes(achievementId)) {
        return false;
    }

    gameState.achievementsUnlocked.push(achievementId);
    announceAchievementUnlock(message);
    return true;
}

function trackAchievements() {
    const gameState = getState();
    const [, , expandedClickMk1UnlockThreshold, expandedClickMk2UnlockThreshold, expandedClickMk3UnlockThreshold] = achievementValues.totalCoinsSpent;

    // Check for crop unlocks based on total coins spent
    checkCropUnlocks();

    if (gameState.waterRefillsPurchased >= achievementValues.waterRefillsPurchased[0]) {
        ensureUpgradesContainer();
        initializeWaterUpgradesSection();
    }

    if (gameState.totalCoinsEarned >= achievementValues.totalCoinsEarned[0]) {
        ensureUpgradesContainer();
        initializeClickUpgradesSection();
    }

    if (gameState.totalCoinsEarned >= achievementValues.totalCoinsEarned[1]) {
        updateUpgradeValues({ toolAutoChangerChargePack100Unlocked: true });
    }

    if (gameState.totalCoinsEarned >= achievementValues.totalCoinsEarned[2]) {
        updateUpgradeValues({ toolAutoChangerChargePack500Unlocked: true });
    }

    if (gameState.totalCoinsEarned >= achievementValues.totalCoinsEarned[3]) {
        updateUpgradeValues({ toolAutoChangerChargePack1000Unlocked: true });
    }

    if (gameState.totalCoinsSpent >= expandedClickMk1UnlockThreshold) {
        updateUpgradeValues({ expandedClickMk1Unlocked: true });
        ensureUpgradesContainer();
        initializeClickUpgradesSection();
    }

    if (gameState.totalCoinsSpent >= expandedClickMk2UnlockThreshold) {
        updateUpgradeValues({ expandedClickMk2Unlocked: true });
    }

    if (gameState.totalCoinsSpent >= expandedClickMk3UnlockThreshold) {
        updateUpgradeValues({ expandedClickMk3Unlocked: true });
    }

    for (const [key, achievements] of Object.entries(achievementValues)) {
        for (const achievement of achievements) {
            if (gameState[key] >= achievement) {
                const achievementId = `${key}-${achievement}`;
                const isNewUnlock = unlockAchievement(gameState, achievementId, `Achievement unlocked: ${key} - ${achievement}`);
                if (!isNewUnlock) {
                    continue;
                }

                // Achievement Upgrade Unlock Logic

                // Water Upgrade Unlock
                if (key === 'waterRefillsPurchased' && achievement === achievementValues.waterRefillsPurchased[0]) {
                    const upgradesTitle = document.getElementById('upgrades-container-title');
                    const upgradesContainer = document.getElementById('upgrades-container');

                    if (!upgradesTitle) {
                        initializeUpgradesTitle();
                    }

                    if (!upgradesContainer) {
                        initializeUpgrades();
                    }

                    initializeWaterUpgradesSection();
                }

                // Expanded Click Unlock
                if (key === 'totalCoinsEarned' && achievement === achievementValues.totalCoinsEarned[0]) {
                    ensureUpgradesContainer();
                    initializeClickUpgradesSection();
                }

                if (key === 'totalCoinsEarned' && achievement === achievementValues.totalCoinsEarned[1]) {
                    updateUpgradeValues({ toolAutoChangerChargePack100Unlocked: true });
                    ensureUpgradesContainer();
                    initializeClickUpgradesSection();
                }

                if (key === 'totalCoinsEarned' && achievement === achievementValues.totalCoinsEarned[2]) {
                    updateUpgradeValues({ toolAutoChangerChargePack500Unlocked: true });
                    ensureUpgradesContainer();
                    initializeClickUpgradesSection();
                }

                if (key === 'totalCoinsEarned' && achievement === achievementValues.totalCoinsEarned[3]) {
                    updateUpgradeValues({ toolAutoChangerChargePack1000Unlocked: true });
                    ensureUpgradesContainer();
                    initializeClickUpgradesSection();
                }

                checkWaterRefillsAchievementsAndEnableButton();

            }
            
        }
    }

    checkSeedsBoughtAchievements();
    checkCropsSoldAchievements();
    checkWaterRefillPurchaseAchievements();
}

function ensureUpgradesContainer() {
    const upgradesTitle = document.getElementById('upgrades-container-title');
    const upgradesContainer = document.getElementById('upgrades-container');

    if (!upgradesTitle) {
        initializeUpgradesTitle();
    }

    if (!upgradesContainer) {
        initializeUpgrades();
    }
}

// Achievement Bulk Unlock Logic

function updateSeedsBought(cropType, amount) {
    const gameState = getState();
    const seedsKey = `${cropType}SeedsBought`;
    updateState({
        seedsBought: gameState.seedsBought + amount,
        [seedsKey]: gameState[seedsKey] + amount,
    });
    checkSeedsBoughtAchievements();
}

function checkSeedsBoughtAchievements() {
    const gameState = getState();

    ['wheat', 'corn', 'tomato'].forEach(cropType => {
        const key = `${cropType}SeedsBought`;
        achievementValues[key].forEach((achievement, index) => {
            if (gameState[key] >= achievement) {
                const achievementId = `${key}-${achievement}`;
                unlockAchievement(gameState, achievementId, `${cropType} Seeds Bought Achievement unlocked: ${achievement}`);
                addBulkSeedButton(cropType, achievement, index + 1);
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
    checkCropsSoldAchievements();
}

function checkCropsSoldAchievements() {
    const gameState = getState();

    ['wheat', 'corn', 'tomato'].forEach(cropType => {
        const key = `${cropType}Sold`;
        achievementValues[key].forEach((achievement, index) => {
            if (gameState[key] >= achievement) {
                const achievementId = `${key}-${achievement}`;
                unlockAchievement(gameState, achievementId, `${cropType} Sold Achievement unlocked: ${achievement}`);
                addBulkCropSaleButton(cropType, achievement, index + 1);
            }
        });
    });
}

function checkWaterRefillPurchaseAchievements() {
    const gameState = getState();
    const achievedWaterAchievements = [];

    achievementValues.waterRefillsPurchased.forEach((achievement, index) => {
        if (gameState.waterRefillsPurchased >= achievement) {
            const achievementId = `waterRefillsPurchased-${achievement}`;
            if (unlockAchievement(gameState, achievementId, `Water Refill Achievement unlocked: ${achievement}`)) {
                achievedWaterAchievements.push(achievement);
            }

            addBulkWaterRefillButton(achievement, index + 1);
        }
    });

    return achievedWaterAchievements;
}

function updateCoinsEarned(amount) {
    const gameState = getState();
    const newCoinsEarned = gameState.totalCoinsEarned + amount;
    updateState({ totalCoinsEarned: newCoinsEarned });
    //checkTotalCoinsEarnedAchievements goes here
}

//function to be built: checkTotalCoinsEarnedAchievements

// Check and unlock corn and tomato based on total coins spent
function checkCropUnlocks() {
    const gameState = getState();
    const [cornUnlockThreshold, tomatoUnlockThreshold] = achievementValues.totalCoinsSpent;
    
    // Unlock corn when total coins spent reaches the configured threshold
    if (!gameState.cornUnlocked && gameState.totalCoinsSpent >= cornUnlockThreshold) {
        updateState({ cornUnlocked: true });
        announceAchievementUnlock('Corn unlocked! You can now buy corn seeds.');
        showCornInStore();
        showCornInCurrency();
        updateToolboxDisplay();
        checkSeedsBoughtAchievements();
        checkCropsSoldAchievements();
    }
    
    // Unlock tomato when total coins spent reaches the configured threshold
    if (!gameState.tomatoUnlocked && gameState.totalCoinsSpent >= tomatoUnlockThreshold) {
        updateState({ tomatoUnlocked: true });
        announceAchievementUnlock('Tomato unlocked! You can now buy tomato seeds.');
        showTomatoInStore();
        showTomatoInCurrency();
        updateToolboxDisplay();
        checkSeedsBoughtAchievements();
        checkCropsSoldAchievements();
    }
}

// Helper function to show corn sections in store
function showCornInStore() {
    const cornSeedSection = document.getElementById('buyCornSeedsSection');
    const cornSellSection = document.getElementById('sellCornSection');
    if (cornSeedSection) cornSeedSection.style.display = 'flex';
    if (cornSellSection) cornSellSection.style.display = 'flex';
}

// Helper function to show tomato sections in store
function showTomatoInStore() {
    const tomatoSeedSection = document.getElementById('buyTomatoSeedsSection');
    const tomatoSellSection = document.getElementById('sellTomatoSection');
    if (tomatoSeedSection) tomatoSeedSection.style.display = 'flex';
    if (tomatoSellSection) tomatoSellSection.style.display = 'flex';
}

// Helper function to show corn in currency bar
function showCornInCurrency() {
    const cornSeeds = document.getElementById('corn-seeds-item');
    const cornCrops = document.getElementById('corn-item');
    if (cornSeeds) cornSeeds.style.display = 'flex';
    if (cornCrops) cornCrops.style.display = 'flex';
}

// Helper function to show tomato in currency bar
function showTomatoInCurrency() {
    const tomatoSeeds = document.getElementById('tomato-seeds-item');
    const tomatoCrops = document.getElementById('tomato-item');
    if (tomatoSeeds) tomatoSeeds.style.display = 'flex';
    if (tomatoCrops) tomatoCrops.style.display = 'flex';
}


function checkWaterRefillsAchievementsAndEnableButton() {
    const gameState = getState();
    const achievementValues = getAchievementValues(); // Returns the achievement values

    //console.log('GameState waterRefillsPurchased:', gameState.waterRefillsPurchased);
    //console.log('Achievement values:', achievementValues.WaterRefillsPurchased);

    achievementValues.waterRefillsPurchased.forEach(achievement => {
        //console.log('Checking achievement:', achievement);
        if (gameState.waterRefillsPurchased === achievement) {
            const waterUpgradeCapButton = document.getElementById('water-upgrade-cap-button');
            if (!waterUpgradeCapButton) {
                return;
            }
            //console.log('Achievement matched:', achievement);
            if (waterUpgradeCapButton.disabled) {
                waterUpgradeCapButton.disabled = false;
                //console.log('Water Upgrade Cap Button enabled due to achievement unlocked.');
            } else {
                //console.log('Water Upgrade Cap Button is already enabled.');
            }
        }
        
    });
}

export { trackAchievements, 
         getAchievementValues, 
         updateSeedsBought, 
         checkSeedsBoughtAchievements, 
         updateCropsSold, 
         checkCropsSoldAchievements, 
         checkWaterRefillPurchaseAchievements,
         updateCoinsEarned,
         checkCropUnlocks,
        }
