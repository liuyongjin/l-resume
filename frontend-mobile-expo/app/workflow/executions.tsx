import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { History } from 'lucide-react-native'
import { workflowsApi } from '@/api/workflows'
import { ExecutionStepper, type StepItem } from '@/features/workflow/ExecutionStepper'
import { formatDateTime } from '@/utils/resumeTransform'
import { colors } from '@/theme/tokens'

export interface ExecutionHistoryItem {
  executionGroupId: string
  workflowId: number | null
  workflowName: string | null
  runType: string
  status: string
  errorMessage?: string | null
  startedAt: string
  completedAt?: string | null
  stepCount: number
  savedResumeCount: number
  savedResumeTitles: string[]
  templateIds: string[]
  outputLanguages: string[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function statusColor(status: string): string {
  if (status === 'completed') return colors.success
  if (status === 'failed') return '#EF4444'
  if (status === 'running') return colors.primary
  return colors.textMuted
}

function mapStepLogs(stepLogs: Array<{ stepKey: string; status: string; message?: string }>): StepItem[] {
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

export default function WorkflowExecutionsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { group } = useLocalSearchParams<{ group?: string }>()

  const [items, setItems] = useState<ExecutionHistoryItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [steps, setSteps] = useState<StepItem[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const loadDetail = useCallback(async (groupId: string) => {
    setDetailLoading(true)
    try {
      const res = await workflowsApi.getExecutionLogs(groupId)
      const data = res.data as { stepLogs?: Array<{ stepKey: string; status: string; message?: string }> } | undefined
      setSteps(mapStepLogs(data?.stepLogs ?? []))
    } catch {
      setSteps([])
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const selectExecution = useCallback(async (groupId: string) => {
    setSelectedId(groupId)
    await loadDetail(groupId)
  }, [loadDetail])

  const loadPage = useCallback(async (page: number, options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    try {
      const res = await workflowsApi.listExecutions({ page, limit: 20, runType: 'all' })
      const data = res.data as { items?: ExecutionHistoryItem[]; pagination?: Pagination } | undefined
      const nextItems = data?.items ?? []
      const nextPagination = data?.pagination ?? { page, limit: 20, total: nextItems.length, totalPages: 1 }
      setItems(nextItems)
      setPagination(nextPagination)

      if (!nextItems.length) {
        setSelectedId(null)
        setSteps([])
        return
      }

      const queryGroup = typeof group === 'string' ? group.trim() : ''
      const preferred =
        (queryGroup && nextItems.some((i) => i.executionGroupId === queryGroup) ? queryGroup : null)
        ?? (selectedId && nextItems.some((i) => i.executionGroupId === selectedId) ? selectedId : null)
        ?? nextItems[0].executionGroupId

      await selectExecution(preferred)
    } catch {
      if (!options?.silent) {
        Alert.alert(t('common.error'), t('workflow.executionsLoadFailed'))
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [group, selectExecution, selectedId, t])

  useEffect(() => {
    void loadPage(1)
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = items.find((i) => i.executionGroupId === selectedId) ?? null

  const handleCancel = () => {
    if (!selectedId || cancelling) return
    Alert.alert(t('workflow.cancelExecution'), t('workflow.cancelExecutionConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('workflow.cancelExecution'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setCancelling(true)
            try {
              await workflowsApi.cancelExecution(selectedId)
              await loadPage(pagination.page, { silent: true })
            } catch {
              Alert.alert(t('common.error'), t('workflow.cancelExecutionFailed'))
            } finally {
              setCancelling(false)
            }
          })()
        },
      },
    ])
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      running: t('workflow.statusRunning'),
      completed: t('workflow.statusCompleted'),
      failed: t('workflow.statusFailed'),
      cancelled: t('workflow.statusCancelled'),
    }
    return map[status] || status
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('workflow.executionsTitle') }} />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        {loading && !items.length ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.executionGroupId}
            contentContainerClassName="pb-10"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true)
                  void loadPage(pagination.page, { silent: true })
                }}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={
              <View className="px-4 pt-3 pb-2">
                <Text className="text-sm text-gray-500">
                  {t('workflow.executionsCount', { total: pagination.total })}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View className="items-center px-8 py-16">
                <History color={colors.textMuted} size={36} />
                <Text className="text-gray-500 mt-3 text-center">{t('workflow.executionsEmpty')}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const active = item.executionGroupId === selectedId
              return (
                <Pressable
                  className={`mx-4 mb-2 rounded-2xl border p-4 ${active ? 'border-primary bg-violet-50' : 'border-gray-100 bg-white'}`}
                  onPress={() => void selectExecution(item.executionGroupId)}
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 min-w-0">
                      <Text className="font-semibold text-gray-900" numberOfLines={1}>
                        {item.workflowName || t('workflow.defaultName')}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">{formatDateTime(item.startedAt)}</Text>
                    </View>
                    <Text className="text-xs font-medium" style={{ color: statusColor(item.status) }}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500 mt-2">
                    {item.runType === 'test' ? t('workflow.runTypeTest') : t('workflow.runTypeSmart')}
                    {' · '}
                    {t('workflow.stepCount', { count: item.stepCount })}
                    {item.savedResumeCount > 0
                      ? ` · ${t('workflow.savedResumeCount', { count: item.savedResumeCount })}`
                      : ''}
                  </Text>
                </Pressable>
              )
            }}
            ListFooterComponent={
              selected ? (
                <View className="mt-2 mx-4 mb-4 rounded-2xl bg-white border border-gray-100 p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-semibold text-gray-900">{t('workflow.executionDetail')}</Text>
                    {selected.status === 'running' ? (
                      <Pressable
                        className="px-3 py-1.5 rounded-full bg-red-500"
                        disabled={cancelling}
                        onPress={handleCancel}
                      >
                        <Text className="text-white text-xs font-medium">
                          {cancelling ? t('workflow.cancelling') : t('workflow.cancelExecution')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {selected.errorMessage ? (
                    <Text className="text-sm text-red-500 mb-2">{selected.errorMessage}</Text>
                  ) : null}
                  {detailLoading ? (
                    <ActivityIndicator color={colors.primary} className="my-4" />
                  ) : steps.length ? (
                    <ExecutionStepper steps={steps} />
                  ) : (
                    <Text className="text-sm text-gray-400 py-4">{t('workflow.noSteps')}</Text>
                  )}
                  <Pressable
                    className="mt-2 py-2.5 rounded-full border border-gray-200 items-center"
                    onPress={() => router.push('/(tabs)/workflow' as never)}
                  >
                    <Text className="text-sm text-gray-700">{t('workflow.backToWorkflow')}</Text>
                  </Pressable>
                </View>
              ) : null
            }
          />
        )}

        {pagination.totalPages > 1 ? (
          <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
            <Pressable
              disabled={pagination.page <= 1 || loading}
              className="px-4 py-2 rounded-full border border-gray-200"
              onPress={() => void loadPage(pagination.page - 1)}
            >
              <Text className="text-sm text-gray-700">{t('workflow.prevPage')}</Text>
            </Pressable>
            <Text className="text-xs text-gray-500">
              {pagination.page} / {pagination.totalPages}
            </Text>
            <Pressable
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-4 py-2 rounded-full border border-gray-200"
              onPress={() => void loadPage(pagination.page + 1)}
            >
              <Text className="text-sm text-gray-700">{t('workflow.nextPage')}</Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </>
  )
}
