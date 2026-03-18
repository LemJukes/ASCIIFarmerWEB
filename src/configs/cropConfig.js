// cropConfig.js
// Configuration for different crop types

const cropTypes = {
    wheat: {
        id: 'wheat',
        name: 'Wheat',
        symbol: '¥',
        waterStages: 3,
        salePrice: 2,
        seedCost: 1
    },
    corn: {
        id: 'corn',
        name: 'Corn',
        symbol: '₡',
        waterStages: 4,
        salePrice: 5,
        seedCost: 3
    },
    tomato: {
        id: 'tomato',
        name: 'Tomato',
        symbol: '₮',
        waterStages: 5,
        salePrice: 8,
        seedCost: 5
    }
};

// Helper function to get growth symbol based on water count
// Growth cycles through: / → | → \ → repeat
function getGrowthSymbol(waterCount) {
    const symbols = ['/', '|', '\\'];
    return symbols[waterCount % 3];
}

function getCropConfig(cropId) {
    return cropTypes[cropId];
}

function getAllCropTypes() {
    return Object.values(cropTypes);
}

export { cropTypes, getGrowthSymbol, getCropConfig, getAllCropTypes };
