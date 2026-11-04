import {
  applicationAnswersFromSavedPreferences,
  toApplicationPreferenceSource,
} from './applicationFormPreferences'
import type { TenantPreferences } from '@/hooks/preferences/useUserPreferences'

const saved: TenantPreferences = {
  selectedCities: [],
  budgetMin: 5000,
  budgetMax: 20000,
  bedroomCount: null,
  householdSize: null,
  hasPets: true,
  kindOfPets: ['Dog'],
  noOfPets: 2,
  nameOfPets: null,
  hasParking: false,
  noOfParkingSpots: 3,
  listOfVehicles: ['Car'],
  hasSmoker: true,
  hasDisability: true,
}

describe('applicationAnswersFromSavedPreferences', () => {
  it('starts unanswered when nothing is saved', () => {
    expect(applicationAnswersFromSavedPreferences(null)).toBeNull()
  })

  it('pre-fills the answers and copies details only for a yes', () => {
    expect(applicationAnswersFromSavedPreferences(saved)).toEqual({
      hasPets: true,
      kindOfPets: ['Dog'],
      noOfPets: 2,
      nameOfPets: null,
      needParking: false,
      noOfParkingSpots: 1,
      listOfVehicles: [],
      isSmoker: true,
      hasDisability: true,
    })
  })
})

describe('toApplicationPreferenceSource', () => {
  it('treats unanswered questions as no', () => {
    expect(
      toApplicationPreferenceSource({
        hasPets: undefined,
        kindOfPets: [],
        noOfPets: 1,
        nameOfPets: null,
        needParking: undefined,
        noOfParkingSpots: 1,
        listOfVehicles: [],
        isSmoker: undefined,
        hasDisability: undefined,
      }),
    ).toMatchObject({ hasPets: false, hasParking: false, hasSmoker: false, hasDisability: false })
  })
})
