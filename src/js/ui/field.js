// ./ui/field.js
import { getState } from "../state.js";
import { handlePlotClick } from '../handlers/plotHandlers.js'; 

function initializeFieldTitle() {
    // Store Title as a Button
    const fieldTitleButton = document.createElement('section');
    fieldTitleButton.classList.add('container-title');
    fieldTitleButton.id = 'field-section-title';
    fieldTitleButton.setAttribute('aria-label', 'Field Section Title');
    fieldTitleButton.textContent = 'The Field';

    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(fieldTitleButton);
    } else {
        console.error('Main div not found');
    }
}

function initializeField(){
    // Store Section
    const field = document.createElement('section');
    field.classList.add('field-container');
    field.id = 'field';
    field.setAttribute('aria-label', 'The Field');

    // Append the field section to the main element
    const mainDiv = document.querySelector('main');
    if (mainDiv) {
        mainDiv.appendChild(field);
    } else {
        console.error('Main div not found');
    }
}

function updateField() {
    const gameState = getState(); // Call getState to retrieve the current game state
    
    const fieldElement = document.getElementById('field'); // Get the field element
    if (!fieldElement) {
        console.error('Field element not found');
        return;
    }
    fieldElement.innerHTML = ''; // Clear the field element's content

    const plots = gameState.plots; // Retrieve the plots variable from the game state

    // Create and append plot buttons for the number of plots owned by the player
    for (let i = 0; i < plots; i++) {
        const plot = document.createElement('button');
        plot.textContent = '~'; // Set the initial text for the plot button (untilled)
        plot.className = 'plotButton'; // Set the class for styling the plot button
        plot.addEventListener('click', () => handlePlotClick(plot)); // Add a click event listener to handle plot interactions
        fieldElement.appendChild(plot); // Append the plot button to the field element
    }
}

export { initializeFieldTitle, initializeField, updateField }