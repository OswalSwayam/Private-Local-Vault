const fs = require('fs');
const path = require('path');

const DIST = './dist';

// Basic regex minifier (Removes comments and whitespace)
const minify = (code) => code
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // remove comments
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\s*([:;{}()=,])\s*/g, '$1') // clean around symbols
    .trim();

function copy(src, dest, isJs = false) {
    if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(f => copy(path.join(src, f), path.join(dest, f), isJs));
    } else {
        let content = fs.readFileSync(src, 'utf8');
        if (isJs && src.endsWith('.js')) content = minify(content);
        if (src.endsWith('.css')) content = content.replace(/\s+/g, ' ').replace(/\s*([:;{}])\s*/g, '$1');
        fs.writeFileSync(dest, content);
    }
}

console.log("Building production to /dist ...");
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);

copy('./index.html', path.join(DIST, 'index.html'));
copy('./css', path.join(DIST, 'css'));
copy('./js', path.join(DIST, 'js'), true);

console.log("Done. Serve /dist to test.");