import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

interface ScoreRingProps {
  score: number
  size?: number
}

export function ScoreRing({ score, size = 160 }: ScoreRingProps) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, score)) / 100
  const offset = circumference * (1 - progress)

  return (
    <View className="items-center justify-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#7C3AED"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-4xl font-bold text-gray-900">{score}</Text>
          <Text className="text-sm text-gray-500">优化评分</Text>
        </View>
      </View>
    </View>
  )
}
