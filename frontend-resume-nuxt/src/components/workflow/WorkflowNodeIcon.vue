<script setup lang="ts">
import { computed } from 'vue'
import {
  Bot,
  BookOpen,
  Code,
  GitBranch,
  Globe,
  Layers,
  Monitor,
  Pencil,
  RefreshCw,
  Zap,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { getWorkflowNodeIconKey } from '@/utils/workflowNodeIcons'

const props = withDefaults(
  defineProps<{
    node: { type?: string; id?: string; templateId?: string; icon?: string }
    size?: 'xs' | 'sm' | 'md' | 'lg'
    class?: string
  }>(),
  { size: 'sm' },
)

const iconKey = computed(() => getWorkflowNodeIconKey(props.node))

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'size-3'
    case 'md':
      return 'size-4'
    case 'lg':
      return 'size-5'
    default:
      return 'size-3.5'
  }
})

const iconClass = computed(() =>
  cn(sizeClass.value, 'shrink-0 text-white pointer-events-none', props.class),
)
</script>

<template>
  <Pencil v-if="iconKey === 'pencil'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <Zap v-else-if="iconKey === 'zap'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <Bot v-else-if="iconKey === 'bot'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <Monitor v-else-if="iconKey === 'monitor'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <BookOpen v-else-if="iconKey === 'book-open'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <Globe v-else-if="iconKey === 'globe'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <Code v-else-if="iconKey === 'code'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <GitBranch v-else-if="iconKey === 'git-branch'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <RefreshCw v-else-if="iconKey === 'refresh-cw'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <Layers v-else-if="iconKey === 'layers'" :stroke-width="2" :class="iconClass" aria-hidden="true" />
  <Bot v-else :stroke-width="2" :class="iconClass" aria-hidden="true" />
</template>
