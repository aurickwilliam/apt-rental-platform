import {
  buildApartmentShareMessage,
  buildApartmentShareText,
  getApartmentSharePath,
} from './apartmentShare';

describe('apartment share', () => {
  const apt = { id: 'a1', name: ' Sunrise ', city: 'Caloocan', monthly_rent: 12000 };

  it('builds the headline', () => {
    const text = buildApartmentShareText(apt);
    expect(text).toContain('Sunrise');
    expect(text).toContain('Caloocan');
    expect(text).toContain('/month');
    expect(buildApartmentShareText({ id: 'x' })).toBe('Check out an apartment on APT');
  });

  it('adds the link only with a base URL', () => {
    expect(getApartmentSharePath('a1')).toBe('/browse/a1');
    expect(buildApartmentShareMessage(apt, null)).not.toContain('http');
    expect(buildApartmentShareMessage(apt, 'https://apt.example/')).toContain(
      'https://apt.example/browse/a1',
    );
  });
});
