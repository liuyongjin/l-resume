import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ScoreRing } from '@/features/ai/ScoreRing'
import { useAiStore } from '@/stores/aiStore'
import { useResumeStore } from '@/stores/resumeStore'

export default function AiResultScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { resumeId } = useLocalSearchParams<{ resumeId: string }>()
  const result = useAiStore((s) => s.result)
  const update = useResumeStore((s) => s.update)

  const score = result?.score ?? 85
  const suggestions = result?.suggestions ?? []

  const handleApplyAll = async () => {
    const id = Number(resumeId)
    if (!id || !result?.optimizedData) {
      router.back()
      return
    }
    await update(id, { data: result.optimizedData })
    router.push(`/resume/${id}/preview` as never)
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('ai.resultTitle') }} />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView contentContainerClassName="px-4 py-6 pb-24">
          <View className="items-center mb-8">
            <ScoreRing score={score} />
            <Text className="text-gray-600 text-center mt-4 px-4">{t('ai.resultDesc')}</Text>
          </View>

          <Text className="text-lg font-bold text-gray-900 mb-3">{t('ai.suggestions')}</Text>
          {suggestions.map((s) => (
            <View key={s.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
              <Text className="text-xs text-primary font-medium mb-1">{s.section}</Text>
              <Text className="text-sm text-gray-500 mb-2" numberOfLines={2}>Before: {s.before}</Text>
              <Text className="text-sm text-gray-900" numberOfLines={3}>After: {s.after}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-2 bg-slate-50">
          <Pressable testID="ai-apply-all" className="bg-primary rounded-full py-3.5 items-center" onPress={handleApplyAll}>
            <Text className="text-white font-semibold">{t('ai.applyAll')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  )
}
