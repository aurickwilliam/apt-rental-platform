import { registerPushToken } from './notificationService';

const mockRpc = jest.fn();

jest.mock('@repo/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
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
