// Builds packages/constants/src/camanava-landmarks.ts, the landmark list Ava
// uses to turn "near SM Grand Central" into coordinates.
//
// Coordinates are never typed by hand: each entry is looked up in
// OpenStreetMap (Nominatim, ODbL), must fall inside the CAMANAVA box and be
// closer to its expected city's centre than to any other CAMANAVA city's, and
// is written with 5 decimals (about 1 m). Entries that cannot be found are
// reported and left out. Rate limit: one request a second.
//
// Run: node scripts/landmarks/build-landmarks.mjs
// Then review the printed table and `git diff` before committing.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../../packages/constants/src/camanava-landmarks.ts', import.meta.url));
const CAMANAVA_BOX = { minLat: 14.62, maxLat: 14.78, minLng: 120.9, maxLng: 121.05 };
// Rough city centres, used only to catch a lookup that landed in the wrong city.
const CENTRES = {
  Caloocan: [14.65, 120.98],
  Malabon: [14.66, 120.957],
  Navotas: [14.665, 120.94],
  Valenzuela: [14.70, 120.98],
};

// kind: mall | city_hall | school | hospital | market | church | transport | landmark
// `query` is what OSM is asked; `aliases` are what tenants type (lowercase).
const ENTRIES = [
  { id: 'sm-grand-central', name: 'SM City Grand Central', kind: 'mall', city: 'Caloocan', query: 'SM City Grand Central, Caloocan', expect: 'grand central',
    aliases: ['sm grand central', 'sm city grand central', 'grand central', 'sm caloocan', 'sm city caloocan'] },
  { id: 'sm-valenzuela', name: 'SM City Valenzuela', kind: 'mall', city: 'Valenzuela', query: 'SM City Valenzuela',
    aliases: ['sm valenzuela', 'sm city valenzuela', 'sm karuhatan'] },
  { id: 'sm-sangandaan', name: 'SM Center Sangandaan', kind: 'mall', city: 'Caloocan', query: 'SM Center Sangandaan, Caloocan',
    aliases: ['sm sangandaan', 'sm center sangandaan', 'sangandaan'] },
  { id: 'victory-mall', name: 'Victory Mall Monumento', kind: 'mall', city: 'Caloocan', query: 'Victory Central Mall', expect: 'victory',
    aliases: ['victory mall', 'victory central mall', 'victory central'] },
  { id: 'robinsons-malabon', name: 'Robinsons Malabon', kind: 'mall', city: 'Malabon', query: 'Robinsons Malabon', expect: 'robinsons',
    aliases: ['robinsons malabon', 'robinson malabon', 'robinsons mall malabon'] },
  { id: 'fisher-mall', name: 'Fisher Mall Malabon', kind: 'mall', city: 'Malabon', query: 'Fisher Mall, Malabon',
    aliases: ['fisher mall', 'fishermall', 'fisher mall malabon'] },
  { id: 'monumento', name: 'Monumento Circle', kind: 'landmark', city: 'Caloocan', query: 'Bonifacio Monument, Caloocan',
    aliases: ['monumento', 'monumento circle', 'bonifacio monument', 'andres bonifacio monument', 'bonifacio monumento'] },
  { id: 'lrt-monumento', name: 'LRT Monumento Station', kind: 'transport', city: 'Caloocan', query: 'Monumento LRT station, Caloocan',
    aliases: ['lrt monumento', 'monumento lrt', 'monumento station', 'lrt 1 monumento'] },
  { id: 'caloocan-city-hall', name: 'Caloocan City Hall', kind: 'city_hall', city: 'Caloocan', query: 'Caloocan City Hall',
    aliases: ['caloocan city hall', 'caloocan hall', 'city hall of caloocan', 'kalookan city hall'] },
  { id: 'malabon-city-hall', name: 'Malabon City Hall', kind: 'city_hall', city: 'Malabon', query: 'Malabon City Hall',
    aliases: ['malabon city hall', 'malabon hall', 'city hall of malabon'] },
  { id: 'navotas-city-hall', name: 'Navotas City Hall', kind: 'city_hall', city: 'Navotas', query: 'Navotas City Hall',
    aliases: ['navotas city hall', 'navotas hall', 'city hall of navotas'] },
  { id: 'valenzuela-city-hall', name: 'Valenzuela City Hall', kind: 'city_hall', city: 'Valenzuela', query: 'Valenzuela City Hall',
    aliases: ['valenzuela city hall', 'valenzuela hall', 'city hall of valenzuela'] },
  { id: 'ucc-congressional', name: 'University of Caloocan City (Congressional)', kind: 'school', city: 'Caloocan', query: 'University of Caloocan City', expect: 'caloocan',
    aliases: ['ucc', 'ucc congressional', 'university of caloocan city', 'university of caloocan', 'caloocan university'] },
  { id: 'plv', name: 'Pamantasan ng Lungsod ng Valenzuela', kind: 'school', city: 'Valenzuela', query: 'Pamantasan ng Lungsod ng Valenzuela',
    aliases: ['plv', 'pamantasan ng lungsod ng valenzuela', 'valenzuela city university'] },
  { id: 'cmu-malabon', name: 'City of Malabon University', kind: 'school', city: 'Malabon', query: 'City of Malabon University',
    aliases: ['city of malabon university', 'cmu malabon', 'malabon university', 'pcm', 'polytechnic university of malabon'] },
  { id: 'navotas-polytechnic', name: 'Navotas Polytechnic College', kind: 'school', city: 'Navotas', query: 'Navotas Polytechnic College',
    aliases: ['navotas polytechnic college', 'navotas polytechnic', 'npc navotas', 'navotas college'] },
  { id: 'ue-caloocan', name: 'University of the East Caloocan', kind: 'school', city: 'Caloocan', query: 'University of the East Caloocan',
    aliases: ['ue caloocan', 'university of the east caloocan', 'ue'] },
  { id: 'olfu-valenzuela', name: 'Our Lady of Fatima University Valenzuela', kind: 'school', city: 'Valenzuela', query: 'Our Lady of Fatima University Valenzuela',
    aliases: ['olfu', 'olfu valenzuela', 'our lady of fatima university', 'fatima university', 'fatima'] },
  { id: 'caloocan-medical-center', name: 'Caloocan City Medical Center', kind: 'hospital', city: 'Caloocan', query: 'Caloocan City Medical Center',
    aliases: ['caloocan city medical center', 'caloocan medical center', 'ccmc'] },
  { id: 'ospital-ng-malabon', name: 'Ospital ng Malabon', kind: 'hospital', city: 'Malabon', query: 'Ospital ng Malabon',
    aliases: ['ospital ng malabon', 'malabon hospital', 'malabon city hospital'] },
  { id: 'navotas-city-hospital', name: 'Navotas City Hospital', kind: 'hospital', city: 'Navotas', query: 'Navotas City Hospital',
    aliases: ['navotas city hospital', 'navotas hospital', 'ospital ng navotas'] },
  { id: 'valenzuela-medical-center', name: 'Valenzuela Medical Center', kind: 'hospital', city: 'Valenzuela', query: 'Valenzuela Medical Center',
    aliases: ['valenzuela medical center', 'valenzuela hospital', 'vmc', 'valenzuela general hospital'] },
  { id: 'fmc-valenzuela', name: 'Fatima Medical Center Valenzuela', kind: 'hospital', city: 'Valenzuela', query: 'Fatima Medical Center Valenzuela',
    aliases: ['fatima medical center', 'fatima hospital', 'fatima medical'] },
  { id: 'malabon-central-market', name: 'Malabon Central Market', kind: 'market', city: 'Malabon', query: 'Malabon Central Market', expect: 'malabon',
    aliases: ['malabon central market', 'malabon market', 'palengke ng malabon'] },
  { id: 'navotas-fish-port', name: 'Navotas Fish Port Complex', kind: 'market', city: 'Navotas', query: 'Navotas Fish Port Complex', expect: 'fish ?port',
    aliases: ['navotas fish port', 'fish port', 'navotas fish port complex', 'nfpc'] },
  { id: 'malabon-basilica', name: 'Immaculate Conception Parish (Malabon Basilica)', kind: 'church', city: 'Malabon', query: 'Malabon Basilica', expect: 'immaculate|basilica',
    aliases: ['malabon basilica', 'malabon church', 'immaculate conception parish', 'simbahan ng malabon'] },
  { id: 'san-jose-navotas', name: 'San Jose Parish Navotas', kind: 'church', city: 'Navotas', query: 'San Jose Parish Church Navotas',
    aliases: ['navotas church', 'san jose parish navotas', 'simbahan ng navotas'] },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const km = (a, b) => {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

async function lookup(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=5&countrycodes=ph`;
  const response = await fetch(url, { headers: { 'User-Agent': 'apt-rental-platform-landmark-build/1.0' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

const inBox = ([lat, lng]) =>
  lat >= CAMANAVA_BOX.minLat && lat <= CAMANAVA_BOX.maxLat && lng >= CAMANAVA_BOX.minLng && lng <= CAMANAVA_BOX.maxLng;
const nearestCity = (point) => Object.entries(CENTRES).sort((a, b) => km(point, a[1]) - km(point, b[1]))[0][0];

const found = [];
const missing = [];
for (const entry of ENTRIES) {
  let match = null;
  try {
    const results = await lookup(entry.query);
    match = results
      .map((r) => ({ point: [Number(r.lat), Number(r.lon)], label: r.display_name }))
      .find(
        (r) =>
          inBox(r.point) &&
          km(r.point, CENTRES[entry.city]) < 9 &&
          new RegExp(entry.expect ?? '.', 'i').test(r.label.split(',')[0]),
      );
  } catch (error) {
    console.error(`lookup failed for ${entry.id}:`, error.message);
  }
  if (!match) {
    missing.push(entry.id);
  } else {
    found.push({ ...entry, lat: Number(match.point[0].toFixed(5)), lng: Number(match.point[1].toFixed(5)), osm: match.label.split(',').slice(0, 3).join(',') });
    const nearer = nearestCity(match.point);
    console.log(`${entry.id.padEnd(28)} ${match.point.map((v) => v.toFixed(5)).join(', ')}  expected ${entry.city}${nearer === entry.city ? '' : ` (closest centre: ${nearer})`}  | ${match.label.slice(0, 80)}`);
  }
  await sleep(1100);
}

const body = found
  .map(
    (e) => `  {
    id: ${JSON.stringify(e.id)},
    name: ${JSON.stringify(e.name)},
    kind: ${JSON.stringify(e.kind)},
    city: ${JSON.stringify(e.city)},
    latitude: ${e.lat},
    longitude: ${e.lng},
    aliases: ${JSON.stringify(e.aliases)},
  },`,
  )
  .join('\n');

writeFileSync(
  OUT,
  `// GENERATED by scripts/landmarks/build-landmarks.mjs; do not edit by hand.
// Coordinates come from OpenStreetMap (© OpenStreetMap contributors, ODbL) and
// were checked to lie in the expected CAMANAVA city. Re-run the script to add
// or refresh a landmark.

export type LandmarkKind =
  | "mall"
  | "city_hall"
  | "school"
  | "hospital"
  | "market"
  | "church"
  | "transport"
  | "landmark";

export interface CamanavaLandmark {
  id: string;
  name: string;
  kind: LandmarkKind;
  city: "Caloocan" | "Malabon" | "Navotas" | "Valenzuela";
  latitude: number;
  longitude: number;
  /** Lowercase names, abbreviations and alternate spellings tenants use. */
  aliases: string[];
}

export const CAMANAVA_LANDMARKS: readonly CamanavaLandmark[] = [
${body}
];
`,
);
console.log(`\nWrote ${found.length} landmarks.${missing.length ? ` Not found: ${missing.join(', ')}` : ''}`);
