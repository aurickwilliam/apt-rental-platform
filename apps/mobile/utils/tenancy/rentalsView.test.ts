import {
  getRentalsLayoutToRemember,
  getRentalsSkeleton,
  getRentalsView,
  type RentalsViewInput,
} from './rentalsView';

const settled: RentalsViewInput = {
  hasTenancy: false,
  tenancyLoading: false,
  tenancyError: null,
  applicationsLoading: false,
  applicationsError: null,
  tenancyDetailsLoading: false,
};

describe('getRentalsView', () => {
  it('waits for the tenancy and the applications together', () => {
    expect(getRentalsView({ ...settled, tenancyLoading: true })).toBe('loading');
    expect(getRentalsView({ ...settled, applicationsLoading: true })).toBe('loading');
  });

  it('keeps loading while tenancy details are still fetching', () => {
    expect(
      getRentalsView({ ...settled, hasTenancy: true, tenancyDetailsLoading: true }),
    ).toBe('loading');
  });

  it('shows the tenancy once its details have loaded', () => {
    expect(getRentalsView({ ...settled, hasTenancy: true })).toBe('tenancy');
  });

  it('keeps showing a loaded tenancy when a later fetch fails', () => {
    expect(
      getRentalsView({ ...settled, hasTenancy: true, tenancyError: 'Network request failed' }),
    ).toBe('tenancy');
  });

  it('shows an error instead of the applications list when a fetch fails', () => {
    expect(getRentalsView({ ...settled, tenancyError: 'Network request failed' })).toBe('error');
    expect(getRentalsView({ ...settled, applicationsError: 'Network request failed' })).toBe('error');
  });

  it('shows the applications list when there is no tenancy', () => {
    expect(getRentalsView(settled)).toBe('applications');
  });
});

describe('getRentalsSkeleton', () => {
  it('uses the page this account saw last time', () => {
    expect(getRentalsSkeleton('applications', true)).toBe('applications');
    expect(getRentalsSkeleton('tenancy', true)).toBe('tenancy');
  });

  it('falls back to the rental skeleton without a saved hint', () => {
    expect(getRentalsSkeleton(null, true)).toBe('tenancy');
  });

  it('draws nothing until the hint has been read', () => {
    expect(getRentalsSkeleton('applications', false)).toBe('none');
  });
});

describe('getRentalsLayoutToRemember', () => {
  it('remembers only a page that actually rendered', () => {
    expect(getRentalsLayoutToRemember('tenancy')).toBe('tenancy');
    expect(getRentalsLayoutToRemember('applications')).toBe('applications');
    expect(getRentalsLayoutToRemember('loading')).toBeNull();
    expect(getRentalsLayoutToRemember('error')).toBeNull();
  });
});
