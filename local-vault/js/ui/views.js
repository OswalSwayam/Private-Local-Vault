import * as Vault from '../core/vault.js';
import { openEntryModal } from './modal.js';

export function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

export function renderLogin(root, onSubmit, isRegister) {
    root.innerHTML = `
        <div class="auth-box">
            <h2>${isRegister ? 'Setup New Vault' : 'Unlock Vault'}</h2>
            <p>${isRegister ? 'Create a strong master password.' : 'Local-only. No server backup.'}</p>
            <input type="password" id="m-pass" placeholder="Master Password" autocomplete="off" autofocus>
            <button id="go-btn" class="primary">${isRegister ? 'Create' : 'Unlock'}</button>
            ${isRegister ? '<div class="import-link"><small>Or <a href="#" id="import-trigger">Import Backup</a></small></div>' : ''}
            <input type="file" id="file-input" class="hidden" accept=".json">
        </div>
    `;

    setTimeout(() => { if(document.getElementById('m-pass')) document.getElementById('m-pass').focus() }, 50);

    const act = () => {
        const val = document.getElementById('m-pass').value;
        if(val) onSubmit(val);
    };
    
    const btn = document.getElementById('go-btn');
    const input = document.getElementById('m-pass');
    
    if(btn) btn.onclick = act;
    if(input) input.onkeypress = (e) => e.key === 'Enter' && act();

    if (isRegister) {
        const fileIn = document.getElementById('file-input');
        const importBtn = document.getElementById('import-trigger');
        if(importBtn) {
            importBtn.onclick = (e) => {
                e.preventDefault();
                fileIn.click();
            };
        }
        if(fileIn) {
            fileIn.onchange = (e) => {
                const file = e.target.files[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const pass = prompt("Enter password for this backup:");
                    if(pass) Vault.importVault(evt.target.result, pass).catch(err => showToast(err.message, 'error'));
                };
                reader.readAsText(file);
            };
        }
    }
}

export function renderDashboard(root) {
    const entries = Vault.getEntries();
    const refresh = () => renderDashboard(root);

    root.innerHTML = `
        <header>
            <div class="brand">LocalVault🔒</div>
            <div class="controls">
                <button id="theme-btn" title="Toggle Theme">🌓</button>
                
                <button id="change-pass-btn" title="Change Master Password">🔑</button>
                <button id="add-btn" class="primary">+ New</button>
                <button id="export-btn">Export</button>
                <button id="lock-btn" class="danger">Lock</button>
            </div>
        </header>
        
        <div class="search-wrap">
            <select id="cat-filter">
                <option value="All">All Categories</option>
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Social">Social</option>
                <option value="Finance">Finance</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
            </select>
            <input type="text" id="search" placeholder="Search entries...">
        </div>
        
        <div id="list" class="entry-list"></div>
    `;

    // --- NEW: Theme Toggle Logic ---
    document.getElementById('theme-btn').onclick = () => {
        // Check if currently dark (either by class OR by system default)
        const isDark = document.body.classList.contains('dark-mode') || 
                       (!document.body.classList.contains('light-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            // Switch to Light
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            // Switch to Dark
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        }
    };

    // ... (The rest of your existing logic for Lists, Search, Export, etc. stays here) ...
    
    // START COPYING THE REST OF YOUR OLD CODE HERE (Draw function, event listeners, etc.)
    const list = document.getElementById('list');
    const searchInput = document.getElementById('search');
    const catSelect = document.getElementById('cat-filter');

    const draw = () => {
        const term = searchInput.value.toLowerCase();
        const cat = catSelect.value;
        const filtered = entries.filter(item => {
            const matchesSearch = item.service.toLowerCase().includes(term) || item.username.toLowerCase().includes(term);
            const matchesCat = cat === 'All' || (item.category || 'Personal') === cat;
            return matchesSearch && matchesCat;
        });

        list.innerHTML = '';
        if(filtered.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">No entries found.</div>';
            return;
        }

        filtered.forEach(e => {
            const row = document.createElement('div');
            row.className = 'entry-row';
            
            const initial = e.service ? e.service.charAt(0).toUpperCase() : '?';
            const dateStr = new Date(e.updatedAt || Date.now()).toLocaleDateString();

            row.innerHTML = `
                <div class="entry-icon">${initial}</div>
                
                <div class="e-details">
                    <strong>${e.service}</strong>
                    <div style="font-size:0.8em; color:#666;">
                        <span style="background:#eee; padding:2px 6px; border-radius:4px; margin-right:5px;">${e.category || 'Personal'}</span>
                        ${e.username} • <span style="font-style:italic;">${dateStr}</span>
                    </div>
                </div>
                
                <div class="actions-group">
                    <button class="copy-btn">Copy</button>
                    <button class="del-btn-small" title="Delete Entry">🗑️</button>
                </div>
            `;

            // 1. Copy Button Logic
            row.querySelector('.copy-btn').onclick = (ev) => {
                ev.stopPropagation(); // Stop row click (edit)
                navigator.clipboard.writeText(e.password);
                showToast('Copied! (Clears in 30s)');
                setTimeout(() => navigator.clipboard.writeText(' '), 30000);
            };

            // 2. NEW: Delete Button Logic
            row.querySelector('.del-btn-small').onclick = async (ev) => {
                ev.stopPropagation(); // Stop row click (edit)
                
                if(confirm(`Are you sure you want to delete ${e.service}?`)) {
                    await Vault.deleteEntry(e.id); // Delete from core
                    refresh(); // Reload the list immediately
                    showToast('Entry deleted', 'error'); // Show red toast
                }
            };

            // 3. Row Click (Edit) Logic
            row.onclick = () => openEntryModal(e, refresh);
            
            list.appendChild(row);
        });
    };
    
    draw();
    searchInput.oninput = draw;
    catSelect.onchange = draw;

    document.getElementById('add-btn').onclick = () => openEntryModal(null, refresh);
    document.getElementById('lock-btn').onclick = () => Vault.lockVault();
    
    document.getElementById('change-pass-btn').onclick = async () => {
        const newPass = prompt("Enter your NEW Master Password:");
        if(newPass && newPass.length > 0) {
            if(confirm("Are you sure you want to change your Master Password?")) {
                try {
                    await Vault.rotateMasterPassword(newPass);
                    showToast("Master Password Changed!", "info");
                } catch(e) {
                    showToast("Error changing password", "error");
                }
            }
        }
    };

    document.getElementById('export-btn').onclick = () => {
        const data = Vault.getExportData();
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vault-backup-${Date.now()}.json`;
        a.click();
    };
}

// Add this helper function at the top of views.js
function convertToCSV(entries) {
    const headers = ["Service", "Username", "Password", "Notes", "Category"];
    const rows = entries.map(e => 
        `"${e.service}","${e.username}","${e.password}","${e.notes || ''}","${e.category || ''}"`
    );
    return [headers.join(','), ...rows].join('\n');
}


