export interface PHLocation {
  zip: string;
  city: string;
  province: string;
  region: string;
}

// TODO: Expand this database over time, starting with major cities and regions. 
// TODO: The full list of Philippine ZIP codes is available from PHPost at https://philpost.gov.ph/philippine-postal-code-directory/.

export const PH_ZIP_DATABASE: PHLocation[] = [
  // --- NCR – Metro Manila ---
  
  // Manila
  { zip: "1000", city: "Ermita, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1001", city: "Quiapo, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1002", city: "Intramuros, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1003", city: "Santa Cruz (South), Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1004", city: "Malate, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1005", city: "San Miguel, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1006", city: "Binondo, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1007", city: "Paco, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1008", city: "Sampaloc (East), Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1009", city: "Santa Ana, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1010", city: "San Nicolas, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1011", city: "Pandacan, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1012", city: "Tondo (South), Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1013", city: "Tondo (North), Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1014", city: "Santa Cruz (North), Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1015", city: "Sampaloc (West), Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1016", city: "Santa Mesa, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1017", city: "San Andres Bukid, Manila", province: "Metro Manila", region: "NCR" },
  { zip: "1018", city: "Port Area, Manila", province: "Metro Manila", region: "NCR" },

  // Valenzuela (Fully Expanded)
  { zip: "1440", city: "Valenzuela CPO / Malinta", province: "Metro Manila", region: "NCR" },
  { zip: "1441", city: "Karuhatan, Valenzuela", province: "Metro Manila", region: "NCR" },
  { zip: "1442", city: "Paso de Blas / Gen. T. de Leon, Valenzuela", province: "Metro Manila", region: "NCR" },
  { zip: "1443", city: "Dalandanan / Maysan, Valenzuela", province: "Metro Manila", region: "NCR" },
  { zip: "1444", city: "Malanday / Polo, Valenzuela", province: "Metro Manila", region: "NCR" },
  { zip: "1445", city: "Balangkas / Caloong, Valenzuela", province: "Metro Manila", region: "NCR" },
  { zip: "1446", city: "Lingunan, Valenzuela", province: "Metro Manila", region: "NCR" },
  { zip: "1447", city: "Lawang Bato / Punturin, Valenzuela", province: "Metro Manila", region: "NCR" },
  { zip: "1448", city: "Mapulang Lupa, Valenzuela", province: "Metro Manila", region: "NCR" },

  // Quezon City
  { zip: "1100", city: "Quezon City CPO / Central", province: "Metro Manila", region: "NCR" },
  { zip: "1101", city: "Diliman / UP Village, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1103", city: "Kamuning / South Triangle, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1105", city: "Project 7 / Del Monte, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1106", city: "Project 8 / Balintawak, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1107", city: "Project 6, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1109", city: "Cubao / Project 4, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1110", city: "Libis / Camp Aguinaldo, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1111", city: "Crame / Immaculate Conception, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1116", city: "Tandang Sora, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1118", city: "Fairview, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1121", city: "Commonwealth, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1123", city: "Novaliches Proper, Quezon City", province: "Metro Manila", region: "NCR" },
  { zip: "1126", city: "Batasan Hills, Quezon City", province: "Metro Manila", region: "NCR" },

  // Makati
  { zip: "1200", city: "Makati CPO", province: "Metro Manila", region: "NCR" },
  { zip: "1203", city: "San Antonio Village, Makati", province: "Metro Manila", region: "NCR" },
  { zip: "1209", city: "Bel-Air, Makati", province: "Metro Manila", region: "NCR" },
  { zip: "1210", city: "Poblacion / Rockwell, Makati", province: "Metro Manila", region: "NCR" },
  { zip: "1211", city: "Guadalupe Viejo, Makati", province: "Metro Manila", region: "NCR" },
  { zip: "1212", city: "Guadalupe Nuevo, Makati", province: "Metro Manila", region: "NCR" },
  { zip: "1226", city: "Ayala-Paseo de Roxas, Makati", province: "Metro Manila", region: "NCR" },
  { zip: "1227", city: "Salcedo Village, Makati", province: "Metro Manila", region: "NCR" },
  { zip: "1229", city: "Legaspi Village, Makati", province: "Metro Manila", region: "NCR" },
  { zip: "1232", city: "Magallanes Village, Makati", province: "Metro Manila", region: "NCR" },

  // Caloocan
  { zip: "1400", city: "Caloocan CPO (South)", province: "Metro Manila", region: "NCR" },
  { zip: "1401", city: "Baesa, Caloocan", province: "Metro Manila", region: "NCR" },
  { zip: "1403", city: "Grace Park East, Caloocan", province: "Metro Manila", region: "NCR" },
  { zip: "1420", city: "Kaybiga / Deparo, Caloocan (North)", province: "Metro Manila", region: "NCR" },
  { zip: "1422", city: "Novaliches North, Caloocan", province: "Metro Manila", region: "NCR" },
  { zip: "1428", city: "Bagong Silang, Caloocan", province: "Metro Manila", region: "NCR" },

  // Taguig
  { zip: "1630", city: "Western Bicutan, Taguig", province: "Metro Manila", region: "NCR" },
  { zip: "1631", city: "Bicutan, Taguig", province: "Metro Manila", region: "NCR" },
  { zip: "1632", city: "Lower Bicutan, Taguig", province: "Metro Manila", region: "NCR" },
  { zip: "1634", city: "BGC / Fort Bonifacio, Taguig", province: "Metro Manila", region: "NCR" },

  // Other NCR Cities
  { zip: "1470", city: "Malabon", province: "Metro Manila", region: "NCR" },
  { zip: "1485", city: "Navotas", province: "Metro Manila", region: "NCR" },
  { zip: "1500", city: "San Juan", province: "Metro Manila", region: "NCR" },
  { zip: "1502", city: "Greenhills, San Juan", province: "Metro Manila", region: "NCR" },
  { zip: "1550", city: "Mandaluyong CPO", province: "Metro Manila", region: "NCR" },
  { zip: "1552", city: "Shaw Boulevard, Mandaluyong", province: "Metro Manila", region: "NCR" },
  { zip: "1600", city: "Pasig CPO", province: "Metro Manila", region: "NCR" },
  { zip: "1605", city: "Ortigas Center, Pasig", province: "Metro Manila", region: "NCR" },
  { zip: "1620", city: "Pateros", province: "Metro Manila", region: "NCR" },
  { zip: "1700", city: "Parañaque CPO", province: "Metro Manila", region: "NCR" },
  { zip: "1702", city: "Baclaran, Parañaque", province: "Metro Manila", region: "NCR" },
  { zip: "1720", city: "BF Homes, Parañaque", province: "Metro Manila", region: "NCR" },
  { zip: "1740", city: "Las Piñas CPO", province: "Metro Manila", region: "NCR" },
  { zip: "1770", city: "Muntinlupa CPO", province: "Metro Manila", region: "NCR" },
  { zip: "1780", city: "Alabang, Muntinlupa", province: "Metro Manila", region: "NCR" },
  { zip: "1800", city: "Marikina CPO", province: "Metro Manila", region: "NCR" },

  // --- Region I – Ilocos Region ---
  { zip: "2200", city: "Vigan", province: "Ilocos Sur", region: "Region I" },
  { zip: "2400", city: "Dagupan", province: "Pangasinan", region: "Region I" },
  { zip: "2404", city: "Alaminos", province: "Pangasinan", region: "Region I" },
  { zip: "2428", city: "Urdaneta", province: "Pangasinan", region: "Region I" },
  { zip: "2500", city: "San Fernando", province: "La Union", region: "Region I" },
  { zip: "2900", city: "Laoag", province: "Ilocos Norte", region: "Region I" },
  { zip: "2919", city: "Pagudpud", province: "Ilocos Norte", region: "Region I" },

  // --- Region II – Cagayan Valley ---
  { zip: "3300", city: "Ilagan", province: "Isabela", region: "Region II" },
  { zip: "3500", city: "Tuguegarao", province: "Cagayan", region: "Region II" },
  { zip: "3600", city: "Cauayan", province: "Isabela", region: "Region II" },
  { zip: "3700", city: "Santiago", province: "Isabela", region: "Region II" },

  // --- Region III – Central Luzon ---
  { zip: "2000", city: "San Fernando", province: "Pampanga", region: "Region III" },
  { zip: "2009", city: "Angeles", province: "Pampanga", region: "Region III" },
  { zip: "2010", city: "Mabalacat", province: "Pampanga", region: "Region III" },
  { zip: "2100", city: "Balanga", province: "Bataan", region: "Region III" },
  { zip: "2200", city: "Olongapo", province: "Zambales", region: "Region III" },
  { zip: "2300", city: "Tarlac City", province: "Tarlac", region: "Region III" },
  { zip: "3000", city: "Malolos", province: "Bulacan", region: "Region III" },
  { zip: "3019", city: "Marilao", province: "Bulacan", region: "Region III" },
  { zip: "3020", city: "Meycauayan", province: "Bulacan", region: "Region III" },
  { zip: "3023", city: "San Jose del Monte", province: "Bulacan", region: "Region III" },
  { zip: "3100", city: "Cabanatuan", province: "Nueva Ecija", region: "Region III" },
  { zip: "3132", city: "Palayan", province: "Nueva Ecija", region: "Region III" },

  // --- Region IV-A – CALABARZON ---
  { zip: "4000", city: "Calamba", province: "Laguna", region: "Region IV-A" },
  { zip: "4026", city: "Santa Rosa", province: "Laguna", region: "Region IV-A" },
  { zip: "4027", city: "Biñan", province: "Laguna", region: "Region IV-A" },
  { zip: "4031", city: "Los Baños", province: "Laguna", region: "Region IV-A" },
  { zip: "4100", city: "San Pablo", province: "Laguna", region: "Region IV-A" },
  { zip: "4102", city: "Bacoor", province: "Cavite", region: "Region IV-A" },
  { zip: "4103", city: "Imus", province: "Cavite", region: "Region IV-A" },
  { zip: "4107", city: "General Trias", province: "Cavite", region: "Region IV-A" },
  { zip: "4109", city: "Carmona", province: "Cavite", region: "Region IV-A" },
  { zip: "4114", city: "Dasmariñas", province: "Cavite", region: "Region IV-A" },
  { zip: "4115", city: "San Pedro", province: "Laguna", region: "Region IV-A" },
  { zip: "4200", city: "Batangas City", province: "Batangas", region: "Region IV-A" },
  { zip: "4210", city: "Lipa", province: "Batangas", region: "Region IV-A" },
  { zip: "4300", city: "Lucena", province: "Quezon", region: "Region IV-A" },
  { zip: "1800", city: "Cainta", province: "Rizal", region: "Region IV-A" }, 
  { zip: "1900", city: "Taytay", province: "Rizal", region: "Region IV-A" },
  { zip: "1920", city: "Antipolo", province: "Rizal", region: "Region IV-A" },

  // --- Region IV-B – MIMAROPA ---
  { zip: "5100", city: "Mamburao", province: "Occidental Mindoro", region: "Region IV-B" },
  { zip: "5200", city: "Calapan", province: "Oriental Mindoro", region: "Region IV-B" },
  { zip: "5300", city: "Puerto Princesa", province: "Palawan", region: "Region IV-B" },

  // --- Region V – Bicol ---
  { zip: "4400", city: "Naga", province: "Camarines Sur", region: "Region V" },
  { zip: "4500", city: "Legazpi", province: "Albay", region: "Region V" },
  { zip: "4600", city: "Daet", province: "Camarines Norte", region: "Region V" },
  { zip: "4700", city: "Sorsogon City", province: "Sorsogon", region: "Region V" },

  // --- Region VI – Western Visayas ---
  { zip: "5000", city: "Iloilo City", province: "Iloilo", region: "Region VI" },
  { zip: "5600", city: "Kalibo", province: "Aklan", region: "Region VI" },
  { zip: "5608", city: "Boracay (Malay)", province: "Aklan", region: "Region VI" },
  { zip: "6100", city: "Bacolod", province: "Negros Occidental", region: "Region VI" },

  // --- Region VII – Central Visayas ---
  { zip: "6000", city: "Cebu City", province: "Cebu", region: "Region VII" },
  { zip: "6001", city: "Consolacion", province: "Cebu", region: "Region VII" },
  { zip: "6002", city: "Liloan", province: "Cebu", region: "Region VII" },
  { zip: "6014", city: "Mandaue", province: "Cebu", region: "Region VII" },
  { zip: "6015", city: "Lapu-Lapu", province: "Cebu", region: "Region VII" },
  { zip: "6200", city: "Dumaguete", province: "Negros Oriental", region: "Region VII" },
  { zip: "6300", city: "Tagbilaran", province: "Bohol", region: "Region VII" },

  // --- Region VIII – Eastern Visayas ---
  { zip: "6500", city: "Tacloban", province: "Leyte", region: "Region VIII" },
  { zip: "6700", city: "Catbalogan", province: "Samar", region: "Region VIII" },
  { zip: "6710", city: "Calbayog", province: "Samar", region: "Region VIII" },

  // --- Region IX – Zamboanga Peninsula ---
  { zip: "7000", city: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX" },
  { zip: "7016", city: "Pagadian", province: "Zamboanga del Sur", region: "Region IX" },
  { zip: "7100", city: "Dipolog", province: "Zamboanga del Norte", region: "Region IX" },

  // --- Region X – Northern Mindanao ---
  { zip: "9000", city: "Cagayan de Oro", province: "Misamis Oriental", region: "Region X" },
  { zip: "9200", city: "Iligan", province: "Lanao del Norte", region: "Region X" },
  { zip: "7200", city: "Ozamiz", province: "Misamis Occidental", region: "Region X" },

  // --- Region XI – Davao Region ---
  { zip: "8000", city: "Davao City CPO", province: "Davao del Sur", region: "Region XI" },
  { zip: "8016", city: "Ateneo de Davao, Davao City", province: "Davao del Sur", region: "Region XI" },
  { zip: "8100", city: "Tagum", province: "Davao del Norte", region: "Region XI" },
  { zip: "8002", city: "Digos", province: "Davao del Sur", region: "Region XI" },
  { zip: "8200", city: "Mati", province: "Davao Oriental", region: "Region XI" },

  // --- Region XII – SOCCSKSARGEN ---
  { zip: "9400", city: "Kidapawan", province: "North Cotabato", region: "Region XII" },
  { zip: "9500", city: "General Santos", province: "South Cotabato", region: "Region XII" },
  { zip: "9506", city: "Koronadal", province: "South Cotabato", region: "Region XII" },

  // --- Region XIII – Caraga ---
  { zip: "8300", city: "Surigao City", province: "Surigao del Norte", region: "Region XIII" },
  { zip: "8311", city: "Tandag", province: "Surigao del Sur", region: "Region XIII" },
  { zip: "8600", city: "Butuan", province: "Agusan del Norte", region: "Region XIII" },

  // --- CAR – Cordillera Administrative Region ---
  { zip: "2600", city: "Baguio", province: "Benguet", region: "CAR" },
  { zip: "2616", city: "Bontoc", province: "Mountain Province", region: "CAR" },
  { zip: "3800", city: "Tabuk", province: "Kalinga", region: "CAR" },

  // --- BARMM – Bangsamoro ---
  { zip: "9600", city: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM" },
  { zip: "9700", city: "Marawi", province: "Lanao del Sur", region: "BARMM" },
];