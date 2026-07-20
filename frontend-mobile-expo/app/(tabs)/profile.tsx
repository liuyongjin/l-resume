import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/stores/userStore'

export default function ProfileTabScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const isLoading = useUserStore((s) => s.isLoading)
  const logout = useUserStore((s) => s.logout)

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-4">
      <Text className="text-2xl font-bold text-gray-900">{t('profile.title')}</Text>

      {user ? (
        <View className="mt-6 bg-white rounded-2xl p-5 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900">{user.username}</Text>
          <Text className="text-gray-500 mt-1">{user.email}</Text>
        </View>
      ) : null}

      <Pressable
        testID="profile-logout"
        className="mt-8 bg-primary rounded-full py-3.5 items-center"
        onPress={handleLogout}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">{t('nav.signOut')}</Text>
        )}
      </Pressable>
    </SafeAreaView>
  )
}
