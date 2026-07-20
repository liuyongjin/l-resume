import { View, Text, Pressable } from 'react-native'
import type { TemplateItem } from '@/api/types'
import { colors } from '@/theme/tokens'

interface TemplateCardProps {
  template: TemplateItem
  onPress: () => void
}

export function TemplateCard({ template, onPress }: TemplateCardProps) {
  const primary = (template.config?.primaryColor as string) ?? colors.primary

  return (
    <Pressable
      testID={`template-${template.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-3 active:opacity-90"
      onPress={onPress}
    >
      <View className="h-24 items-center justify-center" style={{ backgroundColor: `${primary}18` }}>
        <View className="w-16 h-20 bg-white rounded shadow-sm border border-gray-100" />
      </View>
      <View className="p-4">
        <Text className="font-semibold text-gray-900">{template.name}</Text>
        <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>{template.description ?? ''}</Text>
        <View className="mt-3 self-start px-3 py-1 rounded-full" style={{ backgroundColor: primary }}>
          <Text className="text-white text-xs font-medium">使用此模板</Text>
        </View>
      </View>
    </Pressable>
  )
}
