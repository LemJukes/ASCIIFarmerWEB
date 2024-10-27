// handlers/storeHandlers.js

import { getState, updateState } from "../state.js";
import { updateCurrencyBar } from "../ui/currency.js";
import { updateField } from "../ui/field.js";
import { getStoreValues, updateStoreValues } from "../ui/store.js";
import { updateWaterRefillsPurchased } from "./upgradeHandlers.js";
import { trackMilestones, 
         getMilestoneValues, 
         updateSeedsBought, 
         updateCropsSold, 
         updateCoinsEarned,

        } from "./milestoneHandlers.js";


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
        updateSeedsBought(bulkQuantity); // Update seedsBought and check milestones
        updateCurrencyBar();
    } else {
        console.log("Not enough coins to buy bulk seeds");
    }
}

function buyWater() {
    const gameState = getState();
    const storeValues = getStoreValues();
    const milestones = getMilestoneValues();

    // Check if the player's water is already at capacity
    if (gameState.water >= gameState.waterCapacity) {
        console.log("Water is already at capacity. You cannot purchase more water.");
        return;
    }

    // Check if the player has enough coins to buy water
    if (gameState.coins >= storeValues.waterCost) {
        // Calculate the new water level, ensuring it does not exceed the water capacity
        const newWaterLevel = Math.min(gameState.water + 10, gameState.waterCapacity);
        
        updateState({
            coins: gameState.coins - storeValues.waterCost,
            water: newWaterLevel,
        });

        // Increment waterRefillsPurchased and check for milestone
        updateWaterRefillsPurchased();

        // Track milestones and update the UI
        trackMilestones(gameState, milestones);
        updateCurrencyBar();
    } else {
        console.log("Not enough coins to buy water");
    }
}

function buyPlot() {
    const gameState = getState();
    const storeValues = getStoreValues();
    let plotCost = storeValues.plotCost;
    const plots = gameState.plots;

    if (plots >= 5) {
        plotCost = Math.ceil(plotCost * 1.05);
    }

    if (gameState.coins >= plotCost && plots < 100) {
        updateState({
            coins: gameState.coins - plotCost,
            plots: gameState.plots + 1,
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
    } else if (plots >= 100) {
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

export { buySeed, buyWater, buyPlot, sellCrops, buyBulkSeeds, sellBulkCrops };
