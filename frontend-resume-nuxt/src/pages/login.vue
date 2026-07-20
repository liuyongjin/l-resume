<template>
  <div class="auth-page">
    <div class="auth-page__blob -top-24 -left-24 size-72 bg-primary/20" />
    <div class="auth-page__blob -bottom-32 -right-16 size-96 bg-fuchsia-500/10" style="animation-delay: 1.5s" />

    <div class="relative w-full max-w-md z-10">
      <div class="text-center mb-8 animate-fade-in-down">
        <a href="/" class="inline-flex items-center gap-2.5 group">
          <div class="size-11 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <FileText class="size-5 text-primary-foreground" />
          </div>
          <span class="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{{ langStore.t.brand }}</span>
        </a>
      </div>

      <Card class="auth-card" style="animation-delay: 0.1s">
        <CardHeader class="text-center pb-4 space-y-2">
          <CardTitle class="auth-card__title">{{ locale === 'zh' ? '欢迎回来' : 'Welcome Back' }}</CardTitle>
          <CardDescription class="auth-card__desc">{{ locale === 'zh' ? '登录您的账户继续' : 'Sign in to continue' }}</CardDescription>
        </CardHeader>

        <CardContent class="space-y-5 !pt-0 sm:!pt-0">
          <div v-if="errorMessage" class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p class="text-xs text-destructive">{{ errorMessage }}</p>
          </div>
          <div v-if="successMessage" class="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
            <p class="text-xs text-emerald-600 dark:text-emerald-400">{{ successMessage }}</p>
          </div>

          <form @submit.prevent="handleLogin" class="page-form-stack">
            <div class="page-form-field">
              <Label for="phone">{{ locale === 'zh' ? '手机号' : 'Phone' }}</Label>
              <div class="relative">
                <Phone class="auth-field-icon" />
                <Input
                  id="phone"
                  v-model="phone"
                  type="tel"
                  required
                  autocomplete="tel"
                  class="auth-field-input h-9 text-sm"
                  :placeholder="locale === 'zh' ? '请输入手机号' : 'Enter your phone number'"
                />
              </div>
            </div>

            <div class="page-form-field">
              <div class="flex items-center justify-between">
                <Label for="password">{{ locale === 'zh' ? '密码' : 'Password' }}</Label>
                <a href="#" class="auth-forgot">
                  {{ locale === 'zh' ? '忘记密码？' : 'Forgot?' }}
                </a>
              </div>
              <div class="relative">
                <Lock class="auth-field-icon" />
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  class="auth-field-input auth-field-input--action h-9 text-sm"
                  :placeholder="locale === 'zh' ? '请输入密码' : 'Enter your password'"
                />
                <button
                  type="button"
                  class="auth-field-action"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="size-3.5" />
                  <Eye v-else class="size-3.5" />
                </button>
              </div>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                id="remember"
                v-model="rememberMe"
                type="checkbox"
                class="size-3.5 rounded border-input text-primary focus:ring-ring/40"
              />
              <span class="text-xs text-muted-foreground">{{ locale === 'zh' ? '记住我' : 'Remember me' }}</span>
            </label>

            <Button type="submit" class="w-full min-h-[44px] rounded-xl" :disabled="isLoading">
              <Spinner v-if="isLoading" class="size-3.5 text-cta" />
              {{ isLoading ? (locale === 'zh' ? '登录中...' : 'Signing in...') : (locale === 'zh' ? '登录' : 'Sign In') }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div class="text-center mt-6 animate-fade-in" style="animation-delay: 0.3s">
        <a href="/" class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft class="size-3.5" />
          {{ locale === 'zh' ? '返回首页' : 'Back to home' }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Eye, EyeOff, FileText, Lock, Phone } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'
import { useLanguageStore } from '~/stores/language'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/Input'
import { Label } from '~/components/ui/Label'
import { Spinner } from '~/components/ui/spinner'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const langStore = useLanguageStore()

const locale = computed(() => langStore.locale)

const phone = ref('12345678900')
const password = ref('123456')
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isLoading = computed(() => userStore.isLoading)

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const result = await userStore.login(phone.value, password.value)

  if (result.success) {
    successMessage.value = result.message
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/'
    setTimeout(() => {
      router.push(redirect)
    }, 500)
  } else {
    errorMessage.value = result.message
  }
}
</script>
