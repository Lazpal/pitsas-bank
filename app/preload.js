// Preload script για ασφαλή επικοινωνία μεταξύ main process και renderer
const { contextBridge, ipcRenderer } = require('electron');

// Εκθέστε ασφαλείς APIs στο renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Εδώ μπορούμε να προσθέσουμε APIs που χρειάζεται η εφαρμογή
  platform: process.platform,
  versions: process.versions,
  
  // Παράδειγμα API για μελλοντική χρήση
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  
  // Event listeners
  onAppReady: (callback) => ipcRenderer.on('app-ready', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

console.log('Preload script loaded successfully');
