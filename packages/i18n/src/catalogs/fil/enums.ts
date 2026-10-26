import type { enums as enEnums } from "../en/enums";

/**
 * Real-estate and technical nouns stay in English where that is what people
 * actually say ("Fully Furnished", "Plumbing & Water Fixtures", "HVAC").
 */
export const enums: Record<keyof typeof enEnums, string> = {
  "enums.furnished.fullyFurnished": "Fully Furnished",
  "enums.furnished.semiFurnished": "Semi-Furnished",
  "enums.furnished.unfurnished": "Unfurnished",

  "enums.apartmentType.studio": "Studio",
  "enums.apartmentType.condoUnit": "Condo Unit",
  "enums.apartmentType.house": "Bahay",
  "enums.apartmentType.apartment": "Apartment",
  "enums.apartmentType.townhouse": "Townhouse",

  "enums.floorLevel.ground": "Ground Floor",
  "enums.floorLevel.secondToFifth": "2nd-5th Floor",
  "enums.floorLevel.sixthToTenth": "6th-10th Floor",
  "enums.floorLevel.eleventhAndAbove": "11th Floor and above",

  "enums.employment.fullTime": "Full-Time",
  "enums.employment.partTime": "Part-Time",
  "enums.employment.selfEmployed": "Self-Employed",
  "enums.employment.unemployed": "Walang trabaho",
  "enums.employment.student": "Estudyante",

  "enums.lease.sixMonths": "6 Buwan",
  "enums.lease.oneYear": "1 Taon",
  "enums.lease.twoYears": "2 Taon",

  "enums.pet.dog": "Aso",
  "enums.pet.cat": "Pusa",
  "enums.pet.bird": "Ibon",
  "enums.pet.fish": "Isda",
  "enums.pet.reptile": "Reptile",
  "enums.pet.hamster": "Hamster",
  "enums.pet.rabbit": "Kuneho",
  "enums.pet.guineaPig": "Guinea Pig",
  "enums.pet.other": "Iba pa",

  "enums.vehicle.car": "Kotse",
  "enums.vehicle.motorcycle": "Motorsiklo",
  "enums.vehicle.bicycle": "Bisikleta",
  "enums.vehicle.other": "Iba pa",

  "enums.gender.male": "Lalaki",
  "enums.gender.female": "Babae",
  "enums.gender.other": "Iba pa",

  "enums.apartmentStatus.available": "Available",
  "enums.apartmentStatus.occupied": "May nakatira",
  "enums.apartmentStatus.underMaintenance": "Under Maintenance",
  "enums.apartmentStatus.unverified": "Hindi pa verified",

  "enums.paymentStatus.paid": "Bayad na",
  "enums.paymentStatus.pending": "Pending",
  "enums.paymentStatus.unpaid": "Hindi pa bayad",

  "enums.urgency.low": "Mababa",
  "enums.urgency.medium": "Katamtaman",
  "enums.urgency.high": "Mataas",

  "enums.maintenance.plumbing": "Plumbing & Water Fixtures",
  "enums.maintenance.appliances": "Appliances",
  "enums.maintenance.hvac": "HVAC (Climate Control)",
  "enums.maintenance.electrical": "Electrical & Lighting",
  "enums.maintenance.wearAndTear": "General Wear and Tear",
  "enums.maintenance.pestControl": "Pest Control",
  "enums.maintenance.structural": "Structural Issues",
  "enums.maintenance.safety": "Safety & Security",
};
