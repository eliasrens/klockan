// ========================================
// KLOCKSPLET - Admin Dashboard
// ========================================

// Admin globala variabler
let allAdminData = []; // Raw joined data from Supabase
let filteredAdminData = [];
let adminSortKey = 'name';
let adminSortAsc = true;

async function adminLogin() {
    const loadingMessage = document.getElementById('login-loading');
    const errorMessage = document.getElementById('login-error');

    if (SUPABASE_URL === 'DIN_SUPABASE_URL') {
        errorMessage.textContent = 'Admin kräver Supabase-anslutning.';
        loadingMessage.textContent = '';
        return;
    }

    try {
        if (!supabaseClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        // Fetch all profiles
        const { data: profiles, error: pErr } = await supabaseClient
            .from('profiles')
            .select('*');
        if (pErr) throw pErr;

        // Fetch all stats
        const { data: stats, error: sErr } = await supabaseClient
            .from('player_stats')
            .select('*');
        if (sErr) throw sErr;

        // Join profiles with stats
        allAdminData = [];
        stats.forEach(stat => {
            const profile = profiles.find(p => p.id === stat.user_id);
            if (profile) {
                allAdminData.push({
                    name: profile.name,
                    class: profile.class,
                    mode: stat.mode,
                    score: stat.score || 0,
                    level: stat.level || 1,
                    max_streak: stat.max_streak || 0,
                    games_played: stat.games_played || 0,
                    last_played: stat.last_played || null
                });
            }
        });
        
        // Beräkna totalpoäng för varje elev
        calculateTotalScores();

        loadingMessage.textContent = '';
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        filterAdminStats();
    } catch (error) {
        console.error('Admin login error:', error);
        errorMessage.textContent = 'Kunde inte hämta data från servern.';
        loadingMessage.textContent = '';
    }
}

function filterAdminStats() {
    const classFilter = document.getElementById('admin-class-filter').value;
    const modeFilter = document.getElementById('admin-mode-filter').value;

    filteredAdminData = allAdminData.filter(row => {
        if (classFilter && row.class !== classFilter) return false;
        if (modeFilter && row.mode !== modeFilter) return false;
        return true;
    });
    
    // Beräkna om totalpoäng efter filtrering
    calculateTotalScores();

    sortAdminData();
    renderAdminTable();
    renderAdminSummary();
}

// Beräkna totalpoäng för varje elev
function calculateTotalScores() {
    // Gruppera data efter elev (namn + klass)
    const studentScores = {};
    
    allAdminData.forEach(row => {
        const key = row.name + '|' + row.class;
        if (!studentScores[key]) {
            studentScores[key] = {
                name: row.name,
                class: row.class,
                totalScore: 0
            };
        }
        studentScores[key].totalScore += row.score;
    });
    
    // Lägg till totalpoäng i varje rad
    allAdminData.forEach(row => {
        const key = row.name + '|' + row.class;
        row.totalScore = studentScores[key].totalScore;
    });
}

function sortAdminTable(key) {
    if (adminSortKey === key) {
        adminSortAsc = !adminSortAsc;
    } else {
        adminSortKey = key;
        adminSortAsc = true;
    }
    sortAdminData();
    renderAdminTable();
}

function sortAdminData() {
    filteredAdminData.sort((a, b) => {
        let valA = a[adminSortKey];
        let valB = b[adminSortKey];

        if (valA == null) valA = '';
        if (valB == null) valB = '';

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return adminSortAsc ? -1 : 1;
        if (valA > valB) return adminSortAsc ? 1 : -1;
        return 0;
    });
    
    // Sortera efter totalpoäng kräver att vi först beräknar om den
    if (adminSortKey === 'totalScore') {
        // Gruppera och sortera
        const studentTotals = {};
        filteredAdminData.forEach(row => {
            const key = row.name + '|' + row.class;
            if (!studentTotals[key]) {
                studentTotals[key] = row.totalScore;
            }
        });
        
        filteredAdminData.sort((a, b) => {
            const keyA = a.name + '|' + a.class;
            const keyB = b.name + '|' + b.class;
            const scoreA = studentTotals[keyA] || 0;
            const scoreB = studentTotals[keyB] || 0;
            return adminSortAsc ? scoreA - scoreB : scoreB - scoreA;
        });
    }
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-stats-body');
    const modeLabels = { enkel: '🧠 Enkel', tid: '⏱️ Tid', problem: '🕵️ Problem' };

    if (filteredAdminData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#999;">Ingen data hittades</td></tr>';
        return;
    }

    tbody.innerHTML = filteredAdminData.map(row => {
        const lastPlayed = row.last_played
            ? new Date(row.last_played).toLocaleDateString('sv-SE')
            : '—';
        return `<tr>
            <td><strong>${escapeHtml(row.name)}</strong></td>
            <td>${escapeHtml(row.class)}</td>
            <td><span class="mode-badge ${row.mode}">${modeLabels[row.mode] || row.mode}</span></td>
            <td>${row.score}</td>
            <td><strong>${row.totalScore || 0}</strong></td>
            <td>${row.level}</td>
            <td>${row.max_streak}</td>
            <td>${row.games_played}</td>
            <td>${lastPlayed}</td>
        </tr>`;
    }).join('');
}

function renderAdminSummary() {
    const uniqueStudents = new Set(filteredAdminData.map(r => r.name + '|' + r.class));
    document.getElementById('admin-total-students').textContent = uniqueStudents.size;

    const totalGames = filteredAdminData.reduce((sum, r) => sum + r.games_played, 0);
    document.getElementById('admin-total-games').textContent = totalGames;

    // Beräkna högsta totalpoäng bland alla elever
    const studentScores = {};
    filteredAdminData.forEach(row => {
        const key = row.name + '|' + row.class;
        if (!studentScores[key]) {
            studentScores[key] = 0;
        }
        studentScores[key] += row.score;
    });
    
    const topTotalScore = Object.values(studentScores).reduce((max, score) => Math.max(max, score), 0);
    document.getElementById('admin-top-score').textContent = topTotalScore;
}

function adminLogout() {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('name-input').value = '';
    document.getElementById('class-select').value = '';
    allAdminData = [];
    filteredAdminData = [];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
