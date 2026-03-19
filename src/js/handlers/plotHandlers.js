import { getState, updateState, incrementTotalClicks } from '../state.js';
import { updateCurrencyBar } from '../ui/currency.js';
import { getUpgradeValues, updateUpgradeValues, renderClickUpgradesSection } from '../ui/upgrades.js';
import { getCropConfig, getGrowthSymbol } from '../../configs/cropConfig.js';
import { progressionConfig } from '../../configs/progressionConfig.js';
import { playPlotBubbleForState, playAdjacentBubbleForState } from '../ui/sfx.js';
import { updateClicksDisplay } from '../ui/clicks.js';
import { updateToolboxDisplay } from '../ui/toolbox.js';
import { TOOLS, WATERING_SYMBOLS, HARVEST_SYMBOLS, getRequiredToolForSymbol } from '../../configs/toolConfig.js';

const GRID_WIDTH = 9;
const OUT_OF_CHARGES_MESSAGE = 'Auto-Changer is out of charges. Buy more charges in Upgrades.';
const EXPANDED_CLICK_LEVEL_DELAY_MS = 100;
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

function getPlotDisabledTime() {
    const { fallowTime } = progressionConfig.storeEconomy.plot;
    const ownedPlots = getState().plots;
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

function resolveToolSelection(currentSymbol, showFailureAlert) {
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
            alert(getWrongToolMessage(currentSymbol));
        }

        return {
            allowed: false,
            gameState,
            selectedTool,
        };
    }

    if (upgradeValues.toolAutoChangerCharges < 1) {
        if (showFailureAlert) {
            alert(OUT_OF_CHARGES_MESSAGE);
        }

        return {
            allowed: false,
            gameState,
            selectedTool,
        };
    }

    updateUpgradeValues({ toolAutoChangerCharges: upgradeValues.toolAutoChangerCharges - 1 });
    updateState({ selectedTool: requiredTool });
    updateToolboxDisplay();
    renderClickUpgradesSection();

    return {
        allowed: true,
        gameState: { ...gameState, selectedTool: requiredTool },
        selectedTool: requiredTool,
    };
}

function handlePlotClick(plot, plotIndex) {
    const toolSelection = resolveToolSelection(getState().plotStates[plotIndex].symbol, true);
    if (!toolSelection.allowed) {
        return;
    }

    const gameState = toolSelection.gameState;
    const plotState = gameState.plotStates[plotIndex]; // Get the plot state object
    const currentSymbol = plotState.symbol;
    const selectedTool = toolSelection.selectedTool;
    let didChange = false;

    switch (currentSymbol) {
        case '~': // Untilled
            // Tilling the plot requires no cost
            plotState.symbol = '=';
            plot.textContent = '=';
            didChange = true;
            break;
            
        case '=': // Tilled
            const selectedSeedType = getSelectedSeedType(gameState);
            const selectedSeedInventoryKey = getSeedInventoryKey(selectedSeedType);

            if (gameState[selectedSeedInventoryKey] < 1) {
                alert(`Not enough ${selectedSeedType} seeds!`);
                return;
            }
            
            updateState({ [selectedSeedInventoryKey]: gameState[selectedSeedInventoryKey] - 1 });
            
            plotState.symbol = '.';
            plotState.cropType = selectedSeedType;
            plotState.waterCount = 0;
            plot.textContent = '.';
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
                    plot.textContent = cropConfig.symbol;
                } else {
                    // Show oscillating growth symbol
                    plotState.symbol = getGrowthSymbol(plotState.waterCount - 1);
                    plot.textContent = plotState.symbol;
                }

                didChange = true;
            } else {
                alert("Not enough water!");
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
                alert('Harvest missed! Select the Scythe to guarantee harvests.');
            }
            
            // Reset plot
            plotState.symbol = '~';
            plotState.cropType = null;
            plotState.waterCount = 0;
            plot.textContent = '~';
            plot.disabled = true;
            didChange = true;

            const disabledTime = getPlotDisabledTime();

            // Re-enable the button after the calculated disabled time
            setTimeout(() => {
                plot.disabled = false;
            }, disabledTime);
            break;
            
        default:
            console.warn(`Unknown plot symbol: ${currentSymbol}`);
            break;
    }

    if (!didChange) {
        return;
    }

    playPlotBubbleForState(currentSymbol);
    incrementTotalClicks();
    updateClicksDisplay();

    // Update the game state with modified plot states
    updateState({ plotStates: gameState.plotStates });

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
        updateCurrencyBar();
        return;
    }

    expandedClickActivations.forEach((activateLevel, levelIndex) => {
        setTimeout(() => {
            activateLevel();

            if (levelIndex === expandedClickActivations.length - 1) {
                updateCurrencyBar();
            }
        }, levelIndex * EXPANDED_CLICK_LEVEL_DELAY_MS);
    });
}

function applyExpandedClickPattern(index, offsets) {
    const field = document.getElementById('field');
    const plots = Array.from(field.children);
    const originRow = Math.floor(index / GRID_WIDTH);
    const originCol = index % GRID_WIDTH;

    offsets.forEach(([rowOffset, colOffset]) => {
        const targetRow = originRow + rowOffset;
        const targetCol = originCol + colOffset;

        if (targetRow < 0 || targetRow >= GRID_WIDTH || targetCol < 0 || targetCol >= GRID_WIDTH) {
            return;
        }

        const targetIndex = (targetRow * GRID_WIDTH) + targetCol;
        const targetPlot = plots[targetIndex];

        if (!targetPlot || targetPlot.disabled) {
            return;
        }

        handleAdjacentPlotClickMk1(targetPlot, targetIndex);
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
function handleAdjacentPlotClickMk1(plot, plotIndex) {
    const toolSelection = resolveToolSelection(getState().plotStates[plotIndex].symbol, false);
    if (!toolSelection.allowed) {
        return;
    }

    const gameState = toolSelection.gameState;
    const plotState = gameState.plotStates[plotIndex];
    const currentSymbol = plotState.symbol;
    const selectedTool = toolSelection.selectedTool;
    let didChange = false;

    switch (currentSymbol) {
        case '~': // Untilled
            plotState.symbol = '=';
            plot.textContent = '=';
            didChange = true;
            break;
            
        case '=': // Tilled
            const selectedSeedType = getSelectedSeedType(gameState);
            const selectedSeedInventoryKey = getSeedInventoryKey(selectedSeedType);

            if (gameState[selectedSeedInventoryKey] < 1) {
                return;
            }
            
            updateState({ [selectedSeedInventoryKey]: gameState[selectedSeedInventoryKey] - 1 });
            
            plotState.symbol = '.';
            plotState.cropType = selectedSeedType;
            plotState.waterCount = 0;
            plot.textContent = '.';
            didChange = true;
            break;
            
        case '.': // Planted - start watering
        case '/': // Growing stages
        case '|':
        case '\\':
            if (!plotState.cropType) {
                return;
            }
            
            if (gameState.water >= 1) {
                const cropConfig = getCropConfig(plotState.cropType);
                plotState.waterCount++;
                updateState({ water: gameState.water - 1 });
                
                // Check if crop is fully grown (use > not >= to show all growth stages)
                if (plotState.waterCount > cropConfig.waterStages) {
                    plotState.symbol = cropConfig.symbol;
                    plot.textContent = cropConfig.symbol;
                } else {
                    // Show oscillating growth symbol
                    plotState.symbol = getGrowthSymbol(plotState.waterCount - 1);
                    plot.textContent = plotState.symbol;
                }

                didChange = true;
            }
            break;
            
        case '¥': // Grown wheat
        case '₡': // Grown corn
        case '₮': // Grown tomato
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

                updateState({ crops: gameState.crops + 1 });
            }
            
            // Reset plot
            plotState.symbol = '~';
            plotState.cropType = null;
            plotState.waterCount = 0;
            plot.textContent = '~';
            plot.disabled = true;
            didChange = true;

            const disabledTime = getPlotDisabledTime();

            setTimeout(() => {
                plot.disabled = false;
            }, disabledTime);
            break;
            
        default:
            break;
    }

    if (!didChange) {
        return;
    }

    playAdjacentBubbleForState(currentSymbol);
    incrementTotalClicks();
    updateClicksDisplay();

    // Update the game state with modified plot states
    updateState({ plotStates: gameState.plotStates });
    updateCurrencyBar();
}

export { handlePlotClick };
