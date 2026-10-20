import { fetchNotifications, registerPushToken } from './notificationService';

const mockRpc = jest.fn();
const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn(),
};

jest.mock('@repo/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: () => mockQuery,
  },
}));

describe('registerPushToken', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('registers by token without sending a caller-controlled user ID', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await registerPushToken('ExponentPushToken[device-token]', 'android');

    expect(mockRpc).toHaveBeenCalledWith('register_push_token', {
      p_token: 'ExponentPushToken[device-token]',
      p_platform: 'android',
    });
  });

  it('propagates registration errors', async () => {
    const error = { code: '42501', message: 'Authentication required' };
    mockRpc.mockResolvedValue({ error });

    await expect(registerPushToken('ExpoPushToken[device-token]', 'ios')).rejects.toEqual(error);
  });
});

it('bounds the feed with created_at DESC and a deterministic id ASC tie-breaker', async () => {
  mockQuery.order.mockClear();
  mockQuery.limit.mockResolvedValue({ data: [], error: null });
  await expect(fetchNotifications('user-1')).resolves.toEqual([]);
  expect(mockQuery.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
  expect(mockQuery.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
  expect(mockQuery.limit).toHaveBeenCalledWith(50);
});
