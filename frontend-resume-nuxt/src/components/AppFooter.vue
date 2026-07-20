<template>
  <footer class="site-chrome border-t py-6 pb-[calc(1.5rem+var(--safe-area-bottom))]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between gap-5">
        <div class="flex items-center gap-3">
          <IconBox :icon="FileText" size="sm" variant="primary" />
          <p class="text-xs text-muted-foreground">
            © 2024 {{ langStore.t.brand }}. {{ langStore.locale === 'zh' ? '保留所有权利' : 'All rights reserved.' }}
          </p>
        </div>
        <div class="flex items-center gap-6">
          <a href="#" class="text-xs text-muted-foreground transition-colors hover:text-primary">
            {{ langStore.locale === 'zh' ? '关于我们' : 'About' }}
          </a>
          <a href="#" class="text-xs text-muted-foreground transition-colors hover:text-primary">
            {{ langStore.locale === 'zh' ? '使用条款' : 'Terms' }}
          </a>
          <a href="#" class="text-xs text-muted-foreground transition-colors hover:text-primary">
            {{ langStore.locale === 'zh' ? '隐私政策' : 'Privacy' }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import { useLanguageStore } from '~/stores/language'
import { IconBox } from '~/components/ui/icon'

const langStore = useLanguageStore()
</script>
