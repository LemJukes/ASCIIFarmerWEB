// handlers/storeHandlers.js

import { getState, updateState } from "../state.js";
import { updateCurrencyBar } from "../ui/currency.js";
import { updateField } from "../ui/field.js";
import { getStoreValues, updateStoreValues } from "../ui/store.js";
import { updateWaterRefillsPurchased } from "./upgradeHandlers.js";
import { trackAchievements, 
         getAchievementValues, 
         updateSeedsBought, 
         updateCropsSold, 
         updateCoinsEarned,
         checkCropUnlocks,
        } from "./achievementHandlers.js";


// Purchasing Handlers
function buySeed() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.coins >= storeValues.seedCost) {
        updateState({
            coins: gameState.coins - storeValues.seedCost,
            seeds: gameState.seeds + 1,
        });
        updateSeedsBought(1);
        updateCurrencyBar();
    } else {
        console.log("Not enough coins to buy seeds");
    }
}

function buyBulkSeeds(event) {
    const button = event.target;
    const buySeedsSection = document.getElementById('buySeedsSection');
    
    // Extract the bulk quantity and cost from the button's text content
    const bulkQuantityText = button.textContent; // e.g., "50x"
    const bulkCostElements = buySeedsSection.querySelectorAll('.item-price');
    const bulkCostText = bulkCostElements[bulkCostElements.length - 1].textContent; // Select the last element

    const bulkQuantity = parseInt(bulkQuantityText.replace('x', ''));
    const bulkCost = parseInt(bulkCostText.replace(' coins', ''));

    const gameState = getState();

    if (gameState.coins >= bulkCost) {
        updateState({
            coins: gameState.coins - bulkCost,
            seeds: gameState.seeds + bulkQuantity,
        });
        updateSeedsBought(bulkQuantity); // Update seedsBought and check achievements
        updateCurrencyBar();
    } else {
        console.log("Not enough coins to buy bulk seeds");
    }
}

function buyWater() {
    const gameState = getState();
    const storeValues = getStoreValues();

    buyWaterRefill({
        amount: storeValues.waterQuantity,
        cost: storeValues.waterCost,
        gameState,
    });
}

function buyBulkWaterRefill(amount, cost) {
    const gameState = getState();

    buyWaterRefill({
        amount,
        cost,
        gameState,
    });
}

function buyWaterRefill({ amount, cost, gameState }) {
    const refillAmount = Math.max(1, Number(amount) || 1);
    const refillCost = Math.max(0, Number(cost) || 0);
    const achievements = getAchievementValues();

    // Check if the player's water is already at capacity
    if (gameState.water >= gameState.waterCapacity) {
        console.log("Water is already at capacity. You cannot purchase more water.");
        return;
    }

    // Check if the player has enough coins to buy water
    if (gameState.coins >= refillCost) {
        // Calculate the new water level, ensuring it does not exceed the water capacity
        const newWaterLevel = Math.min(gameState.water + refillAmount, gameState.waterCapacity);
        
        updateState({
            coins: gameState.coins - refillCost,
            water: newWaterLevel,
            totalCoinsSpent: gameState.totalCoinsSpent + refillCost,
        });

        // Increment waterRefillsPurchased and check for achievement
        updateWaterRefillsPurchased();

        // Track achievements and update the UI
        trackAchievements(gameState, achievements);
        updateCurrencyBar();
    } else {
        console.log("Not enough coins to buy water");
    }
}

function buyBulkSeedPack(cropType, quantity, totalCost) {
    const seedKeyByCrop = {
        wheat: 'wheatSeeds',
        corn: 'cornSeeds',
        tomato: 'tomatoSeeds',
    };

    const seedKey = seedKeyByCrop[cropType];
    if (!seedKey) {
        return;
    }

    const gameState = getState();
    const packQuantity = Math.max(1, Number(quantity) || 1);
    const packCost = Math.max(0, Number(totalCost) || 0);

    if (gameState.coins >= packCost) {
        updateState({
            coins: gameState.coins - packCost,
            [seedKey]: gameState[seedKey] + packQuantity,
            totalCoinsSpent: gameState.totalCoinsSpent + packCost,
        });
        updateSeedsBought(packQuantity);
        updateCurrencyBar();
    } else {
        console.log(`Not enough coins to buy ${cropType} seed pack`);
    }
}

function sellBulkCropPack(cropType, quantity, payout) {
    const cropKeyByType = {
        wheat: 'wheat',
        corn: 'corn',
        tomato: 'tomato',
    };

    const cropKey = cropKeyByType[cropType];
    if (!cropKey) {
        return;
    }

    const gameState = getState();
    const sellQuantity = Math.max(1, Number(quantity) || 1);
    const sellPayout = Math.max(0, Number(payout) || 0);

    if (gameState[cropKey] >= sellQuantity) {
        updateState({
            coins: gameState.coins + sellPayout,
            [cropKey]: gameState[cropKey] - sellQuantity,
            crops: gameState.crops - sellQuantity,
        });

        updateCoinsEarned(sellPayout);
        updateCropsSold(sellQuantity);

        if (cropType === 'wheat') {
            updateState({ wheatSold: gameState.wheatSold + sellQuantity });
        } else if (cropType === 'corn') {
            updateState({ cornSold: gameState.cornSold + sellQuantity });
        } else if (cropType === 'tomato') {
            updateState({ tomatoSold: gameState.tomatoSold + sellQuantity });
        }

        updateCurrencyBar();
    } else {
        console.log(`Not enough ${cropType} to sell bulk`);
    }
}

function buyPlot() {
    const maxPlots = 81;
    const gameState = getState();
    const storeValues = getStoreValues();
    let plotCost = storeValues.plotCost;
    const plots = gameState.plots;

    if (plots >= 5) {
        plotCost = Math.ceil(plotCost * 1.05);
    }

    if (gameState.coins >= plotCost && plots < maxPlots) {
        updateState({
            coins: gameState.coins - plotCost,
            plots: gameState.plots + 1,
            totalCoinsSpent: gameState.totalCoinsSpent + plotCost,
        });
        storeValues.plotCost = plotCost;
        updateStoreValues({
            plotCost: storeValues.plotCost 
        });
        console.log("Updated plotCost:", storeValues.plotCost);
        updateCurrencyBar();
        updateField();
    } else if (gameState.coins < plotCost) {
        console.log("Not enough coins to buy a plot");
    } else if (plots >= maxPlots) {
        alert("Field is full, cannot buy more plots");
        console.log("Field is full, cannot buy more plots");
    }
}

// Sale Handlers

function sellCrops() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.crops > 0) {
        updateState({
            coins: gameState.coins + storeValues.cropPrice,
            crops: gameState.crops - 1,
        });
        updateCoinsEarned(1);
        updateCropsSold(1);
        updateCurrencyBar();  // Refresh the UI to reflect updated currency values
    } else {
        console.log("No crops available to sell");  // Log a message if no crops are available
    }
}

function sellBulkCrops(event) {
    const button = event.target;
    const sellCropsSection = document.getElementById('sellCropsSection');
    
    // Extract the bulk quantity and cost from the button's text content
    const bulkQuantityText = button.textContent; // e.g., "50x"
    const bulkCostElements = sellCropsSection.querySelectorAll('.item-price');
    const bulkCostText = bulkCostElements[bulkCostElements.length - 1].textContent; // Select the last element

    const bulkQuantity = parseInt(bulkQuantityText.replace('x', ''));
    const bulkPrice = parseInt(bulkCostText.replace(' coins', ''));

    const gameState = getState();

    if (gameState.crops >= bulkQuantity) {
        updateState({
            coins: gameState.coins + bulkPrice,
            crops: gameState.crops - bulkQuantity,
        });
        updateCoinsEarned(bulkPrice)
        updateCropsSold(bulkQuantity);
        updateCurrencyBar();
    } else {
        console.log("Not enough crops to sell");
    }
}

// Crop-Specific Seed Purchasing Handlers
function buyWheatSeeds() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.coins >= storeValues.wheatSeedCost) {
        updateState({
            coins: gameState.coins - storeValues.wheatSeedCost,
            wheatSeeds: gameState.wheatSeeds + 1,
            totalCoinsSpent: gameState.totalCoinsSpent + storeValues.wheatSeedCost,
        });
        updateSeedsBought(1);
        updateCurrencyBar();
    } else {
        console.log("Not enough coins to buy wheat seeds");
    }
}

function buyCornSeeds() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.coins >= storeValues.cornSeedCost) {
        updateState({
            coins: gameState.coins - storeValues.cornSeedCost,
            cornSeeds: gameState.cornSeeds + 1,
            totalCoinsSpent: gameState.totalCoinsSpent + storeValues.cornSeedCost,
        });
        updateSeedsBought(1);
        updateCurrencyBar();
    } else {
        console.log("Not enough coins to buy corn seeds");
    }
}

function buyTomatoSeeds() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.coins >= storeValues.tomatoSeedCost) {
        updateState({
            coins: gameState.coins - storeValues.tomatoSeedCost,
            tomatoSeeds: gameState.tomatoSeeds + 1,
            totalCoinsSpent: gameState.totalCoinsSpent + storeValues.tomatoSeedCost,
        });
        updateSeedsBought(1);
        updateCurrencyBar();
    } else {
        console.log("Not enough coins to buy tomato seeds");
    }
}

// Crop-Specific Selling Handlers
function sellWheat() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.wheat > 0) {
        updateState({
            coins: gameState.coins + storeValues.wheatPrice,
            wheat: gameState.wheat - 1,
            crops: gameState.crops - 1, // Update generic crops count
        });
        updateCoinsEarned(storeValues.wheatPrice);
        updateCropsSold(1);
        updateState({ wheatSold: gameState.wheatSold + 1 });
        updateCurrencyBar();
    } else {
        console.log("No wheat available to sell");
    }
}

function sellCorn() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.corn > 0) {
        updateState({
            coins: gameState.coins + storeValues.cornPrice,
            corn: gameState.corn - 1,
            crops: gameState.crops - 1,
        });
        updateCoinsEarned(storeValues.cornPrice);
        updateCropsSold(1);
        updateState({ cornSold: gameState.cornSold + 1 });
        updateCurrencyBar();
    } else {
        console.log("No corn available to sell");
    }
}

function sellTomato() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.tomato > 0) {
        updateState({
            coins: gameState.coins + storeValues.tomatoPrice,
            tomato: gameState.tomato - 1,
            crops: gameState.crops - 1,
        });
        updateCoinsEarned(storeValues.tomatoPrice);
        updateCropsSold(1);
        updateState({ tomatoSold: gameState.tomatoSold + 1 });
        updateCurrencyBar();
    } else {
        console.log("No tomatoes available to sell");
    }
}

export { buySeed, buyWater, buyPlot, sellCrops, buyBulkSeeds, sellBulkCrops,
         buyWheatSeeds, buyCornSeeds, buyTomatoSeeds,
         sellWheat, sellCorn, sellTomato,
         buyBulkSeedPack, sellBulkCropPack, buyBulkWaterRefill };
