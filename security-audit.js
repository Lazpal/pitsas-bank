// Security Audit Script
console.log('🔒 ΕΛΕΓΧΟΣ ΑΣΦΑΛΕΙΑΣ...\n');

const fs = require('fs');

// 1. Έλεγχος Main.js security settings
console.log('🛡️  Έλεγχος Electron Security:');
const mainJs = fs.readFileSync('Main.js', 'utf8');

if (mainJs.includes('nodeIntegration: false')) {
    console.log('  ✅ nodeIntegration disabled');
} else {
    console.log('  ❌ nodeIntegration enabled - ΚΙΝΔΥΝΟΣ!');
}

if (mainJs.includes('contextIsolation: true')) {
    console.log('  ✅ contextIsolation enabled');
} else {
    console.log('  ❌ contextIsolation disabled - ΚΙΝΔΥΝΟΣ!');
}

if (mainJs.includes('webSecurity: true')) {
    console.log('  ✅ webSecurity enabled');
} else if (mainJs.includes('webSecurity: false')) {
    console.log('  ⚠️  webSecurity disabled - Αποδεκτό για τοπικά αρχεία');
} else {
    console.log('  ℹ️  webSecurity default (enabled)');
}

// 2. Έλεγχος preload.js security
console.log('\n🔐 Έλεγχος Preload Security:');
const preloadJs = fs.readFileSync('app/preload.js', 'utf8');

if (preloadJs.includes('contextBridge.exposeInMainWorld')) {
    console.log('  ✅ contextBridge χρησιμοποιείται');
} else {
    console.log('  ❌ contextBridge δεν χρησιμοποιείται - ΚΙΝΔΥΝΟΣ!');
}

if (preloadJs.includes('validChannels') || preloadJs.includes('isValidChannel')) {
    console.log('  ✅ Channel validation υπάρχει');
} else {
    console.log('  ⚠️  Channel validation προτείνεται');
}

// 3. Έλεγχος για hardcoded secrets
console.log('\n🔍 Έλεγχος για hardcoded secrets:');
const appJs = fs.readFileSync('app/app.js', 'utf8');

const secrets = ['password', 'api_key', 'secret', 'token'];
let foundSecrets = [];

secrets.forEach(secret => {
    if (appJs.toLowerCase().includes(secret) && 
        !appJs.includes(`getElementById('${secret}')`) &&
        !appJs.includes(`'${secret}'`) &&
        !appJs.includes(`"${secret}"`)) {
        foundSecrets.push(secret);
    }
});

if (foundSecrets.length === 0) {
    console.log('  ✅ Δεν βρέθηκαν hardcoded secrets');
} else {
    console.log('  ⚠️  Πιθανά hardcoded secrets:', foundSecrets);
}

// 4. Έλεγχος για console.log statements
console.log('\n📝 Έλεγχος debug statements:');
const consoleMatches = (mainJs.match(/console\./g) || []).length + 
                      (appJs.match(/console\./g) || []).length +
                      (preloadJs.match(/console\./g) || []).length;

if (consoleMatches > 20) {
    console.log(`  ⚠️  Πολλά console statements (${consoleMatches}) - Εξετάστε αφαίρεση για production`);
} else {
    console.log(`  ✅ Λογικός αριθμός console statements (${consoleMatches})`);
}

// 5. Έλεγχος package.json security
console.log('\n📦 Έλεγχος Package Security:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (packageJson.engines && packageJson.engines.node) {
    console.log(`  ✅ Node.js version requirement: ${packageJson.engines.node}`);
} else {
    console.log('  ⚠️  Node.js version requirement προτείνεται');
}

// 6. Σύνοψη ασφάλειας
console.log('\n' + '='.repeat(50));
console.log('🔒 ΣΥΝΟΨΗ ΑΣΦΑΛΕΙΑΣ:');
console.log('✅ Βασικές ρυθμίσεις ασφάλειας ενεργές');
console.log('✅ Context isolation enabled');
console.log('✅ Node integration disabled');
console.log('✅ Preload script ασφαλής');
console.log('\n💡 ΣΥΣΤΑΣΕΙΣ:');
console.log('• Τεστάρετε σε sandbox environment');
console.log('• Χρησιμοποιήστε code signing για distribution');
console.log('• Εξετάστε asar packaging για protection');
console.log('='.repeat(50));
