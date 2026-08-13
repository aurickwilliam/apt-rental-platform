import { useEffect, useState } from 'react';

type UseCountdownOptions = {
  duration: number;
  enabled?: boolean;
};

export function useCountdown({ duration, enabled = true }: UseCountdownOptions) {
  const [countdown, setCountdown] = useState(duration);

  useEffect(() => {
    if (!enabled || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, enabled]);

  const reset = () => setCountdown(duration);

  return { countdown, reset };
}
