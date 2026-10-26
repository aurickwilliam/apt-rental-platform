const UPDATE_ID_PREFIX_LENGTH = 8;

interface RunningBuild {
  isEnabled: boolean;
  isEmbeddedLaunch: boolean;
  updateId: string | null;
  channel: string | null;
}

/** One line for the About screen, so you can tell which code a phone is running. Null where updates are off (development). */
export function describeRunningBuild({ isEnabled, isEmbeddedLaunch, updateId, channel }: RunningBuild): string | null {
  if (!isEnabled) return null;
  const channelLabel = channel ? ` · ${channel}` : "";
  if (isEmbeddedLaunch || !updateId) return `Built-in code${channelLabel}`;
  return `Update ${updateId.slice(0, UPDATE_ID_PREFIX_LENGTH)}${channelLabel}`;
}
