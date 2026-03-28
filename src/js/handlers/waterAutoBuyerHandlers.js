import { progressionConfig } from '../configs/progressionConfig.js';
import { attemptWaterAutoRefillPurchase } from './storeHandlers.js';
import { getUpgradeValues } from '../ui/upgrades.js';

const WATER_AUTO_BUYER_CONFIG = progressionConfig.storeEconomy.water.autoBuyer || {};
const WATER_AUTO_BUYER_TICK_MS = Math.max(250, Number(WATER_AUTO_BUYER_CONFIG.tickMs) || 500);

let waterAutoBuyerIntervalId = null;

function processWaterAutoBuyerCycle() {
    const upgradeValues = getUpgradeValues();
    if (!upgradeValues.waterAutoBuyerUnlocked || !upgradeValues.waterAutoBuyerEnabled) {
        return;
    }

    attemptWaterAutoRefillPurchase();
}

function initializeWaterAutoBuyerEngine() {
    if (waterAutoBuyerIntervalId !== null) {
        return;
    }

    waterAutoBuyerIntervalId = window.setInterval(processWaterAutoBuyerCycle, WATER_AUTO_BUYER_TICK_MS);
}

export { initializeWaterAutoBuyerEngine };
