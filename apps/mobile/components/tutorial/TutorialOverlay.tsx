import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { Button } from 'heroui-native';

import type { TutorialPortal, TutorialStep } from '@repo/utils';

import { useColors } from '@/hooks/useTheme';
import { computeCalloutLayout, estimateNativeTabRect } from './calloutLayout';
import { measureTutorialTarget, type TutorialRect } from './targetRegistry';

interface TutorialOverlayProps {
  portal: TutorialPortal;
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
// Dark screens are already dark, so they need a lighter veil to keep the page readable.
const DIM_LIGHT = 'rgba(0,0,0,0.6)';
const DIM_DARK = 'rgba(0,0,0,0.35)';

/**
 * One tour step: the screen is dimmed around the target (when it can be
 * measured on screen) and a card explains it. A step with no target, or one
 * that is off screen, shows the card alone; it never blocks the tour.
 */
export default function TutorialOverlay({
  portal,
  step,
  stepIndex,
  stepCount,
  onNext,
  onBack,
  onSkip,
}: TutorialOverlayProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isDark } = useColors();
  const DIM = isDark ? DIM_DARK : DIM_LIGHT;
  // Tagged with its step, so a measurement never outlives the step it belongs to.
  const [measured, setMeasured] = useState<{ stepId: string; rect: TutorialRect } | null>(null);
  const measuredRect = measured?.stepId === step.id ? measured.rect : null;
  // iOS tabs are native and cannot be measured: point at the estimated button.
  const nativeRect =
    Platform.OS === 'ios' && step.targetKey?.startsWith('tab-')
      ? estimateNativeTabRect(portal, step.mobileTab, { width, height }, insets)
      : null;
  const rect = measuredRect ?? nativeRect;

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
  const callout = computeCalloutLayout({
    hole: hole ? { x: hole.left, y: hole.top, width: hole.width, height: hole.height } : null,
    window: { width, height },
    insets,
  });
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
            <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
              <Defs>
                <Mask id="tutorial-cutout">
                  <Rect width={width} height={height} fill="white" />
                  <Rect
                    x={hole.left}
                    y={hole.top}
                    width={hole.width}
                    height={hole.height}
                    rx={SPOTLIGHT_RADIUS}
                    fill="black"
                  />
                </Mask>
              </Defs>
              <Rect width={width} height={height} fill={DIM} mask="url(#tutorial-cutout)" />
            </Svg>
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
          testID="tutorial-card"
          className="absolute rounded-3xl bg-surface p-5 gap-3"
          style={{
            left: callout.left,
            width: callout.width,
            top: callout.top,
            bottom: callout.bottom,
          }}
          accessibilityViewIsModal
        >
          {callout.arrowCenter !== null ? (
            <View
              pointerEvents="none"
              testID="tutorial-arrow"
              className="absolute size-4 bg-surface"
              style={{
                left: callout.arrowCenter - 8,
                ...(callout.placement === 'above' ? { bottom: -6 } : { top: -6 }),
                transform: [{ rotate: '45deg' }],
                borderRadius: 3,
              }}
            />
          ) : null}
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
