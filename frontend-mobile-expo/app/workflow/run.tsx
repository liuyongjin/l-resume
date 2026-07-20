import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { ExecutionStepper, type StepItem } from '@/features/workflow/ExecutionStepper'
import { pollWorkflowExecution, type WorkflowStepLog } from '@/utils/workflowExecutionPoll'
import { colors } from '@/theme/tokens'

function mapStepLogsToItems(stepLogs: WorkflowStepLog[]): StepItem[] {
  if (!stepLogs.length) {
    return []
  }
  return stepLogs.map((log) => ({
    key: log.stepKey,
    label: log.message || log.stepKey,
    status:
      log.status === 'completed' ? 'done'
        : log.status === 'running' ? 'active'
          : log.status === 'failed' ? 'failed'
            : 'pending',
  }))
}

export default function WorkflowRunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const workflowId = Number(id)
  const fetchOne = useWorkflowStore((s) => s.fetchOne)
  const execute = useWorkflowStore((s) => s.execute)
  const isLoading = useWorkflowStore((s) => s.isLoading)

  const [targetRole, setTargetRole] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<StepItem[]>([])

  useEffect(() => {
    void fetchOne(workflowId)
  }, [workflowId, fetchOne])

  const handleRun = async () => {
    if (!targetRole.trim()) {
      Alert.alert(t('common.error'), t('workflow.targetRoleRequired'))
      return
    }

    setRunning(true)
    setSteps([])

    try {
      const start = await execute(workflowId, {
        targetRole: targetRole.trim(),
        templateIds: ['frontendEngineer'],
        outputLanguages: ['zh'],
        saveToDatabase: true,
        idempotencyKey: `mobile-${Date.now()}`,
      })

      const groupId = (start as { executionGroupId?: string } | null)?.executionGroupId
      if (!groupId) {
        throw new Error(t('workflow.startFailed'))
      }

      const pollResult = await pollWorkflowExecution(groupId, (stepLogs) => {
        setSteps(mapStepLogsToItems(stepLogs))
      })

      if (pollResult.status === 'failed') {
        Alert.alert(t('common.error'), pollResult.errorMessage ?? t('workflow.runFailed'))
        setRunning(false)
        return
      }

      const saved = pollResult.savedResumes[0]
      router.replace({
        pathname: '/workflow/complete',
        params: {
          id: String(workflowId),
          resumeId: saved ? String(saved.id) : '',
        },
      } as never)
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('workflow.runFailed'))
      setRunning(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: running ? t('workflow.running') : t('workflow.config') }} />
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        {!running ? (
          <View className="flex-1 px-4 pt-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">{t('workflow.config')}</Text>
            <Text className="text-sm text-gray-600 mb-2">{t('workflow.targetRole')}</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-6 bg-gray-50"
              placeholder={t('workflow.targetRolePlaceholder')}
              value={targetRole}
              onChangeText={setTargetRole}
            />
            <Pressable
              className="bg-primary rounded-full py-3.5 items-center"
              onPress={handleRun}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('workflow.start')}</Text>}
            </Pressable>
          </View>
        ) : (
          <View className="flex-1 pt-6">
            <Text className="text-center text-gray-600 mb-6 px-4">{t('workflow.runningDesc')}</Text>
            {steps.length > 0 ? (
              <ExecutionStepper steps={steps} />
            ) : (
              <ActivityIndicator color={colors.primary} className="mt-4" />
            )}
          </View>
        )}
      </SafeAreaView>
    </>
  )
}
