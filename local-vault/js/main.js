import * as Vault from './core/vault.js';
import { renderLogin, renderDashboard, showToast } from './ui/views.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. APPLY SAVED THEME IMMEDIATELY
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');
    if (savedTheme === 'light') document.body.classList.add('light-mode');

    // 2. Load App
    const app = document.getElementById('app');
    
    if (Vault.hasVault()) {
        renderLogin(app, async (pass) => {
            try {
                await Vault.unlockVault(pass);
                renderDashboard(app);
            } catch (e) {
                showToast(e.message, 'error');
            }
        }, false);
    } else {
        renderLogin(app, async (pass) => {
            await Vault.createVault(pass);
            renderDashboard(app);
        }, true);
    }
});