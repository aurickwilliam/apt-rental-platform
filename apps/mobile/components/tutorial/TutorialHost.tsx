import { useCallback, useEffect, useRef } from 'react';
import { AppState, Text, View } from 'react-native';
import { useRouter, useSegments, type Href } from 'expo-router';
import { Button } from 'heroui-native';
import { IconCircleCheckFilled, IconHomeHeart } from '@tabler/icons-react-native';

import {
  getTutorialSteps,
  needsProfileOnboarding,
  shouldAutoStartTutorial,
  type TutorialPortal,
} from '@repo/utils';

import AppDialog from '@/components/display/AppDialog';
import { useProfile } from '@/hooks/auth';
import { useTutorialProgress } from '@/hooks/tutorial/useTutorialProgress';
import { useColors } from '@/hooks/useTheme';
import { usePortalStore } from '@/stores/usePortalStore';
import { useTutorialStore } from '@/stores/useTutorialStore';

import TutorialOverlay from './TutorialOverlay';

const AUTO_START_DELAY_MS = 800;

/**
 * Mounted once in the tabs layout. Starts the portal's tour for a new account
 * (progress is saved per profile and portal), and runs it whenever Settings →
 * Tutorial asks. The tour only changes which tab is in front; it never opens
 * a pushed screen and never writes anything except the final outcome.
 */
export default function TutorialHost() {
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useColors();
  const { profile } = useProfile();
  const activePortal = usePortalStore((state) => state.portal);

  const portal = useTutorialStore((state) => state.portal);
  const mode = useTutorialStore((state) => state.mode);
  const stage = useTutorialStore((state) => state.stage);
  const stepIndex = useTutorialStore((state) => state.stepIndex);

  const progressPortal: TutorialPortal | null = portal ?? activePortal;
  const { progress, progressLoaded, tenancySettled, hasActiveTenancy, saveOutcome } = useTutorialProgress(
    profile?.id ?? null,
    progressPortal,
  );

  const roles = profile?.roles ?? [];
  const steps = progressPortal
    ? getTutorialSteps(progressPortal, {
        platform: 'mobile',
        accountStatus: profile?.account_status,
        hasActiveTenancy,
      })
    : [];

  // Auto start, once per account and portal for this app session.
  const startedFor = useRef<string | null>(null);
  const inPortalTabs = activePortal !== null && segments[0] === '(tabs)' && segments[1] === `(${activePortal})`;
  const autoStart =
    activePortal !== null &&
    profile !== null &&
    tenancySettled &&
    inPortalTabs &&
    shouldAutoStartTutorial({
      portal: activePortal,
      roles,
      progressLoaded,
      progress,
      profileComplete: !needsProfileOnboarding({
        mobile_number: profile.mobile_number,
        account_status: profile.account_status,
      }),
      suspended: false,
      stepCount: steps.length,
    });

  useEffect(() => {
    if (!autoStart || !profile || !activePortal || portal !== null) return;
    const key = `${profile.id}:${activePortal}`;
    if (startedFor.current === key) return;
    const timer = setTimeout(() => {
      if (AppState.currentState !== 'active') return;
      startedFor.current = key;
      useTutorialStore.getState().start(activePortal, 'auto');
    }, AUTO_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoStart, profile, activePortal, portal]);

  // Another account or portal never inherits an open tour.
  useEffect(() => {
    if (portal && activePortal && portal !== activePortal) useTutorialStore.getState().close();
  }, [portal, activePortal]);
  const profileId = profile?.id ?? null;
  useEffect(() => {
    if (profileId === null) useTutorialStore.getState().close();
  }, [profileId]);

  const step = steps[stepIndex] ?? null;
  const stepTab = stage === 'steps' ? step?.mobileTab ?? null : null;
  useEffect(() => {
    if (!portal || !stepTab) return;
    router.navigate(`/(tabs)/(${portal})/${stepTab}` as Href);
  }, [portal, stepTab, router]);

  const finish = useCallback(
    (outcome: 'completed' | 'skipped') => {
      // Replaying a tour you skipped again leaves what is saved untouched.
      if (mode === 'auto' || outcome === 'completed') saveOutcome(outcome);
      useTutorialStore.getState().close();
    },
    [mode, saveOutcome],
  );

  if (!portal || steps.length === 0) return null;

  if (stage === 'welcome') {
    return (
      <AppDialog
        isOpen
        onOpenChange={(open) => { if (!open) finish('skipped'); }}
        title="Welcome to APT"
        titleLayout="centered"
        titleIllustration={
          <View className="size-24 items-center justify-center rounded-full bg-primary-light">
            <IconHomeHeart size={44} color={colors.primary} />
          </View>
        }
        footer={
          <View className="gap-2">
            <Button className="min-h-12" onPress={() => useTutorialStore.getState().begin()}>
              <Button.Label>Start Tutorial</Button.Label>
            </Button>
            <Button variant="secondary" className="min-h-12" onPress={() => finish('skipped')}>
              <Button.Label>Skip</Button.Label>
            </Button>
          </View>
        }
      >
        <WelcomeCopy portal={portal} />
      </AppDialog>
    );
  }

  if (stage === 'done') {
    return (
      <AppDialog
        isOpen
        onOpenChange={(open) => { if (!open) finish('completed'); }}
        title="You're all set"
        titleLayout="centered"
        titleIllustration={
          <View className="size-24 items-center justify-center rounded-full bg-primary-light">
            <IconCircleCheckFilled size={48} color={colors.primary} />
          </View>
        }
        footer={
          <Button className="min-h-12" onPress={() => finish('completed')}>
            <Button.Label>Get started</Button.Label>
          </Button>
        }
      >
        <DoneCopy />
      </AppDialog>
    );
  }

  if (!step) return null;

  return (
    <TutorialOverlay
      portal={portal}
      step={step}
      stepIndex={stepIndex}
      stepCount={steps.length}
      onNext={() => useTutorialStore.getState().next(steps.length)}
      onBack={() => useTutorialStore.getState().back()}
      onSkip={() => finish('skipped')}
    />
  );
}


function WelcomeCopy({ portal }: { portal: TutorialPortal }) {
  return (
    <Text className="text-center font-inter text-sm leading-5 text-muted">
      {portal === 'tenant'
        ? 'Find an apartment, apply, pay rent and message landlords, all in one place. Take a quick tour to see where everything is.'
        : 'List your properties, review applications and manage your tenants, all in one place. Take a quick tour to see where everything is.'}
    </Text>
  );
}

function DoneCopy() {
  return (
    <Text className="text-center font-inter text-sm leading-5 text-muted">
      You can replay this tour anytime from Settings → Tutorial.
    </Text>
  );
}
