<template>
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
    @click.self="closeRightClickSettings"
  >
    <div
      class="bg-gray-800 p-5 rounded-lg border border-gray-600 w-[min(288px,calc(100vw-24px))] max-h-[calc(100vh-24px)] overflow-y-auto shadow-2xl"
    >
      <h3 class="text-lg text-blue-400 mb-4 truncate font-bold border-b border-gray-700 pb-2">
        🎯 {{ selectedFile.name }}
      </h3>

      <div class="mb-4">
        <label class="block text-gray-400 text-xs mb-1.5">{{ t('card.play_mode') }}</label>
        <AppSelect
          v-model="currentConfig.mode"
          :options="playbackModeOptions"
          @change="updateRightClickConfig"
        />
      </div>

      <div class="mb-5">
        <label class="block text-gray-400 text-xs mb-1.5 flex justify-between">
          <span>{{ t('card.volume') }}</span>
          <span class="text-blue-400">{{ currentConfig.volume }} dB</span>
        </label>
        <input
          v-model.number="currentConfig.volume"
          type="range"
          min="-20"
          max="20"
          step="1"
          class="w-full cursor-pointer accent-blue-500"
          @change="updateRightClickConfig"
        />
      </div>

      <div class="mb-6">
        <label class="block text-gray-400 text-xs mb-1.5">{{ t('card.hotkey') }}</label>
        <button
          class="w-full border rounded p-1.5 text-xs transition duration-200 select-none"
          :class="
            !config.settings.hookEnabled
              ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
              : isRecording && recordingTarget === 'sound'
                ? 'bg-blue-600 border-blue-500 text-white animate-pulse'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
          "
          @click="config.settings.hookEnabled ? startRecording('sound') : null"
        >
          <span v-if="!config.settings.hookEnabled">{{ t('hotkey.disabled') }}</span>
          <span v-else-if="isRecording && recordingTarget === 'sound'">{{
            Array.from(recordingKeys)
              .map((code) => keycodeMap[code])
              .join(' + ') || t('hotkey.press_key')
          }}</span>
          <span v-else>{{
            currentConfig.hotkeyNames
              ? currentConfig.hotkeyNames.join(' + ')
              : t('hotkey.click_record')
          }}</span>
        </button>
        <div
          v-if="config.settings.hookEnabled && !isRecording && currentConfig.hotkey"
          class="mt-1 text-right"
        >
          <span
            class="text-[10px] text-red-400 cursor-pointer hover:text-red-300"
            @click="clearHotkey('sound')"
            >{{ t('hotkey.clear') }}</span
          >
        </div>
      </div>

      <div class="flex justify-end">
        <button
          class="bg-gray-600 hover:bg-gray-500 text-white text-sm px-5 py-1.5 rounded transition"
          @click="closeRightClickSettings"
        >
          {{ t('card.done') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppSelect from './AppSelect.vue'
import {
  t,
  config,
  selectedFile,
  currentConfig,
  isRecording,
  recordingTarget,
  recordingKeys,
  keycodeMap,
  closeRightClickSettings,
  updateRightClickConfig,
  startRecording,
  clearHotkey
} from '../store'

const playbackModeOptions = computed(() => [
  { value: 'overlay', label: t('card.mode_overlay') },
  { value: 'restart', label: t('card.mode_restart') },
  { value: 'hold', label: t('card.mode_hold') }
])
</script>
