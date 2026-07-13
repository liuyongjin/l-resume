import { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native'
import type { ResumeData } from '@/api/types'

type TabKey = 'basic' | 'work' | 'project' | 'education' | 'skills'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'basic', label: '基本信息' },
  { key: 'work', label: '工作经历' },
  { key: 'project', label: '项目经验' },
  { key: 'education', label: '教育背景' },
  { key: 'skills', label: '专业技能' },
]

interface ResumeFormTabsProps {
  data: ResumeData
  onChange: (data: ResumeData) => void
}

export function ResumeFormTabs({ data, onChange }: ResumeFormTabsProps) {
  const [tab, setTab] = useState<TabKey>('basic')

  const updateBasic = (field: keyof ResumeData['basicInfo'], value: string) => {
    onChange({ ...data, basicInfo: { ...data.basicInfo, [field]: value } })
  }

  return (
    <View className="flex-1">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-100 max-h-12">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`px-4 py-3 ${tab === t.key ? 'border-b-2 border-primary' : ''}`}
          >
            <Text className={`text-sm font-medium ${tab === t.key ? 'text-primary' : 'text-gray-500'}`}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
        {tab === 'basic' && (
          <View className="gap-3 pb-8">
            <Field label="姓名" value={data.basicInfo.name} onChangeText={(v) => updateBasic('name', v)} />
            <Field label="求职岗位" value={data.basicInfo.position} onChangeText={(v) => updateBasic('position', v)} />
            <Field label="手机号" value={data.basicInfo.phone} onChangeText={(v) => updateBasic('phone', v)} keyboardType="phone-pad" />
            <Field label="邮箱" value={data.basicInfo.email} onChangeText={(v) => updateBasic('email', v)} keyboardType="email-address" />
            <Field label="所在城市" value={data.basicInfo.city} onChangeText={(v) => updateBasic('city', v)} />
            <View>
              <Text className="text-sm text-gray-600 mb-1.5">个人总结</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 min-h-[120px] text-base bg-gray-50/80"
                multiline
                textAlignVertical="top"
                value={data.professionalSummary}
                onChangeText={(v) => onChange({ ...data, professionalSummary: v })}
                placeholder="简要介绍您的专业背景与优势"
              />
            </View>
          </View>
        )}

        {tab === 'work' && (
          <SectionList
            empty="暂无工作经历"
            items={data.workExperience.map((w) => `${w.company} · ${w.position}`)}
          />
        )}
        {tab === 'project' && (
          <SectionList empty="暂无项目经验" items={data.projectExperience.map((p) => p.name)} />
        )}
        {tab === 'education' && (
          <SectionList empty="暂无教育背景" items={data.education.map((e) => `${e.school} · ${e.degree}`)} />
        )}
        {tab === 'skills' && (
          <SectionList
            empty="暂无技能"
            items={data.skills.flatMap((g) => g.items.length ? [`${g.category}: ${g.items.join(', ')}`] : [])}
          />
        )}
      </ScrollView>
    </View>
  )
}

function Field({ label, value, onChangeText, keyboardType }: {
  label: string; value: string; onChangeText: (v: string) => void; keyboardType?: 'default' | 'email-address' | 'phone-pad'
}) {
  return (
    <View>
      <Text className="text-sm text-gray-600 mb-1.5">{label}</Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50/80"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  )
}

function SectionList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) {
    return <Text className="text-gray-500 text-center py-8">{empty}</Text>
  }
  return (
    <View className="gap-2 pb-8">
      {items.map((item, i) => (
        <View key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <Text className="text-gray-800">{item}</Text>
        </View>
      ))}
    </View>
  )
}
