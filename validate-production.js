// Pre-Release Validation Script
// Έλεγχος για production readiness

console.log('🔍 ΕΛΕΓΧΟΣ PRODUCTION READINESS...\n');

// 1. Έλεγχος απαραίτητων αρχείων
const requiredFiles = [
    'Main.js',
    'package.json',
    'app/index.html',
    'app/styles.css',
    'app/app.js',
    'app/preload.js',
    'app/splash.html',
    'app/img/logo.png',
    'app/img/favicon.png'
];

console.log('📁 Έλεγχος απαραίτητων αρχείων:');
const fs = require('fs');
const path = require('path');

let missingFiles = [];
requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - ΛΕΙΠΕΙ!`);
        missingFiles.push(file);
    }
});

// 2. Έλεγχος package.json
console.log('\n📦 Έλεγχος package.json:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log(`  ✅ Name: ${packageJson.name}`);
console.log(`  ✅ Version: ${packageJson.version}`);
console.log(`  ✅ Main: ${packageJson.main}`);
console.log(`  ✅ Author: ${packageJson.author.name}`);

// 3. Έλεγχος build configuration
console.log('\n🔧 Έλεγχος build configuration:');
if (packageJson.build) {
    console.log('  ✅ Build configuration υπάρχει');
    console.log(`  ✅ App ID: ${packageJson.build.appId}`);
    console.log(`  ✅ Product Name: ${packageJson.build.productName}`);
} else {
    console.log('  ❌ Build configuration λείπει!');
}

// 4. Έλεγχος dependencies
console.log('\n📚 Έλεγχος dependencies:');
if (packageJson.devDependencies.electron) {
    console.log(`  ✅ Electron: ${packageJson.devDependencies.electron}`);
} else {
    console.log('  ❌ Electron dependency λείπει!');
}

if (packageJson.devDependencies['electron-builder']) {
    console.log(`  ✅ Electron Builder: ${packageJson.devDependencies['electron-builder']}`);
} else {
    console.log('  ❌ Electron Builder dependency λείπει!');
}

// 5. Έλεγχος node_modules
console.log('\n📂 Έλεγχος node_modules:');
if (fs.existsSync('node_modules')) {
    console.log('  ✅ node_modules υπάρχει');
} else {
    console.log('  ❌ node_modules λείπει - τρέξε npm install!');
}

// 6. Σύνοψη
console.log('\n' + '='.repeat(50));
if (missingFiles.length === 0) {
    console.log('🎉 ΕΠΙΤΥΧΗΣ ΕΛΕΓΧΟΣ!');
    console.log('✅ Η εφαρμογή είναι έτοιμη για production!');
    console.log('\n🚀 Για build:');
    console.log('   npm run build');
    console.log('\n📦 Για testing:');
    console.log('   npm start');
} else {
    console.log('❌ ΠΡΟΒΛΗΜΑΤΑ ΒΡΕΘΗΚΑΝ!');
    console.log('Λείπουν αρχεία:');
    missingFiles.forEach(file => console.log(`  - ${file}`));
}
console.log('='.repeat(50));
