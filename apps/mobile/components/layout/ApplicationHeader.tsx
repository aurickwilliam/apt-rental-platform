import { View, Text, Pressable } from 'react-native'
import { useRouter, type Href } from 'expo-router'

interface ApplicationHeaderProps {
  currentTitle: string,
  nextTitle: string,
  step: number,
  totalSteps?: number,
  /** Short name per step, shown under the bar ("Photos", "Info", ...). */
  stepLabels?: string[],
  /**
   * Route of each step. When given, finished steps can be tapped to go back
   * to them (the form keeps its data, the same as pressing Back).
   */
  stepHrefs?: Href[],
}

export default function ApplicationHeader({
  currentTitle,
  nextTitle,
  step = 1,
  totalSteps = 3,
  stepLabels,
  stepHrefs,
}: ApplicationHeaderProps) {
  const router = useRouter()
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1)
  const progressLabel = `Step ${step} of ${totalSteps}, ${currentTitle}`

  const goToStep = (target: number) => {
    const href = stepHrefs?.[target - 1]
    if (href && target < step) router.dismissTo(href)
  }

  return (
    <View className='w-screen bg-surface px-5 pt-5 pb-4 gap-3'>
      {/* Title row */}
      <View
        className='flex-row items-baseline justify-between gap-3'
        accessible
        accessibilityRole='progressbar'
        accessibilityLabel={progressLabel}
        accessibilityValue={{ min: 1, max: totalSteps, now: step, text: progressLabel }}
      >
        <Text className='flex-1 text-2xl font-nunitoBold text-foreground' numberOfLines={1}>
          {currentTitle}
        </Text>
        <Text className='text-sm font-nunitoSemiBold text-muted'>
          Step {step} of {totalSteps}
        </Text>
      </View>

      {/* Segmented progress */}
      <View className='flex-row gap-1.5'>
        {steps.map((stepNumber) => {
          const isDone = stepNumber < step
          const isCurrent = stepNumber === step
          const label = stepLabels?.[stepNumber - 1]
          const isTappable = isDone && !!stepHrefs?.[stepNumber - 1]

          const segment = (
            <View className='gap-1.5'>
              <View
                className={`h-1.5 rounded-full ${isDone || isCurrent ? 'bg-primary' : 'bg-border'}`}
              />
              {label && (
                <Text
                  numberOfLines={1}
                  className={`text-xs text-center ${
                    isCurrent
                      ? 'font-nunitoBold text-primary'
                      : isDone
                        ? 'font-nunitoSemiBold text-foreground'
                        : 'font-nunitoSemiBold text-muted'
                  }`}
                >
                  {label}
                </Text>
              )}
            </View>
          )

          return isTappable ? (
            <Pressable
              key={stepNumber}
              className='flex-1'
              hitSlop={{ top: 12, bottom: 12 }}
              onPress={() => goToStep(stepNumber)}
              accessibilityRole='button'
              accessibilityLabel={`Go back to step ${stepNumber}${label ? `, ${label}` : ''}`}
            >
              {segment}
            </Pressable>
          ) : (
            <View
              key={stepNumber}
              className='flex-1'
              accessibilityElementsHidden
              importantForAccessibility='no-hide-descendants'
            >
              {segment}
            </View>
          )
        })}
      </View>

      <Text className='text-sm font-nunitoSemiBold text-muted'>
        Next: {nextTitle}
      </Text>
    </View>
  )
}
