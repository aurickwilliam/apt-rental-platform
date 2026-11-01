import type { LanguageCode } from "@repo/constants";

import type { TranslationKey } from "./catalogs/en";
import { translate } from "./translate";

/**
 * Stored database value → catalog key. Values are the exact strings the app
 * persists today (`FURNISHED_TYPES`, `PETS`, …); only the rendered label
 * changes with the locale.
 */
export type EnumKeyMap = Record<string, TranslationKey>;

export const FURNISHED_TYPE_KEYS: EnumKeyMap = {
  "Fully Furnished": "enums.furnished.fullyFurnished",
  "Semi-Furnished": "enums.furnished.semiFurnished",
  Unfurnished: "enums.furnished.unfurnished",
};

export const APARTMENT_TYPE_KEYS: EnumKeyMap = {
  Studio: "enums.apartmentType.studio",
  "Condo Unit": "enums.apartmentType.condoUnit",
  House: "enums.apartmentType.house",
  Apartment: "enums.apartmentType.apartment",
  Townhouse: "enums.apartmentType.townhouse",
};

export const FLOOR_LEVEL_KEYS: EnumKeyMap = {
  "Ground Floor": "enums.floorLevel.ground",
  "2nd-5th Floor": "enums.floorLevel.secondToFifth",
  "6th-10th Floor": "enums.floorLevel.sixthToTenth",
  "11th Floor and above": "enums.floorLevel.eleventhAndAbove",
};

export const EMPLOYMENT_TYPE_KEYS: EnumKeyMap = {
  "Full-Time": "enums.employment.fullTime",
  "Part-Time": "enums.employment.partTime",
  "Self-Employed": "enums.employment.selfEmployed",
  Unemployed: "enums.employment.unemployed",
  Student: "enums.employment.student",
};

export const LEASE_DURATION_KEYS: EnumKeyMap = {
  "6 Months": "enums.lease.sixMonths",
  "1 Year": "enums.lease.oneYear",
  "2 Years": "enums.lease.twoYears",
};

export const PET_KEYS: EnumKeyMap = {
  Dog: "enums.pet.dog",
  Cat: "enums.pet.cat",
  Bird: "enums.pet.bird",
  Fish: "enums.pet.fish",
  Reptile: "enums.pet.reptile",
  Hamster: "enums.pet.hamster",
  Rabbit: "enums.pet.rabbit",
  "Guinea Pig": "enums.pet.guineaPig",
  Other: "enums.pet.other",
};

export const VEHICLE_KEYS: EnumKeyMap = {
  Car: "enums.vehicle.car",
  Motorcycle: "enums.vehicle.motorcycle",
  Bicycle: "enums.vehicle.bicycle",
  Other: "enums.vehicle.other",
};

export const GENDER_KEYS: EnumKeyMap = {
  Male: "enums.gender.male",
  Female: "enums.gender.female",
  Other: "enums.gender.other",
};

export const APARTMENT_STATUS_KEYS: EnumKeyMap = {
  available: "enums.apartmentStatus.available",
  occupied: "enums.apartmentStatus.occupied",
  under_maintenance: "enums.apartmentStatus.underMaintenance",
  unverified: "enums.apartmentStatus.unverified",
};

export const PAYMENT_STATUS_KEYS: EnumKeyMap = {
  Paid: "enums.paymentStatus.paid",
  Pending: "enums.paymentStatus.pending",
  Unpaid: "enums.paymentStatus.unpaid",
};

/** Review sort options keep their stored English values; only labels translate. */
export const REVIEW_SORT_KEYS: EnumKeyMap = {
  "Most Recent": "reviews.sort.mostRecent",
  "Highest Rating": "reviews.sort.highest",
  "Lowest Rating": "reviews.sort.lowest",
};

export const MAINTENANCE_URGENCY_KEYS: EnumKeyMap = {
  low: "enums.urgency.low",
  medium: "enums.urgency.medium",
  high: "enums.urgency.high",
};

export const MAINTENANCE_CATEGORY_KEYS: EnumKeyMap = {
  plumbing_water_fixtures: "enums.maintenance.plumbing",
  appliances: "enums.maintenance.appliances",
  hvac_climate_control: "enums.maintenance.hvac",
  electrical_lighting: "enums.maintenance.electrical",
  general_wear_and_tear: "enums.maintenance.wearAndTear",
  pest_control: "enums.maintenance.pestControl",
  structural_issues: "enums.maintenance.structural",
  safety_security: "enums.maintenance.safety",
};

export const AMENITY_KEYS: EnumKeyMap = {
  bath: "enums.amenity.bath",
  hotwater: "enums.amenity.hotWater",
  toilet: "enums.amenity.privateToilet",
  cleaning: "enums.amenity.cleaningEssentials",
  washer: "enums.amenity.washingMachine",
  dryer: "enums.amenity.dryer",
  wifi: "enums.amenity.wifi",
  tv: "enums.amenity.tv",
  cabletv: "enums.amenity.cableTv",
  ac: "enums.amenity.airConditioning",
  electricfan: "enums.amenity.electricFan",
  ceiling_fan: "enums.amenity.ceilingFan",
  fridge: "enums.amenity.refrigerator",
  microwave: "enums.amenity.microwave",
  kettle: "enums.amenity.electricKettle",
  kitchen: "enums.amenity.kitchen",
  stove: "enums.amenity.stove",
  cooking_utensils: "enums.amenity.cookingUtensils",
  no_cooking: "enums.amenity.noCooking",
  water_dispenser: "enums.amenity.waterDispenser",
  furniture: "enums.amenity.furnished",
  wardrobe: "enums.amenity.wardrobe",
  bed: "enums.amenity.bedIncluded",
  lamp: "enums.amenity.studyLamp",
  balcony: "enums.amenity.balcony",
  garden: "enums.amenity.garden",
  fenced: "enums.amenity.fencedCompound",
  elevator: "enums.amenity.elevator",
  rooftop: "enums.amenity.rooftopAccess",
  parking: "enums.amenity.parking",
  parkroad: "enums.amenity.streetParking",
  motorbikeparking: "enums.amenity.motorbikeParking",
  covered_parking: "enums.amenity.coveredParking",
  security: "enums.amenity.securityGuard",
  cctv: "enums.amenity.cctv",
  smartlock: "enums.amenity.smartLock",
  intercom: "enums.amenity.intercom",
  smokealarm: "enums.amenity.smokeAlarm",
  fireextinguisher: "enums.amenity.fireExtinguisher",
  electricity: "enums.amenity.electricityIncluded",
  water: "enums.amenity.waterIncluded",
  generator: "enums.amenity.generator",
  gym: "enums.amenity.gym",
  pool: "enums.amenity.pool",
  petfriendly: "enums.amenity.petFriendly",
  childfriendly: "enums.amenity.childFriendly",
  nonsmoking: "enums.amenity.nonSmoking",
  smoking: "enums.amenity.smokingAllowed",
  storage: "enums.amenity.storageRoom",
  moving_in: "enums.amenity.moveInReady",
};

/**
 * Translates a stored value. Unknown values render unchanged rather than
 * blank, so historical rows and new options stay readable.
 */
export function enumLabel(
  language: LanguageCode,
  map: EnumKeyMap,
  value: string,
): string {
  const key = map[value];
  return key ? translate(language, key) : value;
}
