import { View, Text, Pressable } from 'react-native'
import { FileText, Edit3, Trash2 } from 'lucide-react-native'
import type { Resume } from '@/api/types'
import { formatDateTime } from '@/utils/resumeTransform'
import { colors } from '@/theme/tokens'

interface ResumeListCardProps {
  resume: Resume
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ResumeListCard({ resume, onPress, onEdit, onDelete }: ResumeListCardProps) {
  return (
    <Pressable
      testID={`resume-card-${resume.id}`}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm active:opacity-90"
      onPress={onPress}
    >
      <View className="flex-row gap-3">
        <View className="size-14 rounded-xl items-center justify-center" style={{ backgroundColor: colors.secondary }}>
          <FileText color={colors.primary} size={24} />
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2">
            <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>{resume.title}</Text>
            {resume.source === 'workflow' ? (
              <View className="bg-violet-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-primary font-medium">AI</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-xs text-gray-500 mt-1">{formatDateTime(resume.updatedAt)}</Text>
        </View>
      </View>
      <View className="flex-row justify-end gap-4 mt-3 pt-3 border-t border-gray-100">
        <Pressable onPress={onEdit} hitSlop={8} className="flex-row items-center gap-1">
          <Edit3 color={colors.primary} size={16} />
          <Text className="text-sm text-primary">编辑</Text>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} className="flex-row items-center gap-1">
          <Trash2 color={colors.error} size={16} />
          <Text className="text-sm text-red-500">删除</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}
