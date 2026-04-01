import { app, BrowserWindow, ipcMain, protocol, net, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import chokidar from 'chokidar'
import { pathToFileURL } from 'url'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { initRemoteServer, startRemoteServer, stopRemoteServer, getLocalIP } from './server.js'

protocol.registerSchemesAsPrivileged([
  { scheme: 'local', privileges: { supportFetchAPI: true, bypassCSP: true, stream: true } }
])

const isDev = process.env.NODE_ENV === 'development'
const baseDir = isDev
  ? process.cwd()
  : process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'))

const dataDir = path.join(baseDir, 'data')
const soundsDir = path.join(dataDir, 'sounds')
const configFile = path.join(dataDir, 'config.json')

const internalDefaultSoundsDir = isDev
  ? path.join(process.cwd(), 'default-sounds')
  : path.join(process.resourcesPath, 'default-sounds')

const internalDefaultConfigFile = isDev
  ? path.join(process.cwd(), 'default-config.json')
  : path.join(process.resourcesPath, 'default-config.json')

const EMPTY_CATEGORY = 'EMPTY_CATEGORY'

checkFileAvailability()

let mainWindow

app.whenReady().then(() => {
  createWindow()

  registerAllEvents()

  initRemoteServer(() => mainWindow, configFile, scanSoundsDirectory)
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      webSecurity: true
    }
  })

  mainWindow.setMenu(null)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  protocol.handle('local', (request) => {
    const encodedPath = request.url.slice('local://'.length)
    const absolutePath = decodeURIComponent(encodedPath)
    return net.fetch(pathToFileURL(absolutePath).toString())
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('will-quit', () => {
  uIOhook.stop()
})

const rawMap = {}
for (const [key, value] of Object.entries(UiohookKey)) {
  rawMap[value] = key
}

const keyMapOverrides = {
  Ctrl: 'LCtrl',
  CtrlRight: 'RCtrl',
  Shift: 'LShift',
  ShiftRight: 'RShift',
  Alt: 'LAlt',
  AltRight: 'RAlt',
  Meta: 'LWin',
  MetaRight: 'RWin',
  Escape: 'Esc',
  Backspace: 'Back',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Enter: 'Enter',
  Space: 'Space',
  Tab: 'Tab',
  CapsLock: 'Caps'
}

function getCleanKeyName(keycode) {
  let name = rawMap[keycode] || `Key${keycode}`
  if (keyMapOverrides[name]) return keyMapOverrides[name]
  return name
}

function startKeyboardHook() {
  try {
    uIOhook.stop()

    uIOhook.removeAllListeners('keydown')
    uIOhook.removeAllListeners('keyup')

    uIOhook.on('keydown', (e) => {
      const payload = { keycode: e.keycode, keyName: getCleanKeyName(e.keycode) }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-keydown', payload)
      }
    })

    uIOhook.on('keyup', (e) => {
      const payload = { keycode: e.keycode, keyName: getCleanKeyName(e.keycode) }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-keyup', payload)
      }
    })

    uIOhook.start()
  } catch (err) {
    console.error('Failed to start keyboard hook:', err)
  }
}

function stopKeyboardHook() {
  try {
    uIOhook.stop()
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('main-log', 'status:hook-stopped')
  } catch (err) {
    console.error('Failed to stop keyboard hook:', err)
  }
}

function scanSoundsDirectory() {
  const tree = { [EMPTY_CATEGORY]: [] }
  if (!fs.existsSync(soundsDir)) return tree
  const items = fs.readdirSync(soundsDir, { withFileTypes: true })
  items.forEach((item) => {
    if (item.isDirectory()) {
      tree[item.name] = []
      const subItems = fs.readdirSync(path.join(soundsDir, item.name))
      subItems.forEach((subItem) => {
        if (subItem.match(/\.(mp3|wav|ogg|aac)$/i)) {
          tree[item.name].push({
            name: subItem,
            relativePath: `${item.name}/${subItem}`,
            absolutePath: path.join(soundsDir, item.name, subItem)
          })
        }
      })
    } else if (item.isFile() && item.name.match(/\.(mp3|wav|ogg|aac)$/i)) {
      tree[EMPTY_CATEGORY].push({
        name: item.name,
        relativePath: `Default/${item.name}`,
        absolutePath: path.join(soundsDir, item.name)
      })
    }
  })
  return tree
}

function registerAllEvents() {
  // Register all IPC events here

  //Files Management
  ipcMain.handle('get-sounds-tree', () => scanSoundsDirectory())
  ipcMain.handle('get-config', () => {
    try {
      const data = fs.readFileSync(configFile, 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      throw new Error('Failed to read config file: ' + e.message)
    }
  })

  ipcMain.handle('get-default-config', () => {
    try {
      return JSON.parse(fs.readFileSync(internalDefaultConfigFile, 'utf-8'))
    } catch (e) {
      console.error('Failed to read default config file:', e)
      return { settings: { theme: {} } }
    }
  })

  ipcMain.on('save-config', (e, config) => {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
  })

  ipcMain.on('open-data-folder', () => {
    shell.openPath(dataDir)
  })

  chokidar
    .watch(soundsDir, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 300 } })
    .on('all', () => {
      const newTree = scanSoundsDirectory()
      if (mainWindow) mainWindow.webContents.send('fs-update', newTree)
    })

  // Keyboard Hook
  ipcMain.on('start-hook', () => {
    startKeyboardHook()
  })

  ipcMain.on('stop-hook', () => {
    stopKeyboardHook()
  })

  // Remote Server
  ipcMain.on('restart-remote-server', (e, { enabled, port }) => {
    if (enabled) startRemoteServer(port)
    else stopRemoteServer()
  })

  ipcMain.handle('get-local-ip', (_event, port) => `http://${getLocalIP()}:${port}`)
}

function checkFileAvailability() {
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true })
    if (fs.existsSync(internalDefaultSoundsDir)) {
      copyDefaultFile(internalDefaultSoundsDir, soundsDir)
    } else {
      throw new Error('Default sounds directory is missing!')
    }
  }
  if (!fs.existsSync(configFile)) {
    if (fs.existsSync(internalDefaultConfigFile)) {
      fs.copyFileSync(internalDefaultConfigFile, configFile)
    } else {
      throw new Error('Default config file is missing!')
    }
  }
}

function copyDefaultFile(src, dest) {
  if (!fs.existsSync(src)) return
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDefaultFile(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}
