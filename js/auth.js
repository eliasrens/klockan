// ========================================
// KLOCKSPLET - Autentisering
// ========================================

// --- INLOGGNING ---
async function login() {
    const classSelect = document.getElementById('class-select');
    const nameInput = document.getElementById('name-input');
    const errorMessage = document.getElementById('login-error');
    const loadingMessage = document.getElementById('login-loading');
    
    const userClass = classSelect.value;
    const userName = nameInput.value.trim();
    
    // Validering
    if (!userClass && userName === 'teacher123') {
        // Admin-inloggning
        errorMessage.textContent = "";
        loadingMessage.textContent = "Loggar in som admin...";
        await adminLogin();
        return;
    }

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
    document.getElementById('login-loading').textContent = '';
    document.getElementById('login-error').textContent = '';
}

// Visa huvudmeny
function showMainMenu() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    
    document.getElementById('user-display').textContent = `👤 ${currentUser.name} (${currentUser.class})`;
    
    updateStatsSummary();
}
