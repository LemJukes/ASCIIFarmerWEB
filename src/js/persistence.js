const SAVE_KEY = 'asciiFarmerSavegame';
const SAVE_VERSION = 1;

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeSnapshot(raw) {
    if (!isObject(raw)) {
        return null;
    }

    return {
        version: typeof raw.version === 'number' ? raw.version : SAVE_VERSION,
        timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
        gameState: isObject(raw.gameState) ? raw.gameState : null,
        storeValues: isObject(raw.storeValues) ? raw.storeValues : null,
        upgradeValues: isObject(raw.upgradeValues) ? raw.upgradeValues : null,
    };
}

function loadSnapshot() {
    if (!canUseStorage()) {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        return sanitizeSnapshot(parsed);
    } catch (error) {
        console.warn('Failed to load savegame; using defaults.', error);
        return null;
    }
}

function savePartialSnapshot(partialSnapshot) {
    if (!canUseStorage() || !isObject(partialSnapshot)) {
        return;
    }

    const current = loadSnapshot() ?? {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        gameState: null,
        storeValues: null,
        upgradeValues: null,
    };

    const nextSnapshot = {
        ...current,
        ...partialSnapshot,
        version: SAVE_VERSION,
        timestamp: Date.now(),
    };

    try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(nextSnapshot));
    } catch (error) {
        console.warn('Failed to save savegame.', error);
    }
}

function clearSnapshot() {
    if (!canUseStorage()) {
        return;
    }

    window.localStorage.removeItem(SAVE_KEY);
}

export { SAVE_KEY, SAVE_VERSION, loadSnapshot, savePartialSnapshot, clearSnapshot };