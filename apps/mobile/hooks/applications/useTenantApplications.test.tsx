import { renderHook, waitFor } from '@testing-library/react-native';

import { useTenantApplications } from './useTenantApplications';
import { resolvePrivateMediaUrls } from '@/service/privateMediaResolver';

const mockFrom = jest.fn();

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('hooks/auth', () => ({
  useProfile: () => ({ profile: { id: 'tenant-1' }, loading: false }),
}));

jest.mock('@/service/privateMediaResolver', () => ({
  resolvePrivateMediaUrls: jest.fn(),
}));

const mockResolvePrivateMediaUrls = jest.mocked(resolvePrivateMediaUrls);

const applicationRow = {
  id: 'application-1',
  status: 'pending',
  created_at: '2026-01-01T00:00:00.000Z',
  rejected_reason: null,
  apartment_id: 'apartment-1',
  occupation: 'Engineer',
  employer_name: 'APT',
  monthly_income: 50000,
  employment_type: 'Full-time',
  prev_landlord_name: null,
  prev_landlord_contact: null,
  move_in_date: '2026-02-01',
  no_occupants: 1,
  has_pets: false,
  has_smoker: false,
  need_parking: false,
  message: null,
  gov_id_url: 'tenant/shared-document.jpg',
  proof_of_income_url: 'tenant/shared-document.jpg',
  proof_of_billing_url: null,
  nbi_clearance_url: null,
  apartments: { name: 'APT Homes', monthly_rent: 12000 },
};

function createApplicationsQuery() {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockResolvedValue({ data: [applicationRow], error: null });
  return query;
}

describe('useTenantApplications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue(createApplicationsQuery());
    mockResolvePrivateMediaUrls.mockResolvedValue({
      urls: { 'tenant/shared-document.jpg': 'https://signed.example.test/document.jpg' },
      error: null,
    });
  });

  it('uses the shared document resolver while preserving duplicate document rows and order', async () => {
    const { result } = renderHook(() => useTenantApplications());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockResolvePrivateMediaUrls).toHaveBeenCalledWith('application-documents', [
      'tenant/shared-document.jpg',
      'tenant/shared-document.jpg',
    ]);
    expect(result.current.applications[0]?.documents).toEqual([
      {
        label: 'Government ID',
        path: 'tenant/shared-document.jpg',
        signedUrl: 'https://signed.example.test/document.jpg',
      },
      {
        label: 'Proof of Income',
        path: 'tenant/shared-document.jpg',
        signedUrl: 'https://signed.example.test/document.jpg',
      },
    ]);
  });

  it('exposes a compatible resolver error while retaining application documents', async () => {
    mockResolvePrivateMediaUrls.mockResolvedValue({
      urls: { 'tenant/shared-document.jpg': null },
      error: 'Unable to access private media.',
    });

    const { result } = renderHook(() => useTenantApplications());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Unable to access private media.');
    expect(result.current.applications[0]?.documents[0]?.signedUrl).toBeNull();
  });
});
