import { generatePassword } from '../crypto/generator.js';
import { saveEntry, deleteEntry } from '../core/vault.js';
import { showToast } from './views.js'; 

export function openEntryModal(entry = null, onRefresh) {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('hidden');
    
    const isEdit = !!entry;
    // Default category is 'Personal' if none exists
    const currentCat = entry ? (entry.category || 'Personal') : 'Personal';
    
    modal.innerHTML = `
        <div class="modal">
            <h3>${isEdit ? 'Edit Entry' : 'New Entry'}</h3>
            
            <select id="m-category">
                <option value="Personal" ${currentCat === 'Personal' ? 'selected' : ''}>Personal</option>
                <option value="Work" ${currentCat === 'Work' ? 'selected' : ''}>Work</option>
                <option value="Social" ${currentCat === 'Social' ? 'selected' : ''}>Social</option>
                <option value="Finance" ${currentCat === 'Finance' ? 'selected' : ''}>Finance</option>
                <option value="Utilities" ${currentCat === 'Utilities' ? 'selected' : ''}>Utilities</option>
                <option value="Other" ${currentCat === 'Other' ? 'selected' : ''}>Other</option>
            </select>

            <input type="text" id="m-service" placeholder="Service (e.g. Google)" value="${entry ? entry.service : ''}">
            <input type="text" id="m-user" placeholder="Username/Email" value="${entry ? entry.username : ''}">
            
            <div class="password-group">
                <input type="text" id="m-pass" placeholder="Password" value="${entry ? entry.password : ''}">
                <button id="gen-toggle-btn" class="secondary">⚙️ Gen</button>
            </div>
            <div id="strength-meter" class="strength-bar"></div>

            <div id="gen-settings" class="gen-panel hidden">
                <div class="gen-opts">
                    <label><input type="checkbox" id="g-upper" checked> A-Z</label>
                    <label><input type="checkbox" id="g-num" checked> 0-9</label>
                    <label><input type="checkbox" id="g-sym" checked> #$%</label>
                    <label>Len: <input type="number" id="g-len" value="16" min="8" max="64"></label>
                </div>
                <button id="gen-btn" class="small-btn">Generate</button>
            </div>

            <textarea id="m-notes" placeholder="Notes...">${entry ? entry.notes : ''}</textarea>
            
            <div class="modal-actions">
                ${isEdit ? '<button id="del-btn" class="danger">Delete</button>' : ''}
                <button id="save-btn" class="primary">Save</button>
                <button id="close-btn">Cancel</button>
            </div>
        </div>
    `;

    // --- Logic ---
    const passInput = document.getElementById('m-pass');
    const meter = document.getElementById('strength-meter');

    const checkStrength = (val) => {
        if(!val) { meter.className = 'strength-bar'; return; }
        let score = 0;
        if(val.length > 8) score++;
        if(val.length > 12) score++;
        if(/[A-Z]/.test(val)) score++;
        if(/[0-9]/.test(val)) score++;
        if(/[^A-Za-z0-9]/.test(val)) score++;
        meter.className = 'strength-bar'; 
        if(score < 3) meter.classList.add('strength-weak');
        else if(score < 5) meter.classList.add('strength-medium');
        else meter.classList.add('strength-strong');
    };
    if(passInput.value) checkStrength(passInput.value);
    passInput.oninput = (e) => checkStrength(e.target.value);

    document.getElementById('close-btn').onclick = () => modal.classList.add('hidden');
    
    document.getElementById('save-btn').onclick = async () => {
        const newEntry = {
            id: entry ? entry.id : null,
            category: document.getElementById('m-category').value, // SAVE CATEGORY
            service: document.getElementById('m-service').value,
            username: document.getElementById('m-user').value,
            password: document.getElementById('m-pass').value,
            notes: document.getElementById('m-notes').value
        };
        if(!newEntry.service || !newEntry.password) return showToast('Service and Password required', 'error');
        
        await saveEntry(newEntry);
        modal.classList.add('hidden');
        if(onRefresh) onRefresh();
        showToast('Saved!');
    };

    if(isEdit) {
        document.getElementById('del-btn').onclick = async () => {
            if(confirm('Delete this entry?')) {
                await deleteEntry(entry.id);
                modal.classList.add('hidden');
                if(onRefresh) onRefresh();
                showToast('Deleted');
            }
        };
    }

    const genPanel = document.getElementById('gen-settings');
    document.getElementById('gen-toggle-btn').onclick = () => genPanel.classList.toggle('hidden');
    
    document.getElementById('gen-btn').onclick = () => {
        const len = parseInt(document.getElementById('g-len').value);
        const p = generatePassword(
            len,
            document.getElementById('g-upper').checked,
            document.getElementById('g-num').checked,
            document.getElementById('g-sym').checked
        );
        document.getElementById('m-pass').value = p;
        checkStrength(p);
    };
}