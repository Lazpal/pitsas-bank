const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let splash = null;
let mainWindow = null;

function createSplashScreen() {
  splash = new BrowserWindow({
    width: 450,
    height: 350,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'app/img/favicon.png')
  });

  splash.loadFile('app/splash.html');

  splash.on('closed', () => {
    splash = null;
  });

  return splash;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,        // Ασφάλεια 
      contextIsolation: true,        // Ασφάλεια
      preload: path.join(__dirname, 'app/preload.js'), // Preload script για IPC
      webSecurity: true,             // Ενεργοποίηση web security για production
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, 'app/img/favicon.png'),
    title: 'Pitsas Camp Bank',
    show: false, // Θα εμφανιστεί όταν είναι έτοιμο
    focusable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    autoHideMenuBar: true,    // Απόκρυψη menu bar
    titleBarStyle: 'default'  // Standard title bar
  });

  // Loading progress tracking
  let loadingProgress = 0;
  
  mainWindow.webContents.on('did-start-loading', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Started loading main window...');
    }
    updateSplashProgress(20);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Finished loading main window...');
    }
    updateSplashProgress(80);
    
    // Περίμενε λίγο για να φορτώσουν τα styles/scripts
    setTimeout(() => {
      updateSplashProgress(100);
      
      // Κλείσε το splash screen μετά από 1.5 δευτερόλεπτα
      setTimeout(() => {
        if (splash) {
          splash.close();
        }
        
        // Εμφάνιση του κύριου παραθύρου
        mainWindow.maximize();
        mainWindow.show();
        mainWindow.focus();
      }, 1500);
    }, 300);
  });

  mainWindow.loadFile('app/index.html');
  
  // Focus management για modals και popups - DISABLED
  // These were too aggressive and causing dropdown interference
  /*
  mainWindow.on('focus', () => {
    // Εξασφάλιση ότι το κύριο παράθυρο παίρνει focus
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        // Έλεγχος αν υπάρχει ανοιχτό dropdown πριν παρέμβουμε
        mainWindow.webContents.executeJavaScript(`
          document.querySelector('.dropdown-menu.show') !== null
        `).then((hasOpenDropdown) => {
          if (!hasOpenDropdown) {
            mainWindow.webContents.focus();
          }
        }).catch(() => {
          mainWindow.webContents.focus();
        });
      }
    }, 50);
  });
  
  // Χειρισμός όταν το παράθυρο χάνει focus με dropdown protection
  mainWindow.on('blur', () => {
    // Επαναφορά focus μετά από λίγο (για modals) - πιο αγρεσσικό
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && !mainWindow.isMinimized()) {
        // Έλεγχος αν υπάρχει άλλο παράθυρο ανοιχτό και αν υπάρχει dropdown
        mainWindow.webContents.executeJavaScript(`
          document.querySelector('.dropdown-menu.show') !== null
        `).then((hasOpenDropdown) => {
          if (!hasOpenDropdown) {
            const allWindows = require('electron').BrowserWindow.getAllWindows();
            const focusedWindow = require('electron').BrowserWindow.getFocusedWindow();
            
            if (!focusedWindow || focusedWindow === mainWindow) {
              mainWindow.focus();
              mainWindow.webContents.focus();
            }
          }
        }).catch(() => {
          // Fallback - continue with focus restoration
          const allWindows = require('electron').BrowserWindow.getAllWindows();
          const focusedWindow = require('electron').BrowserWindow.getFocusedWindow();
          
          if (!focusedWindow || focusedWindow === mainWindow) {
            mainWindow.focus();
            mainWindow.webContents.focus();
          }
        });
      }
    }, 200);
  });
  */
  
  // Χειρισμός keyboard events για focus
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Εάν πατηθεί Escape, εξασφάλιση focus
    if (input.key === 'Escape') {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
          mainWindow.webContents.focus();
        }
      }, 50);
    }
  });
  
  // Αντιμετώπιση παραθύρων που κλέβουν focus με dropdown protection
  mainWindow.on('page-title-updated', (event) => {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        // Έλεγχος για dropdown πριν παρέμβουμε
        mainWindow.webContents.executeJavaScript(`
          document.querySelector('.dropdown-menu.show') !== null
        `).then((hasOpenDropdown) => {
          if (!hasOpenDropdown) {
            mainWindow.focus();
          }
        }).catch(() => {
          mainWindow.focus();
        });
      }
    }, 100);
  });
  
  // Hide menu bar in production
  Menu.setApplicationMenu(null);
  
  // Dev tools (για debugging)
  // mainWindow.webContents.openDevTools();
}

// Αυτόματο Backup Σύστημα
const autoBackupPath = path.join(app.getPath('userData'), 'pitsas_auto_backup.json');

// IPC Handlers για αυτόματο backup
ipcMain.handle('save-auto-backup', async (event, backupData) => {
  try {
    // Εξασφάλιση ότι υπάρχει ο φάκελος
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    // Αποθήκευση backup - ΣΙΩΠΗΛΑ
    fs.writeFileSync(autoBackupPath, backupData, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-auto-backup', async (event) => {
  try {
    if (fs.existsSync(autoBackupPath)) {
      const backupData = fs.readFileSync(autoBackupPath, 'utf8');
      return backupData;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
});

// Αυτόματο backup όταν κλείνει η εφαρμογή - ΣΙΩΠΗΛΑ
app.on('before-quit', () => {
  // Στείλε σήμα στο renderer process να κάνει backup
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app-closing');
  }
});

// Enhanced IPC Handlers για focus management
ipcMain.handle('focus-main-window', async () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Multi-step focus restoration
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      
      mainWindow.show();
      mainWindow.moveTop();
      mainWindow.focus();
      
      // Επιπλέον focus στο web content
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.focus();
          mainWindow.webContents.executeJavaScript('window.focus(); document.body.focus();').catch(err => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Focus script execution failed:', err.message);
            }
          });
        }
      }, 50);
      
      return { success: true };
    }
    return { success: false, error: 'Window not available' };
  } catch (error) {
    console.error('Focus main window error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-focus', async () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Aggressive focus restoration
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      mainWindow.webContents.focus();
      
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(false);
          mainWindow.webContents.executeJavaScript(`
            window.focus();
            document.body.focus();
            
            // Focus σε κάποιο input element
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.style.display !== 'none') {
              searchInput.focus();
            } else {
              const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
              for (let input of inputs) {
                if (input.offsetParent !== null && !input.disabled) {
                  input.focus();
                  break;
                }
              }
            }
          `).catch(err => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Restore focus script execution failed:', err.message);
            }
          });
        }
      }, 100);
      
      return { success: true };
    }
    return { success: false, error: 'Window not available' };
  } catch (error) {
    console.error('Restore focus error:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler για διάβασμα .md αρχείων
ipcMain.handle('read-documentation', async (event, filename) => {
  try {
    const filePath = path.join(__dirname, filename);
    
    // Έλεγχος ότι το αρχείο υπάρχει
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `Το αρχείο ${filename} δεν βρέθηκε` };
    }
    
    // Διάβασμα του αρχείου
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Successfully read documentation file: ${filename}`);
    }
    
    return { success: true, content };
  } catch (error) {
    console.error('Error reading documentation:', error);
    return { success: false, error: error.message };
  }
});

function updateSplashProgress(progress) {
  // Production mode - silent logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`Loading progress: ${progress}%`);
  }
}

app.whenReady().then(() => {
  // Δημιουργία splash screen πρώτα
  createSplashScreen();
  updateSplashProgress(10);
  
  // Περίμενε 1 δευτερόλεπτο και δημιούργησε το κύριο παράθυρο
  setTimeout(() => {
    updateSplashProgress(30);
    createWindow();
  }, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});