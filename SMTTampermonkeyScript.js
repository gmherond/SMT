// ==UserScript==
// @name         SMT
// @namespace    http://tampermonkey.net/
// @version      3.1.3
// @description  Adds a metrics tracker "mini app" that keeps tracks of the amount of processed tasks and the total time a user has worked on a Sagemaker job.
// @author       elgustav
// @match        https://v6ke42cho6.labeling.us-east-1.sagemaker.aws/
// @icon         https://cdn-icons-png.flaticon.com/512/6687/6687065.png
// @grant        none
// @require      http://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==

/*
Changelog 3.1.2
-The tracker should now keep track of the last processed data even if a job runs out of tasks.
-If the user releases a job and tries to change the display mode of the timer, it will change properly now.
Changelog 3.1.1
-The timer now takes into consideration the time passed between a submitted task and a new task loaded, making the timer more accurate to the
Cloudwatch Dashboard.
-Additionally, seconds are also taking into consideration for the alternative time format, making it more precise and in par with the respective Dashboard
for that job.
*/
let SMT_HTML = `
    <div id="metrics-tracker" class="tracker-bottom-right">
        <button id="show-button" onclick="toggleTracker()" class="tracker-btn hide"><svg id="show-btn-icon"
                class="mt-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                fill="#000000">
                <path
                    d="m105-233-65-47 200-320 120 140 160-260 109 163q-23 1-43.5 5.5T545-539l-22-33-152 247-121-141-145 233ZM863-40 738-165q-20 14-44.5 21t-50.5 7q-75 0-127.5-52.5T463-317q0-75 52.5-127.5T643-497q75 0 127.5 52.5T823-317q0 26-7 50.5T795-221L920-97l-57 57ZM643-217q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm89-320q-19-8-39.5-13t-42.5-6l205-324 65 47-188 296Z" />
            </svg></button>
        <div id="tracker-elements" class="hide">
            <div id="metrics-tracker-bar">
                <button class="tracker-btn" id="hide-button" onclick="toggleTracker()"><svg id="visibility-icon"
                        class="mt-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960"
                        width="24px" fill="#000000">
                        <path
                            d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
                    </svg></button>
                <button class="tracker-btn" id="config-btn" onclick="toggleConfig()"><svg id="config-icon"
                        class="mt-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960"
                        width="24px" fill="#000000">
                        <path
                            d="M710-150q-63 0-106.5-43.5T560-300q0-63 43.5-106.5T710-450q63 0 106.5 43.5T860-300q0 63-43.5 106.5T710-150Zm0-80q29 0 49.5-20.5T780-300q0-29-20.5-49.5T710-370q-29 0-49.5 20.5T640-300q0 29 20.5 49.5T710-230Zm-550-30v-80h320v80H160Zm90-250q-63 0-106.5-43.5T100-660q0-63 43.5-106.5T250-810q63 0 106.5 43.5T400-660q0 63-43.5 106.5T250-510Zm0-80q29 0 49.5-20.5T320-660q0-29-20.5-49.5T250-730q-29 0-49.5 20.5T180-660q0 29 20.5 49.5T250-590Zm230-30v-80h320v80H480Zm230 320ZM250-660Z" />
                    </svg></button>
            </div>
            <div id="metrics-tracker-config" class="hide">
                <div id="position-element" class="metrics-tracker-element">
                    <label class="mt-label">Position</label>
                    <div id="position-btns">
                        <button onclick="topLeftPosition()" id="top-left-btn" class="tracker-btn corner-btns">
                            <svg class="corner-btn-icon mt-icon" id="corner-upper-left-icon"
                                xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                                fill="#000000">
                                <path
                                    d="M440-440h280v-280H440v280ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
                            </svg>
                        </button>
                        <button onclick="topRightPosition()" id="top-right-btn" class="tracker-btn corner-btns">
                            <svg class="corner-btn-icon mt-icon" id="corner-upper-right-icon"
                                xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                                fill="#000000">
                                <path
                                    d="M440-440h280v-280H440v280ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
                            </svg>
                        </button>
                        <button onclick="bottomLeftPosition()" id="bottom-left-btn" class="tracker-btn corner-btns">
                            <svg class="corner-btn-icon mt-icon" id="corner-lower-left-icon"
                                xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                                fill="#000000">
                                <path
                                    d="M440-440h280v-280H440v280ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
                            </svg>
                        </button>
                        <button onclick="bottomRightPosition()" id="bottom-right-btn"
                            class="tracker-btn corner-btns enabled-config">
                            <svg class="corner-btn-icon mt-icon" id="corner-lower-right-icon"
                                xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                                fill="#000000">
                                <path
                                    d="M440-440h280v-280H440v280ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div id="opacity-element" class="metrics-tracker-element">
                    <label class="mt-label">Opacity</label>
                    <input oninput="setOpacity()" class="tasks-input" id="opacity-level" type="range" min="10" max="100"
                        value="95">
                </div>
                <div id="scale-element" class="metrics-tracker-element">
                    <label class="mt-label">Scale</label>
                    <div id="scale-controls">
                        <button id="scale-decrease" class="tracker-btn" onclick="decreaseScale()">-</button>
                        <input class="tasks-input" id="scale-value" value="1x" readonly>
                        <button id="scale-increase" class="tracker-btn" onclick="increaseScale()">+</button>
                    </div>
                </div>
                <div class="metrics-tracker-element">
                    <label class="mt-label">Palette</label>
                    <div id="mt-colors">
                        <div class="mt-color-container" id="mt-bg-color-container">
                            <input type="color" class="mt-color-input" id="mt-bg-color-input" oninput="setBGColor()"
                                value="#f5f5f5">
                        </div>
                        <div class="mt-color-container" id="mt-font-color-container">
                            <input type="color" class="mt-color-input" id="mt-font-color-input" oninput="setFontColor()"
                                value="#000000">
                        </div>
                        <div class="mt-color-container" id="mt-primary-color-container">
                            <input type="color" class="mt-color-input" id="mt-primary-color-input"
                                oninput="setPrimaryColor()" value="#0cb4b7">
                        </div>
                        <div class="mt-color-container" id="mt-accent-color-container">
                            <input type="color" class="mt-color-input" id="mt-accent-color-input"
                                oninput="setAccentColor()" value="#29c37e">
                        </div>
                    </div>
                </div>
                <div class="metrics-tracker-element">
                    <label class="mt-label">Add Declined Tasks</label>
                    <input type="checkbox" id="declined-checkbox" onclick="toggleDeclinedCounter()">
                </div>
                <div class="metrics-tracker-element">
                    <button class="tracker-btn" id="mt-reset-default" onclick="resetDefaults()">Reset to
                        Default</button>
                </div>
            </div>
            <div id="metrics-tracker-content">
                <div class="metrics-tracker-element">
                    <label class="mt-label" for="processed-tasks-input">Processed Tasks</label>
                    <input id="processed-tasks-input" class="tracker-btn tasks-input" value="0" readonly>
                </div>
                <div class="metrics-tracker-element hide" id="declined-tasks-element">
                    <label class="mt-label" for="declined-tasks-input">Declined Tasks</label>
                    <input id="declined-tasks-input" class="tracker-btn tasks-input" value="0" readonly>
                </div>
                <div class="metrics-tracker-element">
                    <label class="mt-label" for="total-time-input">Total Time</label>
                    <input id="total-time-input" class="tracker-btn tasks-input" value="00:00:00" readonly
                        onclick="alternateTimeFormat()">
                </div>
            </div>
        </div>
    </div>
`;

let SMT_CSS = `
        :root {
            --mt-tracker-scale: 1;
            --mt-primary-color: #0696c6;
            --mt-primary-hover-color: color-mix(in srgb, var(--mt-primary-color) 100%, #dddddd 20.3%);
            --mt-secondary-color: color-mix(in srgb, var(--mt-primary-color) 100%, #363636c7 20.3%);
            --mt-accent-color: #29c37e;
            --mt-accent-hover-color: color-mix(in srgb, var(--mt-accent-color) 100%, #ddddddcf 25%);
            --mt-background-primary-color: #f5f5f5;
            --mt-background-secondary-color: color-mix(in srgb, var(--mt-background-primary-color) 100%, #b6b6b6b9 25%);
            --mt-background-terciary-color: color-mix(in srgb, var(--mt-background-primary-color) 100%, #5c5c5cbf 25%);
            --mt-font-color: #000000;
        }

        #metrics-tracker {
            position: fixed;
            background-color: var(--mt-background-primary-color);
            width: calc(16.5em * var(--mt-tracker-scale));
            z-index: 1;
            border-radius: calc(1.5em * var(--mt-tracker-scale));
            border: 1px solid var(--mt-secondary-color);
            border-top: none;
            opacity: 0.95;
            overflow-y: auto;
            padding-top: calc(2.75em * var(--mt-tracker-scale));

        }

        .tracker-btn,
        .config-element,
        .tasks-input,
        .mt-label {
            font-size: calc(18px*var(--mt-tracker-scale));
            font-weight: bold;
            font-family: Consolas, monaco, monospace;
            text-align: center;
            color: var(--mt-font-color);
        }

        #metrics-tracker:has(#show-button:not(.hide)) {
            background-color: #ffffff00;
        }

        .tracker-bottom-right {
            right: 2vw;
            bottom: 2vw;
        }

        .tracker-bottom-left {
            left: 2vw;
            bottom: 2vw;
        }

        .tracker-top-right {
            right: 2vw;
            top: 3vw;
        }

        .tracker-top-left {
            left: 2vw;
            top: 3vw;
        }

        #metrics-tracker-bar {
            display: flex;
            flex-direction: row;
            background-color: var(--mt-secondary-color);
            border-radius: 30em;
            position: absolute;
            width: 100%;
            top: 0;
            gap: calc(0.2em * var(--mt-tracker-scale));
        }

        #hide-button {
            flex: 1 0;
        }

        #config-btn {
            width: 2.4em;
            height: 2.4em;
            padding: 0;
            margin-left: calc(0.1em * var(--mt-tracker-scale));
        }

        .tracker-btn {
            display: flex;
            justify-content: center;
            align-items: center;
            border: none;
            border-radius: 30em;
            background-color: var(--mt-primary-color);

            transition: 0.1s background-color ease-in;
        }

        .tracker-btn:hover {
            background-color: var(--mt-primary-hover-color);
        }

        .tracker-btn:active {
            background-color: var(--mt-accent-color);
        }

        #show-button {
            font-size: calc(24px*var(--mt-tracker-scale));
            width: calc(2.6em * var(--mt-tracker-scale));
            height: calc(2.6em * var(--mt-tracker-scale));
            border-radius: 20em;
        }

        #show-btn-icon {
            height: 57%;
            width: 57%;
            filter: var(--mt-icon-color);
        }

        .hide,
        .hide>div,
        .hide>label,
        .hide>input {
            display: none !important;
            width: auto !important;
            padding: 0;
            margin: 0;
        }

        .tasks-input {
            width: 2em;
            background-color: var(--mt-background-terciary-color);
            height: 1.2em;
            cursor: pointer;
            margin: calc(0.2em * var(--mt-tracker-scale)) 0em;
        }

        .tasks-input:hover {
            background-color: var(--mt-background-terciary-color);
        }

        #total-time-input {
            width: 5em;
        }

        #metrics-tracker-content {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            margin: calc(0.3em * var(--mt-tracker-scale));
        }

        .metrics-tracker-element {
            display: flex;
            justify-content: space-between;
            flex-direction: row;
            align-items: center;
            background-color: var(--mt-background-secondary-color);
            border-radius: 2em;
            height: calc(1.5em * var(--mt-tracker-scale));
            margin: calc(0.2em * var(--mt-tracker-scale));
            padding: calc(0.2em * var(--mt-tracker-scale)) calc(0.5em * var(--mt-tracker-scale));
            width: 90%;
        }

        #metrics-tracker-config {
            margin: calc(0.5em * var(--mt-tracker-scale)) calc(0.3em * var(--mt-tracker-scale));
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        #config-icon {
            width: 1.4em;
            height: 1.4em;
        }

        #corner-upper-left-icon {
            transform: rotate(-90deg);
        }

        #corner-upper-right-icon {
            transform: rotate(0deg);
        }

        #corner-lower-left-icon {
            transform: rotate(180deg);
        }

        #corner-lower-right-icon {
            transform: rotate(90deg);
        }

        .corner-btns {
            border-radius: 5px;
            width: 1.5em;
            height: 1.5em;
            padding: 0;
        }

        .corner-btn-icon {
            width: 2.5em;
            height: 2.5em;
        }

        .enabled-config {
            background-color: var(--mt-accent-color);
        }

        .enabled-config:hover {
            background-color: var(--mt-accent-hover-color);
        }

        .enabled-config:active {
            background-color: var(--mt-primary-hover-color);
        }

        .hidden-tracker {
            width: auto !important;
            border: none !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        .tracker-elements {
            margin: 0;
            padding: 0;
        }

        #opacity-level {
            width: 6em;
            accent-color: var(--mt-primary-color);
            background: var(--mt-background-primary-color);
            overflow: hidden;
            height: calc(6px * var(--mt-tracker-scale));
            border-radius: calc(3px * var(--mt-tracker-scale));
            border: none;
            margin-right: 0.1em;
        }

        #opacity-level::-moz-range-progress {
            background-color: var(--mt-primary-color);
        }

        #opacity-level::-moz-range-track {
            height: calc(6px * var(--mt-tracker-scale));
            background: var(--mt-background-primary-color);
            border: none;
            border-radius: calc(3px * var(--mt-tracker-scale));
        }

        #opacity-level::-moz-range-thumb {
            border: solid 1px var(--mt-primary-color);
            height: 10px;
            width: 10px;
            border-radius: 50%;
            background-color: var(--mt-primary-color);
        }

        #scale-controls {
            display: flex;
            flex-direction: row;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        #scale-increase {
            border-radius: 0em 20em 20em 0em;
            width: 1.4em;
        }

        #scale-decrease {
            border-radius: 20em 0em 0em 20em;
            width: 1.4em;
        }

        #scale-value {
            width: 3.2em;
            text-align: center;
            border: none;
            background-color: var(--mt-background-primary-color);
        }

        #position-btns {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: calc(0.3em * var(--mt-tracker-scale));
        }


        #declined-checkbox {
            width: calc(1.2em * var(--mt-tracker-scale));
            height: calc(1.2em * var(--mt-tracker-scale));
            margin-right: calc(1em * var(--mt-tracker-scale));
        }

        #visibility-icon {
            width: 1.5em;
            height: 1.5em;
        }

        #mt-colors {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: center;
            gap: calc(0.5em * var(--mt-tracker-scale));
        }

        .mt-color-container {
            width: calc(1.4em * var(--mt-tracker-scale));
            height: calc(1.4em * var(--mt-tracker-scale));
            display: block;
            align-items: center;
            justify-content: center;
            border-radius: 20em;
            border: solid calc(2px*var(--mt-tracker-scale)) #00000020;
        }

        .mt-color-input {
            width: calc(1.8em * var(--mt-tracker-scale));
            height: calc(1.8em * var(--mt-tracker-scale));
            border-radius: 20em;
            opacity: 0;
            border: none;
        }

        #mt-bg-color-container {
            background-color: var(--mt-background-primary-color);
        }

        #mt-font-color-container {
            background-color: var(--mt-font-color);
        }

        #mt-primary-color-container {
            background-color: var(--mt-primary-color);
        }

        #mt-accent-color-container {
            background-color: var(--mt-accent-color);
        }

        .mt-icon {
            fill: var(--mt-font-color);
        }

        #mt-reset-default {
            flex: 1;
        }
`;

let SMT_JS = `
    $(document).ready(function () {
        displayOpacity();
        displayDeclinedCounter();
        displayPosition();
        displayTracker();
        displayBGColor();
        displayFontColor();
        displayPrimaryColor();
        displayAccentColor();
        displayScale();
    });

    let configToggle = false;

    //Variable that stores the ID of the initialization function that will be set as an interval so that it can be cleared later.
    let initInterval;
    //Variable that stores the interval ID of the spinner checker.
    let spinnerInterval;
    //Variable that stores the interval ID of the error checker.
    let errorCheckInterval;
    //Variable that stores the timeout ID of the message close function.
    let closeMsgTimeout;
    // "ifSpinner" means that if there's currently a spinner loaded it will be true until that spinner is unloaded.
    let ifSpinner = false;
    //Makes a new Date type object that will determine the current date for ID purposes.
    let curDate = new Date();

    let timeBefore;

    //ID variables for local storage.
    let workID;
    let countID;
    let timeID;
    let curTimeID;
    let declinedCountID;

    //Gets the initial URL for later comparisons between changes on the URL(for example if the user opens Sagemaker and starts a Job on the main page, that would change the URL).
    let lastURL = location.href;

    //Lists to store a "history" of the progress between processed tasks so that the users can undo and redo that progress. This is useful in the event of errors while submitting a task.
    let previousTime = [];
    let previousCount = [];
    let nextTime = [];
    let nextCount = [];

    let lastTime;
    let firstLoad = true;

    //sets an interval that checks all the time if some part of the website have loaded and if the page isn't the default Sagemaker URL.
    initInterval = setInterval(initialize, 0);

    //UI Functions

    function resetDefaults() {
        localStorage.setItem('position', 'bottomRight');
        localStorage.setItem('opacityValue', 0.95);
        localStorage.setItem('mtScale', '1');
        localStorage.setItem('bgColor', '#f5f5f5');
        localStorage.setItem('fontColor', '#000000');
        localStorage.setItem('primaryColor', '#0696c6');
        localStorage.setItem('accentColor', '#29c37e');
        localStorage.setItem('sumDeclinedTaskTime', false);
        displayOpacity();
        displayDeclinedCounter();
        displayPosition();
        displayBGColor();
        displayFontColor();
        displayPrimaryColor();
        displayAccentColor();
        displayScale();
    }

    function toggleConfig() {
        configToggle = !configToggle;
        if (configToggle) {
            $("#metrics-tracker-content").addClass("hide");
            $("#metrics-tracker-config").removeClass("hide");
            $("#config-btn").addClass("enabled-config");
        }
        else {
            $("#metrics-tracker-content").removeClass("hide");
            $("#metrics-tracker-config").addClass("hide");
            $("#config-btn").removeClass("enabled-config");
        }
    }

    function toggleTracker() {
        localStorage.setItem('displayToggle', !toBool(localStorage.getItem('displayToggle')));
        displayTracker();
    }

    function displayTracker() {
        if (!localStorage.getItem('displayToggle')) {
            localStorage.setItem('displayToggle', true);
        }

        if (toBool(localStorage.getItem('displayToggle'))) {
            $("#tracker-elements").removeClass("hide");
            $("#show-button").addClass("hide");
            $("#metrics-tracker").removeClass("hidden-tracker");
        }
        else {
            $("#tracker-elements").addClass("hide");
            $("#show-button").removeClass("hide");
            $("#metrics-tracker").addClass("hidden-tracker");
        }
    }

    function toggleDeclinedCounter() {
        localStorage.setItem('sumDeclinedTaskTime', !toBool(localStorage.getItem('sumDeclinedTaskTime')));
        displayDeclinedCounter();
    }

    function displayDeclinedCounter() {
        if (!localStorage.getItem('sumDeclinedTaskTime')) {
            localStorage.setItem('sumDeclinedTaskTime', false);
        }
        else {
            $('#declined-checkbox')[0].checked = toBool(localStorage.getItem('sumDeclinedTaskTime'));
        }

        if (toBool(localStorage.getItem('sumDeclinedTaskTime'))) {
            $("#declined-tasks-element").removeClass("hide");
        }
        else {
            $("#declined-tasks-element").addClass("hide");
        }

    }

    function setOpacity() {
        let newStyle = $("#opacity-level")[0].value / 100;
        localStorage.setItem('opacityValue', newStyle);
        displayOpacity();
    }

    function displayOpacity() {
        if (!localStorage.getItem('opacityValue')) {
            localStorage.setItem('opacityValue', 0.95);
        }
        let opacityVal = parseFloat(localStorage.getItem('opacityValue')) * 100;
        $("#opacity-level")[0].value = opacityVal;
        $("#metrics-tracker")[0].style.opacity = localStorage.getItem('opacityValue');
    }

    function setBGColor() {
        localStorage.setItem('bgColor', $("#mt-bg-color-input").val());
        displayBGColor();
    }

    function displayBGColor() {
        if (!localStorage.getItem('bgColor')) {
            localStorage.setItem('bgColor', '#f5f5f5');
        }
        $("#mt-bg-color-input").val(localStorage.getItem('bgColor'));
        document.documentElement.style.setProperty('--mt-background-primary-color', localStorage.getItem('bgColor'));
    }

    function setFontColor() {
        localStorage.setItem('fontColor', $("#mt-font-color-input").val());
        displayFontColor();
    }

    function displayFontColor() {
        if (!localStorage.getItem('fontColor')) {
            localStorage.setItem('fontColor', '#000000');
        }
        $("#mt-font-color-input").val(localStorage.getItem('fontColor'));
        document.documentElement.style.setProperty('--mt-font-color', localStorage.getItem('fontColor'));
    }

    function setPrimaryColor() {
        localStorage.setItem('primaryColor', $("#mt-primary-color-input").val());
        displayPrimaryColor();
    }

    function displayPrimaryColor() {
        if (!localStorage.getItem('primaryColor')) {
            localStorage.setItem('primaryColor', '#0696c6');
        }
        $("#mt-primary-color-input").val(localStorage.getItem('primaryColor'));
        document.documentElement.style.setProperty('--mt-primary-color', localStorage.getItem('primaryColor'));
    }

    function setAccentColor() {
        localStorage.setItem('accentColor', $("#mt-accent-color-input").val());
        displayAccentColor();
    }

    function displayAccentColor() {
        if (!localStorage.getItem('accentColor')) {
            localStorage.setItem('accentColor', '#29c37e');
        }
        $("#mt-accent-color-input").val(localStorage.getItem('accentColor'));
        document.documentElement.style.setProperty('--mt-accent-color', localStorage.getItem('accentColor'));
    }

    function increaseScale() {
        localStorage.setItem('mtScale', Number(localStorage.getItem('mtScale')) + 0.01);
        displayScale();
    }

    function decreaseScale() {
        if ((Number(localStorage.getItem('mtScale')) - 0.01) > 0) {
            localStorage.setItem('mtScale', Number(localStorage.getItem('mtScale')) - 0.01);
        }
        displayScale();
    }
    function displayScale() {
        if (!localStorage.getItem('mtScale')) {
            localStorage.setItem('mtScale', '1');
        }
        $('#scale-value').val(Number(localStorage.getItem('mtScale')).toFixed(2) + 'x');
        document.documentElement.style.setProperty('--mt-tracker-scale', localStorage.getItem('mtScale'));
    }

    function topRightPosition() {
        localStorage.setItem('position', 'topRight');
        displayPosition();
    }

    function topLeftPosition() {
        localStorage.setItem('position', 'topLeft');
        displayPosition();
    }

    function bottomRightPosition() {
        localStorage.setItem('position', 'bottomRight');
        displayPosition();
    }

    function bottomLeftPosition() {
        localStorage.setItem('position', 'bottomLeft');
        displayPosition();
    }

    function displayPosition() {
        if (!localStorage.getItem('position')) {
            localStorage.setItem('position', 'bottomRight');
        }

        switch (localStorage.getItem('position')) {
            case 'topLeft':
                $("#metrics-tracker")[0].className = "tracker-top-left";
                $(".corner-btns").removeClass("enabled-config");
                $("#top-left-btn").addClass("enabled-config");
                break;
            case 'topRight':
                $("#metrics-tracker")[0].className = "tracker-top-right";
                $(".corner-btns").removeClass("enabled-config");
                $("#top-right-btn").addClass("enabled-config");
                break;
            case 'bottomLeft':
                $("#metrics-tracker")[0].className = "tracker-bottom-left";
                $(".corner-btns").removeClass("enabled-config");
                $("#bottom-left-btn").addClass("enabled-config");
                break;
            case 'bottomRight':
                $("#metrics-tracker")[0].className = "tracker-bottom-right";
                $(".corner-btns").removeClass("enabled-config");
                $("#bottom-right-btn").addClass("enabled-config");
                break;
        }
    }

    //SMT Functions

    function initialize() {//Sets up variables once part of the website loads
        //if(location.href!="https://v6ke42cho6.labeling.us-east-1.sagemaker.aws/#/workstreams"){
        if (location.href.includes("https://v6ke42cho6.labeling.us-east-1.sagemaker.aws/#/work/")) {

            //checks if an element of the page (footer) exists
            if (document.getElementsByClassName("cswui-footer")[0]) {
                //Sets the IDs for the processed tasks counter, the total sum of time spent in all tasks of this Sagemaker Job, and for the current task time.
                //The format for the IDs is "UUID.Month/Day-Type" where C is Counter, T is Time, CT is Current Time and DC is Declined Count.
                //The month and day are important to keep in consideration since the MLDA wouldn't want to see the metrics from past days while monitoring their daily performance.
                workID = getWorkID();
                let baseID = workID + '.' + (curDate.getMonth() + 1) + '/' + curDate.getDate();
                countID = baseID + "-C";
                timeID = baseID + "-T";
                curTimeID = baseID + "-CT";
                declinedCountID = baseID + "-DC";

                //Initializes values if they don't exist to avoid display errors.
                if (!localStorage.getItem(declinedCountID)) {
                    localStorage.setItem(declinedCountID, 0);
                }
                if (!localStorage.getItem(countID)) {
                    localStorage.setItem(countID, 0);
                }
                if (!localStorage.getItem(timeID)) {
                    localStorage.setItem(timeID, "00:00:00");
                }
                if (!localStorage.getItem(curTimeID)) {
                    localStorage.setItem(curTimeID, "00:00");
                }
                if (!localStorage.getItem("altFormat")) {
                    localStorage.setItem("altFormat", false);
                }

                lastURL = location.href;
                setInterval(checkURLChange, 100);
                clearInterval(spinnerInterval);
                spinnerInterval = setInterval(checkSpinner, 1);
                errorCheckInterval = setInterval(closeMessage, 1);

                //Stops this function (initialize()) from running.
                clearInterval(initInterval);
            }
        }
    }

    function checkURLChange() {
        //Checks if the last stored URL is different from the currently displayed URL and in case it does, the last value gets replaced by the new one.
        //Since every time a user releases a task their task time is recorded even if the user didn't submit it, the script mimics that and stores the last task time in the total time value, in order to mantain accuracy with Cloudwatch.
        if (location.href != lastURL) {
            lastURL = location.href;
            addToTimer();
            clearInterval(errorCheckInterval);
            initInterval = setInterval(initialize, 0);//The initialize function gets called again in an interval to check if the current URL matches a Sagemaker Job url.
            localStorage.setItem(curTimeID, "00:00");
            firstLoad=true;
        }
    }

    function getWorkID() {
        //gets the UUID of the current Sagemaker job from the URL.
        return location.href.split('/')[5];
    }

    function addToCounter() {
        //increments the value of the current counter by 1 and stores it in Local Storage.
        previousCount.push(localStorage.getItem(countID));
        nextCount = [];
        localStorage.setItem(countID, Number(localStorage.getItem(countID)) + 1);
    }

    function addToDeclinedCounter() {
        localStorage.setItem(declinedCountID, Number(localStorage.getItem(declinedCountID)) + 1);
    }

    function addToTimer() {
        //Takes the Task Time that is currently being displayed on the task and adds it to the Total Time value stored in Local Storage.
        previousTime.push(localStorage.getItem(timeID));
        nextTime = [];
        let taskTime = localStorage.getItem(curTimeID);
        let newTime = sumTimes(localStorage.getItem(timeID), taskTime);
        localStorage.setItem(timeID, newTime);
    }

    function setCurrentTaskTime() {
        //Gets the element that contains the current Task Time and splits it based on whitespaces.
        //This values gets saved on Local Storage so that in case anything wrong happens with the value on the Job it saves the last value displayed.
        let taskTime = "00:00";
        if(document.getElementsByClassName("completion-timer")[0]){
            taskTime = document.getElementsByClassName("completion-timer")[0].innerHTML.split(" ")[0];
                    if (timeToSeconds(taskTime) < timeToSeconds(localStorage.getItem(curTimeID))) {
            if (checkErrorMessages()) {
                checkDeclinedTaskMessage();
            }
        }

        localStorage.setItem(curTimeID, taskTime);
        }

    }

    function displayTimer() {
        //Shows a sum of the Total Time with the current Task Time without actually saving that new value.
        //This is in order to stop the current time from adding itself infinitely to the total time until the current task is completed.
        let sum = sumTimes(localStorage.getItem(timeID), localStorage.getItem(curTimeID));
        if (localStorage.getItem("altFormat") == "true") {
            $('#total-time-input').val(alternativeTimeFormat(sum));
        }
        else {
            $('#total-time-input').val(sum);
        }
    }

    function displayCounter() {
        if (toBool(localStorage.getItem("sumDeclinedTaskTime"))) {
            $('#declined-tasks-input').val(localStorage.getItem(declinedCountID));
        }
        $('#processed-tasks-input').val(localStorage.getItem(countID));

    }

    function checkSpinner() {
        //Checks if a loading "spinner" element exists. This is because each time a task is completed, a spinner shows up until a new task loads up.
        //If it does, the values of the counter and the timer increase accordingly. This is executed only once until the spinner disappears, so that it doesn't increment multiple times at once.

        let spinner = 0;
        if(document.getElementsByClassName("cswui-spinner")){
            spinner = document.getElementsByClassName("cswui-spinner").length;
        }
        displayCounter();
        setCurrentTaskTime();
        if (spinner == 1) {
            if (ifSpinner == false) {
                ifSpinner = true;
                lastTime = localStorage.getItem(curTimeID);
                timeBefore=new Date();
            }
        }
        else {
            if (ifSpinner == true) {
                if (checkErrorMessages() == false) {
                    if(firstLoad==false){
                        addToCounter();
                        let currentDateTime = new Date();
                        let timePassed = ((currentDateTime-timeBefore)/1000).toFixed(0);
                        localStorage.setItem(curTimeID, sumTimes(lastTime,"00:"+timePassed));
                        addToTimer();
                        localStorage.setItem(curTimeID,"00:00");
                    }
                    else firstLoad=false;
                }
                ifSpinner = false;
            }
            else {
                //Display the value of the timer only if a spinner doesn't exist, since otherwise it would show the new value added two times, which would be innacurate for a few seconds.
                displayTimer();
            }
        }
    }

    function timeFormat(num) {
        //if the number is below 10 that means that it only has 1 digit, therefore it doesn't comply with the "hh:mm:ss"
        //format and it gets a 0 added before the number, which finally is returned as a string.
        if (num < 10) {
            return "0" + num;
        }
        else return num.toString();
    }

    function hmsFormat(time) {
        //Creates an organized object by splitting a time string ("hh:mm:ss" or "mm:ss") based on the amount of colons it has.
        let timeArray = time.split(":");
        switch (timeArray.length) {
            case 1:
                return { s: time }
                break;
            case 2:
                return { m: timeArray[0], s: timeArray[1] }
                break;
            case 3:
                return { h: timeArray[0], m: timeArray[1], s: timeArray[2] }
                break;
            default:
                console.log("huh");
                return { h: 0, m: 0, s: 0 };
        }
    }

    function sumTimes(T1, T2) {
        //Sums two time values with the format "hh:mm:ss" and returns the sum as a string
        let T1Ar = hmsFormat(T1);
        let T2Ar = hmsFormat(T2);
        let s = 0;
        let m = 0;
        let h = 0;
        //Adds each value from both times respectively if they exist
        s += T1Ar.s ? Number(T1Ar.s) : 0;
        s += T2Ar.s ? Number(T2Ar.s) : 0;
        m += T1Ar.m ? Number(T1Ar.m) : 0;
        m += T2Ar.m ? Number(T2Ar.m) : 0;
        h += T1Ar.h ? Number(T1Ar.h) : 0;
        h += T2Ar.h ? Number(T2Ar.h) : 0;
        //Divides both minutes and seconds to add them to their equivalent measures and sets their own values as their remainders.
        m += Math.floor(s / 60);
        h += Math.floor(m / 60);
        m = m % 60;
        s = s % 60;
        //Returns the time in a "hh:mm:ss" format to display it on the page.
        return timeFormat(h) + ':' + timeFormat(m) + ':' + timeFormat(s);
    }

    function timeToSeconds(time) {
        //Converts any "hh:mm:ss" value to its equivalent in seconds.
        let t = hmsFormat(time);
        let h = t.h ? Number(t.h) : 0;
        let m = t.m ? Number(t.m) : 0;
        let s = t.s ? Number(t.s) : 0;
        let seconds = ((h * 60) + m) * 60 + s;
        return seconds;
    }

    function alternativeTimeFormat(time) {
        //Displays an "hh:mm:ss" time format in an alternative format "5.49h, 34min, 13s respectively".
        let t = hmsFormat(time);
        let h = t.h ? Number(t.h) : 0;
        let m = t.m ? Number(t.m) : 0;
        let s = t.s ? Number(t.s) : 0;

        if (h > 0) {
            let minutes = m + (s / 60);
            let hours = h + (minutes / 60);//Minutes get divided by 60 to display the decimals for the total amount of hours since that's the largest time measure that is possible within a day, and to keep parity with Cloudwatch.
            return hours.toPrecision(3) + 'h';//this function shows the rounded value by two decimals (for example 1.23)
        }
        else if (m > 0) {
            let minutes = m + (s / 60);
            return minutes.toPrecision(3) + " min";
        }
        else {
            return s + 's';
        }
    }

    function setPreviousValue() {
        //Sets the previously stored values in both the count and time lists and adds it to the next values lists in case the user wants to redo their changes.
        if (previousCount.length > 0) {//checks if the list isn't empty to avoid errors
            nextCount.push(localStorage.getItem(countID));
            localStorage.setItem(countID, previousCount.pop());
        }
        if (previousTime.length > 0) {
            nextTime.push(localStorage.getItem(timeID));
            localStorage.setItem(timeID, previousTime.pop());
        }
    }

    function setNextValue() {
        //Sets the next count and time values from their respective lists and stores the current value in the previous lists in case the use wants to undo their changes.
        if (nextCount.length > 0) {
            previousCount.push(localStorage.getItem(countID));
            localStorage.setItem(countID, nextCount.pop());
        }
        if (nextTime.length > 0) {
            previousTime.push(localStorage.getItem(timeID));
            localStorage.setItem(timeID, nextTime.pop());
        }
    }

    function checkErrorMessages() {
        //alertMessage will read the element that contains the message displayed at the top of the page if there's an error.
        let alertMessage = document.getElementsByClassName("cswui-message")[0];
        let isShown = true;
        if(alertMessage){
            if (alertMessage.getAttribute("awsui-alert-hidden")) {//if the alert message element is hidden when the task is submitted, it can be concluded that it was done so successfully.
                //This returns false because the element will only contain this attribute if it's not being displayed.
                isShown = false;
            }
        }
        else isShown = false;
        return isShown;
    }

    function closeMessage() {
        //This function gets called in an interval to check whether there's any alert message and will close it after a timeout passes.
        if (!closeMsgTimeout) {
            let alertMessage = document.getElementsByClassName("cswui-message")[0];
            if(alertMessage){
            if (!alertMessage.getAttribute("awsui-alert-hidden")) {
                closeMsgTimeout = setTimeout(() => {//A timeout is made so that the error message will be hidden after two seconds in case the user forgot to dismiss the message window.
                    //A three second timeout feels right since it gives the user enough time to check it out but not enough so that the user accidentally submits a task without closing it.
                    document.getElementsByClassName("awsui-alert-dismiss")[0].children[0].children[0].click();//This will simulate a click on the dismiss button.
                    closeMsgTimeout = null;
                }, 3000);
            }
            }
        }
    }

    function toBool(value) {
        if (value == "true") {
            return true;
        }
        else if (value == "false") {
            return false;
        }
        else {
            console.log(value + " is not a valid string bool.");
            return false;
        }
    }

    function checkDeclinedTaskMessage() {

        if (toBool(localStorage.getItem("sumDeclinedTaskTime"))) {
            let alertHeader = $(".awsui-alert-header")[0];
            if (alertHeader) {
                if (alertHeader.innerHTML == "You successfully declined the task") {
                    addToTimer();
                    addToDeclinedCounter();
                }
            }
        }
    }

    function alternateTimeFormat() {
        let v = localStorage.getItem("altFormat");
        if (v == "true") {
            localStorage.setItem("altFormat", false);
        }
        else if (v == "false") {
            localStorage.setItem("altFormat", true);
        }
    }
`;


$( document ).ready(function() {
    let SMT_div = document.createElement("div");
    SMT_div.style = "font-size:16px;";
    SMT_div.innerHTML+=SMT_HTML;
    document.body.append(SMT_div);
    let style = document.createElement('style');
    style.innerHTML+=SMT_CSS;
    document.head.prepend(style);
    let script = document.createElement('script');
    script.textContent = SMT_JS;
    document.body.append(script);
});
