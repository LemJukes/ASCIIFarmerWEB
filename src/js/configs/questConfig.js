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