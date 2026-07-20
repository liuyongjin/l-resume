<template>
  <div class="min-h-screen flex flex-col bg-background">
    <div :class="appShellClass">
      <AppHeader v-if="!isAuth" />
      <main :class="mainClass">
        <div :class="pageWrapperClass">
          <div v-if="showPageShell" class="page-shell">
            <slot />
          </div>
          <slot v-else />
        </div>
      </main>
      <AppFooter v-if="!isWorkflow && !isEditor && !isAuth && !isPreview" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '~/components/AppHeader.vue'
import AppFooter from '~/components/AppFooter.vue'

const route = useRoute()

const isHome = computed(() => route.path === '/')
const isWorkflow = computed(() => route.path.startsWith('/workflow'))
const isEditor = computed(() => route.path.startsWith('/editor/'))
const isPreview = computed(() => route.path.startsWith('/preview/'))
const isAuth = computed(() => route.path === '/login')

const showPageShell = computed(
  () => !isHome.value && !isWorkflow.value && !isEditor.value && !isAuth.value && !isPreview.value,
)

const isShellPage = showPageShell

const pageWrapperClass = computed(() => {
  if (isWorkflow.value || isEditor.value) {
    return 'flex flex-1 flex-col min-h-0 w-full'
  }
  if (isAuth.value || isPreview.value) {
    return 'flex flex-1 flex-col min-h-0 w-full'
  }
  if (showPageShell.value) return 'relative'
  return ''
})

const appShellClass = computed(() => {
  if (isWorkflow.value || isEditor.value || isAuth.value) {
    return 'app-content flex flex-col h-screen overflow-hidden'
  }
  if (isPreview.value) {
    return 'app-content flex flex-col min-h-screen'
  }
  return 'app-content flex flex-col min-h-screen'
})

const mainClass = computed(() => {
  if (isEditor.value) {
    return 'flex flex-1 flex-col min-h-0 w-full max-w-none overflow-hidden'
  }
  if (isWorkflow.value) {
    return 'flex flex-1 flex-col min-h-0 w-full max-w-none overflow-hidden'
  }
  if (isAuth.value) {
    return 'flex flex-1 flex-col min-h-0 w-full max-w-none overflow-hidden p-0'
  }
  if (isPreview.value) {
    return 'flex flex-1 flex-col min-h-0 w-full max-w-none px-0 py-0'
  }
  if (isHome.value) {
    return 'flex-1 w-full'
  }
  if (isShellPage.value) {
    return 'relative flex-1 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-6 sm:py-8 w-full'
  }
  return 'relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 w-full'
})
</script>
