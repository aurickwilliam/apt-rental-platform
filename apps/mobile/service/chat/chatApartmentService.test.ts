import { toChatApartmentSummary } from './chatApartmentService';

jest.mock('@repo/supabase', () => ({ supabase: {} }));

describe('toChatApartmentSummary', () => {
  it('builds the card from the cover thumbnail, barangay + city and rent', () => {
    expect(
      toChatApartmentSummary({
        id: 'apt-1',
        name: 'Concepcion Quiet 1BR',
        barangay: 'Maypajo',
        city: 'Caloocan',
        monthly_rent: 15000,
        apartment_images: [
          { url: 'full-a', url_thumb: 'thumb-a', is_cover: false, created_at: '2026-01-01' },
          { url: 'full-b', url_thumb: 'thumb-b', is_cover: true, created_at: '2026-02-01' },
        ],
      })
    ).toEqual({
      id: 'apt-1',
      name: 'Concepcion Quiet 1BR',
      location: 'Maypajo, Caloocan',
      monthlyRent: 15000,
      thumbnailUrl: 'thumb-b',
    });
  });

  it('copes with a missing area, rent and photos', () => {
    expect(
      toChatApartmentSummary({
        id: 'apt-2',
        name: 'Studio',
        barangay: null,
        city: 'Malabon',
        monthly_rent: null,
        apartment_images: null,
      })
    ).toEqual({
      id: 'apt-2',
      name: 'Studio',
      location: 'Malabon',
      monthlyRent: 0,
      thumbnailUrl: null,
    });
  });
});
