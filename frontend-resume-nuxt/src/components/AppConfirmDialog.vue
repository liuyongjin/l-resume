<script setup lang="ts">
import { computed } from 'vue'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { useAppConfirm } from '~/composables/useAppConfirm'

const { state, accept, cancel, handleOpenChange } = useAppConfirm()

const open = computed(() => state.value.open)

const confirmClass = computed(() =>
  state.value.options.variant === 'destructive'
    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    : 'bg-primary text-primary-foreground hover:bg-primary-dark',
)
</script>

<template>
  <AlertDialog :open="open" @update:open="handleOpenChange">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ state.options.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="state.options.description">
          {{ state.options.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button type="button" variant="outline" @click="cancel">
          {{ state.options.cancelText || '取消' }}
        </Button>
        <Button type="button" :class="confirmClass" @click="accept">
          {{ state.options.confirmText || '确认' }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
