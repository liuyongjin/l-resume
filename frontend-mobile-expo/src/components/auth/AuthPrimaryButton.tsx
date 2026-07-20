import { Pressable, Text, ActivityIndicator } from 'react-native'

interface AuthPrimaryButtonProps {
  label: string
  onPress: () => void
  loading?: boolean
  testID?: string
}

export function AuthPrimaryButton({ label, onPress, loading, testID }: AuthPrimaryButtonProps) {
  return (
    <Pressable
      testID={testID}
      className="bg-primary rounded-full py-3.5 items-center mt-2 active:opacity-90"
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-semibold text-base">{label}</Text>
      )}
    </Pressable>
  )
}
