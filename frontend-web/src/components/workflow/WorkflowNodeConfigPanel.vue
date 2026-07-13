<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue'
import {
  getConfigTabsForNode,
  getNodeTypeLabel,
  isAgentLikeNode,
  isLlmNode,
  type WorkflowDesignerOptionsExtended,
  type WorkflowNodeConfigExtended,
} from '~/utils/workflowNodeMeta'
import { Label } from '~/components/ui/Label'
import { Input } from '~/components/ui/Input'
import { Textarea } from '~/components/ui/Textarea'
import { Select } from '~/components/ui/Select'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { api } from '~/utils/api'
import { useAppToast } from '~/composables/useAppToast'

const props = defineProps<{
  node: Record<string, any>
  options: WorkflowDesignerOptionsExtended
}>()

const emit = defineEmits<{
  'update:config': [WorkflowNodeConfigExtended]
}>()

const toast = useAppToast()
const configTab = defineModel<string>('configTab', { default: 'config' })
const testingTool = ref(false)
const toolTestResult = ref<string>('')

const configTabs = computed(() =>
  getConfigTabsForNode(props.node).map((key) => ({
    key,
    label: { config: '配置', prompt: '提示词', memory: '记忆', advanced: '高级' }[key] || key,
  })),
)

const isToolNode = computed(() => {
  if (props.node?.category === 'tool') return true
  return ['llm', 'kb', 'http', 'code', 'condition', 'loop', 'aggregate'].includes(props.node?.type || '')
})

const local = reactive<WorkflowNodeConfigExtended>({})
const syncingFromNode = ref(false)

const syncFromNode = () => {
  syncingFromNode.value = true
  const cfg = props.node?.config || {}
  Object.assign(local, {
    model: cfg.model ?? props.options?.defaultConfig?.model ?? props.options?.models?.[0]?.value ?? 'glm-4.7-flash',
    temperature: cfg.temperature ?? props.node?.temp ?? 0.4,
    topP: cfg.topP ?? 0.9,
    maxTokens: cfg.maxTokens ?? 2048,
    outputFormat: cfg.outputFormat ?? 'json',
    maxRetries: cfg.maxRetries ?? 2,
    memoryTurns: cfg.memoryTurns ?? 10,
    systemPrompt: cfg.systemPrompt ?? '',
    knowledgeBaseId: cfg.knowledgeBaseId ?? 'resume-industry',
    topK: cfg.topK ?? 5,
    scoreThreshold: cfg.scoreThreshold ?? 0.6,
    queryTemplate: cfg.queryTemplate ?? '',
    endpoint: cfg.endpoint ?? '',
    method: cfg.method ?? 'POST',
    headers: cfg.headers ?? '',
    bodyTemplate: cfg.bodyTemplate ?? '',
    timeoutMs: cfg.timeoutMs ?? 30000,
    codeLanguage: cfg.codeLanguage ?? 'javascript',
    codeScript: cfg.codeScript ?? '',
    inputVariable: cfg.inputVariable ?? 'input',
    outputVariable: cfg.outputVariable ?? 'result',
    conditionType: cfg.conditionType ?? 'variable',
    conditionField: cfg.conditionField ?? '',
    conditionOperator: cfg.conditionOperator ?? 'gte',
    conditionValue: cfg.conditionValue ?? '',
    conditionExpression: cfg.conditionExpression ?? '',
    loopType: cfg.loopType ?? 'forEach',
    loopArrayVariable: cfg.loopArrayVariable ?? '',
    maxIterations: cfg.maxIterations ?? 10,
    breakCondition: cfg.breakCondition ?? '',
    aggregateStrategy: cfg.aggregateStrategy ?? 'merge',
    aggregateInputs: cfg.aggregateInputs ?? '',
    aggregateOutput: cfg.aggregateOutput ?? 'merged',
    aggregateSeparator: cfg.aggregateSeparator ?? '\n---\n',
  })
  nextTick(() => {
    syncingFromNode.value = false
  })
}

watch(
  () => [props.node?.id, props.node?.config] as const,
  () => syncFromNode(),
  { immediate: true, deep: true },
)
watch(local, () => {
  if (syncingFromNode.value) return
  emit('update:config', { ...local })
}, { deep: true })

const nodeType = computed(() => props.node?.type)
const isAgent = computed(() => isAgentLikeNode(props.node))
const showLlmFields = computed(() => isLlmNode(props.node))

const sampleToolInput = {
  summary: '资深前端工程师，熟悉 Vue / React',
  targetRole: '高级前端工程师',
  score: 0.82,
  versions: [{ id: 'v1' }, { id: 'v2' }],
  basicInfo: { position: '前端工程师', name: '张三' },
}

async function testToolNode() {
  if (!isToolNode.value || testingTool.value) return
  testingTool.value = true
  toolTestResult.value = ''
  try {
    const res = await api.workflows.executeTool({
      type: props.node.type,
      config: { ...local },
      input: sampleToolInput,
    })
    if (res.success) {
      toolTestResult.value = JSON.stringify(res.data, null, 2)
      toast.success(res.message || '工具节点测试成功')
    } else {
      toast.error(res.message || '工具节点测试失败')
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '工具节点测试失败')
  } finally {
    testingTool.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-[11px] text-muted-foreground uppercase tracking-wide">
      {{ getNodeTypeLabel(nodeType) }}
    </p>

    <div class="flex flex-wrap gap-1 border-b border-border pb-2">
      <button
        v-for="tab in configTabs"
        :key="tab.key"
        type="button"
        class="px-2 py-1 text-[11px] rounded-md transition-colors"
        :class="configTab === tab.key ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'"
        @click="configTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 大模型 / 智能体 -->
    <template v-if="configTab === 'config' && showLlmFields">
      <div class="space-y-3">
        <h4 class="text-xs font-semibold text-muted-foreground">模型配置</h4>
        <p class="text-[11px] text-muted-foreground">免费模型</p>
        <div class="space-y-2">
          <Label class="text-xs">Model</Label>
          <Select v-model="local.model" :options="options.models || []" placeholder="选择模型" />
        </div>
        <div class="space-y-2">
          <div class="flex justify-between text-xs">
            <Label>温度</Label>
            <span class="text-muted-foreground">{{ local.temperature }}</span>
          </div>
          <input v-model.number="local.temperature" type="range" min="0" max="1" step="0.1" class="w-full accent-primary" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">输出格式</Label>
          <Select v-model="local.outputFormat" :options="options.outputFormats || []" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">最大重试</Label>
          <Input v-model.number="local.maxRetries" type="number" min="0" max="5" class="h-8" />
        </div>
      </div>
    </template>

    <!-- 知识库 -->
    <template v-if="configTab === 'config' && nodeType === 'kb'">
      <div class="space-y-3">
        <h4 class="text-xs font-semibold text-muted-foreground">知识库检索</h4>
        <div class="space-y-2">
          <Label class="text-xs">知识库</Label>
          <Select v-model="local.knowledgeBaseId" :options="options.knowledgeBases || []" placeholder="选择知识库" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">Top K</Label>
          <Input v-model.number="local.topK" type="number" min="1" max="20" class="h-8" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">相似度阈值 (0-1)</Label>
          <Input v-model.number="local.scoreThreshold" type="number" min="0" max="1" step="0.05" class="h-8" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">查询模板</Label>
          <Textarea v-model="local.queryTemplate" rows="3" class="text-xs font-mono" placeholder="{{input.targetRole}}" />
          <p class="text-[11px] text-muted-foreground">支持 {'{{input.xxx}}'} 引用上游变量</p>
        </div>
      </div>
    </template>

    <!-- HTTP -->
    <template v-if="configTab === 'config' && nodeType === 'http'">
      <div class="space-y-3">
        <h4 class="text-xs font-semibold text-muted-foreground">HTTP 请求</h4>
        <div class="space-y-2">
          <Label class="text-xs">方法</Label>
          <Select v-model="local.method" :options="options.httpMethods || []" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">URL / 端点</Label>
          <Input v-model="local.endpoint" class="h-8 text-xs font-mono" placeholder="https://api.example.com/v1/..." />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">Headers (JSON)</Label>
          <Textarea v-model="local.headers" rows="3" class="text-xs font-mono" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">Body 模板</Label>
          <Textarea v-model="local.bodyTemplate" rows="4" class="text-xs font-mono" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">超时 (ms)</Label>
          <Input v-model.number="local.timeoutMs" type="number" min="1000" class="h-8" />
        </div>
      </div>
    </template>

    <!-- 代码 -->
    <template v-if="configTab === 'config' && nodeType === 'code'">
      <div class="space-y-3">
        <h4 class="text-xs font-semibold text-muted-foreground">代码执行</h4>
        <div class="space-y-2">
          <Label class="text-xs">语言</Label>
          <Select v-model="local.codeLanguage" :options="options.codeLanguages || []" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-2">
            <Label class="text-xs">输入变量</Label>
            <Input v-model="local.inputVariable" class="h-8 text-xs" />
          </div>
          <div class="space-y-2">
            <Label class="text-xs">输出变量</Label>
            <Input v-model="local.outputVariable" class="h-8 text-xs" />
          </div>
        </div>
        <div class="space-y-2">
          <Label class="text-xs">脚本</Label>
          <Textarea v-model="local.codeScript" rows="8" class="text-xs font-mono" />
        </div>
      </div>
    </template>

    <!-- 条件 -->
    <template v-if="configTab === 'config' && nodeType === 'condition'">
      <div class="space-y-3">
        <h4 class="text-xs font-semibold text-muted-foreground">条件分支</h4>
        <p class="text-[11px] text-muted-foreground">右侧「是/否」两个输出端口分别连接不同分支</p>
        <div class="space-y-2">
          <Label class="text-xs">条件类型</Label>
          <Select
            v-model="local.conditionType"
            :options="[
              { label: '变量比较', value: 'variable' },
              { label: '表达式', value: 'expression' },
            ]"
          />
        </div>
        <template v-if="local.conditionType === 'variable'">
          <div class="space-y-2">
            <Label class="text-xs">字段路径</Label>
            <Input v-model="local.conditionField" class="h-8 text-xs font-mono" placeholder="input.score" />
          </div>
          <div class="space-y-2">
            <Label class="text-xs">运算符</Label>
            <Select v-model="local.conditionOperator" :options="options.conditionOperators || []" />
          </div>
          <div class="space-y-2">
            <Label class="text-xs">比较值</Label>
            <Input v-model="local.conditionValue" class="h-8 text-xs" />
          </div>
        </template>
        <template v-else>
          <div class="space-y-2">
            <Label class="text-xs">表达式</Label>
            <Textarea v-model="local.conditionExpression" rows="3" class="text-xs font-mono" placeholder="input.score >= 0.7" />
          </div>
        </template>
      </div>
    </template>

    <!-- 循环 -->
    <template v-if="configTab === 'config' && nodeType === 'loop'">
      <div class="space-y-3">
        <h4 class="text-xs font-semibold text-muted-foreground">循环</h4>
        <p class="text-[11px] text-muted-foreground">「循环体」端口连到子流程，「完成」端口连到后续节点</p>
        <div class="space-y-2">
          <Label class="text-xs">循环类型</Label>
          <Select v-model="local.loopType" :options="options.loopTypes || []" />
        </div>
        <div v-if="local.loopType === 'forEach'" class="space-y-2">
          <Label class="text-xs">数组变量</Label>
          <Input v-model="local.loopArrayVariable" class="h-8 text-xs font-mono" placeholder="input.versions" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">最大迭代次数</Label>
          <Input v-model.number="local.maxIterations" type="number" min="1" max="100" class="h-8" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">终止条件</Label>
          <Textarea v-model="local.breakCondition" rows="2" class="text-xs font-mono" placeholder="iteration.index >= max" />
        </div>
      </div>
    </template>

    <!-- 聚合 -->
    <template v-if="configTab === 'config' && nodeType === 'aggregate'">
      <div class="space-y-3">
        <h4 class="text-xs font-semibold text-muted-foreground">变量聚合</h4>
        <div class="space-y-2">
          <Label class="text-xs">策略</Label>
          <Select v-model="local.aggregateStrategy" :options="options.aggregateStrategies || []" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">输入节点 ID（逗号分隔）</Label>
          <Input v-model="local.aggregateInputs" class="h-8 text-xs font-mono" placeholder="optimize,edit" />
        </div>
        <div class="space-y-2">
          <Label class="text-xs">输出变量名</Label>
          <Input v-model="local.aggregateOutput" class="h-8 text-xs" />
        </div>
        <div v-if="local.aggregateStrategy === 'concat'" class="space-y-2">
          <Label class="text-xs">分隔符</Label>
          <Input v-model="local.aggregateSeparator" class="h-8 text-xs font-mono" />
        </div>
      </div>
    </template>

    <!-- 工具节点测试 -->
    <template v-if="configTab === 'config' && isToolNode">
      <div class="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-medium text-foreground">节点测试</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-8 text-xs"
            :disabled="testingTool"
            @click="testToolNode"
          >
            <Spinner v-if="testingTool" class="size-3.5" />
            {{ testingTool ? '测试中…' : '测试节点' }}
          </Button>
        </div>
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          使用示例输入调用后端工具执行器，验证当前配置是否可用。
        </p>
        <pre
          v-if="toolTestResult"
          class="max-h-40 overflow-auto rounded-md bg-background p-2 text-[10px] leading-relaxed text-muted-foreground"
        >{{ toolTestResult }}</pre>
      </div>
    </template>

    <!-- 提示词 -->
    <template v-if="configTab === 'prompt' && (isAgent || nodeType === 'llm')">
      <div class="space-y-2">
        <Label class="text-xs">系统提示词</Label>
        <Textarea v-model="local.systemPrompt" rows="10" class="text-xs" />
        <p class="text-[11px] text-muted-foreground">可用 {'{{input}}'}、{'{{context}}'} 引用上游输出</p>
      </div>
    </template>

    <!-- 记忆 -->
    <template v-if="configTab === 'memory' && isAgent">
      <div class="space-y-2">
        <Label class="text-xs">上下文轮数</Label>
        <Input v-model.number="local.memoryTurns" type="number" min="0" max="50" class="h-8" />
        <p class="text-xs text-muted-foreground">保留最近 {{ local.memoryTurns }} 轮对话</p>
      </div>
    </template>

    <!-- 高级 -->
    <template v-if="configTab === 'advanced'">
      <div class="space-y-2">
        <Label class="text-xs">节点名称</Label>
        <Input v-model="node.name" class="h-8 text-sm" />
      </div>
      <div class="space-y-2">
        <Label class="text-xs">描述</Label>
        <Textarea v-model="node.description" rows="2" class="text-sm" />
      </div>
      <div v-if="nodeType === 'condition' || nodeType === 'loop'" class="rounded-lg border border-dashed p-2 text-[11px] text-muted-foreground">
        <template v-if="nodeType === 'condition'">从「是」端口连到满足条件时的下游；从「否」端口连到不满足时的下游。</template>
        <template v-else>从「循环体」端口连到每次迭代执行的节点；从「完成」端口连到循环结束后的节点。</template>
      </div>
    </template>
  </div>
</template>
