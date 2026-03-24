import { getState, updateState, incrementTotalClicks } from "../state.js";
import { getStoreValues } from "../ui/store.js";
import { showDialog, showNotification } from "../ui/macNotifications.js";
import { updateResourceBar } from "../ui/resource.js";
import { updateClicksDisplay } from "../ui/clicks.js";
import { trackAchievements } from "./achievementHandlers.js";
import { getQuestDefinitions, getQuestDefinitionById } from "../configs/questConfig.js";

const QUESTS_UPDATED_EVENT = 'quests:updated';
const cropTypes = ['wheat', 'corn', 'tomato'];

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

    updateState({
        questsUnlocked: [...gameState.questsUnlocked, questId],
        questsActive: isQuestActive(gameState, questId)
            ? [...gameState.questsActive]
            : [...gameState.questsActive, questId],
        questProgress: {
            ...gameState.questProgress,
            [questId]: {
                unlockedAt: Date.now(),
            },
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
    const payout = calculateQuestPayout(questId);
    return `${payout} coins total (2x store sale value)`;
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
    unlockQuest,
    canDeliverQuest,
    calculateQuestPayout,
    getQuestDisplayData,
    getQuestPanelData,
    deliverQuest,
};