<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Check, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string | number
  primaryColor?: string
}

interface Props {
  modelValue?: string | number
  value?: string | number
  options?: SelectOption[]
  placeholder?: string
  disabled?: boolean
  class?: string
  /** 下拉展开方向；auto 会在下方空间不足时向上展开 */
  menuPlacement?: 'auto' | 'top' | 'bottom'
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  disabled: false,
  menuPlacement: 'auto',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [event: Event]
}>()

const slots = useSlots()
const useNativeSelect = computed(() => props.options.length === 0 && Boolean(slots.default))

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const opensUpward = ref(false)
const menuStyle = ref<Record<string, string>>({})

onClickOutside(rootRef, () => {
  open.value = false
}, { ignore: [menuRef] })

const selectedValue = computed(() => props.modelValue ?? props.value ?? '')

const hasValue = computed(() => selectedValue.value !== '' && selectedValue.value != null)

const displayText = computed(() => {
  if (!hasValue.value) return props.placeholder || '请选择'
  const opt = props.options.find((o) => String(o.value) === String(selectedValue.value))
  return opt?.label ?? String(selectedValue.value)
})

const triggerClass = computed(() =>
  cn(
    'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input/70 bg-muted/30 px-3 py-1.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 focus:bg-background disabled:cursor-not-allowed disabled:opacity-50',
    open.value && 'ring-2 ring-ring/30 border-primary/50 bg-background',
    props.class,
  ),
)

const menuClass = computed(() =>
  cn(
    'fixed z-[200] max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-md',
    opensUpward.value ? '-translate-y-full' : '',
  ),
)

function updateMenuPosition() {
  const trigger = triggerRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const estimatedMenuHeight = Math.min(props.options.length * 40 + 8, 224)
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top

  opensUpward.value =
    props.menuPlacement === 'top'
    || (props.menuPlacement === 'auto' && spaceBelow < estimatedMenuHeight + 8 && spaceAbove >= spaceBelow)

  menuStyle.value = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    top: opensUpward.value ? `${rect.top - 4}px` : `${rect.bottom + 4}px`,
  }
}

function bindPositionListeners() {
  window.addEventListener('resize', updateMenuPosition)
  window.addEventListener('scroll', updateMenuPosition, true)
}

function unbindPositionListeners() {
  window.removeEventListener('resize', updateMenuPosition)
  window.removeEventListener('scroll', updateMenuPosition, true)
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    updateMenuPosition()
    bindPositionListeners()
    return
  }
  unbindPositionListeners()
})

onBeforeUnmount(() => {
  unbindPositionListeners()
})

const toggleOpen = () => {
  if (props.disabled) return
  open.value = !open.value
}

const emitChange = (value: string | number) => {
  emit('update:modelValue', value)
  emit('change', { target: { value: String(value) } } as unknown as Event)
}

const selectOption = (value: string | number) => {
  emitChange(value)
  open.value = false
}

const isSelected = (value: string | number) => String(value) === String(selectedValue.value)

const onNativeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emitChange(target.value)
}
</script>

<template>
  <!-- 自定义下拉（Teleport 避免被 overflow 裁剪） -->
  <div v-if="!useNativeSelect" ref="rootRef" class="relative">
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      :class="triggerClass"
      @click="toggleOpen"
    >
      <span
        class="min-w-0 flex-1 truncate"
        :class="hasValue ? 'text-foreground' : 'text-muted-foreground'"
      >
        {{ displayText }}
      </span>
      <ChevronDown
        class="size-4 shrink-0 text-muted-foreground transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="menuRef"
        :class="menuClass"
        :style="menuStyle"
      >
        <button
          v-for="opt in options"
          :key="String(opt.value)"
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors"
          :class="isSelected(opt.value) ? 'bg-primary/5 text-primary' : 'text-foreground'"
          @click="selectOption(opt.value)"
        >
          <span
            class="flex size-4 shrink-0 items-center justify-center rounded-sm border"
            :class="isSelected(opt.value) ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'"
          >
            <Check v-if="isSelected(opt.value)" class="size-3" />
          </span>
          <span
            v-if="opt.primaryColor"
            class="size-2 rounded-full shrink-0"
            :style="{ backgroundColor: opt.primaryColor }"
          />
          <span class="min-w-0 flex-1 truncate">{{ opt.label }}</span>
        </button>
        <p v-if="options.length === 0" class="px-3 py-2 text-xs text-muted-foreground">
          暂无可选项
        </p>
      </div>
    </Teleport>
  </div>

  <!-- 兼容 slot + option 的旧用法 -->
  <div v-else class="relative">
    <select
      :value="selectedValue"
      :disabled="disabled"
      :class="cn(triggerClass, 'appearance-none pr-9 cursor-pointer')"
      @change="onNativeChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <slot />
    </select>
    <ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
  </div>
</template>
