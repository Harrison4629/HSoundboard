import { ref, reactive } from 'vue'

export const defaultTheme = {
  bgColor: '#111827',
  cardColor: '#1f2937',
  scale: 1.0,
  columns: 6,
  cardHeight: 64,
  badgeSize: 8,
  titleSize: 12
}
export const config = ref({ sounds: {}, settings: null })
export const soundTree = ref({})
export const fileFlatMap = ref({})
export const audioDevices = ref([])
export const playingStates = reactive(new Map())
export const keyLogs = ref([])

export const activeKeys = ref(new Set())
export const recordingKeys = ref(new Set())
export const keycodeMap = ref({})
export const isRecording = ref(false)
export const recordingTarget = ref(null)

export const whitelistedKeys = ref(new Set())

export const showGlobalSettings = ref(false)
export const showRightClickSettings = ref(false)
export const selectedFile = ref(null)
export const currentConfig = ref({ mode: 'restart', volume: 1.0 })

const activeAudios = new Map()
const allAudios = new Set()

export const getSoundConfig = (relativePath) =>
  config.value.sounds[relativePath] || { volume: 1.0, mode: 'restart' }

const isActiveMode = (mode) => mode === 'restart' || mode === 'hold'
export const saveConfigToDisk = () => window.api.saveConfig(config.value)

export const rebuildWhitelist = () => {
  whitelistedKeys.value.clear()

  Object.values(config.value.sounds).forEach((conf) => {
    if (conf.hotkeyNames) conf.hotkeyNames.forEach((name) => whitelistedKeys.value.add(name))
  })
  // 提取全局静音绑定的快捷键
  if (config.value.settings.panicHotkeyNames) {
    config.value.settings.panicHotkeyNames.forEach((name) => whitelistedKeys.value.add(name))
  }
}

export const updateFileFlatMap = (tree) => {
  const map = {}
  Object.values(tree).forEach((files) => files.forEach((f) => (map[f.relativePath] = f)))
  fileFlatMap.value = map
  if (config.value && config.value.sounds) {
    let hasOrphanedData = false
    for (const path in config.value.sounds) {
      if (!map[path]) {
        delete config.value.sounds[path]
        hasOrphanedData = true
      }
    }
    if (hasOrphanedData) saveConfigToDisk()
  }
}

export const addKeyLog = (action, name, code) => {
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
  keyLogs.value.unshift({ id: Date.now() + Math.random(), time: timeStr, action, name, code })
  if (keyLogs.value.length > 60) keyLogs.value.pop()
}
export const clearKeyLogs = () => {
  keyLogs.value = []
}
export const openDataFolder = () => window.api.openDataFolder()
export const resetTheme = () => {
  config.value.settings.theme = { ...defaultTheme }
  saveConfigToDisk()
}

export const enginePlay = async (file, conf) => {
  const src = `local://${encodeURIComponent(file.absolutePath)}`
  if (conf.mode === 'restart' && activeAudios.has(file.relativePath)) {
    const ex = activeAudios.get(file.relativePath)
    ex.currentTime = 0
    ex.play()
    return
  }
  if (conf.mode === 'hold' && activeAudios.has(file.relativePath)) return

  const audio = new Audio(src)
  const masterVol = config.value.settings?.masterVolume ?? 1.0
  audio.volume = Math.max(0, Math.min(1, (conf.volume || 1.0) * masterVol))
  const deviceId = config.value.settings?.outputDeviceId
  if (deviceId && deviceId !== 'default') {
    try {
      if (typeof audio.setSinkId === 'function') await audio.setSinkId(deviceId)
    } catch (e) {
      console.warn('Failed to set audio sink:', e)
    }
  }

  const count = playingStates.get(file.relativePath) || 0
  playingStates.set(file.relativePath, count + 1)
  audio.play().catch((e) => console.warn('Audio play failed:', e))
  allAudios.add(audio)
  if (isActiveMode(conf.mode)) activeAudios.set(file.relativePath, audio)
  audio.onended = () => {
    allAudios.delete(audio)
    if (isActiveMode(conf.mode)) activeAudios.delete(file.relativePath)
    const c = playingStates.get(file.relativePath) || 0
    if (c <= 1) playingStates.delete(file.relativePath)
    else playingStates.set(file.relativePath, c - 1)
  }
}
export const engineStop = (relativePath) => {
  if (activeAudios.has(relativePath)) {
    const audio = activeAudios.get(relativePath)
    audio.pause()
    audio.currentTime = 0
    activeAudios.delete(relativePath)
    allAudios.delete(audio)
    playingStates.delete(relativePath)
  }
}
export const panicStop = () => {
  allAudios.forEach((a) => {
    a.pause()
    a.currentTime = 0
  })
  allAudios.clear()
  activeAudios.clear()
  playingStates.clear()
}

export const handleMouseDown = (file) => enginePlay(file, getSoundConfig(file.relativePath))
export const handleMouseUp = (file) => {
  if (getSoundConfig(file.relativePath).mode === 'hold') engineStop(file.relativePath)
}

const getWeight = (code) => {
  const name = keycodeMap.value[code] || ''
  if (/Ctrl/i.test(name)) return 1
  if (/Shift/i.test(name)) return 2
  if (/Alt/i.test(name)) return 3
  if (/Meta|Win|Cmd/i.test(name)) return 4
  return 10
}
const sortKeysArray = (keysArray) =>
  [...keysArray].sort((a, b) => {
    const wA = getWeight(a)
    const wB = getWeight(b)
    if (wA !== wB) return wA - wB
    return a - b
  })

export const triggerHotkeys = (action, changedKeyCode) => {
  const currentSortedStr = sortKeysArray(Array.from(activeKeys.value)).join('+')
  if (
    action === 'down' &&
    config.value.settings.panicHotkey &&
    currentSortedStr === config.value.settings.panicHotkey.join('+')
  ) {
    panicStop()
    return
  }
  for (const [path, conf] of Object.entries(config.value.sounds)) {
    if (!conf.hotkey || conf.hotkey.length === 0) continue
    if (action === 'down' && currentSortedStr === conf.hotkey.join('+')) {
      const file = fileFlatMap.value[path]
      if (file) enginePlay(file, conf)
    } else if (action === 'up' && conf.mode === 'hold' && conf.hotkey.includes(changedKeyCode)) {
      engineStop(path)
    }
  }
}

export const setupGlobalHotkeys = () => {
  window.api.onGlobalKeyDown((e) => {
    if (config.value.settings?.debugMode) addKeyLog('DOWN', e.keyName, e.keycode)

    if (isRecording.value) {
      keycodeMap.value[e.keycode] = e.keyName
      recordingKeys.value.add(e.keycode)
      return
    }

    if (!whitelistedKeys.value.has(e.keyName)) return

    if (activeKeys.value.has(e.keycode)) return
    keycodeMap.value[e.keycode] = e.keyName
    activeKeys.value.add(e.keycode)
    triggerHotkeys('down', e.keycode)
  })

  window.api.onGlobalKeyUp((e) => {
    if (config.value.settings?.debugMode) addKeyLog('UP', e.keyName, e.keycode)

    if (isRecording.value) {
      if (recordingKeys.value.size > 0) finishRecording()
      return
    }

    if (!whitelistedKeys.value.has(e.keyName)) return

    triggerHotkeys('up', e.keycode)
    activeKeys.value.delete(e.keycode)
  })
}

export const startRecording = (target) => {
  if (isRecording.value) return
  activeKeys.value.clear()
  recordingKeys.value.clear()
  recordingTarget.value = target
  isRecording.value = true
}
export const finishRecording = () => {
  isRecording.value = false
  const sortedCodes = sortKeysArray(Array.from(recordingKeys.value))
  const names = sortedCodes.map((code) => keycodeMap.value[code])
  if (recordingTarget.value === 'panic') {
    config.value.settings.panicHotkey = sortedCodes
    config.value.settings.panicHotkeyNames = names
    saveConfigToDisk()
  } else if (recordingTarget.value === 'sound') {
    currentConfig.value.hotkey = sortedCodes
    currentConfig.value.hotkeyNames = names
    updateRightClickConfig()
  }
  recordingKeys.value.clear()
  recordingTarget.value = null

  rebuildWhitelist()
}

export const clearHotkey = (target) => {
  if (target === 'panic') {
    delete config.value.settings.panicHotkey
    delete config.value.settings.panicHotkeyNames
    saveConfigToDisk()
  } else if (target === 'sound') {
    delete currentConfig.value.hotkey
    delete currentConfig.value.hotkeyNames
    updateRightClickConfig()
  }

  rebuildWhitelist()
}

export const restartHook = () => window.api.restartHook()
export const forceClearActiveKeys = () => activeKeys.value.clear()
export const toggleCategory = (category) => {
  config.value.settings.collapsedCategories[category] =
    !config.value.settings.collapsedCategories[category]
  saveConfigToDisk()
}
export const openGlobalSettings = async () => {
  showGlobalSettings.value = true
}
export const closeGlobalSettings = () => {
  showGlobalSettings.value = false
  if (isRecording.value && recordingTarget.value === 'panic') {
    isRecording.value = false
    recordingTarget.value = null
  }
}
export const openRightClickSettings = (file) => {
  selectedFile.value = file
  currentConfig.value = JSON.parse(JSON.stringify(getSoundConfig(file.relativePath)))
  showRightClickSettings.value = true
}
export const closeRightClickSettings = () => {
  showRightClickSettings.value = false
  if (isRecording.value && recordingTarget.value === 'sound') {
    isRecording.value = false
    recordingTarget.value = null
  }
  setTimeout(() => {
    selectedFile.value = null
  }, 200)
}
export const updateRightClickConfig = () => {
  if (!selectedFile.value) return
  config.value.sounds[selectedFile.value.relativePath] = JSON.parse(
    JSON.stringify(currentConfig.value)
  )
  saveConfigToDisk()
  rebuildWhitelist()
}

export const initApp = async () => {
  const rawConfig = await window.api.getConfig()
  config.value = {
    sounds: rawConfig.sounds || {},
    settings: {
      masterVolume: 1.0,
      outputDeviceId: 'default',
      debugMode: false,
      collapsedCategories: {},
      ...(rawConfig.settings || {}),
      theme: { ...defaultTheme, ...(rawConfig.settings?.theme || {}) }
    }
  }
  Object.values(config.value.sounds).forEach((conf) => {
    if (conf.hotkey && conf.hotkeyNames)
      conf.hotkey.forEach((code, i) => {
        keycodeMap.value[code] = conf.hotkeyNames[i]
      })
  })
  if (config.value.settings.panicHotkey && config.value.settings.panicHotkeyNames) {
    config.value.settings.panicHotkey.forEach((code, i) => {
      keycodeMap.value[code] = config.value.settings.panicHotkeyNames[i]
    })
  }

  rebuildWhitelist()

  setupGlobalHotkeys()
  window.api.onMainLog((msg) => {
    addKeyLog('SYS', 'Main', msg)
  })

  soundTree.value = await window.api.getSoundsTree()
  updateFileFlatMap(soundTree.value)
  window.api.onFsUpdate((newTree) => {
    soundTree.value = newTree
    updateFileFlatMap(newTree)
  })
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioDevices.value = devices.filter((d) => d.kind === 'audiooutput')
  } catch (e) {
    console.warn('Failed to enumerate audio devices in init:', e)
  }
}
