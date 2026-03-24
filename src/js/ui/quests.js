import { getQuestPanelData, deliverQuest, QUESTS_UPDATED_EVENT } from "../handlers/questHandlers.js";

const QUESTS_TITLE_ID = 'quests-container-title';
const QUESTS_CONTAINER_ID = 'quests';

let currentQuestIndex = 0;
let questsListenerAttached = false;

function isCurrentlyDark() {
    if (document.body.classList.contains('dark')) return true;
    if (document.body.classList.contains('light')) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function createCell(text, className = '') {
    const cell = document.createElement('td');
    if (className) {
        cell.className = className;
    }

    cell.textContent = text;
    return cell;
}

function setQuestWindowVisibility(isVisible) {
    const questWindow = document.getElementById('mac-window-quests');
    const titleEl = document.getElementById(QUESTS_TITLE_ID);
    const containerEl = document.getElementById(QUESTS_CONTAINER_ID);

    if (questWindow) {
        questWindow.style.display = isVisible ? '' : 'none';
    }

    if (titleEl) {
        titleEl.style.display = isVisible ? '' : 'none';
    }

    if (containerEl) {
        containerEl.style.display = isVisible ? '' : 'none';
    }
}

function renderQuestPager(pagerHost, totalQuests) {
    if (totalQuests < 2) {
        pagerHost.replaceChildren();
        return;
    }

    const prevButton = document.createElement('button');
    prevButton.className = 'mac-button quest-pager-button';
    prevButton.type = 'button';
    prevButton.textContent = '←';
    prevButton.setAttribute('aria-label', 'Show previous quest');
    prevButton.disabled = currentQuestIndex === 0;
    prevButton.addEventListener('click', () => {
        currentQuestIndex = Math.max(0, currentQuestIndex - 1);
        refreshQuestWindow();
    });

    const pageLabel = document.createElement('span');
    pageLabel.className = 'quest-page-label';
    pageLabel.textContent = `Request ${currentQuestIndex + 1} of ${totalQuests}`;

    const nextButton = document.createElement('button');
    nextButton.className = 'mac-button quest-pager-button';
    nextButton.type = 'button';
    nextButton.textContent = '→';
    nextButton.setAttribute('aria-label', 'Show next quest');
    nextButton.disabled = currentQuestIndex >= totalQuests - 1;
    nextButton.addEventListener('click', () => {
        currentQuestIndex = Math.min(totalQuests - 1, currentQuestIndex + 1);
        refreshQuestWindow();
    });

    pagerHost.replaceChildren(prevButton, pageLabel, nextButton);
}

function renderQuestTable(requirementRows) {
    const table = document.createElement('table');
    table.className = 'quest-requirements-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.append(
        createCell('Crop', 'quest-table-heading'),
        createCell('Current', 'quest-table-heading'),
        createCell('Required', 'quest-table-heading'),
    );
    thead.appendChild(headRow);

    const tbody = document.createElement('tbody');
    requirementRows.forEach((row) => {
        const tableRow = document.createElement('tr');
        tableRow.className = row.isReady ? 'quest-row quest-row--ready' : 'quest-row';
        tableRow.append(
            createCell(row.label),
            createCell(String(row.currentAmount)),
            createCell(String(row.requiredAmount)),
        );
        tbody.appendChild(tableRow);
    });

    table.append(thead, tbody);
    return table;
}

function renderQuestCard(container, questData, totalQuests) {
    const card = document.createElement('section');
    card.className = 'quest-card';

    const pager = document.createElement('div');
    pager.className = 'quest-pager';
    renderQuestPager(pager, totalQuests);

    const header = document.createElement('div');
    header.className = 'quest-card-header';

    const heading = document.createElement('h3');
    heading.className = 'quest-card-title';
    heading.textContent = questData.name;

    const questNumber = document.createElement('p');
    questNumber.className = 'quest-card-number';
    questNumber.textContent = `Quest #${questData.questNumber}`;

    header.append(heading, questNumber);

    const spriteSrc = isCurrentlyDark()
        ? './src/assets/farmr/farmr-sprite-DarkMode.gif'
        : './src/assets/farmr/farmr-sprite.gif';

    const sprite = document.createElement('img');
    sprite.className = 'quest-farmr-sprite';
    sprite.src = spriteSrc;
    sprite.alt = 'farmr the digital farmer';

    const issuer = document.createElement('p');
    issuer.className = 'quest-card-issuer';
    issuer.textContent = `Issuer: ${questData.issuer}`;

    const flavor = document.createElement('p');
    flavor.className = 'quest-card-flavor';
    flavor.textContent = questData.flavorText;

    const cardIntroText = document.createElement('div');
    cardIntroText.className = 'quest-card-intro-text';
    cardIntroText.append(issuer, flavor);

    const cardIntro = document.createElement('div');
    cardIntro.className = 'quest-card-intro';
    cardIntro.append(sprite, cardIntroText);

    const meta = document.createElement('div');
    meta.className = 'quest-card-meta';

    const rewardRow = document.createElement('p');
    rewardRow.className = 'quest-meta-row';
    rewardRow.textContent = `Reward: ${questData.rewardSummary}`;
    meta.appendChild(rewardRow);

    const requirementsHeading = document.createElement('p');
    requirementsHeading.className = 'quest-section-heading';
    requirementsHeading.textContent = 'Delivery Requirements';

    const requirementsTable = renderQuestTable(questData.requirementRows);

    const actions = document.createElement('div');
    actions.className = 'quest-card-actions';

    const status = document.createElement('p');
    status.className = 'quest-delivery-status';
    status.textContent = questData.canDeliver
        ? 'Harvest is ready for pickup.'
        : 'Keep growing until every line item is ready.';

    const deliverButton = document.createElement('button');
    deliverButton.className = 'mac-button quest-deliver-button';
    deliverButton.type = 'button';
    deliverButton.textContent = 'Deliver';
    deliverButton.disabled = !questData.canDeliver;
    deliverButton.addEventListener('click', () => {
        deliverQuest(questData.id);
    });

    actions.append(status, deliverButton);
    card.append(pager, header, cardIntro, meta, requirementsHeading, requirementsTable, actions);
    container.replaceChildren(card);
}

function renderEmptyQuestState(container, completedCount) {
    const emptyState = document.createElement('section');
    emptyState.className = 'quest-empty-state';

    const heading = document.createElement('h3');
    heading.className = 'quest-card-title';
    heading.textContent = 'No active requests';

    const body = document.createElement('p');
    body.className = 'quest-card-flavor';
    body.textContent = completedCount > 0
        ? 'farmr has cleared the current request queue. Watch for the next produce message.'
        : 'farmr will post produce requests here once the networks start asking for harvests.';

    emptyState.append(heading, body);
    container.replaceChildren(emptyState);
}

function initializeQuestsTitle() {
    if (document.getElementById(QUESTS_TITLE_ID)) {
        return;
    }

    const questsTitle = document.createElement('section');
    questsTitle.classList.add('container-title');
    questsTitle.id = QUESTS_TITLE_ID;
    questsTitle.setAttribute('aria-label', 'Quests Section Title');
    questsTitle.textContent = 'Quests';

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(questsTitle);
    }
}

function initializeQuests() {
    if (document.getElementById(QUESTS_CONTAINER_ID)) {
        return;
    }

    const quests = document.createElement('section');
    quests.className = 'quests-container';
    quests.id = QUESTS_CONTAINER_ID;
    quests.setAttribute('aria-label', 'Quest Requests');

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(quests);
    }

    if (!questsListenerAttached) {
        document.addEventListener(QUESTS_UPDATED_EVENT, refreshQuestWindow);
        questsListenerAttached = true;
    }

    refreshQuestWindow();
}

function refreshQuestWindow() {
    const questsContainer = document.getElementById(QUESTS_CONTAINER_ID);
    if (!questsContainer) {
        return;
    }

    const panelData = getQuestPanelData();
    const totalActiveQuests = panelData.activeQuests.length;

    setQuestWindowVisibility(panelData.unlockedCount > 0);

    if (panelData.unlockedCount < 1) {
        questsContainer.replaceChildren();
        return;
    }

    if (totalActiveQuests < 1) {
        currentQuestIndex = 0;
        renderEmptyQuestState(questsContainer, panelData.completedCount);
        return;
    }

    currentQuestIndex = Math.min(currentQuestIndex, totalActiveQuests - 1);
    renderQuestCard(questsContainer, panelData.activeQuests[currentQuestIndex], totalActiveQuests);
}

export { initializeQuestsTitle, initializeQuests, refreshQuestWindow };