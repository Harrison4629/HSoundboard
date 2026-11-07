<template>
  <div ref="root" class="relative w-full">
    <button
      ref="trigger"
      type="button"
      class="flex w-full items-center justify-between gap-3 rounded border border-gray-600 bg-gray-700 px-3 py-2 text-left text-sm text-white transition-colors hover:border-gray-500 hover:bg-gray-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      :aria-activedescendant="isOpen ? activeOptionId : undefined"
      aria-haspopup="listbox"
      @click="toggleMenu"
      @keydown.down.prevent="moveActive(1)"
      @keydown.up.prevent="moveActive(-1)"
      @keydown.enter.prevent="chooseActive"
      @keydown.esc="closeMenu"
    >
      <span class="min-w-0 truncate">{{ selectedLabel }}</span>
      <svg
        class="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <Teleport to="body">
      <Transition name="select-popover">
        <div
          v-if="isOpen"
          :id="listboxId"
          ref="menu"
          class="fixed z-[100] overflow-y-auto rounded-md border border-gray-600 bg-gray-800 p-1 shadow-2xl shadow-black/40 ring-1 ring-black/20"
          :style="menuStyle"
          role="listbox"
          :aria-activedescendant="activeOptionId"
          @pointerdown.prevent
          @keydown.down.prevent="moveActive(1)"
          @keydown.up.prevent="moveActive(-1)"
          @keydown.enter.prevent="chooseActive"
          @keydown.esc="closeMenu"
        >
          <button
            v-for="(option, index) in options"
            :id="optionId(index)"
            :key="option.value"
            type="button"
            role="option"
            :aria-selected="option.value === modelValue"
            class="flex min-h-9 w-full items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-sm transition-colors"
            :class="
              index === activeIndex
                ? 'bg-blue-500/20 text-blue-100'
                : option.value === modelValue
                  ? 'text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            "
            @mouseenter="activeIndex = index"
            @click="selectOption(option)"
          >
            <span class="min-w-0 break-words">{{ option.label }}</span>
            <svg
              v-if="option.value === modelValue"
              class="h-4 w-4 shrink-0 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.563a1 1 0 0 1-1.42.004l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.793-6.85a1 1 0 0 1 1.417-.007Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true }
})

const emit = defineEmits(['update:modelValue', 'change'])
const root = ref(null)
const trigger = ref(null)
const menu = ref(null)
const selectId = useId()
const isOpen = ref(false)
const activeIndex = ref(0)
const menuStyle = ref({})
const selectedLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label ?? ''
)
const activeOptionId = computed(() => optionId(activeIndex.value))
const listboxId = `app-select-${selectId}-listbox`

function optionId(index) {
  return `app-select-${selectId}-option-${index}`
}

function updateMenuPosition() {
  if (!trigger.value) return
  const bounds = trigger.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - bounds.bottom - 8
  const spaceAbove = bounds.top - 8
  const opensAbove = spaceBelow < 180 && spaceAbove > spaceBelow
  const maxHeight = Math.max(96, Math.min(280, opensAbove ? spaceAbove : spaceBelow))

  menuStyle.value = {
    left: `${bounds.left}px`,
    width: `${bounds.width}px`,
    maxHeight: `${maxHeight}px`,
    ...(opensAbove
      ? { bottom: `${window.innerHeight - bounds.top + 4}px` }
      : { top: `${bounds.bottom + 4}px` })
  }
}

function openMenu() {
  if (!props.options.length) return
  activeIndex.value = Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue)
  )
  isOpen.value = true
  updateMenuPosition()
  window.addEventListener('resize', updateMenuPosition)
  window.addEventListener('scroll', updateMenuPosition, true)
  document.addEventListener('pointerdown', handleOutsidePointer)
}

function closeMenu() {
  isOpen.value = false
  window.removeEventListener('resize', updateMenuPosition)
  window.removeEventListener('scroll', updateMenuPosition, true)
  document.removeEventListener('pointerdown', handleOutsidePointer)
}

function toggleMenu() {
  if (isOpen.value) closeMenu()
  else openMenu()
}

function handleOutsidePointer(event) {
  if (!root.value?.contains(event.target) && !menu.value?.contains(event.target)) closeMenu()
}

function moveActive(direction) {
  if (!isOpen.value) {
    openMenu()
    return
  }
  const length = props.options.length
  activeIndex.value = (activeIndex.value + direction + length) % length
  document.getElementById(optionId(activeIndex.value))?.scrollIntoView({ block: 'nearest' })
}

function chooseActive() {
  if (!isOpen.value) {
    openMenu()
    return
  }
  const option = props.options[activeIndex.value]
  if (option) selectOption(option)
}

function selectOption(option) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeMenu()
}

watch(
  () => props.options.length,
  (length) => {
    if (isOpen.value && activeIndex.value >= length) activeIndex.value = Math.max(0, length - 1)
  }
)

onBeforeUnmount(closeMenu)
</script>

<style>
.select-popover-enter-active,
.select-popover-leave-active {
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}
.select-popover-enter-from,
.select-popover-leave-to {
  opacity: 0;
  transform: translateY(-3px) scale(0.99);
}
</style>
