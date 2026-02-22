// ========================================
// KLOCKSPLET - Supabase Version
// ========================================

// --- KONFIGURATION ---
// Ersätt dessa med dina egna Supabase-uppgifter
const SUPABASE_URL = 'https://astapyrfupqenhlresxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdGFweXJmdXBxZW5obHJlc3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjQwODMsImV4cCI6MjA4NzM0MDA4M30.XKdkbDwtDcQPAKduwUlBiiMuklYct5rYvmVW-ycCKnM';

// --- GLOBALA VARIABLER ---
let gameHours = 12, gameMinutes = 0, targetHours = 0, targetMinutes = 0;
let score = 0, streak = 0, level = 1, currentMode = ""; 
let timeLeft = 30, timerInterval;

// Användarvariabler
let currentUser = null;
let userStats = {};
let supabaseClient = null;

// Spelvariabler för att spåra maxvärden
let maxStreakThisGame = 0;
let maxLevelThisGame = 1;

// --- INITIALISERING ---
document.addEventListener('DOMContentLoaded', async () => {
    // Kolla om användaren redan är inloggad
    const savedUser = localStorage.getItem('klockspelet_user');
    
    if (savedUser && SUPABASE_URL !== 'DIN_SUPABASE_URL') {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            currentUser = JSON.parse(savedUser);
            await loadUserStats();
            showMainMenu();
        } catch (error) {
            console.error("Fel vid inloggning:", error);
            localStorage.removeItem('klockspelet_user');
        }
    } else if (SUPABASE_URL === 'DIN_SUPABASE_URL') {
        // Offline-läge (fallback om ingen Supabase är konfigurerad)
        document.getElementById('login-loading').textContent = 'Offline-läge - sparas lokalt';
        setTimeout(() => {
            document.getElementById('login-loading').textContent = '';
        }, 2000);
    }
    
    updateClock();
});

// --- INLOGGNING ---
async function login() {
    const classSelect = document.getElementById('class-select');
    const nameInput = document.getElementById('name-input');
    const errorMessage = document.getElementById('login-error');
    const loadingMessage = document.getElementById('login-loading');
    
    const userClass = classSelect.value;
    const userName = nameInput.value.trim();
    
    // Validering
    if (!userClass) {
        errorMessage.textContent = "Välj en klass!";
        return;
    }
    
    if (!userName) {
        errorMessage.textContent = "Skriv ditt namn!";
        return;
    }
    
    if (userName.length < 2) {
        errorMessage.textContent = "Namnet måste vara minst 2 bokstäver!";
        return;
    }
    
    errorMessage.textContent = "";
    loadingMessage.textContent = "Loggar in...";
    
    if (SUPABASE_URL === 'DIN_SUPABASE_URL') {
        // Offline-läge - använd localStorage
        offlineLogin(userClass, userName);
    } else {
        try {
            // Skapa Supabase-klient om den inte redan finns
            if (!supabaseClient) {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            }
            
            // Kolla om användaren redan finns i databasen
            const { data: existingProfile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('name', userName)
                .eq('class', userClass)
                .maybeSingle();
            
            if (profileError) throw profileError;
            
            if (existingProfile) {
                // Användaren finns - logga in
                currentUser = {
                    id: existingProfile.id,
                    name: userName,
                    class: userClass
                };
            } else {
                // Ny användare - skapa ny profil
                const { data: newProfile, error: insertError } = await supabaseClient
                    .from('profiles')
                    .insert({
                        name: userName,
                        class: userClass
                    })
                    .select()
                    .single();
                
                if (insertError) throw insertError;
                
                // Initiera statistik för nya användaren
                await supabaseClient.from('player_stats').insert([
                    { user_id: newProfile.id, mode: 'enkel', score: 0, level: 1, max_streak: 0, games_played: 0 },
                    { user_id: newProfile.id, mode: 'tid', score: 0, level: 1, max_streak: 0, games_played: 0 },
                    { user_id: newProfile.id, mode: 'problem', score: 0, level: 1, max_streak: 0, games_played: 0 }
                ]);
                
                currentUser = {
                    id: newProfile.id,
                    name: userName,
                    class: userClass
                };
            }
            
            // Spara till localStorage
            localStorage.setItem('klockspelet_user', JSON.stringify(currentUser));
            
            // Ladda statistik
            await loadUserStats();
            
            showMainMenu();
        } catch (error) {
            console.error("Inloggningsfel:", error);
            errorMessage.textContent = "Kunde inte ansluta till servern. Försök igen.";
            loadingMessage.textContent = "";
        }
    }
}

// Offline-inloggning (fallback)
function offlineLogin(userClass, userName) {
    // Hämta eller skapa offline-användare
    let offlineUsers = JSON.parse(localStorage.getItem('klockspelet_offline_users') || '[]');
    let user = offlineUsers.find(u => u.name === userName && u.class === userClass);
    
    if (!user) {
        user = {
            id: 'offline_' + Date.now(),
            name: userName,
            class: userClass,
            stats: {
                enkel: { score: 0, level: 1, max_streak: 0, games_played: 0 },
                tid: { score: 0, level: 1, max_streak: 0, games_played: 0 },
                problem: { score: 0, level: 1, max_streak: 0, games_played: 0 }
            }
        };
        offlineUsers.push(user);
        localStorage.setItem('klockspelet_offline_users', JSON.stringify(offlineUsers));
    }
    
    currentUser = user;
    userStats = user.stats;
    
    document.getElementById('login-loading').textContent = '';
    showMainMenu();
}

// Ladda användarstatistik från Supabase
async function loadUserStats() {
    if (SUPABASE_URL === 'DIN_SUPABASE_URL') return;
    
    try {
        const { data, error } = await supabaseClient
            .from('player_stats')
            .select('*')
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Omvandla till objekt
        userStats = {};
        data.forEach(stat => {
            userStats[stat.mode] = stat;
        });
        
        updateStatsSummary();
    } catch (error) {
        console.error("Fel vid laddning av statistik:", error);
    }
}

// Uppdatera statistiksammanfattning i menyn
function updateStatsSummary() {
    const modes = ['enkel', 'tid', 'problem'];
    const modeNames = {
        enkel: 'stats-enkel',
        tid: 'stats-tid',
        problem: 'stats-problem'
    };
    
    modes.forEach(mode => {
        const stats = userStats[mode];
        const element = document.getElementById(modeNames[mode]);
        if (stats) {
            element.textContent = `Poäng: ${stats.score || 0} | Högsta streak: ${stats.max_streak || 0}`;
        } else {
            element.textContent = 'Poäng: 0 | Högsta streak: 0';
        }
    });
}

// Visa huvudmeny
function showMainMenu() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    
    document.getElementById('user-display').textContent = `👤 ${currentUser.name} (${currentUser.class})`;
    
    updateStatsSummary();
}

// Logga ut
async function logout() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    localStorage.removeItem('klockspelet_user');
    currentUser = null;
    userStats = {};
    
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('name-input').value = '';
    document.getElementById('class-select').value = '';
}

// --- SPARSTATISTIK ---
async function saveGameResult(mode, finalScore, maxLvl, maxStrk) {
    if (!currentUser) return;
    
    // Uppdatera lokalt först (direkt feedback)
    if (!userStats[mode]) {
        userStats[mode] = { score: 0, level: 1, max_streak: 0, games_played: 0 };
    }
    
    const stats = userStats[mode];
    stats.score = Math.max(stats.score || 0, finalScore);
    stats.max_streak = Math.max(stats.max_streak || 0, maxStrk);
    stats.level = Math.max(stats.level || 1, maxLvl);
    stats.games_played = (stats.games_played || 0) + 1;
    
    updateStatsSummary();
    
    if (SUPABASE_URL === 'DIN_SUPABASE_URL') {
        // Spara offline
        saveOfflineStats();
    } else {
        // Spara till Supabase
        try {
            const { error } = await supabaseClient
                .from('player_stats')
                .upsert({
                    user_id: currentUser.id,
                    mode: mode,
                    score: stats.score,
                    level: stats.level,
                    max_streak: stats.max_streak,
                    games_played: stats.games_played,
                    last_played: new Date().toISOString()
                }, { onConflict: 'user_id, mode' });
            
            if (error) throw error;
        } catch (error) {
            console.error("Fel vid sparande:", error);
        }
    }
}

// Spara statistik offline
function saveOfflineStats() {
    let offlineUsers = JSON.parse(localStorage.getItem('klockspelet_offline_users') || '[]');
    const userIndex = offlineUsers.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        offlineUsers[userIndex].stats = userStats;
        localStorage.setItem('klockspelet_offline_users', JSON.stringify(offlineUsers));
    }
}

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
    badge.style.fontSize = "32px";
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
        
        // Spåra max streak för detta spel
        if (streak > maxStreakThisGame) {
            maxStreakThisGame = streak;
        }
        
        document.getElementById("meddelande").style.color = "#00695C";
        document.getElementById("meddelande").innerText = (currentMode === 'tid') ? "🌟 Rätt! +3 sek! 🌟" : "🌟 Helt rätt! 🌟";
        if (currentMode === 'tid') timeLeft += 3;
        
        if (streak >= 5 && level < 4) { 
            level++; 
            streak = 0; 
            document.getElementById("meddelande").innerText = "🎉 NIVÅ UPPHÖJD! 🎉";
            
            // Spåra max level för detta spel
            if (level > maxLevelThisGame) {
                maxLevelThisGame = level;
            }
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

// --- DRAG AND DROP (Mouse + Touch) ---
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
