// ./ui/store.js.
import { savePartialSnapshot } from "../persistence.js";
import { progressionConfig } from "../../configs/progressionConfig.js";

const { storeEconomy, bulkTiers } = progressionConfig;

const initialStoreValues = {
    // Items for Sale Values
    // Seed Purchase Variables (generic - kept for compatibility)
    seedCost: 1,
    seedQuantity: 1,
    seedBulkCostCoefficient: .9,
    
    // Crop-Specific Seed Costs
    wheatSeedCost: storeEconomy.seedCosts.wheat,
    cornSeedCost: storeEconomy.seedCosts.corn,
    tomatoSeedCost: storeEconomy.seedCosts.tomato,
    
    // Water Purchase Variables
    waterCost: storeEconomy.water.cost,
    waterQuantity: storeEconomy.water.quantity,
    
    //Plot Purchase Variables
    plotCost: storeEconomy.plot.baseCost,
    
    // Player Sellable Item Values
    // Crop Sale Variables (generic - kept for compatibility)
    cropPrice: 2,
    cropQuantity: 1,
    cropBulkPriceCoefficient: 1.2,
    
    // Crop-Specific Sale Prices
    wheatPrice: storeEconomy.sellPrices.wheat,
    cornPrice: storeEconomy.sellPrices.corn,
    tomatoPrice: storeEconomy.sellPrices.tomato,
}

const storeValues = { ...initialStoreValues };

function getStoreValues() {
    return { ...storeValues};
}

function getStoreValuesSnapshot() {
    return { ...storeValues };
}

function applyStoreValuesSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return;
    }

    const merged = { ...initialStoreValues };
    for (const key of Object.keys(initialStoreValues)) {
        if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
            merged[key] = snapshot[key];
        }
    }

    Object.assign(storeValues, merged);
}

function updateStoreValues(updates) {
    Object.assign(storeValues, updates);
    savePartialSnapshot({ storeValues: getStoreValuesSnapshot() });
}

import { getState, } from "../state.js";
import { buySeed, buyWater, buyPlot, sellCrops, buyBulkSeeds, sellBulkCrops, 
         buyWheatSeeds, buyCornSeeds, buyTomatoSeeds,
         sellWheat, sellCorn, sellTomato,
         buyBulkSeedPack, sellBulkCropPack, buyBulkWaterRefill } from "../handlers/storeHandlers.js";

function initializeStoreTitle() {
    // Store Title as a Button
    const storeTitle = document.createElement('section');
    storeTitle.classList.add('container-title');
    storeTitle.id = 'store-title-button';
    storeTitle.setAttribute('aria-label', 'Store Title Button');
    storeTitle.textContent = 'The Store';

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(storeTitle);
    } else {
        console.error('Main div not found');
    }
}

function initializeStore() {
    const gameState = getState();

    // Store Section
    const store = document.createElement('section');
    store.classList.add('store-container');
    store.id = 'store';
    store.setAttribute('aria-label', 'The Store');

    // Buy Items Section
    const buyItemsSection = document.createElement('section');
    buyItemsSection.classList.add('store-section');
    buyItemsSection.id = 'buy-items';
    buyItemsSection.setAttribute('aria-label', 'Buy Items Section');

    // Buy Items Section Title
    const buyItemsTitle = document.createElement('h3');
    buyItemsTitle.classList.add('store-section-title');
    buyItemsTitle.textContent = 'Buy Items';
    buyItemsTitle.setAttribute('aria-label', 'Buy Items Section Title');
    store.appendChild(buyItemsTitle);

    // Seed Purchasing - Wheat Seeds
        const buyWheatSeedsSection = document.createElement('section');
        buyWheatSeedsSection.classList.add('item-title');
        buyWheatSeedsSection.id = 'buyWheatSeedsSection';
        buyWheatSeedsSection.textContent = 'Buy Wheat Seeds';
        buyWheatSeedsSection.setAttribute('aria-label', 'Buy Wheat Seeds Title');
        buyItemsSection.appendChild(buyWheatSeedsSection);

        const buyWheatSeedsButton = document.createElement('button');
        buyWheatSeedsButton.classList.add('store-button');
        buyWheatSeedsButton.textContent = `1x`;
        buyWheatSeedsButton.onclick = buyWheatSeeds;
        buyWheatSeedsSection.appendChild(buyWheatSeedsButton);

        const buyWheatSeedsCost = document.createElement('span');
        buyWheatSeedsCost.classList.add('item-price');
        buyWheatSeedsCost.textContent = `${storeValues.wheatSeedCost} coin`;
        buyWheatSeedsSection.appendChild(buyWheatSeedsCost);

    // Seed Purchasing - Corn Seeds
        const buyCornSeedsSection = document.createElement('section');
        buyCornSeedsSection.classList.add('item-title');
        buyCornSeedsSection.id = 'buyCornSeedsSection';
        buyCornSeedsSection.textContent = 'Buy Corn Seeds';
        buyCornSeedsSection.setAttribute('aria-label', 'Buy Corn Seeds Title');
        buyCornSeedsSection.style.display = gameState.cornUnlocked ? 'flex' : 'none';
        buyItemsSection.appendChild(buyCornSeedsSection);

        const buyCornSeedsButton = document.createElement('button');
        buyCornSeedsButton.classList.add('store-button');
        buyCornSeedsButton.textContent = `1x`;
        buyCornSeedsButton.onclick = buyCornSeeds;
        buyCornSeedsSection.appendChild(buyCornSeedsButton);

        const buyCornSeedsCost = document.createElement('span');
        buyCornSeedsCost.classList.add('item-price');
        buyCornSeedsCost.textContent = `${storeValues.cornSeedCost} coins`;
        buyCornSeedsSection.appendChild(buyCornSeedsCost);

    // Seed Purchasing - Tomato Seeds
        const buyTomatoSeedsSection = document.createElement('section');
        buyTomatoSeedsSection.classList.add('item-title');
        buyTomatoSeedsSection.id = 'buyTomatoSeedsSection';
        buyTomatoSeedsSection.textContent = 'Buy Tomato Seeds';
        buyTomatoSeedsSection.setAttribute('aria-label', 'Buy Tomato Seeds Title');
        buyTomatoSeedsSection.style.display = gameState.tomatoUnlocked ? 'flex' : 'none';
        buyItemsSection.appendChild(buyTomatoSeedsSection);

        const buyTomatoSeedsButton = document.createElement('button');
        buyTomatoSeedsButton.classList.add('store-button');
        buyTomatoSeedsButton.textContent = `1x`;
        buyTomatoSeedsButton.onclick = buyTomatoSeeds;
        buyTomatoSeedsSection.appendChild(buyTomatoSeedsButton);

        const buyTomatoSeedsCost = document.createElement('span');
        buyTomatoSeedsCost.classList.add('item-price');
        buyTomatoSeedsCost.textContent = `${storeValues.tomatoSeedCost} coins`;
        buyTomatoSeedsSection.appendChild(buyTomatoSeedsCost);

        // Water Refill Purchasing
        // Water Item Title
        const buyWaterSection = document.createElement('section');
        buyWaterSection.classList.add('item-title');
        buyWaterSection.id = 'buyWaterSection';
        buyWaterSection.textContent = 'Buy Water';
        buyWaterSection.setAttribute('aria-label', 'Buy Water Title');
        buyItemsSection.appendChild(buyWaterSection);

        // Water Button
        const buyWaterButton = document.createElement('button');
        buyWaterButton.classList.add('store-button');
        buyWaterButton.textContent = `${storeValues.waterQuantity}x`;
        buyWaterButton.onclick = buyWater;
        buyWaterSection.appendChild(buyWaterButton);

        // Water Cost Title
        const buyWaterCost = document.createElement('span');
        buyWaterCost.classList.add('item-price');
        buyWaterCost.textContent = `${storeValues.waterCost} coin`;
        buyWaterSection.appendChild(buyWaterCost);

    // Player Sellable Items Section
    const playerSellableItems = document.createElement('section');
    playerSellableItems.classList.add('store-section');
    playerSellableItems.id = 'player-sellable-items';
    playerSellableItems.setAttribute('aria-label', 'Player Sellable Items Section');

    // Player Sellable Items Section Title
    const playerSellableItemsTitle = document.createElement('h3');
    playerSellableItemsTitle.classList.add('store-section-title');
    playerSellableItemsTitle.textContent = 'Sell Items';
    playerSellableItemsTitle.setAttribute('aria-label', 'Player Sellable Items Section Title');
    store.appendChild(playerSellableItemsTitle);

    // Crop Selling - Wheat
        const sellWheatSection = document.createElement('section');
        sellWheatSection.classList.add('item-title');
        sellWheatSection.id = 'sellWheatSection';
        sellWheatSection.textContent = 'Sell Wheat';
        sellWheatSection.setAttribute('aria-label', 'Sell Wheat Title');
        playerSellableItems.appendChild(sellWheatSection);

        const sellWheatButton = document.createElement('button');
        sellWheatButton.classList.add('store-button');
        sellWheatButton.textContent = `1x`;
        sellWheatButton.onclick = sellWheat;
        sellWheatSection.appendChild(sellWheatButton);

        const sellWheatPrice = document.createElement('span');
        sellWheatPrice.classList.add('item-price');
        sellWheatPrice.textContent = `${storeValues.wheatPrice} coins`;
        sellWheatSection.appendChild(sellWheatPrice);

    // Crop Selling - Corn
        const sellCornSection = document.createElement('section');
        sellCornSection.classList.add('item-title');
        sellCornSection.id = 'sellCornSection';
        sellCornSection.textContent = 'Sell Corn';
        sellCornSection.setAttribute('aria-label', 'Sell Corn Title');
        sellCornSection.style.display = gameState.cornUnlocked ? 'flex' : 'none';
        playerSellableItems.appendChild(sellCornSection);

        const sellCornButton = document.createElement('button');
        sellCornButton.classList.add('store-button');
        sellCornButton.textContent = `1x`;
        sellCornButton.onclick = sellCorn;
        sellCornSection.appendChild(sellCornButton);

        const sellCornPrice = document.createElement('span');
        sellCornPrice.classList.add('item-price');
        sellCornPrice.textContent = `${storeValues.cornPrice} coins`;
        sellCornSection.appendChild(sellCornPrice);

    // Crop Selling - Tomato
        const sellTomatoSection = document.createElement('section');
        sellTomatoSection.classList.add('item-title');
        sellTomatoSection.id = 'sellTomatoSection';
        sellTomatoSection.textContent = 'Sell Tomato';
        sellTomatoSection.setAttribute('aria-label', 'Sell Tomato Title');
        sellTomatoSection.style.display = gameState.tomatoUnlocked ? 'flex' : 'none';
        playerSellableItems.appendChild(sellTomatoSection);

        const sellTomatoButton = document.createElement('button');
        sellTomatoButton.classList.add('store-button');
        sellTomatoButton.textContent = `1x`;
        sellTomatoButton.onclick = sellTomato;
        sellTomatoSection.appendChild(sellTomatoButton);

        const sellTomatoPrice = document.createElement('span');
        sellTomatoPrice.classList.add('item-price');
        sellTomatoPrice.textContent = `${storeValues.tomatoPrice} coins`;
        sellTomatoSection.appendChild(sellTomatoPrice);

    // Field Expansion Section
    const fieldExpansionSection = document.createElement('section');
    fieldExpansionSection.classList.add('store-section');
    fieldExpansionSection.id = 'field-expansion-section';
    fieldExpansionSection.setAttribute('aria-label', 'Field Expansion Section');

    // Field Expansion Section Title
    const fieldExpansionTitle = document.createElement('h3');
    fieldExpansionTitle.classList.add('store-section-title');
    fieldExpansionTitle.textContent = 'Field Expansion';
    fieldExpansionTitle.setAttribute('aria-label', 'Field Expansion Section Title');
    store.appendChild(fieldExpansionTitle);

    // Plot Purchasing
        // Plot Item Title
        const buyPlotSection = document.createElement('section');
        buyPlotSection.classList.add('item-title');
        buyPlotSection.id = "buyPlotSection";
        buyPlotSection.textContent = 'Buy Plot';
        buyPlotSection.setAttribute('aria-label', 'Buy Plot Title');
        fieldExpansionSection.appendChild(buyPlotSection);

        // Buy Plot Button
        const buyPlotButton = document.createElement('button');
        buyPlotButton.classList.add('store-button');
        buyPlotButton.textContent = `1x`;
        buyPlotButton.onclick = buyPlot;
        buyPlotSection.appendChild(buyPlotButton);

        // Plot Cost Title
        const buyPlotCost = document.createElement('span');
        buyPlotCost.classList.add('item-price');
        buyPlotCost.setAttribute('id', 'plot-cost');
        buyPlotCost.textContent = `${getStoreValues().plotCost} coin(s)`;
        buyPlotSection.appendChild(buyPlotCost);

    // Append sections to store
    buyItemsTitle.appendChild(buyItemsSection);
    playerSellableItemsTitle.appendChild(playerSellableItems);
    fieldExpansionTitle.appendChild(fieldExpansionSection);

    // Append store to the main div
    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(store);
    } else {
        console.error('Main div not found');
    }
}

function addBulkSeedButton(cropType, achievementValue, bonusTier) {
    const tierConfig = bulkTiers.seedPacks[bonusTier - 1];
    const quantity = tierConfig?.quantity;
    const discountMultiplier = tierConfig?.discountMultiplier;

    if (!quantity || !discountMultiplier) {
        return;
    }

    const seedSectionMap = {
        wheat: { sectionId: 'buyWheatSeedsSection', seedCost: storeValues.wheatSeedCost },
        corn: { sectionId: 'buyCornSeedsSection', seedCost: storeValues.cornSeedCost },
        tomato: { sectionId: 'buyTomatoSeedsSection', seedCost: storeValues.tomatoSeedCost },
    };

    const { sectionId, seedCost } = seedSectionMap[cropType] ?? {};
    const section = document.getElementById(sectionId);
    if (!section) return;

    const buttonId = `${cropType}-bulk-seed-${quantity}`;
    if (document.getElementById(buttonId)) return;

    const totalCost = Math.max(1, Math.ceil(quantity * seedCost * discountMultiplier));

    const bulkButton = document.createElement('button');
    bulkButton.classList.add('store-button');
    bulkButton.id = buttonId;
    bulkButton.textContent = `${quantity}x`;
    bulkButton.addEventListener('click', () => buyBulkSeedPack(cropType, quantity, totalCost));
    section.appendChild(bulkButton);

    const bulkCost = document.createElement('span');
    bulkCost.classList.add('item-price');
    bulkCost.id = `${buttonId}-cost`;
    bulkCost.textContent = `${totalCost} coins`;
    section.appendChild(bulkCost);
}

function addBulkCropSaleButton(cropType, achievementValue, bonusTier) {
    const tierConfig = bulkTiers.cropSales[bonusTier - 1];
    const quantity = tierConfig?.quantity;
    const bonusPercent = tierConfig?.bonusPercent;

    if (!quantity || !bonusPercent) {
        return;
    }

    const multiplier = 1 + bonusPercent / 100;

    const cropSectionMap = {
        wheat: { sectionId: 'sellWheatSection', cropPrice: storeValues.wheatPrice },
        corn: { sectionId: 'sellCornSection', cropPrice: storeValues.cornPrice },
        tomato: { sectionId: 'sellTomatoSection', cropPrice: storeValues.tomatoPrice },
    };

    const { sectionId, cropPrice } = cropSectionMap[cropType] ?? {};
    const section = document.getElementById(sectionId);
    if (!section) return;

    const buttonId = `${cropType}-bulk-sale-${quantity}`;
    if (document.getElementById(buttonId)) return;

    const payout = Math.max(1, Math.floor(quantity * cropPrice * multiplier));

    const bulkButton = document.createElement('button');
    bulkButton.classList.add('store-button');
    bulkButton.id = buttonId;
    bulkButton.textContent = `${quantity}x`;
    bulkButton.addEventListener('click', () => sellBulkCropPack(cropType, quantity, payout));
    section.appendChild(bulkButton);

    const bulkValue = document.createElement('span');
    bulkValue.classList.add('item-price');
    bulkValue.id = `${buttonId}-value`;
    bulkValue.textContent = `${payout} coins (+${bonusPercent}%)`;
    section.appendChild(bulkValue);
}

function addBulkWaterRefillButton(achievementValue, bonusTier) {
    const buyWaterSection = document.getElementById('buyWaterSection');
    if (!buyWaterSection) {
        return;
    }

    const tierConfig = bulkTiers.waterRefills[bonusTier - 1];
    const refillAmount = tierConfig?.quantity;
    const costMultiplier = tierConfig?.costMultiplier;
    if (!refillAmount) {
        return;
    }

    const scaledCost = Math.max(1, Math.ceil((refillAmount / storeValues.waterQuantity) * storeValues.waterCost * (costMultiplier || 1)));

    const buttonId = `bulk-water-refill-${achievementValue}`;
    if (document.getElementById(buttonId)) {
        return;
    }

    const waterButton = document.createElement('button');
    waterButton.classList.add('store-button');
    waterButton.id = buttonId;
    waterButton.textContent = `${refillAmount}x`;
    waterButton.addEventListener('click', () => buyBulkWaterRefill(refillAmount, scaledCost));
    buyWaterSection.appendChild(waterButton);

    const waterCost = document.createElement('span');
    waterCost.classList.add('item-price');
    waterCost.id = `${buttonId}-cost`;
    waterCost.textContent = `${scaledCost} coins`;
    buyWaterSection.appendChild(waterCost);
}

export { initializeStore, 
         initializeStoreTitle, 
         getStoreValues, 
         getStoreValuesSnapshot,
         applyStoreValuesSnapshot,
         updateStoreValues,
         addBulkSeedButton, 
         addBulkCropSaleButton,
         addBulkWaterRefillButton };
