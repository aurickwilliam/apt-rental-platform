export function formatTime(time: string | Date): string {
  let hour: number;
  let minute: string;

  if (time instanceof Date) {
    hour = time.getHours();
    minute = String(time.getMinutes()).padStart(2, "0");
  } else if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
    // plain wall-clock time, e.g. "17:00" or "17:00:00" — no date/timezone attached
    const [hourStr, minuteStr] = time.split(":");
    hour = parseInt(hourStr, 10);
    minute = minuteStr;
  } else {
    // full timestamp (timestamptz/ISO string) — convert to local device time
    const d = new Date(time);
    hour = d.getHours();
    minute = String(d.getMinutes()).padStart(2, "0");
  }

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}
