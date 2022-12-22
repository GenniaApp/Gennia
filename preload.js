/*
 * 
 * Gennia Electron main app Preloader
 * It works to bridge between frontend and backend.
 * Copyright (c) 2022 Reqwey Lin (https://github.com/Reqwey)
 * 
 */
const { contextBridge, ipcRenderer, app, Menu, dialog } = require('electron')
const { Titlebar, Color } = require("custom-electron-titlebar");
const { getIPAdress } = require('./util')
const path = require('path');
const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'Help',
    submenu: [
      {
        label: 'Quick Start',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://gennia.reqwey.com/quick-start')
        }
      },
      {
        label: 'Version',
        click: async () => {
          dialog.showMessageBox({
            type: 'info',
            title: 'About Gennia',
            message: 'About Gennia',
            detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode.js: ${process.versions.node}\nChromium: ${process.versions.chrome}\n`
          })
        }
      },
      { type: 'separator' },
      {
        label: 'Star Me',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/GenniaApp/Gennia')
        }
      }
    ]
  }
]

var titlebar;
// const menu = Menu.buildFromTemplate(template)

contextBridge.exposeInMainWorld('electron', {
  queryInfo: () => { ipcRenderer.send('get-info') },
  userLogin: (username) => { ipcRenderer.send('user-login', { username: username }) },
  changeServerConfig: (data) => { ipcRenderer.send('change-server-config', data) },
  initServerConfig: () => { window.server_error = false },
  setTitle: (title) => { titlebar.updateTitle(title) }
})

window.addEventListener('DOMContentLoaded', async () => {
  console.log('content loaded');
  titlebar = new Titlebar({
    icon: path.join(__dirname, 'assets/img/favicon-new.png'),
    backgroundColor: Color.fromHex('#596975b3')
    // menu: menu
  });

  titlebar.updateTitle('Home - Gennia')

  ipcRenderer.on('get-info', (_, info) => {
    document.getElementById('leftfooter').innerHTML = `Gennia V${info}`
    // Get IP
    document.getElementById('rightfooter').innerHTML = `Your IP: ${getIPAdress()}`;
  })

  // Toggle Dashboard
  ipcRenderer.on('toggle-dashboard', (_, username, serverStatus, serverPort) => {
    titlebar.updateTitle('Dashboard - Gennia');
    document.getElementsByClassName('container')[0].innerHTML = `<h1 class="fadeInDown" style="font-size:2.4rem!important">Hi <p style="display: inline" class="req" id="username">${username}</p>
		</h1>
		<h3 class="fadeInDown">Welcome to Gennia Dashboard.<br>Please choose a selection.</h3>
		
		<button class="fadeInUp ui fluid pink button" id="joinGame" data-tooltip="Join in an existing online game in your LAN." data-inverted="" data-position="top center" onclick="toggleJoinGame()">Join in a Game</button>
		<div style="margin-top: 10px"></div>
		${serverStatus ? 
      `<button class="fadeInUp ui fluid blue button disabled" id="createServer" data-tooltip="Create a websocket gaming server that is available in your LAN." data-inverted="" data-position="bottom center">Server running on ${getIPAdress()}:${serverPort}</button>`
      :
      '<button class="fadeInUp ui fluid blue button" id="createServer" data-tooltip="Create a websocket gaming server that is available in your LAN." data-inverted="" data-position="bottom center" onclick="toggleServerConfig()">Create a Server</button>'
    }`

    document.getElementById('rightfooter').innerHTML = `${username}'s IP: ${getIPAdress()}`;

  })

  ipcRenderer.on('config-changed', () => {
    ipcRenderer.send('create-server')
  })

  ipcRenderer.on('server-created', (_, port) => {
    if (!window.server_error) {
      document.getElementById('createServer').innerText = `Server running on ${getIPAdress()}:${port}`
      document.getElementById('createServer').setAttribute('disabled', '')
    }
  })

  ipcRenderer.on('server-error', (_) => {
    window.server_error = true
    document.getElementById('createServer').innerText = `Create a Server`
    document.getElementById('createServer').removeAttribute('disabled')
  })
})