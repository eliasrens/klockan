// ========================================
// KLOCKSPLET - Initialisering
// ========================================

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
