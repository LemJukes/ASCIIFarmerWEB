import { getState, updateState } from '../state.js';
import { updateCurrencyBar } from '../ui/currency.js';
import { getUpgradeValues } from '../ui/upgrades.js';

function handlePlotClick(plot) {
    const gameState = getState();
    const plotState = plot.textContent; // Get the current state of the clicked plot
    const plotIndex = Array.from(document.getElementById('field').children).indexOf(plot); // Get the index of the clicked plot

    switch (plotState) {
        case '~': // Untilled
            // Tilling the plot requires no cost
            plot.textContent = '=';
            break;
        case '=': // Tilled
            if (gameState.seeds >= 1) {
                plot.textContent = '.';
                updateState({ seeds: gameState.seeds - 1 }); // Planting a seed costs 1 seed
            } else {
                alert("Not enough seeds!");
            }
            break;
        case '.': // Planted
            if (gameState.water >= 1) {
                plot.textContent = '/';
                updateState({ water: gameState.water - 1 }); // Watering the planted seed costs 1 water
            } else {
                alert("Not enough water!");
            }
            break;
        case '/': // Growing1
            if (gameState.water >= 1) {
                plot.textContent = '|';
                updateState({ water: gameState.water - 1 }); // Watering the growing crop costs 1 water
            } else {
                alert("Not enough water!");
            }
            break;
        case '|': // Growing2
            if (gameState.water >= 1) {
                plot.textContent = '\\';
                updateState({ water: gameState.water - 1 }); // Watering the growing crop costs 1 water
            } else {
                alert("Not enough water!");
            }
            break;
        case '\\': // Growing3
            // Final growth stage requires no additional cost
            plot.textContent = '¥';
            break;
        case '¥': // Grown
            // Harvesting the crop
            plot.textContent = '~'; // Reset plot to Untilled state
            updateState({ crops: gameState.crops + 1 }); // Increment the number of harvested crops
            plot.disabled = true; // Disable the button temporarily

            // Calculate the disabled time based on the number of plots
            const baseTime = 3000;
            const initialDisableCoefficient = 1
            const numPlots = document.getElementById('field').childElementCount;

            const coefficientIncrease = Math.floor(numPlots / 5) * 0.5;
            console.log(coefficientIncrease);
            const plotDisableCoefficient = initialDisableCoefficient + coefficientIncrease;

            const disabledTime = baseTime * plotDisableCoefficient;
            console.log(disabledTime);

            // Re-enable the button after the calculated disabled time
            setTimeout(() => {
                plot.disabled = false;
            }, disabledTime);
            break;
        default:
            break;
    }

    // Apply expanded click effect if the upgrade has been purchased and enabled
    const upgradeValues = getUpgradeValues();
    console.log(`expandedClickMk1Purchased: ${upgradeValues.expandedClickMk1Purchased}`);
    console.log(`expandedClickMk1Enabled: ${upgradeValues.expandedClickMk1Enabled}`);

    if (upgradeValues.expandedClickMk1Purchased && upgradeValues.expandedClickMk1Enabled) {
        console.log(`Calling affectAdjacentPlotsMk1 for plotIndex: ${plotIndex}`);
        affectAdjacentPlotsMk1(plotIndex);
    }

    updateCurrencyBar(); // Update the currency display after any changes
}

// Function to affect adjacent plots if expanded click is enabled
function affectAdjacentPlotsMk1(index) {
    const field = document.getElementById('field');
    const plots = Array.from(field.children);

    // Affect the left plot if it exists and is not on the left edge
    if (index % 10 !== 0) {
        const leftPlot = plots[index - 1];
        if (!leftPlot.disabled) {
            handleAdjacentPlotClickMk1(leftPlot);
        }
    }

    // Affect the right plot if it exists and is not on the right edge
    if (index % 10 !== 9) {
        const rightPlot = plots[index + 1];
        if (!rightPlot.disabled) {
            handleAdjacentPlotClickMk1(rightPlot);
        }
    }
}

// Function to handle click on adjacent plots
function handleAdjacentPlotClickMk1(plot) {
    const gameState = getState();
    const plotState = plot.textContent;

    switch (plotState) {
        case '~': // Untilled
            plot.textContent = '=';
            break;
        case '=': // Tilled
            if (gameState.seeds >= 1) {
                plot.textContent = '.';
                updateState({ seeds: gameState.seeds - 1 }); // Planting a seed costs 1 seed
            }
            break;
        case '.': // Planted
            if (gameState.water >= 1) {
                plot.textContent = '/';
                updateState({ water: gameState.water - 1 }); // Watering the planted seed costs 1 water
            }
            break;
        case '/': // Growing1
            if (gameState.water >= 1) {
                plot.textContent = '|';
                updateState({ water: gameState.water - 1 }); // Watering the growing crop costs 1 water
            }
            break;
        case '|': // Growing2
            if (gameState.water >= 1) {
                plot.textContent = '\\';
                updateState({ water: gameState.water - 1 }); // Watering the growing crop costs 1 water
            }
            break;
        case '\\': // Growing3
            plot.textContent = '¥';
            break;
        case '¥': // Grown
            plot.textContent = '~'; // Reset plot to Untilled state
            updateState({ crops: gameState.crops + 1 }); // Increment the number of harvested crops
            plot.disabled = true; // Disable the button temporarily

            // Calculate the disabled time based on the number of plots
            const numPlots = document.getElementById('field').childElementCount;
            const disabledTime = 3000 * Math.pow(1.5, Math.floor(numPlots / 3));

            // Re-enable the button after the calculated disabled time
            setTimeout(() => {
                plot.disabled = false;
            }, disabledTime);
            break;
        default:
            break;
    }

    updateCurrencyBar(); // Update the currency display after any changes
}

export { handlePlotClick };
