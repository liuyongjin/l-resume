<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useLoadingStore } from '~/stores/loading'
import { useThemeStore } from '~/stores/theme'
import AppLoader from '~/components/AppLoader.vue'
import AppToast from '~/components/AppToast.vue'
import AppConfirmDialog from '~/components/AppConfirmDialog.vue'

const loadingStore = useLoadingStore()
const themeStore = useThemeStore()
const { isLoading, message } = storeToRefs(loadingStore)
const loadingIndicatorColor = computed(() => themeStore.theme.primaryColor)
</script>

<template>
  <div>
    <NuxtLoadingIndicator :color="loadingIndicatorColor" :height="2" :duration="800" />
    <ClientOnly>
      <AppLoader :loading="isLoading" :text="message" />
    </ClientOnly>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToast />
    <ClientOnly>
      <AppConfirmDialog />
    </ClientOnly>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
