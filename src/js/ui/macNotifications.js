const notificationQueue = [];
let activeNotification = null;
let overlayEl = null;

function ensureOverlay() {
    if (overlayEl && document.body.contains(overlayEl)) {
        return overlayEl;
    }

    overlayEl = document.createElement('div');
    overlayEl.id = 'mac-notification-overlay';
    overlayEl.className = 'mac-notification-overlay';
    document.body.appendChild(overlayEl);
    return overlayEl;
}

function createWindowTitlebar(title, onClose) {
    const titlebar = document.createElement('div');
    titlebar.className = 'mac-titlebar';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mac-close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', `Close ${title}`);
    closeBtn.setAttribute('title', `Close ${title}`);
    closeBtn.addEventListener('click', onClose);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'mac-title';
    titleSpan.textContent = title;

    titlebar.append(closeBtn, titleSpan);
    return titlebar;
}

function createDialogShell(title, onClose, options = {}) {
    const {
        dialogClassName = '',
        contentClassName = '',
    } = options;

    const dialog = document.createElement('div');
    dialog.className = `mac-window mac-dialog-window ${dialogClassName}`.trim();
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', title);

    const titlebar = createWindowTitlebar(title, onClose);

    const content = document.createElement('div');
    content.className = `mac-dialog-content ${contentClassName}`.trim();

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'mac-button-group';

    content.append(buttonGroup);
    dialog.append(titlebar, content);

    return {
        dialog,
        content,
        buttonGroup,
    };
}

function dismissActiveNotification(result) {
    if (!activeNotification) {
        return;
    }

    const { resolve, onConfirm, onCancel } = activeNotification;
    const wasConfirmed = result === true;

    if (overlayEl) {
        overlayEl.classList.remove('mac-notification-overlay--visible');
        overlayEl.replaceChildren();
    }

    if (wasConfirmed) {
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    } else if (typeof onCancel === 'function') {
        onCancel();
    }

    if (typeof resolve === 'function') {
        resolve(result);
    }

    activeNotification = null;
    showNextNotification();
}

function createButton(label, onClick, autofocus = false) {
    const button = document.createElement('button');
    button.className = 'mac-button';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', onClick);

    if (autofocus) {
        queueMicrotask(() => button.focus());
    }

    return button;
}

function createMessageElement(message) {
    const messageEl = document.createElement('p');
    messageEl.className = 'mac-dialog-message';
    messageEl.textContent = message;
    return messageEl;
}

function showNextNotification() {
    if (activeNotification || notificationQueue.length === 0) {
        return;
    }

    activeNotification = notificationQueue.shift();

    const {
        title,
        message,
        type,
        body,
        buttons,
        dialogClassName,
        contentClassName,
        closeValue,
    } = activeNotification;

    const onClose = () => dismissActiveNotification(closeValue ?? (type === 'confirmation' ? false : true));
    const { dialog, content, buttonGroup } = createDialogShell(title, onClose, {
        dialogClassName,
        contentClassName,
    });

    if (body instanceof HTMLElement) {
        content.prepend(body);
    } else if (typeof message === 'string' && message.length > 0) {
        content.prepend(createMessageElement(message));
    }

    if (Array.isArray(buttons) && buttons.length > 0) {
        buttons.forEach((buttonConfig, index) => {
            const button = createButton(
                buttonConfig.label,
                () => dismissActiveNotification(buttonConfig.value),
                Boolean(buttonConfig.autofocus ?? index === 0),
            );

            if (buttonConfig.className) {
                button.classList.add(buttonConfig.className);
            }

            buttonGroup.appendChild(button);
        });
    } else if (type === 'confirmation') {
        const cancelBtn = createButton('Cancel', () => dismissActiveNotification(false));
        const okBtn = createButton('OK', () => dismissActiveNotification(true), true);
        buttonGroup.append(cancelBtn, okBtn);
    } else {
        const okBtn = createButton('OK', () => dismissActiveNotification(true), true);
        buttonGroup.append(okBtn);
    }

    const overlay = ensureOverlay();
    overlay.replaceChildren(dialog);
    overlay.classList.add('mac-notification-overlay--visible');
}

function enqueueNotification(notification) {
    notificationQueue.push(notification);
    showNextNotification();
}

export function showNotification(message, title = 'Notification') {
    return new Promise((resolve) => {
        enqueueNotification({
            type: 'notification',
            title,
            message,
            resolve,
        });
    });
}

export function showConfirmation(message, options = {}) {
    const {
        title = 'Confirm',
        onConfirm,
        onCancel,
    } = options;

    return new Promise((resolve) => {
        enqueueNotification({
            type: 'confirmation',
            title,
            message,
            onConfirm,
            onCancel,
            resolve,
        });
    });
}

export function showDialog(options = {}) {
    const {
        title = 'Notification',
        message = '',
        body = null,
        buttons = null,
        dialogClassName = '',
        contentClassName = '',
        closeValue = true,
    } = options;

    return new Promise((resolve) => {
        enqueueNotification({
            type: 'custom',
            title,
            message,
            body,
            buttons,
            dialogClassName,
            contentClassName,
            closeValue,
            resolve,
        });
    });
}