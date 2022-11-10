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
  windowMin: () => { ipcRenderer.send('window-min') },
  windowMax: () => { ipcRenderer.send('window-max') },
  windowClose: () => { ipcRenderer.send('window-close') },
  userLogin: (username) => { ipcRenderer.send('user-login', { username: username }) },
  queryServerStatus: () => { ipcRenderer.send('query-server-status') }
})

window.addEventListener('DOMContentLoaded', async () => {
  console.log('content loaded');
  
  // Window Controller
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
  ipcRenderer.on('window-maxed', (_, value) => {
    if (value) {
      expandControl.style.display = 'none';
      restoreControl.style.display = 'inline-block';
    } else {
      expandControl.style.display = 'inline-block';
      restoreControl.style.display = 'none';
    }
  })

  console.log(getIPAdress());
  // Get IP
  document.getElementById('leftfooter').innerHTML = `Gennia V1.0.3`
  document.getElementById('rightfooter').innerHTML = `Your IP: ${getIPAdress()}`;

  // Toggle Dashboard
  ipcRenderer.on('toggle-dashboard', (_, username) => {
    document.getElementsByClassName('reqtitle')[0].innerHTML = `<h3 style="display: inline-block; margin-top: 5px; margin-left: 10px; margin-right: 5px;"><a class="ui mini button" style="display: inline-block" href='./index.html'><svg class="reqreturnicon" style="display: inline-block;font-size: inherit;height: 1em;overflow: visible;vertical-align: -0.125em;font-size: 13px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M570.24 247.41L512 199.52V104a8 8 0 0 0-8-8h-32a8 8 0 0 0-7.95 7.88v56.22L323.87 45a56.06 56.06 0 0 0-71.74 0L5.76 247.41a16 16 0 0 0-2 22.54L14 282.25a16 16 0 0 0 22.53 2L64 261.69V448a32.09 32.09 0 0 0 32 32h128a32.09 32.09 0 0 0 32-32V344h64v104a32.09 32.09 0 0 0 32 32h128a32.07 32.07 0 0 0 32-31.76V261.67l27.53 22.62a16 16 0 0 0 22.53-2L572.29 270a16 16 0 0 0-2.05-22.59zM463.85 432H368V328a32.09 32.09 0 0 0-32-32h-96a32.09 32.09 0 0 0-32 32v104h-96V222.27L288 77.65l176 144.56z"/></svg></a> Dashboard - Gennia</h3>`
    document.getElementsByClassName('container')[0].innerHTML = `<h1 class="fadeInDown" style="font-size:2.4rem!important">Hi <p style="display: inline" class="req" id="username">${username}</p>
		</h1>
		<h3 class="fadeInDown" style="color: #818181!important">Welcome to Gennia Dashboard.<br>Please choose a selection.</h3>
		
		<button class="fadeInUp ui fluid pink button" id="joinGame" data-tooltip="Join in an existing online game in your LAN." data-inverted="" data-position="top center" onclick="toggleJoinGame()">Join in a Game</button>
		<div style="margin-top: 10px"></div>
		<button class="fadeInUp ui fluid blue button" id="createServer" data-tooltip="Create a websocket gaming server that is available in your LAN." data-inverted="" data-position="bottom center" onclick="window.electron.queryServerStatus()">Create a Server</button>`
    
    document.getElementById('rightfooter').innerHTML = `${username}'s IP: ${getIPAdress()}`;

  })

  ipcRenderer.on('server-created', (_, value) => {
    if (value === 'ok') {
      document.getElementById('createServer').innerText = `Server running on ${getIPAdress()}:9016`
      document.getElementById('createServer').setAttribute('disabled', '')
    } else {
      document.getElementById('createServer').innerText = `Error: ${value}:`
      document.getElementById('createServer').setAttribute('class', 'ui fluid red disabled button')
    }
  })

  ipcRenderer.on('server-status', (_, status) => {
    console.log('Server status', status)
    if (status) {
      document.getElementById('createServer').innerText = `Server running on ${getIPAdress()}:9016`
      document.getElementById('createServer').setAttribute('disabled', '')
    } else {
      ipcRenderer.send('create-server')
    }
  })
})