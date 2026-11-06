import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'heroui-native';

import type { TutorialStep } from '@repo/utils';

import { measureTutorialTarget, type TutorialRect } from './targetRegistry';

interface TutorialOverlayProps {
  step: TutorialStep;
  stepIndex: number;
  stepCount: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const SPOTLIGHT_PADDING = 6;
const SPOTLIGHT_RADIUS = 20;
const MEASURE_DELAY_MS = 350;
const DIM = 'rgba(0,0,0,0.6)';

/**
 * One tour step: the screen is dimmed around the target (when it can be
 * measured on screen) and a card explains it. A step with no target, or one
 * that is off screen, shows the card alone; it never blocks the tour.
 */
export default function TutorialOverlay({
  step,
  stepIndex,
  stepCount,
  onNext,
  onBack,
  onSkip,
}: TutorialOverlayProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Tagged with its step, so a measurement never outlives the step it belongs to.
  const [measured, setMeasured] = useState<{ stepId: string; rect: TutorialRect } | null>(null);
  const rect = measured?.stepId === step.id ? measured.rect : null;

  useEffect(() => {
    let active = true;
    if (!step.targetKey) return;
    const key = step.targetKey;
    const stepId = step.id;
    // Give the tab switch behind the overlay a moment to settle before measuring.
    const timer = setTimeout(() => {
      void measureTutorialTarget(key).then((found) => {
        if (!active || !found) return;
        const onScreen = found.y >= 0 && found.y + found.height <= height
          && found.x >= 0 && found.x + found.width <= width;
        if (onScreen) setMeasured({ stepId, rect: found });
      });
    }, MEASURE_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [step.targetKey, step.id, width, height]);

  const hole = rect
    ? {
        left: rect.x - SPOTLIGHT_PADDING,
        top: rect.y - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      }
    : null;
  // The card sits on the opposite half from the spotlight.
  const cardAtTop = hole ? hole.top > height / 2 : false;
  const isLast = stepIndex === stepCount - 1;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onSkip}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={{ flex: 1 }} pointerEvents="box-none">
        {hole ? (
          <>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(0, hole.top), backgroundColor: DIM }} />
            <View style={{ position: 'absolute', left: 0, right: 0, top: hole.top + hole.height, bottom: 0, backgroundColor: DIM }} />
            <View style={{ position: 'absolute', left: 0, width: Math.max(0, hole.left), top: hole.top, height: hole.height, backgroundColor: DIM }} />
            <View style={{ position: 'absolute', left: hole.left + hole.width, right: 0, top: hole.top, height: hole.height, backgroundColor: DIM }} />
            <View
              pointerEvents="none"
              testID="tutorial-spotlight"
              className="absolute border-2 border-primary"
              style={{ ...hole, borderRadius: SPOTLIGHT_RADIUS }}
            />
          </>
        ) : (
          <Pressable
            accessible={false}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: DIM }}
          />
        )}

        <View
          className="absolute left-4 right-4 rounded-3xl bg-surface p-5 gap-3"
          style={cardAtTop ? { top: insets.top + 16 } : { bottom: Math.max(insets.bottom, 16) + 8 }}
          accessibilityViewIsModal
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-nunitoSemiBold text-muted" accessibilityLiveRegion="polite">
              Step {stepIndex + 1} of {stepCount}
            </Text>
            <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip tutorial" hitSlop={8}>
              <Text className="text-sm font-nunitoSemiBold text-muted">Skip Tutorial</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-1" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {Array.from({ length: stepCount }, (_, index) => (
              <View
                key={index}
                className={`h-1 flex-1 rounded-full ${index <= stepIndex ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </View>

          <Text className="text-lg font-nunitoBold text-foreground">{step.title}</Text>
          <Text className="text-sm font-inter leading-5 text-muted">{step.description}</Text>

          <View className="flex-row gap-2 pt-1">
            {stepIndex > 0 ? (
              <Button variant="secondary" onPress={onBack} className="min-h-11 flex-1">
                <Button.Label>Back</Button.Label>
              </Button>
            ) : null}
            <Button onPress={onNext} className="min-h-11 flex-1">
              <Button.Label>{isLast ? 'Finish' : 'Next'}</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
