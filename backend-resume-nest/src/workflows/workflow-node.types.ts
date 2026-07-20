/** 工作流节点配置 — 与前端设计器对齐 */

export interface WorkflowNodeConfig {

  model?: string

  temperature?: number

  topP?: number

  maxTokens?: number

  outputFormat?: 'json' | 'text' | 'markdown'

  maxRetries?: number

  systemPrompt?: string

  memoryTurns?: number

  /** 知识库 */

  knowledgeBaseId?: string

  topK?: number

  scoreThreshold?: number

  queryTemplate?: string

  /** HTTP */

  endpoint?: string

  method?: string

  headers?: string

  bodyTemplate?: string

  timeoutMs?: number

  /** 代码 */

  codeLanguage?: string

  codeScript?: string

  inputVariable?: string

  outputVariable?: string

  /** 条件分支 */

  conditionType?: 'expression' | 'variable'

  conditionField?: string

  conditionOperator?: string

  conditionValue?: string

  conditionExpression?: string

  /** 循环 */

  loopType?: 'forEach' | 'while' | 'count'

  loopArrayVariable?: string

  maxIterations?: number

  breakCondition?: string

  /** 聚合 */

  aggregateStrategy?: 'merge' | 'concat' | 'first' | 'last'

  aggregateInputs?: string

  aggregateOutput?: string

  aggregateSeparator?: string

}



export type WorkflowPortId = 'default' | 'true' | 'false' | 'loop' | 'done'



export interface WorkflowNodeTemplate {

  id: string

  type: string

  agentType?: string

  name: string

  description: string

  icon: string

  color: string

  category: 'agent' | 'tool'

  temp: number

  output: string

  config: WorkflowNodeConfig

  configTabs: Array<'config' | 'prompt' | 'memory' | 'advanced'>

}



export interface WorkflowCanvasNode extends WorkflowNodeTemplate {

  x: number

  y: number

}



export interface WorkflowConnection {

  id: string

  from: string

  to: string

  fromPort?: WorkflowPortId

  toPort?: WorkflowPortId

}



export interface WorkflowNodeCategory {

  key: 'agent' | 'tool'

  name: string

  nodes: WorkflowNodeTemplate[]

}



export interface WorkflowDesignerOptions {

  models: Array<{ label: string; value: string }>

  outputFormats: Array<{ label: string; value: string }>

  knowledgeBases: Array<{ label: string; value: string }>

  httpMethods: Array<{ label: string; value: string }>

  codeLanguages: Array<{ label: string; value: string }>

  conditionOperators: Array<{ label: string; value: string }>

  loopTypes: Array<{ label: string; value: string }>

  aggregateStrategies: Array<{ label: string; value: string }>

  defaultConfig: WorkflowNodeConfig

}



export interface WorkflowNodeLibraryResponse {

  categories: WorkflowNodeCategory[]

  options: WorkflowDesignerOptions

}


