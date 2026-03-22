<template>
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
    @click.self="closeRightClickSettings"
  >
    <div class="bg-gray-800 p-5 rounded-lg border border-gray-600 w-72 shadow-2xl">
      <h3 class="text-lg text-blue-400 mb-4 truncate font-bold border-b border-gray-700 pb-2">
        🎯 {{ selectedFile.name }}
      </h3>

      <div class="mb-4">
        <label class="block text-gray-400 text-xs mb-1.5">📻 播放模式</label>
        <select
          v-model="currentConfig.mode"
          class="w-full bg-gray-700 text-white text-sm border border-gray-600 rounded p-1.5 outline-none"
          @change="updateRightClickConfig"
        >
          <option value="overlay">无限叠加</option>
          <option value="restart">局部重发</option>
          <option value="hold">长按模式 (按下播，松开停)</option>
        </select>
      </div>

      <div class="mb-5">
        <label class="block text-gray-400 text-xs mb-1.5 flex justify-between">
          <span>🔊 独立音量倍率</span
          ><span class="text-blue-400">{{ Math.round(currentConfig.volume * 100) }}%</span>
        </label>
        <input
          v-model.number="currentConfig.volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="w-full cursor-pointer accent-blue-500"
          @change="updateRightClickConfig"
        />
      </div>

      <div class="mb-6">
        <label class="block text-gray-400 text-xs mb-1.5">⌨️ 卡片快捷键</label>
        <button
          class="w-full border rounded p-1.5 text-xs transition duration-200 select-none"
          :class="
            isRecording && recordingTarget === 'sound'
              ? 'bg-blue-600 border-blue-500 text-white animate-pulse'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
          "
          @click="startRecording('sound')"
        >
          <span v-if="isRecording && recordingTarget === 'sound'">{{
            Array.from(recordingKeys)
              .map((code) => keycodeMap[code])
              .join(' + ') || '请按下组合键...'
          }}</span>
          <span v-else>{{
            currentConfig.hotkeyNames ? currentConfig.hotkeyNames.join(' + ') : '点击开始录制'
          }}</span>
        </button>
        <div v-if="!isRecording && currentConfig.hotkey" class="mt-1 text-right">
          <span
            class="text-[10px] text-red-400 cursor-pointer hover:text-red-300"
            @click="clearHotkey('sound')"
            >清除绑定</span
          >
        </div>
      </div>

      <div class="flex justify-end">
        <button
          class="bg-gray-600 hover:bg-gray-500 text-white text-sm px-5 py-1.5 rounded transition"
          @click="closeRightClickSettings"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
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
</script>
