# Private Local Vault
A secure, privacy-first vault that stores encrypted data **locally inside the browser**, without any backend, database, or external service. Your information never leaves your device. Designed for users who want complete control over their sensitive notes, credentials, and personal data while still enjoying a clean, fast, and modern interface.

## 🚀 Features
### 🔒 1. Fully Local Encryption.
### 🗄️ 2. Zero Backend & Zero Database.
### 💾 3. Optimised Large Storage Capacity.
### 📥 4. Easy Import & Export(.json).
### 🖥️ 5. Clean & Minimal Interface.

## 🎯 How It Works
1. User sets a **master password**.
2. Password derives an encryption key.
3. Vault content is encrypted with AES inside the browser.
4. Encrypted blob is saved in the browser’s `localStorage`.
5. Decryption happens only on the client side after password entry.
6. The imported file(.json) can be only be ritrive on 'Incognito mode' or new PC envrionment. 

## 📦 Tech Stack
1.HTML, 2.CSS, 3.JavaScript (Modular), 4.AES Encryption (Browser-based crypto library)

## 🧪 Security Notes

- The project uses AES-based browser encryption.
- Your master password **cannot** be recovered if forgotten.
- LocalStorage is used only for **encrypted blobs**, never plaintext.
- Recommended: manually backup your encrypted file occasionally.

## 🤝 Contributions
Pull requests and feature suggestions are welcome. If you find issues or want to optimize storage/encryption, feel free to contribute.
