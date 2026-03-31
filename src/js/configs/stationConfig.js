const STATION_BASE_EFFICIENCY_PERCENT = 10;
const STATION_MAX_EFFICIENCY_PERCENT = 100;
const STATION_BASE_COST_PER_CLICK = 0.05;
const STATION_CAPACITY_PER_BUILDING = 3;

const POWER_PLANT_BASE_COST = 250;
const POWER_PLANT_COST_STEP = 150;
const POWER_PLANT_UPGRADE_BASE_COST = 120;
const POWER_PLANT_UPGRADE_COST_STEP = 120;

const PROCESSING_STATION_BASE_COST = 250;
const PROCESSING_STATION_COST_STEP = 150;
const PROCESSING_STATION_UPGRADE_BASE_COST = 120;
const PROCESSING_STATION_UPGRADE_COST_STEP = 120;

const STATION_UPGRADE_EFFICIENCY_STEP = 10;

function clampEfficiencyPercent(efficiencyPercent) {
    const parsed = Number(efficiencyPercent) || STATION_BASE_EFFICIENCY_PERCENT;
    return Math.max(STATION_BASE_EFFICIENCY_PERCENT, Math.min(STATION_MAX_EFFICIENCY_PERCENT, parsed));
}

function computeStationCostPerClick(efficiencyPercent) {
    const normalizedEfficiency = clampEfficiencyPercent(efficiencyPercent);
    return STATION_BASE_COST_PER_CLICK * (STATION_BASE_EFFICIENCY_PERCENT / normalizedEfficiency);
}

function formatStationCostPerClick(costPerClick) {
    const normalized = Math.max(0, Number(costPerClick) || 0);
    return `${normalized.toFixed(2)}c`;
}

function getPowerPlantBuildCost(currentNextCost) {
    return Math.max(POWER_PLANT_BASE_COST, Number(currentNextCost) || POWER_PLANT_BASE_COST);
}

function getProcessingStationBuildCost(currentNextCost) {
    return Math.max(PROCESSING_STATION_BASE_COST, Number(currentNextCost) || PROCESSING_STATION_BASE_COST);
}

function getNextPowerPlantBuildCost(costPaid) {
    const paid = Math.max(POWER_PLANT_BASE_COST, Number(costPaid) || POWER_PLANT_BASE_COST);
    return paid + POWER_PLANT_COST_STEP;
}

function getNextProcessingStationBuildCost(costPaid) {
    const paid = Math.max(PROCESSING_STATION_BASE_COST, Number(costPaid) || PROCESSING_STATION_BASE_COST);
    return paid + PROCESSING_STATION_COST_STEP;
}

function getPowerPlantUpgradeCost(level) {
    const normalizedLevel = Math.max(1, Number(level) || 1);
    return POWER_PLANT_UPGRADE_BASE_COST + ((normalizedLevel - 1) * POWER_PLANT_UPGRADE_COST_STEP);
}

function getProcessingStationUpgradeCost(level) {
    const normalizedLevel = Math.max(1, Number(level) || 1);
    return PROCESSING_STATION_UPGRADE_BASE_COST + ((normalizedLevel - 1) * PROCESSING_STATION_UPGRADE_COST_STEP);
}

function getNextStationEfficiencyPercent(currentEfficiencyPercent) {
    const current = clampEfficiencyPercent(currentEfficiencyPercent);
    return Math.min(STATION_MAX_EFFICIENCY_PERCENT, current + STATION_UPGRADE_EFFICIENCY_STEP);
}

function getPowerPlantDisassembleRefund(level) {
    const normalizedLevel = Math.max(1, Number(level) || 1);
    let refund = POWER_PLANT_BASE_COST;

    for (let currentLevel = 1; currentLevel < normalizedLevel; currentLevel++) {
        refund += getPowerPlantUpgradeCost(currentLevel);
    }

    return refund;
}

function getProcessingStationDisassembleRefund(level) {
    const normalizedLevel = Math.max(1, Number(level) || 1);
    let refund = PROCESSING_STATION_BASE_COST;

    for (let currentLevel = 1; currentLevel < normalizedLevel; currentLevel++) {
        refund += getProcessingStationUpgradeCost(currentLevel);
    }

    return refund;
}

function getStationPoolKey(fieldId, plotIndex) {
    return `${fieldId}:${Number(plotIndex)}`;
}

function createDefaultStationState() {
    const efficiencyPercent = STATION_BASE_EFFICIENCY_PERCENT;
    return {
        level: 1,
        efficiencyPercent,
        costPerClick: computeStationCostPerClick(efficiencyPercent),
        linkedAutoFarmerPlotIndices: [],
        lastErrorCode: null,
        lastErrorMessage: '',
        isPaused: false,
    };
}

export {
    STATION_BASE_EFFICIENCY_PERCENT,
    STATION_MAX_EFFICIENCY_PERCENT,
    STATION_BASE_COST_PER_CLICK,
    STATION_CAPACITY_PER_BUILDING,
    POWER_PLANT_BASE_COST,
    POWER_PLANT_COST_STEP,
    PROCESSING_STATION_BASE_COST,
    PROCESSING_STATION_COST_STEP,
    clampEfficiencyPercent,
    computeStationCostPerClick,
    formatStationCostPerClick,
    getPowerPlantBuildCost,
    getNextPowerPlantBuildCost,
    getProcessingStationBuildCost,
    getNextProcessingStationBuildCost,
    getPowerPlantUpgradeCost,
    getProcessingStationUpgradeCost,
    getNextStationEfficiencyPercent,
    getPowerPlantDisassembleRefund,
    getProcessingStationDisassembleRefund,
    getStationPoolKey,
    createDefaultStationState,
};