const questDefinitions = [
    {
        id: 'produce-for-gigagrocery',
        name: 'Produce for GigaGrocery!',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says one of the agri-cyber buying syndicates just forwarded a produce request. GigaGrocery wants a starter assortment for its pilot aisle refresh, and they are willing to pay a premium if you can send the harvest straight to their intake bots.`,
        requirements: {
            wheat: 1,
            corn: 1,
            tomato: 1,
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
        flavorText: `farmr says Root 66 Diner just sent over a starter ticket for all access to all the classics. They need a some of everything for the lunch rush, and they will pay premium rates if the produce goes straight from your field to their prep line.`,
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
    {
        id: 'plot-reclamation-and-salvage-contract',
        name: 'Plot Reclamation & Salvage Contract',
        issuer: 'Urban Grid Reclamation Union',
        flavorText: `farmr says the reclamation crews need help clearing derelict soil tiles and recovering parts. Deliver a broad harvest and they will authorize your yard crew to safely destroy and restore plot shells.` ,
        requirements: {
            wheat: 10,
            corn: 12,
            tomato: 10,
        },
        unlockCondition: {
            type: 'cropsSold',
            requirements: {
                wheat: 20,
                corn: 18,
                tomato: 15,
            },
        },
        reward: {
            type: 'unlockDestroyRestorePlot',
            description: 'Unlocks Destroy Plot and Restore Plot in the store',
        },
    },
    {
        id: 'autofarmer-assembly-license',
        name: 'AutoFarmer Assembly License',
        issuer: 'Automata Licensing Bureau',
        flavorText: `farmr says the bureau approved a provisional assembler test, but only for operators who can keep delivery cadence stable. Complete this shipment and they will issue your Build AutoFarmer permit.` ,
        requirements: {
            wheat: 14,
            corn: 14,
            tomato: 14,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'plot-reclamation-and-salvage-contract',
            requirements: {
                wheat: 28,
                corn: 24,
                tomato: 22,
            },
        },
        reward: {
            type: 'unlockAutoFarmer',
            description: 'Unlocks Build AutoFarmer in the store',
        },
    },
    {
        id: 'autofarmer-field-operations-review',
        name: 'AutoFarmer Field Operations Review',
        issuer: 'Automata Licensing Bureau',
        flavorText: `farmr says the bureau wants to verify your AutoFarmers are performing reliable field cycles before issuing a full dismantlement permit. Log enough automated harvests to prove operational proficiency and the disassembly license will be yours.`,
        requirements: {
            wheat: 0,
            corn: 0,
            tomato: 0,
        },
        unlockCondition: {
            type: 'autoFarmerHarvests',
            requiresQuestCompleted: 'autofarmer-assembly-license',
            requirements: {
                count: 50,
            },
        },
        completionCondition: {
            type: 'autoFarmerHarvests',
            requirements: {
                count: 100,
            },
        },
        autoComplete: true,
        reward: {
            type: 'unlockDisassembleAutoFarmer',
            description: 'Unlocks Disassemble AutoFarmer in the store',
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