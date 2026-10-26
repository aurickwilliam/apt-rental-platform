/** Release rules for sideloaded Android builds, shared by the admin form and the mobile update prompt. The database repeats them. */
export const APP_RELEASE_PLATFORM = 'android' as const;
export const APP_RELEASE_NOTES_MAX_LENGTH = 1000;
export const APP_RELEASE_URL_MAX_LENGTH = 500;

export type AppUpdateStatus = 'up_to_date' | 'optional' | 'required';

export interface AppReleaseInput {
  latestVersion: string;
  minVersion: string;
  apkUrl: string;
  releaseNotes: string;
}

export type AppReleaseField = keyof AppReleaseInput;

const VERSION_PATTERN = /^(\d{1,4})\.(\d{1,4})\.(\d{1,4})$/;

export function parseAppVersion(version: string | null | undefined): [number, number, number] | null {
  const match = VERSION_PATTERN.exec((version ?? '').trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/** Negative when `a` is older, positive when newer, 0 when equal; null when either is not `major.minor.patch`. */
export function compareAppVersions(a: string, b: string): number | null {
  const left = parseAppVersion(a);
  const right = parseAppVersion(b);
  if (!left || !right) return null;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

/** Only an https link is ever opened on a user's device. */
export function isSecureDownloadUrl(value: string | null | undefined): boolean {
  const url = (value ?? '').trim();
  if (!url || url.length > APP_RELEASE_URL_MAX_LENGTH || /\s/.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Unparseable versions never block anyone: the prompt fails open. */
export function getAppUpdateStatus(
  currentVersion: string,
  release: { latestVersion: string; minVersion: string },
): AppUpdateStatus {
  const belowMinimum = compareAppVersions(currentVersion, release.minVersion);
  if (belowMinimum !== null && belowMinimum < 0) return 'required';
  const belowLatest = compareAppVersions(currentVersion, release.latestVersion);
  return belowLatest !== null && belowLatest < 0 ? 'optional' : 'up_to_date';
}

export function validateAppRelease(input: AppReleaseInput): Partial<Record<AppReleaseField, string>> {
  const errors: Partial<Record<AppReleaseField, string>> = {};
  const latest = parseAppVersion(input.latestVersion);
  const min = parseAppVersion(input.minVersion);

  if (!latest) errors.latestVersion = 'Use the format 1.2.3.';
  if (!min) errors.minVersion = 'Use the format 1.2.3.';
  if (latest && min && (compareAppVersions(input.minVersion, input.latestVersion) ?? 0) > 0) {
    errors.minVersion = 'The required version cannot be newer than the latest version.';
  }
  if (!isSecureDownloadUrl(input.apkUrl)) errors.apkUrl = 'Enter a full https:// download link.';
  if (input.releaseNotes.length > APP_RELEASE_NOTES_MAX_LENGTH) {
    errors.releaseNotes = `Keep the notes under ${APP_RELEASE_NOTES_MAX_LENGTH} characters.`;
  }
  return errors;
}
