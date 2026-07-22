import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useTemplateStore } from '@/stores/templateStore'
import { ExecutionStepper, type StepItem } from '@/features/workflow/ExecutionStepper'
import { pollWorkflowExecution, type WorkflowStepLog } from '@/utils/workflowExecutionPoll'
import { colors } from '@/theme/tokens'

const LANG_OPTIONS = [
  { id: 'zh', labelKey: 'workflow.langZh' },
  { id: 'en', labelKey: 'workflow.langEn' },
] as const

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
  const templates = useTemplateStore((s) => s.templates)
  const fetchTemplates = useTemplateStore((s) => s.fetchList)

  const [targetRole, setTargetRole] = useState('')
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['frontendEngineer'])
  const [outputLanguages, setOutputLanguages] = useState<string[]>(['zh'])
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<StepItem[]>([])

  useEffect(() => {
    void fetchOne(workflowId)
    void fetchTemplates()
  }, [workflowId, fetchOne, fetchTemplates])

  useEffect(() => {
    if (templates.length && selectedTemplates.every((id) => !templates.some((t) => t.id === id))) {
      setSelectedTemplates([templates[0].id])
    }
  }, [templates, selectedTemplates])

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) => {
      if (prev.includes(templateId)) {
        const next = prev.filter((x) => x !== templateId)
        return next.length ? next : prev
      }
      if (prev.length >= 3) return prev
      return [...prev, templateId]
    })
  }

  const toggleLang = (lang: string) => {
    setOutputLanguages((prev) => {
      if (prev.includes(lang)) {
        const next = prev.filter((x) => x !== lang)
        return next.length ? next : prev
      }
      return [...prev, lang]
    })
  }

  const handleRun = async () => {
    if (!targetRole.trim()) {
      Alert.alert(t('common.error'), t('workflow.targetRoleRequired'))
      return
    }
    if (!selectedTemplates.length) {
      Alert.alert(t('common.error'), t('workflow.templateRequired'))
      return
    }

    setRunning(true)
    setSteps([])

    try {
      const start = await execute(workflowId, {
        targetRole: targetRole.trim(),
        templateIds: selectedTemplates,
        outputLanguages,
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

  const templateOptions = templates.length
    ? templates
    : [{ id: 'frontendEngineer', name: '前端工程师', description: null, config: {} }]

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: running ? t('workflow.running') : t('workflow.config') }} />
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        {!running ? (
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            <Text className="text-lg font-bold text-gray-900 mb-4">{t('workflow.config')}</Text>
            <Text className="text-sm text-gray-600 mb-2">{t('workflow.targetRole')}</Text>
            <TextInput
              testID="workflow-target-role"
              className="border border-gray-200 rounded-xl px-4 py-3 mb-6 bg-gray-50"
              placeholder={t('workflow.targetRolePlaceholder')}
              value={targetRole}
              onChangeText={setTargetRole}
            />

            <Text className="text-sm text-gray-600 mb-2">{t('workflow.templates')}</Text>
            <Text className="text-xs text-gray-400 mb-3">{t('workflow.templatesHint')}</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {templateOptions.map((tpl) => {
                const active = selectedTemplates.includes(tpl.id)
                return (
                  <Pressable
                    key={tpl.id}
                    testID={`workflow-tpl-${tpl.id}`}
                    onPress={() => toggleTemplate(tpl.id)}
                    className={`px-3 py-2 rounded-full border ${active ? 'bg-violet-50 border-primary' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <Text className={`text-sm ${active ? 'text-primary font-medium' : 'text-gray-700'}`}>{tpl.name}</Text>
                  </Pressable>
                )
              })}
            </View>

            <Text className="text-sm text-gray-600 mb-2">{t('workflow.outputLang')}</Text>
            <View className="flex-row gap-2 mb-8">
              {LANG_OPTIONS.map((opt) => {
                const active = outputLanguages.includes(opt.id)
                return (
                  <Pressable
                    key={opt.id}
                    testID={`workflow-lang-${opt.id}`}
                    onPress={() => toggleLang(opt.id)}
                    className={`px-4 py-2 rounded-full border ${active ? 'bg-violet-50 border-primary' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <Text className={`text-sm ${active ? 'text-primary font-medium' : 'text-gray-700'}`}>{t(opt.labelKey)}</Text>
                  </Pressable>
                )
              })}
            </View>

            <Pressable
              testID="workflow-start"
              className="bg-primary rounded-full py-3.5 items-center mb-8"
              onPress={handleRun}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('workflow.start')}</Text>}
            </Pressable>
          </ScrollView>
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
