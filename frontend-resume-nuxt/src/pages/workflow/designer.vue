<template>
  <div class="flex flex-1 min-h-0 flex-col overflow-hidden">
    <!-- 子工具栏 -->
    <div class="shrink-0 page-toolbar designer-toolbar">
      <div class="designer-toolbar__side designer-toolbar__side--left">
        <Button variant="ghost" size="icon" class="size-8 shrink-0" @click="navigateTo('/workflow/execution')">
          <AppIcon :icon="ArrowLeft" size="sm" />
        </Button>
        <div class="min-w-0">
          <div class="flex items-center gap-2 min-w-0">
            <h1 class="text-sm font-semibold text-foreground truncate">简历优化工作流</h1>
            <button type="button" class="text-muted-foreground hover:text-foreground shrink-0">
              <AppIcon :icon="Pencil" size="sm" />
            </button>
          </div>
          <p class="designer-toolbar__meta text-[11px] text-muted-foreground mt-0.5 truncate">
            当前版本 v{{ currentVersion ?? '-' }} · 已自动保存 {{ autoSaveTime }}
          </p>
        </div>
      </div>

      <div class="designer-toolbar__center" aria-label="画布操作">
        <Button variant="ghost" size="icon" class="size-8" @click="undo" :disabled="historyIndex <= 0 || pageLoading" title="撤销">
          <AppIcon :icon="Undo2" size="sm" />
        </Button>
        <Button variant="ghost" size="icon" class="size-8" @click="redo" :disabled="historyIndex >= history.length - 1 || pageLoading" title="重做">
          <AppIcon :icon="Redo2" size="sm" />
        </Button>
        <Separator orientation="vertical" class="h-5 mx-1" />
        <Button variant="ghost" size="icon" class="size-8" @click="zoomOut" :disabled="pageLoading" title="缩小">
          <AppIcon :icon="Minus" size="sm" />
        </Button>
        <span class="text-xs text-muted-foreground w-10 text-center tabular-nums">{{ Math.round(zoom * 100) }}%</span>
        <Button variant="ghost" size="icon" class="size-8" @click="zoomIn" :disabled="pageLoading" title="放大">
          <AppIcon :icon="Plus" size="sm" />
        </Button>
        <Button variant="ghost" size="icon" class="size-8" @click="resetZoom" :disabled="pageLoading" title="适应屏幕">
          <AppIcon :icon="Maximize2" size="sm" />
        </Button>
      </div>

      <div class="designer-toolbar__side designer-toolbar__side--right">
        <div class="designer-toolbar__actions">
          <Button
            variant="outline"
            size="sm"
            class="h-8 text-xs shrink-0"
            :disabled="pageLoading || isApplyingSample || isTestingWorkflow"
            @click="applySampleWorkflowAndPublish"
          >
            {{ isApplyingSample ? '发布中…' : '示例工作流' }}
          </Button>
          <Button variant="outline" size="sm" class="h-8 text-xs shrink-0 hidden sm:inline-flex" :disabled="pageLoading" @click="resetWorkflow">重置</Button>
          <Button variant="outline" size="sm" class="h-8 text-xs shrink-0 hidden md:inline-flex" :disabled="pageLoading || isTestingWorkflow || isApplyingSample" @click="testWorkflow">
            {{ isTestingWorkflow ? '测试中…' : '测试工作流' }}
          </Button>
          <Button size="sm" class="h-8 text-xs shrink-0" :disabled="pageLoading || isApplyingSample" @click="publishNewVersion">发布新版本</Button>
          <Button variant="outline" size="sm" class="h-8 text-xs shrink-0 hidden lg:inline-flex" @click="navigateTo('/workflow/executions')">
            查看历史执行
          </Button>
        </div>
      </div>
    </div>

    <LoadingState v-if="pageLoading" class="flex-1 min-h-[20rem]" text="加载工作流设计器..." />

    <template v-else>
    <div class="hidden lg:flex flex-1 min-h-0 gap-0">
      <!-- 节点库 -->
      <div class="relative z-10 w-64 shrink-0 border-r border-border bg-card flex flex-col">
        <div class="p-3 border-b border-border">
          <Input v-model="nodeSearch" placeholder="搜索节点" class="h-8 text-sm" />
        </div>
        <ScrollArea class="flex-1">
          <div class="p-3 space-y-4">
            <div v-for="category in filteredNodeCategories" :key="category.name">
              <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{{ category.name }}</h3>
              <div class="space-y-1.5">
                <div
                  v-for="node in category.nodes"
                  :key="node.id"
                  draggable="true"
                  @dragstart="handleDragStart($event, node)"
                  @click="selectLibraryNode(node)"
                  :class="[
                    'flex items-center gap-2.5 p-2.5 rounded-lg border cursor-grab hover:shadow-sm transition-all active:cursor-grabbing text-left',
                    selectedLibraryNode?.id === node.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  ]"
                >
                  <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden', getWorkflowNodeColorClass(node)]">
                    <WorkflowNodeIcon :key="`lib-${node.id}`" :node="node" size="sm" />
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium text-foreground text-xs truncate">{{ node.name }}</div>
                    <div class="text-[11px] text-muted-foreground truncate leading-snug">{{ node.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <!-- 工作流画布 -->
      <div class="relative z-0 flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <div
          ref="canvasViewport"
          class="canvas-viewport relative flex-1 min-h-[320px] w-full overflow-hidden bg-muted/30"
          @dragover.prevent
          @drop="handleDrop"
          @mousedown="startCanvasDrag"
          @wheel.prevent="handleWheel"
        >
          <div
            ref="canvasContainer"
            class="absolute left-0 top-0 origin-top-left will-change-transform"
            :style="canvasTransformStyle"
          >
            <svg
              :width="canvasLayerSize.width"
              :height="canvasLayerSize.height"
              class="absolute top-0 left-0 z-0 block pointer-events-none"
            >
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" stroke-width="0.5"/>
                    </pattern>
                    <marker id="flow-arrow" viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--muted-foreground))" />
                    </marker>
                    <marker id="flow-arrow-active" viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--primary))" />
                    </marker>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  <g v-for="conn in connections" :key="conn.id" data-workflow-connection @mousedown.stop>
                    <path
                      :d="getConnectionPath(conn)"
                      fill="none"
                      stroke="transparent"
                      stroke-width="20"
                      class="cursor-pointer pointer-events-auto"
                      @click.stop="selectConnection(conn)"
                    />
                    <path
                      :d="getConnectionPath(conn)"
                      fill="none"
                      stroke-linecap="butt"
                      stroke-linejoin="round"
                      :stroke="selectedConnection?.id === conn.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'"
                      :stroke-width="selectedConnection?.id === conn.id ? 2.5 : 1.75"
                      :marker-end="selectedConnection?.id === conn.id ? 'url(#flow-arrow-active)' : 'url(#flow-arrow)'"
                      class="pointer-events-none"
                    />
                  </g>
                  <path
                    v-if="connectingFrom"
                    :d="connectionPreviewPath"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    stroke-width="2"
                    stroke-dasharray="6 4"
                    class="pointer-events-none"
                  />
                </svg>

                <div
                  v-for="node in canvasNodes"
                  :key="node.id"
                  class="absolute z-10 cursor-move group"
                  :style="{ left: node.x + 'px', top: node.y + 'px' }"
                  @mousedown.stop="startNodeDrag($event, node)"
                  @click.stop="selectCanvasNode(node)"
                >
                  <div :class="[
                    'relative w-52 h-[120px] box-border flex flex-col p-3 rounded-xl shadow-md transition-all duration-200 bg-card border-2',
                    selectedNode?.id === node.id ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border hover:shadow-lg hover:border-primary/30'
                  ]">
                    <div class="flex items-center gap-2 mb-2 shrink-0">
                      <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden', getWorkflowNodeColorClass(node)]">
                        <WorkflowNodeIcon :key="`canvas-${node.id}`" :node="node" size="xs" />
                      </div>
                      <span class="font-medium text-foreground text-xs truncate flex-1">{{ node.name }}</span>
                      <Button
                        v-if="!isProtectedWorkflowNode(node)"
                        variant="ghost"
                        size="icon"
                        @click.stop="removeNode(node.id)"
                        class="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <AppIcon :icon="X" size="xs" />
                      </Button>
                    </div>
                    <div v-if="!isProtectedWorkflowNode(node)" class="flex-1 min-h-0 space-y-1 overflow-hidden text-[11px] text-muted-foreground">
                      <template v-if="isAgentLikeNode(node) || node.type === 'llm'">
                        <div class="flex justify-between"><span>Model</span><span class="text-foreground">{{ node.config?.model || 'gpt-4o' }}</span></div>
                        <div class="flex justify-between"><span>Temp</span><span class="text-foreground">{{ node.temp ?? node.config?.temperature ?? '0.3' }}</span></div>
                      </template>
                      <template v-else-if="node.type === 'kb'">
                        <div class="flex justify-between"><span>知识库</span><span class="text-foreground truncate ml-2">{{ node.config?.knowledgeBaseId || '-' }}</span></div>
                        <div class="flex justify-between"><span>TopK</span><span class="text-foreground">{{ node.config?.topK ?? 5 }}</span></div>
                      </template>
                      <template v-else-if="node.type === 'http'">
                        <div class="truncate"><span class="text-primary font-medium">{{ node.config?.method || 'POST' }}</span> {{ node.config?.endpoint || '未配置 URL' }}</div>
                      </template>
                      <template v-else-if="node.type === 'condition'">
                        <div class="truncate">{{ node.config?.conditionExpression || node.config?.conditionField || '条件未配置' }}</div>
                      </template>
                      <template v-else-if="node.type === 'loop'">
                        <div class="flex justify-between"><span>类型</span><span class="text-foreground">{{ node.config?.loopType || 'forEach' }}</span></div>
                      </template>
                      <template v-else>
                        <div><span>Output: </span><span class="text-foreground">{{ node.output ?? node.description }}</span></div>
                      </template>
                    </div>
                    <p v-else class="flex-1 min-h-0 text-[11px] text-muted-foreground line-clamp-3">{{ node.description }}</p>

                    <div
                      v-for="port in getNodeOutputPorts(node)"
                      :key="`${node.id}-out-${port.id}`"
                      class="absolute -right-2 w-4 h-4 rounded-full border-2 bg-primary/90 border-primary cursor-crosshair hover:scale-125 transition-all z-10 group/port"
                      :style="getPortAnchorStyle(port)"
                      :title="port.label"
                      @mousedown.stop.prevent="startOutputConnection($event, node, port.id)"
                    >
                      <span class="absolute left-full ml-1 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/port:opacity-100 pointer-events-none">{{ port.label }}</span>
                    </div>
                    <div
                      v-for="port in getNodeInputPorts(node)"
                      :key="`${node.id}-in-${port.id}`"
                      class="absolute -left-2 w-4 h-4 rounded-full border-2 bg-background border-muted-foreground cursor-crosshair hover:border-primary hover:scale-125 transition-all z-10"
                      :class="connectingFrom ? 'ring-2 ring-primary/40' : ''"
                      :style="getPortAnchorStyle(port)"
                      :title="port.label"
                      @mouseup.stop.prevent="completeInputConnection($event, node, port.id)"
                    />
                  </div>
                </div>

                <!-- 选中连线：画布删除按钮 -->
                <div
                  v-if="selectedConnection"
                  data-workflow-connection-toolbar
                  class="absolute z-20 flex -translate-x-1/2 -translate-y-1/2"
                  :style="{
                    left: `${getConnectionMidpoint(selectedConnection).x}px`,
                    top: `${getConnectionMidpoint(selectedConnection).y}px`,
                  }"
                  @mousedown.stop
                >
                  <Button
                    variant="destructive"
                    size="icon"
                    class="h-7 w-7 shadow-md"
                    title="删除连线"
                    @mousedown.stop="removeConnection(selectedConnection.id)"
                  >
                    <AppIcon :icon="Trash2" size="sm" />
                  </Button>
                </div>
              </div>

              <div
                v-if="canvasNodes.length === 0"
                class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
              >
                暂无工作流节点，请从左侧拖入或点击重置
              </div>
            </div>
      </div>

      <!-- 版本列表 -->
      <div class="relative z-10 w-56 shrink-0 border-l border-border bg-card flex flex-col">
        <div class="p-3 border-b border-border space-y-2">
          <div>
            <h3 class="text-xs font-semibold text-foreground">版本历史</h3>
            <p class="text-[11px] text-muted-foreground mt-0.5">发布新版本创建新版本，保存更新当前版本</p>
          </div>
          <Button variant="outline" size="sm" class="w-full h-8 text-xs" @click="navigateTo('/workflow/executions')">
            查看历史执行
          </Button>
        </div>
        <ScrollArea class="flex-1">
          <div v-if="versionsLoading" class="p-4 flex justify-center">
            <Spinner class="size-4" />
          </div>
          <div v-else-if="workflowVersions.length === 0" class="p-4 text-center text-xs text-muted-foreground">
            暂无版本记录
          </div>
          <div v-else class="p-2 space-y-1">
            <div
              v-for="item in workflowVersions"
              :key="item.id"
              :class="[
                'rounded-lg border p-2.5 transition-colors cursor-pointer',
                item.id === selectedVersionId ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30',
              ]"
              @click="selectWorkflowVersion(item)"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="text-xs font-medium text-foreground">v{{ item.version }}</span>
                <div class="flex items-center gap-1">
                  <Badge v-if="item.isDefault" variant="secondary" class="text-[11px] px-1.5 py-0">当前</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-6 text-muted-foreground hover:text-destructive"
                    :disabled="workflowVersions.length <= 1 || deletingVersionId === item.id || savingVersionId === item.id"
                    :title="workflowVersions.length <= 1 ? '至少保留一个版本' : '删除此版本'"
                    @click.stop="deleteWorkflowVersion(item)"
                  >
                    <Spinner v-if="deletingVersionId === item.id" class="size-3" />
                    <Trash2 v-else class="size-3" />
                  </Button>
                </div>
              </div>
              <p class="text-[11px] text-muted-foreground mt-1">{{ formatVersionTime(item.publishedAt || item.createdAt) }}</p>
              <div class="flex gap-1.5 mt-2">
              <Button
                variant="outline"
                size="sm"
                class="h-6 flex-1 text-[11px]"
                :disabled="item.id !== selectedVersionId || savingVersionId === item.id"
                :title="item.id !== selectedVersionId ? '请先点击切换至该版本' : undefined"
                @click.stop="saveWorkflowVersion(item)"
              >
                <Spinner v-if="savingVersionId === item.id" class="size-3 mr-1" />
                保存
              </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <!-- 配置面板 -->
      <div class="relative z-10 w-72 shrink-0 border-l border-border bg-card flex flex-col">
        <ScrollArea class="flex-1">
          <div v-if="selectedNode" class="p-4 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-foreground">{{ selectedNode.name }}</h3>
              <Button
                v-if="!isProtectedWorkflowNode(selectedNode)"
                variant="ghost"
                size="icon"
                class="h-7 w-7 text-destructive"
                @click="removeNode(selectedNode.id)"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </Button>
            </div>

            <p v-if="isProtectedWorkflowNode(selectedNode)" class="text-xs text-muted-foreground">
              输入/输出节点为工作流固定节点，不可删除。
            </p>
            <p v-else class="text-[11px] text-muted-foreground">选中节点后按 Delete 键可删除</p>

            <WorkflowNodeConfigPanel
              v-model:config-tab="configTab"
              :node="selectedNode"
              :options="designerOptions"
              @update:config="onConfigUpdate"
            />
          </div>
          <div v-else-if="selectedConnection" class="p-4 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-foreground">连线</h3>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7 text-destructive"
                @click="removeConnection(selectedConnection.id)"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ getNodeName(selectedConnection.from) }}{{ getPortLabel(selectedConnection.fromPort) }}
              →
              {{ getNodeName(selectedConnection.to) }}{{ getPortLabel(selectedConnection.toPort) }}
            </p>
            <p class="text-[11px] text-muted-foreground">点击画布中连线或按 Delete 键删除</p>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-16 text-center p-4">
            <svg class="w-10 h-10 text-muted-foreground mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            <p class="text-muted-foreground text-xs">选择一个节点或连线进行配置</p>
          </div>
        </ScrollArea>
      </div>
    </div>

    <!-- 移动端布局 -->
    <div class="lg:hidden flex-1 flex flex-col">
      <div class="flex items-center justify-between px-4 py-3 border-b shrink-0 gap-2">
        <CardTitle class="text-base shrink-0">工作流画布</CardTitle>
        <div class="flex items-center gap-1 min-w-0 justify-center flex-1">
          <Button variant="ghost" size="icon" class="size-8" @click="undo" :disabled="historyIndex <= 0" title="撤销">
            <AppIcon :icon="Undo2" size="sm" />
          </Button>
          <Button variant="ghost" size="icon" class="size-8" @click="redo" :disabled="historyIndex >= history.length - 1" title="重做">
            <AppIcon :icon="Redo2" size="sm" />
          </Button>
          <Button variant="outline" size="icon" @click="zoomOut" class="h-8 w-8" title="缩小">
            <AppIcon :icon="Minus" size="sm" />
          </Button>
          <span class="text-xs text-muted-foreground w-10 text-center tabular-nums">{{ Math.round(zoom * 100) }}%</span>
          <Button variant="outline" size="icon" @click="zoomIn" class="h-8 w-8" title="放大">
            <AppIcon :icon="Plus" size="sm" />
          </Button>
          <Button variant="outline" size="icon" @click="resetZoom" class="h-8 w-8" title="适应屏幕">
            <AppIcon :icon="Maximize2" size="sm" />
          </Button>
        </div>
        <Button variant="outline" size="sm" class="h-8 text-xs shrink-0 px-2" @click="resetWorkflow">重置</Button>
      </div>
      <div
        ref="canvasViewportMobile"
        class="flex-1 relative min-h-[280px] overflow-hidden bg-muted/30"
        @dragover.prevent
        @drop="handleDrop"
        @mousedown="startCanvasDrag"
        @wheel.prevent="handleWheel"
      >
        <div
          class="absolute left-0 top-0 origin-top-left will-change-transform"
          :style="canvasTransformStyle"
        >
          <svg
            :width="canvasLayerSize.width"
            :height="canvasLayerSize.height"
            class="absolute top-0 left-0 z-0 block pointer-events-none"
          >
            <defs>
              <pattern id="grid-mobile" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" stroke-width="0.5"/>
              </pattern>
              <marker id="flow-arrow-mobile" viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--muted-foreground))" />
              </marker>
              <marker id="flow-arrow-mobile-active" viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--primary))" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-mobile)" />

            <g v-for="conn in connections" :key="conn.id" data-workflow-connection @mousedown.stop>
              <path
                :d="getConnectionPath(conn)"
                fill="none"
                stroke="transparent"
                stroke-width="20"
                class="cursor-pointer pointer-events-auto"
                @click.stop="selectConnection(conn)"
              />
              <path
                :d="getConnectionPath(conn)"
                fill="none"
                stroke-linecap="butt"
                stroke-linejoin="round"
                :stroke="selectedConnection?.id === conn.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'"
                :stroke-width="selectedConnection?.id === conn.id ? 2.5 : 1.75"
                :marker-end="selectedConnection?.id === conn.id ? 'url(#flow-arrow-mobile-active)' : 'url(#flow-arrow-mobile)'"
                class="pointer-events-none"
              />
            </g>
            <path
              v-if="connectingFrom"
              :d="connectionPreviewPath"
              fill="none"
              stroke="hsl(var(--primary))"
              stroke-width="2"
              stroke-dasharray="6 4"
              class="pointer-events-none"
            />
          </svg>

          <div
            v-for="node in canvasNodes"
            :key="node.id"
            class="absolute z-10 cursor-move group"
            :style="{ left: node.x + 'px', top: node.y + 'px' }"
            @mousedown.stop="startNodeDrag($event, node)"
            @click.stop="selectCanvasNode(node)"
          >
            <div :class="[
              'relative w-52 h-[120px] box-border flex flex-col p-3 rounded-xl shadow-md transition-all duration-200 bg-card border-2',
              selectedNode?.id === node.id ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border'
            ]">
              <div class="flex items-center justify-between mb-2 shrink-0">
                <div class="flex items-center gap-2 min-w-0">
                  <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden', getWorkflowNodeColorClass(node)]">
                    <WorkflowNodeIcon :key="`canvas-sm-${node.id}`" :node="node" size="xs" />
                  </div>
                  <span class="font-medium text-foreground text-sm truncate">{{ node.name }}</span>
                </div>
                <Button
                  v-if="!isProtectedWorkflowNode(node)"
                  variant="ghost"
                  size="icon"
                  @click.stop="removeNode(node.id)"
                  class="h-6 w-6 text-white/60 hover:text-white hover:bg-white/20"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <p class="flex-1 min-h-0 text-[11px] text-muted-foreground line-clamp-3">{{ node.description }}</p>

              <div
                v-for="port in getNodeOutputPorts(node)"
                :key="`${node.id}-out-${port.id}`"
                class="absolute -right-2 w-4 h-4 rounded-full border-2 bg-primary/90 border-primary cursor-crosshair hover:scale-125 transition-all z-10"
                :style="getPortAnchorStyle(port)"
                :title="port.label"
                @mousedown.stop.prevent="startOutputConnection($event, node, port.id)"
              />
              <div
                v-for="port in getNodeInputPorts(node)"
                :key="`${node.id}-in-${port.id}`"
                class="absolute -left-2 w-4 h-4 rounded-full border-2 bg-background border-muted-foreground cursor-crosshair hover:border-primary hover:scale-125 transition-all z-10"
                :class="connectingFrom ? 'ring-2 ring-primary/40' : ''"
                :style="getPortAnchorStyle(port)"
                :title="port.label"
                @mouseup.stop.prevent="completeInputConnection($event, node, port.id)"
              />
            </div>
          </div>

          <!-- 选中连线：画布删除按钮（移动端） -->
          <div
            v-if="selectedConnection"
            data-workflow-connection-toolbar
            class="absolute z-20 flex -translate-x-1/2 -translate-y-1/2"
            :style="{
              left: `${getConnectionMidpoint(selectedConnection).x}px`,
              top: `${getConnectionMidpoint(selectedConnection).y}px`,
            }"
            @mousedown.stop
          >
            <Button
              variant="destructive"
              size="icon"
              class="h-7 w-7 shadow-md"
              title="删除连线"
              @mousedown.stop="removeConnection(selectedConnection.id)"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </Button>
          </div>
        </div>

        <div
          v-if="canvasNodes.length === 0"
          class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground px-6 text-center"
        >
          暂无工作流节点，请从节点库拖入或点击重置
        </div>
      </div>

      <div class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-lg">
        <button
          v-for="tab in mobileTabs"
          :key="tab.key"
          @click="mobileScreen = tab.key"
          class="flex flex-col items-center gap-1 py-3 px-4 text-xs font-medium transition-colors min-w-0"
          :class="mobileScreen === tab.key ? 'text-primary' : 'text-muted-foreground'"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="tab.key === 'nodes'" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            <path v-if="tab.key === 'canvas'" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
            <path v-if="tab.key === 'properties'" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <Transition name="slide-up">
        <div
          v-if="mobileScreen !== 'canvas'"
          class="fixed left-0 right-0 z-40 rounded-t-2xl shadow-lg border-t overflow-y-auto bg-background"
          style="bottom: calc(env(safe-area-inset-bottom, 0px) + 56px); max-height: 60vh;"
        >
          <div class="flex items-center justify-center pt-2 pb-1">
            <div class="w-10 h-1 rounded-full bg-muted" />
          </div>

          <div v-if="mobileScreen === 'nodes'" class="p-4">
            <h3 class="font-semibold text-foreground mb-3 text-lg">节点库</h3>
            <p class="text-sm text-muted-foreground mb-4">拖拽节点到画布</p>
            <div class="space-y-3">
              <div
                v-for="node in nodeLibrary"
                :key="node.id"
                draggable="true"
                @dragstart="handleDragStart($event, node)"
                class="flex items-center gap-3 p-3 rounded-lg border cursor-grab hover:shadow-md transition-all duration-200 active:cursor-grabbing hover:border-primary"
              >
                <div :class="['w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden', getWorkflowNodeColorClass(node)]">
                  <WorkflowNodeIcon :key="`mobile-${node.id}`" :node="node" size="md" />
                </div>
                <div>
                  <div class="font-medium text-foreground text-sm">{{ node.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ node.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="mobileScreen === 'properties'" class="p-4">
            <h3 class="font-semibold text-foreground mb-3 text-lg">属性面板</h3>
            <div v-if="selectedConnection" class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">连线</h4>
                <Button variant="destructive" size="sm" class="h-8 text-xs" @click="removeConnection(selectedConnection.id)">
                  删除连线
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ getNodeName(selectedConnection.from) }}{{ getPortLabel(selectedConnection.fromPort) }}
                →
                {{ getNodeName(selectedConnection.to) }}
              </p>
            </div>
            <div v-else-if="selectedNode" class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium">{{ selectedNode.name }}</h4>
                <Button
                  v-if="!isProtectedWorkflowNode(selectedNode)"
                  variant="destructive"
                  size="sm"
                  class="h-8 text-xs"
                  @click="removeNode(selectedNode.id)"
                >
                  删除节点
                </Button>
              </div>
              <WorkflowNodeConfigPanel
                v-model:config-tab="configTab"
                :node="selectedNode"
                :options="designerOptions"
                @update:config="onConfigUpdate"
              />
            </div>
            <div v-else class="flex flex-col items-center justify-center py-12 text-center">
              <svg class="w-12 h-12 text-muted-foreground mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p class="text-muted-foreground">选择一个节点或连线进行编辑</p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    </template>

    <ExecutionFlowDialog
      v-model:open="testFlowOpen"
      :execution-group-id="testExecutionGroupId"
      title="工作流测试"
      :subtitle="testFlowSubtitle"
      empty-hint="测试启动后将逐步展示每步输入输出（不写入简历库）"
      @finished="handleTestFlowFinished"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', ssr: false })

import { ref, reactive, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { navigateTo } from 'nuxt/app'
import {
  ArrowLeft,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  X,
} from 'lucide-vue-next'
import { AppIcon } from '~/components/ui/icon'
import { api } from '~/utils/api'
import {
  RESET_WORKFLOW,
  isProtectedWorkflowNode,
  normalizeWorkflowPayload,
  type WorkflowVersionListItem,
} from '~/utils/defaultWorkflow'
import { resolveSampleWorkflowPayload } from '~/utils/sampleWorkflow'
import WorkflowNodeConfigPanel from '~/components/workflow/WorkflowNodeConfigPanel.vue'
import WorkflowNodeIcon from '~/components/workflow/WorkflowNodeIcon.vue'
import { getWorkflowNodeColorClass } from '~/utils/workflowNodeIcons'
import {
  getNodeInputPorts,
  getNodeOutputPorts,
  getPortAnchorStyle,
  getPortLabel,
  getPortPosition,
  isAgentLikeNode,
  mergeNodeConfig,
  WORKFLOW_NODE_HEIGHT,
  WORKFLOW_NODE_WIDTH,
  type WorkflowDesignerOptionsExtended,
  type WorkflowNodeConfigExtended,
  type WorkflowPortId,
} from '~/utils/workflowNodeMeta'
import {
  buildBezierPath,
  clientPointToCanvas,
  computeWorkflowCanvasLayerSize,
  normalizeCanvasConnections,
  upsertWorkflowConnection,
  validateWorkflowConnection,
} from '~/utils/workflowConnectionEditor'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/Badge'
import { CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/Input'
import { ScrollArea } from '~/components/ui/ScrollArea'
import { Separator } from '~/components/ui/Separator'
import LoadingState from '~/components/ui/LoadingState.vue'
import ExecutionFlowDialog from '~/components/workflow/ExecutionFlowDialog.vue'
import { Spinner } from '~/components/ui/spinner'
import type { WorkflowExecutionPollResult } from '~/composables/useWorkflowExecutionPoll'
import { useAppToast } from '~/composables/useAppToast'
import { useAppConfirm } from '~/composables/useAppConfirm'

const loadingStore = useLoadingStore()
const toast = useAppToast()
const appConfirm = useAppConfirm()

const pageLoading = ref(true)
const isApplyingSample = ref(false)

const autoSaveTime = ref('10:30:45')
const nodeSearch = ref('')
const configTab = ref('config')
const selectedLibraryNode = ref<any>(null)
const designerOptions = ref<WorkflowDesignerOptionsExtended>({})

const nodeLibrary = ref<any[]>([])
const nodeCategories = ref<Array<{ key: string; name: string; nodes: any[] }>>([])

const loadNodeLibrary = async () => {
  try {
    const res = await api.workflows.getNodeLibrary()
    if (res.success && res.data) {
      if (res.data.categories?.length) {
        nodeCategories.value = res.data.categories
        nodeLibrary.value = res.data.categories.flatMap((c) => c.nodes)
      }
      if (res.data.options) {
        designerOptions.value = res.data.options
      }
    }
    if (!designerOptions.value.models?.length) {
      const llmRes = await api.workflows.listLlmModels()
      if (llmRes.success && llmRes.data?.models?.length) {
        designerOptions.value = {
          ...designerOptions.value,
          models: llmRes.data.models.map((m: { label: string; value: string }) => ({
            label: m.label,
            value: m.value,
          })),
          defaultConfig: {
            ...designerOptions.value.defaultConfig,
            model: llmRes.data.defaultModelId,
          },
        }
      }
    }
  } catch (e) {
    console.error('加载节点库失败:', e)
  }
}

const selectLibraryNode = (node: any) => {
  selectedLibraryNode.value = node
}

const selectConnection = (conn: any) => {
  selectedConnection.value = conn
  selectedNode.value = null
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    mobileScreen.value = 'properties'
  }
}

const getNodeName = (nodeId: string) =>
  canvasNodes.value.find((n) => n.id === nodeId)?.name || nodeId

const selectCanvasNode = (node: any) => {
  selectedNode.value = node
  selectedConnection.value = null
  configTab.value = 'config'
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    mobileScreen.value = 'properties'
  }
}

const onConfigUpdate = (cfg: WorkflowNodeConfigExtended) => {
  if (!selectedNode.value) return
  const nodeId = selectedNode.value.id
  const index = canvasNodes.value.findIndex((n) => n.id === nodeId)
  if (index < 0) return

  const node = canvasNodes.value[index]
  node.config = { ...(node.config || {}), ...cfg }
  if (cfg.temperature != null) node.temp = cfg.temperature
  selectedNode.value = node
  saveToHistory()
}

const showToast = (message: string, variant: 'default' | 'success' | 'warning' | 'error' = 'default') => {
  toast.show(message, variant)
}

const mobileScreen = ref('canvas')
const mobileTabs = ref([
  { key: 'nodes', label: '节点库' },
  { key: 'canvas', label: '画布' },
  { key: 'properties', label: '属性' }
])

const zoom = ref(1)
const pan = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0, panX: 0, panY: 0 })
const selectedNode = ref<any>(null)
const selectedConnection = ref<any>(null)
const draggedNode = ref<any>(null)
const canvasContainer = ref<HTMLElement | null>(null)
const canvasViewport = ref<HTMLElement | null>(null)
const canvasViewportMobile = ref<HTMLElement | null>(null)
const currentWorkflowId = ref<number | null>(null)
const selectedVersionId = ref<number | null>(null)
const currentVersion = ref<number | null>(null)
const workflowVersions = ref<WorkflowVersionListItem[]>([])
const versionsLoading = ref(false)
const savingVersionId = ref<number | null>(null)
const deletingVersionId = ref<number | null>(null)
const isTestingWorkflow = ref(false)
const testFlowOpen = ref(false)
const testExecutionGroupId = ref<string | null>(null)

const testFlowSubtitle = computed(() => {
  const version = currentVersion.value != null ? `v${currentVersion.value}` : '当前画布'
  return `正在测试 ${version} · 不写入简历库`
})

const connectingFrom = ref<{ nodeId: string; fromPort: WorkflowPortId; x: number; y: number } | null>(null)
const connectionPreview = reactive({ x: 0, y: 0 })

const connectionPreviewPath = computed(() => {
  if (!connectingFrom.value) return ''
  return buildBezierPath(
    { x: connectingFrom.value.x, y: connectingFrom.value.y },
    { x: connectionPreview.x, y: connectionPreview.y },
  )
})

const NODE_WIDTH = WORKFLOW_NODE_WIDTH
const NODE_HEIGHT = WORKFLOW_NODE_HEIGHT
const CANVAS_FALLBACK = { width: 960, height: 640 }

const getConnectionMidpoint = (conn: { from: string; to: string; fromPort?: string; toPort?: string }) => {
  const fromNode = canvasNodes.value.find((n) => n.id === conn.from)
  const toNode = canvasNodes.value.find((n) => n.id === conn.to)
  if (!fromNode || !toNode) return { x: 0, y: 0 }
  const from = getPortPosition(fromNode, 'output', (conn.fromPort as any) || 'default', NODE_WIDTH, NODE_HEIGHT)
  const to = getPortPosition(toNode, 'input', (conn.toPort as any) || 'default', NODE_WIDTH, NODE_HEIGHT)
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
}

const canvasTransformStyle = computed(() => ({
  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom.value})`,
  transformOrigin: '0 0',
}))

const canvasLayerSize = computed(() =>
  computeWorkflowCanvasLayerSize(canvasNodes.value, NODE_WIDTH, NODE_HEIGHT),
)

const getActiveCanvasViewport = () => {
  if (typeof window === 'undefined') return canvasViewport.value
  const desktop = canvasViewport.value
  const mobile = canvasViewportMobile.value
  if (desktop && desktop.offsetParent !== null && desktop.clientWidth > 0) return desktop
  if (mobile && mobile.offsetParent !== null && mobile.clientWidth > 0) return mobile
  return desktop || mobile
}

const canvasNodes = ref<any[]>([])
const connections = ref<any[]>([])

const rebindSelectedFromCanvas = () => {
  const nodeId = selectedNode.value?.id
  const connId = selectedConnection.value?.id
  selectedNode.value = nodeId ? canvasNodes.value.find((n) => n.id === nodeId) ?? null : null
  selectedConnection.value = connId ? connections.value.find((c) => c.id === connId) ?? null : null
}

const applyWorkflow = (workflow: {
  id?: number | null
  version?: number
  nodes?: unknown
  connections?: unknown
}) => {
  const normalized = normalizeWorkflowPayload(workflow)
  if (workflow.id) {
    currentWorkflowId.value = workflow.id
    selectedVersionId.value = workflow.id
  }
  if (workflow.version) currentVersion.value = workflow.version
  canvasNodes.value = JSON.parse(JSON.stringify(normalized.nodes))
  connections.value = JSON.parse(JSON.stringify(normalized.connections))
  rebindSelectedFromCanvas()
  scheduleCanvasView()
}

const loadInitialWorkflow = async () => {
  versionsLoading.value = true
  try {
    const listResult = await api.workflows.listVersions()
    const versions = listResult.success ? listResult.data?.versions ?? [] : []
    workflowVersions.value = versions

    const defaultVersion = versions.find((v) => v.isDefault) ?? versions[0]
    const targetId = defaultVersion?.id ?? null

    if (targetId) {
      const detailResult = await api.workflows.getVersion(targetId)
      if (detailResult.success && detailResult.data) {
        applyWorkflow(detailResult.data)
        return
      }
    }
  } catch (error) {
    console.error('加载工作流失败:', error)
  } finally {
    versionsLoading.value = false
  }

  applyWorkflow(RESET_WORKFLOW)
}

const loadWorkflowVersions = async () => {
  versionsLoading.value = true
  try {
    const result = await api.workflows.listVersions()
    if (result.success && result.data?.versions) {
      workflowVersions.value = result.data.versions
    }
  } catch (error) {
    console.error('加载工作流版本失败:', error)
  } finally {
    versionsLoading.value = false
  }
}

const selectWorkflowVersion = async (item: { id: number; version: number; isDefault: boolean }) => {
  if (selectedVersionId.value === item.id) return

  try {
    const result = await api.workflows.getVersion(item.id)
    if (result.success && result.data) {
      applyWorkflow(result.data)
      selectedNode.value = null
      selectedConnection.value = null
      saveToHistory()
      showToast(`已切换至 v${item.version}`, 'success')
    } else {
      showToast('加载版本失败，请稍后重试', 'error')
    }
  } catch (error) {
    console.error('切换工作流版本失败:', error)
    showToast('切换版本失败：' + (error instanceof Error ? error.message : '未知错误'), 'error')
  }
}

const formatVersionTime = (value?: string) => {
  if (!value) return '未知时间'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const flushCanvasFromSelection = () => {
  if (!selectedNode.value) return
  const index = canvasNodes.value.findIndex((n) => n.id === selectedNode.value.id)
  if (index < 0) return

  const node = canvasNodes.value[index]
  if (selectedNode.value !== node) {
    node.config = { ...(node.config || {}), ...(selectedNode.value.config || {}) }
    node.name = selectedNode.value.name ?? node.name
    node.description = selectedNode.value.description ?? node.description
    if (selectedNode.value.temp != null) node.temp = selectedNode.value.temp
    selectedNode.value = node
  }
}

const buildWorkflowPayload = () => {
  flushCanvasFromSelection()
  const nodes = JSON.parse(JSON.stringify(canvasNodes.value))
  const normalizedConnections = normalizeCanvasConnections(nodes, connections.value)
  connections.value = normalizedConnections
  return {
    name: '简历优化工作流',
    description: '从前端设计器保存的智能体编排',
    nodes,
    connections: JSON.parse(JSON.stringify(normalizedConnections)),
    config: { workflowType: 'resume_optimize' },
  }
}

const saveWorkflowVersion = async (item: WorkflowVersionListItem) => {
  if (item.id !== selectedVersionId.value) {
    showToast('请先切换至该版本后再保存', 'warning')
    return
  }

  savingVersionId.value = item.id
  try {
    const result = await api.workflows.update(item.id, buildWorkflowPayload())
    if (result.success && result.data) {
      applyWorkflow(result.data)
      saveToHistory()
      await loadWorkflowVersions()
      showToast(`v${item.version} 已保存`, 'success')
    } else {
      showToast(result.message || '保存失败，请稍后重试', 'error')
    }
  } catch (error) {
    console.error('保存工作流版本失败:', error)
    showToast('保存失败：' + (error instanceof Error ? error.message : '未知错误'), 'error')
  } finally {
    savingVersionId.value = null
  }
}

const deleteWorkflowVersion = async (item: WorkflowVersionListItem) => {
  if (workflowVersions.value.length <= 1) {
    showToast('至少保留一个工作流版本', 'warning')
    return
  }

  const confirmed = await appConfirm.confirm({
    title: '删除版本',
    description: `确定删除 v${item.version} 吗？该版本的画布节点与连线配置将一并删除，且不可恢复。`,
    confirmText: '删除',
    cancelText: '取消',
    variant: 'destructive',
  })
  if (!confirmed) return

  deletingVersionId.value = item.id
  try {
    const result = await api.workflows.deleteVersion(item.id)
    if (!result.success) {
      showToast(result.message || result.error?.message || '删除失败', 'error')
      return
    }

    showToast(result.message || `v${item.version} 已删除`, 'success')
    await loadWorkflowVersions()

    if (selectedVersionId.value === item.id) {
      const fallback = workflowVersions.value[0]
      if (fallback) {
        await selectWorkflowVersion(fallback)
      } else {
        selectedVersionId.value = null
        canvasNodes.value = []
        connections.value = []
      }
    }
  } catch (error) {
    console.error('删除工作流版本失败:', error)
    showToast('删除失败：' + (error instanceof Error ? error.message : '未知错误'), 'error')
  } finally {
    deletingVersionId.value = null
  }
}

const history = ref<string[]>([])
const historyIndex = ref(-1)

const initHistory = () => {
  history.value = [JSON.stringify({ nodes: canvasNodes.value, connections: connections.value })]
  historyIndex.value = 0
}

const saveToHistory = () => {
  const state = JSON.stringify({ nodes: canvasNodes.value, connections: connections.value })
  if (state === history.value[historyIndex.value]) return
  
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(state)
  historyIndex.value = history.value.length - 1
  
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
}

const undo = () => {
  if (historyIndex.value <= 0) return
  
  historyIndex.value--
  const state = JSON.parse(history.value[historyIndex.value])
  canvasNodes.value = JSON.parse(JSON.stringify(state.nodes))
  connections.value = JSON.parse(JSON.stringify(state.connections))
  selectedNode.value = null
}

const redo = () => {
  if (historyIndex.value >= history.value.length - 1) return
  
  historyIndex.value++
  const state = JSON.parse(history.value[historyIndex.value])
  canvasNodes.value = JSON.parse(JSON.stringify(state.nodes))
  connections.value = JSON.parse(JSON.stringify(state.connections))
  selectedNode.value = null
}

watch(
  () => selectedNode.value?.name || selectedNode.value?.description,
  () => {
    if (selectedNode.value) saveToHistory()
  }
)

const getContentBounds = () => {
  if (canvasNodes.value.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600, centerX: 400, centerY: 300 }
  }

  const xs = canvasNodes.value.map((n) => Number(n.x)).filter(Number.isFinite)
  const ys = canvasNodes.value.map((n) => Number(n.y)).filter(Number.isFinite)
  if (xs.length === 0 || ys.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600, centerX: 400, centerY: 300 }
  }

  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...canvasNodes.value.map((n) => Number(n.x) + NODE_WIDTH))
  const maxY = Math.max(...canvasNodes.value.map((n) => Number(n.y) + NODE_HEIGHT))

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

const computeCanvasFit = (
  bounds: ReturnType<typeof getContentBounds>,
  viewW: number,
  viewH: number,
) => {
  const padding = 48
  const safeW = Math.max(viewW, 320)
  const safeH = Math.max(viewH, 240)
  const scaleX = (safeW - padding * 2) / bounds.width
  const scaleY = (safeH - padding * 2) / bounds.height
  const fitZoom = Math.min(scaleX, scaleY)
  const nextZoom = Math.min(Math.max(fitZoom, 0.35), 1.5)
  return {
    zoom: nextZoom,
    panX: safeW / 2 - bounds.centerX * nextZoom,
    panY: safeH / 2 - bounds.centerY * nextZoom,
  }
}

const applyCanvasFit = (viewW: number, viewH: number) => {
  const fit = computeCanvasFit(getContentBounds(), viewW, viewH)
  zoom.value = fit.zoom
  pan.x = fit.panX
  pan.y = fit.panY
}

applyCanvasFit(CANVAS_FALLBACK.width, CANVAS_FALLBACK.height)

const initCanvasView = () => {
  const container = getActiveCanvasViewport()
  const viewW = container?.clientWidth || CANVAS_FALLBACK.width
  const viewH = container?.clientHeight || CANVAS_FALLBACK.height
  applyCanvasFit(viewW, viewH)
}

let canvasResizeObserver: ResizeObserver | null = null

const scheduleCanvasView = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      initCanvasView()
      window.setTimeout(initCanvasView, 120)
      window.setTimeout(initCanvasView, 360)
    })
  })
}

const observeCanvasViewport = (el: HTMLElement) => {
  if (typeof ResizeObserver === 'undefined') return
  if (!canvasResizeObserver) {
    canvasResizeObserver = new ResizeObserver(() => {
      if (canvasNodes.value.length > 0) initCanvasView()
    })
  }
  canvasResizeObserver.observe(el)
}

onMounted(async () => {
  pageLoading.value = true
  try {
    initCanvasView()
    await loadNodeLibrary()
    await loadInitialWorkflow()
    initHistory()
    scheduleCanvasView()
    window.addEventListener('keydown', handleKeydown)

    await nextTick()
    const desktopViewport = canvasViewport.value
    const mobileViewport = canvasViewportMobile.value
    if (desktopViewport) observeCanvasViewport(desktopViewport)
    if (mobileViewport) observeCanvasViewport(mobileViewport)
  } finally {
    pageLoading.value = false
  }
})

watch(
  () => loadingStore.booting,
  (booting) => {
    if (!booting) scheduleCanvasView()
  },
)

const startCanvasDrag = (event: MouseEvent) => {
  if (event.button !== 0) return
  const target = event.target as HTMLElement
  if (target.closest('.cursor-move')) return
  if (target.closest('[data-workflow-connection]')) return
  if (target.closest('[data-workflow-connection-toolbar]')) return

  selectedNode.value = null
  selectedConnection.value = null
  
  isDragging.value = true
  dragStart.x = event.clientX
  dragStart.y = event.clientY
  dragStart.panX = pan.x
  dragStart.panY = pan.y
  
  document.addEventListener('mousemove', handleCanvasDrag)
  document.addEventListener('mouseup', stopCanvasDrag)
}

const handleCanvasDrag = (event: MouseEvent) => {
  if (!isDragging.value) return
  
  pan.x = dragStart.panX + (event.clientX - dragStart.x)
  pan.y = dragStart.panY + (event.clientY - dragStart.y)
}

const stopCanvasDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleCanvasDrag)
  document.removeEventListener('mouseup', stopCanvasDrag)
}

onUnmounted(() => {
  canvasResizeObserver?.disconnect()
  canvasResizeObserver = null
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleCanvasDrag)
  document.removeEventListener('mouseup', stopCanvasDrag)
  document.removeEventListener('mousemove', handleConnectionPreviewMove)
  document.removeEventListener('mouseup', cancelConnectionDraft)
})

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  const rect = event.currentTarget.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.min(Math.max(zoom.value + delta, 0.3), 2.5)
  
  const scale = newZoom / zoom.value
  pan.x = mouseX - (mouseX - pan.x) * scale
  pan.y = mouseY - (mouseY - pan.y) * scale
  
  zoom.value = newZoom
}

const filteredNodeCategories = computed(() => {
  const q = nodeSearch.value.toLowerCase()
  const filterNodes = (nodes: any[]) =>
    nodes.filter(n => !q || n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q))

  return nodeCategories.value
    .map((c) => ({ name: c.name, nodes: filterNodes(c.nodes) }))
    .filter((c) => c.nodes.length > 0)
})

const getConnectionPath = (conn: any) => {
  const fromNode = canvasNodes.value.find(n => n.id === conn.from)
  const toNode = canvasNodes.value.find(n => n.id === conn.to)

  if (!fromNode || !toNode) return ''

  const fromPort = conn.fromPort || 'default'
  const toPort = conn.toPort || 'default'
  const from = getPortPosition(fromNode, 'output', fromPort, NODE_WIDTH, NODE_HEIGHT)
  const to = getPortPosition(toNode, 'input', toPort, NODE_WIDTH, NODE_HEIGHT)
  return buildBezierPath(from, to)
}

const cancelConnectionDraft = () => {
  connectingFrom.value = null
  document.removeEventListener('mousemove', handleConnectionPreviewMove)
  document.removeEventListener('mouseup', cancelConnectionDraft)
}

const handleConnectionPreviewMove = (event: MouseEvent) => {
  if (!connectingFrom.value) return
  const viewport = getActiveCanvasViewport()
  if (!viewport) return
  const point = clientPointToCanvas(
    event.clientX,
    event.clientY,
    viewport.getBoundingClientRect(),
    pan,
    zoom.value,
  )
  connectionPreview.x = point.x
  connectionPreview.y = point.y
}

const startOutputConnection = (event: MouseEvent, node: any, portId: WorkflowPortId) => {
  if (node.type === 'output') return
  const from = getPortPosition(node, 'output', portId, NODE_WIDTH, NODE_HEIGHT)
  connectingFrom.value = { nodeId: node.id, fromPort: portId, x: from.x, y: from.y }
  connectionPreview.x = from.x
  connectionPreview.y = from.y
  selectedConnection.value = null
  document.addEventListener('mousemove', handleConnectionPreviewMove)
  document.addEventListener('mouseup', cancelConnectionDraft)
  handleConnectionPreviewMove(event)
}

const completeInputConnection = (_event: MouseEvent, node: any, portId: WorkflowPortId) => {
  if (!connectingFrom.value) return
  const fromNode = canvasNodes.value.find((n) => n.id === connectingFrom.value!.nodeId)
  if (!fromNode) {
    cancelConnectionDraft()
    return
  }

  const error = validateWorkflowConnection(fromNode, node)
  if (error) {
    showToast(error, 'warning')
    cancelConnectionDraft()
    return
  }

  connections.value = upsertWorkflowConnection(connections.value, {
    from: fromNode.id,
    fromPort: connectingFrom.value.fromPort,
    to: node.id,
    toPort: portId,
  })
  saveToHistory()
  cancelConnectionDraft()
  showToast('连线已创建', 'success')
}

const deleteSelected = () => {
  if (selectedConnection.value) {
    removeConnection(selectedConnection.value.id)
    return
  }
  if (selectedNode.value && !isProtectedWorkflowNode(selectedNode.value)) {
    removeNode(selectedNode.value.id)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && connectingFrom.value) {
    cancelConnectionDraft()
    return
  }
  if (event.key !== 'Delete' && event.key !== 'Backspace') return
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
  if (!selectedNode.value && !selectedConnection.value) return
  event.preventDefault()
  deleteSelected()
}

const handleDragStart = (event: DragEvent, node: any) => {
  draggedNode.value = node
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleDrop = (event: DragEvent) => {
  if (!draggedNode.value) return

  const viewport = getActiveCanvasViewport() || (event.currentTarget as HTMLElement)
  const rect = viewport.getBoundingClientRect()
  const x = (event.clientX - rect.left - pan.x) / zoom.value - NODE_WIDTH / 2
  const y = (event.clientY - rect.top - pan.y) / zoom.value - NODE_HEIGHT / 2
  
  const template = draggedNode.value
  const instanceId = `${template.id}_${Date.now()}`
  const newNode = {
    ...JSON.parse(JSON.stringify(template)),
    templateId: template.id,
    id: instanceId,
    type: template.type || template.id,
    category: template.category || (['llm', 'kb', 'http', 'code', 'condition', 'loop', 'aggregate'].includes(template.type) ? 'tool' : 'agent'),
    agentType: template.agentType,
    x: Math.max(0, x),
    y: Math.max(0, y),
    config: mergeNodeConfig(template.type || template.id, { ...(template.config || {}) }),
    temp: template.config?.temperature ?? template.temp ?? 0.4,
  }
  
  canvasNodes.value.push(newNode)
  draggedNode.value = null
  saveToHistory()
}

const startNodeDrag = (event: MouseEvent, node: any) => {
  selectedNode.value = node

  const viewport = getActiveCanvasViewport()
  if (!viewport) return

  const rect = viewport.getBoundingClientRect()
  const offsetX = (event.clientX - rect.left - pan.x) / zoom.value - node.x
  const offsetY = (event.clientY - rect.top - pan.y) / zoom.value - node.y
  
  const handleMouseMove = (e: MouseEvent) => {
    node.x = (e.clientX - rect.left - pan.x) / zoom.value - offsetX
    node.y = (e.clientY - rect.top - pan.y) / zoom.value - offsetY
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    saveToHistory()
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const removeNode = (id: string) => {
  const node = canvasNodes.value.find((n) => n.id === id)
  if (!node || isProtectedWorkflowNode(node)) return
  saveToHistory()
  canvasNodes.value = canvasNodes.value.filter((n) => n.id !== id)
  connections.value = connections.value.filter((c) => c.from !== id && c.to !== id)
  if (selectedNode.value?.id === id) selectedNode.value = null
}

const removeConnection = (id: string) => {
  if (!id) return
  saveToHistory()
  connections.value = connections.value.filter((c) => c.id !== id)
  if (selectedConnection.value?.id === id) selectedConnection.value = null
}

const resetWorkflow = async () => {
  const confirmed = await appConfirm.confirm({
    title: '重置工作流',
    description: '确定重置工作流？将移除所有智能体节点，仅保留输入与输出。',
    confirmText: '重置',
    cancelText: '取消',
    variant: 'destructive',
  })
  if (!confirmed) return
  canvasNodes.value = JSON.parse(JSON.stringify(RESET_WORKFLOW.nodes))
  connections.value = JSON.parse(JSON.stringify(RESET_WORKFLOW.connections))
  selectedNode.value = null
  selectedConnection.value = null
  saveToHistory()
  scheduleCanvasView()
}

const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 2)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
}

const resetZoom = () => {
  scheduleCanvasView()
}

const handleTestFlowFinished = (outcome: WorkflowExecutionPollResult) => {
  isTestingWorkflow.value = false
  if (outcome.status === 'completed') {
    showToast(`工作流测试完成（${outcome.stepCount} 步，未写入简历库）`, 'success')
  } else {
    showToast(outcome.errorMessage || '工作流测试失败', 'error')
  }
}

watch(testFlowOpen, (open) => {
  if (!open) isTestingWorkflow.value = false
})

const testWorkflow = async () => {
  flushCanvasFromSelection()
  if (canvasNodes.value.length === 0) {
    showToast('请先在画布上添加工作流节点', 'warning')
    return
  }

  isTestingWorkflow.value = true
  testExecutionGroupId.value = null
  testFlowOpen.value = true

  try {
    const payload = buildWorkflowPayload()
    const result = await api.workflows.test({
      name: payload.name,
      nodes: payload.nodes,
      connections: payload.connections,
      workflowId: currentWorkflowId.value ?? undefined,
      idempotencyKey: `designer-test-${Date.now()}`,
    })

    if (!result.success || !result.data?.executionGroupId) {
      testFlowOpen.value = false
      isTestingWorkflow.value = false
      showToast(result.message || '启动测试失败', 'error')
      return
    }

    testExecutionGroupId.value = result.data.executionGroupId
  } catch (error) {
    testFlowOpen.value = false
    isTestingWorkflow.value = false
    console.error('测试工作流失败:', error)
    showToast('测试失败：' + (error instanceof Error ? error.message : '未知错误'), 'error')
  }
}

const publishNewVersion = async () => {
  try {
    const result = await api.workflows.publish(buildWorkflowPayload())

    if (result.success && result.data) {
      applyWorkflow(result.data)
      await loadWorkflowVersions()
      showToast(result.message || '新版本已发布！', 'success')
    } else {
      showToast('发布新版本失败，请稍后重试', 'error')
    }
  } catch (error) {
    console.error('发布工作流新版本失败:', error)
    showToast('发布失败：' + (error instanceof Error ? error.message : '未知错误'), 'error')
  }
}

const applySampleWorkflowAndPublish = async () => {
  const confirmed = await appConfirm.confirm({
    title: '加载示例工作流',
    description: '将用 v2 全节点覆盖工作流（与「全节点覆盖工作流」版本一致）覆盖当前画布，并发布为新版本。是否继续？',
    confirmText: '加载并发布',
    cancelText: '取消',
  })
  if (!confirmed) return

  isApplyingSample.value = true
  try {
    const sampleSource = await resolveSampleWorkflowPayload({
      listVersions: () => api.workflows.listVersions(),
      getVersion: (versionId) => api.workflows.getVersion(versionId),
    })
    const normalized = normalizeWorkflowPayload(sampleSource)
    canvasNodes.value = JSON.parse(JSON.stringify(normalized.nodes))
    connections.value = JSON.parse(JSON.stringify(normalized.connections))
    selectedNode.value = null
    selectedConnection.value = null
    saveToHistory()
    scheduleCanvasView()

    const result = await api.workflows.publish({
      name: sampleSource.name,
      description: sampleSource.description,
      nodes: normalized.nodes,
      connections: normalized.connections,
      config: sampleSource.config,
    })
    if (result.success && result.data) {
      applyWorkflow(result.data)
      await loadWorkflowVersions()
      showToast('示例工作流已加载并发布', 'success')
    } else {
      showToast(result.message || '示例工作流发布失败，请稍后重试', 'error')
    }
  } catch (error) {
    console.error('加载示例工作流失败:', error)
    showToast('示例工作流失败：' + (error instanceof Error ? error.message : '未知错误'), 'error')
  } finally {
    isApplyingSample.value = false
  }
}

const clearCanvas = async () => {
  const confirmed = await appConfirm.confirm({
    title: '清空画布',
    description: '确定要清空画布吗？此操作将删除所有节点和连接。',
    confirmText: '清空',
    cancelText: '取消',
    variant: 'destructive',
  })
  if (!confirmed) return
  saveToHistory()
  canvasNodes.value = []
  connections.value = []
  selectedNode.value = null
  showToast('画布已清空', 'success')
}
</script>

<style scoped>
.designer-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 3rem;
}

.designer-toolbar__side {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1 1 0;
  z-index: 2;
}

.designer-toolbar__side--left {
  max-width: min(100%, 22rem);
  padding-right: 0.5rem;
}

.designer-toolbar__side--right {
  justify-content: flex-end;
  padding-left: 0.5rem;
}

.designer-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.375rem;
  flex-wrap: nowrap;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.designer-toolbar__actions::-webkit-scrollbar {
  display: none;
}

.designer-toolbar__meta {
  display: none;
}

.designer-toolbar__center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.625rem;
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--background) / 0.92);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  backdrop-filter: blur(6px);
}

@media (min-width: 1280px) {
  .designer-toolbar__meta {
    display: block;
  }
}

@media (max-width: 1023px) {
  .designer-toolbar {
    flex-wrap: wrap;
    row-gap: 0.5rem;
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
  }

  .designer-toolbar__center {
    position: static;
    transform: none;
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .designer-toolbar__side--left,
  .designer-toolbar__side--right {
    flex: 1 1 auto;
    max-width: none;
    padding: 0;
  }

  .designer-toolbar__side--right {
    order: 2;
    justify-content: flex-end;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
