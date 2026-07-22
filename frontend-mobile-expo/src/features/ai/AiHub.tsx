import { View, Text, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Bot, Target, FilePlus, Languages } from 'lucide-react-native'
import { colors } from '@/theme/tokens'
import type { AiMode } from '@/stores/aiStore'

const ITEMS: { key: AiMode; icon: typeof Bot; color: string }[] = [
  { key: 'polish', icon: Bot, color: '#7C3AED' },
  { key: 'match', icon: Target, color: '#3B82F6' },
  { key: 'complete', icon: FilePlus, color: '#10B981' },
  { key: 'translate', icon: Languages, color: '#F59E0B' },
]

interface AiHubProps {
  selectedMode?: AiMode
  onSelectMode?: (mode: AiMode) => void
}

export function AiHub({ selectedMode = 'polish', onSelectMode }: AiHubProps) {
  const { t } = useTranslation()

  return (
    <View className="px-4">
      <View className="items-center py-6">
        <View className="size-20 rounded-full bg-violet-100 items-center justify-center mb-4">
          <Bot color={colors.primary} size={40} />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center">{t('ai.hubTitle')}</Text>
        <Text className="text-gray-500 text-center mt-2 px-4">{t('ai.hubDesc')}</Text>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = selectedMode === item.key
          return (
            <Pressable
              key={item.key}
              testID={`ai-mode-${item.key}`}
              className={`w-[47%] bg-white rounded-2xl p-4 border ${active ? 'border-primary' : 'border-gray-100'}`}
              onPress={() => onSelectMode?.(item.key)}
            >
              <View className="size-10 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${item.color}20` }}>
                <Icon color={item.color} size={20} />
              </View>
              <Text className="font-semibold text-gray-900 text-sm">{t(`ai.modes.${item.key}`)}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
