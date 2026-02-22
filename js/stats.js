// ========================================
// KLOCKSPLET - Statistik
// ========================================

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
    
    let totalScore = 0;
    
    modes.forEach(mode => {
        const stats = userStats[mode];
        const element = document.getElementById(modeNames[mode]);
        if (stats) {
            element.textContent = `Poäng: ${stats.score || 0} | Högsta streak: ${stats.max_streak || 0}`;
            totalScore += stats.score || 0;
        } else {
            element.textContent = 'Poäng: 0 | Högsta streak: 0';
        }
    });
    
    // Uppdatera totalpoäng
    const totalElement = document.getElementById('stats-total');
    if (totalElement) {
        totalElement.textContent = `Poäng totalt: ${totalScore}`;
    }
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
