<script setup lang="ts">
import { Label } from '~/components/ui/Label'
import { Input } from '~/components/ui/Input'
import { Select } from '~/components/ui/Select'
import { Button } from '~/components/ui/button'
import { PAPER_SIZE_OPTIONS, type PaperSizeKey } from '~/utils/resumePaper'
import { FONT_FAMILY_OPTIONS, FONT_STYLE_OPTIONS, FONT_WEIGHT_OPTIONS } from '~/utils/resumeFonts'
import { onEditorPaneScroll } from '~/composables/useRevealScrollbar'

export interface EditorStyleSettings {
  themeColor: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
  margins: string
  fontFamily: string
  fontWeight: string
  fontStyle: string
  paperSize: string
  sectionOrder: Array<{ key: string }>
  /** 预览区隐藏的区块 ID */
  hiddenSections: string[]
}

const props = defineProps<{
  styleSettings: EditorStyleSettings
  templateName?: string
}>()

const emit = defineEmits<{
  'update:styleSettings': [value: EditorStyleSettings]
  reset: []
}>()

const marginOptions = [
  { value: 'narrow', label: '紧凑' },
  { value: 'normal', label: '标准' },
  { value: 'wide', label: '宽松' },
]

function patchStyle(partial: Partial<EditorStyleSettings>) {
  emit('update:styleSettings', { ...props.styleSettings, ...partial })
}
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
    <div class="editor-pane-scroll flex-1 min-h-0 min-w-0" @scroll="onEditorPaneScroll">
      <div class="editor-form-panel page-form-stack">
      <section class="space-y-4 rounded-xl border border-border/70 p-4 bg-background">
        <div>
          <h3 class="editor-section-title">纸张模式</h3>
          <p class="editor-form-hint">默认 A4，切换后右侧预览会同步调整宽度</p>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="paper in PAPER_SIZE_OPTIONS"
            :key="paper.value"
            type="button"
            :class="[
              'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
              styleSettings.paperSize === paper.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border/70 hover:border-border hover:bg-muted/30',
            ]"
            @click="patchStyle({ paperSize: paper.value as PaperSizeKey })"
          >
            <span class="text-sm font-medium text-foreground">{{ paper.label }}</span>
            <span class="text-xs text-muted-foreground">{{ paper.sublabel }}</span>
          </button>
        </div>
      </section>

      <section class="space-y-4 rounded-xl border border-border/70 p-4 bg-background">
        <div>
          <h3 class="editor-section-title">整体样式</h3>
          <p class="editor-form-hint">
            调整当前模板「{{ templateName || '简历' }}」的配色与排版，不影响简历内容
          </p>
        </div>

        <div class="editor-form-field">
          <Label class="text-xs">主题色</Label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              :value="styleSettings.themeColor"
              class="h-10 w-14 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1"
              @input="patchStyle({ themeColor: ($event.target as HTMLInputElement).value })"
            />
            <Input
              :model-value="styleSettings.themeColor"
              class="flex-1 min-w-0 font-mono text-sm"
              placeholder="#2563EB"
              @update:model-value="(v: string) => patchStyle({ themeColor: v || styleSettings.themeColor })"
            />
          </div>
        </div>

        <div class="editor-form-grid editor-form-grid--2">
          <div class="editor-form-field">
            <Label class="text-xs">字号 (pt)</Label>
            <Input
              :model-value="styleSettings.fontSize"
              type="number"
              min="9"
              max="16"
              step="0.5"
              @update:model-value="(v: string | number) => patchStyle({ fontSize: Number(v) || 12 })"
            />
          </div>
          <div class="editor-form-field">
            <Label class="text-xs">行高</Label>
            <Input
              :model-value="styleSettings.lineHeight"
              type="number"
              min="1.2"
              max="2"
              step="0.1"
              @update:model-value="(v: string | number) => patchStyle({ lineHeight: Number(v) || 1.5 })"
            />
          </div>
        </div>

        <div class="editor-form-field">
          <Label class="text-xs">文字间距 (px)</Label>
          <Input
            :model-value="styleSettings.letterSpacing"
            type="number"
            min="0"
            max="4"
            step="0.1"
            @update:model-value="(v: string | number) => patchStyle({ letterSpacing: Number(v) || 0 })"
          />
        </div>

        <div class="editor-form-field">
          <Label class="text-xs">页边距</Label>
          <Select
            :value="styleSettings.margins"
            class="text-sm w-full"
            @change="patchStyle({ margins: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="m in marginOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
          </Select>
        </div>
      </section>

      <section class="space-y-4 rounded-xl border border-border/70 p-4 bg-background">
        <div>
          <h3 class="editor-section-title">字体样式</h3>
          <p class="editor-form-hint">调整正文字体、字重与字形，右侧预览实时同步</p>
        </div>

        <div class="editor-form-field">
          <Label class="text-xs">字体</Label>
          <Select
            :value="styleSettings.fontFamily"
            class="text-sm w-full"
            @change="patchStyle({ fontFamily: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="font in FONT_FAMILY_OPTIONS" :key="font.value" :value="font.value">
              {{ font.label }}
            </option>
          </Select>
        </div>

        <div class="editor-form-grid editor-form-grid--2">
          <div class="editor-form-field">
            <Label class="text-xs">字重</Label>
            <Select
              :value="styleSettings.fontWeight"
              class="text-sm w-full"
              @change="patchStyle({ fontWeight: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="w in FONT_WEIGHT_OPTIONS" :key="w.value" :value="w.value">{{ w.label }}</option>
            </Select>
          </div>
          <div class="editor-form-field">
            <Label class="text-xs">字形</Label>
            <Select
              :value="styleSettings.fontStyle"
              class="text-sm w-full"
              @change="patchStyle({ fontStyle: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="s in FONT_STYLE_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
            </Select>
          </div>
        </div>

        <div
          class="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm text-foreground"
          :style="{
            fontFamily: styleSettings.fontFamily,
            fontWeight: styleSettings.fontWeight,
            fontStyle: styleSettings.fontStyle,
            fontSize: `${styleSettings.fontSize}pt`,
            lineHeight: styleSettings.lineHeight,
            letterSpacing: `${styleSettings.letterSpacing}px`,
          }"
        >
          字体预览：敏捷的棕色狐狸跳过了懒狗。0123456789
        </div>
      </section>

      <Button variant="outline" size="sm" class="w-full" @click="emit('reset')">
        恢复默认样式
      </Button>
    </div>
    </div>
  </div>
</template>
