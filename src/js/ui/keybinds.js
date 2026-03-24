import { DEFAULT_KEYBINDS, KEYBIND_ACTIONS, KEYBINDS_STORAGE_KEY } from '../configs/keybindsConfig.js';
import { showNotification } from './macNotifications.js';

let activeKeybinds = loadKeybinds();
let actionByKeyLookup = buildActionByKey(activeKeybinds);
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

function sanitizeKeybinds(rawKeybinds) {
    const sanitized = cloneDefaultKeybinds();

    if (!rawKeybinds || typeof rawKeybinds !== 'object') {
        return sanitized;
    }

    KEYBIND_ACTIONS.forEach((action) => {
        const normalized = normalizeKeybind(rawKeybinds[action.id]);
        sanitized[action.id] = isValidKeybind(normalized) ? normalized : DEFAULT_KEYBINDS[action.id];
    });

    return sanitized;
}

function buildActionByKey(keybinds) {
    const lookup = {};

    KEYBIND_ACTIONS.forEach((action) => {
        const boundKey = normalizeKeybind(keybinds[action.id]);
        if (!boundKey) {
            return;
        }

        lookup[boundKey] = action;
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
                error: `Invalid key for ${action.label}. Use one letter (A-Z) or one number (0-9).`,
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
    actionByKeyLookup = buildActionByKey(activeKeybinds);
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
        if (!isValidKeybind(normalized)) {
            setError('Use one letter (A-Z) or one number (0-9) for each keybind.');
            return;
        }

        inputEl.value = normalized;
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

export function createKeybindsWindowContent() {
    const content = document.createElement('div');
    content.className = 'mac-dialog-content keybinds-dialog-content';

    const list = document.createElement('ul');
    list.className = 'keybinds-list';
    list.setAttribute('aria-label', 'Keybind settings');

    KEYBIND_ACTIONS.forEach((action) => {
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
        list.appendChild(row);
    });

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
    content.append(list, error, actionsRow);

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

    activeKeybinds = loadKeybinds();
    actionByKeyLookup = buildActionByKey(activeKeybinds);
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
        const result = saveKeybinds(draft);

        if (!result.ok) {
            setError(result.error);
            await showNotification(result.error, 'Invalid Keybinds');
            return;
        }

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
    activeKeybinds = loadKeybinds();
    actionByKeyLookup = buildActionByKey(activeKeybinds);
    ensureKeybindsWindow();
}

export function showKeybindsWindow() {
    ensureKeybindsWindow();
    showKeybindsWindowInternal();
}

export function getAllKeybindActions() {
    return KEYBIND_ACTIONS;
}
