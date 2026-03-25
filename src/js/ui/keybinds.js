import { DEFAULT_KEYBINDS, KEYBIND_ACTIONS, KEYBINDS_STORAGE_KEY, DEFAULT_PLOT_MAPPINGS, PLOT_KEY_ACTIONS, PLOT_MAPPINGS_STORAGE_KEY } from '../configs/keybindsConfig.js';
import { showNotification } from './macNotifications.js';

let activePlotMappings = loadPlotMappings();
let activeKeybinds = loadKeybinds();
let actionByKeyLookup = buildActionByKey(activeKeybinds, activePlotMappings);
let keybindOverlay = null;
let keybindWindow = null;
let keybindInputsContainer = null;
let keybindErrorEl = null;

export function normalizeKeybind(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().slice(0, 1).toUpperCase();
}

function isValidKeybind(value) {
    return /^[A-Z0-9]$/.test(value);
}

function cloneDefaultKeybinds() {
    return { ...DEFAULT_KEYBINDS };
}

function cloneDefaultPlotMappings() {
    return { ...DEFAULT_PLOT_MAPPINGS };
}

function sanitizePlotMappings(raw) {
    const sanitized = cloneDefaultPlotMappings();

    if (!raw || typeof raw !== 'object') {
        return sanitized;
    }

    PLOT_KEY_ACTIONS.forEach((action) => {
        const parsed = parseInt(raw[action.id], 10);
        sanitized[action.id] = Number.isInteger(parsed) && parsed >= 1 ? parsed : action.defaultTargetPlot;
    });

    return sanitized;
}

export function loadPlotMappings() {
    const rawValue = localStorage.getItem(PLOT_MAPPINGS_STORAGE_KEY);
    if (!rawValue) {
        return cloneDefaultPlotMappings();
    }

    try {
        const parsed = JSON.parse(rawValue);
        return sanitizePlotMappings(parsed);
    } catch {
        return cloneDefaultPlotMappings();
    }
}

export function validatePlotMappings(mappingsObject) {
    for (const action of PLOT_KEY_ACTIONS) {
        const parsed = parseInt(mappingsObject[action.id], 10);
        if (!Number.isInteger(parsed) || parsed < 1) {
            return {
                ok: false,
                error: `${action.label}: plot number must be 1 or greater.`,
            };
        }
    }
    return { ok: true };
}

export function savePlotMappings(mappingsObject) {
    const sanitized = sanitizePlotMappings(mappingsObject);
    localStorage.setItem(PLOT_MAPPINGS_STORAGE_KEY, JSON.stringify(sanitized));
    activePlotMappings = sanitized;
    actionByKeyLookup = buildActionByKey(activeKeybinds, activePlotMappings);
    return { ok: true };
}

function isDigitKey(value) {
    return /^[0-9]$/.test(value);
}

function sanitizeKeybinds(rawKeybinds) {
    const sanitized = cloneDefaultKeybinds();

    if (!rawKeybinds || typeof rawKeybinds !== 'object') {
        return sanitized;
    }

    KEYBIND_ACTIONS.forEach((action) => {
        const normalized = normalizeKeybind(rawKeybinds[action.id]);
        // Digit keys are reserved for plot navigation; fall back to default if one slips in
        const valid = isValidKeybind(normalized) && !isDigitKey(normalized);
        sanitized[action.id] = valid ? normalized : DEFAULT_KEYBINDS[action.id];
    });

    return sanitized;
}

function buildActionByKey(keybinds, plotMappings) {
    const lookup = {};

    KEYBIND_ACTIONS.forEach((action) => {
        const boundKey = normalizeKeybind(keybinds[action.id]);
        if (!boundKey) {
            return;
        }

        lookup[boundKey] = action;
    });

    // Plot keys are permanently fixed (1–0); only the target plot number is configurable.
    PLOT_KEY_ACTIONS.forEach((action) => {
        const targetPlot = (plotMappings && plotMappings[action.id]) ?? action.defaultTargetPlot;
        lookup[action.key] = { id: action.id, type: 'plot', value: targetPlot - 1 };
    });

    return lookup;
}

export function validateKeybinds(keybindsObject) {
    const seenByKey = {};
    const duplicates = [];

    for (const action of KEYBIND_ACTIONS) {
        const normalized = normalizeKeybind(keybindsObject[action.id]);

        if (!isValidKeybind(normalized)) {
            return {
                ok: false,
                error: `Invalid key for ${action.label}. Use one letter (A–Z) for each keybind.`,
            };
        }

        if (isDigitKey(normalized)) {
            return {
                ok: false,
                error: `Keys 0–9 are reserved for plot navigation and cannot be rebound.`,
            };
        }

        if (seenByKey[normalized]) {
            duplicates.push(`${seenByKey[normalized].label} and ${action.label} both use ${normalized}`);
        } else {
            seenByKey[normalized] = action;
        }
    }

    if (duplicates.length > 0) {
        return {
            ok: false,
            error: `Duplicate keybinds are not allowed: ${duplicates.join('; ')}`,
        };
    }

    return { ok: true };
}

export function loadKeybinds() {
    const rawValue = localStorage.getItem(KEYBINDS_STORAGE_KEY);
    if (!rawValue) {
        return cloneDefaultKeybinds();
    }

    try {
        const parsed = JSON.parse(rawValue);
        return sanitizeKeybinds(parsed);
    } catch {
        return cloneDefaultKeybinds();
    }
}

export function saveKeybinds(keybindsObject) {
    const sanitized = sanitizeKeybinds(keybindsObject);
    const validation = validateKeybinds(sanitized);
    if (!validation.ok) {
        return validation;
    }

    localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(sanitized));
    activeKeybinds = sanitized;
    actionByKeyLookup = buildActionByKey(activeKeybinds, activePlotMappings);
    return { ok: true };
}

export function getBoundActionForKey(eventKey) {
    const normalized = normalizeKeybind(eventKey);
    if (!normalized) {
        return null;
    }

    return actionByKeyLookup[normalized] ?? null;
}

function setError(message) {
    if (!keybindErrorEl) {
        return;
    }

    keybindErrorEl.textContent = message || '';
    keybindErrorEl.hidden = !message;
}

export function bindKeyInput(inputEl) {
    if (!inputEl) {
        return;
    }

    inputEl.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (event.key === 'Tab') {
            return;
        }

        event.preventDefault();

        const normalized = normalizeKeybind(event.key);

        if (isDigitKey(normalized)) {
            setError('Keys 0–9 are reserved for plot navigation and cannot be rebound.');
            return;
        }

        if (!isValidKeybind(normalized)) {
            setError('Use one letter (A–Z) for each keybind.');
            return;
        }

        inputEl.value = normalized;
        setError('');
    });
}

function bindPlotNumberInput(inputEl) {
    if (!inputEl) {
        return;
    }

    inputEl.addEventListener('input', () => {
        // Strip any non-digit characters as the user types
        const digits = inputEl.value.replace(/\D/g, '');
        inputEl.value = digits;
        setError('');
    });
}

function createTitlebar(onClose) {
    const titlebar = document.createElement('div');
    titlebar.className = 'mac-titlebar';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mac-close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Cancel keybind changes');
    closeBtn.setAttribute('title', 'Cancel keybind changes');
    closeBtn.addEventListener('click', onClose);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'mac-title';
    titleSpan.textContent = 'Keybinds';

    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'mac-zoom-btn';
    zoomBtn.type = 'button';
    zoomBtn.setAttribute('aria-hidden', 'true');
    zoomBtn.setAttribute('tabindex', '-1');

    titlebar.append(closeBtn, titleSpan, zoomBtn);
    return titlebar;
}

function buildKeybindRow(action) {
    const row = document.createElement('li');
    row.className = 'keybinds-row';

    const label = document.createElement('label');
    label.className = 'keybinds-action';
    label.setAttribute('for', `keybind-input-${action.id}`);
    label.textContent = action.label;

    const equals = document.createElement('span');
    equals.className = 'keybinds-equals';
    equals.textContent = '=';

    const input = document.createElement('input');
    input.className = 'keybinds-input';
    input.id = `keybind-input-${action.id}`;
    input.name = action.id;
    input.type = 'text';
    input.maxLength = 1;
    input.readOnly = true;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', `${action.label} keybind`);
    bindKeyInput(input);

    row.append(label, equals, input);
    return row;
}

function buildPlotRow(action) {
    const row = document.createElement('li');
    row.className = 'keybinds-row';

    const label = document.createElement('label');
    label.className = 'keybinds-action';
    label.setAttribute('for', `plot-input-${action.id}`);
    label.textContent = action.label;

    const equals = document.createElement('span');
    equals.className = 'keybinds-equals';
    equals.textContent = '=';

    const input = document.createElement('input');
    input.className = 'keybinds-input keybinds-input--plot';
    input.id = `plot-input-${action.id}`;
    input.name = action.id;
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 3;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', `${action.label} number`);
    bindPlotNumberInput(input);

    row.append(label, equals, input);
    return row;
}

export function createKeybindsWindowContent() {
    const content = document.createElement('div');
    content.className = 'mac-dialog-content keybinds-dialog-content';

    // --- Tool & seed keybinds section ---
    const keybindsSection = document.createElement('section');
    keybindsSection.className = 'keybinds-section';

    const keybindsHeading = document.createElement('h3');
    keybindsHeading.className = 'keybinds-section-heading';
    keybindsHeading.textContent = 'Tool & Seed Keys';

    const list = document.createElement('ul');
    list.className = 'keybinds-list';
    list.setAttribute('aria-label', 'Tool and seed keybind settings');

    KEYBIND_ACTIONS.forEach((action) => list.appendChild(buildKeybindRow(action)));

    keybindsSection.append(keybindsHeading, list);

    // --- Plot navigation section ---
    const plotSection = document.createElement('section');
    plotSection.className = 'keybinds-section';

    const plotHeading = document.createElement('h3');
    plotHeading.className = 'keybinds-section-heading';
    plotHeading.textContent = 'Plot Navigation Keys';

    const plotDesc = document.createElement('p');
    plotDesc.className = 'keybinds-section-desc';
    plotDesc.textContent = 'Keys 0\u20139 are permanently reserved for plot navigation. Edit the number in each row to choose which plot that key will select.';

    const plotList = document.createElement('ul');
    plotList.className = 'keybinds-list';
    plotList.setAttribute('aria-label', 'Plot navigation key settings');

    PLOT_KEY_ACTIONS.forEach((action) => plotList.appendChild(buildPlotRow(action)));

    plotSection.append(plotHeading, plotDesc, plotList);

    // --- Footer ---
    const error = document.createElement('p');
    error.className = 'keybinds-error';
    error.hidden = true;

    const actionsRow = document.createElement('div');
    actionsRow.className = 'keybinds-actions-row';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'mac-button';
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset Keybinds';

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'mac-button-group';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'mac-button';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';

    const okBtn = document.createElement('button');
    okBtn.className = 'mac-button';
    okBtn.type = 'button';
    okBtn.textContent = 'OK';

    buttonGroup.append(cancelBtn, okBtn);
    actionsRow.append(resetBtn, buttonGroup);
    content.append(keybindsSection, plotSection, error, actionsRow);

    return {
        content,
        list,
        error,
        resetBtn,
        cancelBtn,
        okBtn,
    };
}

function collectDraftKeybinds() {
    const draft = cloneDefaultKeybinds();

    KEYBIND_ACTIONS.forEach((action) => {
        const inputEl = document.getElementById(`keybind-input-${action.id}`);
        draft[action.id] = normalizeKeybind(inputEl?.value || DEFAULT_KEYBINDS[action.id]);
    });

    return draft;
}

function collectDraftPlotMappings() {
    const draft = cloneDefaultPlotMappings();

    PLOT_KEY_ACTIONS.forEach((action) => {
        const inputEl = document.getElementById(`plot-input-${action.id}`);
        const parsed = parseInt(inputEl?.value, 10);
        draft[action.id] = Number.isInteger(parsed) && parsed >= 1 ? parsed : action.defaultTargetPlot;
    });

    return draft;
}

function hydrateInputsFromActiveKeybinds() {
    if (!keybindInputsContainer) {
        return;
    }

    KEYBIND_ACTIONS.forEach((action) => {
        const inputEl = document.getElementById(`keybind-input-${action.id}`);
        if (inputEl) {
            inputEl.value = normalizeKeybind(activeKeybinds[action.id]);
        }
    });

    PLOT_KEY_ACTIONS.forEach((action) => {
        const inputEl = document.getElementById(`plot-input-${action.id}`);
        if (inputEl) {
            inputEl.value = activePlotMappings[action.id] ?? action.defaultTargetPlot;
        }
    });
}

function hydrateInputsFromDefaultKeybinds() {
    if (!keybindInputsContainer) {
        return;
    }

    KEYBIND_ACTIONS.forEach((action) => {
        const inputEl = document.getElementById(`keybind-input-${action.id}`);
        if (inputEl) {
            inputEl.value = normalizeKeybind(DEFAULT_KEYBINDS[action.id]);
        }
    });

    PLOT_KEY_ACTIONS.forEach((action) => {
        const inputEl = document.getElementById(`plot-input-${action.id}`);
        if (inputEl) {
            inputEl.value = action.defaultTargetPlot;
        }
    });
}

function hideKeybindsWindow() {
    if (!keybindOverlay) {
        return;
    }

    keybindOverlay.classList.remove('keybinds-overlay--visible');
    keybindOverlay.setAttribute('aria-hidden', 'true');
}

function showKeybindsWindowInternal() {
    if (!keybindOverlay) {
        return;
    }

    activePlotMappings = loadPlotMappings();
    activeKeybinds = loadKeybinds();
    actionByKeyLookup = buildActionByKey(activeKeybinds, activePlotMappings);
    hydrateInputsFromActiveKeybinds();
    setError('');

    keybindOverlay.classList.add('keybinds-overlay--visible');
    keybindOverlay.setAttribute('aria-hidden', 'false');

    const firstInput = keybindInputsContainer?.querySelector('.keybinds-input');
    if (firstInput) {
        queueMicrotask(() => firstInput.focus());
    }
}

function ensureKeybindsWindow() {
    if (keybindOverlay && document.body.contains(keybindOverlay)) {
        return;
    }

    keybindOverlay = document.createElement('div');
    keybindOverlay.id = 'keybinds-overlay';
    keybindOverlay.className = 'keybinds-overlay';
    keybindOverlay.setAttribute('aria-hidden', 'true');

    keybindWindow = document.createElement('div');
    keybindWindow.className = 'mac-window mac-dialog-window keybinds-window';
    keybindWindow.setAttribute('role', 'dialog');
    keybindWindow.setAttribute('aria-modal', 'true');
    keybindWindow.setAttribute('aria-label', 'Keybind settings');

    const titlebar = createTitlebar(() => {
        hideKeybindsWindow();
    });

    const { content, list, error, resetBtn, cancelBtn, okBtn } = createKeybindsWindowContent();
    keybindInputsContainer = list;
    keybindErrorEl = error;

    resetBtn.addEventListener('click', () => {
        hydrateInputsFromDefaultKeybinds();
        setError('');
    });

    cancelBtn.addEventListener('click', () => {
        hideKeybindsWindow();
    });

    okBtn.addEventListener('click', async () => {
        const draft = collectDraftKeybinds();
        const keybindResult = saveKeybinds(draft);

        if (!keybindResult.ok) {
            setError(keybindResult.error);
            await showNotification(keybindResult.error, 'Invalid Keybinds');
            return;
        }

        const draftPlots = collectDraftPlotMappings();
        const plotResult = validatePlotMappings(draftPlots);

        if (!plotResult.ok) {
            setError(plotResult.error);
            await showNotification(plotResult.error, 'Invalid Plot Number');
            return;
        }

        savePlotMappings(draftPlots);

        hideKeybindsWindow();
    });

    keybindWindow.append(titlebar, content);
    keybindOverlay.appendChild(keybindWindow);
    keybindOverlay.addEventListener('click', (event) => {
        if (event.target === keybindOverlay) {
            hideKeybindsWindow();
        }
    });

    document.body.appendChild(keybindOverlay);
}

export function initializeKeybindsWindow() {
    activePlotMappings = loadPlotMappings();
    activeKeybinds = loadKeybinds();
    actionByKeyLookup = buildActionByKey(activeKeybinds, activePlotMappings);
    ensureKeybindsWindow();
}

export function showKeybindsWindow() {
    ensureKeybindsWindow();
    showKeybindsWindowInternal();
}

export function getAllKeybindActions() {
    return KEYBIND_ACTIONS;
}
