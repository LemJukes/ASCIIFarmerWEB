//state.js
const gameState = {
    // Player Currency Values
    coins: 10,
    seeds: 1,
    crops: 1,
    water: 10,

    // Field Information
    plots: 1,
    plotDisableCoefficient: 1.25, // Coefficient used to calculate plot disable time

    // Game Progress Information
    totalCoinsEarned: 0,      // Total number of coins the player has earned throughout the game
    cropsSold: 0,             // Total number of crops sold by the player
    seedsBought: 0,           // Total number of seeds bought by the player
    waterRefillsPurchased: 0, // Total number of times the player has clicked the water refil button

    // Upgrade Values
    // Water Upgrade Values:
    waterCapacity: 10,

    milestonesAchieved: [],   // Array to store the milestones the player has achieved

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