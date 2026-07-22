import { useEffect, useState } from 'react'
import { View, Text, TextInput, Modal, Pressable, ScrollView } from 'react-native'
import type { WorkflowNode } from '@/api/types'

interface NodeConfigSheetProps {
  node: WorkflowNode | null
  visible: boolean
  onClose: () => void
  onSave: (config: Record<string, unknown>) => void
}

export function NodeConfigSheet({ node, visible, onClose, onSave }: NodeConfigSheetProps) {
  const initialPrompt = String(node?.config?.systemPrompt ?? node?.config?.prompt ?? '')
  const [prompt, setPrompt] = useState(initialPrompt)

  useEffect(() => {
    if (visible) {
      setPrompt(String(node?.config?.systemPrompt ?? node?.config?.prompt ?? ''))
    }
  }, [visible, node])

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          <View className="px-5 pt-5 pb-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">节点配置</Text>
            <Text className="text-sm text-gray-500 mt-1">{node?.label}</Text>
          </View>
          <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
            <Text className="text-sm text-gray-600 mb-2">节点类型</Text>
            <Text className="text-base text-gray-900 mb-4">{node?.agentType ?? node?.type ?? '—'}</Text>
            <Text className="text-sm text-gray-600 mb-2">Prompt / 指令</Text>
            <TextInput
              testID="node-prompt-input"
              className="border border-gray-200 rounded-xl px-4 py-3 min-h-[120px] text-base bg-gray-50"
              multiline
              value={prompt}
              onChangeText={setPrompt}
              placeholder="输入 AI 节点指令..."
              textAlignVertical="top"
            />
          </ScrollView>
          <View className="flex-row gap-3 px-5 pb-8 pt-2">
            <Pressable className="flex-1 py-3.5 rounded-full border border-gray-200 items-center" onPress={onClose}>
              <Text className="text-gray-700 font-medium">取消</Text>
            </Pressable>
            <Pressable
              testID="node-config-save"
              className="flex-1 py-3.5 rounded-full bg-primary items-center"
              onPress={() => {
                onSave({ ...node?.config, systemPrompt: prompt, prompt })
                onClose()
              }}
            >
              <Text className="text-white font-semibold">保存</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
