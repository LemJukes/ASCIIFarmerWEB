//state.js
import { savePartialSnapshot } from "./persistence.js";

const initialGameState = {
    // Player Currency Values
    coins: 0,
    seeds: 1, // Generic seeds (kept for backward compatibility)
    crops: 0, // Generic crops (kept for backward compatibility)
    water: 10,

    // Crop-Specific Seeds
    wheatSeeds: 5, // Start with some wheat seeds
    cornSeeds: 0,
    tomatoSeeds: 0,

    // Crop-Specific Inventory
    wheat: 0,
    corn: 0,
    tomato: 0,

    // Field Information
    plots: 1,
    plotDisableCoefficient: 1.15, // Coefficient used to calculate plot disable time
    plotStates: [], // Array to store plot state objects: {symbol, cropType, waterCount}

    // Crop Unlock Tracking
    totalCoinsSpent: 0,   // Total coins spent (for unlocking crops)
    cornUnlocked: false,  // Corn unlocks at 50 coins spent
    tomatoUnlocked: false, // Tomato unlocks at 100 coins spent

    // Game Progress Information
    totalCoinsEarned: 0,      // Total number of coins the player has earned throughout the game
    cropsSold: 0,             // Total number of crops sold by the player (all types combined)
    wheatSold: 0,             // Total wheat sold
    cornSold: 0,              // Total corn sold
    tomatoSold: 0,            // Total tomatoes sold
    seedsBought: 0,           // Total number of seeds bought by the player
    waterRefillsPurchased: 0, // Total number of times the player has clicked the water refil button

    // Upgrade Values
    // Water Upgrade Values:
    waterCapacity: 10,

    // Tool Selection
    selectedTool: 'Plow',
    selectedSeedType: 'wheat',

    achievementsUnlocked: [],   // Array to store the achievements the player has unlocked

}

const gameState = { ...initialGameState };

function getState() {
    return { ...gameState };
}

function getStateSnapshot() {
    return {
        ...gameState,
        plotStates: Array.isArray(gameState.plotStates)
            ? gameState.plotStates.map(plot => ({
                symbol: plot?.symbol ?? '~',
                cropType: plot?.cropType ?? null,
                waterCount: Number(plot?.waterCount) || 0,
            }))
            : [],
        achievementsUnlocked: Array.isArray(gameState.achievementsUnlocked)
            ? [...gameState.achievementsUnlocked]
            : [],
    };
}

function applyStateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return;
    }

    const merged = { ...initialGameState };

    for (const key of Object.keys(initialGameState)) {
        if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
            merged[key] = snapshot[key];
        }
    }

    const normalizedPlotStates = Array.isArray(merged.plotStates)
        ? merged.plotStates.map(plot => ({
            symbol: plot?.symbol ?? '~',
            cropType: plot?.cropType ?? null,
            waterCount: Number(plot?.waterCount) || 0,
        }))
        : [];

    const normalizedAchievements = Array.isArray(merged.achievementsUnlocked)
        ? [...merged.achievementsUnlocked]
        : [];

    Object.assign(gameState, merged, {
        plotStates: normalizedPlotStates,
        achievementsUnlocked: normalizedAchievements,
    });
}

function updateState(updates) {
    Object.assign(gameState, updates);
    savePartialSnapshot({ gameState: getStateSnapshot() });
}

function logGameState() {
    const gameState = getState();
    console.log('Game State:', gameState);
}

export { getState, getStateSnapshot, applyStateSnapshot, updateState, logGameState, gameState };