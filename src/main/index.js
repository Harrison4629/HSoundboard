import { app, BrowserWindow, ipcMain, protocol, net, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import chokidar from 'chokidar'
import { pathToFileURL } from 'url'
import { GlobalKeyboardListener } from 'node-global-key-listener'

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
if (!fs.existsSync(configFile))
  fs.writeFileSync(configFile, JSON.stringify({ sounds: {}, settings: {} }))

let mainWindow
let vGKL

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

function startKeyboardHook() {
  try {
    if (vGKL) vGKL.kill() // 杀掉旧的子进程

    vGKL = new GlobalKeyboardListener({
      windows: { customServer: false } // 使用默认的高性能底层服务
    })

    vGKL.addListener((event) => {
      let rawName = event.name || ''
      let cleanName = rawName

      const keyMap = {
        'LEFT CTRL': 'LCtrl',
        'RIGHT CTRL': 'RCtrl',
        'LEFT SHIFT': 'LShift',
        'RIGHT SHIFT': 'RShift',
        'LEFT ALT': 'LAlt',
        'RIGHT ALT': 'RAlt',
        'LEFT META': 'LWin',
        'RIGHT META': 'RWin',
        RETURN: 'Enter',
        ESCAPE: 'Esc',
        SPACE: 'Space',
        TAB: 'Tab',
        'CAPS LOCK': 'Caps',
        BACKSPACE: 'Back',
        'UP ARROW': 'Up',
        'DOWN ARROW': 'Down',
        'LEFT ARROW': 'Left',
        'RIGHT ARROW': 'Right'
      }

      // 如果是修饰键或特殊键，映射为极客简称；否则普通字母首字母大写
      if (keyMap[rawName]) {
        cleanName = keyMap[rawName]
      } else {
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
      }

      // 构建发送给前端的 Payload 数据
      const payload = { keycode: event.vKey, keyName: cleanName }

      // 发送给 Vue 前端
      if (event.state === 'DOWN') {
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.webContents.send('global-keydown', payload)
      } else if (event.state === 'UP') {
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.webContents.send('global-keyup', payload)
      }
    })
    console.log('Successfully started global keyboard hook.')
  } catch (err) {
    console.error('Failed to start global keyboard hook:', err)
  }
}

app.whenReady().then(() => {
  createWindow()

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
  ipcMain.on('save-config', (e, config) => {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
  })
  ipcMain.on('open-data-folder', () => {
    shell.openPath(dataDir)
  })

  ipcMain.on('restart-hook', () => {
    console.log('🔄 收到前端指令，正在强制重启键盘钩子...')
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
  if (vGKL) vGKL.kill()
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
