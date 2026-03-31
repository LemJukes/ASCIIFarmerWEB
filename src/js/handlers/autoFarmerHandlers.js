import { getState, updateState } from '../state.js';
import { attemptAutoFarmerCycle } from './plotHandlers.js';
import { showNotification } from '../ui/macNotifications.js';
import { AUTO_FARMER_BASE_TICK_MS, AUTO_FARMER_MIN_TICK_MS } from '../configs/autoFarmerConfig.js';
import { getStationPoolKey, STATION_CAPACITY_PER_BUILDING } from '../configs/stationConfig.js';

const AUTO_FARMER_ENGINE_TICK_MS = 250;
const AUTO_FARMER_FLASH_DURATION_MS = 1200;

let autoFarmerEngineIntervalId = null;
const notifiedErrorByAutoFarmerKey = new Map();

function getAutoFarmerKey(fieldId, plotIndex) {
    return `${fieldId}:${plotIndex}`;
}

function updateAutoFarmerStatus(fieldId, plotIndex, updater) {
    const gameState = getState();
    const field = gameState.fields?.[fieldId];
    if (!field || !Array.isArray(field.plotStates)) {
        return;
    }

    const targetPlot = field.plotStates[plotIndex];
    if (!targetPlot?.autoFarmer) {
        return;
    }

    const nextAutoFarmer = {
        ...targetPlot.autoFarmer,
    };

    updater(nextAutoFarmer);

    const nextPlotStates = [...field.plotStates];
    nextPlotStates[plotIndex] = {
        ...targetPlot,
        autoFarmer: nextAutoFarmer,
        lastUpdatedAt: Date.now(),
    };

    updateState({
        fields: {
            ...gameState.fields,
            [fieldId]: {
                ...field,
                plotStates: nextPlotStates,
            },
        },
    });
}

function processAutoFarmerCycle() {
    const gameState = getState();
    const activeFieldId = gameState.activeFieldId;
    const activeField = gameState.fields?.[activeFieldId];
    if (!activeField || !Array.isArray(activeField.plotStates)) {
        return;
    }

    const now = Date.now();

    activeField.plotStates.forEach((plotState, plotIndex) => {
        if (!plotState?.autoFarmer) {
            return;
        }

        const autoFarmer = plotState.autoFarmer;
        if (autoFarmer.isPaused) {
            return;
        }

        const autoFarmerCount = activeField.plotStates.reduce((count, entry) => count + (entry?.autoFarmer ? 1 : 0), 0);
        const linkedPowerPlantPlotIndex = Number.isInteger(autoFarmer.linkedPowerPlantPlotIndex)
            ? Number(autoFarmer.linkedPowerPlantPlotIndex)
            : null;
        const linkedProcessingStationPlotIndex = Number.isInteger(autoFarmer.linkedProcessingStationPlotIndex)
            ? Number(autoFarmer.linkedProcessingStationPlotIndex)
            : null;

        const linkedPowerPlant = linkedPowerPlantPlotIndex !== null
            ? activeField.plotStates[linkedPowerPlantPlotIndex]?.powerPlant
            : null;
        const linkedProcessingStation = linkedProcessingStationPlotIndex !== null
            ? activeField.plotStates[linkedProcessingStationPlotIndex]?.processingStation
            : null;

        const isSingleFreeAutoFarmer = autoFarmerCount === 1;
        if (!isSingleFreeAutoFarmer && (!linkedPowerPlant || !linkedProcessingStation)) {
            const now = Date.now();
            updateAutoFarmerStatus(activeFieldId, plotIndex, (nextAutoFarmer) => {
                nextAutoFarmer.lastTickAt = now;
                nextAutoFarmer.lastErrorCode = 'INFRASTRUCTURE_MISSING';
                nextAutoFarmer.lastErrorMessage = 'Requires linked Power Plant and Processing Station.';
                nextAutoFarmer.flashingUntil = now + AUTO_FARMER_FLASH_DURATION_MS;
            });
            return;
        }

        if (linkedPowerPlant && (linkedPowerPlant.linkedAutoFarmerPlotIndices || []).length > STATION_CAPACITY_PER_BUILDING) {
            const now = Date.now();
            updateAutoFarmerStatus(activeFieldId, plotIndex, (nextAutoFarmer) => {
                nextAutoFarmer.lastTickAt = now;
                nextAutoFarmer.lastErrorCode = 'POWER_CAPACITY_EXCEEDED';
                nextAutoFarmer.lastErrorMessage = 'Linked Power Plant is overloaded.';
                nextAutoFarmer.flashingUntil = now + AUTO_FARMER_FLASH_DURATION_MS;
            });
            return;
        }

        if (linkedProcessingStation && (linkedProcessingStation.linkedAutoFarmerPlotIndices || []).length > STATION_CAPACITY_PER_BUILDING) {
            const now = Date.now();
            updateAutoFarmerStatus(activeFieldId, plotIndex, (nextAutoFarmer) => {
                nextAutoFarmer.lastTickAt = now;
                nextAutoFarmer.lastErrorCode = 'PROCESSING_CAPACITY_EXCEEDED';
                nextAutoFarmer.lastErrorMessage = 'Linked Processing Station is overloaded.';
                nextAutoFarmer.flashingUntil = now + AUTO_FARMER_FLASH_DURATION_MS;
            });
            return;
        }

        const tickMs = Math.max(AUTO_FARMER_MIN_TICK_MS, Number(autoFarmer.tickMs) || AUTO_FARMER_BASE_TICK_MS);
        const lastTickAt = Number(autoFarmer.lastTickAt) || 0;

        if ((now - lastTickAt) < tickMs) {
            return;
        }

        const result = attemptAutoFarmerCycle(plotIndex);
        let billingErrorCode = null;
        let billingErrorMessage = '';

        if (result?.success && !isSingleFreeAutoFarmer) {
            const currentState = getState();
            const powerPools = { ...(currentState.powerPlantCostPoolsByPlot || {}) };
            const processingPools = { ...(currentState.processingStationCostPoolsByPlot || {}) };
            let pendingCoinSpend = 0;

            if (linkedPowerPlant && linkedPowerPlantPlotIndex !== null) {
                const poolKey = getStationPoolKey(activeFieldId, linkedPowerPlantPlotIndex);
                const nextPool = (Number(powerPools[poolKey]) || 0) + (Number(linkedPowerPlant.costPerClick) || 0);
                const dueCoins = Math.floor(nextPool);
                powerPools[poolKey] = nextPool - dueCoins;
                pendingCoinSpend += dueCoins;
            }

            if (linkedProcessingStation && linkedProcessingStationPlotIndex !== null) {
                const poolKey = getStationPoolKey(activeFieldId, linkedProcessingStationPlotIndex);
                const nextPool = (Number(processingPools[poolKey]) || 0) + (Number(linkedProcessingStation.costPerClick) || 0);
                const dueCoins = Math.floor(nextPool);
                processingPools[poolKey] = nextPool - dueCoins;
                pendingCoinSpend += dueCoins;
            }

            if (pendingCoinSpend > 0 && Number(currentState.coins) < pendingCoinSpend) {
                billingErrorCode = 'INSUFFICIENT_COINS';
                billingErrorMessage = 'Need more coins to pay station click-cost.';
            } else if (pendingCoinSpend > 0 || linkedPowerPlant || linkedProcessingStation) {
                updateState({
                    coins: Number(currentState.coins) - pendingCoinSpend,
                    totalCoinsSpent: Number(currentState.totalCoinsSpent) + pendingCoinSpend,
                    powerPlantCostPoolsByPlot: powerPools,
                    processingStationCostPoolsByPlot: processingPools,
                });
            }
        }

        const autoFarmerKey = getAutoFarmerKey(activeFieldId, plotIndex);

        updateAutoFarmerStatus(activeFieldId, plotIndex, (nextAutoFarmer) => {
            nextAutoFarmer.lastTickAt = now;

            if (Number.isInteger(result?.preferredTargetPlotIndex)) {
                nextAutoFarmer.preferredTargetPlotIndex = result.preferredTargetPlotIndex;
            } else if (result?.errorCode === 'NO_VALID_TARGET') {
                nextAutoFarmer.preferredTargetPlotIndex = null;
            }

            if (result?.success && !billingErrorCode) {
                nextAutoFarmer.lastErrorCode = null;
                nextAutoFarmer.lastErrorMessage = '';
                nextAutoFarmer.flashingUntil = 0;
                notifiedErrorByAutoFarmerKey.delete(autoFarmerKey);
                return;
            }

            const errorCode = billingErrorCode || result?.errorCode || 'UNKNOWN_ERROR';
            const errorMessage = billingErrorMessage || result?.errorMessage || 'AutoFarmer could not work an adjacent plot.';
            nextAutoFarmer.lastErrorCode = errorCode;
            nextAutoFarmer.lastErrorMessage = errorMessage;
            nextAutoFarmer.flashingUntil = now + AUTO_FARMER_FLASH_DURATION_MS;

            const lastNotifiedCode = notifiedErrorByAutoFarmerKey.get(autoFarmerKey);
            if (!nextAutoFarmer.suppressWarnings && lastNotifiedCode !== errorCode) {
                showNotification(`AutoFarmer on plot ${plotIndex + 1}: ${errorMessage}`, 'AutoFarmer');
                notifiedErrorByAutoFarmerKey.set(autoFarmerKey, errorCode);
                return;
            }

            // Keep tracked error code in sync even when warnings are suppressed.
            notifiedErrorByAutoFarmerKey.set(autoFarmerKey, errorCode);
        });
    });
}

function initializeAutoFarmerEngine() {
    if (autoFarmerEngineIntervalId !== null) {
        return;
    }

    autoFarmerEngineIntervalId = window.setInterval(processAutoFarmerCycle, AUTO_FARMER_ENGINE_TICK_MS);
}

export { initializeAutoFarmerEngine };
