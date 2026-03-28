const questDefinitions = [
    {
        id: 'produce-for-gigagrocery',
        name: 'GigaGrocery Onboarding Shipment',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says GigaGrocery wants a clean first shipment before opening a recurring contract lane with you. Finish this run to learn how deliveries work and why quest payouts are worth chasing.`,
        requirements: {
            wheat: 10,
            corn: 0,
            tomato: 0,
        },
        unlockCondition: {
            type: 'cropsSold',
            requirements: {
                wheat: 10,
                corn: 0,
                tomato: 0,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: 'Quest deliveries pay 2x store sale price for delivered crops',
        },
    },
    {
        id: 'gigagrocery-priority-restock-window',
        name: 'GigaGrocery Priority Restock Window',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says the grid elevated your account to priority intake. This restock is larger and timed, so dispatch has to arrive before the lane closes to avoid a late intake deduction.`,
        requirements: {
            wheat: 20,
            corn: 0,
            tomato: 0,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'produce-for-gigagrocery',
            requirements: {
                wheat: 22,
                corn: 0,
                tomato: 0,
            },
        },
        deliveryWindowMs: 120000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'gigagrocery-bulk-lane-escalation',
        name: 'GigaGrocery Bulk Lane Escalation',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says this is the next step up from your starter contracts: a larger wheat-only intake run with a tighter dispatch target.` ,
        requirements: {
            wheat: 30,
            corn: 0,
            tomato: 0,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'gigagrocery-priority-restock-window',
            requirements: {
                wheat: 38,
                corn: 0,
                tomato: 0,
            },
        },
        deliveryWindowMs: 150000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'root-66-corn-onboarding',
        name: 'Root 66 Corn Onboarding Ticket',
        issuer: 'Root 66 Diner',
        flavorText: `farmr says corn finally hit your route and Root 66 wants a clean single-crop test run before they increase order complexity.`,
        requirements: {
            wheat: 0,
            corn: 10,
            tomato: 0,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'gigagrocery-bulk-lane-escalation',
            requirements: {
                wheat: 38,
                corn: 10,
                tomato: 0,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'root-66-corn-rush-window',
        name: 'Root 66 Corn Rush Window',
        issuer: 'Root 66 Diner',
        flavorText: `farmr says Root 66 doubled its corn prep line and needs a faster follow-up run. Late arrivals are accepted but reduced for queue disruption.`,
        requirements: {
            wheat: 0,
            corn: 20,
            tomato: 0,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'root-66-corn-onboarding',
            requirements: {
                wheat: 38,
                corn: 24,
                tomato: 0,
            },
        },
        deliveryWindowMs: 120000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'root-66-corn-freight-escalation',
        name: 'Root 66 Corn Freight Escalation',
        issuer: 'Root 66 Diner',
        flavorText: `farmr says Root 66 is comfortable with your corn reliability and is sending a larger contract stage to match diner expansion.`,
        requirements: {
            wheat: 0,
            corn: 30,
            tomato: 0,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'root-66-corn-rush-window',
            requirements: {
                wheat: 38,
                corn: 42,
                tomato: 0,
            },
        },
        deliveryWindowMs: 150000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'open-source-tomato-onboarding',
        name: 'Open Source Organics Tomato Onboarding',
        issuer: 'Open Source Organics',
        flavorText: `farmr says tomato lanes are live now, and the co-op wants a focused onboarding delivery before blending you into mixed neighborhood contracts.`,
        requirements: {
            wheat: 0,
            corn: 0,
            tomato: 10,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'root-66-corn-freight-escalation',
            requirements: {
                wheat: 38,
                corn: 42,
                tomato: 10,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'open-source-tomato-rush-window',
        name: 'Open Source Organics Tomato Rush Window',
        issuer: 'Open Source Organics',
        flavorText: `farmr says tomato demand jumped and the co-op needs a larger follow-up under a service window. Late intake is still accepted with a reduced payout.`,
        requirements: {
            wheat: 0,
            corn: 0,
            tomato: 20,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'open-source-tomato-onboarding',
            requirements: {
                wheat: 38,
                corn: 42,
                tomato: 24,
            },
        },
        deliveryWindowMs: 120000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'gigagrocery-balanced-refresh-01',
        name: 'GigaGrocery Balanced Refresh 01',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says this is your first full mixed-lane refresh contract, weighted toward wheat while still requiring corn and tomato support.`,
        requirements: {
            wheat: 24,
            corn: 12,
            tomato: 10,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'open-source-tomato-rush-window',
            requirements: {
                wheat: 50,
                corn: 42,
                tomato: 26,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'root-66-skillet-supply-02',
        name: 'Root 66 Skillet Supply 02',
        issuer: 'Root 66 Diner',
        flavorText: `farmr says Root 66 needs a corn-weighted mixed dispatch for a seasonal skillet menu rollout.`,
        requirements: {
            wheat: 12,
            corn: 24,
            tomato: 10,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'gigagrocery-balanced-refresh-01',
            requirements: {
                wheat: 56,
                corn: 50,
                tomato: 30,
            },
        },
        deliveryWindowMs: 150000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'open-source-greenbox-round-03',
        name: 'Open Source Greenbox Round 03',
        issuer: 'Open Source Organics',
        flavorText: `farmr says the co-op is issuing tomato-favored greenbox routes while testing neighborhood demand balancing.`,
        requirements: {
            wheat: 10,
            corn: 12,
            tomato: 24,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'root-66-skillet-supply-02',
            requirements: {
                wheat: 62,
                corn: 56,
                tomato: 40,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'git-grocer-branch-stock-04',
        name: 'Git Grocer Branch Stock 04',
        issuer: 'Git Grocer',
        flavorText: `farmr says Git Grocer wants a wheat-heavy aisle reset with enough mixed produce to keep branch displays balanced.`,
        requirements: {
            wheat: 28,
            corn: 16,
            tomato: 12,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'open-source-greenbox-round-03',
            requirements: {
                wheat: 72,
                corn: 62,
                tomato: 46,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'cache-harvest-breakfast-line-05',
        name: 'Cache & Harvest Breakfast Line 05',
        issuer: 'Cache & Harvest Hotel',
        flavorText: `farmr says the hotel breakfast line needs a corn-leading mixed delivery for multi-day guest turnover.`,
        requirements: {
            wheat: 14,
            corn: 28,
            tomato: 14,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'git-grocer-branch-stock-04',
            requirements: {
                wheat: 78,
                corn: 72,
                tomato: 52,
            },
        },
        deliveryWindowMs: 180000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'gigagrocery-lunchwave-grid-06',
        name: 'GigaGrocery Lunchwave Grid 06',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says the lunchwave forecast favors tomato-prep packs this cycle, with wheat and corn used as support stock.`,
        requirements: {
            wheat: 14,
            corn: 16,
            tomato: 28,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'cache-harvest-breakfast-line-05',
            requirements: {
                wheat: 84,
                corn: 78,
                tomato: 64,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'root-66-evening-ticket-07',
        name: 'Root 66 Evening Ticket 07',
        issuer: 'Root 66 Diner',
        flavorText: `farmr says evening service needs a wheat-favored mixed line with tighter prep intervals than daytime contracts.`,
        requirements: {
            wheat: 32,
            corn: 20,
            tomato: 16,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'gigagrocery-lunchwave-grid-06',
            requirements: {
                wheat: 96,
                corn: 86,
                tomato: 72,
            },
        },
        deliveryWindowMs: 180000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'open-source-shared-table-08',
        name: 'Open Source Shared Table 08',
        issuer: 'Open Source Organics',
        flavorText: `farmr says this round emphasizes corn output for shared table routes while preserving balanced produce lanes.`,
        requirements: {
            wheat: 18,
            corn: 32,
            tomato: 18,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'root-66-evening-ticket-07',
            requirements: {
                wheat: 104,
                corn: 98,
                tomato: 80,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'git-grocer-aisle-reset-09',
        name: 'Git Grocer Aisle Reset 09',
        issuer: 'Git Grocer',
        flavorText: `farmr says this aisle reset favors tomato density to stabilize produce quality variance across connected branches.`,
        requirements: {
            wheat: 18,
            corn: 20,
            tomato: 32,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'open-source-shared-table-08',
            requirements: {
                wheat: 112,
                corn: 106,
                tomato: 94,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'cache-harvest-banquet-prep-10',
        name: 'Cache & Harvest Banquet Prep 10',
        issuer: 'Cache & Harvest Hotel',
        flavorText: `farmr says banquet prep needs a wheat-led core with enough mixed produce for rotating room service menus.`,
        requirements: {
            wheat: 36,
            corn: 24,
            tomato: 20,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'git-grocer-aisle-reset-09',
            requirements: {
                wheat: 126,
                corn: 116,
                tomato: 102,
            },
        },
        deliveryWindowMs: 210000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'gigagrocery-city-pilot-11',
        name: 'GigaGrocery City Pilot 11',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says city pilot nodes are corn-heavy this cycle and need consistent throughput from trusted growers.`,
        requirements: {
            wheat: 22,
            corn: 36,
            tomato: 22,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'cache-harvest-banquet-prep-10',
            requirements: {
                wheat: 136,
                corn: 130,
                tomato: 112,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'root-66-double-shift-12',
        name: 'Root 66 Double Shift 12',
        issuer: 'Root 66 Diner',
        flavorText: `farmr says double-shift kitchens are tomato-biased tonight and need larger support loads to avoid service stalls.`,
        requirements: {
            wheat: 22,
            corn: 24,
            tomato: 36,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'gigagrocery-city-pilot-11',
            requirements: {
                wheat: 146,
                corn: 140,
                tomato: 128,
            },
        },
        deliveryWindowMs: 210000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'open-source-neighborhood-hub-13',
        name: 'Open Source Neighborhood Hub 13',
        issuer: 'Open Source Organics',
        flavorText: `farmr says hub dispatches are wheat-favored this week, but each pallet still needs broad crop support for coverage.`,
        requirements: {
            wheat: 40,
            corn: 28,
            tomato: 24,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'root-66-double-shift-12',
            requirements: {
                wheat: 162,
                corn: 150,
                tomato: 138,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'git-grocer-weekly-sync-14',
        name: 'Git Grocer Weekly Sync 14',
        issuer: 'Git Grocer',
        flavorText: `farmr says branch synchronization now prioritizes corn-heavy loads with strict lot balancing.`,
        requirements: {
            wheat: 26,
            corn: 40,
            tomato: 26,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'open-source-neighborhood-hub-13',
            requirements: {
                wheat: 172,
                corn: 166,
                tomato: 150,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'cache-harvest-guest-cycle-15',
        name: 'Cache & Harvest Guest Cycle 15',
        issuer: 'Cache & Harvest Hotel',
        flavorText: `farmr says guest-cycle menus are tomato-forward this round, with corn and wheat used for rotating backup lines.`,
        requirements: {
            wheat: 26,
            corn: 28,
            tomato: 40,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'git-grocer-weekly-sync-14',
            requirements: {
                wheat: 184,
                corn: 176,
                tomato: 168,
            },
        },
        deliveryWindowMs: 240000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'gigagrocery-regional-rollout-16',
        name: 'GigaGrocery Regional Rollout 16',
        issuer: 'GigaGrocery Procurement Grid',
        flavorText: `farmr says the rollout contract favors wheat and corn but still expects steady tomato throughput for store parity.`,
        requirements: {
            wheat: 44,
            corn: 32,
            tomato: 30,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'cache-harvest-guest-cycle-15',
            requirements: {
                wheat: 200,
                corn: 190,
                tomato: 182,
            },
        },
        reward: {
            type: 'doubleSalePrice',
            description: '2x store sale price for each crop delivered',
        },
    },
    {
        id: 'root-66-midnight-lane-17',
        name: 'Root 66 Midnight Lane 17',
        issuer: 'Root 66 Diner',
        flavorText: `farmr says midnight prep favors corn with high tomato backup. They need a larger final pre-upgrade dispatch from you.`,
        requirements: {
            wheat: 32,
            corn: 44,
            tomato: 34,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'gigagrocery-regional-rollout-16',
            requirements: {
                wheat: 214,
                corn: 208,
                tomato: 198,
            },
        },
        deliveryWindowMs: 240000,
        lateFeeMinPercent: 5,
        lateFeeMaxPercent: 10,
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
            wheat: 50,
            corn: 46,
            tomato: 42,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'root-66-midnight-lane-17',
            requirements: {
                wheat: 236,
                corn: 228,
                tomato: 220,
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
            wheat: 60,
            corn: 58,
            tomato: 56,
        },
        unlockCondition: {
            type: 'cropsSold',
            requiresQuestCompleted: 'plot-reclamation-and-salvage-contract',
            requirements: {
                wheat: 268,
                corn: 260,
                tomato: 252,
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
    {
        id: 'autofarmer-mk-calibration-license',
        name: 'AutoFarmer Mk Calibration License',
        issuer: 'Automata Licensing Bureau',
        flavorText: `farmr says the bureau now allows operators to tune individual AutoFarmer rigs, but only after proving sustained automation discipline. Deliver this calibration shipment and they will unlock your Mk upgrade console.`,
        requirements: {
            wheat: 72,
            corn: 68,
            tomato: 64,
        },
        unlockCondition: {
            type: 'autoFarmerHarvests',
            requiresQuestCompleted: 'autofarmer-field-operations-review',
            requirements: {
                count: 180,
            },
        },
        reward: {
            type: 'unlockAutoFarmerUpgrade',
            description: 'Unlocks AutoFarmer upgrades in the Upgrades section',
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