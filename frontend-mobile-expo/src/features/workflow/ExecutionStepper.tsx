import { View, Text } from 'react-native'
import { Check, Circle } from 'lucide-react-native'
import { colors } from '@/theme/tokens'

export interface StepItem {
  key: string
  label: string
  status: 'pending' | 'active' | 'done' | 'failed'
}

interface ExecutionStepperProps {
  steps: StepItem[]
}

export function ExecutionStepper({ steps }: ExecutionStepperProps) {
  return (
    <View className="px-4 py-2">
      {steps.map((step, index) => (
        <View key={step.key} className="flex-row">
          <View className="items-center mr-4">
            <StepIcon status={step.status} />
            {index < steps.length - 1 ? (
              <View className="w-0.5 flex-1 min-h-[32px] bg-gray-200 my-1" />
            ) : null}
          </View>
          <View className="flex-1 pb-6">
            <Text className={`font-medium ${step.status === 'active' ? 'text-primary' : step.status === 'done' ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function StepIcon({ status }: { status: StepItem['status'] }) {
  if (status === 'failed') {
    return (
      <View className="size-8 rounded-full items-center justify-center bg-red-500">
        <Text className="text-white text-xs font-bold">!</Text>
      </View>
    )
  }
  if (status === 'done') {
    return (
      <View className="size-8 rounded-full items-center justify-center" style={{ backgroundColor: colors.success }}>
        <Check color="#fff" size={16} />
      </View>
    )
  }
  if (status === 'active') {
    return (
      <View className="size-8 rounded-full border-2 items-center justify-center" style={{ borderColor: colors.primary }}>
        <View className="size-3 rounded-full" style={{ backgroundColor: colors.primary }} />
      </View>
    )
  }
  return (
    <View className="size-8 rounded-full border-2 border-gray-200 items-center justify-center">
      <Circle color="#D1D5DB" size={12} />
    </View>
  )
}
