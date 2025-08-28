// ==UserScript==
// @name         SMT
// @namespace    http://tampermonkey.net/
// @version      3.2.1
// @description  Adds a metrics tracker "mini app" that keeps tracks of the amount of processed tasks and the total time a user has worked on a Sagemaker job.
// @author       elgustav@
// @include      https://*.sagemaker.aws/
// @icon         https://raw.githubusercontent.com/gmherond/SMT/refs/heads/main/assets/SMT%20Icon.svg
// @grant        none
// @require      http://code.jquery.com/jquery-3.7.1.min.js
// @downloadURL  https://github.com/gmherond/SMT/raw/refs/heads/main/SMT-Tampermonkey-Script.user.js
// @updateURL    https://github.com/gmherond/SMT/raw/refs/heads/main/SMT-Tampermonkey-Script.user.js
// ==/UserScript==

/*
Changelog 3.2.1
-Fixed bug where if Sagemaker displayed negative time the total time value would be displayed as NaN.
-Replaced main labels with icons to reduce the space ocuppied by the tracker.
-Replaced font.
-Added an option to edit the current task count and the total timer.
-Added a button to freely move the tracker anywhere on the screen.
Changelog 3.1.5
-Added an icon for Sagemaker.
Changelog 3.1.3
-Added a download URL so that the user can automatically update the script without downloading anything.
Changelog 3.1.2
-The tracker should now keep track of the last processed data even if a job runs out of tasks.
-If the user releases a job and tries to change the display mode of the timer, it will change properly now.
Changelog 3.1.1
-The timer now takes into consideration the time passed between a submitted task and a new task loaded, making the timer more accurate to the
Cloudwatch Dashboard.
-Additionally, seconds are also taking into consideration for the alternative time format, making it more precise and in par with the respective Dashboard
for that job.
*/

console.log("SMT Version 3.2.0");

let SMT_HTML = `
	<div id="smt-background" class="hide"></div>
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
						<button id="custom-position-btn"
                            class="tracker-btn corner-btns enabled-config">
							<svg class="corner-btn-icon mt-icon" id="corner-custom-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M160-120v-170l527-526q12-12 27-18t30-6q16 0 30.5 6t25.5 18l56 56q12 11 18 25.5t6 30.5q0 15-6 30t-18 27L330-120H160Zm80-80h56l393-392-28-29-29-28-392 393v56Zm560-503-57-57 57 57Zm-139 82-29-28 57 57-28-29ZM560-120q74 0 137-37t63-103q0-36-19-62t-51-45l-59 59q23 10 36 22t13 26q0 23-36.5 41.5T560-200q-17 0-28.5 11.5T520-160q0 17 11.5 28.5T560-120ZM183-426l60-60q-20-8-31.5-16.5T200-520q0-12 18-24t76-37q88-38 117-69t29-70q0-55-44-87.5T280-840q-45 0-80.5 16T145-785q-11 13-9 29t15 26q13 11 29 9t27-13q14-14 31-20t42-6q41 0 60.5 12t19.5 28q0 14-17.5 25.5T262-654q-80 35-111 63.5T120-520q0 32 17 54.5t46 39.5Z"/></svg>
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
                    <label class="mt-label">Declined Tasks</label>
                    <input type="checkbox" id="declined-checkbox" onclick="toggleDeclinedCounter()">
                </div>
                <div class="metrics-tracker-element">
                    <button class="tracker-btn" id="mt-reset-default" onclick="resetDefaults()">Reset to
                        Default</button>
                </div>
            </div>
            <div id="metrics-tracker-content">
                <div class="metrics-tracker-element">
                    <label class="mt-label hide" for="processed-tasks-input">Processed Tasks</label>
					<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M360-270h160q35 0 57.5-25t22.5-55v-30q0-23-17-41.5T540-440q26 0 43-18.5t17-41.5v-30q0-30-22.5-55T520-610H360v80h160v50H400v80h120v50H360v80Zm0-570v-80h240v80H360ZM480-80q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-280Z"/></svg>
                    <input id="processed-tasks-input" class="tracker-btn tasks-input" value="0" readonly>
					<button class="smt-edit-icon-button" onclick="toggleCounterEdit()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93ZM320-320v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T663-540L443-320H320Zm300-263-37-37 37 37ZM380-380h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"/></svg>
                	</button>
				</div>
				<div class="hide smt-edit-element metrics-tracker-element" id="smt-processed-tasks-edit">
					<button class="smt-edit-icon-button" onclick="toggleCounterEdit()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
					</button>
					<input id="processed-tasks-edit-input" class="tasks-edit-input tracker-btn tasks-input" value="0">
					<button class="smt-edit-icon-button" onclick="modifyCounter()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
					</button>
				</div>
                <div class="metrics-tracker-element hide" id="declined-tasks-element">
					<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m798-274-60-60q11-27 16.5-53.5T760-440q0-116-82-198t-198-82q-24 0-51 5t-56 16l-60-60q38-20 80.5-30.5T480-800q60 0 117.5 20T706-722l56-56 56 56-56 56q38 51 58 108.5T840-440q0 42-10.5 83.5T798-274ZM520-552v-88h-80v8l80 80ZM792-56l-96-96q-48 35-103.5 53.5T480-80q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-60 18.5-115.5T192-656L56-792l56-56 736 736-56 56ZM480-160q42 0 82-13t75-37L248-599q-24 35-36 75t-12 84q0 116 82 198t198 82ZM360-840v-80h240v80H360Zm83 435Zm113-112Z"/></svg>
                    <input id="declined-tasks-input" class="tracker-btn tasks-input" value="0" readonly>
					<button class="smt-edit-icon-button" onclick="toggleDeclinedCounterEdit()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93ZM320-320v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T663-540L443-320H320Zm300-263-37-37 37 37ZM380-380h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"/></svg>
                	</button>
				</div>
				<div class="metrics-tracker-element hide" id="smt-declined-tasks-edit">
					<button class="smt-edit-icon-button" onclick="toggleDeclinedCounterEdit()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
					</button>
					<input id="declined-tasks-input-edit" class="tasks-edit-input tracker-btn tasks-input" value="0">
					<button class="smt-edit-icon-button" onclick="modifyDeclinedCounter()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
					</button>
				</div>
                <div class="metrics-tracker-element">
                    <label class="mt-label hide" for="total-time-input">Total Time</label>
					<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z"/></svg>
                    <input id="total-time-input" class="tracker-btn tasks-input" value="00:00:00" readonly
                        onclick="alternateTimeFormat()">
					<button class="smt-edit-icon-button" onclick="toggleTimerEdit()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93ZM320-320v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T663-540L443-320H320Zm300-263-37-37 37 37ZM380-380h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"/></svg>
                	</button>
				</div>
				<div class="hide smt-edit-element metrics-tracker-element" id="smt-total-time-edit">
					<button class="smt-edit-icon-button" onclick="toggleTimerEdit()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
					</button>
					<input id="total-time-input-edit" class="tasks-edit-input tracker-btn tasks-input" value="00:00:00">
					<button class="smt-edit-icon-button" onclick="modifyTimer()">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
					</button>
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
			--mt-accent-secondary-color: color-mix(in srgb, var(--mt-accent-color) 100%, #000000bb 25%);
            --mt-accent-hover-color: color-mix(in srgb, var(--mt-accent-color) 100%, #ddddddcf 25%);
            --mt-background-primary-color: #f5f5f5;
            --mt-background-secondary-color: color-mix(in srgb, var(--mt-background-primary-color) 100%, #b6b6b6b9 25%);
            --mt-background-terciary-color: color-mix(in srgb, var(--mt-background-primary-color) 100%, #5c5c5cbf 25%);
            --mt-font-color: #000000;
			--mt-custom-left-position:0;
			--mt-custom-top-position:0;
			--mt-custom-right-position:0;
			--mt-custom-bottom-position:0;
        }

		#smt-background{
			position:fixed;
			width:100vw;
			height:100vh;
			padding:0;
			margin:0;
			background-color:#00000077;
			top:0;
			left:0;
			z-index:1;
		}

        #metrics-tracker {
            position: fixed;
            background-color: var(--mt-background-primary-color);
            max-width: calc(16.5em * var(--mt-tracker-scale));
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
            font-size: calc(17.75px*var(--mt-tracker-scale));
            font-weight:550;
            font-family: "Segoe UI", Frutiger, "Frutiger Linotype", "Dejavu Sans", "Helvetica Neue", Arial, sans-serif;
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

		.tracker-custom-position{
			right: var(--mt-custom-right-position);
			top: var(--mt-custom-top-position);
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
			outline:none;
        }

        .tracker-btn {
            display: flex;
            justify-content: center;
            align-items: center;
            border: none;
            border-radius: 30em;
            background-color: var(--mt-primary-color);
			cursor:pointer;
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
            width: 5em;
            background-color: var(--mt-background-terciary-color);
            height: 1.2em;
            cursor: pointer;
            margin: calc(0.2em * var(--mt-tracker-scale)) 0em;
        }

        .tasks-input:hover {
            background-color: var(--mt-background-terciary-color);
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

		#custom-position-btn{
			cursor:grab;
		}

		#custom-position-btn:active{
			cursor:grabbing;
		}

        .corner-btns {
            border-radius: 5px;
            width: 1.25em;
            height: 1.25em;
            padding: 0;
			cursor:pointer;
        }

        .corner-btn-icon {
            width: 1.25em;
            height: 1.25em;
        }

        .enabled-config {
            background-color: var(--mt-accent-color);
        }

        .enabled-config:hover {
            background-color: var(--mt-accent-hover-color);
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

		.flex-center{
			display:flex;
			justify-content:center;
			align-items:center;
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
			margin-left: calc(0.5em * var(--mt-tracker-scale));
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
            gap: calc(0.25em * var(--mt-tracker-scale));
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
			cursor:pointer;
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

		#smt-edit-btn{
			gap:1em;
		}

		.smt-edit-icon-button{
			background: none;
    		border: none;
    		border-radius: 20em;
    		width: 1.5em;
    		height: 1.5em;
    		display: flex;
    		justify-content: center;
    		align-items: center;
    		padding: 0;
			cursor:pointer;
		}

		.smt-edit-icon-button > svg{
			fill: var(--mt-font-color);
		}

		.smt-edit-element{
			background-color:var(--mt-accent-color);
		}

		.tasks-edit-input{
			background-color:var(--mt-accent-secondary-color);
			outline:none;
			cursor:text;
		}

		.tasks-edit-input:hover{
			background-color:var(--mt-accent-hover-color);
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
	displayCustomPosition();

	document.getElementById("total-time-input").addEventListener("contextmenu",function(e){
		e.preventDefault();
		rightClickEditTime();
	});
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

let mousePositionInterval;

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
let editingCounter=false;
let editingTimer=false;
let editingDeclinedCounter=false;

//sets an interval that checks all the time if some part of the website have loaded and if the page isn't the default Sagemaker URL.
initInterval = setInterval(initialize, 0);

let mouseX=0;
let mouseY=0;

//UI Functions

window.addEventListener("mousemove",(e)=>{
	mouseX = e.pageX;
	mouseY = e.pageY;
});

window.addEventListener("mouseup",(e)=>{
	clearInterval(mousePositionInterval);
	document.getElementById("smt-background").className="hide";
});

document.getElementById("custom-position-btn").addEventListener("mousedown",()=>{

	document.getElementById("smt-background").className="";
	setCustomPosition();
	mousePositionInterval = setInterval(setCustomPosition,1);
	customPosition();
});

function setCustomPosition(){
	let trackerWidth = document.getElementById("metrics-tracker").getBoundingClientRect().width;
	let trackerHeight = document.getElementById("metrics-tracker").getBoundingClientRect().height;
	let customPositionX = (window.innerWidth-mouseX-(trackerWidth-trackerWidth*0.85))/window.innerWidth;
	let customPositionY = (mouseY-(trackerHeight*0.25))/window.innerHeight;

	localStorage.setItem("customPositionX",customPositionX*100);
	localStorage.setItem("customPositionY",customPositionY*100);

	displayCustomPosition();
}

function displayCustomPosition(){
	document.documentElement.style.setProperty('--mt-custom-right-position', localStorage.getItem("customPositionX")+"%");
	document.documentElement.style.setProperty('--mt-custom-top-position', localStorage.getItem("customPositionY")+"%");
}

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

function toggleCounterEdit(){
	editingCounter = !editingCounter;
	if(editingCounter){
		document.getElementById("smt-processed-tasks-edit").className="smt-edit-element metrics-tracker-element";
		document.getElementById("processed-tasks-input-edit").focus();
	}
	else{
		document.getElementById("smt-processed-tasks-edit").className="hide smt-edit-element metrics-tracker-element";
	}
}

function toggleDeclinedCounterEdit(){
	editingDeclinedCounter = !editingDeclinedCounter;
	if(editingDeclinedCounter){
		document.getElementById("smt-declined-tasks-edit").className="smt-edit-element metrics-tracker-element";
		document.getElementById("declined-tasks-input-edit").focus();
	}
	else{
		document.getElementById("smt-declined-tasks-edit").className="hide smt-edit-element metrics-tracker-element";
	}
}

function toggleTimerEdit(){
	editingTimer = !editingTimer;
	if(editingTimer){
		document.getElementById("smt-total-time-edit").className="smt-edit-element metrics-tracker-element";
		document.getElementById("total-time-input-edit").focus();
	}
	else{
		document.getElementById("smt-total-time-edit").className="hide smt-edit-element metrics-tracker-element";
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
		if(editingDeclinedCounter==true){
			toggleDeclinedCounterEdit();
		}
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

function customPosition(){
	localStorage.setItem('position', 'custom');
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
		case 'custom':
			$("#metrics-tracker")[0].className = "tracker-custom-position";
			$(".corner-btns").removeClass("enabled-config");
			$("#custom-position-btn").addClass("enabled-config");
			break;
	}
}

//SMT Functions

function initialize() {//Sets up variables once part of the website loads
	//if(!location.href.endsWith("workstreams")){
	if (location.href.includes("sagemaker.aws/#/work/")) {

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
	document.getElementById("processed-tasks-edit-input").value = localStorage.getItem(countID);
}

function addToDeclinedCounter() {
	localStorage.setItem(declinedCountID, Number(localStorage.getItem(declinedCountID)) + 1);
}

function modifyCounter(){
	let new_value = document.getElementById("processed-tasks-edit-input").value;
	if(Number(new_value)!=NaN){
		localStorage.setItem(countID,new_value);
		toggleCounterEdit();
	}
}

function modifyDeclinedCounter(){
	let new_value = document.getElementById("declined-tasks-input-edit").value;
	if(Number(new_value)!=NaN){
		localStorage.setItem(declinedCountID,new_value);
		toggleDeclinedCounterEdit();
	}
}

function modifyTimer(){
	let new_value = document.getElementById("total-time-input-edit").value;
	if(isTimeFormat(new_value)){
		localStorage.setItem(timeID,new_value);
		toggleTimerEdit();
	}
}

function addToTimer() {
	//Takes the Task Time that is currently being displayed on the task and adds it to the Total Time value stored in Local Storage.
	previousTime.push(localStorage.getItem(timeID));
	nextTime = [];
	let taskTime = localStorage.getItem(curTimeID);
	let newTime = sumTimes(localStorage.getItem(timeID), taskTime);
	localStorage.setItem(timeID, newTime);
	document.getElementById("total-time-input-edit").value = localStorage.getItem(timeID);
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
			document.getElementById("processed-tasks-edit-input").value = localStorage.getItem(countID);
			document.getElementById("declined-tasks-input-edit").value = localStorage.getItem(declinedCountID);
			document.getElementById("total-time-input-edit").value = localStorage.getItem(timeID);
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

function isTimeFormat(time){
	let timeArray = time.split(":");
	if(timeArray.length>3){
		return false;
	}
	for(let i=0;i<timeArray.length;i++){
		if(Number(timeArray[i])==NaN){
			return false;
		}
	}
	return true;
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
	s += Number(T1Ar.s) ? checkPositive(Number(T1Ar.s)) : 0;
	s += Number(T2Ar.s) ? checkPositive(Number(T2Ar.s)) : 0;
	m += Number(T1Ar.m) ? checkPositive(Number(T1Ar.m)) : 0;
	m += Number(T2Ar.m) ? checkPositive(Number(T2Ar.m)) : 0;
	h += Number(T1Ar.h) ? checkPositive(Number(T1Ar.h)) : 0;
	h += Number(T2Ar.h) ? checkPositive(Number(T2Ar.h)) : 0;
	//Divides both minutes and seconds to add them to their equivalent measures and sets their own values as their remainders.
	m += Math.floor(s / 60);
	h += Math.floor(m / 60);
	m = m % 60;
	s = s % 60;
	//Returns the time in a "hh:mm:ss" format to display it on the page.
	return timeFormat(h) + ':' + timeFormat(m) + ':' + timeFormat(s);
}

function checkPositive(value){
	if(value>=0){
		return value;
	}
	else{
		return 0;
	}
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
}`
;

let favicon = `
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
	<link rel="shortcut icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTQiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA1NCA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00MS4wMzQgMTMuMDMzNkM0MS4wMzQgMTMuNTkzNiA0MC41NzggMTQuMDQ5NiA0MC4wMTcgMTQuMDQ5NkMzOS40NTggMTQuMDQ5NiAzOS4wMDIgMTMuNTkzNiAzOS4wMDIgMTMuMDMzNkMzOS4wMDIgMTIuNDczNiAzOS40NTggMTIuMDE3NiA0MC4wMTcgMTIuMDE3NkM0MC41NzggMTIuMDE3NiA0MS4wMzQgMTIuNDczNiA0MS4wMzQgMTMuMDMzNlpNMzUuMDAyIDIzLjAwMDRDMzUuMDAyIDIyLjQ0OTQgMzUuNDUgMjIuMDAwNSAzNi4wMDIgMjIuMDAwNUMzNi41NTQgMjIuMDAwNSAzNy4wMDIgMjIuNDQ5NCAzNy4wMDIgMjMuMDAwNEMzNy4wMDIgMjMuNTUxNCAzNi41NTQgMjQuMDAwNCAzNi4wMDIgMjQuMDAwNEMzNS40NSAyNC4wMDA0IDM1LjAwMiAyMy41NTE0IDM1LjAwMiAyMy4wMDA0Wk0zNS4wMDIgNDIuMDAwMkMzNS4wMDIgNDEuNDQ5MiAzNS40NSA0MS4wMDAyIDM2LjAwMiA0MS4wMDAyQzM2LjU1NCA0MS4wMDAyIDM3LjAwMiA0MS40NDkyIDM3LjAwMiA0Mi4wMDAyQzM3LjAwMiA0Mi41NTEyIDM2LjU1NCA0My4wMDAyIDM2LjAwMiA0My4wMDAyQzM1LjQ1IDQzLjAwMDIgMzUuMDAyIDQyLjU1MTIgMzUuMDAyIDQyLjAwMDJaTTQ1LjAwMiAyOS4wMDA0QzQ1LjAwMiAyOS41NTEzIDQ0LjU1NCAzMC4wMDAzIDQ0LjAwMiAzMC4wMDAzQzQzLjQ1IDMwLjAwMDMgNDMuMDAyIDI5LjU1MTMgNDMuMDAyIDI5LjAwMDRDNDMuMDAyIDI4LjQ0OTQgNDMuNDUgMjguMDAwNCA0NC4wMDIgMjguMDAwNEM0NC41NTQgMjguMDAwNCA0NS4wMDIgMjguNDQ5NCA0NS4wMDIgMjkuMDAwNFpNNTIgMzIuMjcyM0w0Ni45NjMgMjkuMzgyNEM0Ni45NzkgMjkuMjU2NCA0Ny4wMDIgMjkuMTMxNCA0Ny4wMDIgMjkuMDAwNEM0Ny4wMDIgMjcuMzQ2NCA0NS42NTYgMjYuMDAwNCA0NC4wMDIgMjYuMDAwNEM0Mi4zNDcgMjYuMDAwNCA0MS4wMDIgMjcuMzQ2NCA0MS4wMDIgMjkuMDAwNEM0MS4wMDIgMzAuNjU0MyA0Mi4zNDcgMzIuMDAwMyA0NC4wMDIgMzIuMDAwM0M0NC44MDEgMzIuMDAwMyA0NS41MjMgMzEuNjgxMyA0Ni4wNjEgMzEuMTcxM0w1MC44ODYgMzMuOTM5M0w0Ni41NTUgMzYuMTA1M0M0Ni4yMTYgMzYuMjc1MyA0Ni4wMDIgMzYuNjIxMiA0Ni4wMDIgMzcuMDAwMlY0NS40NDExTDMzLjk4MyA1Mi44MzdMMjguMDAzIDQ5LjQyMDFWNDMuMDAwMkgzMy4xODZDMzMuNiA0NC4xNjExIDM0LjcgNDUuMDAwMSAzNi4wMDIgNDUuMDAwMUMzNy42NTYgNDUuMDAwMSAzOS4wMDIgNDMuNjU0MiAzOS4wMDIgNDIuMDAwMkMzOS4wMDIgNDAuMzQ1MiAzNy42NTYgMzkuMDAwMiAzNi4wMDIgMzkuMDAwMkMzNC43IDM5LjAwMDIgMzMuNiAzOS44MzgyIDMzLjE4NiA0MS4wMDAySDI4LjAwM1YyNy4wMDA0QzI4LjAwMyAyNi42NDk0IDI3LjgxOCAyNi4zMjM0IDI3LjUxNyAyNi4xNDI0TDIyLjUxNiAyMy4xNDI0TDIxLjQ4NyAyNC44NTc0TDI2LjAwMyAyNy41NjY0VjMwLjUwNzNMMjAuMDAyIDM1LjEyMzNWMzEuMDAwM0MyMC4wMDIgMzAuNjk2MyAxOS44NjQgMzAuNDA4MyAxOS42MjcgMzAuMjE5M0wxNS4wMDIgMjYuNTE5NFYyMS41MzU1TDIwLjU1NiAxNy44MzI1QzIwLjgzNSAxNy42NDY1IDIxLjAwMiAxNy4zMzQ1IDIxLjAwMiAxNy4wMDA1VjExLjAwMDZIMTkuMDAyVjE2LjQ2NTVMMTQuMDEzIDE5Ljc5MDVMOS4wMDIgMTYuNDYzNVY4LjU3NDYzTDE0LjAwMiA1LjY1ODY3VjE0LjAwMDZIMTYuMDAyVjQuNDkxNjlMMjAuMDA1IDIuMTU2NzJMMjYuMDAxIDUuNjE1NjdMMjYuMDAyIDE4LjAwMDVDMjYuMDAyIDE4LjM1OTUgMjYuMTk0IDE4LjY5MDUgMjYuNTA2IDE4Ljg2ODVMMzMuMDQyIDIyLjYwMzRDMzMuMDI0IDIyLjczNDQgMzMuMDAyIDIyLjg2NDQgMzMuMDAyIDIzLjAwMDRDMzMuMDAyIDI0LjY1NDQgMzQuMzQ3IDI2LjAwMDQgMzYuMDAyIDI2LjAwMDRDMzcuNjU2IDI2LjAwMDQgMzkuMDAyIDI0LjY1NDQgMzkuMDAyIDIzLjAwMDRDMzkuMDAyIDIxLjM0NjUgMzcuNjU2IDIwLjAwMDUgMzYuMDAyIDIwLjAwMDVDMzUuMjA4IDIwLjAwMDUgMzQuNDkgMjAuMzE1NSAzMy45NTMgMjAuODIwNUwyOC4wMDIgMTcuNDE5NUwyOC4wMDEgNS42MTc2N0wzMy45NjQgMi4xNzY3Mkw0NS4wMDIgOS41MzU2MlYxMi4wMDA2SDQyLjg1MUM0Mi40MjkgMTAuODQ0NiA0MS4zMTggMTAuMDE3NiA0MC4wMTcgMTAuMDE3NkMzOC4zNTQgMTAuMDE3NiAzNy4wMDIgMTEuMzcwNiAzNy4wMDIgMTMuMDMzNkMzNy4wMDIgMTQuNjk2NiAzOC4zNTQgMTYuMDQ5NSA0MC4wMTcgMTYuMDQ5NUM0MS4zNDMgMTYuMDQ5NSA0Mi40NzEgMTUuMTkwNSA0Mi44NzUgMTQuMDAwNkg0NS4wMDJWMTcuMDAwNUM0NS4wMDIgMTcuMzU5NSA0NS4xOTQgMTcuNjkwNSA0NS41MDYgMTcuODY4NUw1MiAyMS41ODA1VjMyLjI3MjNaTTIwLjAyIDUyLjgzN0wxNi44NjcgNTAuODk3MUwyMi41ODMgNDYuODE0MUwyMS40MjEgNDUuMTg2MUwxNS4wMTggNDkuNzU5MUw4LjAwMiA0NS40NDExVjM3LjU2NjJMMTIuNTE2IDM0Ljg1NzNMMTEuNDg3IDMzLjE0MjNMNi45NTggMzUuODYwM0wyLjAwMiAzMy4zODIzTDIuMDAxIDI3LjYxNzRMNy40NDkgMjQuODk0NEw2LjU1NSAyMy4xMDU0TDIuMDAxIDI1LjM4MTRMMi4wMDIgMjEuNTgwNUw3Ljk2MyAxOC4xNzQ1TDEzLjAwMiAyMS41MTk1VjI2LjQ4MDRMNy40NDkgMzAuMTY3M0w4LjU1NSAzMS44MzMzTDEzLjk1OCAyOC4yNDU0TDE4LjAwMiAzMS40ODAzVjM2LjY2MjNMMTMuMzkyIDQwLjIwNzJMMTQuNjExIDQxLjc5MjJMMjYuMDAzIDMzLjAzMDNWNDkuNDE5MUwyMC4wMiA1Mi44MzdaTTUzLjQ5NiAyMC4xMzI1TDQ3LjAwMiAxNi40MjA1VjkuMDAwNjNDNDcuMDAyIDguNjY1NjMgNDYuODM1IDguMzUzNjQgNDYuNTU2IDguMTY4NjRMMzQuNTU2IDAuMTY4NzQ5QzM0LjI0IC0wLjA0MTI0ODQgMzMuODMyIC0wLjA1NTI0ODIgMzMuNTAyIDAuMTM0NzQ5TDI3LjAwNCAzLjg4NDdMMjAuNTAyIDAuMTM0NzQ5QzIwLjE5IC0wLjA0NTI0ODMgMTkuODA3IC0wLjA0NTI0ODQgMTkuNDk4IDAuMTM2NzQ5TDcuNDk4IDcuMTM2NjVDNy4xOSA3LjMxNTY1IDcuMDAyIDcuNjQ0NjUgNy4wMDIgOC4wMDA2NFYxNi40MjA1TDAuNTA2IDIwLjEzMjVDMC4xOTQgMjAuMzA5NSAwLjAwMTk5OTg2IDIwLjY0MTUgMC4wMDE5OTk4NiAyMS4wMDA1VjIxLjQxNzVDMC4wMDA5OTk4NTUgMjEuNDM4NSAwIDIxLjQ1ODUgMCAyMS40Nzk1VjMyLjM2MzNDMCAzMi4zODMzIDAuMDAwOTk5ODU1IDMyLjQwMzMgMC4wMDE5OTk4NiAzMi40MjIzVjM0LjAwMDNDMC4wMDE5OTk4NiAzNC4zNzkzIDAuMjE2IDM0LjcyNTMgMC41NTUgMzQuODk0M0w2LjAwMiAzNy42MTgyVjQ2LjAwMDFDNi4wMDIgNDYuMzQ3MSA2LjE4MSA0Ni42NjkxIDYuNDc3IDQ2Ljg1MTFMMTkuNDc3IDU0Ljg1MUMxOS42MzggNTQuOTUgMTkuODIgNTUgMjAuMDAyIDU1QzIwLjE3MyA1NSAyMC4zNDQgNTQuOTU2IDIwLjQ5OCA1NC44NjhMMjcuMDAzIDUxLjE1MjFMMzMuNTA2IDU0Ljg2OEMzMy44MjEgNTUuMDQ5IDM0LjIxMyA1NS4wNDIgMzQuNTI2IDU0Ljg1MUw0Ny41MjYgNDYuODUxMUM0Ny44MjIgNDYuNjY5MSA0OC4wMDIgNDYuMzQ3MSA0OC4wMDIgNDYuMDAwMVYzNy42MTgyTDUzLjQ0NyAzNC44OTQzQzUzLjc4NiAzNC43MjUzIDU0IDM0LjM3OTMgNTQgMzQuMDAwM1YyMS4wMDA1QzU0IDIwLjY0MTUgNTMuODA3IDIwLjMxMDUgNTMuNDk2IDIwLjEzMjVaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzBfMSIgeDE9IjI3IiB5MT0iMCIgeDI9IjI3IiB5Mj0iNTUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzBEODc3MCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1NkMwQTciLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K" />
`;

document.head.innerHTML+=favicon;

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
