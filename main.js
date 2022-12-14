/*
 * 
 * Gennia Electron main app
 * Copyright (c) 2022 Reqwey Lin (https://github.com/Reqwey)
 * 
 */

// Modules to control application life and create native browser window
const { app, ipcMain, BrowserWindow, dialog, Tray, Menu } = require('electron')
const { setupTitlebar, attachTitlebarToWindow } = require("custom-electron-titlebar/main")
const path = require('path')
const { Server } = require("socket.io")
const crypto = require('crypto');
const GameMap = require("./src/server/map")
const Point = require("./src/server/point")
const Player = require("./src/server/player")
const xss = require('xss')

const speedArr = [0.25, 0.5, 0.75, 1, 2, 3, 4]
const forceStartOK = [1, 2, 2, 3, 3, 4, 5, 5, 6]
//                    0  1  2  3  4  5  6  7  8

global.username = ''
global.serverConfig = {
  name: 'Gennia Lobby',
  port: 9016
}
global.serverRunning = false
global.gameStarted = false
global.map = undefined
global.gameLoop = undefined
global.gameConfig = {
  maxPlayers: 8,
  gameSpeed: 3,
  mapWidth: 0.75,
  mapHeight: 0.75,
  mountain: 0.5,
  city: 0.5,
  swamp: 0
}
global.players = new Array()
global.generals = new Array()
global.forceStartNum = 0

let mainWindow = null
let appTray = null

async function userSet(username) {
  // console.log('join', this)
  // // this === socket
  // console.info(`Add player | ${this.id}| ${username}`)
  // global.game.tryToAddPlayer.push([this, username])
}

async function handleInput(command) {
  // console.info(`Get command | ${this.id}`)
  // global.game.handleInput(this, command)
}

async function handleDisconnectInGame(player, io) {
  io.local.emit('room_message', player.trans(), 'quit.')
  global.players = global.players.filter(p => p != player)
}

async function handleDisconnectInRoom(player, io) {
  io.local.emit('room_message', player.trans(), 'quit.')
  let newPlayers = []
  global.forceStartNum = 0
  for (let i = 0, c = 0; i < global.players.length; ++i) {
    if (global.players[i].id !== player.id) {
      global.players[i].color = c++
      newPlayers.push(global.players[i])
      if (global.players[i].forceStart) {
        ++global.forceStartNum
      }
    }
  }
  io.local.emit('force_start_changed', global.forceStartNum)
  global.players = newPlayers
  if (global.players.length > 0) global.players[0].setRoomHost(true)
  io.local.emit('players_changed', global.players.map(player => player.trans()))
}

async function getPlayerIndex(playerId) {
  for (let i = 0; i < global.players.length; ++i) {
    if (global.players[i].id === playerId) {
      return i
    }
  }
  return -1
}

async function getPlayerIndexBySocket(socketId) {
  for (let i = 0, c = 0; i < global.players.length; ++i) {
    if (global.players[i].socket_id === socketId) {
      return i
    }
  }
  return -1
}

async function handleGame(io) {
  if (global.gameStarted === false) {
    console.info(`Start game`)
    for (let [id, socket] of io.sockets.sockets) {
      let playerIndex = await getPlayerIndexBySocket(id)
      if (playerIndex !== -1) {
        socket.emit('game_started', global.players[playerIndex].color)
      }
    }
    global.gameStarted = true

    global.map = new GameMap(
      global.gameConfig.mapWidth,
      global.gameConfig.mapHeight,
      global.gameConfig.mountain,
      global.gameConfig.city,
      global.gameConfig.swamp,
      global.players
    )
    global.players = await global.map.generate()
    global.mapGenerated = true

    io.local.emit('init_game_map', global.map.width, global.map.height)

    for (let [id, socket] of io.sockets.sockets) {
      socket.on('attack', async (from, to, isHalf) => {
        let playerIndex = await getPlayerIndexBySocket(id)
        if (playerIndex !== -1) {
          let player = global.players[playerIndex]
          if (player.operatedTurn < global.map.turn && global.map.commandable(player, from, to)) {
            if (isHalf) {
              global.map.moveHalfMovableUnit(player, from, to)
            } else {
              global.map.moveAllMovableUnit(player, from, to)
            }

            global.players[playerIndex].operatedTurn = global.map.turn
            socket.emit('attack_success', from, to)
          } else {
            socket.emit('attack_failure', from, to)
          }
        }
      })
    }

    let updTime = 500 / speedArr[global.gameConfig.gameSpeed]
    global.gameLoop = setInterval(async () => {
      try {

        global.players.forEach(async (player) => {
          let block = global.map.getBlock(player.king)

          let blockPlayerIndex = await getPlayerIndex(block.player.id)
          if (blockPlayerIndex !== -1) {
            if (block.player !== player && player.isDead === false) {
              console.log(block.player.username, 'captured', player.username)
              io.local.emit('captured', block.player.trans(), player.trans())
              io.sockets.sockets.get(player.socket_id).emit('game_over', block.player.trans())
              player.isDead = true
              global.map.getBlock(player.king).kingBeDominated()
              player.land.forEach(block => {
                global.map.transferBlock(block, global.players[blockPlayerIndex])
                global.players[blockPlayerIndex].winLand(block)
              })
              player.land.length = 0
            }
          }
        })
        let alivePlayer = null, countAlive = 0
        for (let a of global.players)
          if (!a.isDead) alivePlayer = a, ++countAlive
        if (countAlive === 1) {
          io.local.emit('game_ended', alivePlayer.id)
          global.gameStarted = false
          global.forceStartNum = 0
          clearInterval(global.gameLoop)
        }

        let leaderBoard = global.players.map(player => {
          let data = global.map.getTotal(player)
          return {
            color: player.color,
            username: player.username,
            army: data.army,
            land: data.land
          }
        }).sort((a, b) => { return b.army - a.army || b.land - a.land })

        for (let [id, socket] of io.sockets.sockets) {
          let playerIndex = await getPlayerIndexBySocket(id)
          if (playerIndex !== -1) {
            let view = await global.map.getViewPlayer(global.players[playerIndex])
            view = JSON.stringify(view)
            socket.emit('game_update', view, global.map.width, global.map.height, global.map.turn, leaderBoard)
          }
        }
        global.map.updateTurn()
        global.map.updateUnit()
      } catch (e) { console.log(e) }
    }, updTime)
  }
}

async function createWindow() {
  // Create the browser window
  setupTitlebar();

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 740,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: true
    },
    frame: false,
    icon: 'assets/img/favicon-new.png'
  })

  attachTitlebarToWindow(mainWindow);
  mainWindow.loadFile('index.html')

  var trayMenuTemplate = [
    {
      label: 'Open',
      click: () => {
        mainWindow.show()
      }
    },
    {
      label: 'Force Reflush',
      click: () => {
        mainWindow.loadFile('index.html')
      }
    },
    {
      label: 'Toggle DevTools',
      click: () => {
        mainWindow.webContents.toggleDevTools()
      }
    },
    {
      label: 'About',
      click: () => {
        dialog.showMessageBox({
          type: 'info',
          title: 'About Gennia',
          message: 'About Gennia',
          detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode.js: ${process.versions.node}\nChromium: ${process.versions.chrome}\n`
        })
      }
    },
    {
      label: 'Quit',
      role: 'quit'
    }
  ];

  appTray = new Tray(path.join(__dirname, 'assets/img/favicon-new.png'));
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  appTray.setToolTip('Gennia');
  appTray.setContextMenu(contextMenu);

  appTray.on('click', () => {
    appTray.popUpContextMenu(contextMenu);
  })

  appTray.on('right-click', () => {
    appTray.popUpContextMenu(contextMenu);
  });

  ipcMain.on("get-info", async () => {
    mainWindow.webContents.send('get-info', app.getVersion())
  })

  ipcMain.on("user-login", async (_, msg) => {
    console.log(msg)
    let val = msg.username
    if (!val || !val.length) {
      dialog.showErrorBox('You haven\'t set up the username!', 'Please try again.')
    } else {
      global.username = xss(val)
      mainWindow.webContents.send('toggle-dashboard', global.username, 
        global.serverRunning, global.serverConfig.port)
    }
  })

  ipcMain.on('change-server-config', async (_, val) => {
    let port = val.port, name = val.name
    if (!(port > 0 && port < 65535)) {
      dialog.showErrorBox('Server creation failed', 'The port number must be between 0 and 65535')
      mainWindow.webContents.send('server-error', err)
      return;
    }
    global.serverConfig.port = port
    if (name && name.length) {
      global.serverConfig.name = xss(name)
    }
    mainWindow.webContents.send('config-changed')
  })

  ipcMain.on('create-server', async () => {
    if (global.serverRunning) {
      mainWindow.webContents.send('server-created', global.serverConfig.port)
      return
    }
    global.serverRunning = true
    let io = new Server(global.serverConfig.port)
    console.log('Server established')
    mainWindow.webContents.send('server-created', global.serverConfig.port)
    // Error will be caught at process.on('uncaughtException')

    // Listen for socket.io connections

    // io.on('connect', async (socket) => {
    //   console.log(io.sockets.sockets)
    // })
    io.on('connection', async (socket) => {
      if (global.players.length >= global.gameConfig.maxPlayers) socket.emit('reject_join', 'The room is full.')
      else {
        socket.on('query_server_info', async () => {
          socket.emit('server_info', global.serverConfig.name, `GenniaApp ${app.getVersion()}`)
        })

        let player;

        socket.on('set_username', async (username) => {
          if (global.gameStarted) {
            socket.emit('reject_join', 'Game is already started')
            return;
          }
          username = xss(username)
          // This socket will be first called when the player connects the server
          let playerId = crypto.randomBytes(Math.ceil(10 / 2)).toString('hex').slice(0, 10)
          console.log("Player:", username, "playerId:", playerId)
          socket.emit('set_player_id', playerId)

          player = new Player(playerId, socket.id, username, global.players.length)

          global.players.push(player)
          let playerIndex = global.players.length - 1

          io.local.emit('room_message', player.trans(), 'joined the lobby.')
          io.local.emit('players_changed', global.players.map(player => player.trans()))

          if (global.players.length === 1) {
            console.log(global.players[playerIndex])
            global.players[playerIndex].setRoomHost(true)
          }
          global.players[playerIndex].username = username
          io.local.emit('players_changed', global.players.map(player => player.trans()))

          // Only emit to this player so it will get the latest status
          socket.emit('force_start_changed', global.forceStartNum)

          if (global.players.length >= global.gameConfig.maxPlayers) {
            await handleGame(io)
          }
        })

        socket.on('get_game_settings', async () => {
          socket.emit('push_game_settings', global.gameConfig)
        })

        socket.on('change_host', async (userId) => {
          if (player.isRoomHost) {
            let currentHost = await getPlayerIndex(player.id)
            let newHost = await getPlayerIndex(userId)
            if (newHost !== -1) {
              global.players[currentHost].setRoomHost(false)
              global.players[newHost].setRoomHost(true)
              io.local.emit('players_changed', global.players.map(player => player.trans()))
            }
          }
        })

        socket.on('change_game_speed', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing game speed to ' + speedArr[value] + 'x')
            global.gameConfig.gameSpeed = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player.trans(), `changed the game speed to ${speedArr[value]}x.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_map_width', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing map width to' + value)
            global.gameConfig.mapWidth = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player.trans(), `changed the map width to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_map_height', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing map height to' + value)
            global.gameConfig.mapHeight = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player.trans(), `changed the map height to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_mountain', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing mountain to' + value)
            global.gameConfig.mountain = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player.trans(), `changed the mountain to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_city', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing city to' + value)
            global.gameConfig.city = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player.trans(), `changed the city to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_swamp', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing swamp to' + value)
            global.gameConfig.swamp = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player.trans(), `changed the swamp to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_max_player_num', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing max players to' + value)
            global.gameConfig.maxPlayers = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player.trans(), `changed the max player num to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('player_message', async (message) => {
          io.local.emit('room_message', player.trans(), ': ' + message)
        })

        socket.on('disconnect', async () => {
          if (!global.gameStarted)
            await handleDisconnectInRoom(player, io)
          else
            await handleDisconnectInGame(player, io)
        })

        socket.on('leave_game', async () => {
          socket.disconnect()
          await handleDisconnectInGame(player, io)
        })

        socket.on('force_start', async () => {
          let playerIndex = await getPlayerIndex(player.id)
          if (global.players[playerIndex].forceStart === true) {
            global.players[playerIndex].forceStart = false
            --global.forceStartNum
          } else {
            global.players[playerIndex].forceStart = true
            ++global.forceStartNum
          }
          io.local.emit('players_changed', global.players.map(player => player.trans()))
          io.local.emit('force_start_changed', global.forceStartNum)

          if (global.forceStartNum >= forceStartOK[global.players.length]) {
            await handleGame(io)
          }
        })
      }
    })
  })

  ipcMain.on('close-server', async () => {
    io.close()
    global.serverRunning = false
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

process.on('uncaughtException', async (err) => {
  if (err.errno === -4091) { // EADDRINUSE
    global.serverRunning = false
    mainWindow.webContents.send('server-error', err)
    dialog.showErrorBox('Server creation failed', 'The port is already in use.\nPlease try again')
  }
  console.log(err);
});