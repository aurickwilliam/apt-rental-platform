import { useRef, useCallback } from 'react';

const TYPING_IDLE_DELAY = 2000; // ms of inactivity before stopping
const TYPING_HEARTBEAT = 4000; // ms between presence re-tracks

type Options = {
  onStartTyping: () => void;
  onStopTyping: () => void;
  onHeartbeat: () => void;
};

export function useChatTyping({ onStartTyping, onStopTyping, onHeartbeat }: Options) {
  const isTypingRef = useRef(false);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();

    if (isTypingRef.current) {
      onStopTyping();
      isTypingRef.current = false;
    }
  }, [clearTimers, onStopTyping]);

  const onTextChange = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onStartTyping();

      if (!heartbeatRef.current) {
        heartbeatRef.current = setInterval(onHeartbeat, TYPING_HEARTBEAT);
      }
    }

    // Reset idle timer on each keystroke
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    stopTimeoutRef.current = setTimeout(stop, TYPING_IDLE_DELAY);
  }, [onHeartbeat, onStartTyping, stop]);

  const cleanup = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  return { onTextChange, stop, cleanup };
}