export function generatePassword(length, useUpper, useNumbers, useSymbols) {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    let charset = lower;
    if (useUpper) charset += upper;
    if (useNumbers) charset += numbers;
    if (useSymbols) charset += symbols;

    let password = "";
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);

    for (let i = 0; i < length; i++) {
        password += charset[values[i] % charset.length];
    }
    return password;
}