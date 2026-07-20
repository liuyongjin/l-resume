import { View, Text, Pressable } from 'react-native'
import { FileText, Sparkles } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

interface HeroCardProps {
  onCreatePress: () => void
}

export function HeroCard({ onCreatePress }: HeroCardProps) {
  const { t } = useTranslation()

  return (
    <View className="mx-4 mt-5 rounded-3xl overflow-hidden min-h-[220px]">
      <View className="bg-primary p-6 min-h-[220px] justify-between">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center gap-1.5 mb-3">
              <Sparkles color="#E9D5FF" size={16} />
              <Text className="text-violet-200 text-xs font-medium">{t('home.heroBadge')}</Text>
            </View>
            <Text className="text-white text-2xl font-bold leading-8">{t('home.heroTitle')}</Text>
            <Text className="text-violet-100 text-sm mt-2 leading-5">{t('home.heroDesc')}</Text>
          </View>
          <View className="size-16 rounded-2xl bg-white/20 items-center justify-center">
            <FileText color="#fff" size={32} />
          </View>
        </View>

        <Pressable
          testID="home-create-resume"
          className="bg-white rounded-full py-3.5 px-6 self-start mt-4 active:opacity-90"
          onPress={onCreatePress}
        >
          <Text className="text-primary font-semibold text-base">{t('home.createResume')}</Text>
        </Pressable>
      </View>
    </View>
  )
}
