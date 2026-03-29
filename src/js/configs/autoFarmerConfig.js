const AUTO_FARMER_BASE_TICK_MS = 2500;
const AUTO_FARMER_MIN_TICK_MS = 500;
const AUTO_FARMER_UPGRADE_COST_BASE = 100;
const AUTO_FARMER_UPGRADE_COST_STEP = 100;
const AUTO_FARMER_UPGRADE_MULTIPLIER = 0.9;
const AUTO_FARMER_BASE_REFUND = 100;

function getAutoFarmerUpgradeCost(currentLevel) {
    const level = Math.max(1, Number(currentLevel) || 1);
    return AUTO_FARMER_UPGRADE_COST_BASE + ((level - 1) * AUTO_FARMER_UPGRADE_COST_STEP);
}

function getNextAutoFarmerTickMs(currentTickMs) {
    const tickMs = Math.max(AUTO_FARMER_MIN_TICK_MS, Number(currentTickMs) || AUTO_FARMER_BASE_TICK_MS);
    const nextTickMs = Math.round(tickMs * AUTO_FARMER_UPGRADE_MULTIPLIER);
    return Math.max(AUTO_FARMER_MIN_TICK_MS, nextTickMs);
}

function getAutoFarmerDisassembleRefund(level) {
    const normalizedLevel = Math.max(1, Number(level) || 1);
    let refund = AUTO_FARMER_BASE_REFUND;

    // Sum upgrade costs paid for levels 1->2 up to (level-1)->level.
    for (let currentLevel = 1; currentLevel < normalizedLevel; currentLevel++) {
        refund += getAutoFarmerUpgradeCost(currentLevel);
    }

    return refund;
}

export {
    AUTO_FARMER_BASE_TICK_MS,
    AUTO_FARMER_MIN_TICK_MS,
    getAutoFarmerUpgradeCost,
    getNextAutoFarmerTickMs,
    getAutoFarmerDisassembleRefund,
};
