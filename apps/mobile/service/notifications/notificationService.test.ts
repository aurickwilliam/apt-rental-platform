import {
  clearApartmentOwnerCache,
  fetchPortalNotifications,
  markNotificationsRead,
  registerPushToken,
  resolveNotificationAudiences,
  type NotificationItem,
} from './notificationService';

const USER = '11111111-1111-4111-8111-111111111111';
const PEER = '22222222-2222-4222-8222-222222222222';
const APARTMENT = '33333333-3333-4333-8333-333333333333';

const mockRpc = jest.fn();
let notificationPages: NotificationItem[][] = [];
let notificationCall = 0;
let apartmentRows: { id: string; landlord_id: string | null }[] = [];
let apartmentError: unknown = null;
const mockIn = jest.fn();
const mockOr = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockUpdate = jest.fn();

// A thenable builder, like PostgREST's: every step returns it and awaiting it runs the query.
function mockNotificationQuery() {
  const query: Record<string, unknown> = {
    select: () => query,
    eq: () => query,
    order: (...args: unknown[]) => { mockOrder(...args); return query; },
    limit: (...args: unknown[]) => { mockLimit(...args); return query; },
    or: (...args: unknown[]) => { mockOr(...args); return query; },
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: notificationPages[notificationCall++] ?? [], error: null }),
  };
  return query;
}

function mockApartmentsQuery() {
  const query: Record<string, unknown> = {
    select: () => query,
    in: (...args: unknown[]) => { mockIn(...args); return query; },
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: apartmentRows, error: apartmentError }),
  };
  return query;
}

jest.mock('@repo/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (table: string) => {
      if (table === 'apartments') return mockApartmentsQuery();
      return {
        ...mockNotificationQuery(),
        update: (...args: unknown[]) => {
          mockUpdate(...args);
          return { in: (...inArgs: unknown[]) => { mockIn(...inArgs); return Promise.resolve({ error: null }); } };
        },
      };
    },
  },
}));

function notification(id: string, title: string, screen: string, created = '2026-11-02T08:00:00+00:00'): NotificationItem {
  return {
    id,
    user_id: USER,
    type: 'payment',
    title,
    message: '',
    data: { screen },
    is_read: false,
    created_at: created,
  } as NotificationItem;
}

const landlordRows = (count: number, prefix = 'l') =>
  Array.from({ length: count }, (_, i) =>
    notification(`${prefix}${i}`, 'Payment Received', 'payments', `2026-11-02T08:${String(59 - (i % 60)).padStart(2, '0')}:00+00:00`));

function chat(id: string): NotificationItem {
  return {
    id,
    user_id: USER,
    type: 'message',
    title: 'Juan',
    message: '',
    data: { screen: 'chat', senderId: PEER, apartmentId: APARTMENT },
    is_read: false,
    created_at: '2026-11-02T08:00:00+00:00',
  } as NotificationItem;
}

beforeEach(() => {
  jest.clearAllMocks();
  notificationPages = [];
  notificationCall = 0;
  apartmentRows = [];
  apartmentError = null;
  clearApartmentOwnerCache();
});

describe('registerPushToken', () => {
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

describe('fetchPortalNotifications', () => {
  it('bounds each page with created_at DESC and a deterministic id ASC tie-breaker', async () => {
    notificationPages = [[]];

    await expect(fetchPortalNotifications(USER, 'tenant')).resolves.toEqual([]);

    expect(mockOrder).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
    expect(mockOrder).toHaveBeenNthCalledWith(2, 'id', { ascending: true });
    expect(mockLimit).toHaveBeenCalledWith(50);
    expect(mockOr).not.toHaveBeenCalled();
  });

  it("keeps reading pages until the portal's own rows fill, so the other portal cannot crowd them out", async () => {
    const tenantRows = [
      notification('t1', 'Payment Successful', 'payments'),
      notification('t2', 'Maintenance Resolved', 'maintenance'),
    ];
    notificationPages = [landlordRows(50), tenantRows];

    const result = await fetchPortalNotifications(USER, 'tenant');

    expect(result.map((n) => n.id)).toEqual(['t1', 't2']);
    expect(mockLimit).toHaveBeenCalledTimes(2);
    // The second page starts strictly after the last row of the first.
    const last = notificationPages[0][49];
    expect(mockOr).toHaveBeenCalledWith(
      `created_at.lt.${last.created_at},and(created_at.eq.${last.created_at},id.gt.${last.id})`,
    );
  });

  it('stops at a short page without another request', async () => {
    notificationPages = [[notification('t1', 'Payment Successful', 'payments')]];

    await fetchPortalNotifications(USER, 'tenant');

    expect(mockLimit).toHaveBeenCalledTimes(1);
  });

  it('never scans more than five pages for a portal with nothing to show', async () => {
    notificationPages = Array.from({ length: 8 }, () => landlordRows(50));

    await expect(fetchPortalNotifications(USER, 'tenant')).resolves.toEqual([]);

    expect(mockLimit).toHaveBeenCalledTimes(5);
  });

  it('returns at most one page of the portal rows', async () => {
    notificationPages = [landlordRows(50)];

    const result = await fetchPortalNotifications(USER, 'landlord', 20);

    expect(result).toHaveLength(20);
  });
});

describe('resolveNotificationAudiences', () => {
  it('asks who owns each apartment once and remembers the answer', async () => {
    apartmentRows = [{ id: APARTMENT, landlord_id: USER }];

    const [first] = await resolveNotificationAudiences([chat('c1')], USER);
    const [second] = await resolveNotificationAudiences([chat('c2')], USER);

    expect(first.resolvedChatAudience).toBe('landlord');
    expect(second.resolvedChatAudience).toBe('landlord');
    expect(mockIn).toHaveBeenCalledTimes(1);
    expect(mockIn).toHaveBeenCalledWith('id', [APARTMENT]);
  });

  it('skips the lookup when no chat row needs it', async () => {
    await resolveNotificationAudiences([notification('t1', 'Payment Successful', 'payments')], USER);

    expect(mockIn).not.toHaveBeenCalled();
  });

  it('leaves chat unresolved, and does not cache, when the lookup fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    apartmentError = { message: 'boom' };

    const [failed] = await resolveNotificationAudiences([chat('c1')], USER);

    expect(failed.resolvedChatAudience).toBe('unresolved');
    expect(consoleError).toHaveBeenCalledWith("[notifications] Couldn't resolve chat notification ownership.");

    apartmentError = null;
    apartmentRows = [{ id: APARTMENT, landlord_id: PEER }];
    const [retried] = await resolveNotificationAudiences([chat('c1')], USER);

    expect(retried.resolvedChatAudience).toBe('tenant');
    consoleError.mockRestore();
  });
});

describe('markNotificationsRead', () => {
  it('updates exactly the given rows', async () => {
    await markNotificationsRead(['a', 'b']);

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_read: true }));
    expect(mockIn).toHaveBeenCalledWith('id', ['a', 'b']);
  });

  it('does nothing for an empty list', async () => {
    await markNotificationsRead([]);

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
