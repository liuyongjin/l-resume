import { useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { GitBranch, Play, Settings, History } from 'lucide-react-native'
import { useWorkflowStore } from '@/stores/workflowStore'
import { colors } from '@/theme/tokens'

export default function WorkflowTabScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const workflows = useWorkflowStore((s) => s.workflows)
  const fetchList = useWorkflowStore((s) => s.fetchList)
  const fetchDefault = useWorkflowStore((s) => s.fetchDefault)
  const current = useWorkflowStore((s) => s.current)
  const isLoading = useWorkflowStore((s) => s.isLoading)

  useEffect(() => {
    void fetchList()
    void fetchDefault()
  }, [fetchList, fetchDefault])

  const displayList = workflows.length ? workflows : current ? [current] : []

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView contentContainerClassName="pb-8">
        <View className="px-4 pt-3 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{t('workflow.title')}</Text>
            <Text className="text-gray-500 mt-1">{t('workflow.subtitle')}</Text>
          </View>
          <Pressable
            testID="workflow-executions"
            className="mt-1 flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2"
            onPress={() => router.push('/workflow/executions' as never)}
          >
            <History color={colors.textMuted} size={16} />
            <Text className="text-sm text-gray-700">{t('workflow.executions')}</Text>
          </Pressable>
        </View>

        <View className="mx-4 mt-5 rounded-3xl bg-primary p-6 min-h-[140px] justify-between">
          <View className="flex-row items-center gap-2">
            <GitBranch color="#E9D5FF" size={20} />
            <Text className="text-violet-200 text-sm">{t('workflow.recommended')}</Text>
          </View>
          <Text className="text-white text-xl font-bold mt-2">{t('workflow.defaultName')}</Text>
          <Text className="text-violet-100 text-sm mt-1">{t('workflow.defaultDesc')}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} className="mt-8" />
        ) : (
          <View className="px-4 mt-4 gap-3">
            {displayList.map((wf) => (
              <View key={wf.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <Text className="font-semibold text-gray-900">{wf.name}</Text>
                <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>{wf.description ?? t('workflow.noDesc')}</Text>
                <View className="flex-row gap-2 mt-4">
                  <Pressable
                    testID="workflow-run"
                    className="flex-1 flex-row items-center justify-center gap-2 bg-primary rounded-full py-2.5"
                    onPress={() => router.push({ pathname: '/workflow/run', params: { id: String(wf.id) } } as never)}
                  >
                    <Play color="#fff" size={16} />
                    <Text className="text-white font-medium text-sm">{t('workflow.run')}</Text>
                  </Pressable>
                  <Pressable
                    className="px-4 flex-row items-center justify-center rounded-full border border-gray-200"
                    onPress={() => router.push({ pathname: '/workflow/designer', params: { id: String(wf.id) } } as never)}
                  >
                    <Settings color={colors.textMuted} size={18} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
