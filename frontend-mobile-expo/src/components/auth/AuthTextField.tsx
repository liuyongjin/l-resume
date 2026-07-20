import type { ReactNode } from 'react'
import { View, TextInput, type TextInputProps } from 'react-native'

interface AuthTextFieldProps extends TextInputProps {
  icon?: ReactNode
  testID?: string
}

export function AuthTextField({ icon, testID, className, ...props }: AuthTextFieldProps) {
  return (
    <View className="relative mb-3">
      {icon ? (
        <View className="absolute left-3.5 top-0 bottom-0 justify-center z-10">{icon}</View>
      ) : null}
      <TextInput
        testID={testID}
        className={`border border-gray-200 rounded-xl py-3.5 text-base text-gray-900 bg-gray-50/80 ${icon ? 'pl-11 pr-4' : 'px-4'} ${className ?? ''}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  )
}
