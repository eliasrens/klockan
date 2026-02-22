// ========================================
// KLOCKSPLET - Spellogik
// ========================================

// --- SPELLOGIK ---
function startGame(mode) {
    currentMode = mode;
    score = 0; streak = 0; level = 1;
    maxStreakThisGame = 0;
    maxLevelThisGame = 1;
    updateStats();
    document.getElementById("meddelande").innerText = "";
    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("game-container").classList.remove("hidden");
    document.getElementById("game-play-area").classList.remove("hidden");
    
    clearInterval(timerInterval);

    if (currentMode === 'tid') {
        document.getElementById("instruction-text").innerText = "Snabbt! Ställ klockan på:";
        timeLeft = 30;
        document.getElementById("time-left").innerText = timeLeft;
        document.getElementById("timer-container").classList.remove("hidden");
        timerInterval = setInterval(updateTimer, 1000);
        generateNewTask();
    } else if (currentMode === 'problem') {
        document.getElementById("instruction-text").innerText = ""; 
        document.getElementById("timer-container").classList.add("hidden");
        generateProblemTask();
    } else {
        document.getElementById("instruction-text").innerText = "Ställ klockan på:";
        document.getElementById("timer-container").classList.add("hidden");
        generateNewTask();
    }
}

function updateStats() {
    document.getElementById("score-display").innerText = score;
    document.getElementById("streak-display").innerText = streak;
    document.getElementById("level-display").innerText = level;
}

function showMenu() {
    // Spara spelets resultat innan vi går tillbaka till menyn
    if (currentUser && currentMode && score > 0) {
        saveGameResult(currentMode, score, maxLevelThisGame, maxStreakThisGame);
    }
    
    clearInterval(timerInterval);
    document.getElementById("game-container").classList.add("hidden");
    document.getElementById("main-menu").classList.remove("hidden");
}

function updateTimer() {
    timeLeft--;
    document.getElementById("time-left").innerText = timeLeft;
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        document.getElementById("meddelande").innerText = `⏰ TIDEN ÄR UTE! Poäng: ${score} ⏰`;
        document.getElementById("game-play-area").classList.add("hidden");
        
        // Spara spelets resultat
        if (currentUser) {
            saveGameResult(currentMode, score, maxLevelThisGame, maxStreakThisGame);
        }
    }
}

function updateClock() {
    const minDeg = gameMinutes * 6;
    const hourDeg = (gameHours * 30) + (gameMinutes * 0.5);
    document.getElementById('minuteHand').style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
    document.getElementById('hourHand').style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
}

function addTime(h, m) {
    document.getElementById("meddelande").innerText = ""; 
    gameHours += h; gameMinutes += m;
    if (gameMinutes >= 60) { gameMinutes -= 60; gameHours += 1; }
    updateClock();
}
