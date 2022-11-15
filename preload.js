/*
 * 
 * Gennia Electron main app Preloader
 * It works to bridge between frontend and backend.
 * Copyright (c) 2022 Reqwey Lin (https://github.com/Reqwey)
 * 
 */
const { contextBridge, ipcRenderer } = require('electron')
const { getIPAdress } = require('./util')

contextBridge.exposeInMainWorld('electron', {
  queryInfo: () => { ipcRenderer.send('get-info') },
  windowMin: () => { ipcRenderer.send('window-min') },
  windowMax: () => { ipcRenderer.send('window-max') },
  windowClose: () => { ipcRenderer.send('window-close') },
  userLogin: (username) => { ipcRenderer.send('user-login', { username: username }) },
  changeServerConfig: (data) => { ipcRenderer.send('change-server-config', data) },
  initServerConfig: () => { window.server_error = false }
})

window.addEventListener('DOMContentLoaded', async () => {
  console.log('content loaded');

  // Window Controller
  let expandControl = document.getElementById('expandControl');
  let restoreControl = document.getElementById('restoreControl');
  ipcRenderer.on('window-maxed', (_, value) => {
    if (value) {
      expandControl.style.display = 'none';
      restoreControl.style.display = 'inline-flex';
    } else {
      expandControl.style.display = 'inline-flex';
      restoreControl.style.display = 'none';
    }
  })

  ipcRenderer.on('window-maxed', (_, value) => {
    if (value) {
      expandControl.style.display = 'none';
      restoreControl.style.display = 'inline-flex';
    } else {
      expandControl.style.display = 'inline-flex';
      restoreControl.style.display = 'none';
    }
  })

  ipcRenderer.on('get-info', (_, info) => {
    document.getElementById('leftfooter').innerHTML = `Gennia V${info}`
    // Get IP
    document.getElementById('rightfooter').innerHTML = `Your IP: ${getIPAdress()}`;
  })

  // Toggle Dashboard
  ipcRenderer.on('toggle-dashboard', (_, username) => {
    document.getElementsByClassName('reqtitle')[0].innerHTML = `<h3>Dashboard - Gennia</h3>`
    document.getElementsByClassName('container')[0].innerHTML = `<h1 class="fadeInDown" style="font-size:2.4rem!important">Hi <p style="display: inline" class="req" id="username">${username}</p>
		</h1>
		<h3 class="fadeInDown" style="color: #818181!important">Welcome to Gennia Dashboard.<br>Please choose a selection.</h3>
		
		<button class="fadeInUp ui fluid pink button" id="joinGame" data-tooltip="Join in an existing online game in your LAN." data-inverted="" data-position="top center" onclick="toggleJoinGame()">Join in a Game</button>
		<div style="margin-top: 10px"></div>
		<button class="fadeInUp ui fluid blue button" id="createServer" data-tooltip="Create a websocket gaming server that is available in your LAN." data-inverted="" data-position="bottom center" onclick="toggleServerConfig()">Create a Server</button>`

    document.getElementById('rightfooter').innerHTML = `${username}'s IP: ${getIPAdress()}`;

  })

  ipcRenderer.on('config-changed', () => {
    ipcRenderer.send('create-server')
  })

  ipcRenderer.on('server-created', (_, port) => {
    if (!window.server_error) {
      console.log('ok')
      document.getElementById('createServer').innerText = `Server running on ${getIPAdress()}:${port}`
      document.getElementById('createServer').setAttribute('disabled', '')
    }
  })

  ipcRenderer.on('server-error', (_) => {
    console.log('1111')
    window.server_error = true
    document.getElementById('createServer').innerText = `Create a Server`
    document.getElementById('createServer').removeAttribute('disabled')
  })
})