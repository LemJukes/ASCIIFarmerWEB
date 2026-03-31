import { getState, updateState, incrementTotalClicks } from '../state.js';
import { showNotification } from './macNotifications.js';
import { updateResourceBar } from './resource.js';
import { updateClicksDisplay } from './clicks.js';
import {
    STATION_CAPACITY_PER_BUILDING,
    getNextStationEfficiencyPercent,
    getProcessingStationUpgradeCost,
    computeStationCostPerClick,
    formatStationCostPerClick,
} from '../configs/stationConfig.js';

const OVERLAY_ID = 'processingstation-detail-overlay';
const WINDOW_ID = 'processingstation-detail-window';
const SCREEN_MARGIN_PX = 8;
const ANCHOR_GAP_PX = 6;

let activeOverlay = null;
let activeEscHandler = null;
let returnFocusElement = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function resolveSnapshot(fieldId, plotIndex) {
    const gameState = getState();
    const field = gameState.fields?.[fieldId];
    const plotState = field?.plotStates?.[plotIndex];

    if (!field || !plotState || !plotState.processingStation) {
        return null;
    }

    return { gameState, field, plotState };
}

function closeProcessingStationDetailWindow() {
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

function linkAutoFarmer(fieldId, stationPlotIndex, autoFarmerPlotIndex) {
    const snapshot = resolveSnapshot(fieldId, stationPlotIndex);
    if (!snapshot) {
        return { ok: false, error: 'Processing Station not found.' };
    }

    const station = snapshot.plotState.processingStation;
    const linkedSet = new Set(station.linkedAutoFarmerPlotIndices || []);

    if (linkedSet.has(autoFarmerPlotIndex)) {
        return { ok: false, error: 'AutoFarmer is already linked to this Processing Station.' };
    }

    if (linkedSet.size >= STATION_CAPACITY_PER_BUILDING) {
        return { ok: false, error: 'This Processing Station is already at max capacity.' };
    }

    const autoFarmerPlot = snapshot.field.plotStates?.[autoFarmerPlotIndex];
    if (!autoFarmerPlot?.autoFarmer) {
        return { ok: false, error: 'Selected plot does not contain an AutoFarmer.' };
    }

    if (Number.isInteger(autoFarmerPlot.autoFarmer.linkedProcessingStationPlotIndex)) {
        return { ok: false, error: 'AutoFarmer is already linked to another Processing Station.' };
    }

    const nextPlotStates = [...snapshot.field.plotStates];
    const stationPlot = { ...nextPlotStates[stationPlotIndex] };
    stationPlot.processingStation = {
        ...stationPlot.processingStation,
        linkedAutoFarmerPlotIndices: [...linkedSet, autoFarmerPlotIndex].sort((a, b) => a - b),
        lastErrorCode: null,
        lastErrorMessage: '',
    };
    stationPlot.lastUpdatedAt = Date.now();
    nextPlotStates[stationPlotIndex] = stationPlot;

    const nextAutoFarmerPlot = { ...nextPlotStates[autoFarmerPlotIndex] };
    nextAutoFarmerPlot.autoFarmer = {
        ...nextAutoFarmerPlot.autoFarmer,
        linkedProcessingStationPlotIndex: stationPlotIndex,
        lastErrorCode: null,
        lastErrorMessage: '',
        flashingUntil: 0,
    };
    nextAutoFarmerPlot.lastUpdatedAt = Date.now();
    nextPlotStates[autoFarmerPlotIndex] = nextAutoFarmerPlot;

    updateState({
        fields: {
            ...snapshot.gameState.fields,
            [fieldId]: {
                ...snapshot.field,
                plotStates: nextPlotStates,
            },
        },
    });

    return { ok: true };
}

function unlinkAutoFarmer(fieldId, stationPlotIndex, autoFarmerPlotIndex) {
    const snapshot = resolveSnapshot(fieldId, stationPlotIndex);
    if (!snapshot) {
        return { ok: false, error: 'Processing Station not found.' };
    }

    const station = snapshot.plotState.processingStation;
    const linked = Array.isArray(station.linkedAutoFarmerPlotIndices)
        ? station.linkedAutoFarmerPlotIndices
        : [];

    if (!linked.includes(autoFarmerPlotIndex)) {
        return { ok: false, error: 'AutoFarmer is not linked to this Processing Station.' };
    }

    const nextPlotStates = [...snapshot.field.plotStates];
    const stationPlot = { ...nextPlotStates[stationPlotIndex] };
    stationPlot.processingStation = {
        ...stationPlot.processingStation,
        linkedAutoFarmerPlotIndices: linked.filter((idx) => idx !== autoFarmerPlotIndex),
    };
    stationPlot.lastUpdatedAt = Date.now();
    nextPlotStates[stationPlotIndex] = stationPlot;

    const nextAutoFarmerPlot = { ...nextPlotStates[autoFarmerPlotIndex] };
    if (nextAutoFarmerPlot?.autoFarmer) {
        nextAutoFarmerPlot.autoFarmer = {
            ...nextAutoFarmerPlot.autoFarmer,
            linkedProcessingStationPlotIndex: null,
            lastErrorCode: 'INFRASTRUCTURE_MISSING',
            lastErrorMessage: 'Processing link removed.',
            flashingUntil: Date.now() + 1200,
        };
        nextAutoFarmerPlot.lastUpdatedAt = Date.now();
        nextPlotStates[autoFarmerPlotIndex] = nextAutoFarmerPlot;
    }

    updateState({
        fields: {
            ...snapshot.gameState.fields,
            [fieldId]: {
                ...snapshot.field,
                plotStates: nextPlotStates,
            },
        },
    });

    return { ok: true };
}

function upgradeProcessingStation(fieldId, plotIndex) {
    const snapshot = resolveSnapshot(fieldId, plotIndex);
    if (!snapshot) {
        return { ok: false, error: 'Processing Station not found.' };
    }

    const station = snapshot.plotState.processingStation;
    const level = Math.max(1, Number(station.level) || 1);
    const currentEfficiency = Number(station.efficiencyPercent) || 10;
    const nextEfficiency = getNextStationEfficiencyPercent(currentEfficiency);

    if (nextEfficiency <= currentEfficiency) {
        return { ok: false, error: 'Processing Station efficiency is already at max.' };
    }

    const cost = getProcessingStationUpgradeCost(level);
    if (snapshot.gameState.coins < cost) {
        return { ok: false, error: `Need ${cost} coins to upgrade.` };
    }

    const nextPlotStates = [...snapshot.field.plotStates];
    const nextPlot = { ...snapshot.plotState };
    nextPlot.processingStation = {
        ...station,
        level: level + 1,
        efficiencyPercent: nextEfficiency,
        costPerClick: computeStationCostPerClick(nextEfficiency),
    };
    nextPlot.lastUpdatedAt = Date.now();
    nextPlotStates[plotIndex] = nextPlot;

    updateState({
        coins: snapshot.gameState.coins - cost,
        totalCoinsSpent: Number(snapshot.gameState.totalCoinsSpent) + cost,
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

function buildTitlebar(onClose) {
    const titlebar = document.createElement('div');
    titlebar.className = 'mac-titlebar';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mac-close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close Processing Station details');
    closeBtn.setAttribute('title', 'Close Processing Station details');
    closeBtn.addEventListener('click', onClose);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'mac-title';
    titleSpan.textContent = 'Processing Station Details';

    titlebar.append(closeBtn, titleSpan);
    return titlebar;
}

function buildPanelContent({ fieldId, plotIndex, onRefresh }) {
    const snapshot = resolveSnapshot(fieldId, plotIndex);
    if (!snapshot) {
        return null;
    }

    const station = snapshot.plotState.processingStation;
    const content = document.createElement('div');
    content.className = 'mac-dialog-content station-detail-content';

    const lines = [
        `Plot: ${plotIndex + 1}`,
        `Level: ${station.level}`,
        `Efficiency: ${station.efficiencyPercent}%`,
        `Cost/Click: ${formatStationCostPerClick(station.costPerClick)}`,
        `Linked AutoFarmers: ${(station.linkedAutoFarmerPlotIndices || []).length}/${STATION_CAPACITY_PER_BUILDING}`,
    ];

    lines.forEach((text) => {
        const line = document.createElement('p');
        line.className = 'station-detail-meta';
        line.textContent = text;
        content.appendChild(line);
    });

    const selectRow = document.createElement('div');
    selectRow.className = 'station-detail-link-row';

    const label = document.createElement('label');
    label.className = 'station-detail-label';
    label.textContent = 'Link AutoFarmer:';
    label.setAttribute('for', 'processingstation-detail-link-select');

    const select = document.createElement('select');
    select.id = 'processingstation-detail-link-select';
    select.className = 'store-button station-detail-select';

    const linkedSet = new Set(station.linkedAutoFarmerPlotIndices || []);
    const availableAutoFarmers = snapshot.field.plotStates
        .map((plotState, idx) => ({ plotState, idx }))
        .filter(({ plotState, idx }) => idx !== plotIndex && !!plotState?.autoFarmer && !Number.isInteger(plotState.autoFarmer.linkedProcessingStationPlotIndex));

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = availableAutoFarmers.length ? 'Select AutoFarmer to link' : 'No available AutoFarmers';
    select.appendChild(placeholder);

    availableAutoFarmers.forEach(({ idx }) => {
        const option = document.createElement('option');
        option.value = String(idx);
        option.textContent = `Plot ${idx + 1}`;
        select.appendChild(option);
    });

    const linkButton = document.createElement('button');
    linkButton.className = 'mac-button';
    linkButton.type = 'button';
    linkButton.textContent = 'Link';
    linkButton.disabled = availableAutoFarmers.length === 0 || linkedSet.size >= STATION_CAPACITY_PER_BUILDING;
    linkButton.addEventListener('click', async () => {
        const selected = Number.parseInt(select.value, 10);
        if (!Number.isInteger(selected)) {
            await showNotification('Select an AutoFarmer to link.', 'Processing Station');
            return;
        }

        const result = linkAutoFarmer(fieldId, plotIndex, selected);
        if (!result.ok) {
            await showNotification(result.error, 'Processing Station');
            return;
        }

        onRefresh();
    });

    selectRow.append(label, select, linkButton);
    content.appendChild(selectRow);

    const linkedList = document.createElement('div');
    linkedList.className = 'station-detail-linked-list';

    if ((station.linkedAutoFarmerPlotIndices || []).length === 0) {
        const empty = document.createElement('p');
        empty.className = 'station-detail-meta';
        empty.textContent = 'No linked AutoFarmers.';
        linkedList.appendChild(empty);
    } else {
        station.linkedAutoFarmerPlotIndices.forEach((linkedPlotIndex) => {
            const row = document.createElement('div');
            row.className = 'station-detail-linked-row';

            const text = document.createElement('span');
            text.className = 'station-detail-meta';
            text.textContent = `Plot ${linkedPlotIndex + 1}`;

            const unlinkBtn = document.createElement('button');
            unlinkBtn.className = 'mac-button';
            unlinkBtn.type = 'button';
            unlinkBtn.textContent = 'Unlink';
            unlinkBtn.addEventListener('click', async () => {
                const result = unlinkAutoFarmer(fieldId, plotIndex, linkedPlotIndex);
                if (!result.ok) {
                    await showNotification(result.error, 'Processing Station');
                    return;
                }

                onRefresh();
            });

            row.append(text, unlinkBtn);
            linkedList.appendChild(row);
        });
    }

    content.appendChild(linkedList);

    const upgradeButton = document.createElement('button');
    upgradeButton.className = 'mac-button';
    upgradeButton.type = 'button';
    const upgradeCost = getProcessingStationUpgradeCost(station.level);
    const nextEfficiency = getNextStationEfficiencyPercent(station.efficiencyPercent);

    if (nextEfficiency <= station.efficiencyPercent) {
        upgradeButton.textContent = 'Efficiency Maxed';
        upgradeButton.disabled = true;
    } else {
        upgradeButton.textContent = `Upgrade Efficiency (${upgradeCost}c)`;
    }

    upgradeButton.addEventListener('click', async () => {
        const result = upgradeProcessingStation(fieldId, plotIndex);
        if (!result.ok) {
            await showNotification(result.error, 'Processing Station Upgrade');
            return;
        }

        onRefresh();
    });

    content.appendChild(upgradeButton);
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
        windowEl.style.right = 'auto';
        windowEl.classList.add('station-detail-window--expand-right');
        return;
    }

    const right = clamp((window.innerWidth - anchorRect.left) + ANCHOR_GAP_PX, SCREEN_MARGIN_PX, window.innerWidth - 80);
    windowEl.style.left = 'auto';
    windowEl.style.right = `${Math.round(right)}px`;
    windowEl.classList.add('station-detail-window--expand-left');
}

export function showProcessingStationDetailWindow({ plot, plotIndex, fieldId }) {
    if (!(plot instanceof HTMLElement)) {
        return;
    }

    closeProcessingStationDetailWindow();

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'station-detail-overlay station-detail-overlay--visible';
    overlay.setAttribute('aria-hidden', 'false');

    const detailWindow = document.createElement('div');
    detailWindow.id = WINDOW_ID;
    detailWindow.className = 'mac-window mac-dialog-window station-detail-window';
    detailWindow.setAttribute('role', 'dialog');
    detailWindow.setAttribute('aria-modal', 'true');
    detailWindow.setAttribute('aria-label', `Processing Station details for plot ${plotIndex + 1}`);

    const anchorRect = plot.getBoundingClientRect();
    positionWindow(detailWindow, anchorRect);

    const refreshContent = () => {
        const nextContent = buildPanelContent({ fieldId, plotIndex, onRefresh: refreshContent });
        if (!nextContent) {
            closeProcessingStationDetailWindow();
            return;
        }

        detailWindow.replaceChildren(buildTitlebar(closeProcessingStationDetailWindow), nextContent);
    };

    refreshContent();
    overlay.appendChild(detailWindow);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeProcessingStationDetailWindow();
        }
    });

    activeEscHandler = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeProcessingStationDetailWindow();
        }
    };

    document.addEventListener('keydown', activeEscHandler);
    document.body.appendChild(overlay);
    activeOverlay = overlay;
    returnFocusElement = plot;
}
