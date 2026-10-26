import {
  compareAppVersions,
  getAppUpdateStatus,
  isSecureDownloadUrl,
  parseAppVersion,
  suggestNextAppVersion,
  validateAppRelease,
} from './appRelease';

describe('parseAppVersion', () => {
  it('reads major.minor.patch', () => {
    expect(parseAppVersion('1.2.3')).toEqual([1, 2, 3]);
    expect(parseAppVersion(' 10.0.12 ')).toEqual([10, 0, 12]);
  });

  it.each(['', '1.0', '1.0.0.0', 'v1.0.0', '1.0.x', '1.0.0-beta', null, undefined])('rejects %p', (value) => {
    expect(parseAppVersion(value)).toBeNull();
  });
});

describe('compareAppVersions', () => {
  it('compares numerically, not as text', () => {
    expect(compareAppVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareAppVersions('1.0.9', '1.0.10')).toBeLessThan(0);
    expect(compareAppVersions('2.0.0', '1.99.99')).toBeGreaterThan(0);
    expect(compareAppVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('returns null for an unparseable side', () => {
    expect(compareAppVersions('1.0', '1.0.0')).toBeNull();
  });
});

describe('getAppUpdateStatus', () => {
  const release = { latestVersion: '1.2.0', minVersion: '1.1.0' };

  it('requires an update below the minimum', () => {
    expect(getAppUpdateStatus('1.0.9', release)).toBe('required');
  });

  it('offers an update between the minimum and the latest', () => {
    expect(getAppUpdateStatus('1.1.0', release)).toBe('optional');
    expect(getAppUpdateStatus('1.1.9', release)).toBe('optional');
  });

  it('stays quiet on the latest or newer (a test build ahead of the release)', () => {
    expect(getAppUpdateStatus('1.2.0', release)).toBe('up_to_date');
    expect(getAppUpdateStatus('1.3.0', release)).toBe('up_to_date');
  });

  it('fails open when a version cannot be read', () => {
    expect(getAppUpdateStatus('dev', release)).toBe('up_to_date');
    expect(getAppUpdateStatus('1.0.0', { latestVersion: 'x', minVersion: 'y' })).toBe('up_to_date');
  });
});

describe('isSecureDownloadUrl', () => {
  it('accepts https links', () => {
    expect(isSecureDownloadUrl('https://github.com/owner/repo/releases/latest/download/apt.apk')).toBe(true);
  });

  it.each([
    '',
    'http://github.com/apt.apk',
    'javascript:alert(1)',
    'intent://download#Intent;end',
    'github.com/apt.apk',
    'https://localhost/apt.apk',
    'https://example.com/a b.apk',
  ])('rejects %p', (value) => {
    expect(isSecureDownloadUrl(value)).toBe(false);
  });
});

describe('validateAppRelease', () => {
  const valid = {
    latestVersion: '1.2.0',
    minVersion: '1.0.0',
    apkUrl: 'https://github.com/owner/repo/releases/latest/download/apt.apk',
    releaseNotes: 'Bug fixes.',
  };

  it('accepts a complete release', () => {
    expect(validateAppRelease(valid)).toEqual({});
  });

  it('reports each broken field', () => {
    expect(validateAppRelease({ ...valid, latestVersion: '1.2', apkUrl: 'nope' })).toEqual({
      latestVersion: expect.any(String),
      apkUrl: expect.any(String),
    });
  });

  it('refuses a required version newer than the latest', () => {
    expect(validateAppRelease({ ...valid, minVersion: '1.3.0' }).minVersion).toBeDefined();
  });

  it('caps the release notes', () => {
    expect(validateAppRelease({ ...valid, releaseNotes: 'x'.repeat(1001) }).releaseNotes).toBeDefined();
  });
});

describe('suggestNextAppVersion', () => {
  it('raises the patch number', () => {
    expect(suggestNextAppVersion('1.1.0')).toBe('1.1.1');
    expect(suggestNextAppVersion('2.0.9')).toBe('2.0.10');
  });

  it('returns null when the version cannot be read', () => {
    expect(suggestNextAppVersion('1.1')).toBeNull();
    expect(suggestNextAppVersion(null)).toBeNull();
  });
});
