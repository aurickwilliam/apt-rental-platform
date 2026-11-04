import { PET_COUNT_CAP } from '@repo/constants';

import { sortVehicles, spotsForVehicles, trimPetKinds, trimVehicles } from './preferenceLinking';

describe('trimPetKinds', () => {
  const kinds = ['Dog', 'Cat', 'Bird', 'Fish', 'Reptile', 'Hamster'];

  it('drops kinds beyond a lowered count', () => {
    expect(trimPetKinds(['Dog', 'Cat'], 1)).toEqual(['Dog']);
  });

  it('keeps every kind at the "4+" cap, even above it', () => {
    expect(trimPetKinds(kinds, PET_COUNT_CAP)).toEqual(kinds);
  });

  it('leaves kinds alone when the count already covers them', () => {
    expect(trimPetKinds(['Dog'], 3)).toEqual(['Dog']);
  });
});

describe('vehicle linking', () => {
  it('orders vehicles by the catalog regardless of pick order', () => {
    expect(sortVehicles(['Motorcycle', 'Car'])).toEqual(['Car', 'Motorcycle']);
  });

  it('trims to the lowered spots, keeping catalog order', () => {
    expect(trimVehicles(['Motorcycle', 'Car'], 1)).toEqual(['Car']);
  });

  it('raises spots to cover the kinds but never lowers them', () => {
    expect(spotsForVehicles(1, ['Car', 'Bicycle'])).toBe(2);
    expect(spotsForVehicles(3, ['Car'])).toBe(3);
  });
});
