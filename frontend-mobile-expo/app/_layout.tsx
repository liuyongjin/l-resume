import '../global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import '@/i18n'
import { useUserStore } from '@/stores/userStore'
import { colors } from '@/theme/tokens'

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const segments = useSegments()
  const isReady = useUserStore((s) => s.isReady)
  const isLoggedIn = useUserStore((s) => s.isLoggedIn)
  const bootstrap = useUserStore((s) => s.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (!isReady) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login')
      return
    }
    if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isReady, isLoggedIn, segments, router])

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="templates/index" options={{ presentation: 'card', headerShown: true }} />
          <Stack.Screen name="resume/[id]/edit" options={{ presentation: 'card' }} />
          <Stack.Screen name="resume/[id]/preview" options={{ presentation: 'card' }} />
          <Stack.Screen name="ai/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="ai/result" options={{ presentation: 'card' }} />
          <Stack.Screen name="workflow/run" options={{ presentation: 'card' }} />
          <Stack.Screen name="workflow/complete" options={{ presentation: 'card' }} />
          <Stack.Screen name="workflow/designer" options={{ presentation: 'card' }} />
        </Stack>
      </AuthGate>
    </SafeAreaProvider>
  )
}
