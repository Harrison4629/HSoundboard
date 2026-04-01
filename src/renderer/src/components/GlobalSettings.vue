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
            :title="t('global.close')"
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
          <span class="font-bold text-gray-200">{{ t('global.pref') }}</span>
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
            {{ t('global.tab_audio') }}
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
            {{ t('global.tab_hotkeys') }}
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
            {{ t('global.tab_theme') }}
          </button>
          <button
            :class="
              activeTab === 'remote'
                ? 'bg-gray-800 text-blue-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            "
            class="w-full text-left px-4 py-2 rounded text-sm transition"
            @click="activeTab = 'remote'"
          >
            {{ t('global.tab_remote') }}
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
            {{ t('global.tab_system') }}
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
            {{ t('global.tab_debug') }}
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
            {{ t('global.tab_info') }}
          </button>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="w-2/3 p-6 flex flex-col bg-gray-800 relative overflow-y-auto custom-scrollbar">
        <!-- 音频设置 -->
        <div v-if="activeTab === 'audio'" class="flex-1 animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-6 font-bold border-b border-gray-700 pb-2">
            {{ t('global.audio_title') }}
          </h3>
          <div class="mb-6">
            <label class="block text-gray-400 text-sm mb-2 flex justify-between"
              ><span>{{ t('global.master_vol') }}</span
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
            <label class="block text-gray-400 text-sm mb-2">{{ t('global.output_dev') }}</label>
            <select
              v-model="config.settings.outputDeviceId"
              class="w-full bg-gray-700 text-white text-sm border border-gray-600 rounded p-2 outline-none"
              @change="saveConfigToDisk"
            >
              <option value="default">{{ t('global.default_dev') }}</option>
              <option
                v-for="(device, idx) in audioDevices"
                :key="device.deviceId"
                :value="device.deviceId"
              >
                {{ device.label || `${t('global.unnamed_dev')} ${idx + 1}` }}
              </option>
            </select>
          </div>
        </div>

        <!-- 快捷键设置 -->
        <div v-if="activeTab === 'hotkeys'" class="flex-1 animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-6 font-bold border-b border-gray-700 pb-2">
            {{ t('global.hotkey_title') }}
          </h3>
          <div
            class="mb-6 bg-gray-900 border border-gray-700 rounded p-4 shadow-inner relative overflow-hidden"
          >
            <div
              class="absolute top-0 left-0 w-1 h-full"
              :class="config.settings.hookEnabled ? 'bg-blue-500' : 'bg-red-500'"
            ></div>
            <div class="flex items-start justify-between">
              <div class="pr-4">
                <h4
                  class="text-sm font-bold flex items-center gap-2 mb-1"
                  :class="config.settings.hookEnabled ? 'text-gray-200' : 'text-red-400'"
                >
                  <span>{{
                    config.settings.hookEnabled
                      ? t('global.hotkey_enabled')
                      : t('global.hotkey_disabled')
                  }}</span>
                </h4>
                <p class="text-[11px] leading-relaxed text-gray-400">
                  <span v-if="config.settings.hookEnabled">{{ t('global.hotkey_desc_on') }}</span>
                  <span v-else>{{ t('global.hotkey_desc_off') }}</span>
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  :checked="config.settings.hookEnabled"
                  class="sr-only peer"
                  @change="toggleGlobalHook"
                />
                <div
                  class="w-11 h-6 bg-red-900/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 border border-gray-600 peer-checked:border-blue-500"
                ></div>
              </label>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-gray-400 text-sm mb-2">{{ t('global.panic_stop') }}</label>
            <button
              class="w-full border rounded p-2 text-sm transition duration-200 select-none text-left flex justify-between items-center"
              :class="
                isRecording && recordingTarget === 'panic'
                  ? 'bg-blue-600 border-blue-500 text-white animate-pulse'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              "
              @click="startRecording('panic')"
            >
              <span v-if="!config.settings.hookEnabled">{{ t('hotkey.disabled') }}</span>
              <span v-else-if="isRecording && recordingTarget === 'panic'">{{
                Array.from(recordingKeys)
                  .map((code) => keycodeMap[code])
                  .join(' + ') || t('hotkey.press_key')
              }}</span>
              <span v-else>{{
                config.settings.panicHotkeyNames
                  ? config.settings.panicHotkeyNames.join(' + ')
                  : t('hotkey.click_record')
              }}</span>
            </button>
            <div v-if="!isRecording && config.settings.panicHotkey" class="mt-1.5 text-right">
              <span
                class="text-xs text-red-400 cursor-pointer hover:text-red-300"
                @click="clearHotkey('panic')"
                >{{ t('hotkey.clear') }}</span
              >
            </div>
          </div>
        </div>

        <!-- 个性化设置 -->
        <div v-if="activeTab === 'theme'" class="flex-1 animate-fade-in">
          <h3
            class="text-lg text-blue-400 mb-4 font-bold border-b border-gray-700 pb-2 flex justify-between items-center"
          >
            <span>{{ t('global.personalization') }}</span
            ><button
              class="text-xs text-gray-400 hover:text-white font-normal transition"
              @click="resetTheme"
            >
              {{ t('global.reset_default') }}
            </button>
          </h3>
          <div
            class="mb-5 flex items-center justify-between bg-gray-700/30 p-2.5 rounded border border-gray-600"
          >
            <span class="text-gray-300 text-sm">{{ t('global.lang') }}</span>
            <select
              v-model="config.settings.locale"
              class="bg-gray-800 text-white text-sm border border-gray-500 rounded p-1 outline-none"
              @change="saveConfigToDisk"
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div
              class="flex items-center justify-between bg-gray-700/30 p-2.5 rounded border border-gray-600"
            >
              <span class="text-gray-300 text-sm">{{ t('global.bg_color') }}</span>
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
              <span class="text-gray-300 text-sm">{{ t('global.card_color') }}</span>
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
              ><span>{{ t('global.columns') }}</span
              ><span class="text-blue-400 font-bold"
                >{{ config.settings.theme.columns }} {{ t('global.col_unit') }}</span
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
              ><span>↕{{ t('global.card_height') }}</span
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
              ><span>{{ t('global.badge_size') }}</span
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
              ><span>{{ t('global.ui_scale') }}</span
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
            {{ t('global.sys_title') }}
          </h3>
          <div class="bg-gray-700/50 border border-gray-600 p-4 rounded-lg flex flex-col gap-3">
            <div class="flex items-start gap-3">
              <span class="text-2xl">📁</span>
              <div>
                <h4 class="text-sm font-bold text-gray-200">{{ t('global.sys_folder') }}</h4>
                <p class="text-xs text-gray-400 mt-1">{{ t('global.sys_folder_desc') }}</p>
              </div>
            </div>
            <button
              class="bg-gray-600 hover:bg-blue-600 border border-gray-500 hover:border-blue-500 text-white text-sm px-4 py-2 rounded transition mt-2 w-full font-medium"
              @click="openDataFolder"
            >
              {{ t('global.sys_btn') }}
            </button>
          </div>
        </div>

        <!-- 开发者调试 -->
        <div v-if="activeTab === 'debug'" class="flex-1 flex flex-col animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-4 font-bold border-b border-gray-700 pb-2">
            {{ t('global.debug_title') }}
          </h3>

          <!-- 内存池与白名单展示墙 -->
          <div class="mb-4 bg-gray-900 border border-gray-700 rounded p-3 grid grid-cols-2 gap-4">
            <!-- 左侧：实时按键池 -->
            <div>
              <h4 class="text-blue-400 font-bold text-xs mb-2">{{ t('global.debug_pool') }}</h4>
              <div class="text-sm flex items-center justify-between">
                <span
                  class="text-yellow-400 font-mono bg-black px-2 py-0.5 rounded border border-gray-700 truncate max-w-[150px]"
                >
                  {{
                    activeKeys.size > 0
                      ? Array.from(activeKeys)
                          .map((code) => keycodeMap[code] || code)
                          .join(' + ')
                      : t('global.debug_empty')
                  }}
                </span>
                <button
                  class="text-[10px] bg-red-600/80 hover:bg-red-500 px-2 py-1 rounded text-white transition ml-2"
                  @click="forceClearActiveKeys"
                >
                  {{ t('global.debug_clear') }}
                </button>
              </div>
            </div>

            <!-- 右侧：当前引擎监控白名单 -->
            <div class="border-l border-gray-700 pl-4">
              <h4 class="text-green-400 font-bold text-xs mb-2">
                {{ t('global.debug_whitelist') }}
              </h4>
              <div class="flex flex-wrap gap-1 max-h-12 overflow-y-auto custom-scrollbar">
                <span
                  v-for="keyName in Array.from(whitelistedKeys)"
                  :key="keyName"
                  class="bg-gray-800 border border-gray-600 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm"
                >
                  {{ keyName }}
                </span>
                <span v-if="whitelistedKeys.size === 0" class="text-gray-500 text-[10px] italic">
                  {{ t('global.debug_wl_empty') }}
                </span>
              </div>
            </div>
          </div>

          <!-- 实时日志台 -->
          <div
            class="mb-2 flex items-center justify-between bg-gray-700/30 p-2 rounded border border-gray-600"
          >
            <div>
              <label class="block text-gray-200 text-sm">{{ t('global.debug_sniffer') }}</label>
            </div>
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
              {{ t('global.debug_log_off') }}
            </div>
            <div v-else-if="keyLogs.length === 0" class="text-gray-500 text-center mt-6">
              {{ t('global.debug_log_wait') }}
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
              {{ t('global.debug_clear_log') }}
            </button>
          </div>
        </div>

        <!-- 关于信息 -->
        <div v-if="activeTab === 'info'" class="flex-1 animate-fade-in">
          <h3 class="text-lg text-blue-400 mb-6 font-bold border-b border-gray-700 pb-2">
            {{ t('global.info_title') }}
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

        <!-- 📱 手机远程控制 -->
        <div v-if="activeTab === 'remote'" class="flex-1 animate-fade-in flex flex-col">
          <h3 class="text-lg text-blue-400 mb-6 font-bold border-b border-gray-700 pb-2">
            {{ t('global.remote_control') }}
          </h3>

          <div
            class="mb-4 flex items-center justify-between bg-gray-900 border border-gray-700 rounded p-3 shadow-sm"
          >
            <div>
              <label class="block text-gray-200 text-sm mb-1">
                {{ t('global.remote_enable') }}</label
              >
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="config.settings.remoteEnabled"
                type="checkbox"
                class="sr-only peer"
                @change="toggleRemoteServer"
              />
              <div
                class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"
              ></div>
            </label>
          </div>

          <div
            class="mb-6 flex items-center justify-between bg-gray-900 border border-gray-700 rounded p-3 shadow-sm transition-opacity"
            :class="!config.settings.remoteEnabled ? 'opacity-40 pointer-events-none' : ''"
          >
            <div>
              <label class="block text-gray-200 text-sm mb-1">{{ t('global.remote_port') }}</label>
            </div>
            <input
              v-model.number="config.settings.remotePort"
              type="number"
              class="bg-gray-800 text-white text-sm border border-gray-600 rounded p-1.5 outline-none w-24 text-center"
              min="1024"
              max="65535"
              @change="toggleRemoteServer"
            />
          </div>

          <div
            v-if="config.settings.remoteEnabled"
            class="flex-1 flex flex-col items-center justify-center bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-inner text-center relative"
          >
            <h4 class="text-gray-200 font-bold mb-2">{{ t('global.scan_qr_code') }}</h4>
            <p class="text-xs text-gray-400 mb-6 max-w-[85%] leading-relaxed">
              {{ t('global.remote_desc') }}
            </p>

            <div
              class="bg-white p-3 rounded-xl shadow-lg mb-4 hover:scale-105 transition-transform"
            >
              <qrcode-vue :value="remoteServerUrl" :size="160" level="M" />
            </div>

            <p
              class="text-xs text-gray-500 font-mono bg-gray-800 px-3 py-1.5 rounded border border-gray-700 bottom-3"
            >
              {{ t('global.remoteServerUrl') }}
              <span class="text-blue-300 font-bold">{{ remoteServerUrl }}</span>
            </p>
          </div>

          <div
            v-else
            class="flex-1 flex flex-col items-center justify-center bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-inner text-center"
          >
            <span class="text-4xl mb-4 opacity-50 filter grayscale">📡</span>
            <h4 class="text-gray-400 font-bold mb-2">{{ t('global.remote_off') }}</h4>
            <p class="text-xs text-gray-500">{{ t('global.remote_off_desc') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
import {
  t,
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
  forceClearActiveKeys,
  toggleGlobalHook,
  remoteServerUrl,
  toggleRemoteServer
} from '../store'

const activeTab = ref('audio')
</script>
