import { useState } from 'react'
import { Text, Pressable } from 'react-native'
import { useRouter, Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { User, Mail, Lock } from 'lucide-react-native'
import { useUserStore } from '@/stores/userStore'
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout'
import { AuthTextField } from '@/components/auth/AuthTextField'
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { colors } from '@/theme/tokens'

export default function RegisterScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const register = useUserStore((s) => s.register)
  const isLoading = useUserStore((s) => s.isLoading)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async () => {
    setError('')
    if (!username.trim() || !email.trim() || !password) {
      setError(t('auth.required'))
      return
    }
    const result = await register(username.trim(), email.trim(), password)
    if (result.success) {
      router.replace('/(tabs)')
    } else {
      setError(result.message)
    }
  }

  return (
    <AuthScreenLayout title={t('nav.signUp')} subtitle={t('auth.registerSubtitle')}>
      {error ? (
        <Text className="text-red-500 text-sm mb-3 text-center">{error}</Text>
      ) : null}

      <AuthTextField
        testID="register-username"
        placeholder={t('auth.username')}
        value={username}
        onChangeText={setUsername}
        icon={<User color={colors.textMuted} size={18} />}
      />
      <AuthTextField
        testID="register-email"
        placeholder={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        icon={<Mail color={colors.textMuted} size={18} />}
      />
      <AuthTextField
        testID="register-password"
        placeholder={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        icon={<Lock color={colors.textMuted} size={18} />}
      />

      <AuthPrimaryButton
        testID="register-submit"
        label={t('nav.signUp')}
        onPress={handleRegister}
        loading={isLoading}
      />

      <Link href="/(auth)/login" asChild>
        <Pressable className="mt-6 items-center py-2">
          <Text className="text-primary font-medium">{t('auth.goLogin')}</Text>
        </Pressable>
      </Link>
    </AuthScreenLayout>
  )
}
