const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  openDialog: () => ipcRenderer.invoke('open-dialog'),
  savePdf: (name, srcPath, bytes) => ipcRenderer.invoke('save-pdf', name, srcPath, bytes),
  setDirty: v => ipcRenderer.send('dirty', v),
  ready: () => ipcRenderer.send('ready'),
  pathOf: file => { try { return webUtils.getPathForFile(file) || null; } catch (e) { return null; } },
  onOpen: cb => ipcRenderer.on('open-file', (_e, f) => cb(f)),
  onMenu: cb => ipcRenderer.on('menu', (_e, a) => cb(a))
});
