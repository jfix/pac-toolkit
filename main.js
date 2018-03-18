const { Menu, app, BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const url = require('url')

autoUpdater.logger = require('electron-log')
autoUpdater.logger.transports.file.level = 'info'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const template = [{
  label: 'PAC Toolbelt',
  submenu: [
    { label: 'About Toolbelt', selector: 'orderFrontStandardAboutPanel:' },
    { type: 'separator' },
    { label: 'Quit',
      accelerator: 'Command+Q',
      click: function () { app.quit() }
    }
  ]}, {
  label: 'Edit',
  submenu: [
    { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
    { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
    { type: 'separator' },
    { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
    { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
    { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
    { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
  ]}
]

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    backgroundColor: '#ffffff',
    width: 1050,
    height: 740,
    resizable: false,
    center: true
  })

  // remove the standard application menu
  mainWindow.setMenu(null)

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  autoUpdater.setFeedURL({
    'provider': 'github',
    'owner': 'jfix',
    'repo': 'dossier-redmine'
  })
  autoUpdater.checkForUpdates()

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('checkingForUpdate')
  })
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('updateAvailable', info)
  })
  autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send('updateAvailable', info)
  })
  // when the update has been downloaded and is ready to be installed, notify the BrowserWindow
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('updateReady')
  })
  autoUpdater.on('error', message => {
    console.error('There was a problem updating the application')
    console.error(message)
  })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// when receiving a quitAndInstall signal, quit and install the new version ;)
ipcMain.on('quitAndInstall', (event, arg) => {
  autoUpdater.quitAndInstall()
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
