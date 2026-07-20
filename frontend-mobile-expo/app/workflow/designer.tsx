import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { WorkflowFlowDiagram } from '@/features/workflow/WorkflowFlowDiagram'
import { NodeConfigSheet } from '@/features/workflow/NodeConfigSheet'
import type { WorkflowNode } from '@/api/types'
import { colors } from '@/theme/tokens'

export default function WorkflowDesignerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()
  const workflowId = Number(id)
  const fetchOne = useWorkflowStore((s) => s.fetchOne)
  const updateWorkflow = useWorkflowStore((s) => s.updateWorkflow)
  const current = useWorkflowStore((s) => s.current)
  const isLoading = useWorkflowStore((s) => s.isLoading)

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [sheetVisible, setSheetVisible] = useState(false)

  useEffect(() => {
    void fetchOne(workflowId)
  }, [workflowId, fetchOne])

  const nodes = current?.nodes ?? []

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('workflow.designer') }} />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        {isLoading && !current ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerClassName="pb-8">
            <View className="px-4 py-3">
              <Text className="text-lg font-bold text-gray-900">{current?.name ?? t('workflow.designer')}</Text>
              <Text className="text-sm text-gray-500 mt-1">{t('workflow.designerHint')}</Text>
            </View>
            <WorkflowFlowDiagram
              nodes={nodes}
              onNodePress={(node) => {
                setSelectedNode(node)
                setSheetVisible(true)
              }}
            />
          </ScrollView>
        )}
        <NodeConfigSheet
          node={selectedNode}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onSave={async (config) => {
            if (!selectedNode || !current) return
            const updatedNodes = nodes.map((n) =>
              n.id === selectedNode.id ? { ...n, config: { ...n.config, ...config } } : n,
            )
            await updateWorkflow(workflowId, { nodes: updatedNodes })
          }}
        />
      </SafeAreaView>
    </>
  )
}
