import { getState, updateState, incrementTotalClicks } from "../state.js";
import { getStoreValues } from "../ui/store.js";
import { showDialog, showNotification } from "../ui/macNotifications.js";
import { updateResourceBar } from "../ui/resource.js";
import { updateClicksDisplay } from "../ui/clicks.js";
import { trackAchievements } from "./achievementHandlers.js";
import { getQuestDefinitions, getQuestDefinitionById } from "../configs/questConfig.js";

const QUESTS_UPDATED_EVENT = 'quests:updated';
const cropTypes = ['wheat', 'corn', 'tomato'];

const QUEST_REWARD_TYPES = {
    DOUBLE_SALE_PRICE: 'doubleSalePrice',
    UNLOCK_DESTROY_RESTORE_PLOT: 'unlockDestroyRestorePlot',
    UNLOCK_AUTO_FARMER: 'unlockAutoFarmer',
    UNLOCK_DISASSEMBLE_AUTO_FARMER: 'unlockDisassembleAutoFarmer',
};

function emitQuestUpdate() {
    document.dispatchEvent(new CustomEvent(QUESTS_UPDATED_EVENT));
}

function isQuestUnlocked(gameState, questId) {
    return Array.isArray(gameState.questsUnlocked) && gameState.questsUnlocked.includes(questId);
}

function isQuestCompleted(gameState, questId) {
    return Array.isArray(gameState.questsCompleted) && gameState.questsCompleted.includes(questId);
}

function isQuestActive(gameState, questId) {
    return Array.isArray(gameState.questsActive) && gameState.questsActive.includes(questId);
}

function getCropLabel(cropType) {
    if (cropType === 'tomato') {
        return 'Tomatoes';
    }

    return `${cropType.charAt(0).toUpperCase()}${cropType.slice(1)}`;
}

function isCurrentlyDark() {
    if (document.body.classList.contains('dark')) return true;
    if (document.body.classList.contains('light')) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function createQuestUnlockBody(quest) {
    const wrapper = document.createElement('div');
    wrapper.className = 'mac-dialog-content quest-popup-content';

    const spriteSrc = isCurrentlyDark()
        ? './src/assets/farmr/farmr-sprite-DarkMode.gif'
        : './src/assets/farmr/farmr-sprite.gif';

    const sprite = document.createElement('img');
    sprite.className = 'quest-farmr-sprite';
    sprite.src = spriteSrc;
    sprite.alt = 'farmr the digital farmer';

    const intro = document.createElement('p');
    intro.className = 'mac-dialog-message';
    intro.textContent = `${quest.issuer} has routed a fresh produce request through farmr.`;

    const flavor = document.createElement('p');
    flavor.className = 'mac-dialog-message quest-popup-flavor';
    flavor.textContent = quest.flavorText;

    const introText = document.createElement('div');
    introText.append(intro, flavor);

    const introRow = document.createElement('div');
    introRow.className = 'quest-popup-intro-row';
    introRow.append(sprite, introText);

    const details = document.createElement('div');
    details.className = 'quest-popup-details';

    const questIdRow = document.createElement('p');
    questIdRow.className = 'quest-popup-meta';
    questIdRow.textContent = `Quest #${quest.questNumber}`;

    const requirementsHeading = document.createElement('p');
    requirementsHeading.className = 'quest-popup-heading';
    requirementsHeading.textContent = 'Requested Produce';

    const requirementsList = document.createElement('ul');
    requirementsList.className = 'quest-popup-requirements';

    cropTypes.forEach((cropType) => {
        const quantity = Number(quest.requirements?.[cropType]) || 0;
        if (quantity < 1) {
            return;
        }

        const item = document.createElement('li');
        item.textContent = `${quantity} ${getCropLabel(cropType)}`;
        requirementsList.appendChild(item);
    });

    const reward = document.createElement('p');
    reward.className = 'quest-popup-meta';
    reward.textContent = `Reward: ${quest.reward?.description || 'Premium payment'}`;

    details.append(questIdRow, requirementsHeading, requirementsList, reward);
    wrapper.append(introRow, details);
    return wrapper;
}

function showQuestUnlockDialog(quest) {
    return showDialog({
        title: `New Request: ${quest.name}`,
        body: createQuestUnlockBody(quest),
        dialogClassName: 'quest-popup-window',
        closeValue: true,
        buttons: [
            {
                label: 'Review Request',
                value: true,
                autofocus: true,
            },
        ],
    });
}

function hasMetUnlockCondition(gameState, quest) {
    const unlockCondition = quest.unlockCondition;
    if (!unlockCondition) {
        return true;
    }

    if (unlockCondition.requiresQuestCompleted) {
        const requiredQuestId = unlockCondition.requiresQuestCompleted;
        if (!isQuestCompleted(gameState, requiredQuestId)) {
            return false;
        }
    }

    if (unlockCondition.type === 'autoFarmerHarvests') {
        const required = Number(unlockCondition.requirements?.count) || 0;
        if (required < 1) {
            return true;
        }

        const baseline = Number(gameState.questProgress?.[quest.id]?.autoFarmerHarvestStart) || 0;
        const current = Number(gameState.autoFarmerCropsHarvested) || 0;
        return (current - baseline) >= required;
    }

    if (unlockCondition.type !== 'cropsSold') {
        return false;
    }

    return cropTypes.every((cropType) => {
        const requiredAmount = Number(unlockCondition.requirements?.[cropType]) || 0;
        if (requiredAmount < 1) {
            return true;
        }

        const soldKey = `${cropType}Sold`;
        return (Number(gameState[soldKey]) || 0) >= requiredAmount;
    });
}

function unlockQuest(questId) {
    const quest = getQuestDefinitionById(questId);
    if (!quest) {
        return false;
    }

    const gameState = getState();
    if (isQuestUnlocked(gameState, questId) || isQuestCompleted(gameState, questId)) {
        return false;
    }

    const harvestStart = quest?.unlockCondition?.type === 'autoFarmerHarvests'
        ? (Number(getState().autoFarmerCropsHarvested) || 0)
        : undefined;

    const questProgressEntry = { unlockedAt: Date.now() };
    if (harvestStart !== undefined) {
        questProgressEntry.autoFarmerHarvestStart = harvestStart;
    }

    updateState({
        questsUnlocked: [...gameState.questsUnlocked, questId],
        questsActive: isQuestActive(gameState, questId)
            ? [...gameState.questsActive]
            : [...gameState.questsActive, questId],
        questProgress: {
            ...gameState.questProgress,
            [questId]: questProgressEntry,
        },
    });

    emitQuestUpdate();
    showQuestUnlockDialog(quest);
    return true;
}

function trackQuestUnlocks(currentState) {
    const gameState = currentState ?? getState();

    getQuestDefinitions().forEach((quest) => {
        if (isQuestUnlocked(gameState, quest.id) || isQuestCompleted(gameState, quest.id)) {
            return;
        }

        if (hasMetUnlockCondition(gameState, quest)) {
            unlockQuest(quest.id);
        }
    });
}

function getQuestRequirementRows(questId, currentState) {
    const quest = getQuestDefinitionById(questId);
    const gameState = currentState ?? getState();
    if (!quest) {
        return [];
    }

    // Auto-complete quests use progress rows instead of crop rows
    if (quest.autoComplete && quest.completionCondition?.type === 'autoFarmerHarvests') {
        const required = Number(quest.completionCondition.requirements?.count) || 0;
        const baseline = Number(gameState.questProgress?.[questId]?.autoFarmerHarvestStart) || 0;
        const current = Math.max(0, (Number(gameState.autoFarmerCropsHarvested) || 0) - baseline);
        return [{
            cropType: 'autoFarmerHarvests',
            label: 'AutoFarmer Harvests',
            currentAmount: Math.min(current, required),
            requiredAmount: required,
            isReady: current >= required,
        }];
    }

    return cropTypes.reduce((rows, cropType) => {
        const requiredAmount = Number(quest.requirements?.[cropType]) || 0;
        if (requiredAmount < 1) {
            return rows;
        }

        const currentAmount = Math.max(0, Number(gameState[cropType]) || 0);
        rows.push({
            cropType,
            label: getCropLabel(cropType),
            currentAmount,
            requiredAmount,
            isReady: currentAmount >= requiredAmount,
        });

        return rows;
    }, []);
}

function canDeliverQuest(questId, currentState) {
    const quest = getQuestDefinitionById(questId);
    if (quest?.autoComplete) {
        return false;
    }

    const requirementRows = getQuestRequirementRows(questId, currentState);
    if (!requirementRows.length) {
        return false;
    }

    return requirementRows.every((row) => row.isReady);
}

function calculateQuestPayout(questId) {
    const quest = getQuestDefinitionById(questId);
    if (!quest) {
        return 0;
    }

    const storeValues = getStoreValues();
    const priceKeyByCrop = {
        wheat: 'wheatPrice',
        corn: 'cornPrice',
        tomato: 'tomatoPrice',
    };

    return cropTypes.reduce((total, cropType) => {
        const requiredAmount = Number(quest.requirements?.[cropType]) || 0;
        if (requiredAmount < 1) {
            return total;
        }

        const priceKey = priceKeyByCrop[cropType];
        const storePrice = Math.max(0, Number(storeValues[priceKey]) || 0);
        return total + (requiredAmount * storePrice * 2);
    }, 0);
}

function getRewardSummary(questId) {
    const quest = getQuestDefinitionById(questId);
    if (!quest) {
        return '';
    }

    if (quest.autoComplete) {
        return quest.reward?.description || 'Unlocks new feature';
    }

    const payout = calculateQuestPayout(questId);
    const payoutText = `${payout} coins total (2x store sale value)`;

    if (quest.reward?.type === QUEST_REWARD_TYPES.DOUBLE_SALE_PRICE) {
        return payoutText;
    }

    if (quest.reward?.description) {
        return `${quest.reward.description} + ${payoutText}`;
    }

    return payoutText;
}

function applyQuestReward(quest) {
    if (!quest?.reward?.type) {
        return;
    }

    const gameState = getState();
    const questId = quest.id;
    const nextQuestProgress = {
        ...gameState.questProgress,
        [questId]: {
            ...(gameState.questProgress?.[questId] || {}),
            rewardAppliedAt: Date.now(),
        },
    };

    if (quest.reward.type === QUEST_REWARD_TYPES.UNLOCK_DESTROY_RESTORE_PLOT) {
        updateState({
            destroyPlotUnlocked: true,
            restorePlotUnlocked: true,
            questProgress: nextQuestProgress,
        });
        showNotification('Destroy Plot and Restore Plot unlocked in the store.', 'Quest Reward');
        return;
    }

    if (quest.reward.type === QUEST_REWARD_TYPES.UNLOCK_AUTO_FARMER) {
        updateState({
            autoFarmerUnlocked: true,
            questProgress: nextQuestProgress,
        });
        showNotification('Build AutoFarmer unlocked in the store.', 'Quest Reward');
        return;
    }

    if (quest.reward.type === QUEST_REWARD_TYPES.UNLOCK_DISASSEMBLE_AUTO_FARMER) {
        updateState({
            disassembleAutoFarmerUnlocked: true,
            questProgress: nextQuestProgress,
        });
        showNotification('Disassemble AutoFarmer unlocked in the store.', 'Quest Reward');
    }
}

function getQuestDisplayData(questId, currentState) {
    const quest = getQuestDefinitionById(questId);
    const gameState = currentState ?? getState();
    if (!quest) {
        return null;
    }

    return {
        ...quest,
        requirementRows: getQuestRequirementRows(questId, gameState),
        rewardSummary: getRewardSummary(questId),
        canDeliver: canDeliverQuest(questId, gameState),
        isCompleted: isQuestCompleted(gameState, questId),
        isActive: isQuestActive(gameState, questId),
    };
}

function getQuestPanelData(currentState) {
    const gameState = currentState ?? getState();
    const activeQuestIds = Array.isArray(gameState.questsActive) ? [...gameState.questsActive] : [];

    return {
        unlockedCount: Array.isArray(gameState.questsUnlocked) ? gameState.questsUnlocked.length : 0,
        completedCount: Array.isArray(gameState.questsCompleted) ? gameState.questsCompleted.length : 0,
        activeQuests: activeQuestIds
            .map((questId) => getQuestDisplayData(questId, gameState))
            .filter(Boolean),
    };
}

function hasMetCompletionCondition(gameState, quest) {
    const cc = quest.completionCondition;
    if (!cc) {
        return false;
    }

    if (cc.type === 'autoFarmerHarvests') {
        const required = Number(cc.requirements?.count) || 0;
        const baseline = Number(gameState.questProgress?.[quest.id]?.autoFarmerHarvestStart) || 0;
        const current = Number(gameState.autoFarmerCropsHarvested) || 0;
        return (current - baseline) >= required;
    }

    return false;
}

function autoCompleteQuest(questId) {
    const quest = getQuestDefinitionById(questId);
    const gameState = getState();
    if (!quest || !isQuestActive(gameState, questId)) {
        return false;
    }

    const nextQuestProgress = {
        ...gameState.questProgress,
        [questId]: {
            ...(gameState.questProgress?.[questId] || {}),
            completedAt: Date.now(),
        },
    };

    updateState({
        questsActive: gameState.questsActive.filter((id) => id !== questId),
        questsCompleted: [...gameState.questsCompleted, questId],
        questProgress: nextQuestProgress,
    });

    applyQuestReward(quest);
    emitQuestUpdate();
    showNotification(`${quest.name} complete! ${quest.reward?.description || ''}.`, 'Quest Complete');
    return true;
}

function trackQuestAutoCompletions(currentState) {
    const gameState = currentState ?? getState();

    getQuestDefinitions().forEach((quest) => {
        if (!quest.autoComplete) {
            return;
        }

        if (!isQuestActive(gameState, quest.id)) {
            return;
        }

        if (hasMetCompletionCondition(gameState, quest)) {
            autoCompleteQuest(quest.id);
        }
    });
}

function deliverQuest(questId) {
    const quest = getQuestDefinitionById(questId);
    const gameState = getState();
    if (!quest || !isQuestActive(gameState, questId)) {
        showNotification('That request is not currently active.', 'Quests');
        return false;
    }

    if (!canDeliverQuest(questId, gameState)) {
        showNotification('You do not have the full harvest ready yet.', 'Quests');
        return false;
    }

    const payout = calculateQuestPayout(questId);
    const requirementRows = getQuestRequirementRows(questId, gameState);
    const totalDelivered = requirementRows.reduce((sum, row) => sum + row.requiredAmount, 0);
    const nextQuestProgress = {
        ...gameState.questProgress,
        [questId]: {
            ...(gameState.questProgress?.[questId] || {}),
            completedAt: Date.now(),
        },
    };

    updateState({
        coins: gameState.coins + payout,
        totalCoinsEarned: gameState.totalCoinsEarned + payout,
        totalCoinsFromQuests: (Number(gameState.totalCoinsFromQuests) || 0) + payout,
        wheat: gameState.wheat - (Number(quest.requirements?.wheat) || 0),
        corn: gameState.corn - (Number(quest.requirements?.corn) || 0),
        tomato: gameState.tomato - (Number(quest.requirements?.tomato) || 0),
        crops: Math.max(0, (Number(gameState.crops) || 0) - totalDelivered),
        questsActive: gameState.questsActive.filter((activeQuestId) => activeQuestId !== questId),
        questsCompleted: [...gameState.questsCompleted, questId],
        questProgress: nextQuestProgress,
    });

    applyQuestReward(quest);

    updateResourceBar();
    trackAchievements();
    incrementTotalClicks();
    updateClicksDisplay();
    emitQuestUpdate();
    showNotification(`${quest.name} delivered for ${payout} coins.`, 'Quest Complete');
    return true;
}

export {
    QUESTS_UPDATED_EVENT,
    trackQuestUnlocks,
    trackQuestAutoCompletions,
    unlockQuest,
    canDeliverQuest,
    calculateQuestPayout,
    getQuestDisplayData,
    getQuestPanelData,
    deliverQuest,
};