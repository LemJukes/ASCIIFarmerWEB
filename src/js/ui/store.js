// ./ui/store.js.
const storeValues = {
    // Items for Sale Values
    // Seed Purchase Variables
    seedCost: 1,
    seedQuantity: 1,
    seedBulkCostCoefficient: .9,
    // Water Purchase Variables
    waterCost: 1,
    waterQuantity: 10,
    //Plot Purchase Variables
    plotCost: 10,
    // Player Sellable Item Values
    // Crop Sale Variables
    cropPrice: 2,
    cropQuantity: 1,
    cropBulkPriceCoefficient: 1.2,
}

function getStoreValues() {
    return { ...storeValues};
}

function updateStoreValues(updates) {
    Object.assign(storeValues, updates);
}

import { getState, } from "../state.js";
import { buySeed, buyWater, buyPlot, sellCrops, buyBulkSeeds, sellBulkCrops } from "../handlers/storeHandlers.js";

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

    // Store Section
    const store = document.createElement('section');
    store.classList.add('store-container');
    store.id = 'store';
    store.setAttribute('aria-label', 'The Store');

    // Items for Sale Section
    const itemsForSaleSection = document.createElement('section');
    itemsForSaleSection.classList.add('store-section');
    itemsForSaleSection.id = 'items-for-sale';
    itemsForSaleSection.setAttribute('aria-label', 'Items for Sale Section');

    // Items for Sale Section Title
    const itemsForSaleTitle = document.createElement('h3');
    itemsForSaleTitle.classList.add('store-section-title');
    itemsForSaleTitle.textContent = 'Items for Sale';
    itemsForSaleTitle.setAttribute('aria-label', 'Items for Sale Section Title');
    store.appendChild(itemsForSaleTitle);

    // Seed Purchasing
        // Seed Item Title
        const buySeedsSection = document.createElement('section');
        buySeedsSection.classList.add('item-title');
        buySeedsSection.id = 'buySeedsSection';
        buySeedsSection.textContent = 'Buy Seeds';
        buySeedsSection.setAttribute('aria-label', 'Buy Seeds Title');
        itemsForSaleSection.appendChild(buySeedsSection);

        // Seed Button
        const buySeedsButton = document.createElement('button');
        buySeedsButton.classList.add('store-button');
        buySeedsButton.textContent = `${storeValues.seedQuantity}x`;
        buySeedsButton.onclick = buySeed;
        buySeedsSection.appendChild(buySeedsButton);

        // Seed Cost Title
        const buySeedsCost = document.createElement('span');
        buySeedsCost.classList.add('item-price');
        buySeedsCost.textContent = `${storeValues.seedCost} coin`;
        buySeedsSection.appendChild(buySeedsCost);

        // Water Refill Purchasing
        // Water Item Title
        const buyWaterSection = document.createElement('section');
        buyWaterSection.classList.add('item-title');
        buyWaterSection.id = 'buyWaterSection';
        buyWaterSection.textContent = 'Buy Water';
        buyWaterSection.setAttribute('aria-label', 'Buy Water Title');
        itemsForSaleSection.appendChild(buyWaterSection);

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

    // Crop Selling
        // Crop Item Title
        const sellCropsSection = document.createElement('section');
        sellCropsSection.classList.add('item-title');
        sellCropsSection.id = 'sellCropsSection';
        sellCropsSection.textContent = 'Sell Crops';
        sellCropsSection.setAttribute('aria-label', 'Sell Crops Title');
        playerSellableItems.appendChild(sellCropsSection);

        // Crop Button
        const sellCropsButton = document.createElement('button');
        sellCropsButton.classList.add('store-button');
        sellCropsButton.textContent = `${storeValues.cropQuantity}x`;
        sellCropsButton.onclick = sellCrops;
        sellCropsSection.appendChild(sellCropsButton);

        // Crop Price Title
        const sellCropsCost = document.createElement('span');
        sellCropsCost.classList.add('item-price');
        sellCropsCost.textContent = `${storeValues.cropPrice} coins`;
        sellCropsSection.appendChild(sellCropsCost);

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
    itemsForSaleTitle.appendChild(itemsForSaleSection);
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

function addBulkSeedButton(buyBulkSeedsText, buyBulkSeedsCostText) {
    const buySeedsSection = document.getElementById('buySeedsSection');

    if (!buySeedsSection) {
        console.error('Items for Sale section not found');
        return;
    }

    // Extract quantity and cost from the text
    const bulkSeedQuantity = parseInt(buyBulkSeedsText);
    const bulkSeedCost = parseInt(buyBulkSeedsCostText);

    // Seed Bulk Button
    const buyBulkSeedsButton = document.createElement('button');
    buyBulkSeedsButton.classList.add('store-button');
    buyBulkSeedsButton.textContent = buyBulkSeedsText;
    buyBulkSeedsButton.onclick = buyBulkSeeds;
    buySeedsSection.appendChild(buyBulkSeedsButton);

    // Seed Bulk Cost Title
    const buyBulkSeedsCost = document.createElement('span');
    buyBulkSeedsCost.classList.add('item-price');
    buyBulkSeedsCost.textContent = buyBulkSeedsCostText;
    buySeedsSection.appendChild(buyBulkSeedsCost);

}

function addBulkCropSaleButton(sellBulkCropsText, sellBulkCropsCostText) {
    // Ensure sellCropsSection is present in the DOM
    const sellCropsSection = document.getElementById('sellCropsSection');

    if (!sellCropsSection) {  // Correct the condition to check if the section is not found
        console.error('Sell Crops Section not found in the DOM');
        return;
    }

    const bulkCropQuantity = parseInt(sellBulkCropsText);
    const bulkCropCost = parseInt(sellBulkCropsCostText);

    // Crop Bulk Sale Button
    const sellBulkCropsButton = document.createElement('button');
    sellBulkCropsButton.classList.add('store-button');
    sellBulkCropsButton.textContent = sellBulkCropsText;
    sellBulkCropsButton.onclick = sellBulkCrops; // Assign the buyBulkCrops function as the click handler
    sellCropsSection.appendChild(sellBulkCropsButton);

    // Crop Bulk Sale Cost Title
    const sellBulkCropsCost = document.createElement('span');
    sellBulkCropsCost.classList.add('item-price');
    sellBulkCropsCost.textContent = sellBulkCropsCostText;
    sellCropsSection.appendChild(sellBulkCropsCost);
}

export { initializeStore, 
         initializeStoreTitle, 
         getStoreValues, 
         updateStoreValues,
         addBulkSeedButton, 
         addBulkCropSaleButton };
