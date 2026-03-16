import { getState, updateState, incrementTotalClicks } from '../state.js';
import { updateCurrencyBar } from '../ui/currency.js';
import { getUpgradeValues } from '../ui/upgrades.js';
import { getCropConfig, getGrowthSymbol } from '../cropConfig.js';
import { playPlotBubbleForState, playAdjacentBubbleForState } from '../ui/sfx.js';
import { updateClicksDisplay } from '../ui/clicks.js';
import { TOOLS, WATERING_SYMBOLS, getRequiredToolForSymbol } from '../toolConfig.js';

const GRID_WIDTH = 9;

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

function handlePlotClick(plot, plotIndex) {
    const gameState = getState();
    const plotState = gameState.plotStates[plotIndex]; // Get the plot state object
    const currentSymbol = plotState.symbol;
    const selectedTool = getSelectedTool(gameState);
    const requiredTool = getRequiredToolForSymbol(currentSymbol);
    let didChange = false;

    if (requiredTool && selectedTool !== requiredTool) {
        alert(getWrongToolMessage(currentSymbol));
        return;
    }

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

            // Calculate the disabled time based on the number of plots
            const baseTime = 100;
            const initialDisableCoefficient = 1;
            const numPlots = document.getElementById('field').childElementCount;
            const coefficientIncrease = Math.floor(numPlots / 5) * 0.5;
            const plotDisableCoefficient = initialDisableCoefficient + coefficientIncrease;
            const disabledTime = baseTime * plotDisableCoefficient;

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

    // Apply expanded click effect if the upgrade has been purchased and enabled
    const upgradeValues = getUpgradeValues();

    if (upgradeValues.expandedClickMk1Purchased && upgradeValues.expandedClickMk1Enabled) {
        affectAdjacentPlotsMk1(plotIndex);
    }
    
    if (upgradeValues.expandedClickMk2Purchased && upgradeValues.expandedClickMk2Enabled) {
        affectAdjacentPlotsMk2(plotIndex);
    }
    
    if (upgradeValues.expandedClickMk3Purchased && upgradeValues.expandedClickMk3Enabled) {
        affectAdjacentPlotsMk3(plotIndex);
    }

    updateCurrencyBar(); // Update the currency display after any changes
}

// Function to affect adjacent plots if expanded click is enabled
function affectAdjacentPlotsMk1(index) {
    const field = document.getElementById('field');
    const plots = Array.from(field.children);

    // Affect the left plot if it exists and is not on the left edge
    if (index % GRID_WIDTH !== 0 && plots[index - 1]) {
        const leftPlot = plots[index - 1];
        const leftIndex = index - 1;
        if (!leftPlot.disabled) {
            handleAdjacentPlotClickMk1(leftPlot, leftIndex);
        }
    }

    // Affect the right plot if it exists and is not on the right edge
    if (index % GRID_WIDTH !== GRID_WIDTH - 1 && plots[index + 1]) {
        const rightPlot = plots[index + 1];
        const rightIndex = index + 1;
        if (!rightPlot.disabled) {
            handleAdjacentPlotClickMk1(rightPlot, rightIndex);
        }
    }
}

// Function to affect adjacent plots in cross pattern (Mk.2) - up, down, left, right
function affectAdjacentPlotsMk2(index) {
    const field = document.getElementById('field');
    const plots = Array.from(field.children);
    const totalPlots = plots.length;

    // Affect the left plot if it exists and is not on the left edge
    if (index % GRID_WIDTH !== 0 && plots[index - 1]) {
        const leftPlot = plots[index - 1];
        const leftIndex = index - 1;
        if (!leftPlot.disabled) {
            handleAdjacentPlotClickMk1(leftPlot, leftIndex);
        }
    }

    // Affect the right plot if it exists and is not on the right edge
    if (index % GRID_WIDTH !== GRID_WIDTH - 1 && plots[index + 1]) {
        const rightPlot = plots[index + 1];
        const rightIndex = index + 1;
        if (!rightPlot.disabled) {
            handleAdjacentPlotClickMk1(rightPlot, rightIndex);
        }
    }

    // Affect the plot above if it exists
    if (index >= GRID_WIDTH && plots[index - GRID_WIDTH]) {
        const topPlot = plots[index - GRID_WIDTH];
        const topIndex = index - GRID_WIDTH;
        if (!topPlot.disabled) {
            handleAdjacentPlotClickMk1(topPlot, topIndex);
        }
    }

    // Affect the plot below if it exists
    if (index + GRID_WIDTH < totalPlots && plots[index + GRID_WIDTH]) {
        const bottomPlot = plots[index + GRID_WIDTH];
        const bottomIndex = index + GRID_WIDTH;
        if (!bottomPlot.disabled) {
            handleAdjacentPlotClickMk1(bottomPlot, bottomIndex);
        }
    }
}

// Function to affect adjacent plots in 3x3 grid (Mk.3) - all 8 surrounding plots
function affectAdjacentPlotsMk3(index) {
    const field = document.getElementById('field');
    const plots = Array.from(field.children);
    const totalPlots = plots.length;
    const isLeftEdge = index % GRID_WIDTH === 0;
    const isRightEdge = index % GRID_WIDTH === GRID_WIDTH - 1;

    // Top-left
    if (index >= GRID_WIDTH && !isLeftEdge && plots[index - GRID_WIDTH - 1]) {
        const plot = plots[index - GRID_WIDTH - 1];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index - GRID_WIDTH - 1);
        }
    }

    // Top
    if (index >= GRID_WIDTH && plots[index - GRID_WIDTH]) {
        const plot = plots[index - GRID_WIDTH];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index - GRID_WIDTH);
        }
    }

    // Top-right
    if (index >= GRID_WIDTH && !isRightEdge && plots[index - GRID_WIDTH + 1]) {
        const plot = plots[index - GRID_WIDTH + 1];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index - GRID_WIDTH + 1);
        }
    }

    // Left
    if (!isLeftEdge && plots[index - 1]) {
        const plot = plots[index - 1];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index - 1);
        }
    }

    // Right
    if (!isRightEdge && plots[index + 1]) {
        const plot = plots[index + 1];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index + 1);
        }
    }

    // Bottom-left
    if (index + GRID_WIDTH < totalPlots && !isLeftEdge && plots[index + GRID_WIDTH - 1]) {
        const plot = plots[index + GRID_WIDTH - 1];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index + GRID_WIDTH - 1);
        }
    }

    // Bottom
    if (index + GRID_WIDTH < totalPlots && plots[index + GRID_WIDTH]) {
        const plot = plots[index + GRID_WIDTH];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index + GRID_WIDTH);
        }
    }

    // Bottom-right
    if (index + GRID_WIDTH < totalPlots && !isRightEdge && plots[index + GRID_WIDTH + 1]) {
        const plot = plots[index + GRID_WIDTH + 1];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index + GRID_WIDTH + 1);
        }
    }
}

// Function to handle click on adjacent plots
function handleAdjacentPlotClickMk1(plot, plotIndex) {
    const gameState = getState();
    const plotState = gameState.plotStates[plotIndex];
    const currentSymbol = plotState.symbol;
    const selectedTool = getSelectedTool(gameState);
    const requiredTool = getRequiredToolForSymbol(currentSymbol);
    let didChange = false;

    if (requiredTool && selectedTool !== requiredTool) {
        return;
    }

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

            const numPlots = document.getElementById('field').childElementCount;
            const disabledTime =  baseTime * Math.pow(1.5, Math.floor(numPlots / 3));

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

    // Update the game state with modified plot states
    updateState({ plotStates: gameState.plotStates });
    updateCurrencyBar();
}

export { handlePlotClick };
