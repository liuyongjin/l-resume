<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload, X, User } from 'lucide-vue-next'
import { AppIcon } from '~/components/ui/icon'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { api } from '~/utils/api'
import { resolveAvatarUrl } from '~/utils/resumeTransform'
import { useAppToast } from '~/composables/useAppToast'

const model = defineModel<string>({ default: '' })

const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const toast = useAppToast()

const previewUrl = computed(() => resolveAvatarUrl(model.value))

function triggerPick() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploading.value = true
  try {
    const res = await api.resumes.uploadAvatar(file)
    const uploaded = res.data
    if (uploaded?.url || uploaded?.filePath) {
      model.value = uploaded.url || uploaded.filePath
      toast.show('头像上传成功', 'success')
    }
  } catch (err) {
    toast.show(err instanceof Error ? err.message : '头像上传失败', 'error')
  } finally {
    uploading.value = false
  }
}

function clearAvatar() {
  model.value = ''
}
</script>

<template>
  <div class="editor-avatar-upload">
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
      @change="handleFileChange"
    />

    <div class="editor-avatar-upload__preview">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="头像预览"
        class="editor-avatar-upload__img"
      />
      <div v-else class="editor-avatar-upload__placeholder">
        <AppIcon :icon="User" size="lg" class="text-muted-foreground" />
      </div>
    </div>

    <div class="editor-avatar-upload__actions">
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="btn-icon-gap"
        :disabled="uploading"
        @click="triggerPick"
      >
        <Spinner v-if="uploading" class="size-4" />
        <AppIcon v-else :icon="Upload" size="sm" />
        {{ uploading ? '上传中...' : (previewUrl ? '更换头像' : '上传头像') }}
      </Button>
      <Button
        v-if="previewUrl"
        type="button"
        variant="ghost"
        size="sm"
        class="btn-icon-gap text-muted-foreground"
        @click="clearAvatar"
      >
        <AppIcon :icon="X" size="sm" />
        移除
      </Button>
    </div>

    <p class="editor-form-hint">支持 JPG、PNG、WEBP、GIF，不超过 2MB</p>
  </div>
</template>
