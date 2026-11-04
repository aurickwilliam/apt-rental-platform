import {
  getLegacyChatApartmentIds,
  getNotificationAudience,
  getVisibleUnreadIds,
  isNotificationVisibleInPortal,
  resolveChatAudiencesWith,
  resolveChatNotificationAudiences,
} from './notificationAudience';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const LANDLORD_ID = '22222222-2222-4222-8222-222222222222';
const APARTMENT_ID = '33333333-3333-4333-8333-333333333333';

function row(title: string, screen?: string, extra: Record<string, unknown> = {}) {
  return {
    id: `${screen ?? 'none'}:${title}`,
    user_id: TENANT_ID,
    type: 'payment',
    title,
    data: screen === undefined ? null : { screen, ...extra },
    is_read: false,
  };
}

function chat(extra: Record<string, unknown> = {}) {
  return {
    id: 'chat-1',
    user_id: TENANT_ID,
    type: 'message',
    title: 'Juan',
    data: { screen: 'chat', senderId: LANDLORD_ID, apartmentId: APARTMENT_ID, ...extra },
    is_read: false,
  };
}

describe('getNotificationAudience', () => {
  it('keeps tenant and landlord payment events in their own portal', () => {
    const tenant = row('Payment Successful', 'payments');
    const landlord = row('Payment Received', 'payments');

    expect(isNotificationVisibleInPortal(tenant, 'tenant')).toBe(true);
    expect(isNotificationVisibleInPortal(tenant, 'landlord')).toBe(false);
    expect(isNotificationVisibleInPortal(landlord, 'landlord')).toBe(true);
    expect(isNotificationVisibleInPortal(landlord, 'tenant')).toBe(false);
  });

  it('routes maintenance, visits and applications by the receiving role', () => {
    expect(getNotificationAudience(row('Maintenance Resolved', 'maintenance'))).toBe('tenant');
    expect(getNotificationAudience(row('New Maintenance Request', 'maintenance'))).toBe('landlord');
    expect(getNotificationAudience(row('Visit Approved', 'visitRequests'))).toBe('tenant');
    expect(getNotificationAudience(row('New Visit Request', 'visitRequests'))).toBe('landlord');
    expect(getNotificationAudience(row('Application Approved', 'apartment'))).toBe('tenant');
    expect(getNotificationAudience(row('New Application', 'application'))).toBe('landlord');
  });

  it('shows account verification results in every portal', () => {
    const verified = row('Account verification approved', 'verification');

    expect(isNotificationVisibleInPortal(verified, 'tenant')).toBe(true);
    expect(isNotificationVisibleInPortal(verified, 'landlord')).toBe(true);
  });

  it('keeps unrecognized events visible in both consumer portals but not admin', () => {
    const unknown = row('Some future title', 'unknown-screen');

    expect(isNotificationVisibleInPortal(unknown, 'tenant')).toBe(true);
    expect(isNotificationVisibleInPortal(unknown, 'landlord')).toBe(true);
    expect(isNotificationVisibleInPortal(unknown, 'admin')).toBe(false);
  });

  it('never shows chat without a resolved recipient portal', () => {
    const unresolved = chat();

    expect(getNotificationAudience(unresolved)).toBe('unresolved');
    expect(isNotificationVisibleInPortal(unresolved, 'tenant')).toBe(false);
    expect(isNotificationVisibleInPortal(unresolved, 'landlord')).toBe(false);
  });

  it('honors an explicit chat recipientPortal and rejects an invalid one', () => {
    const toLandlord = chat({ recipientPortal: 'landlord' });
    const invalid = chat({ recipientPortal: 'admin' });

    expect(isNotificationVisibleInPortal(toLandlord, 'landlord')).toBe(true);
    expect(isNotificationVisibleInPortal(toLandlord, 'tenant')).toBe(false);
    expect(isNotificationVisibleInPortal(invalid, 'tenant')).toBe(false);
  });
});

describe('getVisibleUnreadIds', () => {
  it('counts only the unread rows the portal shows', () => {
    const feed = [
      { ...row('Payment Successful', 'payments'), id: 't1' },
      { ...row('Payment Received', 'payments'), id: 'l1' },
      { ...row('Payment Successful', 'payments'), id: 't2', is_read: true },
    ];

    expect(getVisibleUnreadIds(feed, 'tenant')).toEqual(['t1']);
    expect(getVisibleUnreadIds(feed, 'landlord')).toEqual(['l1']);
  });
});

describe('resolveChatNotificationAudiences', () => {
  it('resolves apartment chat from who owns the apartment', () => {
    const owned = [{ id: APARTMENT_ID, landlord_id: TENANT_ID }];
    const peerOwned = [{ id: APARTMENT_ID, landlord_id: LANDLORD_ID }];

    const [asLandlord] = resolveChatNotificationAudiences([chat()], TENANT_ID, owned);
    const [asTenant] = resolveChatNotificationAudiences([chat()], TENANT_ID, peerOwned);

    expect(asLandlord.resolvedChatAudience).toBe('landlord');
    expect(asTenant.resolvedChatAudience).toBe('tenant');
    expect(isNotificationVisibleInPortal(asLandlord, 'landlord')).toBe(true);
    expect(isNotificationVisibleInPortal(asLandlord, 'tenant')).toBe(false);
  });

  it('leaves chat unresolved when ownership is missing or neither party owns it', () => {
    const stranger = [{ id: APARTMENT_ID, landlord_id: '44444444-4444-4444-8444-444444444444' }];

    expect(resolveChatNotificationAudiences([chat()], TENANT_ID, [])[0].resolvedChatAudience).toBe('unresolved');
    expect(resolveChatNotificationAudiences([chat()], TENANT_ID, stranger)[0].resolvedChatAudience).toBe('unresolved');
  });

  it('only asks for apartments of legacy chat that has no explicit portal', () => {
    expect(getLegacyChatApartmentIds([chat(), chat({ recipientPortal: 'tenant' })], TENANT_ID)).toEqual([APARTMENT_ID]);
    expect(getLegacyChatApartmentIds([row('Payment Successful', 'payments')], TENANT_ID)).toEqual([]);
  });
});

describe('resolveChatAudiencesWith', () => {
  it('looks up the distinct legacy apartments once and resolves from the answer', async () => {
    const fetchOwners = jest.fn().mockResolvedValue([{ id: APARTMENT_ID, landlord_id: TENANT_ID }]);

    const [resolved] = await resolveChatAudiencesWith([chat(), chat()], TENANT_ID, fetchOwners);

    expect(fetchOwners).toHaveBeenCalledTimes(1);
    expect(fetchOwners).toHaveBeenCalledWith([APARTMENT_ID]);
    expect(resolved.resolvedChatAudience).toBe('landlord');
  });

  it('skips the lookup when no chat row needs it', async () => {
    const fetchOwners = jest.fn();

    await resolveChatAudiencesWith([row('Payment Successful', 'payments'), chat({ recipientPortal: 'tenant' })], TENANT_ID, fetchOwners);

    expect(fetchOwners).not.toHaveBeenCalled();
  });

  it('reports once and leaves legacy chat unresolved when the lookup fails', async () => {
    const onError = jest.fn();
    const fetchOwners = jest.fn().mockRejectedValue(new Error('offline'));

    const [resolved] = await resolveChatAudiencesWith([chat()], TENANT_ID, fetchOwners, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(resolved.resolvedChatAudience).toBe('unresolved');
  });
});
