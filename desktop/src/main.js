const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let configWindow;

// Default configuration
const defaultConfig = {
  servers: [
    {
      id: 'local',
      name: 'Local Server',
      url: 'http://localhost:3001',
      locationCode: 'LOCAL',
      isActive: true,
      isDefault: true
    }
  ],
  currentServer: 'local',
  theme: 'light',
  refreshInterval: 5000,
  notifications: true
};

// Initialize configuration
if (!store.get('config')) {
  store.set('config', defaultConfig);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  mainWindow.loadFile(path.join(__dirname, '../views/dashboard.html'));

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Item',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-item');
          }
        },
        { type: 'separator' },
        {
          label: 'Configuration',
          accelerator: 'CmdOrCtrl+,',
          click: () => createConfigWindow()
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('navigate', 'dashboard');
          }
        },
        {
          label: 'Queue',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('navigate', 'queue');
          }
        },
        {
          label: 'Photo Upload',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('navigate', 'photo-upload');
          }
        },
        {
          label: 'Processing',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.webContents.send('navigate', 'processing');
          }
        },
        {
          label: 'Users',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            mainWindow.webContents.send('navigate', 'users');
          }
        },
        { type: 'separator' },
        {
          label: 'Refresh',
          accelerator: 'F5',
          click: () => {
            mainWindow.webContents.send('menu-action', 'refresh');
          }
        },
        { type: 'separator' },
        { role: 'toggledevtools' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Workflow',
      submenu: [
        {
          label: 'Process Next Item',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('workflow-action', 'process-next');
          }
        },
        {
          label: 'Skip Item',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('workflow-action', 'skip');
          }
        },
        { type: 'separator' },
        {
          label: 'Launch Photo Upload',
          click: () => {
            mainWindow.webContents.send('launch-stage', 'photo-upload');
          }
        },
        {
          label: 'Launch Review & Edit',
          click: () => {
            mainWindow.webContents.send('launch-stage', 'review-edit');
          }
        },
        {
          label: 'Launch Pricing',
          click: () => {
            mainWindow.webContents.send('launch-stage', 'pricing');
          }
        },
        {
          label: 'Launch Publishing',
          click: () => {
            mainWindow.webContents.send('launch-stage', 'publishing');
          }
        }
      ]
    },
    {
      label: 'Server',
      submenu: [
        {
          label: 'Select Server',
          submenu: [] // Will be populated dynamically
        },
        { type: 'separator' },
        {
          label: 'Add Server',
          click: () => {
            mainWindow.webContents.send('menu-action', 'add-server');
          }
        },
        {
          label: 'Server Status',
          click: () => {
            mainWindow.webContents.send('menu-action', 'server-status');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            require('electron').shell.openExternal('https://github.com/yourusername/consoleebay/wiki');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            mainWindow.webContents.send('menu-action', 'show-shortcuts');
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About ConsoleEbay Dashboard',
              message: 'ConsoleEbay Dashboard',
              detail: 'Version 1.0.0\nA unified dashboard for eBay listing workflow management.\n\n© 2024 ConsoleEbay',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => createConfigWindow()
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  // Update server menu dynamically
  updateServerMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createConfigWindow() {
  if (configWindow) {
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    width: 900,
    height: 700,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default'
  });

  configWindow.loadFile(path.join(__dirname, '../views/config.html'));

  configWindow.on('closed', () => {
    configWindow = null;
    // Reload main window to apply new settings
    if (mainWindow) {
      mainWindow.reload();
    }
  });
}

function updateServerMenu() {
  const config = store.get('config');
  const servers = config.servers || [];
  const currentServer = config.currentServer;
  
  const menu = Menu.getApplicationMenu();
  const serverMenu = menu.items.find(item => item.label === 'Server');
  
  if (serverMenu && serverMenu.submenu) {
    const selectServerSubmenu = serverMenu.submenu.items[0];
    
    if (selectServerSubmenu && selectServerSubmenu.submenu) {
      // Clear existing items
      selectServerSubmenu.submenu.items = [];
      
      // Add server options
      servers.forEach(server => {
        selectServerSubmenu.submenu.append(new MenuItem({
          label: `${server.name} (${server.locationCode})`,
          type: 'radio',
          checked: server.id === currentServer,
          click: () => {
            store.set('config.currentServer', server.id);
            mainWindow.webContents.send('server-changed', server);
          }
        }));
      });
    }
  }
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return store.get('config');
});

ipcMain.handle('save-config', (event, newConfig) => {
  store.set('config', newConfig);
  updateServerMenu();
  return { success: true };
});

ipcMain.handle('get-current-server', () => {
  const config = store.get('config');
  const servers = config.servers || [];
  return servers.find(s => s.id === config.currentServer);
});

ipcMain.handle('add-server', (event, server) => {
  const config = store.get('config');
  server.id = `server-${Date.now()}`;
  config.servers.push(server);
  store.set('config', config);
  updateServerMenu();
  return { success: true, server };
});

ipcMain.handle('remove-server', (event, serverId) => {
  const config = store.get('config');
  config.servers = config.servers.filter(s => s.id !== serverId);
  if (config.currentServer === serverId && config.servers.length > 0) {
    config.currentServer = config.servers[0].id;
  }
  store.set('config', config);
  updateServerMenu();
  return { success: true };
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('select-file', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.filePaths[0];
});

// App event handlers
app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

// Auto-updater (optional)
if (!process.env.DEV) {
  const { autoUpdater } = require('electron-updater');
  
  app.whenReady().then(() => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}