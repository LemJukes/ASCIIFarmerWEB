const questDefinitions = [
    {
        id: 'produce-for-gigagrocery',
        name: 'Produce for GigaGrocery!',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says one of the agri-cyber buying syndicates just forwarded a produce request. GigaGrocery wants a starter assortment for its pilot aisle refresh, and they are willing to pay a premium if you can send the harvest straight to their intake bots.`,
        requirements: {
            wheat: 5,
            corn: 5,
            tomato: 5,
        },
        unlockCondition: {
            type: 'cropsSold',
            requirements: {
                wheat: 1,
                corn: 1,
                tomato: 1,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'root-66-diner-classics-run',
        name: 'Root 66 Diner Classics Run',
        issuer: 'Root 66 Diner',
        flavorText: `farmr says Root 66 Diner just sent over a starter ticket for all access to all the classics. They need a little of everything for the lunch rush, and they will pay premium rates if the produce goes straight from your field to their prep line.`,
        requirements: {
            wheat: 5,
            corn: 5,
            tomato: 5,
        },
        unlockCondition: {
            type: 'cropsSold',
            requirements: {
                wheat: 3,
                corn: 3,
                tomato: 3,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'open-source-organics-shared-crate',
        name: 'Open Source Organics Shared Crate',
        issuer: 'Open Source Organics',
        flavorText: `farmr says Open Source Organics posted a co-op request: "From our open soil, to your open table." They are building community meal boxes and want a steady pair of staple crops to keep distribution simple this cycle.`,
        requirements: {
            wheat: 8,
            corn: 6,
            tomato: 0,
        },
        unlockCondition: {
            type: 'cropsSold',
            requirements: {
                wheat: 6,
                corn: 5,
                tomato: 4,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'git-grocer-branch-out',
        name: 'Git Grocer: Branch Out',
        issuer: 'Git Grocer',
        flavorText: `farmr says Git Grocer pinged the network with a clean message: "branch out." They are rolling out a fresh produce branch and want mostly corn with a tomato side-load for their first wave.`,
        requirements: {
            wheat: 0,
            corn: 10,
            tomato: 6,
        },
        unlockCondition: {
            type: 'cropsSold',
            requirements: {
                wheat: 8,
                corn: 8,
                tomato: 4,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'cache-harvest-hotel-house-stock',
        name: 'Cache & Harvest Hotel House Stock',
        issuer: 'Cache & Harvest Hotel',
        flavorText: `farmr says the Cache & Harvest Hotel needs a quiet bulk restock for its guests: "rest, refresh, reload." This order is focused and heavy on wheat for bread service in every room tier.`,
        requirements: {
            wheat: 12,
            corn: 0,
            tomato: 0,
        },
        unlockCondition: {
            type: 'cropsSold',
            requirements: {
                wheat: 12,
                corn: 8,
                tomato: 6,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'async-buffet-service-window',
        name: 'The Async Buffet Service Window',
        issuer: 'The Async Buffet',
        flavorText: `farmr says The Async Buffet opened a new timed service lane with one rule: "food, when it's ready." They want a balanced but larger mixed delivery so every tray can be filled the moment the queue clears.`,
        requirements: {
            wheat: 6,
            corn: 8,
            tomato: 10,
        },
        unlockCondition: {
            type: 'cropsSold',
            requirements: {
                wheat: 15,
                corn: 12,
                tomato: 10,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
];

function getQuestDefinitions() {
    return questDefinitions.map((quest, index) => ({
        ...quest,
        questNumber: index + 1,
        requirements: { ...quest.requirements },
        unlockCondition: quest.unlockCondition
            ? {
                ...quest.unlockCondition,
                requirements: { ...(quest.unlockCondition.requirements || {}) },
            }
            : null,
        reward: quest.reward ? { ...quest.reward } : null,
    }));
}

function getQuestDefinitionById(questId) {
    return getQuestDefinitions().find((quest) => quest.id === questId) || null;
}

export { getQuestDefinitions, getQuestDefinitionById };