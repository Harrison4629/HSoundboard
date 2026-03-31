<template>
  <div
    class="min-h-screen text-white p-4 font-sans flex flex-col h-screen overflow-hidden select-none transition-colors duration-300"
    :style="{
      backgroundColor: config.settings?.theme?.bgColor || '#111827',
      '--card-bg': config.settings?.theme?.cardColor || '#1f2937'
    }"
  >
    <!-- 顶部控制栏 -->
    <div class="flex justify-between items-center mb-4 shrink-0">
      <h1 class="text-xl font-bold text-blue-400">{{ t('app.title') }}</h1>
      <div class="flex gap-2">
        <button
          class="bg-gray-700/80 hover:bg-gray-600 px-3 py-1.5 rounded text-sm transition flex gap-1.5 backdrop-blur-sm"
          @click="openGlobalSettings"
        >
          {{ t('app.settings') }}
        </button>
        <button
          class="bg-red-600/90 hover:bg-red-500 px-3 py-1.5 rounded text-sm font-bold transition flex gap-1.5 shadow-lg shadow-red-900/50 backdrop-blur-sm"
          @click="panicStop"
        >
          {{ t('app.panic') }}
        </button>
      </div>
    </div>

    <!-- 声音分类主面板 -->
    <div v-if="config.settings" class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <div
        v-for="(files, category) in soundTree"
        v-show="files.length > 0"
        :key="category"
        class="mb-3"
      >
        <h2
          class="text-base text-gray-400 font-medium cursor-pointer flex items-center group hover:text-blue-400 transition-colors drop-shadow-sm"
          @click="toggleCategory(category)"
        >
          <svg
            class="w-3.5 h-3.5 mr-1.5 transition-transform duration-300 text-gray-500 group-hover:text-blue-400"
            :class="{ 'rotate-[-90deg]': config.settings.collapsedCategories[category] }"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
          {{ category }}
        </h2>

        <div
          class="grid transition-all duration-300 ease-in-out"
          :class="
            config.settings.collapsedCategories[category]
              ? 'grid-rows-[0fr] opacity-0'
              : 'grid-rows-[1fr] opacity-100'
          "
        >
          <div class="overflow-hidden">
            <div
              class="grid gap-2 pt-2 pb-2"
              :style="{
                gridTemplateColumns: `repeat(${config.settings.theme.columns}, minmax(0, 1fr))`
              }"
            >
              <div
                v-for="file in files"
                :key="file.relativePath"
                class="rounded-md p-2 cursor-pointer transition-all flex items-center justify-center text-center group relative"
                :style="{ height: config.settings.theme.cardHeight + 'px' }"
                :class="
                  playingStates.has(file.relativePath)
                    ? 'bg-blue-900/60 border border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)] text-blue-100 scale-[0.98]'
                    : 'custom-card active:scale-95 border border-gray-700/50 shadow-sm hover:shadow-md text-gray-200'
                "
                @mousedown.left="handleMouseDown(file)"
                @mouseup.left="handleMouseUp(file)"
                @mouseleave="handleMouseUp(file)"
                @contextmenu.prevent="openRightClickSettings(file)"
              >
                <div
                  v-if="getSoundConfig(file.relativePath).hotkeyNames"
                  class="absolute top-1 left-1 flex gap-0.5 pointer-events-none"
                >
                  <span
                    v-for="keyName in getSoundConfig(file.relativePath).hotkeyNames"
                    :key="keyName"
                    class="bg-black/50 border border-white/10 text-gray-300 rounded opacity-80 group-hover:opacity-100 transition-opacity backdrop-blur-md whitespace-nowrap"
                    :style="{
                      fontSize: config.settings.theme.badgeSize + 'px',
                      padding: '0.15em 0.35em',
                      lineHeight: '1.2'
                    }"
                    >{{ keyName }}</span
                  >
                </div>
                <span
                  class="font-medium text-xs truncate w-full px-1 drop-shadow-md"
                  :title="file.name"
                  >{{ file.name.replace(/\.[^/.]+$/, '') }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 按需挂载拆分出去的弹窗组件 -->
    <GlobalSettings v-if="showGlobalSettings" />
    <CardSettings v-if="showRightClickSettings" />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import GlobalSettings from './components/GlobalSettings.vue'
import CardSettings from './components/CardSettings.vue'
import {
  t,
  config,
  soundTree,
  playingStates,
  handleMouseDown,
  handleMouseUp,
  openRightClickSettings,
  toggleCategory,
  panicStop,
  openGlobalSettings,
  getSoundConfig,
  initApp,
  showGlobalSettings,
  showRightClickSettings
} from './store'

onMounted(() => {
  initApp()
})

// 监听全局 UI 缩放
watch(
  () => config.value.settings?.theme?.scale,
  (newScale) => {
    if (newScale) document.documentElement.style.fontSize = `${16 * newScale}px`
  },
  { immediate: true }
)
</script>

<style>
.custom-card {
  background-color: var(--card-bg);
}
.custom-card:hover {
  filter: brightness(1.25);
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.4);
}
</style>
