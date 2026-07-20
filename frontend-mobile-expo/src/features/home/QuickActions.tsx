import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Bot, GitBranch, FileText, Grid3x3, type LucideIcon } from 'lucide-react-native'
import { colors } from '@/theme/tokens'

type QuickKey = 'aiCoach' | 'aiWorkflow' | 'myResume' | 'more'

const ICONS: Record<QuickKey, LucideIcon> = {
  aiCoach: Bot,
  aiWorkflow: GitBranch,
  myResume: FileText,
  more: Grid3x3,
}

const ROUTES: Partial<Record<QuickKey, string>> = {
  aiCoach: '/ai',
  aiWorkflow: '/(tabs)/workflow',
  myResume: '/(tabs)/resumes',
  more: '/templates',
}

export function QuickActions() {
  const { t } = useTranslation()
  const router = useRouter()
  const keys: QuickKey[] = ['aiCoach', 'aiWorkflow', 'myResume', 'more']

  return (
    <View className="flex-row flex-wrap px-4 mt-6 gap-3">
      {keys.map((key) => {
        const Icon = ICONS[key]
        const route = ROUTES[key]
        return (
          <Pressable
            key={key}
            testID={`home-quick-${key}`}
            className="w-[47%] bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:opacity-90"
            onPress={() => {
              if (route) router.push(route as never)
            }}
          >
            <View
              className="size-10 rounded-xl items-center justify-center mb-3"
              style={{ backgroundColor: colors.secondary }}
            >
              <Icon color={colors.primary} size={20} />
            </View>
            <Text className="font-semibold text-gray-900 text-sm">{t(`home.quick.${key}`)}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
