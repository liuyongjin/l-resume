<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card v-for="i in 3" :key="i" class="overflow-hidden">
      <CardContent class="p-5 space-y-4">
        <div class="flex items-start gap-3">
          <Skeleton class="size-10 rounded-xl shrink-0" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-2/3" />
            <Skeleton class="h-3 w-1/3" />
          </div>
        </div>
        <div class="rounded-lg bg-muted/30 px-3 py-2.5 space-y-2">
          <div class="flex justify-between gap-3">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-3 w-28" />
          </div>
          <div class="flex justify-between gap-3">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-3 w-28" />
          </div>
        </div>
        <div class="flex gap-2 pt-3 border-t border-border/50">
          <Skeleton class="h-8 flex-1 rounded-md" />
          <Skeleton class="h-8 flex-1 rounded-md" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
