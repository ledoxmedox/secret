// ==UserScript==
// @name         bing.com - Auto Search
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  A fully interactive UI to run a repeating action sequence that survives URL changes.
// @author       You
// @match        *://www.bing.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- State Variables ---
    let repetitionCounter = 0;
    let isRunning = false;
    // Timer/Interval references for proper cleanup
    let currentTimeout = null;
    let countdownInterval = null;
    let urlWatcherInterval = null;

    // --- UI Element References (defined globally for access by all functions) ---
    let startStopButton, repeatInput, repetitionElement, timerElement;

    /**
     * Creates all UI elements ONCE and assigns them to the global references.
     * This is the key to preventing the "stuck timer" bug.
     */
    function createFullUI() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'tm-ui-container';

        const inputContainer = document.createElement('div');
        inputContainer.className = 'tm-ui-element tm-input-container';
        const label = document.createElement('label');
        label.setAttribute('for', 'tm-repeat-input');
        label.textContent = 'Repeat Count:';
        repeatInput = document.createElement('input');
        repeatInput.type = 'number';
        repeatInput.id = 'tm-repeat-input';
        repeatInput.min = '1';
        repeatInput.value = localStorage.getItem('tm_max_repetitions') || '30';
        inputContainer.appendChild(label);
        inputContainer.appendChild(repeatInput);

        startStopButton = document.createElement('button');
        startStopButton.id = 'tm-start-stop-button';
        startStopButton.className = 'tm-ui-element';

        repetitionElement = document.createElement('div');
        repetitionElement.id = 'tm-repetition-counter';
        repetitionElement.className = 'tm-ui-element';

        timerElement = document.createElement('div');
        timerElement.id = 'tm-countdown-timer';
        timerElement.className = 'tm-ui-element';

        uiContainer.appendChild(inputContainer);
        uiContainer.appendChild(startStopButton);
        uiContainer.appendChild(repetitionElement);
        uiContainer.appendChild(timerElement);
        document.body.appendChild(uiContainer);

        // --- Event Listeners ---
        startStopButton.addEventListener('click', toggleAutomation);
        repeatInput.addEventListener('change', () => {
            localStorage.setItem('tm_max_repetitions', repeatInput.value);
        });
    }

    /**
     * This is the main function containing the action logic.
     * It REUSES the existing UI elements instead of creating new ones.
     */
    function startDelayedActionSequence() {
        const maxRepetitions = parseInt(repeatInput.value) || 30;

        if (!isRunning || repetitionCounter >= maxRepetitions) {
            stopAutomation(true); // Stop and mark as finished
            return;
        }

        repetitionCounter++;
        console.log(`--- Starting Repetition ${repetitionCounter} / ${maxRepetitions} ---`);

        // Update existing UI
        repetitionElement.textContent = `Repetition: ${repetitionCounter} / ${maxRepetitions}`;
        timerElement.style.display = 'block';

        // --- Countdown & Action Logic ---
        const delayInSeconds = 10;
        let timeLeft = delayInSeconds;
        const updateTimerText = () => { timerElement.textContent = `Action starting in ${timeLeft}s...`; };
        updateTimerText();

        // Clear old interval before starting a new one
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) updateTimerText();
            else clearInterval(countdownInterval);
        }, 1000);

        // Clear old timeout before starting a new one
        clearTimeout(currentTimeout);
        currentTimeout = setTimeout(() => {
            timerElement.textContent = 'Executing Actions...';
            const targetElement = document.getElementById('sb_form_q');
            if (targetElement) {
                // (Your actions)
                targetElement.click();
                targetElement.focus();
                const currentValue = targetElement.value;
                if (currentValue.length > 0) {
                    targetElement.value = currentValue.substring(0, currentValue.length - 1);
                }
                targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                targetElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            } else {
                timerElement.textContent = "Error: Element not found!";
                stopAutomation(false); // Stop due to error
            }
        }, delayInSeconds * 1000);
    }

    /**
     * Toggles the automation state.
     */
    function toggleAutomation() {
        if (isRunning) stopAutomation(false);
        else startAutomation();
    }

    function startAutomation() {
        console.log("Starting automation...");
        isRunning = true;
        repetitionCounter = 0;
        updateUIState(); // Update UI to "running" state

        // Start the URL watcher
        let lastUrl = window.location.href;
        urlWatcherInterval = setInterval(() => {
            if (!isRunning) return;
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                console.log("URL changed. Restarting sequence.");
                lastUrl = currentUrl;
                startDelayedActionSequence();
            }
        }, 1000);

        // Initial Start
        startDelayedActionSequence();
    }

    function stopAutomation(isFinished) {
        console.log("Stopping automation.");
        isRunning = false;
        // Stop all timers
        clearTimeout(currentTimeout);
        clearInterval(countdownInterval);
        clearInterval(urlWatcherInterval);
        updateUIState(isFinished); // Update UI to "stopped" or "finished" state
    }

    /**
     * A central function to update the UI based on the current state.
     */
    function updateUIState(isFinished = false) {
        if (isRunning) {
            repeatInput.disabled = true;
            startStopButton.textContent = 'Stop';
            startStopButton.style.backgroundColor = '#dc3545'; // Red
            repetitionElement.style.backgroundColor = '#005a9e'; // Blue
        } else {
            repeatInput.disabled = false;
            startStopButton.textContent = 'Start';
            startStopButton.style.backgroundColor = '#007bff'; // Blue
            timerElement.style.display = 'none';
            if (isFinished) {
                repetitionElement.textContent = `Finished ${parseInt(repeatInput.value)} repetitions.`;
                repetitionElement.style.backgroundColor = 'green';
            } else {
                repetitionElement.textContent = 'Status: Idle';
                repetitionElement.style.backgroundColor = '#6c757d'; // Grey
            }
        }
    }


    // --- SCRIPT ENTRY POINT ---

    GM_addStyle(`
        #tm-ui-container { position: fixed; bottom: 15px; left: 15px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
        .tm-ui-element { padding: 10px 15px; color: white; font-family: Arial, sans-serif; font-size: 14px; border-radius: 5px; border: none; transition: background-color 0.3s; }
        .tm-input-container { display: flex; align-items: center; gap: 10px; background-color: #1e3a5f; }
        #tm-repeat-input { width: 50px; font-size: 14px; }
        #tm-start-stop-button { cursor: pointer; text-align: center; }
    `);

    createFullUI(); // Build the UI as soon as the script runs.
    updateUIState(); // Set the initial state to "Idle"

})();// ==UserScript==
// @name         Ultimate Interactive Action Sequence
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  A fully interactive UI to run a repeating action sequence that survives URL changes.
// @author       You
// @match        *://www.bing.com/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- State Variables ---
    let repetitionCounter = 0;
    let isRunning = false;
    // Timer/Interval references for proper cleanup
    let currentTimeout = null;
    let countdownInterval = null;
    let urlWatcherInterval = null;

    // --- UI Element References (defined globally for access by all functions) ---
    let startStopButton, repeatInput, repetitionElement, timerElement;

    /**
     * Creates all UI elements ONCE and assigns them to the global references.
     * This is the key to preventing the "stuck timer" bug.
     */
    function createFullUI() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'tm-ui-container';

        const inputContainer = document.createElement('div');
        inputContainer.className = 'tm-ui-element tm-input-container';
        const label = document.createElement('label');
        label.setAttribute('for', 'tm-repeat-input');
        label.textContent = 'Repeat Count:';
        repeatInput = document.createElement('input');
        repeatInput.type = 'number';
        repeatInput.id = 'tm-repeat-input';
        repeatInput.min = '1';
        repeatInput.value = localStorage.getItem('tm_max_repetitions') || '30';
        inputContainer.appendChild(label);
        inputContainer.appendChild(repeatInput);

        startStopButton = document.createElement('button');
        startStopButton.id = 'tm-start-stop-button';
        startStopButton.className = 'tm-ui-element';

        repetitionElement = document.createElement('div');
        repetitionElement.id = 'tm-repetition-counter';
        repetitionElement.className = 'tm-ui-element';

        timerElement = document.createElement('div');
        timerElement.id = 'tm-countdown-timer';
        timerElement.className = 'tm-ui-element';

        uiContainer.appendChild(inputContainer);
        uiContainer.appendChild(startStopButton);
        uiContainer.appendChild(repetitionElement);
        uiContainer.appendChild(timerElement);
        document.body.appendChild(uiContainer);

        // --- Event Listeners ---
        startStopButton.addEventListener('click', toggleAutomation);
        repeatInput.addEventListener('change', () => {
            localStorage.setItem('tm_max_repetitions', repeatInput.value);
        });
    }

    /**
     * This is the main function containing the action logic.
     * It REUSES the existing UI elements instead of creating new ones.
     */
    function startDelayedActionSequence() {
        const maxRepetitions = parseInt(repeatInput.value) || 30;

        if (!isRunning || repetitionCounter >= maxRepetitions) {
            stopAutomation(true); // Stop and mark as finished
            return;
        }

        repetitionCounter++;
        console.log(`--- Starting Repetition ${repetitionCounter} / ${maxRepetitions} ---`);

        // Update existing UI
        repetitionElement.textContent = `Repetition: ${repetitionCounter} / ${maxRepetitions}`;
        timerElement.style.display = 'block';

        // --- Countdown & Action Logic ---
        const delayInSeconds = 10;
        let timeLeft = delayInSeconds;
        const updateTimerText = () => { timerElement.textContent = `Action starting in ${timeLeft}s...`; };
        updateTimerText();

        // Clear old interval before starting a new one
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) updateTimerText();
            else clearInterval(countdownInterval);
        }, 1000);

        // Clear old timeout before starting a new one
        clearTimeout(currentTimeout);
        currentTimeout = setTimeout(() => {
            timerElement.textContent = 'Executing Actions...';
            const targetElement = document.getElementById('sb_form_q');
            if (targetElement) {
                // (Your actions)
                targetElement.click();
                targetElement.focus();
                const currentValue = targetElement.value;
                if (currentValue.length > 0) {
                    targetElement.value = currentValue.substring(0, currentValue.length - 1);
                }
                targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                targetElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            } else {
                timerElement.textContent = "Error: Element not found!";
                stopAutomation(false); // Stop due to error
            }
        }, delayInSeconds * 1000);
    }

    /**
     * Toggles the automation state.
     */
    function toggleAutomation() {
        if (isRunning) stopAutomation(false);
        else startAutomation();
    }

    function startAutomation() {
        console.log("Starting automation...");
        isRunning = true;
        repetitionCounter = 0;
        updateUIState(); // Update UI to "running" state

        // Start the URL watcher
        let lastUrl = window.location.href;
        urlWatcherInterval = setInterval(() => {
            if (!isRunning) return;
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                console.log("URL changed. Restarting sequence.");
                lastUrl = currentUrl;
                startDelayedActionSequence();
            }
        }, 1000);

        // Initial Start
        startDelayedActionSequence();
    }

    function stopAutomation(isFinished) {
        console.log("Stopping automation.");
        isRunning = false;
        // Stop all timers
        clearTimeout(currentTimeout);
        clearInterval(countdownInterval);
        clearInterval(urlWatcherInterval);
        updateUIState(isFinished); // Update UI to "stopped" or "finished" state
    }

    /**
     * A central function to update the UI based on the current state.
     */
    function updateUIState(isFinished = false) {
        if (isRunning) {
            repeatInput.disabled = true;
            startStopButton.textContent = 'Stop';
            startStopButton.style.backgroundColor = '#dc3545'; // Red
            repetitionElement.style.backgroundColor = '#005a9e'; // Blue
        } else {
            repeatInput.disabled = false;
            startStopButton.textContent = 'Start';
            startStopButton.style.backgroundColor = '#007bff'; // Blue
            timerElement.style.display = 'none';
            if (isFinished) {
                repetitionElement.textContent = `Finished ${parseInt(repeatInput.value)} repetitions.`;
                repetitionElement.style.backgroundColor = 'green';
            } else {
                repetitionElement.textContent = 'Status: Idle';
                repetitionElement.style.backgroundColor = '#6c757d'; // Grey
            }
        }
    }


    // --- SCRIPT ENTRY POINT ---

    GM_addStyle(`
        #tm-ui-container { position: fixed; bottom: 15px; left: 15px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
        .tm-ui-element { padding: 10px 15px; color: white; font-family: Arial, sans-serif; font-size: 14px; border-radius: 5px; border: none; transition: background-color 0.3s; }
        .tm-input-container { display: flex; align-items: center; gap: 10px; background-color: #1e3a5f; }
        #tm-repeat-input { width: 50px; font-size: 14px; }
        #tm-start-stop-button { cursor: pointer; text-align: center; }
    `);

    createFullUI(); // Build the UI as soon as the script runs.
    updateUIState(); // Set the initial state to "Idle"

})();
