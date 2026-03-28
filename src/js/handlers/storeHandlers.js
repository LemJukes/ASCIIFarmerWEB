// handlers/storeHandlers.js

import { getState, updateState, incrementTotalClicks } from "../state.js";
import { updateResourceBar } from "../ui/resource.js";
import { updateField } from "../ui/field.js";
import { getStoreValues, updateStoreValues } from "../ui/store.js";
import { updateWaterRefillsPurchased } from "./upgradeHandlers.js";
import { trackAchievements, 
         updateSeedsBought, 
         updateCropsSold, 
         updateCoinsEarned,
        } from "./achievementHandlers.js";
import { updateClicksDisplay } from "../ui/clicks.js";
import { progressionConfig } from "../configs/progressionConfig.js";
import { showNotification } from "../ui/macNotifications.js";

const DESTROY_PLOT_COST = 25;
const RESTORE_PLOT_COST = 50;
const AUTO_FARMER_BASE_COST = 100;
const AUTO_FARMER_COST_STEP = 100;
const DISASSEMBLE_AUTO_FARMER_COST = 50;

function getActiveFieldForMutation(gameState) {
    const activeFieldId = gameState.activeFieldId;
    const activeField = gameState.fields?.[activeFieldId];
    if (!activeField || !Array.isArray(activeField.plotStates)) {
        return null;
    }

    return {
        activeFieldId,
        activeField,
    };
}

function commitPlotStatesToActiveField(gameState, activeFieldId, activeField, plotStates) {
    const updatedFields = {
        ...gameState.fields,
        [activeFieldId]: {
            ...activeField,
            plotStates,
        },
    };

    updateState({ fields: updatedFields });
}

function buyDestroyPlotAction() {
    const gameState = getState();
    if (!gameState.destroyPlotUnlocked) {
        showNotification('Destroy Plot is not unlocked yet.', 'Store');
        return;
    }

    if (gameState.coins < DESTROY_PLOT_COST) {
        showNotification('Not enough coins to destroy a plot!', 'Store');
        return;
    }

    updateState({
        coins: gameState.coins - DESTROY_PLOT_COST,
        totalCoinsSpent: gameState.totalCoinsSpent + DESTROY_PLOT_COST,
        plotSelectionMode: 'destroy',
    });

    updateResourceBar();
    updateField();
    incrementTotalClicks();
    updateClicksDisplay();
    showNotification('Select a plot to destroy by clicking it.', 'Destroy Plot');
}

function buyRestorePlotAction() {
    const gameState = getState();
    if (!gameState.restorePlotUnlocked) {
        showNotification('Restore Plot is not unlocked yet.', 'Store');
        return;
    }

    if (gameState.coins < RESTORE_PLOT_COST) {
        showNotification('Not enough coins to restore a plot!', 'Store');
        return;
    }

    updateState({
        coins: gameState.coins - RESTORE_PLOT_COST,
        totalCoinsSpent: gameState.totalCoinsSpent + RESTORE_PLOT_COST,
        plotSelectionMode: 'restore',
    });

    updateResourceBar();
    updateField();
    incrementTotalClicks();
    updateClicksDisplay();
    showNotification('Select a destroyed plot to restore by clicking it.', 'Restore Plot');
}

function buyAutoFarmerAction() {
    const gameState = getState();
    if (!gameState.autoFarmerUnlocked) {
        showNotification('Build AutoFarmer is not unlocked yet.', 'Store');
        return;
    }

    const activeFieldContext = getActiveFieldForMutation(gameState);
    if (!activeFieldContext) {
        return;
    }

    const { activeFieldId, activeField } = activeFieldContext;
    const maxPlots = Number(activeField.plots) || activeField.plotStates.length;
    const buildCost = Math.max(AUTO_FARMER_BASE_COST, Number(gameState.autoFarmerNextCost) || AUTO_FARMER_BASE_COST);

    if (gameState.coins < buildCost) {
        showNotification('Not enough coins to build an AutoFarmer!', 'Store');
        return;
    }

    const selectedPlotText = window.prompt(`Build AutoFarmer on which destroyed plot? Enter plot number 1-${maxPlots}.`);
    if (selectedPlotText === null) {
        return;
    }

    const selectedPlotNumber = Number.parseInt(String(selectedPlotText).trim(), 10);
    if (!Number.isFinite(selectedPlotNumber) || selectedPlotNumber < 1 || selectedPlotNumber > maxPlots) {
        showNotification('Invalid plot number selected.', 'AutoFarmer');
        return;
    }

    const selectedPlotIndex = selectedPlotNumber - 1;
    const nextPlotStates = [...activeField.plotStates];
    const targetPlot = nextPlotStates[selectedPlotIndex];
    if (!targetPlot) {
        showNotification('Selected plot does not exist.', 'AutoFarmer');
        return;
    }

    if (!targetPlot.destroyed) {
        showNotification('AutoFarmers can only be built on destroyed plots.', 'AutoFarmer');
        return;
    }

    if (targetPlot.autoFarmer) {
        showNotification('That plot already has an AutoFarmer.', 'AutoFarmer');
        return;
    }

    targetPlot.autoFarmer = {
        level: 1,
        tickMs: 2500,
        lastTickAt: 0,
        preferredTargetPlotIndex: null,
        lastErrorCode: null,
        lastErrorMessage: '',
        flashingUntil: 0,
    };
    targetPlot.lastUpdatedAt = Date.now();

    commitPlotStatesToActiveField(gameState, activeFieldId, activeField, nextPlotStates);
    updateState({
        coins: gameState.coins - buildCost,
        totalCoinsSpent: gameState.totalCoinsSpent + buildCost,
        autoFarmerPurchasedCount: (Number(gameState.autoFarmerPurchasedCount) || 0) + 1,
        autoFarmerNextCost: buildCost + AUTO_FARMER_COST_STEP,
    });

    updateResourceBar();
    updateField();
    trackAchievements();
    incrementTotalClicks();
    updateClicksDisplay();
    showNotification(`AutoFarmer built on plot ${selectedPlotNumber}.`, 'AutoFarmer');
}

function buyDisassembleAutoFarmerAction() {
    const gameState = getState();
    if (!gameState.disassembleAutoFarmerUnlocked) {
        showNotification('Disassemble AutoFarmer is not unlocked yet.', 'Store');
        return;
    }

    if (gameState.coins < DISASSEMBLE_AUTO_FARMER_COST) {
        showNotification('Not enough coins to disassemble an AutoFarmer!', 'Store');
        return;
    }

    updateState({
        coins: gameState.coins - DISASSEMBLE_AUTO_FARMER_COST,
        totalCoinsSpent: gameState.totalCoinsSpent + DISASSEMBLE_AUTO_FARMER_COST,
        plotSelectionMode: 'disassembleAutoFarmer',
    });

    updateResourceBar();
    updateField();
    incrementTotalClicks();
    updateClicksDisplay();
    showNotification('Select an AutoFarmer plot to disassemble by clicking it.', 'Disassemble AutoFarmer');
}


// Purchasing Handlers
function buySeed() {
    const gameState = getState();
    const storeValues = getStoreValues();
    if (gameState.coins >= storeValues.seedCost) {
        updateState({
            coins: gameState.coins - storeValues.seedCost,
            seeds: gameState.seeds + 1,
        });
        updateSeedsBought('wheat', 1);
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
        showNotification('Not enough coins to buy seeds!', 'Store');
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
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
        showNotification('Not enough coins to buy bulk seeds!', 'Store');
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

    if (gameState.coins < refillCost) {
        showNotification('Not enough coins to buy water!', 'Store');
        return;
    }

    if (gameState.water >= gameState.waterCapacity) {
        showNotification('Water supply is already full!', 'Store');
        return;
    }

    const newWaterLevel = Math.min(gameState.water + refillAmount, gameState.waterCapacity);

    updateState({
        coins: gameState.coins - refillCost,
        water: newWaterLevel,
        totalCoinsSpent: gameState.totalCoinsSpent + refillCost,
    });

    updateWaterRefillsPurchased();
    trackAchievements();
    updateResourceBar();
    incrementTotalClicks();
    updateClicksDisplay();
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
        updateSeedsBought(cropType, packQuantity);
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
        showNotification(`Not enough coins to buy ${cropType} seeds!`, 'Store');
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
        updateCropsSold(cropType, sellQuantity);

        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
           showNotification(`Not enough ${cropType} to sell!`, 'Store');
    }
}

function buyPlot() {
    const maxPlots = 81;
    const gameState = getState();
    const storeValues = getStoreValues();
    const activeFieldId = gameState.activeFieldId;
    const activeField = gameState.fields?.[activeFieldId];

    if (!activeField) {
        console.log("No active field found");
        return;
    }

    let plotCost = storeValues.plotCost;
    const plots = Number(activeField.plots) || 1;

    if (plots >= progressionConfig.storeEconomy.plot.scalingStartPlotCount) {
        plotCost = Math.ceil(plotCost * progressionConfig.storeEconomy.plot.scalingMultiplier);
    }

    if (gameState.coins >= plotCost && plots < maxPlots) {
        const nextPlotStates = Array.isArray(activeField.plotStates)
            ? [...activeField.plotStates]
            : [];

        nextPlotStates.push({
            symbol: '~',
            cropType: null,
            waterCount: 0,
            disabledUntil: 0,
            lastUpdatedAt: Date.now(),
            destroyed: false,
            autoFarmer: null,
        });

        const updatedFields = {
            ...gameState.fields,
            [activeFieldId]: {
                ...activeField,
                plots: plots + 1,
                plotStates: nextPlotStates,
            },
        };

        updateState({
            coins: gameState.coins - plotCost,
            fields: updatedFields,
            totalCoinsSpent: gameState.totalCoinsSpent + plotCost,
        });
        storeValues.plotCost = plotCost;
        updateStoreValues({
            plotCost: storeValues.plotCost 
        });
        const plotCostLabel = document.getElementById('plot-cost');
        if (plotCostLabel) {
            plotCostLabel.textContent = `${storeValues.plotCost} coin(s)`;
        }
        console.log("Updated plotCost:", storeValues.plotCost);
        updateResourceBar();
        updateField();
        trackAchievements();
        incrementTotalClicks();
        updateClicksDisplay();
    } else if (gameState.coins < plotCost) {
        showNotification('Not enough coins to buy a plot!', 'Store');
    } else if (plots >= maxPlots) {
        showNotification('Field is full, cannot buy more plots', 'Field');
        console.log("Field is full, cannot buy more plots");
    }
}

function buyNewField() {
    const gameState = getState();
    const purchaseConfig = progressionConfig.storeEconomy.fieldPurchase;

    if (!gameState.fieldStoreUnlocked) {
        console.log("Field purchase is still locked");
        return;
    }

    const fieldCost = Math.max(1, Number(gameState.nextFieldCost) || purchaseConfig.baseCost);
    if (gameState.coins < fieldCost) {
        showNotification('Not enough coins to buy a new field!', 'Store');
        return;
    }

    const newFieldNumber = Math.max(2, Number(gameState.nextFieldNumber) || 2);
    const newFieldId = `field-${newFieldNumber}`;

    if (gameState.fields?.[newFieldId]) {
        console.log("Field already exists");
        return;
    }

    const updatedFields = {
        ...gameState.fields,
        [newFieldId]: {
            id: newFieldId,
            name: `Field ${newFieldNumber}`,
            plots: 1,
            plotStates: [{
                symbol: '~',
                cropType: null,
                waterCount: 0,
                disabledUntil: 0,
                lastUpdatedAt: Date.now(),
                destroyed: false,
                autoFarmer: null,
            }],
        },
    };

    const ownedFieldIds = Array.isArray(gameState.ownedFieldIds)
        ? [...gameState.ownedFieldIds, newFieldId]
        : [newFieldId];

    ownedFieldIds.sort((a, b) => {
        const first = Number(String(a).replace('field-', '')) || 0;
        const second = Number(String(b).replace('field-', '')) || 0;
        return first - second;
    });

    updateState({
        coins: gameState.coins - fieldCost,
        totalCoinsSpent: gameState.totalCoinsSpent + fieldCost,
        fields: updatedFields,
        ownedFieldIds,
        nextFieldNumber: newFieldNumber + 1,
        nextFieldCost: fieldCost + purchaseConfig.costIncreasePerField,
    });

    const fieldCostLabel = document.getElementById('buy-field-cost');
    if (fieldCostLabel) {
        fieldCostLabel.textContent = `${fieldCost + purchaseConfig.costIncreasePerField} coins`;
    }

    updateResourceBar();
    updateField();
    trackAchievements();
    incrementTotalClicks();
    updateClicksDisplay();
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
        updateCropsSold('wheat', 1);
        updateResourceBar();  // Refresh the UI to reflect updated resource values
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
           showNotification('No crops to sell!', 'Store');
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
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
           showNotification('Not enough crops to sell!', 'Store');
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
        updateSeedsBought('wheat', 1);
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
        showNotification('Not enough coins to buy wheat seeds!', 'Store');
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
        updateSeedsBought('corn', 1);
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
        showNotification('Not enough coins to buy corn seeds!', 'Store');
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
        updateSeedsBought('tomato', 1);
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
        showNotification('Not enough coins to buy tomato seeds!', 'Store');
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
        updateCropsSold('wheat', 1);
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
           showNotification('No wheat to sell!', 'Store');
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
        updateCropsSold('corn', 1);
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
           showNotification('No corn to sell!', 'Store');
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
        updateCropsSold('tomato', 1);
        updateResourceBar();
        incrementTotalClicks();
        updateClicksDisplay();
    } else {
           showNotification('No tomatoes to sell!', 'Store');
    }
}

export { buySeed, buyWater, buyPlot, sellCrops, buyBulkSeeds, sellBulkCrops,
         buyWheatSeeds, buyCornSeeds, buyTomatoSeeds,
         sellWheat, sellCorn, sellTomato,
         buyBulkSeedPack, sellBulkCropPack, buyBulkWaterRefill,
         buyNewField,
         buyDestroyPlotAction, buyRestorePlotAction, buyAutoFarmerAction, buyDisassembleAutoFarmerAction };
