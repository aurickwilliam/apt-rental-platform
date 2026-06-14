import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg';

import { useColors } from '@/hooks/useTheme'

interface CircleProgressProps {
  currentStep: number,
  totalSteps: number,
}

export default function CircleProgress({ currentStep, totalSteps }: CircleProgressProps) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = currentStep / totalSteps;
  const strokeDashoffset = circumference - progress * circumference;

  const { colors } = useColors();

  return (
    <View 
      className="relative items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} className="absolute">
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surface}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.success}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      <Text className="text-2xl font-interSemiBold text-foreground absolute">
        {currentStep} of {totalSteps}
      </Text>
    </View>
  )
}