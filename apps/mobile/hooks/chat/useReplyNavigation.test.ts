import { locateReplyMessage, replyLookupNoticeText } from './useReplyNavigation';

const base = () => ({ afterRender: async () => {}, isCancelled: () => false });

describe('locateReplyMessage', () => {
  it('finds a message that is already loaded without loading history', async () => {
    const loadOlder = jest.fn();
    const result = await locateReplyMessage({ ...base(), findIndex: () => 3, hasMore: () => true, loadOlder });
    expect(result).toEqual({ status: 'found', index: 3 });
    expect(loadOlder).not.toHaveBeenCalled();
  });

  it('loads older pages until the original appears', async () => {
    let loaded = 0;
    const loadOlder = jest.fn(async () => ({ hasMore: true, loaded: ++loaded }));
    const result = await locateReplyMessage({
      ...base(),
      findIndex: () => (loaded >= 2 ? 41 : -1),
      hasMore: () => true,
      loadOlder,
    });
    expect(result).toEqual({ status: 'found', index: 41 });
    expect(loadOlder).toHaveBeenCalledTimes(2);
  });

  it('reports unavailable when history runs out, and a limit after five pages', async () => {
    const exhausted = await locateReplyMessage({
      ...base(),
      findIndex: () => -1,
      hasMore: () => true,
      loadOlder: async () => ({ hasMore: false }),
    });
    expect(exhausted).toEqual({ status: 'unavailable' });

    const loadOlder = jest.fn(async () => ({ hasMore: true }));
    const limited = await locateReplyMessage({ ...base(), findIndex: () => -1, hasMore: () => true, loadOlder });
    expect(limited).toEqual({ status: 'limit' });
    expect(loadOlder).toHaveBeenCalledTimes(5);
  });

  it('stops on a failed load or a cancelled lookup', async () => {
    const failed = await locateReplyMessage({ ...base(), findIndex: () => -1, hasMore: () => true, loadOlder: async () => null });
    expect(failed).toEqual({ status: 'error' });

    const cancelled = await locateReplyMessage({
      ...base(),
      isCancelled: () => true,
      findIndex: () => -1,
      hasMore: () => true,
      loadOlder: async () => ({ hasMore: true }),
    });
    expect(cancelled).toEqual({ status: 'cancelled' });
  });

  it('words each failure for the user', () => {
    expect(replyLookupNoticeText('unavailable')).toBe('Original message unavailable.');
    expect(replyLookupNoticeText('limit')).toMatch(/farther back/);
    expect(replyLookupNoticeText('error')).toMatch(/try again/);
  });
});
