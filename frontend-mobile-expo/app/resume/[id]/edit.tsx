import { useEffect, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useResumeStore } from '@/stores/resumeStore'
import { ResumeFormTabs } from '@/features/resume/ResumeFormTabs'
import { normalizeResumeData } from '@/utils/resumeTransform'
import type { ResumeData } from '@/api/types'
import { colors } from '@/theme/tokens'

export default function ResumeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const resumeId = Number(id)
  const fetchOne = useResumeStore((s) => s.fetchOne)
  const update = useResumeStore((s) => s.update)
  const current = useResumeStore((s) => s.isLoading)
  const resume = useResumeStore((s) => s.current)

  const [data, setData] = useState<ResumeData | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchOne(resumeId).then((r) => {
      if (r) setData(normalizeResumeData(r.data))
    })
  }, [resumeId, fetchOne])

  const handleSave = async () => {
    if (!data || !resume) return
    setSaving(true)
    const ok = await update(resumeId, {
      data,
      title: data.basicInfo.name || resume.title,
      expectedUpdatedAt: resume.updatedAt,
    })
    setSaving(false)
    if (ok) Alert.alert(t('common.saved'))
    else Alert.alert(t('common.error'))
  }

  if (current && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!data) return null

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('resume.editTitle') }} />
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        <ResumeFormTabs data={data} onChange={setData} />
        <View className="flex-row gap-3 px-4 py-3 border-t border-gray-100">
          <Pressable
            className="flex-1 py-3 rounded-full border border-gray-200 items-center"
            onPress={() => router.push(`/resume/${resumeId}/preview` as never)}
          >
            <Text className="text-gray-700 font-medium">{t('resume.preview')}</Text>
          </Pressable>
          <Pressable
            testID="resume-save"
            className="flex-1 py-3 rounded-full bg-primary items-center"
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('common.save')}</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  )
}
