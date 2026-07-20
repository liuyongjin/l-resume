/** 工作流工具节点执行器 — 供设计器测试与服务端编排使用 */

export interface ToolRunInput {
  type: string
  config?: Record<string, unknown>
  input?: unknown
}

export interface ToolRunResult {
  success: boolean
  output: unknown
  message?: string
}

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : { value: input }
}

function getPathValue(data: Record<string, unknown>, path: string): unknown {
  const clean = path.trim().replace(/^input\./, '')
  if (!clean) return data
  const parts = clean.split('.').filter(Boolean)
  let cur: unknown = data
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as object)) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return cur
}

export function resolveContextValue(data: Record<string, unknown>, key: string): unknown {
  const trimmed = key.trim()
  if (!trimmed) return undefined

  const pathValue = getPathValue(data, trimmed)
  if (pathValue !== undefined) return pathValue

  if (trimmed in data) return data[trimmed]

  const suffixKey = trimmed.endsWith('Output') ? trimmed : `${trimmed}Output`
  if (suffixKey in data) return data[suffixKey]

  const nodeOutputKey = Object.keys(data).find(
    (entry) => entry.startsWith(`${trimmed}_`) && entry.endsWith('Output'),
  )
  if (nodeOutputKey) return data[nodeOutputKey]

  return undefined
}

function interpolate(template: string, input: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const value = resolveContextValue(input, key.trim())
    return value != null ? String(value) : ''
  })
}

function evaluateCondition(config: Record<string, unknown>, data: Record<string, unknown>): boolean {
  const conditionType = String(config.conditionType || 'variable')

  if (conditionType === 'expression') {
    const expression = String(config.conditionExpression || '').trim()
    if (!expression) return false
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('input', `return Boolean(${expression})`)
      return Boolean(fn(data))
    } catch {
      return false
    }
  }

  const field = String(config.conditionField || 'input.score')
  const op = String(config.conditionOperator || 'gte')
  const value = config.conditionValue
  const actual = field.startsWith('input.')
    ? getPathValue(data, field)
    : resolveContextValue(data, field)

  const numActual = Number(actual)
  const numValue = Number(value)
  switch (op) {
    case 'eq': return actual == value
    case 'ne': return actual != value
    case 'gt': return numActual > numValue
    case 'gte': return numActual >= numValue
    case 'lt': return numActual < numValue
    case 'lte': return numActual <= numValue
    case 'contains': return String(actual).includes(String(value))
    case 'empty': return actual == null || actual === ''
    case 'not_empty': return actual != null && actual !== ''
    default: return false
  }
}

export function executeToolNode(payload: ToolRunInput): ToolRunResult {
  const { type, config = {}, input = {} } = payload
  const data = asRecord(input)

  switch (type) {
    case 'llm':
      return {
        success: true,
        output: {
          text: config.systemPrompt || '大模型调用完成',
          model: config.model || 'gpt-4o',
          input: data,
        },
        message: '大模型节点执行成功',
      }

    case 'kb': {
      const kbId = config.knowledgeBaseId || 'resume-industry'
      const topK = Number(config.topK) || 5
      const query = interpolate(String(config.queryTemplate || '{{input.summary}}'), data)
      return {
        success: true,
        output: {
          knowledgeBaseId: kbId,
          query,
          chunks: Array.from({ length: Math.min(topK, 3) }, (_, i) => ({
            id: `${kbId}-${i + 1}`,
            score: 0.9 - i * 0.1,
            text: `知识库片段 ${i + 1}：与「${query || '简历'}」相关的行业参考内容`,
          })),
        },
        message: '知识库检索完成',
      }
    }

    case 'http': {
      const method = String(config.method || 'POST').toUpperCase()
      const endpoint = interpolate(String(config.endpoint || '/api/external/enrich'), data)
      let headers: Record<string, string> = {}
      try {
        headers = JSON.parse(String(config.headers || '{}')) as Record<string, string>
      } catch {
        headers = { 'Content-Type': 'application/json' }
      }
      const body = interpolate(String(config.bodyTemplate || '{\n  "resume": "{{input}}"\n}'), data)
      return {
        success: true,
        output: {
          method,
          endpoint,
          headers,
          body,
          status: 200,
          response: { enriched: true, input: data },
        },
        message: 'HTTP 请求模拟完成',
      }
    }

    case 'code': {
      const lang = String(config.codeLanguage || 'javascript')
      const script = String(config.codeScript || 'return input')
      const inputVar = String(config.inputVariable || 'input')
      const outputVar = String(config.outputVariable || 'result')
      const codeInput = inputVar === 'input' ? data : resolveContextValue(data, inputVar) ?? data

      if (lang === 'javascript') {
        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function('input', script.includes('return') ? script : `return (${script})`)
          const result = fn(codeInput)
          return {
            success: true,
            output: { [outputVar]: result, value: result },
            message: '代码执行完成',
          }
        } catch (err: unknown) {
          return {
            success: false,
            output: null,
            message: err instanceof Error ? err.message : '代码执行失败',
          }
        }
      }
      return {
        success: true,
        output: { [outputVar]: { ...asRecord(codeInput), processed: true, language: lang }, language: lang },
        message: `${lang} 代码已记录（沙箱模拟）`,
      }
    }

    case 'condition': {
      const matched = evaluateCondition(config, data)
      return {
        success: true,
        output: {
          matched,
          branch: matched ? 'true' : 'false',
          field: config.conditionField,
          actual: config.conditionField ? resolveContextValue(data, String(config.conditionField)) : undefined,
        },
        message: matched ? '条件满足' : '条件不满足',
      }
    }

    case 'loop': {
      const loopType = String(config.loopType || 'forEach')
      const max = Number(config.maxIterations) || 10
      let items: unknown[] = []

      if (loopType === 'count') {
        items = Array.from({ length: max }, (_, i) => ({ index: i }))
      } else if (loopType === 'forEach') {
        const arrayPath = String(config.loopArrayVariable || 'workExperience')
        const resolved = resolveContextValue(data, arrayPath)
        items = Array.isArray(resolved) ? resolved : resolved != null ? [resolved] : [{ index: 0 }]
      } else if (loopType === 'while') {
        const max = Number(config.maxIterations) || 10
        items = Array.from({ length: Math.min(max, 1) }, (_, i) => ({ index: i, mode: 'while' }))
      } else {
        items = [{ index: 0 }]
      }

      return {
        success: true,
        output: {
          loopType,
          iterations: items.slice(0, max),
          count: Math.min(items.length, max),
        },
        message: '循环节点执行完成',
      }
    }

    case 'aggregate': {
      const strategy = String(config.aggregateStrategy || 'merge')
      const outputName = String(config.aggregateOutput || 'merged')
      const inputs = String(config.aggregateInputs || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const parts = inputs
        .map((key) => resolveContextValue(data, key))
        .filter((value) => value !== undefined)

      if (strategy === 'concat') {
        const sep = String(config.aggregateSeparator || '\n')
        const value = parts.map(String).join(sep)
        return {
          success: true,
          output: { [outputName]: value, value },
          message: '变量已拼接',
        }
      }
      if (strategy === 'first') {
        const value = parts[0] ?? data
        return {
          success: true,
          output: { [outputName]: value, value },
          message: '已取第一个变量',
        }
      }
      if (strategy === 'last') {
        const value = parts[parts.length - 1] ?? data
        return {
          success: true,
          output: { [outputName]: value, value },
          message: '已取最后一个变量',
        }
      }

      const merged = Object.assign(
        {},
        ...parts.map((part) => (typeof part === 'object' && part != null && !Array.isArray(part) ? part : { value: part })),
      )
      return {
        success: true,
        output: { [outputName]: merged, ...merged },
        message: '变量已合并',
      }
    }

    default:
      return { success: false, output: null, message: `不支持的工具类型: ${type}` }
  }
}
