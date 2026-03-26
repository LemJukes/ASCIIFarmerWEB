import { getState, updateState } from '../state.js';
import { attemptAutoFarmerCycle } from './plotHandlers.js';
import { showNotification } from '../ui/macNotifications.js';

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
        const tickMs = Math.max(250, Number(autoFarmer.tickMs) || 2500);
        const lastTickAt = Number(autoFarmer.lastTickAt) || 0;

        if ((now - lastTickAt) < tickMs) {
            return;
        }

        const result = attemptAutoFarmerCycle(plotIndex);
        const autoFarmerKey = getAutoFarmerKey(activeFieldId, plotIndex);

        updateAutoFarmerStatus(activeFieldId, plotIndex, (nextAutoFarmer) => {
            nextAutoFarmer.lastTickAt = now;

            if (Number.isInteger(result?.preferredTargetPlotIndex)) {
                nextAutoFarmer.preferredTargetPlotIndex = result.preferredTargetPlotIndex;
            } else if (result?.errorCode === 'NO_VALID_TARGET') {
                nextAutoFarmer.preferredTargetPlotIndex = null;
            }

            if (result?.success) {
                nextAutoFarmer.lastErrorCode = null;
                nextAutoFarmer.lastErrorMessage = '';
                nextAutoFarmer.flashingUntil = 0;
                notifiedErrorByAutoFarmerKey.delete(autoFarmerKey);
                return;
            }

            const errorCode = result?.errorCode || 'UNKNOWN_ERROR';
            const errorMessage = result?.errorMessage || 'AutoFarmer could not work an adjacent plot.';
            nextAutoFarmer.lastErrorCode = errorCode;
            nextAutoFarmer.lastErrorMessage = errorMessage;
            nextAutoFarmer.flashingUntil = now + AUTO_FARMER_FLASH_DURATION_MS;

            const lastNotifiedCode = notifiedErrorByAutoFarmerKey.get(autoFarmerKey);
            if (lastNotifiedCode !== errorCode) {
                showNotification(`AutoFarmer on plot ${plotIndex + 1}: ${errorMessage}`, 'AutoFarmer');
                notifiedErrorByAutoFarmerKey.set(autoFarmerKey, errorCode);
            }
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
