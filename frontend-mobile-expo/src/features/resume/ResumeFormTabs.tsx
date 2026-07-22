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

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

interface ResumeFormTabsProps {
  data: ResumeData
  onChange: (data: ResumeData) => void
}

export function ResumeFormTabs({ data, onChange }: ResumeFormTabsProps) {
  const [tab, setTab] = useState<TabKey>('basic')

  const updateBasic = (field: keyof ResumeData['basicInfo'], value: string) => {
    onChange({ ...data, basicInfo: { ...data.basicInfo, [field]: value } })
  }

  const updateWork = (index: number, patch: Partial<ResumeData['workExperience'][number]>) => {
    const list = data.workExperience.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ ...data, workExperience: list })
  }

  const updateProject = (index: number, patch: Partial<ResumeData['projectExperience'][number]>) => {
    const list = data.projectExperience.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ ...data, projectExperience: list })
  }

  const updateEducation = (index: number, patch: Partial<ResumeData['education'][number]>) => {
    const list = data.education.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ ...data, education: list })
  }

  const updateSkill = (index: number, patch: Partial<ResumeData['skills'][number]>) => {
    const list = data.skills.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ ...data, skills: list })
  }

  return (
    <View className="flex-1" testID="resume-form-tabs">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-100 max-h-12">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            testID={`resume-tab-${t.key}`}
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
          <EditableSection
            empty="暂无工作经历"
            onAdd={() =>
              onChange({
                ...data,
                workExperience: [
                  ...data.workExperience,
                  { id: newId('work'), company: '', position: '', startDate: '', endDate: '', description: [''] },
                ],
              })
            }
            addLabel="添加工作经历"
          >
            {data.workExperience.map((w, i) => (
              <View key={w.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-3 gap-2">
                <Field label="公司" value={w.company} onChangeText={(v) => updateWork(i, { company: v })} />
                <Field label="职位" value={w.position} onChangeText={(v) => updateWork(i, { position: v })} />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Field label="开始" value={w.startDate} onChangeText={(v) => updateWork(i, { startDate: v })} />
                  </View>
                  <View className="flex-1">
                    <Field label="结束" value={w.endDate} onChangeText={(v) => updateWork(i, { endDate: v })} />
                  </View>
                </View>
                <View>
                  <Text className="text-sm text-gray-600 mb-1.5">工作描述（每行一条）</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 min-h-[90px] text-base bg-white"
                    multiline
                    textAlignVertical="top"
                    value={(w.description ?? []).join('\n')}
                    onChangeText={(v) =>
                      updateWork(i, {
                        description: v.split('\n').map((line) => line.trim()).filter(Boolean),
                      })
                    }
                  />
                </View>
                <Pressable
                  onPress={() =>
                    onChange({ ...data, workExperience: data.workExperience.filter((_, idx) => idx !== i) })
                  }
                >
                  <Text className="text-red-500 text-sm text-right">删除</Text>
                </Pressable>
              </View>
            ))}
          </EditableSection>
        )}

        {tab === 'project' && (
          <EditableSection
            empty="暂无项目经验"
            onAdd={() =>
              onChange({
                ...data,
                projectExperience: [
                  ...data.projectExperience,
                  { id: newId('proj'), name: '', role: '', startDate: '', endDate: '', description: [''] },
                ],
              })
            }
            addLabel="添加项目"
          >
            {data.projectExperience.map((p, i) => (
              <View key={p.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-3 gap-2">
                <Field label="项目名称" value={p.name} onChangeText={(v) => updateProject(i, { name: v })} />
                <Field label="角色" value={p.role} onChangeText={(v) => updateProject(i, { role: v })} />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Field label="开始" value={p.startDate} onChangeText={(v) => updateProject(i, { startDate: v })} />
                  </View>
                  <View className="flex-1">
                    <Field label="结束" value={p.endDate} onChangeText={(v) => updateProject(i, { endDate: v })} />
                  </View>
                </View>
                <View>
                  <Text className="text-sm text-gray-600 mb-1.5">项目描述（每行一条）</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 min-h-[90px] text-base bg-white"
                    multiline
                    textAlignVertical="top"
                    value={(p.description ?? []).join('\n')}
                    onChangeText={(v) =>
                      updateProject(i, {
                        description: v.split('\n').map((line) => line.trim()).filter(Boolean),
                      })
                    }
                  />
                </View>
                <Pressable
                  onPress={() =>
                    onChange({
                      ...data,
                      projectExperience: data.projectExperience.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  <Text className="text-red-500 text-sm text-right">删除</Text>
                </Pressable>
              </View>
            ))}
          </EditableSection>
        )}

        {tab === 'education' && (
          <EditableSection
            empty="暂无教育背景"
            onAdd={() =>
              onChange({
                ...data,
                education: [
                  ...data.education,
                  {
                    id: newId('edu'),
                    school: '',
                    major: '',
                    degree: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                  },
                ],
              })
            }
            addLabel="添加教育经历"
          >
            {data.education.map((e, i) => (
              <View key={e.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-3 gap-2">
                <Field label="学校" value={e.school} onChangeText={(v) => updateEducation(i, { school: v })} />
                <Field label="专业" value={e.major} onChangeText={(v) => updateEducation(i, { major: v })} />
                <Field label="学历" value={e.degree} onChangeText={(v) => updateEducation(i, { degree: v })} />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Field label="开始" value={e.startDate} onChangeText={(v) => updateEducation(i, { startDate: v })} />
                  </View>
                  <View className="flex-1">
                    <Field label="结束" value={e.endDate} onChangeText={(v) => updateEducation(i, { endDate: v })} />
                  </View>
                </View>
                <Field
                  label="说明"
                  value={e.description}
                  onChangeText={(v) => updateEducation(i, { description: v })}
                />
                <Pressable
                  onPress={() =>
                    onChange({ ...data, education: data.education.filter((_, idx) => idx !== i) })
                  }
                >
                  <Text className="text-red-500 text-sm text-right">删除</Text>
                </Pressable>
              </View>
            ))}
          </EditableSection>
        )}

        {tab === 'skills' && (
          <EditableSection
            empty="暂无技能"
            onAdd={() =>
              onChange({
                ...data,
                skills: [...data.skills, { id: newId('skill'), category: '技能', items: [] }],
              })
            }
            addLabel="添加技能分组"
          >
            {data.skills.map((s, i) => (
              <View key={s.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-3 gap-2">
                <Field label="分类" value={s.category} onChangeText={(v) => updateSkill(i, { category: v })} />
                <Field
                  label="技能（逗号分隔）"
                  value={s.items.join(', ')}
                  onChangeText={(v) =>
                    updateSkill(i, {
                      items: v.split(/[,，]/).map((x) => x.trim()).filter(Boolean),
                    })
                  }
                />
                <Pressable
                  onPress={() => onChange({ ...data, skills: data.skills.filter((_, idx) => idx !== i) })}
                >
                  <Text className="text-red-500 text-sm text-right">删除</Text>
                </Pressable>
              </View>
            ))}
          </EditableSection>
        )}
      </ScrollView>
    </View>
  )
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: 'default' | 'email-address' | 'phone-pad'
}) {
  return (
    <View>
      <Text className="text-sm text-gray-600 mb-1.5">{label}</Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-white"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  )
}

function EditableSection({
  children,
  empty,
  onAdd,
  addLabel,
}: {
  children: React.ReactNode
  empty: string
  onAdd: () => void
  addLabel: string
}) {
  const childArray = Array.isArray(children) ? children : [children]
  const hasItems = childArray.filter(Boolean).length > 0

  return (
    <View className="pb-8">
      {!hasItems ? <Text className="text-gray-500 text-center py-6">{empty}</Text> : null}
      {children}
      <Pressable testID="section-add" className="mt-2 py-3 rounded-xl border border-dashed border-primary items-center" onPress={onAdd}>
        <Text className="text-primary font-medium">{addLabel}</Text>
      </Pressable>
    </View>
  )
}
