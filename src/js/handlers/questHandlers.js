import { getState, updateState, incrementTotalClicks } from "../state.js";
import { getStoreValues } from "../ui/store.js";
import { showConfirmation, showDialog, showNotification } from "../ui/macNotifications.js";
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

const QUEST_DECLINE_STEP = 2;

function getQuestTimerConfig(quest) {
    const deliveryWindowMs = Math.max(0, Number(quest?.deliveryWindowMs) || 0);
    if (deliveryWindowMs < 1) {
        return null;
    }

    const minPercent = Math.max(0, Number(quest?.lateFeeMinPercent) || 0);
    const maxPercent = Math.max(minPercent, Number(quest?.lateFeeMaxPercent) || minPercent);

    return {
        deliveryWindowMs,
        minPercent,
        maxPercent,
    };
}

function getRandomIntInclusive(min, max) {
    const normalizedMin = Math.ceil(min);
    const normalizedMax = Math.floor(max);
    if (normalizedMax <= normalizedMin) {
        return normalizedMin;
    }

    return Math.floor(Math.random() * (normalizedMax - normalizedMin + 1)) + normalizedMin;
}

function formatDurationMs(durationMs) {
    const totalSeconds = Math.max(0, Math.floor((Number(durationMs) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getNormalizedOffset(offset) {
    return {
        wheat: Math.max(0, Number(offset?.wheat) || 0),
        corn: Math.max(0, Number(offset?.corn) || 0),
        tomato: Math.max(0, Number(offset?.tomato) || 0),
    };
}

function addOffsets(baseOffset, addOffset) {
    const base = getNormalizedOffset(baseOffset);
    const addition = getNormalizedOffset(addOffset);

    return {
        wheat: base.wheat + addition.wheat,
        corn: base.corn + addition.corn,
        tomato: base.tomato + addition.tomato,
    };
}

function hasOffset(offset) {
    const normalized = getNormalizedOffset(offset);
    return cropTypes.some((cropType) => normalized[cropType] > 0);
}

function getQuestUnlockRequirementState(gameState, quest) {
    const unlockCondition = quest?.unlockCondition;
    if (!unlockCondition || unlockCondition.type !== 'cropsSold') {
        return null;
    }

    const globalOffset = getNormalizedOffset(gameState.questUnlockThresholdOffset);
    const pendingOffset = gameState.questProgressionPaused && gameState.questBlockedQuestId === quest.id
        ? getNormalizedOffset(gameState.questPendingDeclineOffset)
        : getNormalizedOffset(null);

    const effectiveRequirements = {};
    const baseRequirements = {};

    cropTypes.forEach((cropType) => {
        const base = Math.max(0, Number(unlockCondition.requirements?.[cropType]) || 0);
        const globalAmount = globalOffset[cropType] || 0;
        const pendingAmount = pendingOffset[cropType] || 0;

        baseRequirements[cropType] = base;
        effectiveRequirements[cropType] = base + globalAmount + pendingAmount;
    });

    return {
        baseRequirements,
        globalOffset,
        pendingOffset,
        effectiveRequirements,
    };
}

function getDeclineStepOffset() {
    return {
        wheat: QUEST_DECLINE_STEP,
        corn: QUEST_DECLINE_STEP,
        tomato: QUEST_DECLINE_STEP,
    };
}

function getUnlockTargetMessage(quest, gameState) {
    const unlockState = getQuestUnlockRequirementState(gameState, quest);
    if (!unlockState) {
        return '';
    }

    const parts = cropTypes.map((cropType) => `${unlockState.effectiveRequirements[cropType]} ${getCropLabel(cropType)}`);
    return parts.join(', ');
}

function getQuestDeclineCount(gameState, questId) {
    return Math.max(0, Number(gameState.questProgress?.[questId]?.declinedCount) || 0);
}

function getPauseReleaseState(gameState, completedQuestId) {
    if (!gameState.questProgressionPaused || gameState.questBlockedQuestId !== completedQuestId) {
        return null;
    }

    const pending = getNormalizedOffset(gameState.questPendingDeclineOffset);
    return {
        questUnlockThresholdOffset: addOffsets(gameState.questUnlockThresholdOffset, pending),
        questPendingDeclineOffset: getNormalizedOffset(null),
        questProgressionPaused: false,
        questBlockedQuestId: null,
    };
}

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
        closeValue: 'review-request',
        buttons: [
            {
                label: 'Review Request',
                value: 'review-request',
                autofocus: true,
            },
            {
                label: 'Cancel Contract',
                value: 'cancel-contract',
            },
        ],
    });
}

export function confirmQuestCancellation(questId) {
    const gameState = getState();
    const quest = getQuestDefinitionById(questId);

    if (!quest || !isQuestActive(gameState, questId)) {
        showNotification('That request is not currently active.', 'Quests');
        return Promise.resolve(false);
    }

    if (quest.autoComplete) {
        showNotification('This request cannot be declined.', 'Quests');
        return Promise.resolve(false);
    }

    const prompt = `Cancel contract for ${quest.name}?`;
    return showConfirmation(prompt, { title: 'Cancel Contract' })
        .then((confirmed) => {
            if (!confirmed) {
                return false;
            }

            return declineQuest(questId);
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

    const unlockState = getQuestUnlockRequirementState(gameState, quest);
    return cropTypes.every((cropType) => {
        const requiredAmount = Number(unlockState?.effectiveRequirements?.[cropType]) || 0;
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
    const timerConfig = getQuestTimerConfig(quest);

    const questProgressEntry = {
        ...(gameState.questProgress?.[questId] || {}),
        unlockedAt: Date.now(),
    };
    if (!quest.autoComplete) {
        questProgressEntry.acceptedAt = Date.now();
    }
    if (timerConfig) {
        questProgressEntry.deliveryWindowMs = timerConfig.deliveryWindowMs;
    }
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
    showQuestUnlockDialog(quest)
        .then((action) => {
            if (action === 'cancel-contract') {
                void confirmQuestCancellation(quest.id);
            }
        });
    return true;
}

function trackQuestUnlocks(currentState) {
    const gameState = currentState ?? getState();

    if (gameState.questProgressionPaused && gameState.questBlockedQuestId) {
        const blockedQuest = getQuestDefinitionById(gameState.questBlockedQuestId);
        if (!blockedQuest || isQuestCompleted(gameState, blockedQuest.id) || isQuestActive(gameState, blockedQuest.id)) {
            return;
        }

        if (hasMetUnlockCondition(gameState, blockedQuest)) {
            unlockQuest(blockedQuest.id);
        }
        return;
    }

    getQuestDefinitions().forEach((quest) => {
        if (isQuestUnlocked(gameState, quest.id) || isQuestCompleted(gameState, quest.id)) {
            return;
        }

        if (hasMetUnlockCondition(gameState, quest)) {
            unlockQuest(quest.id);
        }
    });
}

function declineQuest(questId) {
    const gameState = getState();
    const quest = getQuestDefinitionById(questId);

    if (!quest || !isQuestActive(gameState, questId)) {
        showNotification('That request is not currently active.', 'Quests');
        return false;
    }

    if (quest.autoComplete) {
        showNotification('This request cannot be declined.', 'Quests');
        return false;
    }

    const nextPendingOffset = addOffsets(gameState.questPendingDeclineOffset, getDeclineStepOffset());
    const nextDeclinedCount = getQuestDeclineCount(gameState, questId) + 1;
    const nextQuestProgress = {
        ...gameState.questProgress,
        [questId]: {
            ...(gameState.questProgress?.[questId] || {}),
            declinedAt: Date.now(),
            declinedCount: nextDeclinedCount,
        },
    };

    updateState({
        questsActive: gameState.questsActive.filter((id) => id !== questId),
        questsUnlocked: gameState.questsUnlocked.filter((id) => id !== questId),
        questProgress: nextQuestProgress,
        questProgressionPaused: true,
        questBlockedQuestId: questId,
        questPendingDeclineOffset: nextPendingOffset,
    });

    emitQuestUpdate();

    showNotification(`${quest.name} contract canceled.`, 'Contract Canceled');

    trackAchievements();
    return true;
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
    const timerConfig = getQuestTimerConfig(quest);
    const timedPenaltyText = timerConfig
        ? ` Late deliveries reduce payout by ${timerConfig.minPercent}-${timerConfig.maxPercent}%.`
        : '';

    if (quest.reward?.type === QUEST_REWARD_TYPES.DOUBLE_SALE_PRICE) {
        return `${payoutText}.${timedPenaltyText}`.trim();
    }

    if (quest.reward?.description) {
        return `${quest.reward.description} + ${payoutText}.${timedPenaltyText}`.trim();
    }

    return `${payoutText}.${timedPenaltyText}`.trim();
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
            powerPlantUnlocked: true,
            processingStationUnlocked: true,
            disassemblePowerPlantUnlocked: true,
            disassembleProcessingStationUnlocked: true,
            questProgress: nextQuestProgress,
        });
        showNotification('Disassemble AutoFarmer, Build Power Plants, Build Processing Stations, and their Disassemble features unlocked in the store.', 'Quest Reward');
    }
}

function getQuestDisplayData(questId, currentState) {
    const quest = getQuestDefinitionById(questId);
    const gameState = currentState ?? getState();
    if (!quest) {
        return null;
    }

    const unlockState = getQuestUnlockRequirementState(gameState, quest);

    const timerConfig = getQuestTimerConfig(quest);
    const acceptedAt = Number(gameState.questProgress?.[questId]?.acceptedAt) || 0;
    const elapsedMs = acceptedAt > 0 ? Math.max(0, Date.now() - acceptedAt) : 0;
    const remainingMs = timerConfig ? Math.max(0, timerConfig.deliveryWindowMs - elapsedMs) : 0;
    const isLateDelivery = Boolean(timerConfig && acceptedAt > 0 && elapsedMs > timerConfig.deliveryWindowMs);

    return {
        ...quest,
        requirementRows: getQuestRequirementRows(questId, gameState),
        rewardSummary: getRewardSummary(questId),
        canDeliver: canDeliverQuest(questId, gameState),
        canDecline: !quest.autoComplete,
        isCompleted: isQuestCompleted(gameState, questId),
        isActive: isQuestActive(gameState, questId),
        isBlockedQuest: gameState.questProgressionPaused && gameState.questBlockedQuestId === questId,
        unlockTargetSummary: unlockState
            ? cropTypes.map((cropType) => `${unlockState.effectiveRequirements[cropType]} ${getCropLabel(cropType)}`).join(', ')
            : '',
        isTimedQuest: Boolean(timerConfig),
        deliveryWindowLabel: timerConfig ? formatDurationMs(timerConfig.deliveryWindowMs) : '',
        lateFeeRangeLabel: timerConfig ? `${timerConfig.minPercent}-${timerConfig.maxPercent}%` : '',
        timeRemainingLabel: timerConfig ? formatDurationMs(remainingMs) : '',
        isLateDelivery,
    };
}

function getQuestPanelData(currentState) {
    const gameState = currentState ?? getState();
    const activeQuestIds = Array.isArray(gameState.questsActive) ? [...gameState.questsActive] : [];
    const blockedQuest = gameState.questBlockedQuestId
        ? getQuestDefinitionById(gameState.questBlockedQuestId)
        : null;

    return {
        unlockedCount: Array.isArray(gameState.questsUnlocked) ? gameState.questsUnlocked.length : 0,
        completedCount: Array.isArray(gameState.questsCompleted) ? gameState.questsCompleted.length : 0,
        progressionPaused: Boolean(gameState.questProgressionPaused),
        blockedQuestName: blockedQuest?.name || '',
        blockedQuestUnlockTarget: blockedQuest ? getUnlockTargetMessage(blockedQuest, gameState) : '',
        pendingOffsetSummary: hasOffset(gameState.questPendingDeclineOffset)
            ? cropTypes.map((cropType) => `+${getNormalizedOffset(gameState.questPendingDeclineOffset)[cropType]} ${getCropLabel(cropType)}`).join(', ')
            : '',
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
    const pauseReleaseState = getPauseReleaseState(gameState, questId);

    updateState({
        questsActive: gameState.questsActive.filter((id) => id !== questId),
        questsCompleted: [...gameState.questsCompleted, questId],
        questProgress: nextQuestProgress,
        ...(pauseReleaseState || {}),
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

    const grossPayout = calculateQuestPayout(questId);
    const timerConfig = getQuestTimerConfig(quest);
    const acceptedAt = Number(gameState.questProgress?.[questId]?.acceptedAt) || 0;
    const deliveredAt = Date.now();

    let wasLate = false;
    let lateFeePercent = 0;
    let lateFeeAmount = 0;
    let payout = grossPayout;

    if (timerConfig && acceptedAt > 0) {
        const elapsedMs = Math.max(0, deliveredAt - acceptedAt);
        if (elapsedMs > timerConfig.deliveryWindowMs) {
            wasLate = true;
            lateFeePercent = getRandomIntInclusive(timerConfig.minPercent, timerConfig.maxPercent);
            lateFeeAmount = Math.floor((grossPayout * lateFeePercent) / 100);
            payout = Math.max(0, grossPayout - lateFeeAmount);
        }
    }

    const requirementRows = getQuestRequirementRows(questId, gameState);
    const totalDelivered = requirementRows.reduce((sum, row) => sum + row.requiredAmount, 0);
    const nextQuestProgress = {
        ...gameState.questProgress,
        [questId]: {
            ...(gameState.questProgress?.[questId] || {}),
            completedAt: deliveredAt,
            deliveredAt,
            wasLate,
            lateFeePercent,
            lateFeeAmount,
            grossPayout,
            netPayout: payout,
        },
    };
    const pauseReleaseState = getPauseReleaseState(gameState, questId);

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
        ...(pauseReleaseState || {}),
        ...(timerConfig && !wasLate ? { timedQuestsBeatenOnTime: (Number(gameState.timedQuestsBeatenOnTime) || 0) + 1 } : {}),
    });

    if (wasLate) {
        showNotification(
            `${quest.name} delivered late. ${lateFeePercent}% fee applied (${lateFeeAmount} coins). Final payout: ${payout} coins.`,
            'Quest Complete',
        );
    } else {
        showNotification(`${quest.name} delivered for ${payout} coins.`, 'Quest Complete');
    }

    applyQuestReward(quest);

    updateResourceBar();
    trackAchievements();
    incrementTotalClicks();
    updateClicksDisplay();
    emitQuestUpdate();
    return true;
}

export {
    QUESTS_UPDATED_EVENT,
    trackQuestUnlocks,
    trackQuestAutoCompletions,
    unlockQuest,
    declineQuest,
    canDeliverQuest,
    calculateQuestPayout,
    getQuestDisplayData,
    getQuestPanelData,
    deliverQuest,
};