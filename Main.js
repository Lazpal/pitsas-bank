const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

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
      nodeIntegration: true,         // Επαναφορά για λειτουργικότητα
      contextIsolation: false,       // Επαναφορά για localStorage
      webSecurity: false            // Για τοπικά αρχεία
    },
    icon: path.join(__dirname, 'app/img/favicon.png'),
    title: 'Pitsas Camp Bank',
    show: false // Θα εμφανιστεί όταν είναι έτοιμο
  });

  // Loading progress tracking
  let loadingProgress = 0;
  
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Started loading main window...');
    updateSplashProgress(20);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Finished loading main window...');
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
  
  // Hide menu bar in production
  Menu.setApplicationMenu(null);
  
  // Dev tools (για debugging)
  // mainWindow.webContents.openDevTools();
}

function updateSplashProgress(progress) {
  // Το νέο splash screen δεν χρειάζεται progress updates
  // Αφήνουμε μόνο τα animations να τρέχουν
  console.log(`Loading progress: ${progress}%`);
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