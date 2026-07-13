import { View, Text, Pressable } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import type { WorkflowNode } from '@/api/types'
import { getWorkflowNodeColor, getWorkflowNodeIconKey } from '@/utils/workflowNodeIcons'
import { Bot, Pencil, Zap, Monitor, BookOpen, Globe, Code, GitBranch, RefreshCw, Layers } from 'lucide-react-native'

const ICON_MAP = {
  pencil: Pencil, zap: Zap, bot: Bot, monitor: Monitor, 'book-open': BookOpen,
  globe: Globe, code: Code, 'git-branch': GitBranch, 'refresh-cw': RefreshCw, layers: Layers,
}

interface WorkflowFlowDiagramProps {
  nodes: WorkflowNode[]
  onNodePress?: (node: WorkflowNode) => void
}

export function WorkflowFlowDiagram({ nodes, onNodePress }: WorkflowFlowDiagramProps) {
  const sorted = [...nodes].sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))

  return (
    <View className="px-4 py-2">
      {sorted.map((node, i) => {
        const iconKey = getWorkflowNodeIconKey(node)
        const Icon = ICON_MAP[iconKey] ?? Bot
        const color = getWorkflowNodeColor(node)
        return (
          <View key={node.id}>
            <Pressable
              className="flex-row items-center bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:opacity-90"
              onPress={() => onNodePress?.(node)}
            >
              <View className="size-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${color}22` }}>
                <Icon color={color} size={22} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{node.label}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{node.category ?? node.type}</Text>
              </View>
              <ChevronRight color="#9CA3AF" size={18} />
            </Pressable>
            {i < sorted.length - 1 ? (
              <View className="items-center py-1">
                <View className="w-0.5 h-6 bg-gray-200" />
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}
