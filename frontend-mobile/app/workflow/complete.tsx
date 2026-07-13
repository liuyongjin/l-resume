import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react-native'
import { colors } from '@/theme/tokens'

export default function WorkflowCompleteScreen() {
  const { resumeId } = useLocalSearchParams<{ resumeId?: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('workflow.complete') }} />
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-6" edges={['bottom']}>
        <CheckCircle2 color={colors.success} size={80} />
        <Text className="text-2xl font-bold text-gray-900 mt-6">{t('workflow.successTitle')}</Text>
        <Text className="text-gray-500 text-center mt-2">{t('workflow.successDesc')}</Text>

        <View className="w-full gap-3 mt-10">
          {resumeId ? (
            <Pressable
              className="bg-primary rounded-full py-3.5 items-center"
              onPress={() => router.push(`/resume/${resumeId}/preview` as never)}
            >
              <Text className="text-white font-semibold">{t('workflow.viewResume')}</Text>
            </Pressable>
          ) : null}
          <Pressable
            className="rounded-full py-3.5 items-center border border-gray-200"
            onPress={() => router.push('/(tabs)/workflow')}
          >
            <Text className="text-gray-700 font-medium">{t('workflow.runAgain')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  )
}
