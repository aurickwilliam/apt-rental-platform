/** Fields shared by the web/mobile notification feeds. Read state is not a sort key. */
export interface ChronologicalNotification {
  id: string;
  created_at: string;
}

/** PostgreSQL retains fractions beyond JS Date's millisecond precision. */
function subMillisecondFraction(timestamp: string): string {
  return (timestamp.match(/\.(\d+)/)?.[1] ?? "").slice(3).padEnd(6, "0");
}

/** created_at DESC, id ASC, matching both feeds' query order. */
export function compareNotificationsNewestFirst(
  a: ChronologicalNotification,
  b: ChronologicalNotification,
): number {
  const aTime = Date.parse(a.created_at);
  const bTime = Date.parse(b.created_at);
  if (aTime !== bTime) return bTime - aTime;

  const aFraction = subMillisecondFraction(a.created_at);
  const bFraction = subMillisecondFraction(b.created_at);
  if (aFraction !== bFraction) return aFraction < bFraction ? 1 : -1;

  return a.id === b.id ? 0 : a.id < b.id ? -1 : 1;
}

/** Copy first: never reorder a query cache or optimistic-update input in place. */
export function sortNotificationsNewestFirst<T extends ChronologicalNotification>(
  notifications: readonly T[],
): T[] {
  return [...notifications].sort(compareNotificationsNewestFirst);
}

export interface NotificationDateGroup<T> {
  key: string;
  label: string;
  dayStart: number;
  items: T[];
}

function startOfLocalDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

/** Local calendar buckets, independently sorted by date (never by display label). */
export function groupNotificationsByLocalDate<T extends ChronologicalNotification>(
  notifications: readonly T[],
  now = new Date(),
): NotificationDateGroup<T>[] {
  const today = startOfLocalDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const buckets = new Map<number, NotificationDateGroup<T>>();
  for (const notification of sortNotificationsNewestFirst(notifications)) {
    const day = startOfLocalDay(new Date(notification.created_at));
    const dayStart = day.getTime();
    let group = buckets.get(dayStart);
    if (!group) {
      group = {
        key: `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`,
        dayStart,
        label: dayStart === today.getTime()
          ? "Today"
          : dayStart === yesterday.getTime()
            ? "Yesterday"
            : day.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: day.getFullYear() === today.getFullYear() ? undefined : "numeric",
              }),
        items: [],
      };
      buckets.set(dayStart, group);
    }
    group.items.push(notification);
  }

  return [...buckets.values()].sort((a, b) => b.dayStart - a.dayStart);
}
