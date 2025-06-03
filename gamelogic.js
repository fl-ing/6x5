let validLetters = "qwertzuiopasdfghjklyxcvbnm";

let keyboardContainer;
let letterKeys, deleteKey, enterKey, selectKey, leftKey, rightKey;
let settingsButton, switchButton, statButton, infoButton;
let statBox, infoBox, settingsBox;
let colorSwitchButton;
let keyboardOverlay, restartButton;
let bars;
let contentDiv;
let contentCover;
let currentStreakElement,
    bestStreakElement,
    playedGamesElement,
    wonGamesElement,
    winPercentElement,
    avrTriesElement;

let hideErrorMessageFn;
let backspaceTimeout;

function setDomVars() {
    keyboardContainer = document.querySelector(".keyboard-container");
    letterKeys = document.querySelectorAll(".letter-key");
    deleteKey = document.getElementById("delete-key");
    enterKey = document.getElementById("enter-key");
    selectKey = document.getElementById("select-key");
    leftKey = document.getElementById("left-key");
    rightKey = document.getElementById("right-key");
    settingsButton = document.getElementById("settings-button");
    switchButton = document.getElementById("switch-button");
    statButton = document.getElementById("stat-button");
    infoButton = document.getElementById("info-button");
    statBox = document.getElementById("stat-box");
    infoBox = document.getElementById("info-box");
    settingsBox = document.getElementById("settings-box");
    altColorRow = document.getElementById("alternative-colors-row");
    colorSwitchButton = document.getElementById("color-switch");
    revealAnimationRow = document.getElementById("reveal-animation-row");
    revealAnimationSwitch = document.getElementById("reveal-animation-switch");
    statsAnimationRow = document.getElementById("stats-animation-row");
    statsAnimationSwitch = document.getElementById("stats-animation-switch");
    keyboardOverlay = document.getElementById("keyboard-overlay");
    bars = document.querySelectorAll(".bar");
    contentDiv = document.getElementById("content-div");
    contentCover = document.getElementById("content-cover");
    restartButton = document.getElementById("restart-button");
    currentStreakElement = document.getElementById("current-streak-num");
    bestStreakElement = document.getElementById("best-streak-num");
    playedGamesElement = document.getElementById("played-games-num");
    wonGamesElement = document.getElementById("won-games-num");
    winPercentElement = document.getElementById("win-percent");
    avrTriesElement = document.getElementById("average-tries-num");
}

let rowList = null;
let activeRowTiles = null;
let statState = false;
let infoState = false;
let settingsState = false;
let endState = false;
let revealState;
let alternateColorsEnabled = false;
let revealAnimationDisabled = false;
let statsAnimationDisabled = false;
let wordLengthArray = [4, 5, 6];
let defaultWordLength = 5;
let nTries = 6;
let fourLetterWords, fiveLetterWords, sixLetterWords;
let wordLength, words, word;
let winArr, wins, losses, playedGames, streaks;

let backspaceHold = false;

/* if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('serviceworker.js')
        .then(() => console.log("Service Worker registriert"))
        .catch((error) => console.log("Service Worker Registrierung fehlgeschlagen:", error));
} */

// ------------------------------ Setup Process -----------------------------

fetchWordLists(wordLengthArray).then(() => {
    setDomVars();
    setupFunction();
    setYear();

    document.getElementById("debug-text-1").innerHTML = "&nbsp;v1.43";

    document.addEventListener("keydown", (event) => {
        event.preventDefault();
        handleKeyboardPress(event);
    });

    window.addEventListener("resize", () => {
        setTileDimension();
    });

    document.addEventListener("touchstart", (event) => {
        /* event.preventDefault(); */
        if (event.touches.length == 1) {
            if (deleteKey.contains(event.target)) {
                backspaceHold = true;
                repressDeleteKey();
            }
            touchClickInteraction(event);
        }
    });

    contentDiv.addEventListener(
        "touchmove",
        (event) => {
            /* event.preventDefault(); */
            if (event.touches.length == 1) {
                if (deleteKey.contains(event.target) && backspaceHold) {
                    let delBox = deleteKey.getBoundingClientRect();
                    let touchX = event.touches[0].clientX;
                    let touchY = event.touches[0].clientY;
                    if (
                        touchX < delBox.left ||
                        touchX > delBox.right ||
                        touchY < delBox.top ||
                        touchY > delBox.bottom
                    ) {
                        backspaceHold = false;
                        clearTimeout(backspaceTimeout);
                    }
                }
            }
        },
        { passive: true }
    );

    document.addEventListener("touchend", (event) => {
        if (event.cancelable) {
            event.preventDefault();
        }
        backspaceHold = false;
        clearTimeout(backspaceTimeout);
    });

    document.addEventListener("touchcancel", (event) => {
        event.preventDefault();
        backspaceHold = false;
        clearTimeout(backspaceTimeout);
    });

    document.addEventListener("click", (event) => {
        event.preventDefault();
        touchClickInteraction(event);
    });
});

function setupFunction() {
    setWordLength();
    getUserData();
    applyUserSettings();

    switch (wordLength) {
        case 4:
            words = fourLetterWords;
            break;
        case 6:
            words = sixLetterWords;
            break;
        default:
            words = fiveLetterWords;
    }

    setWord();
    reBuildGrid(wordLength);
    resizeGrid();
    setTileDimension();
    resetKeyboard();
    resetGridState();

    updateStatBoxData();
    setActiveTile(); // auto sets the active tile
}

function setYear() {
    try {
        let currentYear = new Date().getFullYear();
        document.getElementById(
            "copyright-text"
        ).innerHTML = `&nbsp;© ${currentYear}`;
    } catch (err) {
        console.error("Fehler bei Datumsabfrage:", err);
    }
}

// ---------------- touch or click functionality ------------------------
function touchClickInteraction(event) {
    /* console.log(event); */
    if (revealState) {
        return;
    }

    if (infoButton.contains(event.target)) {
        if (statState) {
            statSwitchFunction();
        }
        if (settingsState) {
            settingsSwitchFunction();
        }
        infoSwitchFunction();
        return;
    }

    if (settingsButton.contains(event.target)) {
        if (infoState) {
            infoSwitchFunction();
        }
        if (statState) {
            statSwitchFunction();
        }
        settingsSwitchFunction();
        return;
    }

    if (statButton.contains(event.target)) {
        if (infoState) {
            infoSwitchFunction();
        }
        if (settingsState) {
            settingsSwitchFunction();
        }
        statSwitchFunction();
        return;
    }

    if (infoState && !infoBox.contains(event.target)) {
        infoSwitchFunction();
        return;
    }

    if (settingsState && !settingsBox.contains(event.target)) {
        settingsSwitchFunction();
        return;
    }

    if (
        statState &&
        !statBox.contains(event.target) &&
        !switchButton.contains(event.target)
    ) {
        statSwitchFunction();
        return;
    }

    if (restartButton.contains(event.target)) {
        resetGrid();
        return;
    }

    if (switchButton.contains(event.target)) {
        switchFunction();
        functionAfterEveryAction();
        return;
    }

    if (settingsState) {
        if (
            colorSwitchButton.contains(event.target) ||
            (event.type != "click" && altColorRow.contains(event.target))
        ) {
            alternateColorSwitchFunction();
            return;
        }
        if (
            revealAnimationSwitch.contains(event.target) ||
            (event.type != "click" && revealAnimationRow.contains(event.target))
        ) {
            revealAnimationSwitchFunction();
            return;
        }
        if (
            statsAnimationSwitch.contains(event.target) ||
            (event.type != "click" && statsAnimationRow.contains(event.target))
        ) {
            statsAnimationSwitchFunction();
            return;
        }
    }

    if (!endState) {
        for (tile of activeRowTiles) {
            // logic for selecting or deselecting tile by clicking
            if (tile.contains(event.target)) {
                if (removeSelection(tile)) {
                    functionAfterEveryAction();
                    return;
                } else {
                    removeAllSelection();
                    addSelection(tile);
                }
                functionAfterEveryAction();
                return;
            }
        }
        if (!keyboardContainer.contains(event.target)) {
            removeAllSelection();
        } else if (selectKey.contains(event.target)) {
            selectSwitch();
            return;
        } else if (leftKey.contains(event.target)) {
            fadeKey(leftKey);
            selectionToLeft();
            return;
        } else if (rightKey.contains(event.target)) {
            fadeKey(rightKey);
            selectionToRight();
            return;
        } else if (deleteKey.contains(event.target)) {
            fadeKey(deleteKey);
            backspaceFunction();
            return;
        } else if (enterKey.contains(event.target)) {
            fadeKey(enterKey);
            enterFunction();
            functionAfterEveryAction();
            return;
        } else {
            for (let letterKey of letterKeys) {
                if (letterKey.contains(event.target)) {
                    fadeKey(letterKey);
                    writeActiveTile(letterKey.innerText);
                    return;
                }
            }
        }
        functionAfterEveryAction();
    }
}

function handleKeyboardPress(event) {
    if (revealState) {
        return;
    }
    let inputKey = event.key;
    /* console.log(inputKey); */
    if (!infoState && !settingsState) {
        if (inputKey == "Tab") {
            switchFunction();
            functionAfterEveryAction();
            return;
        }
    }
    if (!statState && !infoState && !settingsState) {
        /* console.log(pressedKeyData); */
        if (inputKey == "Enter") {
            if (endState) {
                resetGrid();
                return;
            } else {
                fadeKey(enterKey);
                enterFunction();
                functionAfterEveryAction();
                return;
            }
        }
        if (!endState) {
            if (inputKey == "Backspace") {
                if (event.ctrlKey) {
                    removeAllSelection();
                    clearActiveRow();
                } else {
                    fadeKey(deleteKey);
                    backspaceFunction();
                }
                return;
            }
            if (
                inputKey == " " ||
                inputKey == "ArrowUp" ||
                inputKey == "ArrowDown"
            ) {
                selectSwitch();
                return;
            }
            if (inputKey == "ArrowRight") {
                fadeKey(rightKey);
                selectionToRight();
                return;
            }
            if (inputKey == "ArrowLeft") {
                fadeKey(leftKey);
                selectionToLeft();
                return;
            }
            // check for valid input letters and write into active tile
            if (validLetters.includes(inputKey.toLowerCase())) {
                let ltr = inputKey.toLowerCase();
                writeActiveTile(ltr);
                let letterKey = document.getElementById(ltr + "-key");
                fadeKey(letterKey);
                return;
            }
            if (["ä", "ö", "ü"].includes(inputKey.toLowerCase())) {
                setErrorMessage("Umlaute werden ausgeschrieben!");
                return;
            }
            if (inputKey == "ß") {
                setErrorMessage("ẞ wird zu SS!");
                return;
            }
        }
    }
}

// ------------------ functions -----------------------

function getUserData() {
    winArr = localStorage.getItem(wordLength + "-winArr");
    streaks = { current: 0, best: 0 };
    if (winArr == null) {
        winArr = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // current, best, losses, 1, 2, 3, 4, 5, 6
    } else {
        winArr = winArr.split(",").map(Number);
    }
    /*     console.log(winArr); */
    streaks.current = winArr[0];
    streaks.best = winArr[1];
    losses = winArr[2];
    wins = 0;
    for (let i = 3; i < winArr.length; i++) {
        wins += winArr[i];
    }
    playedGames = wins + losses;
}

function applyUserSettings() {
    if (
        localStorage.getItem("alternateColorsEnabled") != null &&
        !alternateColorsEnabled
    ) {
        alternateColorSwitchFunction();
    }
    if (
        localStorage.getItem("revealAnimationDisabled") != null &&
        !revealAnimationDisabled
    ) {
        revealAnimationSwitchFunction();
    }
    if (
        localStorage.getItem("statsAnimationDisabled") != null &&
        !statsAnimationDisabled
    ) {
        statsAnimationSwitchFunction();
    }
}

function animateStatInt(element, value) {
    element.style.setProperty("--num", value);
    addClasses(element, ["change-num"]);
}

function updateStatBoxData() {
    /*     console.log(winArr);
    console.log("current:", streaks.current);
    console.log("best", streaks.best);
    console.log("losses", losses);
    console.log("wins:", wins); */
    let winPercentStr =
        playedGames == 0 ? "0.00" : ((wins / playedGames) * 100).toFixed(2);

    // calculate average tries
    let highestN = winArr[3];
    let avrTries = 0;
    for (let i = 3; i < winArr.length; i++) {
        avrTries += winArr[i] * (i - 2);
        if (winArr[i] > highestN) {
            highestN = winArr[i];
        }
    }
    let avrTriesStr = wins == 0 ? "0.00" : (avrTries / wins).toFixed(2);
    if (statState) {
        if (statsAnimationDisabled) {
            currentStreakElement.innerText = streaks.current.toString();
            removeClasses(currentStreakElement, ["change-num"]);
            bestStreakElement.innerText = streaks.best.toString();
            removeClasses(bestStreakElement, ["change-num"]);
            playedGamesElement.innerText = playedGames.toString();
            removeClasses(playedGamesElement, ["change-num"]);
            wonGamesElement.innerText = wins.toString();
            removeClasses(wonGamesElement, ["change-num"]);
            winPercentElement.innerText = winPercentStr;
            removeClasses(winPercentElement, ["change-float"]);
            avrTriesElement.innerText = avrTriesStr;
            removeClasses(avrTriesElement, ["change-float"]);
            avrTriesElement.style.removeProperty("--percent");
        } else {
            currentStreakElement.innerText = "";
            bestStreakElement.innerText = "";
            playedGamesElement.innerText = "";
            wonGamesElement.innerText = "";
            animateStatInt(currentStreakElement, streaks.current.toString());
            animateStatInt(bestStreakElement, streaks.best.toString());
            animateStatInt(playedGamesElement, playedGames.toString());
            animateStatInt(wonGamesElement, wins.toString());

            if (!statState) {
                winPercentElement.style.setProperty("--percent", "0.00");
            } else {
                winPercentElement.style.setProperty("--percent", winPercentStr);
            }
            addClasses(winPercentElement, ["change-float"]);
            winPercentElement.innerText = "";

            if (!statState) {
                avrTriesElement.style.setProperty("--percent", "0.00");
            } else {
                avrTriesElement.style.setProperty("--percent", avrTriesStr);
            }
            addClasses(avrTriesElement, ["change-float"]);
            avrTriesElement.innerText = "";
        }
    }

    for (let i = 3; i < winArr.length; i++) {
        let bar = document.getElementById("bar-" + (i - 2));
        let btnContainer = document.getElementById("btn-container-" + (i - 2));
        let barTopNum = document.getElementById("bar-top-num-" + (i - 2));

        removeClasses(bar, ["change-bar"]);
        removeClasses(btnContainer, ["change-btnh"]);

        let btnStyle = window.getComputedStyle(btnContainer);
        let currBtnTopValue = btnStyle.getPropertyValue("top");
        btnContainer.style.setProperty("--curr-btnh", currBtnTopValue);

        if (statState) {
            let barPercent =
                highestN == 0
                    ? 0
                    : parseFloat(((winArr[i] / highestN) * 100).toFixed(2));
            let barPercentStr = barPercent + "%";
            if (statsAnimationDisabled) {
                barTopNum.innerText = winArr[i].toString();
                removeClasses(barTopNum, ["change-num"]);
                bar.style.setProperty("height", barPercentStr);
            } else {
                barTopNum.innerText = "";
                let barStyle = window.getComputedStyle(bar);
                let currBarHeight = barStyle.getPropertyValue("--percentage");
                if (currBarHeight == "") {
                    currBarHeight = "0%";
                }
                bar.style.setProperty("--prev-px", currBarHeight);
                bar.style.setProperty("--percentage", barPercentStr);
                bar.style.setProperty("height", barPercentStr);
                animateStatInt(barTopNum, winArr[i]);
            }
        }
    }

    // adjust bar top num "top"-offset based on bar height
    let barTopNumHeight = document.querySelector(".bar-top-num").offsetHeight;
    for (let i = 3; i < winArr.length; i++) {
        let btnContainer = document.getElementById("btn-container-" + (i - 2));
        btnContainer.style.removeProperty("top");
        let barHeight = document.getElementById("bar-" + (i - 2)).offsetHeight;
        if (barTopNumHeight > barHeight) {
            btnContainer.style.setProperty("top", "-" + barTopNumHeight + "px");
            if (!statsAnimationDisabled) {
                btnContainer.style.setProperty(
                    "--new-btnh",
                    "-" + barTopNumHeight + "px"
                );
            }
        } else {
            if (!statsAnimationDisabled) {
                btnContainer.style.setProperty("--new-btnh", "0px");
            }
        }
    }

    if (statState && !statsAnimationDisabled) {
        for (let i = 3; i < winArr.length; i++) {
            let bar = document.getElementById("bar-" + (i - 2));
            addClasses(bar, ["change-bar"]);
            let btnContainer = document.getElementById(
                "btn-container-" + (i - 2)
            );
            let btnStyle = window.getComputedStyle(btnContainer);
            if (
                btnStyle.getPropertyValue("--curr-btnh") !=
                btnStyle.getPropertyValue("--new-btnh")
            ) {
                addClasses(btnContainer, ["change-btnh"]);
            }
        }
    }
}

function setWordLength() {
    wordLength = Number(localStorage.getItem("userWordLength"));
    if (isNaN(wordLength) || !wordLengthArray.includes(wordLength)) {
        wordLength = defaultWordLength;
    }
    document.getElementById("stat-heading-num").innerText = `6x${wordLength}`;
}

function setTileDimension() {
    // set tile width
    let tileWidth = document.querySelector(".tile").offsetWidth;
    let tileFontSize = Math.floor(tileWidth * 0.66);
    let fontSizeString = tileFontSize.toString() + "px";
    let tileFontSizeRule = getCssRulesFor(".tile");
    tileFontSizeRule.style.setProperty("font-size", fontSizeString);

    // set tile margin
    let tileRules = getCssRulesFor(".tile");
    let tileMarginStr = (tileWidth / 40).toFixed(1) + "px";
    tileRules.style.setProperty("margin", tileMarginStr);
}

function resizeGrid(itr = 0) {
    if (itr > 80) {
        return;
    }
    if (itr == 0) {
        let gridContainerRules = getCssRulesFor(".grid-container");
        gridContainerRules.style.setProperty("width", "76%");
    }
    let contentHeight = getContentHeight();
    let windowHeight = window.innerHeight;
    /*     console.log(gameHeight);
    console.log(windowHeight); */
    if (contentHeight > windowHeight) {
        let gridContainerRules = getCssRulesFor(".grid-container");
        let currentWidthString =
            gridContainerRules.style.getPropertyValue("width");
        let currentWidth = Math.ceil(
            parseFloat(currentWidthString.slice(0, -1))
        );
        if (currentWidth < 20) {
            return;
        }
        let widthStr = currentWidth - 1 + "%";
        /* console.log(widthStr); */
        gridContainerRules.style.setProperty("width", widthStr);
    } else {
        return;
    }
    let newContentHeight = getContentHeight();
    if (newContentHeight > windowHeight + 1) {
        resizeGrid(itr + 1);
    }
}

function getContentHeight() {
    let headerHeight = document.getElementById("Page-Header").offsetHeight;
    let gameHeight = document.getElementById("content-div").offsetHeight;
    return headerHeight + gameHeight;
}

function setWord() {
    word = localStorage.getItem(wordLength + "-word");
    if (word == null) {
        word = randomWord(words);
        localStorage.setItem(wordLength + "-word", word);
        /* console.log("I wrote word to localStorage:", word); */
    } /* else {
        console.log("I read word from localStorage:", word);
    } */
}

function randomWord(w) {
    return w[Math.floor(Math.random() * w.length)];
}

function reBuildGrid(wl) {
    let grid = document.getElementById("grid");
    grid.innerHTML = "";
    for (let i = 0; i < nTries; i++) {
        let newRow = document.createElement("div");
        addClasses(newRow, ["row", "grid-row"]);
        for (let i = 0; i < wl; i++) {
            let newTile = document.createElement("div");
            addClasses(newTile, ["tile", "grid-tile"]);
            newRow.appendChild(newTile);
        }
        grid.appendChild(newRow);
    }
    getAllGridTiles();
    getGridRowList();
    addClasses(rowList[0], ["activerow"]);
    getActiveRowTiles();
}

function resetGridState() {
    unsetEndState();
    let strWrdLst = localStorage.getItem(wordLength + "-inputWords");
    if (strWrdLst == null) {
        return;
    }
    wordArr = JSON.parse(strWrdLst);
    for (let i = 0; i < wordArr.length; i++) {
        // handle faulty safestate
        if (
            wordArr[i].length != wordLength ||
            !stringHasValidLettersOnly(wordArr[i])
        ) {
            // delete faulty entry
            wordArr = wordArr.slice(0, i);
            if (wordArr.length == 0) {
                localStorage.removeItem(wordLength + "-inputWords");
                return;
            } else {
                let storeWrdArr = JSON.stringify(wordArr);
                localStorage.setItem(wordLength + "-inputWords", storeWrdArr);
                return;
            }
        }
        for (let j = 0; j < wordLength; j++) {
            rowList[i].children[j].innerText = wordArr[i][j];
        }
        enterFunction(true);
    }
}

function getActiveRowTiles() {
    activeRowTiles = document.querySelectorAll(".activerow > .tile");
}

function getAllGridTiles() {
    allTiles = document.querySelectorAll(".grid-tile");
}

function getGridRowList() {
    rowList = document.querySelectorAll(".grid-row");
}

function activeRowFull() {
    if (!endState) {
        for (let tile of activeRowTiles) {
            if (tile.innerText == "") {
                return false;
            }
        }
        return true;
    }
    return null;
}

function activeRowEmpty() {
    if (!endState) {
        for (let tile of activeRowTiles) {
            if (tile.innerText != "") {
                return false;
            }
        }
        return true;
    }
    return null;
}

function removeSelection(tile) {
    if (hasClass(tile, "selected")) {
        tile.classList.remove("selected");
        removeClasses(selectKey, ["selection-active"]);
        return true;
    }
    return false;
}

function addSelection(tile) {
    addClasses(tile, ["selected"]);
    addClasses(selectKey, ["selection-active"]);
}

function removeAllSelection() {
    if (!endState) {
        activeRowTiles.forEach((tile) => {
            removeSelection(tile);
        });
    }
}

function selectSwitch() {
    if (!endState) {
        for (tile of activeRowTiles) {
            if (removeSelection(tile)) {
                functionAfterEveryAction();
                return;
            }
        }
        let ati = getActiveTileIndex();
        if (ati != undefined) {
            addSelection(activeRowTiles[ati]);
        }
        functionAfterEveryAction();
    }
}

function selectionToRight() {
    if (!endState) {
        let ati = getActiveTileIndex();
        removeAllSelection();
        if (ati == undefined || ati == wordLength - 1) {
            addSelection(activeRowTiles[0]);
        } else if (ati < wordLength - 1) {
            addSelection(activeRowTiles[ati + 1]);
        }
        functionAfterEveryAction();
    }
}

function selectionToLeft() {
    if (!endState) {
        let ati = getActiveTileIndex();
        removeAllSelection();
        if (ati == undefined || ati == 0) {
            addSelection(activeRowTiles[wordLength - 1]);
        } else if (ati > 0) {
            addSelection(activeRowTiles[ati - 1]);
        }
        functionAfterEveryAction();
    }
}

function storeInputWord(inpWrd) {
    if (inpWrd.length !== wordLength) {
        console.error("Will not store Word because of wrong word length");
        return;
    }
    let strWrdArr = localStorage.getItem(wordLength + "-inputWords");
    if (strWrdArr == null) {
        strWrdArr = JSON.stringify([]);
    }
    let parsedWrdArr = JSON.parse(strWrdArr);
    parsedWrdArr.push(inpWrd);
    let storeWrdArr = JSON.stringify(parsedWrdArr);
    localStorage.setItem(wordLength + "-inputWords", storeWrdArr);
}

function backspaceFunction() {
    if (!endState) {
        let ati = getActiveTileIndex();
        if (ati == undefined) {
            // clear last tile if all contain letter
            activeRowTiles[activeRowTiles.length - 1].innerText = "";
        } else if (activeRowTiles[ati].innerText != "") {
            // clear letter in act tile
            activeRowTiles[ati].innerText = "";
        } else if (ati != 0 && activeRowTiles[ati].innerText == "") {
            if (removeSelection(activeRowTiles[ati])) {
                addSelection(activeRowTiles[ati - 1]);
            }
            activeRowTiles[ati - 1].innerText = "";
        } else if (ati == 0) {
            removeSelection(activeRowTiles[ati], ["selected"]);
            if (!activeRowEmpty()) {
                addSelection(activeRowTiles[activeRowTiles.length - 1]);
            } else {
                wiggleActiveRow();
            }
        }
        functionAfterEveryAction();
    }
}

function enterFunction(resetState = false) {
    if (endState) {
        return;
    }

    if (!activeRowFull()) {
        setErrorMessage("Zu wenige Buchstaben!");
        return;
    }

    let inpStr = "";
    for (let tile of activeRowTiles) {
        inpStr += tile.innerText;
    }
    inpStr = inpStr.toLowerCase();

    if (words.includes(inpStr) || word == inpStr || resetState) {
        let cs = getColors(inpStr, word);
        revealTiles(cs, inpStr, resetState);
    } else {
        setErrorMessage("Nicht in der Wortliste!");
    }
}

function afterReveal(cs, inpStr, resetState) {
    revealKeys(cs, inpStr);

    if (!resetState) {
        storeInputWord(inpStr);
    }

    let currRowNum = getActiveRowNum();
    activeRowTiles = null;
    removeClasses(document.querySelector(".activerow"), ["activerow"]);

    // win logic
    if (word == inpStr) {
        if (!resetState) {
            // do not update stats while loading grid state
            updateWinArr(currRowNum);
            localStorage.setItem(wordLength + "-winArr", winArr);
            updateStatBoxData();
        }

        if (currRowNum == 1) {
            setEndState(`WOW!\nGlückspilz :)`);
        } else if (currRowNum == nTries) {
            setEndState(`Puh, knapp!\n${currRowNum} Versuche!`);
        } else {
            setEndState(`Gewonnen in ${currRowNum} Versuchen!`);
        }
        return;
    }

    // wrong word entered
    if (currRowNum == nTries) {
        // if last guess
        setEndState(word.toUpperCase() + " . . ."); // lose game
        if (!resetState) {
            // do not update stats while loading grid state
            updateWinArr(0);
            localStorage.setItem(wordLength + "-winArr", winArr);
            updateStatBoxData();
            return;
        }
    } else {
        addClasses(rowList[currRowNum], ["activerow"]); // advance active row
        getActiveRowTiles();
        functionAfterEveryAction();
        return;
    }
}

function getActiveRowNum() {
    let wr = 0;
    for (let row of rowList) {
        wr++;
        if (hasClass(row, "activerow")) {
            break;
        }
    }
    return wr;
}

function updateWinArr(wr) {
    // console.log(wr);
    playedGames++;
    if (wr == 0) {
        // game lost
        losses++;
        winArr[2] = losses;
        streaks.current = 0;
        winArr[0] = streaks.current;
    } else {
        // game won
        wins++;
        streaks.current++;
        if (streaks.current > streaks.best) {
            streaks.best = streaks.current;
        }
        winArr[0] = streaks.current;
        winArr[1] = streaks.best;
        winArr[wr + 2]++;
    }
}

function alternateColorSwitchFunction() {
    alternateColorsEnabled = !alternateColorsEnabled;
    let rootCssRules = getCssRulesFor(":root");
    if (alternateColorsEnabled) {
        // set alternative colors
        localStorage.setItem("alternateColorsEnabled", "");
        addClasses(colorSwitchButton, ["toggle-switch-on"]);
        removeClasses(colorSwitchButton, ["toggle-switch-off"]);
        rootCssRules.style.setProperty("--tile-green", "rgb(196, 19, 93)");
        rootCssRules.style.setProperty(
            "--tile-green-80",
            "rgba(196, 19, 93, 0.8)"
        );
        document.getElementById("about-green-text").textContent =
            "pinker Buchstabe";
        rootCssRules.style.setProperty("--tile-yellow", "rgb(31, 124, 167)");
        rootCssRules.style.setProperty(
            "--tile-yellow-80",
            "rgba(31, 124, 167, 0.8)"
        );
        document.getElementById("about-yellow-text").textContent =
            "blauer Buchstabe";
    } else {
        // set normal colors
        localStorage.removeItem("alternateColorsEnabled");
        addClasses(colorSwitchButton, ["toggle-switch-off"]);
        removeClasses(colorSwitchButton, ["toggle-switch-on"]);
        rootCssRules.style.setProperty("--tile-green", "rgb(58, 134, 61)");
        rootCssRules.style.setProperty(
            "--tile-green-80",
            "rgba(58, 134, 60, 0.8)"
        );
        document.getElementById("about-green-text").textContent =
            "grüner Buchstabe";
        rootCssRules.style.setProperty("--tile-yellow", "rgb(219, 146, 0)");
        rootCssRules.style.setProperty(
            "--tile-yellow-80",
            "rgba(219, 146, 0, 0.8)"
        );
        document.getElementById("about-yellow-text").textContent =
            "gelber Buchstabe";
    }
}

function revealAnimationSwitchFunction() {
    revealAnimationDisabled = !revealAnimationDisabled;
    if (revealAnimationDisabled) {
        localStorage.setItem("revealAnimationDisabled", "");
        addClasses(revealAnimationSwitch, ["toggle-switch-on"]);
        removeClasses(revealAnimationSwitch, ["toggle-switch-off"]);
    } else {
        localStorage.removeItem("revealAnimationDisabled");
        addClasses(revealAnimationSwitch, ["toggle-switch-off"]);
        removeClasses(revealAnimationSwitch, ["toggle-switch-on"]);
    }
}

function statsAnimationSwitchFunction() {
    statsAnimationDisabled = !statsAnimationDisabled;
    if (statsAnimationDisabled) {
        localStorage.setItem("statsAnimationDisabled", "");
        addClasses(statsAnimationSwitch, ["toggle-switch-on"]);
        removeClasses(statsAnimationSwitch, ["toggle-switch-off"]);
    } else {
        localStorage.removeItem("statsAnimationDisabled");
        addClasses(statsAnimationSwitch, ["toggle-switch-off"]);
        removeClasses(statsAnimationSwitch, ["toggle-switch-on"]);
    }
}

function setEndState(endMessage) {
    endState = true;
    keyboardOverlay.style.setProperty("visibility", "visible");
    addClasses(restartButton, ["rotate"]);
    document.getElementById("end-message-paragraph").innerText = endMessage;
}

function unsetEndState() {
    endState = false;
    document
        .getElementById("keyboard-overlay")
        .style.setProperty("visibility", "hidden");
    removeClasses(restartButton, ["rotate"]);
    document.getElementById("end-message-paragraph").innerText = "";
}

function writeActiveTile(letter) {
    if (!endState) {
        for (let tile of activeRowTiles) {
            if (hasClass(tile, "active")) {
                tile.innerText = letter;
                functionAfterEveryAction();
                return;
            }
        }
        wiggleActiveRow();
    }
}

function clearActiveRow() {
    if (!endState) {
        for (tile of activeRowTiles) {
            tile.innerText = "";
        }
        functionAfterEveryAction();
    }
}

function fadeKey(keyObj) {
    removeClasses(keyObj, ["fading-key"]);
    keyObj.style.animation = "none";
    setTimeout(() => {
        keyObj.style.animation = "";
    }, 5);
    addClasses(keyObj, ["fading-key"]);
}

function repressDeleteKey(itr = 0) {
    if (itr > 10) {
        return;
    }
    let ms = itr == 0 ? 400 : 40;
    backspaceTimeout = setTimeout(() => {
        if (backspaceHold) {
            fadeKey(deleteKey);
            backspaceFunction();
            repressDeleteKey(itr + 1);
        }
    }, ms);
}

function cleanActiveTiles() {
    if (activeRowTiles !== null) {
        for (let tile of activeRowTiles) {
            removeClasses(tile, ["active"]);
        }
    }
}
function setActiveTile() {
    if (!endState) {
        cleanActiveTiles();
        for (let tile of activeRowTiles) {
            if (hasClass(tile, "selected") && !hasClass(tile, "active")) {
                addClasses(tile, ["active"]);
                return;
            }
        }
        for (let tile of activeRowTiles) {
            if (tile.innerText == "" && !hasClass(tile, "active")) {
                addClasses(tile, ["active"]);
                break;
            }
        }
    }
}
function getActiveTileIndex() {
    if (!endState) {
        let itr = 0;
        for (let tile of activeRowTiles) {
            if (hasClass(tile, "active")) {
                return itr;
            }
            itr += 1;
        }
        return undefined;
    }
}

function resetGrid() {
    for (let row of rowList) {
        removeClasses(row, ["activerow"]);
    }
    addClasses(rowList[0], ["activerow"]);
    for (let tile of allTiles) {
        if (!hasClass(tile, "about-tile")) {
            removeClasses(tile, [
                "bg-green",
                "bg-yellow",
                "bg-dark",
                "wiggle-tile",
            ]);
            tile.innerText = "";
        }
    }
    resetKeyboard();
    unsetEndState();
    localStorage.removeItem(wordLength + "-word");
    localStorage.removeItem(wordLength + "-inputWords");
    getActiveRowTiles();
    setWord();
    functionAfterEveryAction();
}

function resetKeyboard() {
    for (let letterKey of letterKeys) {
        removeClasses(letterKey, ["bg-green", "bg-yellow", "bg-dark"]);
    }
    removeClasses(selectKey, ["selection-active"]);
}

function switchFunction() {
    if (revealState) {
        return;
    }
    hideErrorMessage();
    let lng = wordLengthArray.length;
    let itr = 0;
    for (let tmpWrdLngth of wordLengthArray) {
        if (wordLength == tmpWrdLngth) {
            if (itr == lng - 1) {
                wordLength = wordLengthArray[0];
                break;
            } else {
                wordLength = wordLengthArray[itr + 1];
                break;
            }
        }
        itr++;
    }
    if (wordLength == defaultWordLength) {
        localStorage.removeItem("userWordLength");
    } else {
        localStorage.setItem("userWordLength", wordLength);
    }
    /* getCssRulesFor(".grid-container").style.setProperty("width", "100vw"); */
    setupFunction();
}

function statSwitchFunction() {
    if (statState) {
        // deactivate statState
        statState = false;
        contentCover.style.setProperty("visibility", "hidden");
        statBox.style.visibility = "hidden";
        removeClasses(statButton, ["active-side-button"]);
        settingsButton.style.visibility = "visible";
        infoButton.style.visibility = "visible";
        currentStreakElement.style.removeProperty("--num");
        bestStreakElement.style.removeProperty("--num");
        playedGamesElement.style.removeProperty("--num");
        wonGamesElement.style.removeProperty("--num");
        winPercentElement.style.removeProperty("--percent");
        avrTriesElement.style.removeProperty("--percent");

        for (let i = 3; i < winArr.length; i++) {
            let barTopNum = document.getElementById("bar-top-num-" + (i - 2));
            barTopNum.style.removeProperty("--num");
        }
        for (let bar of bars) {
            removeClasses(bar, ["change-bar"]);
            bar.style.removeProperty("--percentage");
            bar.style.removeProperty("height");
            bar.style.removeProperty("--prev-px");
        }
        return;
    }
    // activate statState
    hideErrorMessage();
    statState = true;
    contentCover.style.setProperty("visibility", "visible");
    addClasses(statButton, ["active-side-button"]);
    statBox.style.visibility = "visible";
    settingsButton.style.visibility = "hidden";
    infoButton.style.visibility = "hidden";
    updateStatBoxData();
}

function infoSwitchFunction() {
    // deactivate infoState
    if (infoState) {
        infoState = false;
        contentCover.style.visibility = "hidden";
        switchButton.style.setProperty("visibility", "visible");
        statButton.style.setProperty("visibility", "visible");
        removeClasses(infoButton, ["active-side-button"]);
        infoBox.style.visibility = "hidden";
        return;
    }
    // activate infoState
    hideErrorMessage();
    infoState = true;
    contentCover.style.setProperty("visibility", "visible");
    switchButton.style.setProperty("visibility", "hidden");
    statButton.style.setProperty("visibility", "hidden");
    addClasses(infoButton, ["active-side-button"]);
    infoBox.style.visibility = "visible";
}

function settingsSwitchFunction() {
    // deactivate settingsState
    if (settingsState) {
        settingsState = false;
        contentCover.style.visibility = "hidden";
        switchButton.style.setProperty("visibility", "visible");
        statButton.style.setProperty("visibility", "visible");
        settingsButton.style.setProperty("visibility", "visible");
        removeClasses(settingsButton, ["active-side-button"]);
        settingsBox.style.visibility = "hidden";
        return;
    }
    // activate settingsState
    hideErrorMessage();
    settingsState = true;
    contentCover.style.setProperty("visibility", "visible");
    switchButton.style.setProperty("visibility", "hidden");
    statButton.style.setProperty("visibility", "hidden");
    addClasses(settingsButton, ["active-side-button"]);
    settingsBox.style.visibility = "visible";
}

function getCssRulesFor(styleString) {
    let stylesheet = document.styleSheets[0];
    return [...stylesheet.cssRules].find((r) => r.selectorText === styleString);
}

function hasClass(obj, className) {
    return obj.classList.contains(className);
}

function removeClasses(obj, classNameArr) {
    let removed = false;
    for (let cl of classNameArr) {
        if (hasClass(obj, cl)) {
            obj.classList.remove(cl);
            removed = true;
        }
    }
    return removed;
}

function addClasses(obj, classNameArr) {
    for (let cl of classNameArr) {
        obj.classList.add(cl);
    }
}

function functionAfterEveryAction() {
    setActiveTile();
}

function stringHasValidLettersOnly(str) {
    for (let char of str) {
        if (!validLetters.includes(char)) {
            return false;
        }
    }
    return true;
}

// ------- fetch word list ------------------------------------------------
async function fetchWordLists(validWordLengthArray) {
    try {
        for (let length of validWordLengthArray) {
            if (length == 5) {
                fiveLetterWords = await fetchWordArray(length);
            } else if (length == 6) {
                sixLetterWords = await fetchWordArray(length);
            } else if (length == 4) {
                fourLetterWords = await fetchWordArray(length);
            } else {
                console.error(`word list for word length ${length} not found`);
            }
        }
    } catch (error) {
        console.error("Error in setAllWordList:", error);
    }
}

async function fetchWordArray(n) {
    let wordListPath = "assets/wordlists/" + n + "-letter-words.txt";
    try {
        // Fetch the words.txt file from the local web server
        let response = await fetch(wordListPath);

        // Ensure the request was successful
        if (!response.ok) {
            throw new Error("Failed to fetch wordlist");
        }

        // Get the text content of the file
        let text = await response.text();

        // Split the content into an array of words (splitting by newlines)
        let wordsArray = text.split("\n");

        // Remove any extra spaces or empty lines
        wordsArray = wordsArray.map((s) => s.replace(/\r/g, ""));

        return wordsArray;
    } catch (error) {
        console.error("Error fetching or processing the file:", error);
        return null;
    }
}

function wiggleActiveRow() {
    let activeRow = document.getElementsByClassName("activerow")[0];
    removeClasses(activeRow, ["wiggle-row"]);
    setTimeout(() => {
        addClasses(activeRow, ["wiggle-row"]);
    }, 0);
}

function setErrorMessage(message) {
    wiggleActiveRow();
    clearTimeout(hideErrorMessageFn);

    let errorAfterRules = getCssRulesFor(".activerow::after");
    errorAfterRules.style.visibility = "visible";
    errorAfterRules.style.content = `"${message}"`;

    hideErrorMessageFn = setTimeout(() => {
        hideErrorMessage();
    }, 1500);
}

function hideErrorMessage() {
    let errorAfterRules = getCssRulesFor(".activerow::after");
    errorAfterRules.style.visibility = "hidden";
    errorAfterRules.style.content = `""`;
}

// ------- word checking function -----------------------------------------

function numberOfLetterInWord(letter, word) {
    return word.split("").filter((char) => char === letter).length;
}

function getColors(inputWord, hiddenWord) {
    if (inputWord === hiddenWord) {
        return new Array(inputWord.length).fill("hit");
    }
    let outputArray = new Array(inputWord.length).fill("");
    for (let i = inputWord.length - 1; i > -1; i--) {
        if (outputArray[i] != "") {
            continue;
        }
        inputLetter = inputWord[i];
        let nInInputWord = numberOfLetterInWord(inputLetter, inputWord);
        let nInHiddenWord = numberOfLetterInWord(inputLetter, hiddenWord);
        let diff = nInInputWord - nInHiddenWord;
        for (let j = i; j > -1; j--) {
            if (inputWord[j] === inputLetter) {
                if (hiddenWord[j] === inputLetter) {
                    outputArray[j] = "hit";
                } else if (diff < 1) {
                    outputArray[j] = "close";
                } else {
                    outputArray[j] = "miss";
                    diff--;
                }
            }
        }
    }
    return outputArray;
}

function revealTiles(colorString, inpStr, resetState = false) {
    removeAllSelection();
    cleanActiveTiles();
    let intervalTime = 200;
    for (let i = 0; i < colorString.length; i++) {
        let classStr;
        switch (colorString[i]) {
            case "hit":
                classStr = "bg-green";
                break;
            case "close":
                classStr = "bg-yellow";
                break;
            case "miss":
                classStr = "bg-dark";
                break;
            default:
                break;
        }
        if (resetState | revealAnimationDisabled) {
            addClasses(activeRowTiles[i], [classStr]);
            if (i == colorString.length - 1) {
                afterReveal(colorString, inpStr, resetState);
            }
        } else {
            revealState = true;
            setTimeout(() => {
                addClasses(activeRowTiles[i], [classStr, "wiggle-tile"]);
                if (i == colorString.length - 1) {
                    setTimeout(() => {
                        afterReveal(colorString, inpStr, resetState);
                        revealState = false;
                    }, 200);
                }
            }, i * intervalTime);
        }
    }
}

function revealKeys(colorString, inputWord) {
    for (let i = 0; i < colorString.length; i++) {
        let aKey = document.getElementById(inputWord[i] + "-key");
        if (colorString[i] == "hit") {
            addClasses(aKey, ["bg-green"]);
            removeClasses(aKey, ["bg-yellow"]);
        } else if (colorString[i] == "close") {
            if (!hasClass(aKey, "bg-green")) {
                addClasses(aKey, ["bg-yellow"]);
            }
        } else if (colorString[i] == "miss") {
            addClasses(aKey, ["bg-dark"]);
        }
    }
}
