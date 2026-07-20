import { useState } from 'react'
import { Text, Pressable } from 'react-native'
import { useRouter, Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Phone, Lock } from 'lucide-react-native'
import { useUserStore } from '@/stores/userStore'
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout'
import { AuthTextField } from '@/components/auth/AuthTextField'
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { colors } from '@/theme/tokens'

export default function LoginScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const login = useUserStore((s) => s.login)
  const isLoading = useUserStore((s) => s.isLoading)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    if (!phone.trim() || !password) {
      setError(t('auth.required'))
      return
    }
    const result = await login(phone.trim(), password)
    if (result.success) {
      router.replace('/(tabs)')
    } else {
      setError(result.message)
    }
  }

  return (
    <AuthScreenLayout title={t('auth.welcomeBack')} subtitle={t('auth.loginSubtitle')}>
      {error ? (
        <Text className="text-red-500 text-sm mb-3 text-center">{error}</Text>
      ) : null}

      <AuthTextField
        testID="login-phone"
        placeholder={t('auth.phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCapitalize="none"
        icon={<Phone color={colors.textMuted} size={18} />}
      />
      <AuthTextField
        testID="login-password"
        placeholder={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        icon={<Lock color={colors.textMuted} size={18} />}
      />

      <AuthPrimaryButton
        testID="login-submit"
        label={t('nav.signIn')}
        onPress={handleLogin}
        loading={isLoading}
      />

      <Link href="/(auth)/register" asChild>
        <Pressable className="mt-6 items-center py-2">
          <Text className="text-primary font-medium">{t('auth.goRegister')}</Text>
        </Pressable>
      </Link>
    </AuthScreenLayout>
  )
}
