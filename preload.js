/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 * 
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  windowMin: () => { ipcRenderer.send('window-min') },
  windowMax: () => { ipcRenderer.send('window-max') },
  windowClose: () => { ipcRenderer.send('window-close') }
})

window.addEventListener('DOMContentLoaded', () => {
  let expandControl = document.getElementById('expandControl');
  let restoreControl = document.getElementById('restoreControl');
  ipcRenderer.on('window-maxed', (_, value) => {
    if (value) {
      expandControl.style.display = 'none';
      restoreControl.style.display = 'inline-block';
    } else {
      expandControl.style.display = 'inline-block';
      restoreControl.style.display = 'none';
    }
  })
})