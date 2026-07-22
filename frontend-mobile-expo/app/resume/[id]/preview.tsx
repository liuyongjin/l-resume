import { useEffect } from 'react'
import { View, Pressable, Text, ActivityIndicator, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useResumeStore } from '@/stores/resumeStore'
import { ResumePreview } from '@/features/resume/ResumePreview'
import { buildResumeShareText } from '@/utils/resumeExport'
import { colors } from '@/theme/tokens'

export default function ResumePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const resumeId = Number(id)
  const fetchOne = useResumeStore((s) => s.fetchOne)
  const isLoading = useResumeStore((s) => s.isLoading)
  const resume = useResumeStore((s) => s.current)

  useEffect(() => {
    void fetchOne(resumeId)
  }, [resumeId, fetchOne])

  const handleExport = async () => {
    if (!resume) return
    const message = buildResumeShareText(resume, t('brand'))
    await Share.share({ message, title: resume.title })
  }

  if (isLoading && !resume) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!resume) return null

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('resume.preview') }} />
      <SafeAreaView className="flex-1 bg-gray-100" edges={['bottom']}>
        <ResumePreview resume={resume} />
        <View className="flex-row gap-3 px-4 py-3 bg-white border-t border-gray-100">
          <Pressable
            className="flex-1 py-3 rounded-full border border-gray-200 items-center"
            onPress={() => router.push('/templates' as never)}
          >
            <Text className="text-gray-700 font-medium">{t('resume.changeTemplate')}</Text>
          </Pressable>
          <Pressable testID="resume-export" className="flex-1 py-3 rounded-full bg-primary items-center" onPress={handleExport}>
            <Text className="text-white font-semibold">{t('resume.export')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  )
}
