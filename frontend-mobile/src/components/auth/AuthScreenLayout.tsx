import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FileText } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '@/theme/tokens'

interface AuthScreenLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthScreenLayout({ title, subtitle, children }: AuthScreenLayoutProps) {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="absolute -top-16 -left-16 size-56 rounded-full bg-primary/15" />
      <View className="absolute -bottom-20 -right-12 size-72 rounded-full bg-violet-200/40" />

      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-8">
          <View
            className="size-12 rounded-xl items-center justify-center mb-3"
            style={{ backgroundColor: colors.primary }}
          >
            <FileText color="#fff" size={22} />
          </View>
          <Text className="text-2xl font-bold text-gray-900">{t('brand')}</Text>
        </View>

        <View className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <Text className="text-xl font-bold text-gray-900 text-center">{title}</Text>
          <Text className="text-sm text-gray-500 text-center mt-2 mb-6">{subtitle}</Text>
          {children}
        </View>
      </View>
    </SafeAreaView>
  )
}
