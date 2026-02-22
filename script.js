let gameHours = 12, gameMinutes = 0, targetHours = 0, targetMinutes = 0;
let score = 0, streak = 0, level = 1, currentMode = ""; 
let timeLeft = 30, timerInterval;

function startGame(mode) {
    currentMode = mode;
    score = 0; streak = 0; level = 1;
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
        // HÄR TOG VI BORT TEXTEN:
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

function timeToSwedishText(h, m) {
    let cH = h % 12 || 12; 
    let nH = (h + 1) % 12 || 12;
    const nums = ["", "ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "elva", "tolv"];
    switch(m) {
        case 0: return nums[cH]; 
        case 5: return "fem över " + nums[cH];
        case 10: return "tio över " + nums[cH];
        case 15: return "kvart över " + nums[cH];
        case 20: return "tjugo över " + nums[cH];
        case 25: return "fem i halv " + nums[nH];
        case 30: return "halv " + nums[nH];
        case 35: return "fem över halv " + nums[nH];
        case 40: return "tjugo i " + nums[nH];
        case 45: return "kvart i " + nums[nH];
        case 50: return "tio i " + nums[nH];
        case 55: return "fem i " + nums[nH];
    }
}

function generateNewTask() {
    document.getElementById("meddelande").innerText = "";
    targetHours = Math.floor(Math.random() * 24);
    
    if (level === 1) targetMinutes = 0; 
    else if (level === 2) targetMinutes = (Math.random() < 0.5) ? 0 : 30; 
    else if (level === 3) {
        const options = [0, 15, 30, 45];
        targetMinutes = options[Math.floor(Math.random() * options.length)];
    } else {
        targetMinutes = Math.floor(Math.random() * 12) * 5; 
    }

    const badge = document.getElementById("uppdrag-tid");
    badge.style.fontSize = "32px"; // Återställ storleken för vanliga uppdrag
    if (Math.random() < 0.5) {
        let txt = timeToSwedishText(targetHours, targetMinutes);
        badge.innerText = txt.charAt(0).toUpperCase() + txt.slice(1);
    } else {
        let hh = targetHours < 10 ? "0"+targetHours : targetHours;
        let mm = targetMinutes < 10 ? "0"+targetMinutes : targetMinutes;
        badge.innerText = hh + ":" + mm;
    }
}

function generateProblemTask() {
    document.getElementById("meddelande").innerText = "";
    
    let startH = Math.floor(Math.random() * 12) + 1;
    let startM = (Math.random() < 0.5) ? 0 : 30;
    let durations = [15, 30, 45, 60, 90];
    let duration = durations[Math.floor(Math.random() * durations.length)];
    
    let totalMinutes = startH * 60 + startM + duration;
    targetHours = Math.floor(totalMinutes / 60) % 24;
    targetMinutes = totalMinutes % 60;

    const namn = ["Elias", "Ahmad", "Rasmus", "Hawbir", "Kismah", "Anki", "Annika", "Hanna G", "Hanna B", "Anna", "Emin", "Brittis", "Evelina", "Klas", "Christian", "Conny", "Cecilia", "Carro", "Catalin", "Mi", "Aya", "Barnabe"];
    
    // Här är de grammatiskt korrekta formerna (att-form):
    const aktivitet = ["bada", "cykla", "läsa", "titta på TV", "träna", "äta frukost", "spela fotboll", "ha rast", "rita", "spela roblox", "rätta prov"];
    
    let valtNamn = namn[Math.floor(Math.random() * namn.length)];
    let valdAktivitet = aktivitet[Math.floor(Math.random() * aktivitet.length)];
    let startTidText = (startH < 10 ? "0"+startH : startH) + ":" + (startM < 10 ? "0"+startM : startM);
    
    const badge = document.getElementById("uppdrag-tid");
    badge.style.fontSize = "20px"; 
    badge.innerText = `${valtNamn} börjar ${valdAktivitet} klockan ${startTidText}. Det håller på i ${duration} minuter. Vad är klockan när ${valtNamn} är klar?`;
}

function checkAnswer() {
    let cH = gameHours % 12 || 12;
    let tH = targetHours % 12 || 12;
    if (cH === tH && gameMinutes === targetMinutes) {
        score++; streak++;
        document.getElementById("meddelande").style.color = "#00695C";
        document.getElementById("meddelande").innerText = (currentMode === 'tid') ? "🌟 Rätt! +3 sek! 🌟" : "🌟 Helt rätt! 🌟";
        if (currentMode === 'tid') timeLeft += 3;
        
        if (streak >= 5 && level < 4) { 
            level++; 
            streak = 0; 
            document.getElementById("meddelande").innerText = "🎉 NIVÅ UPPHÖJD! 🎉";
        }
        
        updateStats();
        
        if (currentMode === 'problem') {
            setTimeout(generateProblemTask, 3000);
        } else {
            setTimeout(generateNewTask, currentMode === 'tid' ? 500 : 2000);
        }
    } else {
        streak = 0; 
        updateStats();
        document.getElementById("meddelande").innerText = "Försök igen!";
        document.getElementById("meddelande").style.color = "#D32F2F";
    }
}

// DRA OCH SLÄPP (Mus + Touch)
let isDragging = false;
let activeHand = null;
const clock = document.querySelector('.clock');

function getAngle(e) {
    const r = clock.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - (r.left + r.width/2);
    const y = clientY - (r.top + r.height/2);
    let a = Math.atan2(y, x) * (180/Math.PI) + 90;
    return a < 0 ? a + 360 : a;
}

function startDrag(e, hand) {
    isDragging = true;
    activeHand = hand;
    document.getElementById("meddelande").innerText = "";
}

document.getElementById('minuteHand').onmousedown = (e) => startDrag(e, 'min');
document.getElementById('hourHand').onmousedown = (e) => startDrag(e, 'hour');
document.getElementById('minuteHand').ontouchstart = (e) => startDrag(e, 'min');
document.getElementById('hourHand').ontouchstart = (e) => startDrag(e, 'hour');

function doDrag(e) {
    if (!isDragging) return;
    const a = getAngle(e);
    if (activeHand === 'min') gameMinutes = (Math.round(a/30)*30/6)%60;
    else gameHours = Math.round(a/30) || 12;
    updateClock();
}

document.addEventListener('mousemove', doDrag);
document.addEventListener('touchmove', (e) => { if(isDragging) e.preventDefault(); doDrag(e); }, {passive: false});
document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('touchend', () => isDragging = false);

updateClock();