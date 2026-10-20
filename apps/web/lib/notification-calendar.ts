/** Numeric snapshot stays stable until the browser's local calendar day changes. */
export function getLocalCalendarDay(): number {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day.getTime();
}

/** Re-label an open drawer at midnight and after a backgrounded tab resumes. */
export function subscribeLocalCalendarDay(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    clearTimeout(timer);
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    timer = setTimeout(update, midnight.getTime() - now.getTime());
  };
  const update = () => {
    onChange();
    schedule();
  };

  schedule();
  window.addEventListener("focus", update);
  document.addEventListener("visibilitychange", update);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("focus", update);
    document.removeEventListener("visibilitychange", update);
  };
}
