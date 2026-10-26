/**
 * Display labels for values that are stored in the database as English text.
 *
 * These are presentation only. The stored value never changes, so a listing
 * keeps `"Fully Furnished"` in `furnished_type` regardless of UI language.
 * `enums.ts` maps every stored value to its catalog key, and the coverage
 * test fails if a constant grows an option without a label.
 */
export const enums = {
  "enums.furnished.fullyFurnished": "Fully Furnished",
  "enums.furnished.semiFurnished": "Semi-Furnished",
  "enums.furnished.unfurnished": "Unfurnished",

  "enums.apartmentType.studio": "Studio",
  "enums.apartmentType.condoUnit": "Condo Unit",
  "enums.apartmentType.house": "House",
  "enums.apartmentType.apartment": "Apartment",
  "enums.apartmentType.townhouse": "Townhouse",

  "enums.floorLevel.ground": "Ground Floor",
  "enums.floorLevel.secondToFifth": "2nd-5th Floor",
  "enums.floorLevel.sixthToTenth": "6th-10th Floor",
  "enums.floorLevel.eleventhAndAbove": "11th Floor and above",

  "enums.employment.fullTime": "Full-Time",
  "enums.employment.partTime": "Part-Time",
  "enums.employment.selfEmployed": "Self-Employed",
  "enums.employment.unemployed": "Unemployed",
  "enums.employment.student": "Student",

  "enums.lease.sixMonths": "6 Months",
  "enums.lease.oneYear": "1 Year",
  "enums.lease.twoYears": "2 Years",

  "enums.pet.dog": "Dog",
  "enums.pet.cat": "Cat",
  "enums.pet.bird": "Bird",
  "enums.pet.fish": "Fish",
  "enums.pet.reptile": "Reptile",
  "enums.pet.hamster": "Hamster",
  "enums.pet.rabbit": "Rabbit",
  "enums.pet.guineaPig": "Guinea Pig",
  "enums.pet.other": "Other",

  "enums.vehicle.car": "Car",
  "enums.vehicle.motorcycle": "Motorcycle",
  "enums.vehicle.bicycle": "Bicycle",
  "enums.vehicle.other": "Other",

  "enums.gender.male": "Male",
  "enums.gender.female": "Female",
  "enums.gender.other": "Other",

  "enums.apartmentStatus.available": "Available",
  "enums.apartmentStatus.occupied": "Occupied",
  "enums.apartmentStatus.underMaintenance": "Under Maintenance",
  "enums.apartmentStatus.unverified": "Unverified",

  "enums.paymentStatus.paid": "Paid",
  "enums.paymentStatus.pending": "Pending",
  "enums.paymentStatus.unpaid": "Unpaid",

  "enums.urgency.low": "Low",
  "enums.urgency.medium": "Medium",
  "enums.urgency.high": "High",

  "enums.maintenance.plumbing": "Plumbing & Water Fixtures",
  "enums.maintenance.appliances": "Appliances",
  "enums.maintenance.hvac": "HVAC (Climate Control)",
  "enums.maintenance.electrical": "Electrical & Lighting",
  "enums.maintenance.wearAndTear": "General Wear and Tear",
  "enums.maintenance.pestControl": "Pest Control",
  "enums.maintenance.structural": "Structural Issues",
  "enums.maintenance.safety": "Safety & Security",
} as const;
