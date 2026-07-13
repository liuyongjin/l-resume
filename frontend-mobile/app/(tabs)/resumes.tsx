import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { Plus, Search, Inbox } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useResumeStore } from '@/stores/resumeStore'
import { ResumeListCard } from '@/features/resume/ResumeListCard'
import type { Resume } from '@/api/types'
import { colors } from '@/theme/tokens'

export default function ResumesTabScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const resumes = useResumeStore((s) => s.resumes)
  const isLoading = useResumeStore((s) => s.isLoading)
  const fetchList = useResumeStore((s) => s.fetchList)
  const remove = useResumeStore((s) => s.remove)
  const create = useResumeStore((s) => s.create)

  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return resumes
    return resumes.filter((r) => r.title.toLowerCase().includes(q))
  }, [resumes, query])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchList()
    setRefreshing(false)
  }, [fetchList])

  const handleCreate = async () => {
    const resume = await create(t('resume.newTitle'))
    if (resume) router.push(`/resume/${resume.id}/edit` as never)
  }

  const handleDelete = (resume: Resume) => {
    Alert.alert(t('resume.deleteTitle'), resume.title, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void remove(resume.id) },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pt-3 pb-2">
        <Text className="text-2xl font-bold text-gray-900">{t('resume.listTitle')}</Text>
        <View className="flex-row items-center mt-3 bg-white rounded-xl px-3 border border-gray-100">
          <Search color={colors.textMuted} size={18} />
          <TextInput
            testID="resume-search"
            className="flex-1 py-3 px-2 text-base"
            placeholder={t('resume.search')}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {isLoading && !resumes.length ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Inbox color={colors.textMuted} size={48} />
          <Text className="text-lg font-semibold text-gray-900 mt-4">{t('resume.emptyTitle')}</Text>
          <Text className="text-gray-500 text-center mt-2">{t('resume.emptyDesc')}</Text>
          <Pressable className="mt-6 bg-primary rounded-full px-6 py-3" onPress={() => router.push('/templates' as never)}>
            <Text className="text-white font-semibold">{t('resume.fromTemplate')}</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1">
          <FlashList
          data={filtered}
          estimatedItemSize={120}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <ResumeListCard
              resume={item}
              onPress={() => router.push(`/resume/${item.id}/preview` as never)}
              onEdit={() => router.push(`/resume/${item.id}/edit` as never)}
              onDelete={() => handleDelete(item)}
            />
          )}
          />
        </View>
      )}

      <Pressable
        testID="resume-fab"
        className="absolute bottom-6 right-6 size-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={handleCreate}
      >
        <Plus color="#fff" size={28} />
      </Pressable>
    </SafeAreaView>
  )
}
