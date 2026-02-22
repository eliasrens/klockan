// ========================================
// KLOCKSPLET - Uppgifter och svar
// ========================================

// Konvertera tid till svensk text
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

// Generera ny uppgift
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

// Generera problemuppgift
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

// Kontrollera svar
function checkAnswer() {
    let cH = gameHours % 12 || 12;
    let tH = targetHours % 12 || 12;
    if (cH === tH && gameMinutes === targetMinutes) {
        // Poängsystem per läge
        let pointsEarned = 0;
        if (currentMode === 'problem') {
            // Problemlösning: 2 poäng på nivå 1, +1 poäng extra per nivå
            pointsEarned = level + 1;
        } else if (currentMode === 'tid') {
            // Tidsutmaning: 2 poäng på nivå 1, +2 poäng extra per nivå (upp till nivå 20)
            pointsEarned = level * 2;
        } else {
            // Enkel klockträning: 1 poäng på nivå 1, +1 poäng extra per nivå
            pointsEarned = level;
        }
        score += pointsEarned;
        streak++;
        
        // Spåra max streak för detta spel
        if (streak > maxStreakThisGame) {
            maxStreakThisGame = streak;
        }
        
        document.getElementById("meddelande").style.color = "#00695C";
        if (currentMode === 'problem') {
            document.getElementById("meddelande").innerText = `🌟 Rätt! +${pointsEarned} poäng! 🌟`;
        } else if (currentMode === 'tid') {
            document.getElementById("meddelande").innerText = `🌟 Rätt! +${pointsEarned} poäng! +3 sek! 🌟`;
            timeLeft += 3;
        } else {
            document.getElementById("meddelande").innerText = `🌟 Rätt! +${pointsEarned} poäng! 🌟`;
        }
        
        // Level-up villkor per läge
        let maxLevel = (currentMode === 'tid') ? 20 : 4;
        if (streak >= 5 && level < maxLevel) { 
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
