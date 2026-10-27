import { formatRevealTime } from './timestampReveal';

describe('formatRevealTime', () => {
  it('formats the send time as a clock time', () => {
    const createdAt = '2026-10-14T08:39:00.000Z';
    expect(formatRevealTime(createdAt)).toBe(
      new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    );
  });

  it('shows nothing for a missing or invalid time', () => {
    expect(formatRevealTime(undefined)).toBe('');
    expect(formatRevealTime('not a date')).toBe('');
  });
});
