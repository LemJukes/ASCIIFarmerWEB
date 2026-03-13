import { getState, updateState } from '../state.js';
import { TOOL_ORDER, TOOLS } from '../toolConfig.js';

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

function toSeedLabel(seedType) {
    return `${seedType.charAt(0).toUpperCase()}${seedType.slice(1)} Seeds`;
}

function initializeToolboxTitle() {
    const toolboxTitle = document.createElement('section');
    toolboxTitle.classList.add('container-title');
    toolboxTitle.id = 'toolbox-section-title';
    toolboxTitle.setAttribute('aria-label', 'Toolbox Section Title');
    toolboxTitle.textContent = 'The Toolbox';

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(toolboxTitle);
    } else {
        console.error('Main div not found');
    }
}

function initializeToolbox() {
    const toolboxContainer = document.createElement('section');
    toolboxContainer.classList.add('toolbox-container');
    toolboxContainer.id = 'toolbox-container';
    toolboxContainer.setAttribute('aria-label', 'The Toolbox');

    const selectedToolDisplay = document.createElement('p');
    selectedToolDisplay.id = 'selected-tool-display';
    selectedToolDisplay.classList.add('toolbox-selected-tool');
    selectedToolDisplay.setAttribute('aria-live', 'polite');
    toolboxContainer.appendChild(selectedToolDisplay);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('toolbox-buttons');

    TOOL_ORDER.forEach((toolName) => {
        const toolButton = document.createElement('button');
        toolButton.classList.add('toolbox-button');
        toolButton.dataset.tool = toolName;
        toolButton.setAttribute('aria-label', `Select ${toolName}`);
        toolButton.textContent = toolName;

        toolButton.addEventListener('click', () => {
            selectTool(toolName);
        });

        buttonsContainer.appendChild(toolButton);
    });

    toolboxContainer.appendChild(buttonsContainer);

    const seedSelector = document.createElement('section');
    seedSelector.classList.add('toolbox-seed-selector');
    seedSelector.id = 'toolbox-seed-selector';
    seedSelector.setAttribute('aria-label', 'Seed Selector');

    const selectedSeedDisplay = document.createElement('p');
    selectedSeedDisplay.id = 'selected-seed-display';
    selectedSeedDisplay.classList.add('toolbox-selected-seed');
    selectedSeedDisplay.setAttribute('aria-live', 'polite');
    seedSelector.appendChild(selectedSeedDisplay);

    const seedButtonsContainer = document.createElement('div');
    seedButtonsContainer.id = 'seed-selector-buttons';
    seedButtonsContainer.classList.add('toolbox-seed-buttons');
    seedSelector.appendChild(seedButtonsContainer);

    toolboxContainer.appendChild(seedSelector);

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(toolboxContainer);
    } else {
        console.error('Main div not found');
    }

    updateToolboxDisplay();
}

function selectTool(toolName) {
    if (!TOOL_ORDER.includes(toolName)) {
        return false;
    }

    const gameState = getState();
    if (gameState.selectedTool === toolName) {
        return false;
    }

    updateState({ selectedTool: toolName });
    updateToolboxDisplay();
    return true;
}

function selectSeedType(seedType) {
    const gameState = getState();
    const unlockedSeeds = getUnlockedSeedTypes(gameState);

    if (!unlockedSeeds.includes(seedType)) {
        return false;
    }

    if (gameState.selectedSeedType === seedType) {
        return false;
    }

    updateState({ selectedSeedType: seedType });
    updateToolboxDisplay();
    return true;
}

function updateToolboxDisplay() {
    const gameState = getState();
    const currentTool = TOOL_ORDER.includes(gameState.selectedTool) ? gameState.selectedTool : TOOLS.PLOW;
    const unlockedSeeds = getUnlockedSeedTypes(gameState);
    const currentSeedType = unlockedSeeds.includes(gameState.selectedSeedType)
        ? gameState.selectedSeedType
        : unlockedSeeds[0];

    if (currentTool !== gameState.selectedTool) {
        updateState({ selectedTool: currentTool });
    }

    if (currentSeedType !== gameState.selectedSeedType) {
        updateState({ selectedSeedType: currentSeedType });
    }

    const selectedToolDisplay = document.getElementById('selected-tool-display');
    if (selectedToolDisplay) {
        selectedToolDisplay.textContent = `Selected Tool: ${currentTool}`;
    }

    const toolButtons = document.querySelectorAll('.toolbox-button');
    toolButtons.forEach((button) => {
        const isSelected = button.dataset.tool === currentTool;
        button.classList.toggle('is-active', isSelected);
        button.disabled = isSelected;
        button.setAttribute('aria-pressed', String(isSelected));
        button.setAttribute('aria-disabled', String(isSelected));
    });

    const seedSelector = document.getElementById('toolbox-seed-selector');
    if (!seedSelector) {
        return;
    }

    const showSeedSelector = unlockedSeeds.length >= 2;
    seedSelector.style.display = showSeedSelector ? 'flex' : 'none';

    const selectedSeedDisplay = document.getElementById('selected-seed-display');
    if (selectedSeedDisplay) {
        selectedSeedDisplay.textContent = `Selected Seed: ${toSeedLabel(currentSeedType)}`;
    }

    const seedButtonsContainer = document.getElementById('seed-selector-buttons');
    if (!seedButtonsContainer) {
        return;
    }

    seedButtonsContainer.innerHTML = '';
    unlockedSeeds.forEach((seedType) => {
        const seedButton = document.createElement('button');
        seedButton.classList.add('toolbox-seed-button');
        seedButton.dataset.seedType = seedType;
        seedButton.textContent = toSeedLabel(seedType);

        const isSelectedSeed = seedType === currentSeedType;
        seedButton.disabled = isSelectedSeed;
        seedButton.setAttribute('aria-pressed', String(isSelectedSeed));
        seedButton.setAttribute('aria-disabled', String(isSelectedSeed));

        seedButton.addEventListener('click', () => {
            selectSeedType(seedType);
        });

        seedButtonsContainer.appendChild(seedButton);
    });
}

export { initializeToolboxTitle, initializeToolbox, updateToolboxDisplay, selectTool, selectSeedType };
