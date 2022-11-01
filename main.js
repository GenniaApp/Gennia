// Modules to control application life and create native browser window
let { app, ipcMain, BrowserWindow } = require('electron')
let path = require('path')
let mainWindow = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule:true
    },
    frame: false,
    icon: 'assets/images/windows11/LargeTile.scale-400.png'
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send('window-maxed', true)
  })

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send('window-maxed', false)
  })
  
  // 最小化窗口（自定义导航条时）
  ipcMain.on('window-min', () => {
    mainWindow.minimize()
  })

  // 最大化窗口（自定义导航条时）
  ipcMain.on('window-max', () => {
    // 如果已经是最大化窗口就还原
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize()
    }
  })

  // 关闭窗口（自定义导航条时）
  ipcMain.on('window-close', () => {
    mainWindow.close()
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