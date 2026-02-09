import { View, Text } from 'react-native'
import CircleProgress from './CircleProgress'

interface ApplicationHeaderProps {
  currentTitle: string,
  nextTitle: string,
  step: number,
  totalSteps?: number,
}

export default function ApplicationHeader({
  currentTitle,
  nextTitle,
  step = 1,
  totalSteps = 4,
}: ApplicationHeaderProps) {

  return (
    <View className='w-screen bg-white p-5 flex-row items-center justify-between'>
      {/* Title and Next Title */}
      <View className='flex-1 gap-1'>
        <Text className='text-2xl font-poppinsSemiBold text-text'>
          {currentTitle}
        </Text>

        <Text className='text-base font-interMedium text-grey-500'>
          Next: {nextTitle}
        </Text>
      </View>

      {/* Circle Progress */}
      <View>
        <CircleProgress currentStep={step} totalSteps={totalSteps} />
      </View>
    </View>
  )
}