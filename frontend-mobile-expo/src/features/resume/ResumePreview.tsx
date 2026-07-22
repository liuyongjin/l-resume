import { View, Text, ScrollView } from 'react-native'
import type { Resume, ResumeData } from '@/api/types'
import { getResumeDisplayName } from '@/utils/resumeTransform'
import { colors } from '@/theme/tokens'

interface ResumePreviewProps {
  resume: Resume
}

export function ResumePreview({ resume }: ResumePreviewProps) {
  const data = resume.data as ResumeData
  const name = getResumeDisplayName(data)

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6 pb-12">
      <View className="border-b border-gray-200 pb-4 mb-4">
        <Text className="text-2xl font-bold text-gray-900">{name}</Text>
        <Text className="text-primary font-medium mt-1">{data.basicInfo.position}</Text>
        <Text className="text-sm text-gray-500 mt-2">
          {[data.basicInfo.phone, data.basicInfo.email, data.basicInfo.city].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {data.professionalSummary ? (
        <Section title="自我介绍">
          <Text className="text-gray-700 leading-6">{data.professionalSummary}</Text>
        </Section>
      ) : null}

      {data.workExperience.length > 0 ? (
        <Section title="工作经历">
          {data.workExperience.map((w) => (
            <View key={w.id} className="mb-4">
              <Text className="font-semibold text-gray-900">{w.company}</Text>
              <Text className="text-sm text-gray-600">{w.position} · {w.startDate} - {w.endDate}</Text>
              {w.description?.map((d, i) => (
                <Text key={i} className="text-sm text-gray-700 mt-1">• {d}</Text>
              ))}
            </View>
          ))}
        </Section>
      ) : null}

      {data.projectExperience.length > 0 ? (
        <Section title="项目经验">
          {data.projectExperience.map((p) => (
            <View key={p.id} className="mb-4">
              <Text className="font-semibold text-gray-900">{p.name}</Text>
              <Text className="text-sm text-gray-600">{p.role} · {p.startDate} - {p.endDate}</Text>
              {p.description?.map((d, i) => (
                <Text key={i} className="text-sm text-gray-700 mt-1">• {d}</Text>
              ))}
            </View>
          ))}
        </Section>
      ) : null}

      {data.education.length > 0 ? (
        <Section title="教育背景">
          {data.education.map((e) => (
            <View key={e.id} className="mb-3">
              <Text className="font-semibold text-gray-900">{e.school}</Text>
              <Text className="text-sm text-gray-600">{e.degree} · {e.major}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      {data.skills.some((s) => s.items.length) ? (
        <Section title="专业技能">
          {data.skills.filter((s) => s.items.length).map((s) => (
            <View key={s.id} className="mb-2">
              <Text className="text-sm font-medium text-gray-800">{s.category}</Text>
              <Text className="text-sm text-gray-600">{s.items.join(' · ')}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      <View className="mt-6 pt-4 border-t border-dashed border-gray-200">
        <Text className="text-xs text-gray-400 text-center">模板: {resume.templateId ?? 'default'} · 简流</Text>
      </View>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-1 h-5 rounded-full" style={{ backgroundColor: colors.primary }} />
        <Text className="text-lg font-bold text-gray-900">{title}</Text>
      </View>
      {children}
    </View>
  )
}
