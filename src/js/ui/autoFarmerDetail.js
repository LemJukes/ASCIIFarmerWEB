import { getState, updateState, incrementTotalClicks } from '../state.js';
import { showNotification } from './macNotifications.js';
import { updateResourceBar } from './resource.js';
import { updateClicksDisplay } from './clicks.js';
import { AUTO_FARMER_MIN_TICK_MS, getAutoFarmerUpgradeCost, getNextAutoFarmerTickMs } from '../configs/autoFarmerConfig.js';

const OVERLAY_ID = 'autofarmer-detail-overlay';
const WINDOW_ID = 'autofarmer-detail-window';
const SCREEN_MARGIN_PX = 8;
const ANCHOR_GAP_PX = 6;

let activeOverlay = null;
let activeEscHandler = null;
let returnFocusElement = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function toSeedLabel(seedType) {
    return `${seedType.charAt(0).toUpperCase()}${seedType.slice(1)} Seeds`;
}

function formatTickSeconds(tickMs) {
    return `${(Math.max(0, Number(tickMs) || 0) / 1000).toFixed(2)}s`;
}

function getTargetPlotLabel(autoFarmer) {
    const targetIndex = Number.isInteger(autoFarmer?.preferredTargetPlotIndex)
        ? Number(autoFarmer.preferredTargetPlotIndex)
        : null;

    if (targetIndex === null || targetIndex < 0) {
        return 'Auto (clockwise scan)';
    }

    return `Plot ${targetIndex + 1}`;
}

function getUnlockedSeedTypes(gameState) {
    const unlockedSeeds = ['wheat'];

    if (gameState.cornUnlocked) {
        unlockedSeeds.push('corn');
    }

    if (gameState.tomatoUnlocked) {
        unlockedSeeds.push('tomato');
    }

    return unlockedSeeds;
}

function getSelectedSeedType(gameState) {
    if (gameState.selectedSeedType === 'tomato' && gameState.tomatoUnlocked) {
        return 'tomato';
    }

    if (gameState.selectedSeedType === 'corn' && gameState.cornUnlocked) {
        return 'corn';
    }

    return 'wheat';
}

function resolveAutoFarmerSnapshot(fieldId, plotIndex) {
    const gameState = getState();
    const field = gameState.fields?.[fieldId];
    const plotState = field?.plotStates?.[plotIndex];
    const autoFarmer = plotState?.autoFarmer;

    if (!field || !plotState || !autoFarmer) {
        return null;
    }

    return {
        gameState,
        field,
        plotState,
        autoFarmer,
    };
}

function setAutoFarmerPreferredSeed(fieldId, plotIndex, preferredSeedType) {
    const snapshot = resolveAutoFarmerSnapshot(fieldId, plotIndex);
    if (!snapshot) {
        return false;
    }

    const nextPreferredSeedType = preferredSeedType === 'wheat'
        || preferredSeedType === 'corn'
        || preferredSeedType === 'tomato'
        ? preferredSeedType
        : null;

    const nextPlotStates = [...snapshot.field.plotStates];
    nextPlotStates[plotIndex] = {
        ...snapshot.plotState,
        autoFarmer: {
            ...snapshot.autoFarmer,
            preferredSeedType: nextPreferredSeedType,
        },
        lastUpdatedAt: Date.now(),
    };

    updateState({
        fields: {
            ...snapshot.gameState.fields,
            [fieldId]: {
                ...snapshot.field,
                plotStates: nextPlotStates,
            },
        },
    });

    return true;
}

function setAutoFarmerOperationalSettings(fieldId, plotIndex, updates = {}) {
    const snapshot = resolveAutoFarmerSnapshot(fieldId, plotIndex);
    if (!snapshot) {
        return false;
    }

    const nextPlotStates = [...snapshot.field.plotStates];
    nextPlotStates[plotIndex] = {
        ...snapshot.plotState,
        autoFarmer: {
            ...snapshot.autoFarmer,
            isPaused: typeof updates.isPaused === 'boolean' ? updates.isPaused : Boolean(snapshot.autoFarmer.isPaused),
            suppressWarnings: typeof updates.suppressWarnings === 'boolean'
                ? updates.suppressWarnings
                : Boolean(snapshot.autoFarmer.suppressWarnings),
        },
        lastUpdatedAt: Date.now(),
    };

    updateState({
        fields: {
            ...snapshot.gameState.fields,
            [fieldId]: {
                ...snapshot.field,
                plotStates: nextPlotStates,
            },
        },
    });

    return true;
}

function upgradeAutoFarmer(fieldId, plotIndex) {
    const snapshot = resolveAutoFarmerSnapshot(fieldId, plotIndex);
    if (!snapshot) {
        return { ok: false, error: 'AutoFarmer not found.' };
    }

    const currentLevel = Math.max(1, Number(snapshot.autoFarmer.level) || 1);
    const currentTickMs = Math.max(AUTO_FARMER_MIN_TICK_MS, Number(snapshot.autoFarmer.tickMs) || AUTO_FARMER_MIN_TICK_MS);
    const nextTickMs = getNextAutoFarmerTickMs(currentTickMs);

    if (nextTickMs >= currentTickMs) {
        return { ok: false, error: 'AutoFarmer click rate is already at the cap.' };
    }

    const upgradeCost = getAutoFarmerUpgradeCost(currentLevel);
    if (snapshot.gameState.coins < upgradeCost) {
        return { ok: false, error: `Need ${upgradeCost} coins to upgrade.` };
    }

    const nextPlotStates = [...snapshot.field.plotStates];
    nextPlotStates[plotIndex] = {
        ...snapshot.plotState,
        autoFarmer: {
            ...snapshot.autoFarmer,
            level: currentLevel + 1,
            tickMs: nextTickMs,
        },
        lastUpdatedAt: Date.now(),
    };

    updateState({
        coins: snapshot.gameState.coins - upgradeCost,
        totalCoinsSpent: Number(snapshot.gameState.totalCoinsSpent) + upgradeCost,
        fields: {
            ...snapshot.gameState.fields,
            [fieldId]: {
                ...snapshot.field,
                plotStates: nextPlotStates,
            },
        },
    });

    updateResourceBar();
    incrementTotalClicks();
    updateClicksDisplay();

    return { ok: true };
}

function closeAutoFarmerDetailWindow() {
    if (activeEscHandler) {
        document.removeEventListener('keydown', activeEscHandler);
        activeEscHandler = null;
    }

    if (activeOverlay && activeOverlay.parentElement) {
        activeOverlay.parentElement.removeChild(activeOverlay);
    }

    activeOverlay = null;

    if (returnFocusElement instanceof HTMLElement && typeof returnFocusElement.focus === 'function') {
        returnFocusElement.focus();
    }

    returnFocusElement = null;
}

function buildTitlebar(onClose) {
    const titlebar = document.createElement('div');
    titlebar.className = 'mac-titlebar';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mac-close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close AutoFarmer details');
    closeBtn.setAttribute('title', 'Close AutoFarmer details');
    closeBtn.addEventListener('click', onClose);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'mac-title';
    titleSpan.textContent = 'AutoFarmer Details';

    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'mac-zoom-btn';
    zoomBtn.type = 'button';
    zoomBtn.setAttribute('aria-hidden', 'true');
    zoomBtn.setAttribute('tabindex', '-1');

    titlebar.append(closeBtn, titleSpan, zoomBtn);
    return titlebar;
}

function buildPanelContent({ fieldId, plotIndex, onRefresh }) {
    const snapshot = resolveAutoFarmerSnapshot(fieldId, plotIndex);
    if (!snapshot) {
        return null;
    }

    const content = document.createElement('div');
    content.className = 'mac-dialog-content autofarmer-detail-content';

    const plotNumberText = document.createElement('p');
    plotNumberText.className = 'autofarmer-detail-meta';
    plotNumberText.textContent = `Plot: ${plotIndex + 1}`;

    const levelText = document.createElement('p');
    levelText.className = 'autofarmer-detail-meta';
    levelText.textContent = `Level: ${Math.max(1, Number(snapshot.autoFarmer.level) || 1)}`;

    const clickRateText = document.createElement('p');
    clickRateText.className = 'autofarmer-detail-meta';
    clickRateText.textContent = `Click Rate: ${formatTickSeconds(snapshot.autoFarmer.tickMs)} / click`;

    const targetText = document.createElement('p');
    targetText.className = 'autofarmer-detail-meta';
    targetText.textContent = `Plot Target: ${getTargetPlotLabel(snapshot.autoFarmer)}`;

    const modeText = document.createElement('p');
    modeText.className = 'autofarmer-detail-mode';

    const selectedSeedType = getSelectedSeedType(snapshot.gameState);
    const preferredSeedType = snapshot.autoFarmer.preferredSeedType;

    if (preferredSeedType) {
        modeText.textContent = `Mode: Preferred seed (${toSeedLabel(preferredSeedType)})`;
    } else {
        modeText.textContent = `Mode: Using selected seed (${toSeedLabel(selectedSeedType)})`;
    }

    const operationText = document.createElement('p');
    operationText.className = 'autofarmer-detail-mode';
    operationText.textContent = `Operation: ${snapshot.autoFarmer.isPaused ? 'Paused' : 'Running'}`;

    const seedRow = document.createElement('div');
    seedRow.className = 'autofarmer-detail-seed-row';

    const seedLabel = document.createElement('label');
    seedLabel.className = 'autofarmer-detail-label';
    seedLabel.setAttribute('for', 'autofarmer-detail-seed-select');
    seedLabel.textContent = 'Seed Selector:';

    const seedSelect = document.createElement('select');
    seedSelect.id = 'autofarmer-detail-seed-select';
    seedSelect.className = 'store-button autofarmer-detail-select';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Use currently selected seed';
    seedSelect.appendChild(defaultOption);

    const unlockedSeeds = getUnlockedSeedTypes(snapshot.gameState);
    unlockedSeeds.forEach((seedType) => {
        const option = document.createElement('option');
        option.value = seedType;
        option.textContent = toSeedLabel(seedType);
        seedSelect.appendChild(option);
    });

    seedSelect.value = preferredSeedType || '';

    const footer = document.createElement('div');
    footer.className = 'mac-button-group autofarmer-detail-actions';

    const operationBtn = document.createElement('button');
    operationBtn.className = 'mac-button';
    operationBtn.type = 'button';
    operationBtn.textContent = snapshot.autoFarmer.isPaused ? 'Resume Operation' : 'Pause Operation';
    operationBtn.addEventListener('click', () => {
        setAutoFarmerOperationalSettings(fieldId, plotIndex, {
            isPaused: !snapshot.autoFarmer.isPaused,
        });

        if (typeof onRefresh === 'function') {
            onRefresh();
        }
    });

    const upgradeButton = document.createElement('button');
    upgradeButton.className = 'mac-button';
    upgradeButton.type = 'button';
    const upgradeCost = getAutoFarmerUpgradeCost(snapshot.autoFarmer.level);
    const nextTickMs = getNextAutoFarmerTickMs(snapshot.autoFarmer.tickMs);
    const isAtCap = nextTickMs >= Number(snapshot.autoFarmer.tickMs);

    if (isAtCap) {
        upgradeButton.textContent = 'Rate Maxed';
        upgradeButton.disabled = true;
    } else {
        upgradeButton.textContent = `Upgrade (${upgradeCost}c)`;
    }

    upgradeButton.addEventListener('click', async () => {
        const result = upgradeAutoFarmer(fieldId, plotIndex);
        if (!result.ok) {
            await showNotification(result.error, 'AutoFarmer Upgrade');
            return;
        }

        if (typeof onRefresh === 'function') {
            onRefresh();
        }
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'mac-button';
    clearBtn.type = 'button';
    clearBtn.textContent = 'Default';
    clearBtn.addEventListener('click', () => {
        setAutoFarmerPreferredSeed(fieldId, plotIndex, null);
        closeAutoFarmerDetailWindow();
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'mac-button';
    saveBtn.type = 'button';
    saveBtn.textContent = 'Apply';
    saveBtn.addEventListener('click', () => {
        const nextSeedType = seedSelect.value || null;
        setAutoFarmerPreferredSeed(fieldId, plotIndex, nextSeedType);
        closeAutoFarmerDetailWindow();
    });

    const suppressWarningsRow = document.createElement('label');
    suppressWarningsRow.className = 'autofarmer-detail-toggle-row';

    const suppressWarningsToggle = document.createElement('input');
    suppressWarningsToggle.type = 'checkbox';
    suppressWarningsToggle.checked = Boolean(snapshot.autoFarmer.suppressWarnings);
    suppressWarningsToggle.setAttribute('aria-label', 'Suppress AutoFarmer popup warnings');

    const suppressWarningsText = document.createElement('span');
    suppressWarningsText.textContent = 'Suppress popup warnings';

    suppressWarningsToggle.addEventListener('change', () => {
        setAutoFarmerOperationalSettings(fieldId, plotIndex, {
            suppressWarnings: suppressWarningsToggle.checked,
        });
    });

    suppressWarningsRow.append(suppressWarningsToggle, suppressWarningsText);

    footer.append(clearBtn, saveBtn);
    seedRow.append(seedLabel, seedSelect);
    content.append(
        plotNumberText,
        levelText,
        clickRateText,
        targetText,
        modeText,
        operationText,
        seedRow,
        suppressWarningsRow,
        operationBtn,
        upgradeButton,
        footer,
    );

    return content;
}

function positionWindow(windowEl, anchorRect) {
    const leftRoom = anchorRect.left - SCREEN_MARGIN_PX;
    const rightRoom = window.innerWidth - anchorRect.right - SCREEN_MARGIN_PX;
    const shouldExpandRight = rightRoom >= leftRoom;

    const maxTop = Math.max(SCREEN_MARGIN_PX, window.innerHeight - 220);
    const topValue = clamp(anchorRect.top - 8, SCREEN_MARGIN_PX, maxTop);
    windowEl.style.top = `${Math.round(topValue)}px`;

    if (shouldExpandRight) {
        const left = clamp(anchorRect.right + ANCHOR_GAP_PX, SCREEN_MARGIN_PX, window.innerWidth - 80);
        windowEl.style.left = `${Math.round(left)}px`;
        windowEl.style.right = `${SCREEN_MARGIN_PX}px`;
        windowEl.classList.add('autofarmer-detail-window--expand-right');
        return;
    }

    const right = clamp((window.innerWidth - anchorRect.left) + ANCHOR_GAP_PX, SCREEN_MARGIN_PX, window.innerWidth - 80);
    windowEl.style.left = `${SCREEN_MARGIN_PX}px`;
    windowEl.style.right = `${Math.round(right)}px`;
    windowEl.classList.add('autofarmer-detail-window--expand-left');
}

export function showAutoFarmerDetailWindow({ plot, plotIndex, fieldId }) {
    if (!(plot instanceof HTMLElement)) {
        return;
    }

    closeAutoFarmerDetailWindow();

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'autofarmer-detail-overlay autofarmer-detail-overlay--visible';
    overlay.setAttribute('aria-hidden', 'false');

    const detailWindow = document.createElement('div');
    detailWindow.id = WINDOW_ID;
    detailWindow.className = 'mac-window mac-dialog-window autofarmer-detail-window';
    detailWindow.setAttribute('role', 'dialog');
    detailWindow.setAttribute('aria-modal', 'true');
    detailWindow.setAttribute('aria-label', `AutoFarmer details for plot ${plotIndex + 1}`);

    const anchorRect = plot.getBoundingClientRect();
    positionWindow(detailWindow, anchorRect);

    const refreshContent = () => {
        const nextContent = buildPanelContent({ fieldId, plotIndex, onRefresh: refreshContent });
        if (!nextContent) {
            closeAutoFarmerDetailWindow();
            return;
        }

        detailWindow.replaceChildren(buildTitlebar(closeAutoFarmerDetailWindow), nextContent);
    };

    refreshContent();
    overlay.appendChild(detailWindow);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeAutoFarmerDetailWindow();
        }
    });

    activeEscHandler = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeAutoFarmerDetailWindow();
        }
    };

    document.addEventListener('keydown', activeEscHandler);
    document.body.appendChild(overlay);
    activeOverlay = overlay;
    returnFocusElement = plot;
}
