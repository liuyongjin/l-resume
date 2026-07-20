<template>
  <header class="sticky top-0 z-50 border-b border-border/60 glass-header">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0">
          <div class="size-9 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <FileText class="size-4 text-primary-foreground" />
          </div>
          <span class="text-lg font-bold text-foreground">{{ langStore.t.brand }}</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            :class="[
              'px-3 py-2 rounded-lg font-medium transition-colors text-sm',
              isActiveLink(link.path)
                ? 'text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            ]"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-0.5 sm:gap-1">
          <!-- User / auth：SSR 与首屏客户端保持一致，挂载后再读取 localStorage 登录态 -->
          <div v-if="isClientReady && userStore.isLoggedIn" class="relative">
            <button
              @click="toggleMenu('user')"
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-muted/60"
            >
              <div class="size-8 bg-gradient-to-br from-primary to-fuchsia-500 rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                {{ userStore.user?.name?.charAt(0) || 'U' }}
              </div>
              <span class="hidden sm:block text-sm font-medium text-foreground max-w-[8rem] truncate">
                {{ userStore.user?.name }}
              </span>
              <ChevronDown class="size-4 text-muted-foreground hidden sm:block" />
            </button>
            <Transition name="fade">
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-1 w-52 rounded-lg border shadow-lg overflow-hidden z-50 bg-popover border-border"
              >
                <div class="px-4 py-3 border-b border-border">
                  <p class="text-sm font-medium text-foreground">{{ userStore.user?.name }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ userStore.user?.email }}</p>
                </div>
                <button
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted/60 transition-colors"
                >
                  {{ langStore.t.nav.signOut }}
                </button>
              </div>
            </Transition>
          </div>
          <div v-else class="flex items-center gap-1">
            <NuxtLink
              to="/login"
              class="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ langStore.t.nav.signIn }}
            </NuxtLink>
          </div>

          <!-- Language -->
          <div class="relative">
            <Button
              variant="ghost"
              size="icon"
              class="size-9"
              :title="langStore.t.header.language"
              @click="toggleMenu('language')"
            >
              <Globe class="size-4" />
            </Button>
            <Transition name="fade">
              <div
                v-if="showLanguageMenu"
                class="absolute right-0 mt-1 w-32 rounded-lg border shadow-lg overflow-hidden z-50 bg-popover border-border"
              >
                <button
                  @click="setLocale('zh')"
                  :class="[
                    'w-full px-3 py-2 text-sm text-left transition-colors',
                    langStore.locale === 'zh' ? 'text-primary font-medium bg-primary/5' : 'text-muted-foreground hover:bg-muted/60'
                  ]"
                >
                  简体中文
                </button>
                <button
                  @click="setLocale('en')"
                  :class="[
                    'w-full px-3 py-2 text-sm text-left transition-colors',
                    langStore.locale === 'en' ? 'text-primary font-medium bg-primary/5' : 'text-muted-foreground hover:bg-muted/60'
                  ]"
                >
                  English
                </button>
              </div>
            </Transition>
          </div>

          <!-- Theme toggle -->
          <Button
            variant="ghost"
            size="icon"
            class="size-9"
            :aria-label="themeStore.theme.mode === 'light' ? '切换深色模式' : '切换浅色模式'"
            @click="toggleTheme"
          >
            <Moon v-if="!isClientReady || themeStore.theme.mode === 'light'" class="size-4" />
            <Sun v-else class="size-4" />
          </Button>

          <!-- Settings -->
          <Button
            variant="ghost"
            size="icon"
            class="size-9"
            :title="langStore.t.header.settings"
            @click="showSettings = true"
          >
            <Settings class="size-4" />
          </Button>

          <!-- Mobile menu -->
          <Button
            variant="ghost"
            size="icon"
            class="md:hidden size-9"
            aria-label="菜单"
            @click="toggleMenu('mobile')"
          >
            <Menu v-if="!showMobileMenu" class="size-4" />
            <X v-else class="size-4" />
          </Button>
        </div>
      </div>
    </div>

    <Transition name="mobile-menu">
      <div
        v-if="showMobileMenu"
        class="md:hidden border-t border-border/60 bg-background"
      >
        <div class="px-4 py-3 space-y-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            :class="[
              'block px-4 py-3 rounded-lg font-medium text-sm min-h-[44px] flex items-center',
              isActiveLink(link.path) ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/60'
            ]"
            @click="showMobileMenu = false"
          >
            {{ link.label }}
          </NuxtLink>

          <button
            v-if="isClientReady && userStore.isLoggedIn"
            @click="handleLogout(); showMobileMenu = false"
            class="w-full text-left px-4 py-3 rounded-lg font-medium text-sm min-h-[44px] text-destructive hover:bg-destructive/10"
          >
            {{ langStore.t.nav.signOut }}
          </button>
          <div v-else class="space-y-1">
            <NuxtLink
              to="/login"
              class="block px-4 py-3 rounded-lg font-medium text-sm min-h-[44px] flex items-center text-muted-foreground hover:bg-muted/60"
              @click="showMobileMenu = false"
            >
              {{ langStore.t.nav.signIn }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>

    <ClientOnly>
      <Teleport to="body">
        <Transition name="slide">
          <div
            v-if="showSettings"
            class="fixed inset-0 z-[100] flex justify-end"
            @click.self="showSettings = false"
          >
            <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div class="relative w-full max-w-md bg-background h-full shadow-2xl overflow-y-auto">
              <div class="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between z-10">
                <div>
                  <h2 class="text-lg font-semibold text-foreground">{{ langStore.t.header.settings }}</h2>
                  <p class="text-xs text-muted-foreground">
                    {{ langStore.locale === 'zh' ? '调整网站的外观和样式' : 'Customize appearance and style' }}
                  </p>
                </div>
                <Button variant="ghost" size="icon" class="size-8" @click="showSettings = false">
                  <X class="size-4" />
                </Button>
              </div>

              <div class="p-5 space-y-6">
                <div>
                  <h3 class="font-semibold text-foreground mb-3">{{ langStore.t.header.themeMode }}</h3>
                  <div class="space-y-2.5">
                    <button
                      @click="themeStore.setMode('light')"
                      :class="[
                        'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                        themeStore.theme.mode === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      ]"
                    >
                      <div class="size-10 bg-muted rounded-lg flex items-center justify-center">
                        <Sun class="size-5 text-foreground" />
                      </div>
                      <div class="text-left">
                        <div class="font-medium text-foreground text-sm">{{ langStore.t.header.lightMode }}</div>
                        <div class="text-xs text-muted-foreground">{{ langStore.t.header.lightModeDesc }}</div>
                      </div>
                      <div v-if="themeStore.theme.mode === 'light'" class="ml-auto size-5 bg-primary rounded-full flex items-center justify-center">
                        <Check class="size-3 text-primary-foreground" />
                      </div>
                    </button>

                    <button
                      @click="themeStore.setMode('dark')"
                      :class="[
                        'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                        themeStore.theme.mode === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      ]"
                    >
                      <div class="size-10 bg-muted rounded-lg flex items-center justify-center">
                        <Moon class="size-5 text-foreground" />
                      </div>
                      <div class="text-left">
                        <div class="font-medium text-foreground text-sm">{{ langStore.t.header.darkMode }}</div>
                        <div class="text-xs text-muted-foreground">{{ langStore.t.header.darkModeDesc }}</div>
                      </div>
                      <div v-if="themeStore.theme.mode === 'dark'" class="ml-auto size-5 bg-primary rounded-full flex items-center justify-center">
                        <Check class="size-3 text-primary-foreground" />
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 class="font-semibold text-foreground mb-3">{{ langStore.t.header.primaryColor }}</h3>
                  <div class="grid grid-cols-5 gap-2.5">
                    <button
                      v-for="color in primaryColors"
                      :key="color.value"
                      @click="themeStore.setPrimaryColor(color.value)"
                      :class="[
                        'size-10 rounded-lg transition-all',
                        themeStore.theme.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                      ]"
                      :style="{ backgroundColor: color.value }"
                      :title="color.name"
                    />
                  </div>
                </div>

                <div>
                  <h3 class="font-semibold text-foreground mb-3">{{ langStore.t.header.borderRadius }}</h3>
                  <div class="space-y-1.5">
                    <button
                      v-for="radius in borderRadiusOptions"
                      :key="radius.value"
                      @click="themeStore.setBorderRadius(radius.value)"
                      :class="[
                        'w-full px-3 py-2.5 rounded-lg border-2 transition-all text-left',
                        themeStore.theme.borderRadius === radius.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      ]"
                    >
                      <span class="font-medium text-foreground text-sm">{{ radius.label }}</span>
                      <span class="text-xs text-muted-foreground ml-2">{{ radius.description }}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 class="font-semibold text-foreground mb-3">{{ langStore.t.header.shadowIntensity }}</h3>
                  <div class="space-y-1.5">
                    <button
                      v-for="shadow in shadowOptions"
                      :key="shadow.value"
                      @click="themeStore.setShadowIntensity(shadow.value)"
                      :class="[
                        'w-full px-3 py-2.5 rounded-lg border-2 transition-all text-left',
                        themeStore.theme.shadowIntensity === shadow.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      ]"
                    >
                      <span class="font-medium text-foreground text-sm">{{ shadow.label }}</span>
                      <span class="text-xs text-muted-foreground ml-2">{{ shadow.description }}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 class="font-semibold text-foreground mb-3">{{ langStore.t.header.fontFamily }}</h3>
                  <div class="space-y-1.5">
                    <button
                      v-for="font in fontFamilyOptions"
                      :key="font.value"
                      @click="themeStore.setFontFamily(font.value)"
                      :class="[
                        'w-full px-3 py-2.5 rounded-lg border-2 transition-all text-left',
                        themeStore.theme.fontFamily === font.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      ]"
                      :style="{ fontFamily: themeStore.fontFamilies[font.value] }"
                    >
                      <span class="font-medium text-foreground text-sm">{{ font.label }}</span>
                    </button>
                  </div>
                </div>

                <button
                  class="w-full py-2.5 bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors text-sm"
                  @click="resetToDefault"
                >
                  {{ langStore.t.header.reset }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navigateTo } from 'nuxt/app'
import { useThemeStore } from '~/stores/theme'
import { useLanguageStore } from '~/stores/language'
import { useUserStore } from '~/stores/user'
import { Button } from '~/components/ui/button'
import {
  Check,
  ChevronDown,
  FileText,
  Globe,
  Menu,
  Moon,
  Settings,
  Sun,
  X
} from 'lucide-vue-next'

const themeStore = useThemeStore()
const langStore = useLanguageStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const showSettings = ref(false)
const showLanguageMenu = ref(false)
const showMobileMenu = ref(false)
const showUserMenu = ref(false)
const isClientReady = ref(false)
const currentPath = ref(route.path)

watch(() => route.path, (path) => {
  currentPath.value = path
})

const navLinks = computed(() => [
  { label: langStore.t.nav.home, path: '/' },
  { label: langStore.t.nav.templates, path: '/templates' },
  { label: langStore.t.nav.workflowDesigner, path: '/workflow/designer' },
  { label: langStore.t.nav.smartExecution, path: '/workflow/execution' },
  { label: langStore.t.nav.myResume, path: '/resume' }
])

const isActiveLink = (path: string) => {
  if (path === '/') return currentPath.value === '/'
  return currentPath.value.startsWith(path)
}

const closeAllMenus = () => {
  showLanguageMenu.value = false
  showMobileMenu.value = false
  showUserMenu.value = false
}

const toggleMenu = (menu: 'user' | 'language' | 'mobile') => {
  const wasOpen =
    (menu === 'user' && showUserMenu.value) ||
    (menu === 'language' && showLanguageMenu.value) ||
    (menu === 'mobile' && showMobileMenu.value)

  closeAllMenus()

  if (wasOpen) return

  if (menu === 'user') showUserMenu.value = true
  else if (menu === 'language') showLanguageMenu.value = true
  else showMobileMenu.value = true
}

const setLocale = (locale: 'zh' | 'en') => {
  langStore.setLocale(locale)
  showLanguageMenu.value = false
}

const handleLogout = async () => {
  showUserMenu.value = false
  await userStore.logout()
  await router.push('/')
}

const fontFamilyOptions = [
  { value: 'Source Sans 3', label: 'Source Sans 3' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'SF Pro Display', label: 'SF Pro Display' }
]

const primaryColors = [
  { name: '天青', value: '#0EA5E9' },
  { name: '品红', value: '#D946EF' },
  { name: '蓝色', value: '#3B82F6' },
  { name: '青色', value: '#06B6D4' },
  { name: '翠绿', value: '#10B981' },
  { name: '橙色', value: '#F59E0B' },
  { name: '红色', value: '#EF4444' },
  { name: '粉色', value: '#EC4899' },
  { name: '深蓝', value: '#1E40AF' },
  { name: '深绿', value: '#059669' }
]

const borderRadiusOptions = computed(() =>
  langStore.locale === 'zh'
    ? [
        { value: 'sm', label: '紧凑', description: '较小的圆角' },
        { value: 'md', label: '适中', description: '标准圆角' },
        { value: 'lg', label: '圆润', description: '较大的圆角' },
        { value: 'xl', label: '极圆', description: '超大圆角' }
      ]
    : [
        { value: 'sm', label: 'Compact', description: 'Small radius' },
        { value: 'md', label: 'Medium', description: 'Standard radius' },
        { value: 'lg', label: 'Rounded', description: 'Large radius' },
        { value: 'xl', label: 'Extra', description: 'Extra large radius' }
      ]
)

const shadowOptions = computed(() =>
  langStore.locale === 'zh'
    ? [
        { value: 'none', label: '无', description: '无阴影效果' },
        { value: 'low', label: '轻微', description: '微妙的阴影' },
        { value: 'medium', label: '适中', description: '标准阴影' },
        { value: 'high', label: '明显', description: '强烈的阴影' }
      ]
    : [
        { value: 'none', label: 'None', description: 'No shadow' },
        { value: 'low', label: 'Low', description: 'Subtle shadow' },
        { value: 'medium', label: 'Medium', description: 'Standard shadow' },
        { value: 'high', label: 'High', description: 'Strong shadow' }
      ]
)

const toggleTheme = () => {
  themeStore.toggleMode()
}

const resetToDefault = () => {
  themeStore.resetToDefault()
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('header')) {
    closeAllMenus()
  }
}

onMounted(() => {
  isClientReady.value = true
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-from > div:last-child,
.slide-leave-to > div:last-child {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  max-height: 0;
  opacity: 0;
}
.mobile-menu-enter-to,
.mobile-menu-leave-from {
  max-height: 480px;
  opacity: 1;
}
</style>
