import {
  AVA_MAX_SAVED_CHATS,
  avaChatTitle,
  groupAvaChatsByAge,
  parseSavedAvaChats,
  removeAvaChat,
  upsertAvaChat,
  type AvaSavedChat,
} from './avaHistory';

const chat = (id: string, updatedAt: number): AvaSavedChat => ({
  id,
  title: id,
  updatedAt,
  messages: [{ id: 'm', role: 'user', text: 'hello' }],
});

describe('avaChatTitle', () => {
  it('uses the first question, shortened', () => {
    expect(avaChatTitle([{ role: 'assistant', text: 'Hi' }, { role: 'user', text: '  2BR   in Malabon ' }])).toBe('2BR in Malabon');
    expect(avaChatTitle([{ role: 'user', text: 'a'.repeat(80) }]).length).toBeLessThanOrEqual(48);
    expect(avaChatTitle([])).toBe('New chat');
  });
});

describe('upsert and remove', () => {
  it('keeps the newest first, replaces a copy and caps the list', () => {
    let chats: AvaSavedChat[] = [];
    for (let i = 0; i < AVA_MAX_SAVED_CHATS + 5; i += 1) chats = upsertAvaChat(chats, chat(`c${i}`, i));
    expect(chats).toHaveLength(AVA_MAX_SAVED_CHATS);
    expect(chats[0].id).toBe(`c${AVA_MAX_SAVED_CHATS + 4}`);

    const replaced = upsertAvaChat(chats, { ...chat('c10', 9999), title: 'renamed' });
    expect(replaced[0]).toMatchObject({ id: 'c10', title: 'renamed' });
    expect(replaced.filter((item) => item.id === 'c10')).toHaveLength(1);
    expect(removeAvaChat(replaced, 'c10').some((item) => item.id === 'c10')).toBe(false);
  });
});

describe('parseSavedAvaChats', () => {
  it('drops malformed data and sanitizes the remembered search', () => {
    const parsed = parseSavedAvaChats([
      'nope',
      { id: 1 },
      { id: 'empty', updatedAt: 1, messages: [] },
      {
        id: 'ok',
        updatedAt: 5,
        messages: [
          { id: 'a', role: 'user', text: 'hi' },
          { id: 'b', role: 'bot', text: 'bad role' },
          {
            id: 'c',
            role: 'assistant',
            text: 'here',
            listingIds: ['x'],
            search: { filters: { cities: ['Malabon', 'Atlantis'], priceMax: 8000 }, landmarkKey: 'monumento' },
          },
        ],
      },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].messages).toHaveLength(2);
    expect(parsed[0].title).toBe('hi');
    expect(parsed[0].messages[1].search?.filters.cities).toEqual(['Malabon']);
    expect(parseSavedAvaChats(null)).toEqual([]);
  });
});

describe('groupAvaChatsByAge', () => {
  it('groups by today, last 7 days and older', () => {
    const now = new Date(2026, 10, 6, 15).getTime();
    const day = 24 * 60 * 60 * 1000;
    const groups = groupAvaChatsByAge([chat('a', now - 1000), chat('b', now - 3 * day), chat('c', now - 20 * day)], now);
    expect(groups.map((group) => [group.label, group.chats.map((item) => item.id)])).toEqual([
      ['today', ['a']],
      ['week', ['b']],
      ['older', ['c']],
    ]);
  });
});
