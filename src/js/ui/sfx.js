const BUBBLE_FILES = [
    './src/assets/bubbleSFX/bubble01.wav',
    './src/assets/bubbleSFX/bubble02.wav',
    './src/assets/bubbleSFX/bubble03.wav',
    './src/assets/bubbleSFX/bubble04.wav',
    './src/assets/bubbleSFX/bubble05.wav',
    './src/assets/bubbleSFX/bubble06.wav',
    './src/assets/bubbleSFX/bubble07.wav',
    './src/assets/bubbleSFX/bubble08.wav',
    './src/assets/bubbleSFX/bubble09.wav',
    './src/assets/bubbleSFX/bubble10.wav'
];

const MAIN_STATE_VOLUME = {
    '~': 0.08,
    '=': 0.12,
    '.': 0.16,
    '/': 0.22,
    '|': 0.28,
    '\\': 0.34,
    '¥': 0.45,
    '₡': 0.45,
    '₮': 0.45
};

const ADJACENT_MULTIPLIER = 0.35;
const MIN_ADJACENT_VOLUME = 0.04;
const MAX_VOLUME = 1;
const AUDIO_STORAGE_KEY = 'audioEnabled';

let shuffleBag = [];
let audioEnabled = true;

function initializeAudioPreference() {
    const storedAudioPreference = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (storedAudioPreference === 'false') {
        audioEnabled = false;
        return;
    }

    audioEnabled = true;
}

function shuffleArray(values) {
    for (let i = values.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        const current = values[i];
        values[i] = values[randomIndex];
        values[randomIndex] = current;
    }
}

function refillShuffleBag() {
    shuffleBag = [...BUBBLE_FILES];
    shuffleArray(shuffleBag);
}

function getNextBubbleFile() {
    if (shuffleBag.length === 0) {
        refillShuffleBag();
    }

    return shuffleBag.pop();
}

function getMainVolumeForState(symbol) {
    return MAIN_STATE_VOLUME[symbol] ?? MAIN_STATE_VOLUME['.'];
}

function getAdjacentVolumeForState(symbol) {
    const scaledVolume = getMainVolumeForState(symbol) * ADJACENT_MULTIPLIER;
    return Math.max(MIN_ADJACENT_VOLUME, Math.min(scaledVolume, MAX_VOLUME));
}

function playBubbleWithVolume(volume) {
    if (!audioEnabled) {
        return;
    }

    const audio = new Audio(getNextBubbleFile());
    audio.volume = Math.max(0, Math.min(volume, MAX_VOLUME));

    audio.play().catch(() => {
        audioEnabled = false;
        localStorage.setItem(AUDIO_STORAGE_KEY, 'false');
    });
}

function playPlotBubbleForState(symbol) {
    playBubbleWithVolume(getMainVolumeForState(symbol));
}

function playAdjacentBubbleForState(symbol) {
    playBubbleWithVolume(getAdjacentVolumeForState(symbol));
}

function isAudioEnabled() {
    return audioEnabled;
}

function setAudioEnabled(enabled) {
    audioEnabled = Boolean(enabled);
    localStorage.setItem(AUDIO_STORAGE_KEY, audioEnabled ? 'true' : 'false');
    return audioEnabled;
}

function toggleAudioEnabled() {
    return setAudioEnabled(!audioEnabled);
}

initializeAudioPreference();

export { playPlotBubbleForState, playAdjacentBubbleForState, isAudioEnabled, setAudioEnabled, toggleAudioEnabled };
