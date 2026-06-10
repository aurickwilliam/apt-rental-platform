// Auto-generated from PH_ZIP_DATABASE
// CPO (Central Post Office) code used as default for cities with multiple zip codes.
// Source: PHPost Philippine Postal Code Directory

export const POSTAL_CODES: Record<string, string> = {
  // NCR — Metro Manila
  'Manila': '1000',
  'Quezon City': '1100',
  'Makati': '1200',
  'Pasay': '1300',
  'Caloocan': '1400',
  'Valenzuela': '1440',
  'Malabon': '1470',
  'Navotas': '1485',
  'San Juan': '1500',
  'Mandaluyong': '1550',
  'Pasig': '1600',
  'Pateros': '1620',
  'Taguig': '1630',
  'Parañaque': '1700',
  'Las Piñas': '1740',
  'Muntinlupa': '1770',
  'Marikina': '1800',

  // Region I — Ilocos Region
  'Vigan': '2200',
  'Laoag': '2900',
  'Dagupan': '2400',
  'Alaminos': '2404',
  'Urdaneta': '2428',
  'San Fernando': '2500', // La Union

  // Region II — Cagayan Valley
  'Tuguegarao': '3500',
  'Santiago': '3700',
  'Cauayan': '3600',
  'Ilagan': '3300',

  // Region III — Central Luzon
  'Angeles': '2009',
  'Mabalacat': '2010',
  'Balanga': '2100',
  'Olongapo': '2200',
  'Tarlac City': '2300',
  'Malolos': '3000',
  'Meycauayan': '3020',
  'San Jose del Monte': '3023',
  'Cabanatuan': '3100',
  'Palayan': '3132',

  // Region IV-A — CALABARZON
  'Calamba': '4000',
  'Santa Rosa': '4026',
  'Biñan': '4027',
  'Los Baños': '4031',
  'San Pablo': '4100',
  'Bacoor': '4102',
  'Imus': '4103',
  'General Trias': '4107',
  'Dasmariñas': '4114',
  'San Pedro': '4115',
  'Batangas City': '4200',
  'Lipa': '4210',
  'Lucena': '4300',
  'Antipolo': '1920',

  // Region IV-B — MIMAROPA
  'Mamburao': '5100',
  'Calapan': '5200',
  'Puerto Princesa': '5300',

  // Region V — Bicol
  'Naga': '4400',
  'Legazpi': '4500',
  'Daet': '4600',
  'Sorsogon City': '4700',

  // Region VI — Western Visayas
  'Iloilo City': '5000',
  'Kalibo': '5600',
  'Bacolod': '6100',

  // Region VII — Central Visayas
  'Cebu City': '6000',
  'Mandaue': '6014',
  'Lapu-Lapu': '6015',
  'Dumaguete': '6200',
  'Tagbilaran': '6300',

  // Region VIII — Eastern Visayas
  'Tacloban': '6500',
  'Catbalogan': '6700',
  'Calbayog': '6710',

  // Region IX — Zamboanga Peninsula
  'Zamboanga City': '7000',
  'Pagadian': '7016',
  'Dipolog': '7100',

  // Region X — Northern Mindanao
  'Ozamiz': '7200',
  'Cagayan de Oro': '9000',
  'Iligan': '9200',

  // Region XI — Davao Region
  'Davao City': '8000',
  'Digos': '8002',
  'Tagum': '8100',
  'Mati': '8200',

  // Region XII — SOCCSKSARGEN
  'Kidapawan': '9400',
  'General Santos': '9500',
  'Koronadal': '9506',

  // Region XIII — Caraga
  'Surigao City': '8300',
  'Tandag': '8311',
  'Butuan': '8600',

  // CAR — Cordillera Administrative Region
  'Baguio': '2600',
  'Bontoc': '2616',
  'Tabuk': '3800',

  // BARMM — Bangsamoro
  'Cotabato City': '9600',
  'Marawi': '9700',
};

/** Returns the default postal code for a city, or null if not found. */
export function getPostalCode(city: string): string | null {
  return POSTAL_CODES[city] ?? null;
}

/** Returns all valid zip codes for a city from the full database. */
export function getValidZipsForCity(city: string, database: { zip: string; city: string }[]): string[] {
  return database
    .filter((entry) => entry.city.includes(city))
    .map((entry) => entry.zip);
}