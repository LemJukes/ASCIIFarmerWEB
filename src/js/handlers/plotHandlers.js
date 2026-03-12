import { getState, updateState } from '../state.js';
import { updateCurrencyBar } from '../ui/currency.js';
import { getUpgradeValues } from '../ui/upgrades.js';
import { getCropConfig, getGrowthSymbol } from '../cropConfig.js';

function handlePlotClick(plot, plotIndex) {
    const gameState = getState();
    const plotState = gameState.plotStates[plotIndex]; // Get the plot state object
    const currentSymbol = plotState.symbol;

    switch (currentSymbol) {
        case '~': // Untilled
            // Tilling the plot requires no cost
            plotState.symbol = '=';
            plot.textContent = '=';
            break;
            
        case '=': // Tilled
            // Check which crop type to plant based on available seeds
            let selectedCropType = null;
            
            if (gameState.wheatSeeds >= 1) {
                selectedCropType = 'wheat';
                updateState({ wheatSeeds: gameState.wheatSeeds - 1 });
            } else if (gameState.cornSeeds >= 1) {
                selectedCropType = 'corn';
                updateState({ cornSeeds: gameState.cornSeeds - 1 });
            } else if (gameState.tomatoSeeds >= 1) {
                selectedCropType = 'tomato';
                updateState({ tomatoSeeds: gameState.tomatoSeeds - 1 });
            } else {
                alert("Not enough seeds!");
                return;
            }
            
            plotState.symbol = '.';
            plotState.cropType = selectedCropType;
            plotState.waterCount = 0;
            plot.textContent = '.';
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
            } else {
                alert("Not enough water!");
            }
            break;
            
        case '¥': // Grown wheat
        case '₡': // Grown corn
        case '₮': // Grown tomato
            // Harvesting the crop
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
            
            // Reset plot
            plotState.symbol = '~';
            plotState.cropType = null;
            plotState.waterCount = 0;
            plot.textContent = '~';
            plot.disabled = true;

            // Calculate the disabled time based on the number of plots
            const baseTime = 1500;
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
    if (index % 10 !== 0 && plots[index - 1]) {
        const leftPlot = plots[index - 1];
        const leftIndex = index - 1;
        if (!leftPlot.disabled) {
            handleAdjacentPlotClickMk1(leftPlot, leftIndex);
        }
    }

    // Affect the right plot if it exists and is not on the right edge
    if (index % 10 !== 9 && plots[index + 1]) {
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
    if (index % 10 !== 0 && plots[index - 1]) {
        const leftPlot = plots[index - 1];
        const leftIndex = index - 1;
        if (!leftPlot.disabled) {
            handleAdjacentPlotClickMk1(leftPlot, leftIndex);
        }
    }

    // Affect the right plot if it exists and is not on the right edge
    if (index % 10 !== 9 && plots[index + 1]) {
        const rightPlot = plots[index + 1];
        const rightIndex = index + 1;
        if (!rightPlot.disabled) {
            handleAdjacentPlotClickMk1(rightPlot, rightIndex);
        }
    }

    // Affect the plot above if it exists
    if (index >= 10 && plots[index - 10]) {
        const topPlot = plots[index - 10];
        const topIndex = index - 10;
        if (!topPlot.disabled) {
            handleAdjacentPlotClickMk1(topPlot, topIndex);
        }
    }

    // Affect the plot below if it exists
    if (index + 10 < totalPlots && plots[index + 10]) {
        const bottomPlot = plots[index + 10];
        const bottomIndex = index + 10;
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
    const isLeftEdge = index % 10 === 0;
    const isRightEdge = index % 10 === 9;

    // Top-left
    if (index >= 10 && !isLeftEdge && plots[index - 11]) {
        const plot = plots[index - 11];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index - 11);
        }
    }

    // Top
    if (index >= 10 && plots[index - 10]) {
        const plot = plots[index - 10];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index - 10);
        }
    }

    // Top-right
    if (index >= 10 && !isRightEdge && plots[index - 9]) {
        const plot = plots[index - 9];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index - 9);
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
    if (index + 10 < totalPlots && !isLeftEdge && plots[index + 9]) {
        const plot = plots[index + 9];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index + 9);
        }
    }

    // Bottom
    if (index + 10 < totalPlots && plots[index + 10]) {
        const plot = plots[index + 10];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index + 10);
        }
    }

    // Bottom-right
    if (index + 10 < totalPlots && !isRightEdge && plots[index + 11]) {
        const plot = plots[index + 11];
        if (!plot.disabled) {
            handleAdjacentPlotClickMk1(plot, index + 11);
        }
    }
}

// Function to handle click on adjacent plots
function handleAdjacentPlotClickMk1(plot, plotIndex) {
    const gameState = getState();
    const plotState = gameState.plotStates[plotIndex];
    const currentSymbol = plotState.symbol;

    switch (currentSymbol) {
        case '~': // Untilled
            plotState.symbol = '=';
            plot.textContent = '=';
            break;
            
        case '=': // Tilled
            // Plant if seeds available (prioritize wheat for adjacent plots)
            let selectedCropType = null;
            
            if (gameState.wheatSeeds >= 1) {
                selectedCropType = 'wheat';
                updateState({ wheatSeeds: gameState.wheatSeeds - 1 });
            } else if (gameState.cornSeeds >= 1) {
                selectedCropType = 'corn';
                updateState({ cornSeeds: gameState.cornSeeds - 1 });
            } else if (gameState.tomatoSeeds >= 1) {
                selectedCropType = 'tomato';
                updateState({ tomatoSeeds: gameState.tomatoSeeds - 1 });
            } else {
                return; // No seeds available, skip
            }
            
            plotState.symbol = '.';
            plotState.cropType = selectedCropType;
            plotState.waterCount = 0;
            plot.textContent = '.';
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
            }
            break;
            
        case '¥': // Grown wheat
        case '₡': // Grown corn
        case '₮': // Grown tomato
            // Harvest the crop
            const cropType = plotState.cropType;
            if (cropType === 'wheat') {
                updateState({ wheat: gameState.wheat + 1 });
            } else if (cropType === 'corn') {
                updateState({ corn: gameState.corn + 1 });
            } else if (cropType === 'tomato') {
                updateState({ tomato: gameState.tomato + 1 });
            }
            
            updateState({ crops: gameState.crops + 1 });
            
            // Reset plot
            plotState.symbol = '~';
            plotState.cropType = null;
            plotState.waterCount = 0;
            plot.textContent = '~';
            plot.disabled = true;

            const numPlots = document.getElementById('field').childElementCount;
            const disabledTime =  1500 * Math.pow(1.5, Math.floor(numPlots / 3));

            setTimeout(() => {
                plot.disabled = false;
            }, disabledTime);
            break;
            
        default:
            break;
    }

    // Update the game state with modified plot states
    updateState({ plotStates: gameState.plotStates });
    updateCurrencyBar();
}

export { handlePlotClick };
