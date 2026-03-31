import { getState, updateState, incrementTotalClicks } from '../state.js';
import { updateResourceBar } from '../ui/resource.js';
import { getUpgradeValues, updateUpgradeValues, renderClickUpgradesSection } from '../ui/upgrades.js';
import { getCropConfig, getGrowthSymbol } from '../configs/cropConfig.js';
import { progressionConfig } from '../configs/progressionConfig.js';
import { playPlotBubbleForState, playAdjacentBubbleForState } from '../ui/sfx.js';
import { updateClicksDisplay } from '../ui/clicks.js';
import { updateToolboxDisplay } from '../ui/toolbox.js';
import { showNotification, showConfirmation } from '../ui/macNotifications.js';
import { showAutoFarmerDetailWindow } from '../ui/autoFarmerDetail.js';
import { TOOLS, WATERING_SYMBOLS, HARVEST_SYMBOLS, getRequiredToolForSymbol } from '../configs/toolConfig.js';
import { getAutoFarmerDisassembleRefund } from '../configs/autoFarmerConfig.js';
import { showPowerPlantDetailWindow } from '../ui/powerPlantDetail.js';
import { showProcessingStationDetailWindow } from '../ui/processingStationDetail.js';
import {
    STATION_CAPACITY_PER_BUILDING,
    formatStationCostPerClick,
    getPowerPlantDisassembleRefund,
    getProcessingStationDisassembleRefund,
} from '../configs/stationConfig.js';

const GRID_WIDTH = 9;
const OUT_OF_CHARGES_MESSAGE = 'Auto-Changer is out of charges. Buy more charges in Upgrades.';
const EXPANDED_CLICK_LEVEL_DELAY_MS = 100;
const AUTO_FARMER_CLOCKWISE_OFFSETS = [
    [-1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, -1],
];
const EXPANDED_CLICK_PATTERNS = {
    1: [[0, -1], [0, 1]],
    2: [[-1, 0], [1, 0]],
    3: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    4: createSquareRingOffsets(2),
    5: createSquareRingOffsets(3),
    6: createSquareRingOffsets(4),
};

function createSquareRingOffsets(radius) {
    const offsets = [];

    for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
        for (let colOffset = -radius; colOffset <= radius; colOffset++) {
            if (Math.max(Math.abs(rowOffset), Math.abs(colOffset)) !== radius) {
                continue;
            }

            offsets.push([rowOffset, colOffset]);
        }
    }

    return offsets;
}

function getSelectedTool(gameState) {
    return gameState.selectedTool || TOOLS.PLOW;
}

function getWrongToolMessage(currentSymbol) {
    if (currentSymbol === '~') {
        return `You need the ${TOOLS.PLOW} selected to till this plot.`;
    }

    if (currentSymbol === '=') {
        return `You need the ${TOOLS.SEED_BAG} selected to plant seeds.`;
    }

    if (WATERING_SYMBOLS.includes(currentSymbol)) {
        return `You need the ${TOOLS.WATERING_CAN} selected to water crops.`;
    }

    return 'You need the correct tool selected for this action.';
}

function getSelectedSeedType(gameState) {
    if (gameState.selectedSeedType === 'tomato' && gameState.tomatoUnlocked) {
        return 'tomato';
    }

    if (gameState.selectedSeedType === 'corn' && gameState.cornUnlocked) {
        return 'corn';
    }

    return 'wheat';
}

function getSeedInventoryKey(seedType) {
    if (seedType === 'corn') {
        return 'cornSeeds';
    }

    if (seedType === 'tomato') {
        return 'tomatoSeeds';
    }

    return 'wheatSeeds';
}

function getUnlockedSeedTypes(gameState) {
    const unlockedSeeds = ['wheat'];

    if (gameState.cornUnlocked) {
        unlockedSeeds.push('corn');
    }

    if (gameState.tomatoUnlocked) {
        unlockedSeeds.push('tomato');
    }

    return unlockedSeeds;
}

function resolveSeedTypeForAction(gameState, options = {}) {
    const {
        seedTypeOverride = null,
        enforceOverride = false,
    } = options;

    const unlockedSeeds = getUnlockedSeedTypes(gameState);
    if (typeof seedTypeOverride !== 'string' || seedTypeOverride.length === 0) {
        return {
            ok: true,
            seedType: getSelectedSeedType(gameState),
            errorCode: null,
            errorMessage: '',
        };
    }

    if (!['wheat', 'corn', 'tomato'].includes(seedTypeOverride)) {
        return {
            ok: false,
            seedType: null,
            errorCode: 'INVALID_SEED_TYPE',
            errorMessage: 'Preferred AutoFarmer seed type is invalid.',
        };
    }

    if (!unlockedSeeds.includes(seedTypeOverride)) {
        if (enforceOverride) {
            return {
                ok: false,
                seedType: null,
                errorCode: 'PREFERRED_SEED_LOCKED',
                errorMessage: `Preferred seed ${seedTypeOverride} is not unlocked.`,
            };
        }

        return {
            ok: true,
            seedType: getSelectedSeedType(gameState),
            errorCode: null,
            errorMessage: '',
        };
    }

    return {
        ok: true,
        seedType: seedTypeOverride,
        errorCode: null,
        errorMessage: '',
    };
}

function getActiveFieldContext() {
    const gameState = getState();
    const activeField = gameState.fields?.[gameState.activeFieldId];

    if (!activeField || !Array.isArray(activeField.plotStates)) {
        return null;
    }

    return {
        gameState,
        activeField,
        activeFieldId: gameState.activeFieldId,
        plotStates: activeField.plotStates,
    };
}

function commitActiveFieldPlotStates(gameState, activeFieldId, plotStates, updatedPlots) {
    const existingField = gameState.fields?.[activeFieldId];
    if (!existingField) {
        return;
    }

    const nextField = {
        ...existingField,
        plots: Number(updatedPlots) || existingField.plots,
        plotStates,
    };

    updateState({
        fields: {
            ...gameState.fields,
            [activeFieldId]: nextField,
        },
    });
}

function getPlotDisabledTime(activeFieldPlots) {
    const { fallowTime } = progressionConfig.storeEconomy.plot;
    const ownedPlots = Number(activeFieldPlots) || getState().plots;
    const clampedPlots = Math.min(
        fallowTime.maxPlotCount,
        Math.max(fallowTime.minPlotCount, ownedPlots)
    );

    if (clampedPlots === fallowTime.minPlotCount) {
        return fallowTime.minDurationMs;
    }

    const plotRange = fallowTime.maxPlotCount - fallowTime.minPlotCount;
    const progress = (clampedPlots - fallowTime.minPlotCount) / plotRange;

    return fallowTime.minDurationMs + ((fallowTime.maxDurationMs - fallowTime.minDurationMs) * progress);
}

function getAutoChangerRequiredTool(currentSymbol) {
    const requiredTool = getRequiredToolForSymbol(currentSymbol);

    if (requiredTool) {
        return requiredTool;
    }

    if (HARVEST_SYMBOLS.includes(currentSymbol)) {
        return TOOLS.SCYTHE;
    }

    return null;
}

function getPlotStateLabel(plotState, now = Date.now()) {
    if (plotState?.powerPlant) {
        return 'Power Plant';
    }

    if (plotState?.processingStation) {
        return 'Processing Station';
    }

    if (plotState?.autoFarmer) {
        return 'AutoFarmer';
    }

    if (plotState?.destroyed) {
        return 'Destroyed';
    }

    if (Number(plotState?.disabledUntil) > now) {
        return 'Fallow';
    }

    const symbol = plotState?.symbol;

    if (symbol === '~') {
        return 'Untilled';
    }

    if (symbol === '=') {
        return 'Tilled';
    }

    if (symbol === '.') {
        return 'Planted';
    }

    if (symbol === '/' || symbol === '|' || symbol === '\\') {
        return 'Growing';
    }

    if (HARVEST_SYMBOLS.includes(symbol)) {
        return 'Ready to Harvest';
    }

    return 'Unknown';
}

function getRequiredToolLabel(plotState, now = Date.now()) {
    if (plotState?.autoFarmer || plotState?.powerPlant || plotState?.processingStation || plotState?.destroyed) {
        return 'None';
    }

    if (Number(plotState?.disabledUntil) > now) {
        return 'None';
    }

    return getAutoChangerRequiredTool(plotState?.symbol) || 'None';
}

function buildPlotHoverText(plotState, plotIndex, now = Date.now()) {
    const plotNumber = Number(plotIndex) + 1;
    const plotStateLabel = getPlotStateLabel(plotState, now);
    const requiredToolLabel = getRequiredToolLabel(plotState, now);

    if (plotState?.autoFarmer) {
        const autoFarmerErrorText = plotState.autoFarmer.lastErrorMessage
            ? `\nAutoFarmer: ${plotState.autoFarmer.lastErrorMessage}`
            : '\nAutoFarmer: Active';
        return `Plot: ${plotNumber}\nState: ${plotStateLabel}\nRequired Tool: ${requiredToolLabel}${autoFarmerErrorText}`;
    }

    if (plotState?.powerPlant) {
        const linkUsage = `${plotState.powerPlant.linkedAutoFarmerPlotIndices.length}/${STATION_CAPACITY_PER_BUILDING}`;
        const stationErrorText = plotState.powerPlant.lastErrorMessage
            ? `\nPower Plant: ${plotState.powerPlant.lastErrorMessage}`
            : '\nPower Plant: Operational';
        return `Plot: ${plotNumber}\nState: ${plotStateLabel}\nRequired Tool: ${requiredToolLabel}\nEfficiency: ${plotState.powerPlant.efficiencyPercent}%\nCost/Click: ${formatStationCostPerClick(plotState.powerPlant.costPerClick)}\nLinked AutoFarmers: ${linkUsage}${stationErrorText}`;
    }

    if (plotState?.processingStation) {
        const linkUsage = `${plotState.processingStation.linkedAutoFarmerPlotIndices.length}/${STATION_CAPACITY_PER_BUILDING}`;
        const stationErrorText = plotState.processingStation.lastErrorMessage
            ? `\nProcessing Station: ${plotState.processingStation.lastErrorMessage}`
            : '\nProcessing Station: Operational';
        return `Plot: ${plotNumber}\nState: ${plotStateLabel}\nRequired Tool: ${requiredToolLabel}\nEfficiency: ${plotState.processingStation.efficiencyPercent}%\nCost/Click: ${formatStationCostPerClick(plotState.processingStation.costPerClick)}\nLinked AutoFarmers: ${linkUsage}${stationErrorText}`;
    }

    return `Plot: ${plotNumber}\nState: ${plotStateLabel}\nRequired Tool: ${requiredToolLabel}`;
}

function syncPlotButtonPresentation(plot, plotState, plotIndex, now = Date.now()) {
    if (!plot || !plotState) {
        return;
    }

    plot.classList.remove('destroyed-plot', 'autofarmer-plot', 'autofarmer-error', 'powerplant-plot', 'powerplant-error', 'processingstation-plot', 'processingstation-error');

    if (plotState.autoFarmer) {
        const isErrorVisualActive = !!plotState.autoFarmer.lastErrorCode;

        // Render all three gifs once; CSS + class controls which is visible.
        if (!plot.querySelector('.autofarmer-gif-light')) {
            plot.innerHTML = [
                `<img class="autofarmer-gif autofarmer-gif-light" src="./src/assets/AutoFarmer/AutoFarmer.gif" alt="AutoFarmer">`,
                `<img class="autofarmer-gif autofarmer-gif-dark-ver" src="./src/assets/AutoFarmer/AutoFarmerDark.gif" alt="AutoFarmer">`,
                `<img class="autofarmer-gif autofarmer-gif-error" src="./src/assets/AutoFarmer/AutoFarmerError.gif" alt="AutoFarmer error">`,
            ].join('');
        }

        plot.disabled = false;
        plot.classList.add('autofarmer-plot');

        if (isErrorVisualActive) {
            plot.classList.add('autofarmer-error');
        }
    } else if (plotState.powerPlant) {
        const isErrorVisualActive = !!plotState.powerPlant.lastErrorCode;

        if (!plot.querySelector('.powerplant-gif-light')) {
            plot.innerHTML = [
                `<img class="powerplant-gif powerplant-gif-light" src="./src/assets/Power Plant/Power Plant.gif" alt="Power Plant">`,
                `<img class="powerplant-gif powerplant-gif-dark-ver" src="./src/assets/Power Plant/Power Plant Dark Mode.gif" alt="Power Plant">`,
                `<img class="powerplant-gif powerplant-gif-error" src="./src/assets/Power Plant/Power Plant.gif" alt="Power Plant error">`,
            ].join('');
        }

        plot.disabled = false;
        plot.classList.add('powerplant-plot');

        if (isErrorVisualActive) {
            plot.classList.add('powerplant-error');
        }
    } else if (plotState.processingStation) {
        const isErrorVisualActive = !!plotState.processingStation.lastErrorCode;

        if (!plot.querySelector('.processingstation-gif-light')) {
            plot.innerHTML = [
                `<img class="processingstation-gif processingstation-gif-light" src="./src/assets/Processing Station/Processing Station.gif" alt="Processing Station">`,
                `<img class="processingstation-gif processingstation-gif-dark-ver" src="./src/assets/Processing Station/Processing Station Dark Mode.gif" alt="Processing Station">`,
                `<img class="processingstation-gif processingstation-gif-error" src="./src/assets/Processing Station/Processing Station.gif" alt="Processing Station error">`,
            ].join('');
        }

        plot.disabled = false;
        plot.classList.add('processingstation-plot');

        if (isErrorVisualActive) {
            plot.classList.add('processingstation-error');
        }
    } else if (plotState.destroyed) {
        const gameState = getState();
        plot.textContent = '⊠';
        plot.disabled = gameState.plotSelectionMode !== 'restore';
        plot.classList.add('destroyed-plot');
    } else {
        plot.textContent = plotState.symbol;
        plot.disabled = Number(plotState.disabledUntil) > now;
    }

    const nextTitle = buildPlotHoverText(plotState, plotIndex, now);
    if (plot.title !== nextTitle) {
        plot.title = nextTitle;
    }
}

function handlePlotSelectionInteraction(plot, plotIndex, context) {
    const mode = context.gameState.plotSelectionMode;
    if (!mode) {
        return false;
    }

    const gameState = context.gameState;
    const activeField = gameState.fields?.[context.activeFieldId];
    if (!activeField || !Array.isArray(activeField.plotStates)) {
        updateState({ plotSelectionMode: null });
        return true;
    }

    const plotStates = activeField.plotStates;
    const plotState = plotStates[plotIndex];
    if (!plotState) {
        return true;
    }

    if (mode === 'destroy') {
        if (plotState.autoFarmer || plotState.powerPlant || plotState.processingStation) {
            showNotification('Cannot destroy a plot with a building on it.', 'Destroy Plot');
            return true;
        }

        if (plotState.destroyed) {
            showNotification('That plot is already destroyed.', 'Destroy Plot');
            return true;
        }

        plotState.symbol = '⊠';
        plotState.cropType = null;
        plotState.waterCount = 0;
        plotState.disabledUntil = 0;
        plotState.destroyed = true;
        plotState.lastUpdatedAt = Date.now();

        commitActiveFieldPlotStates(gameState, context.activeFieldId, plotStates, activeField.plots);
        updateState({ plotSelectionMode: null });
        syncPlotButtonPresentation(plot, plotState, plotIndex);
        showNotification(`Plot ${plotIndex + 1} destroyed.`, 'Destroy Plot');
        return true;
    }

    if (mode === 'restore') {
        if (!plotState.destroyed) {
            showNotification('That plot is not destroyed.', 'Restore Plot');
            return true;
        }

        if (plotState.autoFarmer) {
            showNotification('Cannot restore a plot while an AutoFarmer is built there.', 'Restore Plot');
            return true;
        }

        plotState.symbol = '~';
        plotState.cropType = null;
        plotState.waterCount = 0;
        plotState.disabledUntil = 0;
        plotState.destroyed = false;
        plotState.lastUpdatedAt = Date.now();

        commitActiveFieldPlotStates(gameState, context.activeFieldId, plotStates, activeField.plots);
        updateState({ plotSelectionMode: null });
        syncPlotButtonPresentation(plot, plotState, plotIndex);
        showNotification(`Plot ${plotIndex + 1} restored.`, 'Restore Plot');
        return true;
    }

    if (mode === 'disassembleAutoFarmer') {
        if (!plotState.autoFarmer) {
            showNotification('That plot does not have an AutoFarmer to disassemble.', 'Disassemble AutoFarmer');
            return true;
        }

        showConfirmation(`Disassemble the AutoFarmer on plot ${plotIndex + 1}? It will be removed and the plot will remain destroyed.`, {
            title: 'Disassemble AutoFarmer',
            onConfirm: () => {
                const gs = getState();
                const af = gs.fields?.[context.activeFieldId];
                if (!af || !Array.isArray(af.plotStates)) {
                    return;
                }

                const ps = af.plotStates;
                const ps2 = ps[plotIndex];
                if (!ps2) {
                    return;
                }

                const refundAmount = getAutoFarmerDisassembleRefund(ps2.autoFarmer?.level);

                ps2.autoFarmer = null;
                ps2.lastUpdatedAt = Date.now();

                commitActiveFieldPlotStates(gs, context.activeFieldId, ps, af.plots);
                updateState({
                    coins: gs.coins + refundAmount,
                    plotSelectionMode: null,
                    autoFarmerDisassembledCount: (Number(gs.autoFarmerDisassembledCount) || 0) + 1,
                });
                syncPlotButtonPresentation(plot, ps2, plotIndex);
                updateResourceBar();
                showNotification(`AutoFarmer on plot ${plotIndex + 1} disassembled. Refunded ${refundAmount} coins.`, 'Disassemble AutoFarmer');
            },
            onCancel: () => {
                // Keep selection mode active so player may click a different plot
            },
        });
        return true;
    }

    if (mode === 'disassemblePowerPlant') {
        if (!plotState.powerPlant) {
            showNotification('That plot does not have a Power Plant to disassemble.', 'Disassemble Power Plant');
            return true;
        }

        showConfirmation(`Disassemble the Power Plant on plot ${plotIndex + 1}? Linked AutoFarmers will enter an error state.`, {
            title: 'Disassemble Power Plant',
            onConfirm: () => {
                const gs = getState();
                const af = gs.fields?.[context.activeFieldId];
                if (!af || !Array.isArray(af.plotStates)) {
                    return;
                }

                const ps = af.plotStates;
                const ps2 = ps[plotIndex];
                if (!ps2) {
                    return;
                }

                const linkedIndices = Array.isArray(ps2.powerPlant?.linkedAutoFarmerPlotIndices)
                    ? [...ps2.powerPlant.linkedAutoFarmerPlotIndices]
                    : [];

                linkedIndices.forEach((linkedPlotIndex) => {
                    const linkedPlot = ps[linkedPlotIndex];
                    if (!linkedPlot?.autoFarmer) {
                        return;
                    }

                    linkedPlot.autoFarmer.linkedPowerPlantPlotIndex = null;
                    linkedPlot.autoFarmer.lastErrorCode = 'INFRASTRUCTURE_MISSING';
                    linkedPlot.autoFarmer.lastErrorMessage = 'Linked power plant was removed.';
                    linkedPlot.autoFarmer.flashingUntil = Date.now() + 1200;
                    linkedPlot.lastUpdatedAt = Date.now();
                });

                const refundAmount = getPowerPlantDisassembleRefund(ps2.powerPlant?.level);
                ps2.powerPlant = null;
                ps2.lastUpdatedAt = Date.now();

                commitActiveFieldPlotStates(gs, context.activeFieldId, ps, af.plots);
                updateState({
                    coins: gs.coins + refundAmount,
                    plotSelectionMode: null,
                    powerPlantDisassembledCount: (Number(gs.powerPlantDisassembledCount) || 0) + 1,
                });
                syncPlotButtonPresentation(plot, ps2, plotIndex);
                updateResourceBar();
                showNotification(`Power Plant on plot ${plotIndex + 1} disassembled. Refunded ${refundAmount} coins.`, 'Disassemble Power Plant');
            },
            onCancel: () => {
                // Keep selection mode active so player may click a different plot
            },
        });
        return true;
    }

    if (mode === 'disassembleProcessingStation') {
        if (!plotState.processingStation) {
            showNotification('That plot does not have a Processing Station to disassemble.', 'Disassemble Processing Station');
            return true;
        }

        showConfirmation(`Disassemble the Processing Station on plot ${plotIndex + 1}? Linked AutoFarmers will enter an error state.`, {
            title: 'Disassemble Processing Station',
            onConfirm: () => {
                const gs = getState();
                const af = gs.fields?.[context.activeFieldId];
                if (!af || !Array.isArray(af.plotStates)) {
                    return;
                }

                const ps = af.plotStates;
                const ps2 = ps[plotIndex];
                if (!ps2) {
                    return;
                }

                const linkedIndices = Array.isArray(ps2.processingStation?.linkedAutoFarmerPlotIndices)
                    ? [...ps2.processingStation.linkedAutoFarmerPlotIndices]
                    : [];

                linkedIndices.forEach((linkedPlotIndex) => {
                    const linkedPlot = ps[linkedPlotIndex];
                    if (!linkedPlot?.autoFarmer) {
                        return;
                    }

                    linkedPlot.autoFarmer.linkedProcessingStationPlotIndex = null;
                    linkedPlot.autoFarmer.lastErrorCode = 'INFRASTRUCTURE_MISSING';
                    linkedPlot.autoFarmer.lastErrorMessage = 'Linked processing station was removed.';
                    linkedPlot.autoFarmer.flashingUntil = Date.now() + 1200;
                    linkedPlot.lastUpdatedAt = Date.now();
                });

                const refundAmount = getProcessingStationDisassembleRefund(ps2.processingStation?.level);
                ps2.processingStation = null;
                ps2.lastUpdatedAt = Date.now();

                commitActiveFieldPlotStates(gs, context.activeFieldId, ps, af.plots);
                updateState({
                    coins: gs.coins + refundAmount,
                    plotSelectionMode: null,
                    processingStationDisassembledCount: (Number(gs.processingStationDisassembledCount) || 0) + 1,
                });
                syncPlotButtonPresentation(plot, ps2, plotIndex);
                updateResourceBar();
                showNotification(`Processing Station on plot ${plotIndex + 1} disassembled. Refunded ${refundAmount} coins.`, 'Disassemble Processing Station');
            },
            onCancel: () => {
                // Keep selection mode active so player may click a different plot
            },
        });
        return true;
    }

    updateState({ plotSelectionMode: null });
    return true;
}

function consumeToolAutoChangerCharge(showFailureAlert) {
    const upgradeValues = getUpgradeValues();
    const canAutoChange = upgradeValues.toolAutoChangerPurchased && upgradeValues.toolAutoChangerEnabled;

    if (!canAutoChange) {
        return {
            allowed: false,
            canAutoChange,
            outOfCharges: false,
        };
    }

    if (upgradeValues.toolAutoChangerCharges < 1) {
        if (showFailureAlert) {
            showNotification(OUT_OF_CHARGES_MESSAGE, 'Upgrades');
        }

        return {
            allowed: false,
            canAutoChange,
            outOfCharges: true,
        };
    }

    updateUpgradeValues({ toolAutoChangerCharges: upgradeValues.toolAutoChangerCharges - 1 });
    renderClickUpgradesSection();
    return {
        allowed: true,
        canAutoChange,
        outOfCharges: false,
    };
}

function resolveToolSelection(currentSymbol, showFailureAlert, options = {}) {
    const {
        skipAutoChangeCharge = false,
    } = options;

    const gameState = getState();
    const selectedTool = getSelectedTool(gameState);
    const requiredTool = getAutoChangerRequiredTool(currentSymbol);

    if (!requiredTool || selectedTool === requiredTool) {
        return {
            allowed: true,
            gameState,
            selectedTool,
        };
    }

    const upgradeValues = getUpgradeValues();
    const canAutoChange = upgradeValues.toolAutoChangerPurchased && upgradeValues.toolAutoChangerEnabled;

    if (!canAutoChange) {
        if (showFailureAlert) {
            showNotification(getWrongToolMessage(currentSymbol), 'Tool Required');
        }

        return {
            allowed: false,
            gameState,
            selectedTool,
        };
    }

    if (!skipAutoChangeCharge) {
        const chargeResult = consumeToolAutoChangerCharge(showFailureAlert);
        if (!chargeResult.allowed) {
            return {
                allowed: false,
                gameState,
                selectedTool,
            };
        }
    }

    updateState({ selectedTool: requiredTool });
    updateToolboxDisplay();

    return {
        allowed: true,
        gameState: { ...gameState, selectedTool: requiredTool },
        selectedTool: requiredTool,
    };
}

function handlePlotClick(plot, plotIndex) {
    const initialContext = getActiveFieldContext();
    if (!initialContext) {
        return;
    }

    const initialPlot = initialContext.plotStates[plotIndex];
    if (!initialPlot) {
        return;
    }

    if (handlePlotSelectionInteraction(plot, plotIndex, initialContext)) {
        return;
    }

    if (initialPlot.autoFarmer) {
        showAutoFarmerDetailWindow({
            plot,
            plotIndex,
            fieldId: initialContext.activeFieldId,
        });
        return;
    }

    if (initialPlot.powerPlant) {
        showPowerPlantDetailWindow({
            plot,
            plotIndex,
            fieldId: initialContext.activeFieldId,
        });
        return;
    }

    if (initialPlot.processingStation) {
        showProcessingStationDetailWindow({
            plot,
            plotIndex,
            fieldId: initialContext.activeFieldId,
        });
        return;
    }

    if (initialPlot.destroyed) {
        return;
    }

    const toolSelection = resolveToolSelection(initialPlot.symbol, true);
    if (!toolSelection.allowed) {
        return;
    }

    const gameState = toolSelection.gameState;
    const activeFieldId = gameState.activeFieldId;
    const activeField = gameState.fields?.[activeFieldId];
    if (!activeField || !Array.isArray(activeField.plotStates)) {
        return;
    }

    const plotStates = activeField.plotStates;
    const plotState = plotStates[plotIndex];
    if (!plotState) {
        return;
    }

    const currentSymbol = plotState.symbol;
    const selectedTool = toolSelection.selectedTool;
    let didChange = false;

    switch (currentSymbol) {
        case '~': // Untilled
            // Tilling the plot requires no cost
            plotState.symbol = '=';
            plotState.disabledUntil = 0;
            plotState.lastUpdatedAt = Date.now();
            didChange = true;
            break;
            
        case '=': // Tilled
            const selectedSeedType = getSelectedSeedType(gameState);
            const selectedSeedInventoryKey = getSeedInventoryKey(selectedSeedType);

            if (gameState[selectedSeedInventoryKey] < 1) {
                showNotification(`Not enough ${selectedSeedType} seeds!`, 'Store');
                return;
            }
            
            updateState({ [selectedSeedInventoryKey]: gameState[selectedSeedInventoryKey] - 1 });
            
            plotState.symbol = '.';
            plotState.cropType = selectedSeedType;
            plotState.waterCount = 0;
            plotState.disabledUntil = 0;
            plotState.lastUpdatedAt = Date.now();
            didChange = true;
            break;
            
        case '.': // Planted - start watering
        case '/': // Growing stages
        case '|':
        case '\\':
            if (!plotState.cropType) {
                console.error('Plot is in growing state but has no crop type!');
                return;
            }
            
            if (gameState.water >= 1) {
                const cropConfig = getCropConfig(plotState.cropType);
                plotState.waterCount++;
                updateState({ water: gameState.water - 1 });
                
                // Check if crop is fully grown (use > not >= to show all growth stages)
                if (plotState.waterCount > cropConfig.waterStages) {
                    plotState.symbol = cropConfig.symbol; // Show final crop symbol (¥, ₡, or ₮)
                } else {
                    // Show oscillating growth symbol
                    plotState.symbol = getGrowthSymbol(plotState.waterCount - 1);
                }

                plotState.disabledUntil = 0;
                plotState.lastUpdatedAt = Date.now();

                didChange = true;
            } else {
                showNotification('Not enough water!', 'Water');
            }
            break;
            
        case '¥': // Grown wheat
        case '₡': // Grown corn
        case '₮': // Grown tomato
            // Harvesting without scythe has a 50% chance to fail
            const hasScytheSelected = selectedTool === TOOLS.SCYTHE;
            const harvestSucceeded = hasScytheSelected || Math.random() < 0.5;

            if (harvestSucceeded) {
                const cropType = plotState.cropType;
                if (cropType === 'wheat') {
                    updateState({ wheat: gameState.wheat + 1 });
                } else if (cropType === 'corn') {
                    updateState({ corn: gameState.corn + 1 });
                } else if (cropType === 'tomato') {
                    updateState({ tomato: gameState.tomato + 1 });
                }

                // Update generic crops count for backward compatibility
                updateState({ crops: gameState.crops + 1 });
            } else {
                showNotification('Harvest missed! Select the Scythe to guarantee harvests.', 'Harvest');
            }
            
            // Reset plot
            plotState.symbol = '~';
            plotState.cropType = null;
            plotState.waterCount = 0;
            plotState.lastUpdatedAt = Date.now();
            didChange = true;

            const disabledTime = getPlotDisabledTime(activeField.plots);
            plotState.disabledUntil = Date.now() + disabledTime;
            break;
            
        default:
            console.warn(`Unknown plot symbol: ${currentSymbol}`);
            break;
    }

    if (!didChange) {
        return;
    }

    syncPlotButtonPresentation(plot, plotState, plotIndex);

    playPlotBubbleForState(currentSymbol);
    incrementTotalClicks();
    updateClicksDisplay();

    // Update the game state with modified plot states
    commitActiveFieldPlotStates(gameState, activeFieldId, plotStates, activeField.plots);

    // Apply expanded click effects in tier order, with a short delay between tiers when multiple are enabled.
    const upgradeValues = getUpgradeValues();
    const expandedClickActivations = [];

    if (upgradeValues.expandedClickMk1Purchased && upgradeValues.expandedClickMk1Enabled) {
        expandedClickActivations.push(() => affectAdjacentPlotsMk1(plotIndex));
    }

    if (upgradeValues.expandedClickMk2Purchased && upgradeValues.expandedClickMk2Enabled) {
        expandedClickActivations.push(() => affectAdjacentPlotsMk2(plotIndex));
    }

    if (upgradeValues.expandedClickMk3Purchased && upgradeValues.expandedClickMk3Enabled) {
        expandedClickActivations.push(() => affectAdjacentPlotsMk3(plotIndex));
    }

    if (upgradeValues.expandedClickMk4Purchased && upgradeValues.expandedClickMk4Enabled) {
        expandedClickActivations.push(() => affectAdjacentPlotsMk4(plotIndex));
    }

    if (upgradeValues.expandedClickMk5Purchased && upgradeValues.expandedClickMk5Enabled) {
        expandedClickActivations.push(() => affectAdjacentPlotsMk5(plotIndex));
    }

    if (upgradeValues.expandedClickMk6Purchased && upgradeValues.expandedClickMk6Enabled) {
        expandedClickActivations.push(() => affectAdjacentPlotsMk6(plotIndex));
    }

    if (expandedClickActivations.length <= 1) {
        expandedClickActivations.forEach((activateLevel) => activateLevel());
        updateResourceBar();
        return;
    }

    expandedClickActivations.forEach((activateLevel, levelIndex) => {
        setTimeout(() => {
            activateLevel();

            if (levelIndex === expandedClickActivations.length - 1) {
                updateResourceBar();
            }
        }, levelIndex * EXPANDED_CLICK_LEVEL_DELAY_MS);
    });
}

function applyExpandedClickPattern(index, offsets) {
    const field = document.getElementById('field');
    const plots = Array.from(field.children);
    const originRow = Math.floor(index / GRID_WIDTH);
    const originCol = index % GRID_WIDTH;
    const context = getActiveFieldContext();

    offsets.forEach(([rowOffset, colOffset]) => {
        const targetRow = originRow + rowOffset;
        const targetCol = originCol + colOffset;

        if (targetRow < 0 || targetRow >= GRID_WIDTH || targetCol < 0 || targetCol >= GRID_WIDTH) {
            return;
        }

        const targetIndex = (targetRow * GRID_WIDTH) + targetCol;
        const targetPlot = plots[targetIndex];
        const targetState = context?.plotStates?.[targetIndex];

        if (!targetPlot || targetPlot.disabled || targetState?.destroyed || targetState?.autoFarmer || targetState?.powerPlant || targetState?.processingStation) {
            return;
        }

        handleAdjacentPlotClickMk1(targetPlot, targetIndex, {
            forceAutoChangerChargePerClick: true,
        });
    });
}

// Function to affect adjacent plots if expanded click is enabled
function affectAdjacentPlotsMk1(index) {
    applyExpandedClickPattern(index, EXPANDED_CLICK_PATTERNS[1]);
}

// Function to affect adjacent plots in vertical pattern (Mk.2) - up and down only
function affectAdjacentPlotsMk2(index) {
    applyExpandedClickPattern(index, EXPANDED_CLICK_PATTERNS[2]);
}

// Function to affect adjacent plots diagonally (Mk.3) - the 4 corner plots only
function affectAdjacentPlotsMk3(index) {
    applyExpandedClickPattern(index, EXPANDED_CLICK_PATTERNS[3]);
}

// Function to affect adjacent plots in the 5x5 ring (Mk.4)
function affectAdjacentPlotsMk4(index) {
    applyExpandedClickPattern(index, EXPANDED_CLICK_PATTERNS[4]);
}

// Function to affect adjacent plots in the 7x7 ring (Mk.5)
function affectAdjacentPlotsMk5(index) {
    applyExpandedClickPattern(index, EXPANDED_CLICK_PATTERNS[5]);
}

// Function to affect adjacent plots in the 9x9 ring (Mk.6)
function affectAdjacentPlotsMk6(index) {
    applyExpandedClickPattern(index, EXPANDED_CLICK_PATTERNS[6]);
}

// Function to handle click on adjacent plots
function handleAdjacentPlotClickMk1(plot, plotIndex, options = {}) {
    const {
        ignoreToolRequirement = false,
        countClick = true,
        playSfx = true,
        isAutoFarmerAction = false,
        seedTypeOverride = null,
        forceAutoChangerChargePerClick = false,
    } = options;

    const initialContext = getActiveFieldContext();
    if (!initialContext) {
        return { success: false, errorCode: 'NO_FIELD', errorMessage: 'No active field context.' };
    }

    const initialPlot = initialContext.plotStates[plotIndex];
    if (!initialPlot) {
        return { success: false, errorCode: 'NO_PLOT', errorMessage: 'Target plot does not exist.' };
    }

    if (initialPlot.destroyed || initialPlot.autoFarmer || initialPlot.powerPlant || initialPlot.processingStation) {
        return { success: false, errorCode: 'INVALID_TARGET', errorMessage: 'Target plot cannot be worked.' };
    }

    let toolSelection;
    if (ignoreToolRequirement) {
        const gameState = getState();
        toolSelection = {
            allowed: true,
            gameState,
            selectedTool: getSelectedTool(gameState),
        };
    } else {
        let shouldSkipAutoChangeCharge = false;
        if (forceAutoChangerChargePerClick) {
            const chargeResult = consumeToolAutoChangerCharge(false);
            if (!chargeResult.allowed && chargeResult.canAutoChange) {
                return { success: false, errorCode: 'OUT_OF_CHARGES', errorMessage: OUT_OF_CHARGES_MESSAGE };
            }

            shouldSkipAutoChangeCharge = chargeResult.allowed;
        }

        toolSelection = resolveToolSelection(initialPlot.symbol, false, {
            skipAutoChangeCharge: shouldSkipAutoChangeCharge,
        });
    }

    if (!toolSelection.allowed) {
        return { success: false, errorCode: 'TOOL_BLOCKED', errorMessage: 'Tool requirements not met.' };
    }

    const gameState = toolSelection.gameState;
    const activeFieldId = gameState.activeFieldId;
    const activeField = gameState.fields?.[activeFieldId];
    if (!activeField || !Array.isArray(activeField.plotStates)) {
        return { success: false, errorCode: 'NO_FIELD', errorMessage: 'No active field context.' };
    }

    const plotStates = activeField.plotStates;
    const plotState = plotStates[plotIndex];
    if (!plotState) {
        return { success: false, errorCode: 'NO_PLOT', errorMessage: 'Target plot does not exist.' };
    }

    if (plotState.destroyed || plotState.autoFarmer || plotState.powerPlant || plotState.processingStation) {
        return { success: false, errorCode: 'INVALID_TARGET', errorMessage: 'Target plot cannot be worked.' };
    }

    const currentSymbol = plotState.symbol;
    const selectedTool = toolSelection.selectedTool;
    let didChange = false;

    switch (currentSymbol) {
        case '~': // Untilled
            plotState.symbol = '=';
            plotState.disabledUntil = 0;
            plotState.lastUpdatedAt = Date.now();
            didChange = true;
            break;
            
        case '=': // Tilled
            const resolvedSeed = resolveSeedTypeForAction(gameState, {
                seedTypeOverride,
                enforceOverride: isAutoFarmerAction,
            });
            if (!resolvedSeed.ok) {
                return { success: false, errorCode: resolvedSeed.errorCode, errorMessage: resolvedSeed.errorMessage };
            }

            const selectedSeedType = resolvedSeed.seedType;
            const selectedSeedInventoryKey = getSeedInventoryKey(selectedSeedType);

            if (gameState[selectedSeedInventoryKey] < 1) {
                if (isAutoFarmerAction && typeof seedTypeOverride === 'string' && seedTypeOverride.length > 0) {
                    return {
                        success: false,
                        errorCode: 'PREFERRED_SEED_UNAVAILABLE',
                        errorMessage: `Preferred seed ${selectedSeedType} is unavailable.`,
                    };
                }

                return { success: false, errorCode: 'NO_SEEDS', errorMessage: `Not enough ${selectedSeedType} seeds.` };
            }
            
            updateState({ [selectedSeedInventoryKey]: gameState[selectedSeedInventoryKey] - 1 });
            
            plotState.symbol = '.';
            plotState.cropType = selectedSeedType;
            plotState.waterCount = 0;
            plotState.disabledUntil = 0;
            plotState.lastUpdatedAt = Date.now();
            didChange = true;
            break;
            
        case '.': // Planted - start watering
        case '/': // Growing stages
        case '|':
        case '\\':
            if (!plotState.cropType) {
                return { success: false, errorCode: 'NO_CROP', errorMessage: 'Target plot has no crop type.' };
            }
            
            if (gameState.water >= 1) {
                const cropConfig = getCropConfig(plotState.cropType);
                plotState.waterCount++;
                updateState({ water: gameState.water - 1 });
                
                // Check if crop is fully grown (use > not >= to show all growth stages)
                if (plotState.waterCount > cropConfig.waterStages) {
                    plotState.symbol = cropConfig.symbol;
                } else {
                    // Show oscillating growth symbol
                    plotState.symbol = getGrowthSymbol(plotState.waterCount - 1);
                }

                plotState.disabledUntil = 0;
                plotState.lastUpdatedAt = Date.now();

                didChange = true;
            }
            if (!didChange) {
                return { success: false, errorCode: 'NO_WATER', errorMessage: 'Not enough water.' };
            }
            break;
            
        case '¥': // Grown wheat
        case '₡': // Grown corn
        case '₮': // Grown tomato
            const hasScytheSelected = ignoreToolRequirement || selectedTool === TOOLS.SCYTHE;
            const harvestSucceeded = hasScytheSelected || Math.random() < 0.5;

            if (harvestSucceeded) {
                const cropType = plotState.cropType;
                if (cropType === 'wheat') {
                    updateState({ wheat: gameState.wheat + 1 });
                } else if (cropType === 'corn') {
                    updateState({ corn: gameState.corn + 1 });
                } else if (cropType === 'tomato') {
                    updateState({ tomato: gameState.tomato + 1 });
                }

                updateState({ crops: gameState.crops + 1 });

                if (isAutoFarmerAction) {
                    updateState({ autoFarmerCropsHarvested: (Number(getState().autoFarmerCropsHarvested) || 0) + 1 });
                }
            }
            
            // Reset plot
            plotState.symbol = '~';
            plotState.cropType = null;
            plotState.waterCount = 0;
            plotState.lastUpdatedAt = Date.now();
            didChange = true;

            const disabledTime = getPlotDisabledTime(activeField.plots);
            plotState.disabledUntil = Date.now() + disabledTime;
            break;
            
        default:
            return { success: false, errorCode: 'INVALID_STATE', errorMessage: 'Plot is not in a workable state.' };
    }

    if (!didChange) {
        return { success: false, errorCode: 'NO_CHANGE', errorMessage: 'No state change occurred.' };
    }

    syncPlotButtonPresentation(plot, plotState, plotIndex);

    if (playSfx) {
        playAdjacentBubbleForState(currentSymbol);
    }

    if (countClick) {
        incrementTotalClicks();
        updateClicksDisplay();
    }

    // Update the game state with modified plot states
    commitActiveFieldPlotStates(gameState, activeFieldId, plotStates, activeField.plots);
    updateResourceBar();

    return { success: true, errorCode: null, errorMessage: '' };
}

function attemptAutoFarmerCycle(autoFarmerPlotIndex) {
    const context = getActiveFieldContext();
    if (!context) {
        return { success: false, errorCode: 'NO_FIELD', errorMessage: 'No active field context.' };
    }

    const sourceState = context.plotStates?.[autoFarmerPlotIndex];
    if (!sourceState?.autoFarmer) {
        return { success: false, errorCode: 'NO_AUTOFARMER', errorMessage: 'No AutoFarmer found on source plot.' };
    }

    const fieldElement = document.getElementById('field');
    if (!fieldElement) {
        return { success: false, errorCode: 'NO_FIELD_ELEMENT', errorMessage: 'Field UI is unavailable.' };
    }

    const plots = Array.from(fieldElement.children);
    const originRow = Math.floor(autoFarmerPlotIndex / GRID_WIDTH);
    const originCol = autoFarmerPlotIndex % GRID_WIDTH;

    const neighborIndices = [];
    for (const [rowOffset, colOffset] of AUTO_FARMER_CLOCKWISE_OFFSETS) {
        const targetRow = originRow + rowOffset;
        const targetCol = originCol + colOffset;
        if (targetRow < 0 || targetRow >= GRID_WIDTH || targetCol < 0 || targetCol >= GRID_WIDTH) {
            continue;
        }

        neighborIndices.push((targetRow * GRID_WIDTH) + targetCol);
    }

    let preferredTargetPlotIndex = Number.isInteger(sourceState.autoFarmer.preferredTargetPlotIndex)
        ? Number(sourceState.autoFarmer.preferredTargetPlotIndex)
        : null;

    if (!neighborIndices.includes(preferredTargetPlotIndex)) {
        preferredTargetPlotIndex = null;
    }

    if (preferredTargetPlotIndex !== null) {
        const preferredState = context.plotStates?.[preferredTargetPlotIndex];
        if (!preferredState || preferredState.destroyed) {
            preferredTargetPlotIndex = null;
        }
    }

    const startNeighborOrderIndex = preferredTargetPlotIndex !== null
        ? Math.max(0, neighborIndices.indexOf(preferredTargetPlotIndex))
        : 0;

    let resolvedTargetPlotIndex = null;
    for (let offset = 0; offset < neighborIndices.length; offset++) {
        const neighborOrderIndex = (startNeighborOrderIndex + offset) % neighborIndices.length;
        const targetIndex = neighborIndices[neighborOrderIndex];
        const targetState = context.plotStates?.[targetIndex];
        const targetPlot = plots[targetIndex];

        if (!targetState || !targetPlot) {
            continue;
        }

        if (targetState.destroyed || targetState.autoFarmer || targetState.powerPlant || targetState.processingStation || targetPlot.disabled) {
            continue;
        }

        resolvedTargetPlotIndex = targetIndex;
        break;
    }

    if (resolvedTargetPlotIndex === null) {
        return { success: false, errorCode: 'NO_VALID_TARGET', errorMessage: 'No adjacent valid plot available.' };
    }

    preferredTargetPlotIndex = resolvedTargetPlotIndex;
    const targetPlot = plots[preferredTargetPlotIndex];

    const result = handleAdjacentPlotClickMk1(targetPlot, preferredTargetPlotIndex, {
        ignoreToolRequirement: true,
        countClick: true,
        playSfx: false,
        isAutoFarmerAction: true,
        seedTypeOverride: sourceState.autoFarmer.preferredSeedType ?? null,
    });

    if (result?.success) {
        return {
            success: true,
            errorCode: null,
            errorMessage: '',
            preferredTargetPlotIndex,
        };
    }

    return {
        success: false,
        errorCode: result?.errorCode || 'UNKNOWN_ERROR',
        errorMessage: result?.errorMessage || 'AutoFarmer could not work an adjacent plot.',
        preferredTargetPlotIndex,
    };
}

export { handlePlotClick, getPlotDisabledTime, buildPlotHoverText, syncPlotButtonPresentation, attemptAutoFarmerCycle };
