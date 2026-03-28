//state.js
import { savePartialSnapshot, loadSnapshot } from "./persistence.js";
import { progressionConfig } from "./configs/progressionConfig.js";

const DEFAULT_FIELD_ID = 'field-1';

function normalizePlotState(plot) {
    return {
        symbol: plot?.symbol ?? '~',
        cropType: plot?.cropType ?? null,
        waterCount: Number(plot?.waterCount) || 0,
        disabledUntil: Number(plot?.disabledUntil) || 0,
        lastUpdatedAt: Number(plot?.lastUpdatedAt) || Date.now(),
    };
}

function normalizeGameStartedAt(value, fallback = Date.now()) {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue) && parsedValue > 0) {
        return parsedValue;
    }

    return Number(fallback) || Date.now();
}

function normalizeStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(value.filter((entry) => typeof entry === 'string' && entry.length > 0))];
}

function normalizeQuestProgress(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const normalizedProgress = {};
    Object.entries(value).forEach(([questId, progress]) => {
        if (!questId || !progress || typeof progress !== 'object' || Array.isArray(progress)) {
            return;
        }

        normalizedProgress[questId] = { ...progress };
    });

    return normalizedProgress;
}

function createDefaultField({ id, name, plots }) {
    return {
        id,
        name,
        plots,
        plotStates: Array.from({ length: plots }, () => normalizePlotState(null)),
    };
}

function normalizeField(field, fallback = {}) {
    const normalizedPlots = Math.max(1, Number(field?.plots) || Number(fallback.plots) || 1);
    const basePlotStates = Array.isArray(field?.plotStates) ? field.plotStates : (Array.isArray(fallback.plotStates) ? fallback.plotStates : []);
    const normalizedPlotStates = [];

    for (let i = 0; i < normalizedPlots; i++) {
        normalizedPlotStates.push(normalizePlotState(basePlotStates[i]));
    }

    return {
        id: field?.id || fallback.id,
        name: field?.name || fallback.name || 'Field',
        plots: normalizedPlots,
        plotStates: normalizedPlotStates,
    };
}

function getFieldNameById(fieldId) {
    const match = String(fieldId || '').match(/field-(\d+)/i);
    if (!match) {
        return 'Field';
    }

    return `Field ${Number(match[1])}`;
}

function ensureFieldsStateShape(sourceState) {
    const fields = sourceState?.fields && typeof sourceState.fields === 'object'
        ? sourceState.fields
        : {};

    const hasAnyFields = Object.keys(fields).length > 0;
    const fallbackField = createDefaultField({
        id: DEFAULT_FIELD_ID,
        name: 'Field 1',
        plots: Math.max(1, Number(sourceState?.plots) || 81),
    });

    if (!hasAnyFields) {
        const legacyPlotStates = Array.isArray(sourceState?.plotStates)
            ? sourceState.plotStates
            : fallbackField.plotStates;

        fields[DEFAULT_FIELD_ID] = normalizeField({
            id: DEFAULT_FIELD_ID,
            name: 'Field 1',
            plots: Math.max(1, Number(sourceState?.plots) || 81),
            plotStates: legacyPlotStates,
        }, fallbackField);
    }

    const ownedFieldIds = Array.isArray(sourceState?.ownedFieldIds)
        ? sourceState.ownedFieldIds.filter((fieldId) => typeof fieldId === 'string' && fields[fieldId])
        : [];

    if (!ownedFieldIds.length) {
        ownedFieldIds.push(...Object.keys(fields));
    }

    ownedFieldIds.sort((a, b) => {
        const first = Number(String(a).replace('field-', '')) || 0;
        const second = Number(String(b).replace('field-', '')) || 0;
        return first - second;
    });

    const activeFieldId = fields[sourceState?.activeFieldId]
        ? sourceState.activeFieldId
        : ownedFieldIds[0] || DEFAULT_FIELD_ID;

    for (const fieldId of ownedFieldIds) {
        fields[fieldId] = normalizeField(fields[fieldId], {
            id: fieldId,
            name: getFieldNameById(fieldId),
            plots: fieldId === DEFAULT_FIELD_ID ? 81 : 1,
            plotStates: [],
        });
    }

    const fieldNumbers = ownedFieldIds
        .map((fieldId) => Number(String(fieldId).replace('field-', '')) || 0)
        .filter((num) => num > 0);

    const computedNextFieldNumber = (fieldNumbers.length ? Math.max(...fieldNumbers) : 1) + 1;

    return {
        fields,
        ownedFieldIds,
        activeFieldId,
        nextFieldNumber: Math.max(computedNextFieldNumber, Number(sourceState?.nextFieldNumber) || computedNextFieldNumber),
    };
}

function reconcileFieldPlotTimers(fields) {
    const now = Date.now();

    Object.values(fields).forEach((field) => {
        if (!field || !Array.isArray(field.plotStates)) {
            return;
        }

        field.plotStates = field.plotStates.map((plot) => {
            const normalizedPlot = normalizePlotState(plot);
            if (normalizedPlot.disabledUntil > 0 && normalizedPlot.disabledUntil <= now) {
                normalizedPlot.disabledUntil = 0;
            }

            normalizedPlot.lastUpdatedAt = now;
            return normalizedPlot;
        });
    });
}

function getActiveFieldFromState(stateLike) {
    const fieldId = stateLike.activeFieldId;
    return stateLike.fields[fieldId] || stateLike.fields[DEFAULT_FIELD_ID];
}

function syncLegacyActiveField(stateLike) {
    const activeField = getActiveFieldFromState(stateLike);
    stateLike.plots = activeField?.plots || 0;
    stateLike.plotStates = Array.isArray(activeField?.plotStates)
        ? activeField.plotStates.map((plot) => normalizePlotState(plot))
        : [];
}

function buildFieldStateSnapshot(fields) {
    const snapshot = {};

    Object.entries(fields).forEach(([fieldId, field]) => {
        snapshot[fieldId] = {
            id: field.id,
            name: field.name,
            plots: field.plots,
            plotStates: Array.isArray(field.plotStates)
                ? field.plotStates.map((plot) => normalizePlotState(plot))
                : [],
        };
    });

    return snapshot;
}

const initialGameState = {
    // Player Resource Values
    coins: 1,
    seeds: 1, // Generic seeds (kept for backward compatibility)
    crops: 0, // Generic crops (kept for backward compatibility)
    water: 10,

    // Crop-Specific Seeds
    wheatSeeds: 1, // Start with some wheat seeds
    cornSeeds: 0,
    tomatoSeeds: 0,

    // Crop-Specific Inventory
    wheat: 0,
    corn: 0,
    tomato: 0,

    // Field Information
    plots: 1,
    plotDisableCoefficient: 1.15, // Coefficient used to calculate plot disable time
    plotStates: [], // Backward-compatible mirror of active field plot states
    fields: {
        [DEFAULT_FIELD_ID]: createDefaultField({ id: DEFAULT_FIELD_ID, name: 'Field 1', plots: 1 }),
    },
    ownedFieldIds: [DEFAULT_FIELD_ID],
    activeFieldId: DEFAULT_FIELD_ID,
    nextFieldNumber: 2,
    fieldStoreUnlocked: false,
    nextFieldCost: progressionConfig.storeEconomy.fieldPurchase.baseCost,

    // Crop Unlock Tracking
    cornUnlocked: false,  // Corn unlock threshold is defined in progressionConfig.unlocks.cropsByTotalCoinsEarned.corn
    tomatoUnlocked: false, // Tomato unlock threshold is defined in progressionConfig.unlocks.cropsByTotalCoinsEarned.tomato

    // Game Progress Information
    totalCoinsSpent: 0,       // Total coins spent on seeds, upgrades, and other purchases
    totalCoinsEarned: 0,      // Total number of coins the player has earned throughout the game
    cropsSold: 0,             // Total number of crops sold by the player (all types combined)
    wheatSold: 0,             // Total wheat sold
    cornSold: 0,              // Total corn sold
    tomatoSold: 0,            // Total tomatoes sold
    seedsBought: 0,           // Total number of seeds bought by the player
    wheatSeedsBought: 0,      // Total wheat seeds bought
    cornSeedsBought: 0,       // Total corn seeds bought
    tomatoSeedsBought: 0,     // Total tomato seeds bought
    waterRefillsPurchased: 0, // Total number of times the player has clicked the water refil button
    totalClicksClicked: 0,    // Total number of successful button clicks
    totalPlayTimeMs: 0,       // Accumulated play time in ms from all previous sessions
    gameStartedAt: Date.now(), // Timestamp for when this game/save started

    // Quest Values
    questsUnlocked: [],
    questsActive: [],
    questsCompleted: [],
    questProgress: {},
    totalCoinsFromQuests: 0,
    timedQuestsBeatenOnTime: 0,

    // Upgrade Values
    // Water Upgrade Values:
    waterCapacity: 10,

    // Tool Selection
    selectedTool: 'Plow',
    selectedSeedType: 'wheat',

    achievementsUnlocked: [],   // Array to store the achievements the player has unlocked

}

let _sessionStartedAt = Date.now();

const gameState = { ...initialGameState };

function getState() {
    return { ...gameState };
}

function getStateSnapshot() {
    const fieldsShape = ensureFieldsStateShape(gameState);

    return {
        ...gameState,
        fields: buildFieldStateSnapshot(fieldsShape.fields),
        ownedFieldIds: [...fieldsShape.ownedFieldIds],
        activeFieldId: fieldsShape.activeFieldId,
        nextFieldNumber: fieldsShape.nextFieldNumber,
        plotStates: Array.isArray(gameState.plotStates)
            ? gameState.plotStates.map(plot => normalizePlotState(plot))
            : [],
        achievementsUnlocked: Array.isArray(gameState.achievementsUnlocked)
            ? [...gameState.achievementsUnlocked]
            : [],
        questsUnlocked: normalizeStringArray(gameState.questsUnlocked),
        questsActive: normalizeStringArray(gameState.questsActive),
        questsCompleted: normalizeStringArray(gameState.questsCompleted),
        questProgress: normalizeQuestProgress(gameState.questProgress),
    };
}

function applyStateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return;
    }

    const merged = {
        ...initialGameState,
        fields: buildFieldStateSnapshot(initialGameState.fields),
        ownedFieldIds: [...initialGameState.ownedFieldIds],
    };

    for (const key of Object.keys(initialGameState)) {
        if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
            merged[key] = snapshot[key];
        }
    }

    const fieldsShape = ensureFieldsStateShape(merged);
    reconcileFieldPlotTimers(fieldsShape.fields);

    const normalizedPlotStates = Array.isArray(merged.plotStates)
        ? merged.plotStates.map(plot => normalizePlotState(plot))
        : [];

    const normalizedAchievements = Array.isArray(merged.achievementsUnlocked)
        ? [...merged.achievementsUnlocked]
        : [];
    const normalizedQuestsUnlocked = normalizeStringArray(merged.questsUnlocked);
    const normalizedQuestsActive = normalizeStringArray(merged.questsActive);
    const normalizedQuestsCompleted = normalizeStringArray(merged.questsCompleted);
    const normalizedQuestProgress = normalizeQuestProgress(merged.questProgress);

    Object.assign(gameState, merged, {
        fields: fieldsShape.fields,
        ownedFieldIds: fieldsShape.ownedFieldIds,
        activeFieldId: fieldsShape.activeFieldId,
        nextFieldNumber: fieldsShape.nextFieldNumber,
        plotStates: normalizedPlotStates,
        achievementsUnlocked: normalizedAchievements,
        questsUnlocked: normalizedQuestsUnlocked,
        questsActive: normalizedQuestsActive,
        questsCompleted: normalizedQuestsCompleted,
        questProgress: normalizedQuestProgress,
    });

    gameState.gameStartedAt = normalizeGameStartedAt(gameState.gameStartedAt);

    if (!Number(gameState.nextFieldCost) || gameState.nextFieldCost < 1) {
        gameState.nextFieldCost = progressionConfig.storeEconomy.fieldPurchase.baseCost;
    }

    syncLegacyActiveField(gameState);
    _sessionStartedAt = Date.now();
}

function getPlayTimeMs() {
    const accumulated = Number(gameState.totalPlayTimeMs) || 0;
    return accumulated + (Date.now() - _sessionStartedAt);
}

function flushPlayTime() {
    if (!loadSnapshot()) {
        return;
    }

    updateState({ totalPlayTimeMs: getPlayTimeMs() });
    _sessionStartedAt = Date.now();
}

function updateState(updates) {
    Object.assign(gameState, updates);
    gameState.gameStartedAt = normalizeGameStartedAt(gameState.gameStartedAt);
    const fieldsShape = ensureFieldsStateShape(gameState);
    gameState.fields = fieldsShape.fields;
    gameState.ownedFieldIds = fieldsShape.ownedFieldIds;
    gameState.activeFieldId = fieldsShape.activeFieldId;
    gameState.nextFieldNumber = fieldsShape.nextFieldNumber;

    reconcileFieldPlotTimers(gameState.fields);
    syncLegacyActiveField(gameState);

    savePartialSnapshot({ gameState: getStateSnapshot() });
    document.dispatchEvent(new CustomEvent('stateUpdated'));
}

function getActiveField() {
    return getActiveFieldFromState(gameState);
}

function reconcileAllFieldsProgress() {
    const fieldsShape = ensureFieldsStateShape(gameState);
    gameState.fields = fieldsShape.fields;
    gameState.ownedFieldIds = fieldsShape.ownedFieldIds;
    gameState.activeFieldId = fieldsShape.activeFieldId;
    gameState.nextFieldNumber = fieldsShape.nextFieldNumber;

    reconcileFieldPlotTimers(gameState.fields);
    syncLegacyActiveField(gameState);
}

function incrementTotalClicks() {
    updateState({ totalClicksClicked: gameState.totalClicksClicked + 1 });
}

function logGameState() {
    const gameState = getState();
    console.log('Game State:', gameState);
}

export {
    getState,
    getStateSnapshot,
    applyStateSnapshot,
    updateState,
    logGameState,
    gameState,
    incrementTotalClicks,
    getActiveField,
    reconcileAllFieldsProgress,
    getPlayTimeMs,
    flushPlayTime,
};