import * as Crypto from '../crypto/encryption.js';

const STORAGE_KEY = 'local_vault_blob';
const INACTIVITY_MS = 300000; // 5 minutes

let state = {
    isUnlocked: false,
    masterPassword: null,
    entries: [],
    timer: null
};

// --- Persistence ---
function save(encryptedData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedData));
}

function load() {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : null;
}

// --- Core Actions ---
export function hasVault() { return !!load(); }

export async function createVault(password) {
    state.entries = [];
    state.masterPassword = password;
    state.isUnlocked = true;
    await sync();
    startAutoLock();
}

export async function unlockVault(password) {
    const blob = load();
    if (!blob) throw new Error("Vault not found.");
    
    const data = await Crypto.decryptVault(blob, password);
    state.entries = data.entries || [];
    state.masterPassword = password;
    state.isUnlocked = true;
    startAutoLock();
    return state.entries;
}

// NEW: Function to change Master Password
export async function rotateMasterPassword(newPassword) {
    if (!state.isUnlocked) throw new Error("Vault is locked!");
    state.masterPassword = newPassword;
    await sync(); // Re-encrypts everything with the new password
}

export function lockVault() {
    state = { isUnlocked: false, masterPassword: null, entries: [], timer: null };
    window.location.reload(); // Clear memory
}

// --- CRUD ---
export async function saveEntry(entry) {
    if (!state.isUnlocked) throw new Error("Locked");
    
    const idx = state.entries.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
        state.entries[idx] = { ...entry, updatedAt: Date.now() };
    } else {
        entry.id = crypto.randomUUID();
        entry.updatedAt = Date.now();
        state.entries.push(entry);
    }
    await sync();
}

export async function deleteEntry(id) {
    if (!state.isUnlocked) throw new Error("Locked");
    state.entries = state.entries.filter(e => e.id !== id);
    await sync();
}

async function sync() {
    // Generate a new Salt every time we save/sync for maximum security
    const encrypted = await Crypto.encryptVault({ entries: state.entries }, state.masterPassword);
    save(encrypted);
    resetTimer();
}

// --- Security ---
export function getEntries() { return state.isUnlocked ? [...state.entries] : []; }

function startAutoLock() {
    ['mousemove', 'keydown'].forEach(ev => document.addEventListener(ev, resetTimer));
    resetTimer();
}

function resetTimer() {
    if (state.timer) clearTimeout(state.timer);
    if (state.isUnlocked) state.timer = setTimeout(lockVault, INACTIVITY_MS);
}

// --- Import/Export ---
export function getExportData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if(!data) throw new Error("Empty vault");
    return data;
}

export async function importVault(jsonString, password) {
    const blob = JSON.parse(jsonString);
    await Crypto.decryptVault(blob, password);
    localStorage.setItem(STORAGE_KEY, jsonString);
    window.location.reload();
}