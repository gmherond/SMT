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
