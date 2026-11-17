'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  load: () => ipcRenderer.sendSync('gsp-load'),
  save: (json) => ipcRenderer.send('gsp-save', json),
  openFolder: () => ipcRenderer.send('gsp-open-folder'),
});
