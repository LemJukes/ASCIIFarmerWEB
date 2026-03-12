//state.js
const gameState = {
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

    achievementsUnlocked: [],   // Array to store the achievements the player has unlocked

}

function getState() {
    return { ...gameState };
}

function updateState(updates) {
    Object.assign(gameState, updates);
}

function logGameState() {
    const gameState = getState();
    console.log('Game State:', gameState);
}

export { getState, updateState, logGameState, gameState };