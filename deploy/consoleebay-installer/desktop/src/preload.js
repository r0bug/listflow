const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
    // Configuration
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    getCurrentServer: () => ipcRenderer.invoke('get-current-server'),
    addServer: (server) => ipcRenderer.invoke('add-server', server),
    removeServer: (serverId) => ipcRenderer.invoke('remove-server', serverId),
    
    // File dialogs
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    selectFile: (options) => ipcRenderer.invoke('select-file', options),
    
    // Navigation
    openConfig: () => ipcRenderer.send('open-config'),
    launchStage: (stage) => ipcRenderer.send('launch-stage', stage),
    
    // Event listeners
    onMenuAction: (callback) => {
        ipcRenderer.on('menu-action', (event, action) => callback(action));
    },
    onNavigate: (callback) => {
        ipcRenderer.on('navigate', (event, view) => callback(view));
    },
    onWorkflowAction: (callback) => {
        ipcRenderer.on('workflow-action', (event, action) => callback(action));
    },
    onServerChanged: (callback) => {
        ipcRenderer.on('server-changed', (event, server) => callback(server));
    },
    onLaunchStage: (callback) => {
        ipcRenderer.on('launch-stage', (event, stage) => callback(stage));
    }
});