// Preload script για ασφαλή επικοινωνία μεταξύ main process και renderer
const { contextBridge, ipcRenderer } = require('electron');

// Security: Define allowed channels
const validChannels = [
  'save-auto-backup',
  'load-auto-backup', 
  'focus-main-window',
  'restore-focus',
  'app-ready',
  'app-closing',
  'read-documentation'
];

// Validate channel
function isValidChannel(channel) {
  return validChannels.includes(channel);
}

// Εκθέστε ασφαλείς APIs στο renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // System info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // Enhanced Backup APIs με error handling
  saveAutoBackup: async (backupData) => {
    try {
      if (!backupData) throw new Error('No backup data provided');
      return await ipcRenderer.invoke('save-auto-backup', backupData);
    } catch (error) {
      console.error('Save auto backup error:', error);
      return { success: false, error: error.message };
    }
  },
  
  loadAutoBackup: async () => {
    try {
      return await ipcRenderer.invoke('load-auto-backup');
    } catch (error) {
      console.error('Load auto backup error:', error);
      return null;
    }
  },
  
  // Enhanced Focus Management APIs με error handling
  focusMainWindow: async () => {
    try {
      return await ipcRenderer.invoke('focus-main-window');
    } catch (error) {
      console.error('Focus main window error:', error);
      return { success: false, error: error.message };
    }
  },
  
  restoreFocus: async () => {
    try {
      return await ipcRenderer.invoke('restore-focus');
    } catch (error) {
      console.error('Restore focus error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Documentation APIs
  readDocumentation: async (filename) => {
    try {
      if (!filename) throw new Error('No filename provided');
      return await ipcRenderer.invoke('read-documentation', filename);
    } catch (error) {
      console.error('Read documentation error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Safe Event listeners
  onAppReady: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('app-ready', callback);
    }
  },
  
  onAppClosing: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('app-closing', callback);
    }
  },
  
  removeAllListeners: (channel) => {
    if (isValidChannel(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});

// Development mode detection
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || 
             /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || 
             /[\\/]electron[\\/]/.test(process.execPath);

if (isDev) {
  console.log('Preload script loaded successfully in development mode');
} else {
  console.log('Preload script loaded successfully in production mode');
}
