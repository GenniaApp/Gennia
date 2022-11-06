/*
 * 
 * Gennia Electron main app
 * Copyright (c) 2022 Reqwey Lin (https://github.com/Reqwey)
 * 
 */

// Modules to control application life and create native browser window
const { app, ipcMain, BrowserWindow, dialog } = require('electron')
const path = require('path')
const { Server } = require("socket.io")
const crypto = require('crypto');
const { isObject } = require('util')
const GameMap = require("./src/server/map")
const Point = require("./src/server/point")
const Player = require("./src/server/player")

const speedArr = [0.25, 0.5, 0.75, 1, 2, 3, 4]
const forceStartOK = [1, 2, 2, 3, 3, 4, 5, 5, 6]
//                    0  1  2  3  4  5  6  7  8

global.username = ''
global.port = 9016
global.serverRunning = false
global.gameStarted = false
global.map = undefined
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

async function handleDisconnectInGame(player) {
  // console.info(`Remove player | ${player.id}`)
  // global.game.tryToRemovePlayer.push(player)
}

async function handleDisconnectInRoom(player, io) {
  io.local.emit('room_message', player, 'quit.')
  let newPlayers = []
  for (let i = 0, c = 0; i < global.players.length; ++i) {
    if (global.players[i].id !== player.id) {
      global.players[i].color = c++
      newPlayers.push(global.players[i])
    } else {
      if (global.players[i].forceStart) {
        --global.forceStartNum
        io.local.emit('force-start-changed', global.forceStartNum)
      }
    }
  }
  global.players = newPlayers
  if (global.players.length > 0) global.players[0].setRoomHost(true)
  io.local.emit('players_changed', global.players)
}

async function getPlayerIndex(playerId) {
  for (let i = 0, c = 0; i < global.players.length; ++i) {
    if (global.players[i].id === playerId) {
      return i
    }
  }
}

async function getPlayerIndexBySocket(socketId) {
  for (let i = 0, c = 0; i < global.players.length; ++i) {
    if (global.players[i].socket_id === socketId) {
      return i
    }
  }
}

async function handleGame(io) {
  if (global.gameStarted === false) {
    console.info(`Start game`)
    for (let [id, socket] of io.sockets.sockets) {
      let playerIndex = await getPlayerIndexBySocket(id)
      socket.emit('game_started', global.players[playerIndex].color)
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
    global.generals = await global.map.generate()
    global.mapGenerated = true

    io.local.emit('init_game_map', global.map.width, global.map.height)

    for (let [id, socket] of io.sockets.sockets) {
      socket.on('room_message', async (message) => {
        io.local.emit('room_message_single', global.players[playerIndex], ': ' + message, global.turn)
      })
      socket.on('attack', async (from, to, isHalf) => {

        let playerIndex = await getPlayerIndexBySocket(id)
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
     })
    }

    let updTime = 500 / speedArr[global.gameConfig.gameSpeed]
    setInterval(async () => {
      for (let general of global.generals) {
        let block = global.map.getBlock(general)

        let blockPlayerIndex = await getPlayerIndex(block.player.id)
        let generalPlayerIndex = await getPlayerIndex(general.player.id)
        if (blockPlayerIndex !== generalPlayerIndex && global.players[generalPlayerIndex].isDead === false) {
          console.log(block.player.username, 'captured', general.player.username)
          io.local.emit('captured',
            { color: block.player.color, username: block.player.username },
            { color: general.player.color, username: block.player.username })
          global.players[generalPlayerIndex].isDead = true

          for (let block of global.players[generalPlayerIndex].land) {
            global.map.transferBlock(block, global.players[blockPlayerIndex])
            global.players[blockPlayerIndex].land.push(global.map.getBlock(block))
          }
          global.players[generalPlayerIndex].land.length = 0
        }
      }

      for (let [id, socket] of io.sockets.sockets) {
        let playerIndex = await getPlayerIndexBySocket(id)
        let view = await global.map.getViewPlayer(global.players[playerIndex])
        view = JSON.stringify(view)
        socket.emit('game_update', view, global.map.width, global.map.height, global.turn)
      }
      global.map.updateTurn()
      global.map.updateUnit()
    }, updTime)
  }
}

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 740,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: true
    },
    frame: false,
    icon: 'assets/img/favicon.png'
  })

  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on("maximize", async () => {
    mainWindow.webContents.send('window-maxed', true)
  })

  mainWindow.on("unmaximize", async () => {
    mainWindow.webContents.send('window-maxed', false)
  })

  // 最小化窗口（自定义导航条时）
  ipcMain.on('window-min', async () => {
    mainWindow.minimize()
  })

  // 最大化窗口（自定义导航条时）
  ipcMain.on('window-max', async () => {
    // 如果已经是最大化窗口就还原
    if (mainWindow.isMaximized()) {
      mainWindow.restore()
    } else {
      mainWindow.maximize()
    }
  })

  // 关闭窗口（自定义导航条时）
  ipcMain.on('window-close', async () => {
    mainWindow.close()
  })

  ipcMain.on("user-login", async (_, msg) => {
    console.log(msg)
    let val = msg.username
    if (!val || !val.length) {
      dialog.showErrorBox('You haven\'t set up the username!', 'Please try again.')
    } else {
      global.username = val
      mainWindow.webContents.send('toggle-dashboard', val)
    }
  })

  ipcMain.on('query-server-status', async () => {
    mainWindow.webContents.send('server-status', global.serverRunning)
  })

  ipcMain.on('create-server', async () => {
    let io;
    try {
      io = new Server(global.port)
      global.serverRunning = true
      console.log('Server established')
      mainWindow.webContents.send('server-created', 'ok')
    } catch (e) { mainWindow.webContents.send('server-created', e.message) }
    // Listen for socket.io connections

    // io.on('connect', async (socket) => {
    //   console.log(io.sockets.sockets)
    // })
    io.on('connection', async (socket) => {
      if (global.players.length >= global.gameConfig.maxPlayers) socket.emit('reject_join', 'The room is full.')
      else {
        let player;

        socket.on('reconnect', async (playerId) => {
          try {
            if (global.gameStarted) { // Allow to reconnect
              let playerIndex = await getPlayerIndex(playerId)
              player = global.players[playerIndex]
              global.players[playerIndex].socket_id = socket.id
              io.local.emit('room_message', player, 're-joined the lobby.')
            }
          } catch (e) {
            socket.emit('error', 'An unknown error occurred: ' + e.message, e.stack)
          }
        })

        socket.on('set_username', async (username) => {
          if (global.gameStarted) {
            socket.emit('reject_join', 'Game is already started')
            return;
          }
          // This socket will be first called when the player connects the server
          let playerId = crypto.randomBytes(Math.ceil(10 / 2)).toString('hex').slice(0, 10)
          console.log("Player:", username, "playerId:", playerId)
          socket.emit('set_player_id', playerId)

          player = new Player(playerId, socket.id, username, global.players.length)

          global.players.push(player)
          let playerIndex = global.players.length - 1

          io.local.emit('room_message', player, 'joined the lobby.')
          io.local.emit('players_changed', global.players)

          if (global.players.length === 1) {
            console.log(global.players[playerIndex])
            global.players[playerIndex].setRoomHost(true)
          }
          global.players[playerIndex].username = username
          io.local.emit('players_changed', global.players)

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
              io.local.emit('players_changed', global.players)
            }
          }
        })

        socket.on('change_game_speed', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing game speed to ' + speedArr[value] + 'x')
            global.gameConfig.gameSpeed = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player, `changed the game speed to ${speedArr[value]}x.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_map_width', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing map width to' + value)
            global.gameConfig.mapWidth = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player, `changed the map width to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_map_height', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing map height to' + value)
            global.gameConfig.mapHeight = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player, `changed the map height to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_mountain', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing mountain to' + value)
            global.gameConfig.mountain = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player, `changed the mountain to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_city', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing city to' + value)
            global.gameConfig.city = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player, `changed the city to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_swamp', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing swamp to' + value)
            global.gameConfig.swamp = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player, `changed the swamp to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('change_max_player_num', async (value) => {
          if (player.isRoomHost) {
            console.log('Changing max players to' + value)
            global.gameConfig.maxPlayers = value
            io.local.emit('game_config_changed', global.gameConfig)
            io.local.emit('room_message', player, `changed the max player num to ${value}.`)
          } else {
            socket.emit('error', 'Changement was failed', 'You are not the game host.')
          }
        })

        socket.on('player_message', async (message) => {
          io.local.emit('room_message', player, ': ' + message)
        })

        socket.on('disconnect', async () => {
          if (!global.gameStarted)
            await handleDisconnectInRoom(player, io)
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
          io.local.emit('players_changed', global.players)
          io.local.emit('force_start_changed', global.forceStartNum)

          if (global.forceStartNum >= forceStartOK[global.players.length]) {
            await handleGame(io)
          }
        })
      }
    })

    // // Setup the Game
    // global.game = new Game()
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