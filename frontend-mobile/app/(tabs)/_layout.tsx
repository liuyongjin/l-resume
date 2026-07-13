import { Tabs } from 'expo-router'
import { Home, GitBranch, FileText, User } from 'lucide-react-native'
import { colors } from '@/theme/tokens'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="workflow"
        options={{
          title: '工作流',
          tabBarIcon: ({ color, size }) => <GitBranch color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="resumes"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '个人',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
