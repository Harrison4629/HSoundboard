import { app, BrowserWindow, ipcMain, protocol, net, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import chokidar from 'chokidar'
import { pathToFileURL } from 'url'
import { uIOhook, UiohookKey } from 'uiohook-napi'

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

const DEFAULT_CATEGORY = '默认'

function copyDirectorySync(src, dest) {
  if (!fs.existsSync(src)) return
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true })
  if (fs.existsSync(internalDefaultSoundsDir)) {
    copyDirectorySync(internalDefaultSoundsDir, soundsDir)
  }
}
if (!fs.existsSync(configFile)) {
  if (fs.existsSync(internalDefaultConfigFile)) {
    fs.copyFileSync(internalDefaultConfigFile, configFile)
  } else {
    // 极限兜底（防万一打包漏了）
    fs.writeFileSync(configFile, JSON.stringify({ sounds: {}, settings: {} }))
  }
}

let mainWindow
let isHookIntentionallyStopped = false

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
  if (isHookIntentionallyStopped) return
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
    console.error('❌ 键盘钩子启动失败:', err)
  }
}

function stopKeyboardHook() {
  try {
    uIOhook.stop()
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('main-log', 'status:hook-stopped')
  } catch (err) {
    console.error(err)
  }
}

app.whenReady().then(() => {
  createWindow()

  ipcMain.on('start-hook', () => {
    isHookIntentionallyStopped = false
    startKeyboardHook()
  })

  ipcMain.on('stop-hook', () => {
    isHookIntentionallyStopped = true
    stopKeyboardHook()
  })

  ipcMain.handle('get-sounds-tree', () => scanSoundsDirectory())
  ipcMain.handle('get-config', () => {
    try {
      const data = fs.readFileSync(configFile, 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      console.error('Config file corrupted, using defaults:', e)
      return { sounds: {}, settings: {} }
    }
  })

  ipcMain.handle('get-default-config', () => {
    try {
      return JSON.parse(fs.readFileSync(internalDefaultConfigFile, 'utf-8'))
    } catch (e) {
      console.error('读取默认配置文件失败:', e)
      return { settings: { theme: {} } } // 极限兜底
    }
  })

  ipcMain.on('save-config', (e, config) => {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
  })

  ipcMain.on('open-data-folder', () => {
    shell.openPath(dataDir)
  })

  ipcMain.on('restart-hook', () => {
    console.log('收到前端指令，正在强制重启键盘钩子...')
    startKeyboardHook()
  })

  chokidar
    .watch(soundsDir, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 300 } })
    .on('all', () => {
      const newTree = scanSoundsDirectory()
      if (mainWindow) mainWindow.webContents.send('fs-update', newTree)
    })

  startKeyboardHook()
})

app.on('will-quit', () => {
  uIOhook.stop()
})

function scanSoundsDirectory() {
  const tree = { [DEFAULT_CATEGORY]: [] }
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
      tree[DEFAULT_CATEGORY].push({
        name: item.name,
        relativePath: `默认/${item.name}`,
        absolutePath: path.join(soundsDir, item.name)
      })
    }
  })
  return tree
}
