"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconCircleCheck, IconSparkles } from "@tabler/icons-react";
import { Button, Modal } from "@heroui/react";

import {
  getTutorialSteps,
  shouldAutoStartTutorial,
  type TutorialPortal,
} from "@repo/utils";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useTutorialReplayRequest } from "@/lib/tutorial-controller";
import {
  fetchTutorialState,
  saveTutorialOutcome,
  type TutorialOutcome,
  type TutorialState,
} from "@/service/tutorialService";

import TutorialStepLayer from "./TutorialStepLayer";

type Stage = "welcome" | "steps" | "done";
interface Session {
  mode: "auto" | "replay";
  stage: Stage;
  stepIndex: number;
}

const AUTO_START_DELAY_MS = 800;

const WELCOME_COPY: Record<TutorialPortal, string> = {
  tenant:
    "Find an apartment, apply, pay rent and message landlords, all in one place. Take a quick tour to see where everything is.",
  landlord:
    "List your properties, review applications and manage your tenants, all in one place. Take a quick tour to see where everything is.",
};

interface TutorialTourProps {
  portal: TutorialPortal;
  /** Internal `users.id` of the signed-in account (known to the portal layout). */
  profileId: string;
  accountStatus: string | null;
}

/**
 * Mounted in each portal layout. Starts the portal's tour once for a new
 * account (progress is saved per profile and portal, shared with mobile) and
 * replays it when Settings → Tutorial asks. The tour only highlights links;
 * it never navigates, and it writes only the final outcome.
 */
export default function TutorialTour({ portal, profileId, accountStatus }: TutorialTourProps) {
  const load = useCallback(() => fetchTutorialState(profileId, portal), [profileId, portal]);
  const { data, loading, error, setData } = useAsyncResource<TutorialState | null>(
    load,
    null,
    "Could not load the tutorial.",
  );

  const steps = useMemo(
    () =>
      getTutorialSteps(portal, {
        platform: "web",
        accountStatus,
        hasActiveTenancy: data?.hasActiveTenancy ?? false,
      }),
    [portal, accountStatus, data?.hasActiveTenancy],
  );

  const [session, setSession] = useState<Session | null>(null);

  // Settings → Tutorial: compare with the previous request during render.
  const replay = useTutorialReplayRequest();
  const [handledReplayId, setHandledReplayId] = useState(replay?.id ?? 0);
  if (replay && replay.id !== handledReplayId) {
    setHandledReplayId(replay.id);
    if (replay.portal === portal) setSession({ mode: "replay", stage: "welcome", stepIndex: 0 });
  }

  const autoStarted = useRef(false);
  const shouldStart =
    !loading &&
    !error &&
    data !== null &&
    shouldAutoStartTutorial({
      portal,
      roles: [portal],
      progressLoaded: true,
      progress: data.progress,
      profileComplete: true,
      suspended: false,
      stepCount: steps.length,
    });

  useEffect(() => {
    if (!shouldStart || session || autoStarted.current) return;
    const timer = setTimeout(() => {
      autoStarted.current = true;
      setSession({ mode: "auto", stage: "welcome", stepIndex: 0 });
    }, AUTO_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldStart, session]);

  const finish = (outcome: TutorialOutcome) => {
    const mode = session?.mode;
    setSession(null);
    // Skipping a replay leaves what is saved untouched.
    if (mode !== "auto" && outcome === "skipped") return;
    void saveTutorialOutcome(profileId, portal, outcome)
      .then((progress) =>
        setData((current) => ({ hasActiveTenancy: current?.hasActiveTenancy ?? false, progress })),
      )
      .catch((saveError: unknown) => {
        console.error("Could not save tutorial progress", saveError);
      });
  };

  if (!session || steps.length === 0) return null;

  if (session.stage === "welcome" || session.stage === "done") {
    const isWelcome = session.stage === "welcome";
    return (
      <Modal
        isOpen
        onOpenChange={(open) => {
          if (!open) finish(isWelcome ? "skipped" : "completed");
        }}
      >
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="rounded-3xl bg-card p-6 text-center">
              <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                {isWelcome ? <IconSparkles size={40} aria-hidden="true" /> : <IconCircleCheck size={40} aria-hidden="true" />}
              </span>
              <Modal.Heading className="mt-4 font-nunito text-2xl font-bold text-foreground">
                {isWelcome ? "Welcome to APT" : "You're all set"}
              </Modal.Heading>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isWelcome
                  ? WELCOME_COPY[portal]
                  : "You can replay this tour anytime from Settings → Tutorial."}
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {isWelcome ? (
                  <>
                    <Button
                      variant="primary"
                      className="min-h-11 cursor-pointer"
                      onPress={() => setSession({ ...session, stage: "steps", stepIndex: 0 })}
                    >
                      Start Tutorial
                    </Button>
                    <Button variant="outline" className="min-h-11 cursor-pointer" onPress={() => finish("skipped")}>
                      Skip
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" className="min-h-11 cursor-pointer" onPress={() => finish("completed")}>
                    Get started
                  </Button>
                )}
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    );
  }

  const step = steps[Math.min(session.stepIndex, steps.length - 1)];
  return (
    <TutorialStepLayer
      key={step.id}
      step={step}
      stepIndex={session.stepIndex}
      stepCount={steps.length}
      onBack={() => setSession({ ...session, stepIndex: Math.max(0, session.stepIndex - 1) })}
      onNext={() =>
        session.stepIndex + 1 >= steps.length
          ? setSession({ ...session, stage: "done" })
          : setSession({ ...session, stepIndex: session.stepIndex + 1 })
      }
      onSkip={() => finish("skipped")}
    />
  );
}
