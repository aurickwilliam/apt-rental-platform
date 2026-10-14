import {
  getBlockStatus,
  markConversationRead,
  reportUser,
  setConversationPreference,
} from './conversationActionsService';

const mockRpc = jest.fn();

jest.mock('@repo/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

beforeEach(() => {
  mockRpc.mockReset();
  mockRpc.mockResolvedValue({ data: null, error: null });
});

describe('conversationActionsService', () => {
  it('sends only the changed preferences (others stay unchanged on the server)', async () => {
    await setConversationPreference({ otherUserId: 'u-2', apartmentId: null }, { muted: true });

    expect(mockRpc).toHaveBeenCalledWith('set_conversation_preference', {
      p_other_user_id: 'u-2',
      p_apartment_id: null,
      p_pinned: undefined,
      p_archived: undefined,
      p_muted: true,
      p_marked_unread: undefined,
    });
  });

  it('marks a conversation read through the caller-bound RPC', async () => {
    await markConversationRead({ otherUserId: 'u-2', apartmentId: 'apt-1' });

    expect(mockRpc).toHaveBeenCalledWith('mark_conversation_read', {
      p_other_user_id: 'u-2',
      p_apartment_id: 'apt-1',
    });
  });

  it('trims report details and omits empty ones', async () => {
    await reportUser({
      target: { otherUserId: 'u-2', apartmentId: 'apt-1' },
      reason: 'spam',
      details: '   ',
    });

    expect(mockRpc).toHaveBeenCalledWith('report_user', {
      p_reported_user_id: 'u-2',
      p_apartment_id: 'apt-1',
      p_reason: 'spam',
      p_details: undefined,
    });
  });

  it('surfaces database errors as-is', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'You already reported this person. Our team is reviewing it.' },
    });

    await expect(
      reportUser({ target: { otherUserId: 'u-2', apartmentId: null }, reason: 'other', details: 'x' })
    ).rejects.toMatchObject({ message: 'You already reported this person. Our team is reviewing it.' });
  });

  it('reads block status in both directions', async () => {
    mockRpc.mockResolvedValueOnce({ data: [{ blocked_by_me: false, blocked_me: true }], error: null });

    await expect(getBlockStatus('u-2')).resolves.toEqual({ blockedByMe: false, blockedMe: true });
  });
});
