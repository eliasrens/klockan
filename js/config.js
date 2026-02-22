// ========================================
// KLOCKSPLET - Konfiguration
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
