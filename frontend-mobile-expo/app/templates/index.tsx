import { useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTemplateStore } from '@/stores/templateStore'
import { useResumeStore } from '@/stores/resumeStore'
import { TemplateCard } from '@/features/templates/TemplateCard'
import { colors } from '@/theme/tokens'

export default function TemplatesScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const templates = useTemplateStore((s) => s.templates)
  const isLoading = useTemplateStore((s) => s.isLoading)
  const fetchList = useTemplateStore((s) => s.fetchList)
  const create = useResumeStore((s) => s.create)

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const handleUse = async (templateId: string, name: string) => {
    const resume = await create(name, templateId)
    if (resume) {
      router.replace(`/resume/${resume.id}/edit` as never)
    } else {
      Alert.alert(t('common.error'))
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('templates.title') }} />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <View className="px-4 pt-2 pb-3">
          <Text className="text-gray-500">{t('templates.subtitle')}</Text>
        </View>
        {isLoading && !templates.length ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerClassName="px-4 pb-8">
            {templates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onPress={() => handleUse(tpl.id, tpl.name)}
              />
            ))}
            {!templates.length ? (
              <Text className="text-center text-gray-500 py-12">{t('templates.empty')}</Text>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  )
}
