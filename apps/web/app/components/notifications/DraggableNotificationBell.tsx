"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { IconBell } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useNotificationDisplayPreferences } from "@/hooks/use-notification-display-preferences";
import { useNotifications } from "@/hooks/use-notifications";
import { useHydrated } from "@/hooks/use-hydrated";
import type { ActivePortal } from "@/lib/notification-audience";
import {
  defaultFabPlacement,
  FAB_DRAG_THRESHOLD_PX,
  loadFabPlacement,
  saveFabPlacement,
  snapSideForRelease,
  type FabPlacement,
} from "@/lib/notification-fab-position";
import { FAB_EDGE_MARGIN_PX, FAB_SIZE_PX } from "@/lib/notification-fab-safe-area";

import { NOTIFICATIONS_QUERY_VALUE } from "./NotificationsOverlay";
import { useFabSafePlacement } from "./use-fab-safe-placement";
import { Button, Tooltip } from "@heroui/react";

export const FAB_PLACEMENT_RESET_EVENT = "apt-notifications-fab:reset";

function readSidebarWidth(): number {
  if (typeof document === "undefined") return 0;
  const aside = document.querySelector("aside");
  return aside ? aside.getBoundingClientRect().width : 0;
}

const SIDEBAR_TOGGLE_EVENTS = [
  "tenant-sidebar-collapsed-change",
  "landlord-sidebar-collapsed-change",
  "admin-sidebar-collapsed-change",
] as const;

/** Sidebar width (+ margin) as external store: resizes and expand/collapse
 *  toggles resubscribe through here instead of effects setting state. */
function subscribeSidebarWidth(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  window.addEventListener("storage", onChange);
  for (const name of SIDEBAR_TOGGLE_EVENTS) window.addEventListener(name, onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("storage", onChange);
    for (const name of SIDEBAR_TOGGLE_EVENTS) window.removeEventListener(name, onChange);
  };
}

function getSidebarOffset(): number {
  return readSidebarWidth() + FAB_EDGE_MARGIN_PX;
}

function clampTop(topPx: number, viewportHeight: number): number {
  const min = FAB_EDGE_MARGIN_PX;
  const max = Math.max(min, viewportHeight - FAB_EDGE_MARGIN_PX - FAB_SIZE_PX);
  return Math.min(max, Math.max(min, topPx));
}

/**
 * The in-flight drag gesture. One record holds everything a cleanup has to
 * clear — the captured pointer id, the press and drag origins, and whether the
 * press became a drag — so interruption handling never depends on stale React
 * state (a blur or a capture loss can arrive long after the render that
 * started the drag).
 */
interface DragGesture {
  pointerId: number;
  /** Pointer position where the press started. */
  startX: number;
  startY: number;
  /** Button position when the press started (the drag origin). */
  baseX: number;
  baseY: number;
  /** True once the pointer travelled past `FAB_DRAG_THRESHOLD_PX`. */
  dragging: boolean;
}

/**
 * Draggable floating notifications bell (desktop only; the mobile menu
 * entry remains the touch entry point on phones). Hidden when Settings picks
 * the sidebar tab as the entry point. Pointer Events cover
 * mouse, touch, and pen with no extra dependency.
 *
 * Press-and-release opens the drawer; moving past a small threshold turns
 * the gesture into a drag, and release snaps to the nearest content edge.
 * Placement persists in a versioned localStorage key shared by both portals
 * and is never rewritten by the automatic nudge: at rest the saved anchor is
 * re-resolved against the controls marked `data-fab-clearance`, so the bell
 * slides clear of the messages composer, conversation header, contact list,
 * payment footer, or filter rail on the route that has them.
 *
 * Routes that mark a `data-fab-dock` surface — the messages conversation
 * header — pin the bell inside that surface instead: the saved anchor is
 * ignored there and the bell is not draggable, so it can never end up over
 * the message thread.
 *
 * Dragging is interruption-safe. The gesture record is the single source of
 * truth for the pointer id, the drag origins, and the drag flag, and every way
 * a gesture can end — pointer release, `pointercancel`, `lostpointercapture`,
 * window blur, the tab going hidden, a button-less pointer move, a fresh
 * press, or unmount — funnels through one `finishGesture` cleanup. An
 * interruption cancels the drag (nothing is persisted, the bell returns to its
 * saved slot) and swallows the click it would otherwise become, so the bell
 * can never stay stuck to the cursor or open the drawer by accident.
 *
 * Fetching and realtime stay in `useNotifications` — this wrapper owns only
 * coordinates.
 */
export default function DraggableNotificationBell({
  activePortal,
}: {
  activePortal: ActivePortal;
}) {
  const { t } = useTranslation();
  const { unreadCount } = useNotifications(activePortal);
  const { preferences: displayPreferences } = useNotificationDisplayPreferences();

  // Browser-only geometry (viewport size, sidebar width) differs from the
  // server render, so hold the button until after hydration — otherwise the
  // first client paint mismatches the SSR HTML. A fixed overlay reserves
  // no layout space, so gating it changes nothing visually.
  const hydrated = useHydrated();

  const [placement, setPlacement] = useState<FabPlacement>(() =>
    typeof window === "undefined"
      ? defaultFabPlacement()
      : loadFabPlacement(window.localStorage),
  );
  const [livePos, setLivePos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // External store (repo convention for browser-only values): resizes and
  // sidebar toggles re-render with a fresh offset, never via effects.
  const leftBound = useSyncExternalStore(
    subscribeSidebarWidth,
    getSidebarOffset,
    () => FAB_EDGE_MARGIN_PX,
  );
  // Resting slot: a `data-fab-dock` surface (the messages header) wins and
  // pins the bell there; otherwise the saved anchor, nudged clear of every
  // control marked `data-fab-clearance` (re-checked on resize, sidebar
  // collapse, scroll, and navigation).
  const resting = useFabSafePlacement(placement, leftBound);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const gestureRef = useRef<DragGesture | null>(null);
  const suppressClickRef = useRef(false);

  // Re-resolve the placement whenever another surface — e.g. the drawer's
  // reset action — broadcasts a reset. The mount-time value already came
  // from the state initializer above, so this only subscribes.
  useEffect(() => {
    const onReset = () => setPlacement(defaultFabPlacement());
    window.addEventListener(FAB_PLACEMENT_RESET_EVENT, onReset);
    return () => window.removeEventListener(FAB_PLACEMENT_RESET_EVENT, onReset);
  }, []);

  const openDrawer = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("notifications", NOTIFICATIONS_QUERY_VALUE);
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const resetPlacement = useCallback(() => {
    const next = defaultFabPlacement();
    setPlacement(next);
    saveFabPlacement(next, window.localStorage);
  }, []);

  /**
   * Drops the active gesture and releases its pointer capture. Idempotent, and
   * the ref is cleared *before* the release, so a `lostpointercapture` fired
   * by the release itself (or by the browser right after it) re-enters as a
   * no-op instead of recursing. On unmount the button may already be detached,
   * in which case the browser releases the capture with the element.
   */
  const detachGesture = useCallback((): DragGesture | null => {
    const gesture = gestureRef.current;
    if (!gesture) return null;
    gestureRef.current = null;
    try {
      buttonRef.current?.releasePointerCapture(gesture.pointerId);
    } catch {
      // Capture already released (or the pointer is gone): nothing to undo.
    }
    return gesture;
  }, []);

  /**
   * The single exit for every way a gesture can end: pointer release, pointer
   * cancel, lost capture, window blur, the tab going hidden, a button-less
   * move, a fresh press, or unmount. Clearing the pointer id, the capture, the
   * drag flag, and the live frame in one place is what keeps an interrupted
   * drag from leaving any of them behind.
   *
   * "release" keeps a real drag: it snaps the drop point to the nearest safe
   * edge and persists it. "cancel" restores the last saved placement instead —
   * nothing is written — and swallows the click the interruption would
   * otherwise become, so an interrupted drag can never open the drawer.
   */
  const finishGesture = useCallback(
    (
      outcome: "release" | "cancel",
      options: { point?: { x: number; y: number } } = {},
    ): void => {
      const gesture = detachGesture();
      if (!gesture) return;
      setLivePos(null);
      setDragging(false);
      if (outcome === "cancel") {
        suppressClickRef.current = true;
        return;
      }
      const point = options.point;
      if (!gesture.dragging || !point) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const next: FabPlacement = {
        side: snapSideForRelease(point.x, vw, placement.side),
        topRatio: Math.min(
          0.95,
          Math.max(0.05, (clampTop(point.y - FAB_SIZE_PX / 2, vh) + FAB_SIZE_PX / 2) / Math.max(1, vh)),
        ),
      };
      setPlacement(next);
      saveFabPlacement(next, window.localStorage);
      suppressClickRef.current = true;
    },
    [detachGesture, placement.side],
  );

  /**
   * Interruption guards. They stay attached for the component's life and are
   * no-ops without an active gesture, so there are no per-drag listeners to
   * add or to forget to remove. The cleanup cancels a gesture that is still in
   * flight when the bell unmounts (portal switch, sign-out, layout swap) —
   * unmounting a captured element fires `blur` on the button itself, which the
   * window listener never sees.
   */
  useEffect(() => {
    const cancelDrag = () => finishGesture("cancel");
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") cancelDrag();
    };
    window.addEventListener("blur", cancelDrag);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", cancelDrag);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      cancelDrag();
    };
  }, [finishGesture]);

  /** The active gesture when the event belongs to its pointer, else null. */
  const gestureForPointer = (event: React.PointerEvent<HTMLButtonElement>): DragGesture | null => {
    const gesture = gestureRef.current;
    return gesture && gesture.pointerId === event.pointerId ? gesture : null;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    // Leave any gesture the browser never reported an end for behind (focus
    // taken by another application, capture dropped) before starting a new one.
    finishGesture("cancel");
    // A fresh press also makes the previous gesture's click guard obsolete:
    // only the click that belongs to an *interrupted* gesture is swallowed.
    suppressClickRef.current = false;
    // A docked bell is pinned (messages header): press-and-release stays a
    // plain click instead of starting a drag that would snap straight back.
    if (resting.docked) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: rect?.left ?? event.clientX,
      baseY: rect?.top ?? event.clientY,
      dragging: false,
    };
    buttonRef.current?.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureForPointer(event);
    if (!gesture) return;
    // A mouse move with the button up means the gesture is over: the browser
    // kept delivering it after an interruption it never reported (the pointer
    // was released over another application, or the capture was re-attached).
    // Dragging on it would detach the bell from the cursor, so this cancels.
    if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
      finishGesture("cancel");
      return;
    }
    const moved = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (!gesture.dragging && moved < FAB_DRAG_THRESHOLD_PX) return;
    if (!gesture.dragging) {
      gesture.dragging = true;
      setDragging(true);
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setLivePos({
      x: Math.min(Math.max(gesture.baseX + (event.clientX - gesture.startX), 0), Math.max(0, vw - FAB_SIZE_PX)),
      y: clampTop(gesture.baseY + (event.clientY - gesture.startY), vh),
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!gestureForPointer(event)) return;
    finishGesture("release", { point: { x: event.clientX, y: event.clientY } });
  };

  const onPointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!gestureForPointer(event)) return;
    finishGesture("cancel");
  };

  // The browser drops the capture when it discovers the pointer is no longer
  // down (focus change, release elsewhere). Without this the gesture would stay
  // attached to a pointer that no longer exists.
  const onLostPointerCapture = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!gestureForPointer(event)) return;
    finishGesture("cancel");
  };

  const onClick = (event: React.MouseEvent<Element>) => {
    // A click left over from an interrupted gesture must not open the drawer.
    // `detail` is 0 for keyboard activation, which always opens.
    if (suppressClickRef.current && event.detail > 0) {
      suppressClickRef.current = false;
      return;
    }
    openDrawer();
  };

  // The Settings choice of a sidebar tab replaces the floating bell.
  if (!hydrated || displayPreferences.entry !== "bell") return null;

  // The pointer position wins mid-drag; at rest the resolved slot is used,
  // so a collision (e.g. dropping the bell on the Send button) settles on
  // the nearest clear edge spot instead of covering the control. A docked
  // bell rests inside the messages header and never starts a drag.
  const top = livePos !== null ? livePos.y : resting.topPx;
  const left = livePos !== null ? livePos.x : resting.leftPx;
  const bellTitle = resting.docked
    ? t("notifications.bell.title")
    : t("notifications.bell.titleHint");
  const bellLabel = `${
    unreadCount > 0
      ? t("notifications.bell.ariaUnread", { count: unreadCount })
      : t("notifications.bell.aria")
  }.${resting.docked ? "" : ` ${t("notifications.bell.dragHint")}`}`;
  const interactionClasses = resting.docked
    ? "cursor-pointer hover:bg-primary/5 hover:text-primary active:bg-primary/10"
    : dragging
      ? "cursor-grabbing"
      : "cursor-grab hover:bg-primary/5 hover:text-primary active:bg-primary/10";

  return (
    <Tooltip isDisabled={dragging}>
      <Tooltip.Trigger>
        <Button
          variant="ghost"
          ref={buttonRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onLostPointerCapture}
          onClick={onClick}
          onDoubleClick={resting.docked ? undefined : resetPlacement}
          aria-haspopup="dialog"
          aria-label={bellLabel}
          style={{ top, left }}
          className={`button--bare fixed z-40 hidden min-h-11 min-w-11 select-none items-center justify-center rounded-full border border-border bg-card/95 text-foreground/70 shadow-sm backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:flex ${resting.docked ? "" : "touch-none"} ${interactionClasses} motion-safe:transition-[top,left] motion-safe:duration-200 ${livePos !== null ? "motion-safe:transition-none" : ""}`}
        >
          <IconBell size={20} aria-hidden="true" className="pointer-events-none" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>{bellTitle}</Tooltip.Content>
    </Tooltip>
  );
}
