import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react-native'
import { useUserStore } from '@/stores/userStore'
import { HeroCard } from '@/features/home/HeroCard'
import { QuickActions } from '@/features/home/QuickActions'
import { colors } from '@/theme/tokens'

export default function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const user = useUserStore((s) => s.user)

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <View className="px-4 pt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-sm text-gray-500">{t('home.greeting')}</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-0.5">
              {user?.username ?? t('brand')}
            </Text>
          </View>
          <View className="size-10 rounded-full bg-white border border-gray-100 items-center justify-center">
            <Bell color={colors.textMuted} size={20} />
          </View>
        </View>

        <HeroCard onCreatePress={() => router.push('/templates' as never)} />
        <QuickActions />

        <View className="mx-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">{t('home.featuresTitle')}</Text>
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-gray-600 text-sm leading-5">{t('home.featuresSubtitle')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
