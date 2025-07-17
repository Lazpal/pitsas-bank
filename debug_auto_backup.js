// Debug script για αυτόματο backup
console.log('🔍 Δοκιμή σιωπηλού αυτόματου backup συστήματος...');

// Δοκιμή δημιουργίας backup
if (typeof createAutoBackup === 'function') {
    console.log('✅ Συνάρτηση createAutoBackup βρέθηκε');
    createAutoBackup();
    console.log('📁 Backup δημιουργήθηκε σιωπηλά');
} else {
    console.log('❌ Συνάρτηση createAutoBackup δεν βρέθηκε');
}

// Έλεγχος διαθέσιμων APIs
console.log('📱 Electron API διαθέσιμο:', !!window.electronAPI);
if (window.electronAPI) {
    console.log('  - saveAutoBackup:', typeof window.electronAPI.saveAutoBackup);
    console.log('  - loadAutoBackup:', typeof window.electronAPI.loadAutoBackup);
    console.log('  - onAppClosing:', typeof window.electronAPI.onAppClosing);
}

// Έλεγχος localStorage fallback
console.log('💾 localStorage backup δεδομένα:');
console.log('  - pitsasAutoBackup:', localStorage.getItem('pitsasAutoBackup') ? 'EXISTS' : 'NOT FOUND');
console.log('  - pitsasAutoBackupDate:', localStorage.getItem('pitsasAutoBackupDate') || 'NOT FOUND');

// Έλεγχος διαθέσιμου backup σε memory
console.log('🧠 Available backup in memory:', !!window.availableAutoBackup);

// Εμφάνιση στατιστικών δεδομένων
const children = JSON.parse(localStorage.getItem('pitsasChildren') || '[]');
const transactions = JSON.parse(localStorage.getItem('pitsasTransactions') || '[]');
console.log(`📊 Δεδομένα προς backup: ${children.length} παιδιά, ${transactions.length} συναλλαγές`);

// Δοκιμή emergency backup function
console.log('🆘 Emergency backup function διαθέσιμη:', typeof window.showEmergencyBackup);
console.log('💡 Για να δείτε emergency backup info: Ctrl+Shift+R ή window.showEmergencyBackup()');

// Προσομοίωση χρήστη που έχασε δεδομένα
setTimeout(() => {
    console.log('🔔 Προσομοίωση: Χρήστης νομίζει ότι έχασε δεδομένα...');
    console.log('🔑 Πατήστε Ctrl+Shift+R ή τρέξτε: window.showEmergencyBackup()');
}, 2000);
