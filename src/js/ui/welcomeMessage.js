// src/js/ui/welcomeMessage.js

const WELCOME_MESSAGE = `Howdy Partner! I'm farmr, the caretaker of this here farm and I'm here to welcome you to ASCII Farmer!

Things have been gettin' a little overwhelming for this one critter to manage alone, and I sure am glad you showed up when you did!

Here's how things work around these parts:

  - First, grab your Plow and break up some soil on the field.
  - Next, pick up some Seeds and plant 'em in the tilled plots.
  - Give those seedlings a drink with the Watering Can.
  - Once they're ready, take your Scythe and bring in the harvest.
  - Then sell your crops at the Store for coins!

Keep a close eye on the Store and what's on offer -- you never know what might turn up that could change the way you farm altogether...

Oh, and if you're sittin' at a desk with a keyboard handy, give those keys a try! You might find things move a whole heap faster than clickin' around with a mouse.

Now let's get to work -- this farm ain't gonna run itself! Not without your help, anyhow.

  -- farmr`;

function isCurrentlyDark() {
    if (document.body.classList.contains('dark')) return true;
    if (document.body.classList.contains('light')) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function showWelcomeMessage() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'mac-notification-overlay mac-welcome-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'mac-window mac-dialog-window mac-welcome-window';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', 'Welcome to ASCII Farmer');

        // Titlebar
        const titlebar = document.createElement('div');
        titlebar.className = 'mac-titlebar';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'mac-close-btn';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close Welcome');
        closeBtn.setAttribute('title', 'Close Welcome');

        const titleSpan = document.createElement('span');
        titleSpan.className = 'mac-title';
        titleSpan.textContent = 'Welcome to ASCII Farmer!';

        const zoomBtn = document.createElement('button');
        zoomBtn.className = 'mac-zoom-btn';
        zoomBtn.type = 'button';
        zoomBtn.setAttribute('aria-hidden', 'true');
        zoomBtn.setAttribute('tabindex', '-1');

        titlebar.append(closeBtn, titleSpan, zoomBtn);

        // Content
        const content = document.createElement('div');
        content.className = 'mac-dialog-content';

        const body = document.createElement('div');
        body.className = 'mac-welcome-body';

        const spriteSrc = isCurrentlyDark()
            ? './src/assets/farmr/farmr-sprite-DarkMode.gif'
            : './src/assets/farmr/farmr-sprite.gif';

        const sprite = document.createElement('img');
        sprite.className = 'mac-welcome-sprite';
        sprite.src = spriteSrc;
        sprite.alt = 'farmr the digital farmer';

        const messageEl = document.createElement('p');
        messageEl.className = 'mac-welcome-message';
        messageEl.textContent = WELCOME_MESSAGE;

        body.append(sprite, messageEl);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'mac-button-group';

        const letsGoBtn = document.createElement('button');
        letsGoBtn.className = 'mac-button';
        letsGoBtn.type = 'button';
        letsGoBtn.textContent = "Let's Go!";

        buttonGroup.append(letsGoBtn);
        content.append(body, buttonGroup);
        dialog.append(titlebar, content);
        overlay.append(dialog);
        document.body.appendChild(overlay);

        overlay.classList.add('mac-notification-overlay--visible');

        function dismiss() {
            overlay.remove();
            resolve();
        }

        closeBtn.addEventListener('click', dismiss);
        letsGoBtn.addEventListener('click', dismiss);

        queueMicrotask(() => letsGoBtn.focus());
    });
}
