export const KEYBINDS_STORAGE_KEY = 'asciiFarmerKeybinds';

export const KEYBIND_ACTIONS = [
    { id: 'tool.plow', label: 'Select Plow', type: 'tool', value: 'Plow', defaultKey: 'A' },
    { id: 'tool.seedBag', label: 'Select Seed Bag', type: 'tool', value: 'Seed Bag', defaultKey: 'S' },
    { id: 'tool.wateringCan', label: 'Select Watering Can', type: 'tool', value: 'Watering Can', defaultKey: 'D' },
    { id: 'tool.scythe', label: 'Select Scythe', type: 'tool', value: 'Scythe', defaultKey: 'F' },
    { id: 'seed.wheat', label: 'Select Wheat Seed', type: 'seed', value: 'wheat', defaultKey: 'Z' },
    { id: 'seed.corn', label: 'Select Corn Seed', type: 'seed', value: 'corn', defaultKey: 'X' },
    { id: 'seed.tomato', label: 'Select Tomato Seed', type: 'seed', value: 'tomato', defaultKey: 'C' },
    { id: 'plot.1', label: 'Select Plot 1', type: 'plot', value: 0, defaultKey: '1' },
    { id: 'plot.2', label: 'Select Plot 2', type: 'plot', value: 1, defaultKey: '2' },
    { id: 'plot.3', label: 'Select Plot 3', type: 'plot', value: 2, defaultKey: '3' },
    { id: 'plot.4', label: 'Select Plot 4', type: 'plot', value: 3, defaultKey: '4' },
    { id: 'plot.5', label: 'Select Plot 5', type: 'plot', value: 4, defaultKey: '5' },
    { id: 'plot.6', label: 'Select Plot 6', type: 'plot', value: 5, defaultKey: '6' },
    { id: 'plot.7', label: 'Select Plot 7', type: 'plot', value: 6, defaultKey: '7' },
    { id: 'plot.8', label: 'Select Plot 8', type: 'plot', value: 7, defaultKey: '8' },
    { id: 'plot.9', label: 'Select Plot 9', type: 'plot', value: 8, defaultKey: '9' },
    { id: 'plot.10', label: 'Select Plot 10', type: 'plot', value: 9, defaultKey: '0' },
];

export const DEFAULT_KEYBINDS = Object.fromEntries(
    KEYBIND_ACTIONS.map((action) => [action.id, action.defaultKey]),
);
