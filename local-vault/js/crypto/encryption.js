const ALGORITHM = { name: 'AES-GCM', length: 256 };
const KDF_NAME = 'PBKDF2';
const HASH = 'SHA-256';
const ITERATIONS = 500000; // High cost for security

const enc = new TextEncoder();
const dec = new TextDecoder();

// Generate a random salt
export function generateSalt() {
    return window.crypto.getRandomValues(new Uint8Array(16));
}

// Derive Key from Password + Salt
async function deriveKey(password, salt) {
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw', enc.encode(password), { name: KDF_NAME }, false, ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        { name: KDF_NAME, salt: salt, iterations: ITERATIONS, hash: HASH },
        keyMaterial, ALGORITHM, false, ['encrypt', 'decrypt']
    );
}

// Encrypt Object
export async function encryptVault(dataObj, password, existingSalt = null) {
    const salt = existingSalt || generateSalt();
    const key = await deriveKey(password, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Unique IV every time
    const encodedData = enc.encode(JSON.stringify(dataObj));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: ALGORITHM.name, iv: iv }, key, encodedData
    );

    return {
        salt: Array.from(salt),
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encryptedBuffer))
    };
}

// Decrypt Object
export async function decryptVault(storageObj, password) {
    try {
        const salt = new Uint8Array(storageObj.salt);
        const iv = new Uint8Array(storageObj.iv);
        const data = new Uint8Array(storageObj.data);
        const key = await deriveKey(password, salt);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: ALGORITHM.name, iv: iv }, key, data
        );
        return JSON.parse(dec.decode(decryptedBuffer));
    } catch (e) {
        throw new Error('Decryption failed: Wrong password or corrupted data.');
    }
}