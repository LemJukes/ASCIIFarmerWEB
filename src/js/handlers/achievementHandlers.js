// ./handlers/achievementHandlers.js

import { getState, updateState } from "../state.js"
import { getStoreValues, addBulkSeedButton, addBulkCropSaleButton } from "../ui/store.js";
import { initializeUpgradesTitle, initializeUpgrades, initializeWaterUpgradesSection, initializeClickUpgradesSection } from "../ui/upgrades.js";

const achievementValues =  {
    totalCoinsEarned: [100, 500, 1000, 5000],
    cropsSold: [50, 100, 500],
    seedsBought: [50, 100, 250, 500, 1000, 2500],
    waterRefillsPurchased: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 1000],
}

function getAchievementValues() {
    return { ...achievementValues}
}

function trackAchievements() {
    const gameState = getState();

    // Check for crop unlocks based on total coins spent
    checkCropUnlocks();

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
                    const upgradesTitle = document.getElementById('upgrades-container-title');
                    const upgradesContainer = document.getElementById('upgrades-container');

                    if (!upgradesTitle) {
                        initializeUpgradesTitle();
                    }

                    if (!upgradesContainer) {
                        initializeUpgrades();
                    }

                    initializeClickUpgradesSection();
                }

                checkWaterRefillsAchievementsAndEnableButton();

            }
            
        }
    }
}

// Achievement Bulk Unlock Logic

function updateSeedsBought(amount) {
    const gameState = getState();
    const newSeedsBought = gameState.seedsBought + amount;
    updateState({ seedsBought: newSeedsBought });
    checkSeedsBoughtAchievements();
}

function checkSeedsBoughtAchievements() {
    const gameState = getState();
    const achievedSeedsBoughtAchievements = [];
    const storeValues = getStoreValues();

    for (const achievement of achievementValues.seedsBought) {
        if (gameState.seedsBought >= achievement && !gameState.achievementsUnlocked.includes(`seedsBought-${achievement}`)) {
            gameState.achievementsUnlocked.push(`seedsBought-${achievement}`);
            achievedSeedsBoughtAchievements.push(achievement);
            console.log(`Seeds Bought Achievement unlocked: ${achievement}`);
            const buyBulkSeedsText = `${Math.floor(achievement * 0.1)}x`;
            const buyBulkSeedsCostText = `${Math.floor(achievement * 0.1 * storeValues.seedBulkCostCoefficient)} coins`;
            addBulkSeedButton(buyBulkSeedsText, buyBulkSeedsCostText);
        }
    }

    //console.log('Achieved Seeds Bought Achievements:', achievedSeedsBoughtAchievements);
    return achievedSeedsBoughtAchievements;
    
}

function updateCropsSold(amount) {
    const gameState = getState();
    const newCropsSold = gameState.cropsSold + amount;
    updateState({ cropsSold: newCropsSold });
    checkCropsSoldAchievements();
}

function checkCropsSoldAchievements() {
    const gameState = getState();
    const achievedCropsSoldAchievements = [];
    const storeValues = getStoreValues();

    for (const achievement of achievementValues.cropsSold) {
        if (gameState.cropsSold >= achievement && !gameState.achievementsUnlocked.includes(`cropsSold-${achievement}`)) {
            gameState.achievementsUnlocked.push(`cropsSold-${achievement}`);
            achievedCropsSoldAchievements.push(achievement);
            console.log(`Crops Sold Achievement unlocked: ${achievement}`);
            const sellBulkCropsText = `${Math.floor(achievement * 0.1)}x`;
            const sellBulkCropsCostText = `${Math.floor(achievement * 0.1 * storeValues.cropBulkPriceCoefficient)} coins`;
            addBulkCropSaleButton(sellBulkCropsText, sellBulkCropsCostText);
        }
    }

    //console.log('Achieved Crops Sold Achievements:', achievedCropsSoldAchievements);
    return achievedCropsSoldAchievements;
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
    
    // Unlock corn at 50 coins spent
    if (!gameState.cornUnlocked && gameState.totalCoinsSpent >= 50) {
        updateState({ cornUnlocked: true });
        console.log('Corn unlocked! You can now buy corn seeds.');
        showCornInStore();
        showCornInCurrency();
    }
    
    // Unlock tomato at 100 coins spent
    if (!gameState.tomatoUnlocked && gameState.totalCoinsSpent >= 100) {
        updateState({ tomatoUnlocked: true });
        console.log('Tomato unlocked! You can now buy tomato seeds.');
        showTomatoInStore();
        showTomatoInCurrency();
    }
}

// Helper function to show corn sections in store
function showCornInStore() {
    const cornSeedSection = document.getElementById('buyCornSeedsSection');
    const cornSellSection = document.getElementById('sellCornSection');
    if (cornSeedSection) cornSeedSection.style.display = 'block';
    if (cornSellSection) cornSellSection.style.display = 'block';
}

// Helper function to show tomato sections in store
function showTomatoInStore() {
    const tomatoSeedSection = document.getElementById('buyTomatoSeedsSection');
    const tomatoSellSection = document.getElementById('sellTomatoSection');
    if (tomatoSeedSection) tomatoSeedSection.style.display = 'block';
    if (tomatoSellSection) tomatoSellSection.style.display = 'block';
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
         updateCoinsEarned,
         checkCropUnlocks,
        }
