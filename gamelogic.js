let validLetters = "qwertzuiopasdfghjklyxcvbnm"

let keyboardContainer   =   document.querySelector(".keyboard-container");
let letterKeys          =   document.querySelectorAll(".letter-key");
let deleteKey           =   document.getElementById("delete-key");
let enterKey            =   document.getElementById("enter-key");
let selectKey           =   document.getElementById("select-key");
let leftKey             =   document.getElementById("left-key");
let rightKey            =   document.getElementById("right-key");
let settingsButton      =   document.getElementById("settings-button");
let switchButton        =   document.getElementById("switch-button");
let statButton          =   document.getElementById("stat-button");
let infoButton          =   document.getElementById("info-button");
let statBox             =   document.getElementById("stat-box");
let infoBox             =   document.getElementById("info-box");
let settingsBox         =   document.getElementById("settings-box");
let colorSwitchButton   =   document.getElementById("color-switch");
let keyboardOverlay     =   document.getElementById("keyboard-overlay");
let bars                =   document.querySelectorAll(".bar");
let contentDiv          =   document.getElementById("content-div");
let contentCover        =   document.getElementById("content-cover");
let restartButton       =   document.getElementById("restart-button");
let errorDiv            =   document.getElementById("error-message");
let hideFunctionId;
let backspaceTimeout;

let currentStreakElement=   document.getElementById("current-streak-num");
let bestStreakElement   =   document.getElementById("best-streak-num");
let playedGamesElement  =   document.getElementById("played-games-num");
let wonGamesElement     =   document.getElementById("won-games-num");
let winPercentElement   =   document.getElementById("win-percent");
let avrTriesElement     =   document.getElementById("average-tries-num");

let rowList = null;
let activeRowTiles = null;
let statState = false;
let infoState = false;
let settingsState = false;
let endState = false;
let alternateColorState = false;
let wordLengthArray = [4, 5, 6];
let defaultWordLength = 5;
let nTries = 6;
let fourLetterWords, fiveLetterWords, sixLetterWords;
let wordLength, words, word;
let winArr, wins, losses, playedGames, streaks;

let backspaceHold = false;

try {
    let currentYear = new Date().getFullYear();
    document.getElementById("copyright-text").innerHTML = `&nbsp;© ${currentYear}`
} catch (err) {
    console.error("Fehler bei Datumsabfrage:", err)
}

/* if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('serviceworker.js')
        .then(() => console.log("Service Worker registriert"))
        .catch((error) => console.log("Service Worker Registrierung fehlgeschlagen:", error));
} */

// ------------------------------ Setup Process -----------------------------

let startSetup = setAllWordLists(wordLengthArray).then(() => {
    setupFunction();
    statSwitchFunction();
});

window.addEventListener("DOMContentLoaded", startSetup);

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
    // add function to change grid layout depending on word length
    
    reBuildGrid(wordLength);
    resizeGrid();
    setTileDimension();
    resetKeyboard();
    resetGridState();

    updateStatData()
    setActiveTile();        // auto sets the active tile
}

// handle keyboard presses
document.addEventListener("keydown", (event) => {
    event.preventDefault();
    let inputKey = event.key;
    /* console.log(inputKey); */
    if (!infoState) {
        if (inputKey == "Tab") {
            switchFunction();
            functionAfterEveryAction();
            return;
        }
    }
    if (!statState && !infoState && !settingsState) {
        /* console.log(pressedKeyData); */
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
        if (inputKey == " " || inputKey == "ArrowUp" || inputKey == "ArrowDown") {
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
            let ltr = inputKey.toUpperCase();
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
})

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

contentDiv.addEventListener("touchmove", (event) => {
    /* event.preventDefault(); */
    if (event.touches.length == 1) {
        if (deleteKey.contains(event.target) && backspaceHold) {
           let delBox = deleteKey.getBoundingClientRect();
           let touchX = event.touches[0].clientX;
           let touchY = event.touches[0].clientY;
           if (touchX < delBox.left || touchX > delBox.right || touchY < delBox.top || touchY > delBox.bottom) {
            backspaceHold = false;
            clearTimeout(backspaceTimeout);
           }
        }
    }
}, {passive: true})

document.addEventListener("touchend", (event) => {
    if (event.cancelable) {
        event.preventDefault();
    }
    backspaceHold = false;
    clearTimeout(backspaceTimeout);
    contentDiv.removeEventListener("touchmove");
})

document.addEventListener("touchcancel", (event) => {
    event.preventDefault();
    backspaceHold = false;
    clearTimeout(backspaceTimeout);
    contentDiv.removeEventListener("touchmove");
})

document.addEventListener("click", (event) => {
    event.preventDefault();
    touchClickInteraction(event);
});

// ---------------- touch or click functionality ------------------------
function touchClickInteraction(event) {
    /* console.log(event); */

    if (infoButton.contains(event.target)) {
        if (statState) { statSwitchFunction() }
        if (settingsState) { settingsSwitchFunction() }
        infoSwitchFunction();
        return;
    }

    if (settingsButton.contains(event.target)) {
        if (infoState) { infoSwitchFunction() }
        if (statState) { statSwitchFunction() }
        settingsSwitchFunction();
        return;
    }

    if (statButton.contains(event.target)) {
        if (infoState) { infoSwitchFunction() }
        if (settingsState) { settingsSwitchFunction() }
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

    if (statState && !statBox.contains(event.target) && !switchButton.contains(event.target)) {
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
        if (colorSwitchButton.contains(event.target)) {
            alternateColorSwitchFunction();
        }
    }

    if (!endState) {
        for (tile of activeRowTiles) { // logic for selecting or deselecting tile by clicking
            if (tile.contains(event.target)) {
                if (removeSelection(tile)) {
                    functionAfterEveryAction();
                    return
                } else {
                    removeAllSelection();
                    addSelection(tile);
                }
                functionAfterEveryAction();
                return;
            }
        }
        if (!(keyboardContainer.contains(event.target))) {
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
            return
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
    if (localStorage.getItem("alternateColors") != null && !alternateColorState) {
        alternateColorSwitchFunction();
    }
}

function animateStatInt(element, value) {
    element.style.setProperty("--num", value)
    addClasses(element, ["change-num"]);
}

function updateStatData() {
/*     console.log(winArr);
    console.log("current:", streaks.current);
    console.log("best", streaks.best);
    console.log("losses", losses);
    console.log("wins:", wins); */


    if (statState) {
    /*     currentStreakElement.innerText = streaks.current.toString(); */
        animateStatInt(currentStreakElement, streaks.current.toString());

    /*     bestStreakElement.innerText = streaks.best.toString(); */
        animateStatInt(bestStreakElement, streaks.best.toString());
    
    /*     playedGamesElement.innerText = playedGames.toString(); */
        animateStatInt(playedGamesElement, playedGames.toString());
        
    /*     wonGamesElement.innerText = wins.toString(); */
        animateStatInt(wonGamesElement, wins.toString());
    }

/*     winPercentElement.innerText = winPercentStr; */
    let winPercentStr = ((playedGames == 0) ? "0.00" : ((wins / playedGames) * 100).toFixed(2));
    
    if (!statState) {
        winPercentElement.style.setProperty("--percent", "0.00");
    } else {
        winPercentElement.style.setProperty("--percent", winPercentStr);
    }
    addClasses(winPercentElement, ["change-float"]);

    // calculate average tries
    let highestN = winArr[3];
    let avrTries = 0;
    let avrTriesStr;
    for (let i = 3; i < winArr.length; i++) {
        avrTries += winArr[i] * (i - 2);
        if (winArr[i] > highestN) {
            highestN = winArr[i];
        }
    }
    avrTriesStr = ((wins == 0) ? "0.00" : (avrTries / wins).toFixed(2));    
    if (!statState) {
        avrTriesElement.style.setProperty("--percent", "0.00");
    } else {
        avrTriesElement.style.setProperty("--percent", avrTriesStr);
    }
    addClasses(avrTriesElement, ["change-float"]);
    /* avrTriesElement.innerText = avrTriesStr; */


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
            let barStyle = window.getComputedStyle(bar);
            let currBarHeight = barStyle.getPropertyValue("--percentage");
            if (currBarHeight == "") {
                currBarHeight = "0%"
            }
            bar.style.setProperty("--prev-px", currBarHeight);
            let barPercent = ((highestN == 0) ? 0 : parseFloat((winArr[i] / highestN * 100).toFixed(2)));
            let barPercentStr = barPercent + "%";
            bar.style.setProperty("--percentage", barPercentStr);
            bar.style.setProperty("height", barPercentStr);

            animateStatInt(barTopNum, winArr[i]);
            /* barTopNum.innerText = winArr[i]; */
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
            btnContainer.style.setProperty("--new-btnh", "-" + barTopNumHeight + "px");
        } else {
            btnContainer.style.setProperty("--new-btnh", "0px");
        }
    }

    if (statState) {
        for (let i = 3; i < winArr.length; i++) {
            let bar = document.getElementById("bar-" + (i - 2));
            addClasses(bar, ["change-bar"]);

            let btnContainer = document.getElementById("btn-container-" + (i - 2));
            let btnStyle = window.getComputedStyle(btnContainer);
            if (btnStyle.getPropertyValue("--curr-btnh") != btnStyle.getPropertyValue("--new-btnh")) {
                addClasses(btnContainer, ["change-btnh"]);
            }
        }
    }
}

function setWordLength() {
    wordLength = Number(localStorage.getItem("userWordLength"));
    if (wordLength == 0 || isNaN(wordLength)) {
        wordLength = defaultWordLength;
    }
    document.getElementById("stat-heading-num").innerText = `6x${wordLength}`;
}

function setTileDimension() {
    // set tile width
    let tileWidth = document.querySelector(".tile").offsetWidth;
    let tileFontSize = Math.floor(tileWidth * 0.66);
    let fontSizeString = tileFontSize.toString() + "px";
    let tileFontSizeRule = getCssRulesFor(".letter-box");
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
    let contentHeight = getContentHeight();
    let windowHeight = window.innerHeight;
/*     console.log(gameHeight);
    console.log(windowHeight); */
    if (contentHeight > windowHeight) {
        let gridContainerRules = getCssRulesFor(".grid-container");
        let currentWidthString = gridContainerRules.style.getPropertyValue("width");
        let currentWidth = Math.ceil(parseFloat(currentWidthString.slice(0, -1)));
        if (currentWidth < 20) {
            return;
        }
        let widthStr = (currentWidth - 1) + "%";
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
    let newRow = document.createElement("div");
    addClasses(newRow, ["row", "grid-row"]);
    let newTile = document.createElement("div");
    addClasses(newTile, ["tile", "grid-tile"]);
    let newLetterBox = document.createElement("div");
    addClasses(newLetterBox, ["letter-box"]);
    newTile.appendChild(newLetterBox);
    for (let i = 0; i < wl; i++) {
        newRow.appendChild(newTile.cloneNode(true));
    }
    for (let i = 0; i < nTries; i++) {
        grid.appendChild(newRow.cloneNode(true));
    }
    getAllGridTiles();
    getGridRowList();
    addClasses(rowList[0], ["activerow"]);
    getActiveRowTiles();
}

function resetGridState() {
    unsetEndState();
    let strWrdLst = localStorage.getItem(wordLength + "-inputWords");
/*     localStorage.removeItem(wordLenght + "-inputWords"); */
    if (strWrdLst == null) {
        return;
    }
    wordArr = JSON.parse(strWrdLst);
    let i = wordArr.length;
    for (let x = 0; x < i; x++) {
        for (let n = 0; n < wordLength; n++) {
            let revealWord = "";
            rowList[x].children[n].children[0].innerText = wordArr[x][n].toUpperCase();
            revealWord += wordArr[x][n];
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

function removeSelection(tile) {
    if (hasClass(tile, "selected")) {
        tile.classList.remove("selected")
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
        })
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
        if (ati == undefined || ati == (wordLength - 1)) {
            addSelection(activeRowTiles[0])
        } else if (ati < (wordLength - 1)) {
            addSelection(activeRowTiles[ati + 1])
        }
        functionAfterEveryAction();
    }
}

function selectionToLeft() {
    if (!endState) {
        let ati = getActiveTileIndex();
        removeAllSelection();
        if (ati == undefined || ati == 0) {
            addSelection(activeRowTiles[wordLength - 1])
        } else if (ati > 0) {
            addSelection(activeRowTiles[ati - 1])
        }
        functionAfterEveryAction();
    }
}

function storeInputWord(inpWrd) {
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
        if (ati == undefined) { // clear last tile if all contain letter
            activeRowTiles[activeRowTiles.length - 1].children[0].innerText = "";
        } else if (activeRowTiles[ati].children[0].innerText != "") { // clear letter in act tile
            activeRowTiles[ati].children[0].innerText = "";
        } else if (ati != 0 && activeRowTiles[ati].children[0].innerText == "") {
            if (removeSelection(activeRowTiles[ati])) {
                addSelection(activeRowTiles[ati - 1]);
            }
            activeRowTiles[ati - 1].children[0].innerText = ""
        } else if (ati == 0) {
            removeSelection(activeRowTiles[ati], ["selected"]);
            wiggleActiveRow();
        }
        functionAfterEveryAction();
    } 
}

function enterFunction(resetState = false) {
    if (!endState) {
        if (activeRowFull()) {
            let inpStr = "";
            for (let tile of activeRowTiles) {
                inpStr += tile.children[0].innerText;
            }
            inpStr = inpStr.toLowerCase();
            let itr = 0;
            if (words.includes(inpStr) || word == inpStr || resetState) {
                revealActiveRow(inpStr, word);

                if (!resetState) {
                    storeInputWord(inpStr);
                }

                if (word == inpStr) { // win logic
                    removeAllSelection();
                    cleanActiveTiles();
                    activeRowTiles = null;
                    let winRow = 1;
                    for (let row of rowList) {
                        if (removeClasses(row, ["activerow"])) {
                            break;
                        }                       
                        winRow++;
                    }

                    if (!resetState) { // do not update stats while loading grid state
                        playedGames++;
                        wins++;
                        winArr[winRow + 2]++;
                        streaks.current++;
                        if (streaks.current > streaks.best) {
                            streaks.best = streaks.current;
                        }
                        winArr[0] = streaks.current;
                        winArr[1] = streaks.best;
                        // update win arr
                        localStorage.setItem(wordLength + "-winArr", winArr);
                        updateStatData();
                    }

                    if (winRow == 1) {
                        setEndState(`WOW!\nGlückspilz :)`);
                    } else if (winRow == nTries) {
                        setEndState(`Puh, knapp!\n${winRow} Versuche!`);
                    } else {
                        setEndState(`Gewonnen in ${winRow} Versuchen!`);
                    }
                    
                }
                for (let row of rowList) {
                    if (hasClass(row, "activerow")) {
                        removeAllSelection();
                        cleanActiveTiles();
                        removeClasses(row, ["activerow"]);

                        if (itr == rowList.length - 1) { // if last guess
                            activeRowTiles = null;
                            setEndState(word.toUpperCase() + " . . .") // loseState
                
                            if (!resetState) { // do not update stats while loading grid state
                                playedGames++;
                                losses++;
                                winArr[2] = losses;
				                streaks.current = 0;
			    	            winArr[0] = streaks.current;
                                // update win arr
                                localStorage.setItem(wordLength + "-winArr", winArr);
                                updateStatData();
                            }
                            break;

                        } else {
                            rowList[itr + 1].classList.add("activerow"); // advance active row
                            getActiveRowTiles();
                            break;
                        }
                    }
                    itr += 1;
                }
            } else {
                setErrorMessage("Nicht in der Wortliste!");
            }
        }
        else {
            setErrorMessage("Zu wenige Buchstaben!");
        }
    }
}

function alternateColorSwitchFunction() {
    alternateColorState = !alternateColorState;
    let rootCssRules = getCssRulesFor(":root");
    if (alternateColorState) { // set alternative colors
        localStorage.setItem("alternateColors", "y");
        addClasses(colorSwitchButton, ["toggle-switch-on"]);
        removeClasses(colorSwitchButton, ["toggle-switch-off"]);
        rootCssRules.style.setProperty("--tile-green", "rgb(24, 77, 138)");
        rootCssRules.style.setProperty("--tile-green-80", "rgba(24, 77, 138, 0.8)");
        rootCssRules.style.setProperty("--tile-yellow", "rgb(197, 85, 51)");
        rootCssRules.style.setProperty("--tile-yellow-80", "rgba(197, 85, 51, 0.8)");
    } else { // set normal colors
        localStorage.removeItem("alternateColors");
        addClasses(colorSwitchButton, ["toggle-switch-off"]);
        removeClasses(colorSwitchButton, ["toggle-switch-on"]);
        rootCssRules.style.setProperty("--tile-green", "rgb(58, 134, 61)");
        rootCssRules.style.setProperty("--tile-green-80", "rgba(58, 134, 60, 0.8)");
        rootCssRules.style.setProperty("--tile-yellow", "rgb(219, 146, 0)");
        rootCssRules.style.setProperty("--tile-yellow-80", "rgba(219, 146, 0, 0.8)");
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
    document.getElementById("keyboard-overlay").style.setProperty("visibility", "hidden");
    removeClasses(restartButton, ["rotate"]);
    document.getElementById("end-message-paragraph").innerText = "";
}

function writeActiveTile(letter) {
    if (!endState) {
        for (let tile of activeRowTiles) {
            if (hasClass(tile, "active")) {
                tile.children[0].innerText = letter;
                functionAfterEveryAction();
                return;
            }
        }
    }
}

function clearActiveRow() {
    if (!endState) {
        for (tile of activeRowTiles) {
            tile.children[0].innerText = "";
        }
        functionAfterEveryAction();
    }
}

function fadeKey(keyObj) {
    removeClasses(keyObj, ["fading-key"]);
    keyObj.style.animation = 'none';
    setTimeout (() => {
        keyObj.style.animation = "";;
    }, 5);
    addClasses(keyObj, ["fading-key"]);
}

function repressDeleteKey(itr = 0) {
    if (itr > 10) {return};
    let ms = (itr == 0) ? 400 : 40;
    backspaceTimeout = setTimeout(() => {
        if (backspaceHold) {
            fadeKey(deleteKey);
            backspaceFunction();
            repressDeleteKey(itr + 1);
        }    
    }, ms);
}

function cleanActiveTiles() {
    if (!endState) {
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
        if (!hasClass(tile, "about-tile") ) {
            removeClasses(tile, ["checked", "bg-green", "bg-yellow", "bg-dark"]);
            tile.children[0].innerText = "";
        }
    }
    resetKeyboard();
    unsetEndState()
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
    if (statState) { // do the following if stat state is being deactivated
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
        return
    }
    // do the following if stat state is being activated
    statState = true;
    contentCover.style.setProperty("visibility", "visible");
    addClasses(statButton, ["active-side-button"]);
    statBox.style.visibility = "visible";
    settingsButton.style.visibility = "hidden";
    infoButton.style.visibility = "hidden";
    updateStatData();
}

function infoSwitchFunction() {
    if (infoState) {
        infoState = false;
        contentCover.style.visibility = "hidden";
        switchButton.style.setProperty("visibility", "visible");
        statButton.style.setProperty("visibility", "visible");
        removeClasses(infoButton, ["active-side-button"]);
        infoBox.style.visibility = "hidden";
        return;
    }
    infoState = true;
    contentCover.style.setProperty("visibility", "visible");
    switchButton.style.setProperty("visibility", "hidden");
    statButton.style.setProperty("visibility", "hidden");
    addClasses(infoButton, ["active-side-button"]);
    infoBox.style.visibility = "visible";
}

function settingsSwitchFunction() {
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
    settingsState = true;
    contentCover.style.setProperty("visibility", "visible");
    switchButton.style.setProperty("visibility", "hidden");
    statButton.style.setProperty("visibility", "hidden");
    addClasses(settingsButton, ["active-side-button"]);
    settingsBox.style.visibility = "visible";
}

function getCssRulesFor(styleString) {
    let stylesheet = document.styleSheets[0];
    return [...stylesheet.cssRules].find(
        (r) => r.selectorText === styleString,
    )
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


// ------- fetch word list ------------------------------------------------
async function setAllWordLists(validWordLengthArray) {
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
        console.error('Error in setAllWordList:', error);
    }
}

async function fetchWordArray(n) {
    let wordListPath = "assets/wordlists/" + n + "-letter-words.txt";
    try {
      // Fetch the words.txt file from the local web server
      let response = await fetch(wordListPath);
      
      // Ensure the request was successful
      if (!response.ok) {
        throw new Error('Failed to fetch wordlist');
      }
  
      // Get the text content of the file
      let text = await response.text();
  
      // Split the content into an array of words (splitting by newlines)
      let wordsArray = text.split('\n');
  
      // Remove any extra spaces or empty lines
      // wordsArray = wordsArray.filter(word => word.trim() !== '');
      wordsArray = wordsArray.map(s => s.replace(/\r/g, ''));
  
      return wordsArray;
  
    } catch (error) {
      console.error('Error fetching or processing the file:', error);
      return null;
    }
}

function wiggleActiveRow() {
    let activeRow = document.getElementsByClassName("activerow")[0];
    removeClasses(activeRow, ["wiggle-row"]);
    setTimeout(() => {
        addClasses(activeRow, ["wiggle-row"]);
    }, 0)
}

function setErrorMessage(message) {
    wiggleActiveRow();
    clearTimeout(hideFunctionId);
    errorDiv.innerText = message;
    errorDiv.style.visibility = "visible";
    hideFunctionId = setTimeout(() => {errorDiv.style.visibility = "hidden"; errorDiv.innerText = ""}, 1500);
}

// ------- word checking function -----------------------------------------
function revealActiveRow(inputWord, hiddenWord) {
    let inputMultArr = checkMultiple(inputWord);
    let nInputMultLetters = inputMultArr[0].length;
    if (nInputMultLetters > 0) {//if input word has multiple letters
        for (let i = 0; i < nInputMultLetters; i++) {
            let letter = inputMultArr[0][i];
            let ltrCap = letter.toUpperCase();
            let correspInputLetterInd = inputMultArr[i + 1];
            let correspWordLetterInd = [];
            if (hiddenWord.includes(letter)) {//go through each mult letter and check if it is in hiddenWord
                //check if mult letter is more often in input than in hiddenWord
                //store the numbers of the letter in input and numbers of the letter in hiddenWord
                let nLetterInInput = inputMultArr[i + 1].length;
                //console.log(`--> ${letter} is in input ${nLetterInInput} times at indices ${correspInputLetterInd}`);
                for (let x = 0; x < hiddenWord.length; x++) {
                    if (letter == hiddenWord[x]) {
                    correspWordLetterInd.push(x);
                    }
                }
                let nLetterInHiddenWord = correspWordLetterInd.length;
                //console.log(`--> ${letter} is in hiddenWord ${nLetterInWord} time(s) at indices ${correspWordLetterInd}`);
                if (nLetterInInput > nLetterInHiddenWord) {
                    //console.log("--> I will track " + letter);
                    let letterTracker = correspInputLetterInd; // TOTAL --> letterTracker for T = [0, 2]
                    let yellowCounter = correspWordLetterInd.length;
                    //console.log("--> letterTracker for " + letter + " = " + letterTracker);
                    //go through the corresponding word letter indices
                    //console.log("----> correspWordLetterInd: " + correspWordLetterInd);
                    for (let j = 0; j < nLetterInHiddenWord; j++) {
                        let checkedIndex = correspWordLetterInd[j];
                        //if the checked mult letter matches, set it to green
                        let matchCount = 0;
                        if (hiddenWord[checkedIndex] == inputWord[checkedIndex]) {
                            addClasses(activeRowTiles[checkedIndex], ["bg-green", "checked"])
                            //color the corresponding keyboard key green
                            let aKey = document.getElementById(ltrCap + "-key");
                            addClasses(aKey, ["bg-green"]);
                            removeClasses(aKey, ["bg-yellow"]);
                            //console.log(`------> Letter ${letter} matches at index ${checkedIndex}`);
                            matchCount += 1;
                            yellowCounter--;
                        }
                        //go through the letter tracker array and delete the corresponding index
                        letterTracker = letterTracker.filter(
                            (x) => !correspWordLetterInd.includes(x)
                        );
                    }
                    //console.log(`------> ${letter} will be set yellow at [${letterTracker}] ${yellowCounter} time(s)`);
                    //color the tiles yellow
                    for (let j = 0; j < letterTracker.length; j++) {
                        addClasses(activeRowTiles[letterTracker[j]], ["checked"]);
                        //console.log(`I checked letter ${letter} at index ${letterTracker[j]}.`);
                        if (yellowCounter > 0) {
                            //console.log(`I painted ${letter} at index ${letterTracker[j]} yellow.`);
                            addClasses(activeRowTiles[letterTracker[j]], ["bg-yellow"])
                            yellowCounter--;
                            //color the corresponding keyboard key
                            let aKey = document.getElementById(ltrCap + "-key");
                            if (!hasClass(aKey, "bg-green")) {
                                addClasses(aKey, "bg-yellow")
                            }
                        }
                    }
                } /* else {
                    console.log(`I don't have to track ${letter}`);
                } */
            }
        }
    }
    //color all remaining unchecked tiles and corresp keys
    for (i = 0; i < hiddenWord.length; i++) {
        if (!hasClass(activeRowTiles[i], "checked")) {
            let ltrSmall = inputWord[i];
            let ltrCap = ltrSmall.toUpperCase();
            let aKey = document.getElementById(ltrCap + "-key");
            if (!hiddenWord.includes(ltrSmall)) {             //color dark
                addClasses(aKey, ["bg-dark"])
            } else if (ltrSmall == hiddenWord[i]) {           //color green
                addClasses(activeRowTiles[i], ["bg-green"]);
                addClasses(aKey, ["bg-green"]);
                removeClasses(aKey, ["bg-yellow"]);
            } else {                                          //color yellow
                addClasses(activeRowTiles[i], ["bg-yellow"]);
                if (!hasClass(aKey, "bg-green")) {
                    addClasses(aKey, ["bg-yellow"])
                }
            }
            addClasses(activeRowTiles[i], ["checked"]);
        }
    }
}

function checkMultiple(wort) {
    let multArray = [];
    let outputArray = [[]];
    //fill multArray with ones (assuming that every letter is contained ones)
    for (let i = 0; i < wort.length; i++) {multArray.push(1)}  
    for (let i = 0; i < wort.length; i++) {
        if (multArray[i] == 1) {        // go through every letter of wort which still has an indicator 1
            let tempMultArr = [i];      // for this letter: create tempMultArr that stores all occuring indexes
            for (let j = i + 1; j < wort.length; j++) {
                if (wort[i] == wort[j]) {tempMultArr.push(j);} 
            }                           // tempMultArr --> [0, 1, 2] current is at all these indices of wort        
            let n = tempMultArr.length; // n is 3 if the current letter is in the wort three times
            if (n > 1) {                
                outputArray[0].push(wort[i]); //add letter with n > n to outputArray[0]
                                        
                for (let k = 0; k < n; k++) {
                    multArray[tempMultArr[k]] = n;
                } //set multArray values of the stored multiples by assigning length of tmpMult
                outputArray.push(tempMultArr);
            }
        }
    }
    // outputArray[0].length --> number of letters that occur more than ones in wort
    // letter in outputArray[0[n]] occurs in wort outputArray[n+1].length times at indices outputArray[n+1]]
    // console.log(outputArray);
    return outputArray; // if wort = "aabbc" --> outputArray == [["a", "b"], [0, 1], [2, 3]]
}