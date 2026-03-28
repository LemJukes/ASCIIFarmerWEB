const progressionConfig = {
    achievements: {
        totalCoinsSpent: [80, 240, 700, 2000],
        totalCoinsEarned: [20, 90, 260, 700, 1600],
        waterRefillsPurchased: [4, 12, 28],
        seedsBought: {
            wheat: [15, 50, 140],
            corn: [10, 35, 100],
            tomato: [8, 25, 70],
        },
        cropsSold: {
            wheat: [12, 40, 120],
            corn: [9, 30, 85],
            tomato: [7, 22, 60],
        },
    },
    unlocks: {
        cropsByTotalCoinsEarned: {
            corn: 250,
            tomato: 500,
        },
        fieldsBySpendAndFirstFieldPlots: {
            coinsSpent: 100000,
            firstFieldRequiredPlots: 81,
        },
        upgradeSections: {
            waterUpgradesByWaterRefills: 4,
            clickUpgradesByCoinsEarned: 20,
        },
        expandedClickByCoinsSpent: {
            mk1: 240,
            mk2: 700,
            mk3: 2000,
            mk4: 6000,
            mk5: 18000,
            mk6: 54000,
        },
        toolAutoChangerChargePacksByCoinsEarned: {
            pack100: 90,
            pack500: 260,
            pack1000: 700,
        },
        waterAutoBuyerByWaterRefills: 50,
    },
    storeEconomy: {
        seedCosts: {
            wheat: 1,
            corn: 4,
            tomato: 9,
        },
        sellPrices: {
            wheat: 2,
            corn: 7,
            tomato: 16,
        },
        water: {
            cost: 1,
            quantity: 10,
            autoBuyer: {
                triggerBelow: 5,
                surchargeMultiplier: 1.1,
                tickMs: 500,
            },
        },
        plot: {
            baseCost: 10,
            scalingStartPlotCount: 9,
            scalingMultiplier: 1.06,
            fallowTime: {
                minPlotCount: 3,
                maxPlotCount: 81,
                minDurationMs: 250,
                maxDurationMs: 30000,
            },
        },
        fieldPurchase: {
            baseCost: 1000,
            costIncreasePerField: 1000,
        },
    },
    upgradesEconomy: {
        waterCapacity: {
            baseCost: 35,
            scalingMultiplier: 1.06,
            capacityIncrease: 10,
        },
        expandedClick: {
            mk1Cost: 140,
            mk2Cost: 600,
            mk3Cost: 1800,
            mk4Cost: 5400,
            mk5Cost: 16200,
            mk6Cost: 48600,
        },
        toolAutoChanger: {
            baseCost: 90,
            chargePackCosts: {
                pack100: 30,
                pack500: 115,
                pack1000: 210,
            },
        },
    },
    bulkTiers: {
        seedPacks: [
            { quantity: 5, discountMultiplier: 0.9 },
            { quantity: 15, discountMultiplier: 0.8 },
            { quantity: 30, discountMultiplier: 0.72 },
        ],
        cropSales: [
            { quantity: 5, bonusPercent: 8 },
            { quantity: 15, bonusPercent: 18 },
            { quantity: 30, bonusPercent: 30 },
        ],
        waterRefills: [
            { quantity: 30, costMultiplier: 0.95 },
            { quantity: 80, costMultiplier: 0.85 },
            { quantity: 160, costMultiplier: 0.75 },
        ],
    },
};

function getAchievementValues() {
    return {
        totalCoinsSpent: [...progressionConfig.achievements.totalCoinsSpent],
        totalCoinsEarned: [...progressionConfig.achievements.totalCoinsEarned],
        waterRefillsPurchased: [...progressionConfig.achievements.waterRefillsPurchased],
        wheatSeedsBought: [...progressionConfig.achievements.seedsBought.wheat],
        cornSeedsBought: [...progressionConfig.achievements.seedsBought.corn],
        tomatoSeedsBought: [...progressionConfig.achievements.seedsBought.tomato],
        wheatSold: [...progressionConfig.achievements.cropsSold.wheat],
        cornSold: [...progressionConfig.achievements.cropsSold.corn],
        tomatoSold: [...progressionConfig.achievements.cropsSold.tomato],
    };
}

export { progressionConfig, getAchievementValues };
