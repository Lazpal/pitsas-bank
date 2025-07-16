const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Για τοπικά αρχεία
    },
    icon: path.join(__dirname, 'app/img/favicon.png'),
    title: 'Pitsas Camp Bank',
    show: false // Θα εμφανιστεί όταν είναι έτοιμο
  });

  mainWindow.loadFile('app/index.html');
  
  // Εμφάνιση όταν είναι έτοιμο
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // Hide menu bar in production
  Menu.setApplicationMenu(null);
  
  // Dev tools (για debugging)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

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