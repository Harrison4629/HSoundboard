<template>
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
    @click.self="closeGlobalSettings"
  >
    <div
      class="bg-gray-800 rounded-xl border border-gray-600 w-[680px] h-[480px] flex overflow-hidden shadow-2xl transform transition-all scale-100"
    >
      <!-- 左侧 Tab 导航 -->
      <div class="w-1/3 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div class="p-3 border-b border-gray-700 flex items-center gap-2 select-none">
          <button
            class="text-gray-400 hover:text-white hover:bg-gray-700 p-1.5 rounded transition flex items-center justify-center group"
            title="返回/关闭"
            @click="closeGlobalSettings"
          >
            <svg
              class="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
          <span class="font-bold text-gray-200">偏好设置</span>
        </div>

        <div class="flex-1 p-2 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
          <button
            :class="
              activeTab === 'audio'
                ? 'bg-gray-800 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            "
            class="w-full text-left px-4 py-2 rounded text-sm transition"
            @click="activeTab = 'audio'"
          >
            🔊 音频设置
          </button>
          <button
            :class="
              activeTab === 'hotkeys'
                ? 'bg-gray-800 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            "
            class="w-full text-left px-4 py-2 rounded text-sm transition"
            @click="activeTab = 'hotkeys'"
          >
            ⌨️ 全局快捷键
          </button>
          <button
            :class="
              activeTab === 'theme'
                ? 'bg-gray-800 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            "
            class="w-full text-left px-4 py-2 rounded text-sm transition"
            @click="activeTab = 'theme'"
          >
            🎨 个性化外观
          </button>
          <button
            :class="
              activeTab === 'system'
                ? 'bg-gray-800 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            "
            class="w-full text-left px-4 py-2 rounded text-sm transition"
            @click="activeTab = 'system'"
          >
            📁 系统与目录
          </button>
          <button
            :class="
              activeTab === 'debug'
                ? 'bg-gray-800 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            "
            class="w-full text-left px-4 py-2 rounded text-sm transition"
            @click="activeTab = 'debug'"
          >
            🐛 开发者调试
          </button>
          <button
            :class="
              activeTab === 'info'
                ? 'bg-gray-800 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            "
            class="w-full text-left px-4 py-2 rounded text-sm transition"
            @click="activeTab = 'info'"
          >
            ℹ️ 关于软件
          </button>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="w-2/3 p-6 flex flex-col bg-gray-800 relative overflow-y-auto custom-scrollbar">
        <!-- 音频设置 -->
        <div v-if="activeTab === 'audio'" class="flex-1 animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-6 font-bold border-b border-gray-700 pb-2">
            音频引擎设置
          </h3>
          <div class="mb-6">
            <label class="block text-gray-400 text-sm mb-2 flex justify-between"
              ><span>🔊 软件主音量</span
              ><span class="text-blue-400"
                >{{ Math.round(config.settings.masterVolume * 100) }}%</span
              ></label
            >
            <input
              v-model.number="config.settings.masterVolume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="w-full cursor-pointer accent-blue-500"
              @change="saveConfigToDisk"
            />
          </div>
          <div class="mb-6">
            <label class="block text-gray-400 text-sm mb-2">📢 指定输出设备</label>
            <select
              v-model="config.settings.outputDeviceId"
              class="w-full bg-gray-700 text-white text-sm border border-gray-600 rounded p-2 outline-none"
              @change="saveConfigToDisk"
            >
              <option value="default">默认系统设备</option>
              <option
                v-for="(device, idx) in audioDevices"
                :key="device.deviceId"
                :value="device.deviceId"
              >
                {{ device.label || `未命名设备 ${idx + 1}` }}
              </option>
            </select>
          </div>
        </div>

        <!-- 快捷键设置 -->
        <div v-if="activeTab === 'hotkeys'" class="flex-1 animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-6 font-bold border-b border-gray-700 pb-2">
            系统级热键
          </h3>
          <div class="mb-6">
            <label class="block text-gray-400 text-sm mb-2">🛑 一键静音 (Panic Stop)</label>
            <button
              class="w-full border rounded p-2 text-sm transition duration-200 select-none text-left flex justify-between items-center"
              :class="
                isRecording && recordingTarget === 'panic'
                  ? 'bg-blue-600 border-blue-500 text-white animate-pulse'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              "
              @click="startRecording('panic')"
            >
              <span v-if="isRecording && recordingTarget === 'panic'">{{
                Array.from(recordingKeys)
                  .map((code) => keycodeMap[code])
                  .join(' + ') || '请按下组合键...'
              }}</span>
              <span v-else>{{
                config.settings.panicHotkeyNames
                  ? config.settings.panicHotkeyNames.join(' + ')
                  : '点击绑定全局静音按键'
              }}</span>
            </button>
            <div v-if="!isRecording && config.settings.panicHotkey" class="mt-1.5 text-right">
              <span
                class="text-xs text-red-400 cursor-pointer hover:text-red-300"
                @click="clearHotkey('panic')"
                >清除绑定</span
              >
            </div>
          </div>
        </div>

        <!-- 个性化设置 -->
        <div v-if="activeTab === 'theme'" class="flex-1 animate-fade-in">
          <h3
            class="text-lg text-blue-400 mb-4 font-bold border-b border-gray-700 pb-2 flex justify-between items-center"
          >
            <span>个性化与布局</span
            ><button
              class="text-xs text-gray-400 hover:text-white font-normal transition"
              @click="resetTheme"
            >
              恢复默认
            </button>
          </h3>
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div
              class="flex items-center justify-between bg-gray-700/30 p-2.5 rounded border border-gray-600"
            >
              <span class="text-gray-300 text-sm">主背景色</span>
              <input
                v-model="config.settings.theme.bgColor"
                type="color"
                class="w-8 h-8 cursor-pointer rounded bg-transparent border-0 p-0"
                @change="saveConfigToDisk"
              />
            </div>
            <div
              class="flex items-center justify-between bg-gray-700/30 p-2.5 rounded border border-gray-600"
            >
              <span class="text-gray-300 text-sm">卡片底色</span>
              <input
                v-model="config.settings.theme.cardColor"
                type="color"
                class="w-8 h-8 cursor-pointer rounded bg-transparent border-0 p-0"
                @change="saveConfigToDisk"
              />
            </div>
          </div>
          <div class="mb-5">
            <label class="block text-gray-300 text-sm mb-1.5 flex justify-between"
              ><span>🔲 横向排列密度</span
              ><span class="text-blue-400 font-bold"
                >{{ config.settings.theme.columns }} 列</span
              ></label
            ><input
              v-model.number="config.settings.theme.columns"
              type="range"
              min="2"
              max="12"
              step="1"
              class="w-full cursor-pointer accent-blue-500"
              @change="saveConfigToDisk"
            />
          </div>
          <div class="mb-5">
            <label class="block text-gray-300 text-sm mb-1.5 flex justify-between"
              ><span>↕️ 独立卡片高度</span
              ><span class="text-blue-400 font-bold"
                >{{ config.settings.theme.cardHeight }} px</span
              ></label
            ><input
              v-model.number="config.settings.theme.cardHeight"
              type="range"
              min="40"
              max="150"
              step="2"
              class="w-full cursor-pointer accent-blue-500"
              @change="saveConfigToDisk"
            />
          </div>
          <div class="mb-5">
            <label class="block text-gray-300 text-sm mb-1.5 flex justify-between"
              ><span>🏷️ 角标字号</span
              ><span class="text-blue-400 font-bold"
                >{{ config.settings.theme.badgeSize }} px</span
              ></label
            ><input
              v-model.number="config.settings.theme.badgeSize"
              type="range"
              min="6"
              max="20"
              step="1"
              class="w-full cursor-pointer accent-blue-500"
              @change="saveConfigToDisk"
            />
          </div>
          <div class="mb-6">
            <label class="block text-gray-300 text-sm mb-1.5 flex justify-between"
              ><span>🔍 全局界面缩放</span
              ><span class="text-blue-400 font-bold"
                >{{ Math.round(config.settings.theme.scale * 100) }}%</span
              ></label
            ><input
              v-model.number="config.settings.theme.scale"
              type="range"
              min="0.6"
              max="1.4"
              step="0.05"
              class="w-full cursor-pointer accent-blue-500"
              @change="saveConfigToDisk"
            />
          </div>
        </div>

        <!-- 系统与目录 -->
        <div v-if="activeTab === 'system'" class="flex-1 animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-6 font-bold border-b border-gray-700 pb-2">
            存储与目录
          </h3>
          <div class="bg-gray-700/50 border border-gray-600 p-4 rounded-lg flex flex-col gap-3">
            <div class="flex items-start gap-3">
              <span class="text-2xl">📁</span>
              <div>
                <h4 class="text-sm font-bold text-gray-200">本地数据文件夹</h4>
                <p class="text-xs text-gray-400 mt-1">所有音频文件和 config.json 均存储于此。</p>
              </div>
            </div>
            <button
              class="bg-gray-600 hover:bg-blue-600 border border-gray-500 hover:border-blue-500 text-white text-sm px-4 py-2 rounded transition mt-2 w-full font-medium"
              @click="openDataFolder"
            >
              在资源管理器中打开 Data 文件夹
            </button>
          </div>
        </div>

        <!-- 开发者调试 -->
        <div v-if="activeTab === 'debug'" class="flex-1 flex flex-col animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-4 font-bold border-b border-gray-700 pb-2">
            系统底层事件监听 (Sniffer)
          </h3>

          <!-- 内存池与白名单展示墙 -->
          <div class="mb-4 bg-gray-900 border border-gray-700 rounded p-3 grid grid-cols-2 gap-4">
            <!-- 左侧：实时按键池 -->
            <div>
              <h4 class="text-blue-400 font-bold text-xs mb-2">🧠 实时被按住的键</h4>
              <div class="text-sm flex items-center justify-between">
                <span
                  class="text-yellow-400 font-mono bg-black px-2 py-0.5 rounded border border-gray-700 truncate max-w-[150px]"
                >
                  {{
                    activeKeys.size > 0
                      ? Array.from(activeKeys)
                          .map((code) => keycodeMap[code] || code)
                          .join(' + ')
                      : '无 (Empty)'
                  }}
                </span>
                <button
                  class="text-[10px] bg-red-600/80 hover:bg-red-500 px-2 py-1 rounded text-white transition ml-2"
                  @click="forceClearActiveKeys"
                >
                  清空
                </button>
              </div>
            </div>

            <!-- 右侧：当前引擎监控白名单 -->
            <div class="border-l border-gray-700 pl-4">
              <h4 class="text-green-400 font-bold text-xs mb-2">🟢 当前引擎监控白名单</h4>
              <div class="flex flex-wrap gap-1 max-h-12 overflow-y-auto custom-scrollbar">
                <span
                  v-for="keyName in Array.from(whitelistedKeys)"
                  :key="keyName"
                  class="bg-gray-800 border border-gray-600 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm"
                >
                  {{ keyName }}
                </span>
                <span v-if="whitelistedKeys.size === 0" class="text-gray-500 text-[10px] italic"
                  >暂无绑定快捷键，全静默模式</span
                >
              </div>
            </div>
          </div>

          <!-- 实时日志台 -->
          <div
            class="mb-2 flex items-center justify-between bg-gray-700/30 p-2 rounded border border-gray-600"
          >
            <div><label class="block text-gray-200 text-sm">开启底层硬中断嗅探</label></div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="config.settings.debugMode"
                type="checkbox"
                class="sr-only peer"
                @change="saveConfigToDisk"
              />
              <div
                class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"
              ></div>
            </label>
          </div>
          <div
            class="flex-1 bg-black/50 border border-gray-700 rounded p-3 overflow-y-auto font-mono text-xs flex flex-col gap-1 custom-scrollbar min-h-[140px] shadow-inner relative"
          >
            <div v-if="!config.settings.debugMode" class="text-gray-500 text-center mt-6">
              请先开启上方开关...
            </div>
            <div v-else-if="keyLogs.length === 0" class="text-gray-500 text-center mt-6">
              等待系统按键触发... (将显示所有被拦截和被放行的按键)
            </div>
            <div
              v-for="log in keyLogs"
              :key="log.id"
              class="flex items-center gap-3 border-b border-gray-800/80 pb-1.5 pt-1 hover:bg-gray-800/50 transition-colors"
              :class="!whitelistedKeys.has(log.name) ? 'opacity-40' : ''"
            >
              <span class="text-gray-600">[{{ log.time }}]</span>
              <span
                :class="
                  log.action === 'DOWN'
                    ? 'text-green-400 bg-green-400/10'
                    : log.action === 'UP'
                      ? 'text-orange-400 bg-orange-400/10'
                      : 'text-blue-400 bg-blue-400/10'
                "
                class="px-1.5 py-0.5 rounded w-12 text-center"
                >{{ log.action }}</span
              >
              <span class="text-blue-300 font-bold w-16">{{ log.name }}</span
              ><span class="text-gray-500">|</span
              ><span class="text-gray-400"
                >Code/Msg: <span class="text-gray-200">{{ log.code }}</span></span
              >
              <!-- 标识出是被丢弃的键 -->
              <span
                v-if="!whitelistedKeys.has(log.name) && log.action !== 'SYS'"
                class="ml-auto text-red-500/80 text-[10px] border border-red-500/30 px-1 rounded"
                >IGNORED</span
              >
            </div>
          </div>
          <div class="mt-2 text-right">
            <button
              class="text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded hover:bg-gray-700"
              @click="clearKeyLogs"
            >
              🗑️ 清空日志
            </button>
          </div>
        </div>

        <!-- 关于信息 -->
        <div v-if="activeTab === 'info'" class="flex-1 animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-6 font-bold border-b border-gray-700 pb-2">
            关于 Soundboard
          </h3>
          <div class="space-y-3 text-sm text-gray-300">
            <p><strong class="text-gray-400 inline-block w-24">Version</strong> v1.0.0</p>
            <p>
              <strong class="text-gray-400 inline-block w-24">Core Engine</strong> Electron +
              Node.js
            </p>
            <p>
              <strong class="text-gray-400 inline-block w-24">UI Framework</strong> Vue 3 +
              TailwindCSS
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  config,
  audioDevices,
  isRecording,
  recordingTarget,
  recordingKeys,
  keycodeMap,
  keyLogs,
  closeGlobalSettings,
  saveConfigToDisk,
  startRecording,
  clearHotkey,
  resetTheme,
  openDataFolder,
  clearKeyLogs,
  activeKeys,
  whitelistedKeys,
  forceClearActiveKeys
} from '../store'

// 只有 activeTab 是只在这个组件内部使用的局部变量
const activeTab = ref('audio')
</script>
