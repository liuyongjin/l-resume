import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AiHub } from '@/features/ai/AiHub'
import { useResumeStore } from '@/stores/resumeStore'
import { useAiStore, type AiMode } from '@/stores/aiStore'

const MODE_KEYS: AiMode[] = ['polish', 'match', 'complete', 'translate']

export default function AiScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useLocalSearchParams<{ resumeId?: string; mode?: string }>()
  const resumes = useResumeStore((s) => s.resumes)
  const fetchList = useResumeStore((s) => s.fetchList)
  const optimize = useAiStore((s) => s.optimize)
  const isLoading = useAiStore((s) => s.isLoading)

  const initialMode = MODE_KEYS.includes(params.mode as AiMode) ? (params.mode as AiMode) : 'polish'
  const [mode, setMode] = useState<AiMode>(initialMode)
  const [jobDescription, setJobDescription] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(
    params.resumeId ? Number(params.resumeId) : null,
  )

  useEffect(() => {
    if (!resumes.length) void fetchList()
  }, [fetchList, resumes.length])

  useEffect(() => {
    if (MODE_KEYS.includes(params.mode as AiMode)) {
      setMode(params.mode as AiMode)
    }
  }, [params.mode])

  const handleStart = async () => {
    const id = selectedId ?? resumes[0]?.id
    if (!id) {
      Alert.alert(t('ai.noResume'))
      return
    }
    const resume = resumes.find((r) => r.id === id)
    if (!resume) return
    if (mode === 'match' && !jobDescription.trim()) {
      Alert.alert(t('common.error'), t('ai.jobDescRequired'))
      return
    }
    const result = await optimize(id, resume.data, {
      mode,
      jobDescription: jobDescription.trim() || undefined,
    })
    if (result) {
      router.push({ pathname: '/ai/result', params: { resumeId: String(id), mode } } as never)
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('ai.title') }} />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <AiHub selectedMode={mode} onSelectMode={setMode} />
          <View className="px-4 mt-2 mb-2">
            <Text className="text-sm text-gray-600 mb-2">{t('ai.currentMode')}</Text>
            <Text className="text-base font-semibold text-primary">{t(`ai.modes.${mode}`)}</Text>
          </View>
          {mode === 'match' ? (
            <View className="px-4 mt-2">
              <Text className="text-sm text-gray-600 mb-2">{t('ai.jobDesc')}</Text>
              <TextInput
                testID="ai-job-desc"
                className="border border-gray-200 rounded-xl px-4 py-3 min-h-[100px] bg-white text-base"
                multiline
                textAlignVertical="top"
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder={t('ai.jobDescPlaceholder')}
              />
            </View>
          ) : null}
          {resumes.length > 0 ? (
            <View className="px-4 mt-4">
              <Text className="text-sm text-gray-600 mb-2">{t('ai.selectResume')}</Text>
              {resumes.slice(0, 5).map((r) => (
                <Pressable
                  key={r.id}
                  className={`p-3 rounded-xl mb-2 border ${selectedId === r.id ? 'border-primary bg-violet-50' : 'border-gray-100 bg-white'}`}
                  onPress={() => setSelectedId(r.id)}
                >
                  <Text className="font-medium text-gray-900">{r.title}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
        <View className="px-4 pb-6 pt-2">
          <Pressable
            testID="ai-start"
            className="bg-primary rounded-full py-3.5 items-center"
            onPress={handleStart}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">{t('ai.startOptimize')}</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  )
}
