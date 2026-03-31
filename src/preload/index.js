import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getSoundsTree: () => ipcRenderer.invoke('get-sounds-tree'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  onFsUpdate: (callback) => ipcRenderer.on('fs-update', (_event, tree) => callback(tree)),
  onGlobalKeyDown: (callback) => ipcRenderer.on('global-keydown', (_event, e) => callback(e)),
  onGlobalKeyUp: (callback) => ipcRenderer.on('global-keyup', (_event, e) => callback(e)),
  openDataFolder: () => ipcRenderer.send('open-data-folder'),
  getDefaultConfig: () => ipcRenderer.invoke('get-default-config'),

  startHook: () => ipcRenderer.send('start-hook'),
  stopHook: () => ipcRenderer.send('stop-hook'),
  onMainLog: (callback) => ipcRenderer.on('main-log', (_event, msg) => callback(msg))
})
