import express from 'express'
import { networkInterfaces } from 'os'
import fs from 'fs'
import zhDict from '../renderer/src/locales/zh.json'
import enDict from '../renderer/src/locales/en.json'
const dictionaries = { zh: zhDict, en: enDict }

const expressApp = express()
let remoteServerInstance = null

let getMainWindow = null
let configFile = ''
let scanSoundsDirectory = null

export function getLocalIP() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return '127.0.0.1'
}

export function initRemoteServer(mainWindowGetter, configPath, scanFn) {
  getMainWindow = mainWindowGetter
  configFile = configPath
  scanSoundsDirectory = scanFn

  expressApp.get('/api/play', (req, res) => {
    const mainWindow = getMainWindow()
    const audioPath = req.query.path
    if (mainWindow && !mainWindow.isDestroyed() && audioPath) {
      mainWindow.webContents.send('remote-play', audioPath)
    }
    res.send({ status: 'ok' })
  })

  expressApp.get('/api/panic', (req, res) => {
    const mainWindow = getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('remote-panic')
    }
    res.send({ status: 'ok' })
  })

  expressApp.get('/', (req, res) => {
    let locale = 'zh'
    try {
      if (fs.existsSync(configFile)) {
        const conf = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
        if (conf.settings && conf.settings.locale) {
          locale = conf.settings.locale
        }
      }
    } catch (e) {
      console.error('failed to read locale configuration:', e)
    }

    const dict = dictionaries[locale]
    const t = (key) => key.split('.').reduce((obj, i) => (obj ? obj[i] : null), dict) || key

    const txtTitle = t('app.title')
    const txtPanic = t('app.panic')

    const tree = scanSoundsDirectory()
    let buttonsHtml = ''

    for (const [category, files] of Object.entries(tree)) {
      if (files.length === 0) continue

      buttonsHtml += `<h2 class="text-gray-400 text-lg font-bold mt-6 mb-3 border-b border-gray-700 pb-1">${category}</h2>`
      buttonsHtml += `<div class="grid grid-cols-3 gap-3">`
      files.forEach((file) => {
        const name = file.name.replace(/\.[^/.]+$/, '')
        buttonsHtml += `
          <button onclick="fetch('/api/play?path=${encodeURIComponent(file.relativePath)}')" 
                  class="bg-gray-800 active:bg-blue-600 active:scale-95 border border-gray-700 rounded-xl p-3 h-20 flex items-center justify-center text-center shadow-lg transition-all">
            <span class="text-gray-200 text-xs font-bold leading-tight drop-shadow-md break-all">${name}</span>
          </button>`
      })
      buttonsHtml += `</div>`
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
        <title>${txtTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>::-webkit-scrollbar { display: none; }</style>
      </head>
      <body class="bg-gray-900 text-white pt-20 pb-10 antialiased select-none">
        <div class="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 px-4 py-3 flex justify-between items-center shadow-lg">
          <h1 class="text-xl font-black text-blue-400 drop-shadow">${txtTitle}</h1>
          <button onclick="fetch('/api/panic')" class="bg-red-600 active:bg-red-700 active:scale-95 transition-all text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-red-900/50 flex items-center gap-1">
            ${txtPanic}
          </button>
        </div>
        <div class="px-4">
          ${buttonsHtml}
        </div>
      </body>
      </html>
    `)
  })
  startRemoteServerIfEnabled()
}

export function startRemoteServer(port) {
  if (remoteServerInstance) {
    remoteServerInstance.close()
    remoteServerInstance = null
  }
  try {
    remoteServerInstance = expressApp.listen(port, '0.0.0.0', () => {
      console.log(`started server on port ${port}`)
    })
  } catch (err) {
    console.error('failed to start remote server:', err)
  }
}

export function stopRemoteServer() {
  if (remoteServerInstance) {
    remoteServerInstance.close()
    remoteServerInstance = null
  }
}

function startRemoteServerIfEnabled() {
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
    if (config.settings && config.settings.remoteEnabled) {
      const port = config.settings.remotePort
      startRemoteServer(port)
    }
  } catch (e) {
    throw new Error('Failed to read config file for remote server: ' + e.message)
  }
}
