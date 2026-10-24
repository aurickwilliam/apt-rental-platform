import { formatChatDayLabel, isSameChatDay } from './chatDay';

describe('chat day helpers', () => {
  it('treats timestamps on the same local day as one day', () => {
    const noon = new Date(2026, 9, 20, 12, 0, 0).toISOString();
    const evening = new Date(2026, 9, 20, 23, 59, 0).toISOString();
    const nextMorning = new Date(2026, 9, 21, 0, 1, 0).toISOString();
    expect(isSameChatDay(noon, evening)).toBe(true);
    expect(isSameChatDay(evening, nextMorning)).toBe(false);
  });

  it('formats the divider like "Oct 20, 2026"', () => {
    expect(formatChatDayLabel(new Date(2026, 9, 20, 12, 0, 0).toISOString())).toMatch(/Oct\s+20,\s+2026/);
  });
});
