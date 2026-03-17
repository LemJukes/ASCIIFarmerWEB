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
    totalCoinsEarned: [1, 2, 3, 4],
    wheatSold: [1, 2],
    cornSold: [1, 2],
    tomatoSold: [1, 2],
    wheatSeedsBought: [1, 2],
    cornSeedsBought: [1, 2],
    tomatoSeedsBought: [1, 2],
    waterRefillsPurchased: [1, 2],
}

function getAchievementValues() {
    return { ...achievementValues}
}

function trackAchievements() {
    const gameState = getState();

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

    for (const [key, achievements] of Object.entries(achievementValues)) {
        for (const achievement of achievements) {
            if (gameState[key] >= achievement && !gameState.achievementsUnlocked.includes(`${key}-${achievement}`)) {
                gameState.achievementsUnlocked.push(`${key}-${achievement}`);
                console.log(`Achievement unlocked: ${key} - ${achievement}`);

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
                if (!gameState.achievementsUnlocked.includes(`${key}-${achievement}`)) {
                    gameState.achievementsUnlocked.push(`${key}-${achievement}`);
                    console.log(`${cropType} Seeds Bought Achievement unlocked: ${achievement}`);
                }
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
                if (!gameState.achievementsUnlocked.includes(`${key}-${achievement}`)) {
                    gameState.achievementsUnlocked.push(`${key}-${achievement}`);
                    console.log(`${cropType} Sold Achievement unlocked: ${achievement}`);
                }
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
            if (!gameState.achievementsUnlocked.includes(`waterRefillsPurchased-${achievement}`)) {
                gameState.achievementsUnlocked.push(`waterRefillsPurchased-${achievement}`);
                achievedWaterAchievements.push(achievement);
                console.log(`Water Refill Achievement unlocked: ${achievement}`);
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
    
    // Unlock corn at 1 coins spent
    if (!gameState.cornUnlocked && gameState.totalCoinsSpent >= 1) {
        updateState({ cornUnlocked: true });
        console.log('Corn unlocked! You can now buy corn seeds.');
        showCornInStore();
        showCornInCurrency();
        updateToolboxDisplay();
        checkSeedsBoughtAchievements();
        checkCropsSoldAchievements();
    }
    
    // Unlock tomato at 2 coins spent
    if (!gameState.tomatoUnlocked && gameState.totalCoinsSpent >= 2) {
        updateState({ tomatoUnlocked: true });
        console.log('Tomato unlocked! You can now buy tomato seeds.');
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
