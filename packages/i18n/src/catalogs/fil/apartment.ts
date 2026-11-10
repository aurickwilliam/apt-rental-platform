import type { apartment as enApartment } from "../en/apartment";

export const apartment: Record<keyof typeof enApartment, string> = {
  "apartment.back": "Bumalik",
  "apartment.notFound": "Hindi mahanap ang apartment.",

  "apartment.description.title": "Paglalarawan",
  "apartment.description.empty": "Walang nakalagay na paglalarawan.",
  "apartment.description.viewMore": "Tingnan lahat",
  "apartment.description.viewLess": "Bawasan",

  "apartment.amenities.title": "Mga Amenity",

  "apartment.photos.viewAria": "Tingnan ang mga photo ng {name}",
  "apartment.photos.viewPhotoAria": "Tingnan ang photo {index} ng {name}",
  "apartment.photos.seeAll": "Tingnan lahat ng photo ({count})",

  "apartment.landlord.unknown": "Hindi kilala",
  "apartment.landlord.role": "Landlord",
  "apartment.landlord.unavailable":
    "Wala pang detalye ng landlord.",
  "apartment.landlord.verified": "Verified na landlord",
  "apartment.landlord.profileAria": "Tingnan ang profile ni {name}",

  "apartment.spec.bedrooms": "{count} Kwarto",
  "apartment.spec.bedroomsPlural": "{count} Kwarto",
  "apartment.spec.bathrooms": "{count} Banyo",
  "apartment.spec.bathroomsPlural": "{count} Banyo",
  "apartment.spec.occupants": "{count} Tao",
  "apartment.spec.occupantsPlural": "{count} Tao",
  "apartment.spec.sqm": "{count} sqm",

  "apartment.map.title": "Tingnan sa Mapa",
  "apartment.map.none": "Walang available na lokasyon",
  "apartment.map.directions": "Kunin ang Direksyon",
  "apartment.map.directionsBody":
    "Piliin kung paano ka pupunta. Bubukas sa Google Maps.",
  "apartment.map.mode.drive": "Mag-drive",
  "apartment.map.mode.motorcycle": "Motor",
  "apartment.map.mode.walkBike": "Maglakad at Bisikleta",
  "apartment.map.mode.transit": "Pampublikong Sasakyan",

  "apartment.share.aria": "I-share ang apartment na ito",

  "apartment.price.perMonth": "/buwan",
  "apartment.price.monthlyRent": "Buwanang Upa",
  "apartment.price.securityDeposit": "Security Deposit",
  "apartment.price.advancePayment": "Advance Payment",
  "apartment.price.months": "({count} buwan)",
  "apartment.price.monthsPlural": "({count} buwan)",
  "apartment.price.totalMoveIn": "Kabuuang Gastos sa Paglipat:",
  "apartment.price.breakdownTitle": "Breakdown ng Gastos sa Paglipat",
  "apartment.price.breakdownBody":
    "Tinatayang bayad bago ka makalipat.",
  "apartment.price.breakdownLink": "Breakdown ng gastos sa paglipat",
  "apartment.price.apply": "Mag-apply Ngayon",
  "apartment.price.unavailable": "Hindi Available",
  "apartment.price.tenantsOnly": "Mga tenant lang ang puwedeng mag-apply.",
  "apartment.price.report": "I-report",
  "apartment.price.close": "Isara",

  "apartment.lease.title": "Lease Agreement",
  "apartment.lease.description":
    "Tingnan ang lease agreement para sa apartment na ito.",
  "apartment.lease.opening": "Binubuksan...",
  "apartment.lease.download": "I-download ang Lease Agreement",
  "apartment.lease.view": "Tingnan ang Lease Agreement",
  "apartment.lease.none":
    "Wala pang naka-upload na lease agreement para sa apartment na ito.",
  "apartment.lease.errorTitle": "Hindi mabuksan ang lease agreement",
  "apartment.lease.errorBody":
    "Hindi namin mabuksan ang lease agreement. Subukan ulit.",

  "apartment.maintenance.button": "History ng Maintenance",
  "apartment.maintenance.buttonAria": "Tingnan ang history ng maintenance",
  "apartment.maintenance.title": "History ng maintenance",
  "apartment.maintenance.emptyHint":
    "Lalabas dito ang mga naayos nang repair sa apartment na ito.",
  "apartment.maintenance.count": "{count} naayos na repair sa apartment na ito.",
  "apartment.maintenance.countPlural":
    "{count} naayos na repair sa apartment na ito.",
  "apartment.maintenance.loadingAria": "Naglo-load ng history ng maintenance",
  "apartment.maintenance.empty": "Wala pang naayos na maintenance.",
  "apartment.maintenance.loadError":
    "Hindi ma-load ang history ng maintenance.",
  "apartment.maintenance.reported": "Ini-report noong {date}",
  "apartment.maintenance.resolved": "Naayos noong {date}",
  "apartment.maintenance.resolvedStatus": "Naayos",

  "apartment.related.title": "Kaugnay na Apartment",
  "apartment.related.previous": "Naunang mga apartment",
  "apartment.related.next": "Susunod na mga apartment",

  "apartment.loadingDetails": "Naglo-load ng detalye ng apartment",
};
