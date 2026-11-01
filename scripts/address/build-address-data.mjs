#!/usr/bin/env node
// Regenerates packages/constants/src/address/ph-addresses.ts: every Philippine province,
// city/municipality and barangay the address forms offer, as province -> city -> barangays.
//
//   node --experimental-strip-types scripts/address/build-address-data.mjs \
//     --psgc <folder with the four files below> [--out <file>] [--legacy <file>]
//
// Inputs (the script never touches the network; `node scripts/address/fetch-psgc.mjs <folder>` downloads
// them, taking about 20 minutes). All four come from the PSGC Cloud API (https://psgc.cloud/api, the
// Philippine Statistics Authority's PSGC; it limits callers to 120 requests a minute):
//   provinces.json            GET /api/provinces
//   cities-municipalities.json  GET /api/cities-municipalities
//   sub-municipalities.json   GET /api/sub-municipalities
//   barangays-by-code.json    { "<10-digit city/municipality/sub-municipality code>": ["barangay", ...] }
//                             built from GET /api/cities-municipalities/{code}/barangays (and
//                             /api/sub-municipalities/{code}/barangays for the districts of Manila)
//
// The lists already in the output file win wherever they cover the same places (they keep the PSA's
// spelling, "Sta. Cruz", and the barangays listings already use), so a regeneration only changes
// what PSGC changed. Optional `--legacy <file>` seeds that from the table the app shipped before
// the nested one (keyed by city name alone, `{ city: [barangays] }`, from the PSA's own datafile).
// That table is wrong for any city name that repeats (every San Fernando held the barangays of all
// of them), so it is only used for a name that is unique in the country.
//
// Metro Manila is the app's name for the National Capital Region. The 18 highly urbanized and
// independent cities that PSGC lists outside any province are filed under the province they
// sit in. The Special Geographic Area clusters (BARMM, inside Cotabato) are filed under Cotabato.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, index, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs), []),
);
if (!args.psgc) {
  console.error("Usage: build-address-data.mjs --psgc <folder> [--out <file>] [--legacy <file>]");
  process.exit(1);
}
const outPath = args.out ?? fileURLToPath(new URL("../../packages/constants/src/address/ph-addresses.ts", import.meta.url));
const read = (name) => JSON.parse(readFileSync(`${args.psgc}/${name}`, "utf8"));
const provinces = read("provinces.json");
const places = read("cities-municipalities.json");
const barangaysByCode = read("barangays-by-code.json");
const legacy = args.legacy ? JSON.parse(readFileSync(args.legacy, "utf8")) : {};
const previous = existsSync(outPath) ? (await import(pathToFileURL(outPath).href)).PH_ADDRESSES : {};

// The API returns UTF-8 read as Latin-1 ("PeÃ±arrubia"), and pads some names with a space.
const clean = (text) => (/[ÃÂ]/.test(text) ? Buffer.from(text, "latin1").toString("utf8") : text).replace(/\s+/g, " ").trim();
const byText = (a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });

// Highly urbanized / independent cities PSGC lists with their own province-style code.
const CITY_PROVINCES = {
  "0330100000": "Pampanga", // Angeles
  "0331400000": "Zambales", // Olongapo
  "0431200000": "Quezon", // Lucena
  "1731500000": "Palawan", // Puerto Princesa
  "0631000000": "Iloilo", // Iloilo City
  "0630200000": "Negros Occidental", // Bacolod
  "0730600000": "Cebu", // Cebu City
  "0731100000": "Cebu", // Lapu-Lapu
  "0731300000": "Cebu", // Mandaue
  "0831600000": "Leyte", // Tacloban
  "0931700000": "Zamboanga del Sur", // Zamboanga City
  "0990101000": "Basilan", // Isabela City
  "1030900000": "Lanao del Norte", // Iligan
  "1030500000": "Misamis Oriental", // Cagayan de Oro
  "1130700000": "Davao del Sur", // Davao City
  "1230800000": "South Cotabato", // General Santos
  "1430300000": "Benguet", // Baguio
  "1630400000": "Agusan del Norte", // Butuan
};
const NCR_REGION = "13";
const SPECIAL_GEOGRAPHIC_AREA = "1999";

const provinceByPrefix = Object.fromEntries(provinces.map((province) => [province.code.slice(0, 5), clean(province.name)]));
function provinceOf(place) {
  if (place.code.startsWith(NCR_REGION)) return "Metro Manila";
  if (place.code.startsWith(SPECIAL_GEOGRAPHIC_AREA)) return "Cotabato";
  return CITY_PROVINCES[place.code] ?? provinceByPrefix[place.code.slice(0, 5)];
}

// The label the forms show: PSGC's name without the "City of" prefix, with the small words the
// way Filipino place names are written.
const PARTICLES = /(?<=\S) (De|Del|Sa|Y) /g;
const label = (name) => clean(name).replace(/^(Science City of|Island Garden City of|City of) /, "").replace(PARTICLES, (match) => match.toLowerCase());

// Labels the app already stored in profiles, listings and the ZIP table, where the generic rule
// above would write something else. Keys are "<province>|<generic label>".
const CITY_LABELS = {
  "Metro Manila|Pasay City": "Pasay",
  "Cagayan|Tuguegarao City": "Tuguegarao",
  "Nueva Ecija|San Jose City": "San Jose",
  "Pampanga|Mabalacat City": "Mabalacat",
  "Tarlac|Tarlac": "Tarlac City",
  "Batangas|Sto. Tomas": "Santo Tomas",
  "Cavite|Cavite": "Cavite City",
  "Masbate|Masbate": "Masbate City",
  "Sorsogon|Sorsogon": "Sorsogon City",
  "Antique|Anini-Y": "Anini-y",
  "Antique|Laua-An": "Laua-an",
  "Capiz|Roxas": "Roxas City",
  "Iloilo|Iloilo": "Iloilo City",
  "Cebu|Cebu": "Cebu City",
  "Cebu|Danao City": "Danao",
  "Leyte|Ormoc City": "Ormoc",
  "Zamboanga del Sur|Zamboanga": "Zamboanga City",
  "Davao del Sur|Davao": "Davao City",
  "Surigao del Norte|Surigao": "Surigao City",
  "Basilan|Isabela": "Isabela City",
  // Written out in full, or told apart from a province of the same name.
  "Nueva Vizcaya|Alfonso Castaneda": "Alfonso Castañeda",
  "Maguindanao del Sur|Gen. S.K. Pendatun": "General Salipada K. Pendatun",
  "Maguindanao del Norte|Cotabato": "Cotabato City",
};

// Cities whose existing list must stay even though PSGC Cloud lists different places: Barangay 176
// of Caloocan is split in six (176-A to 176-F), which listings already use, and ten barangays
// (Cembo, Pembo, ...) belong to Taguig rather than Makati since the Supreme Court ruling.
const KEEP_EXISTING = new Set(["Metro Manila|Caloocan", "Metro Manila|Makati", "Metro Manila|Taguig"]);

// Spelling-insensitive form of a barangay name: "Sta. Cruz", "Santa Cruz" and "Luna (Jaro)" vs "Luna".
const fold = (name) =>
  name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\(.*?\)/g, "")
    .replace(/\bsta\.? /g, "santa ").replace(/\bsto\.? /g, "santo ").replace(/\bst\.? /g, "saint ")
    .replace(/[^a-z0-9]+/g, " ").trim();

const result = {};
const unplaced = [];
for (const place of places) {
  if (place.type === "SubMun") continue;
  const province = provinceOf(place);
  if (!province) {
    unplaced.push(place.name);
    continue;
  }
  const generic = label(place.name);
  const city = CITY_LABELS[`${province}|${generic}`] ?? generic;
  const cities = (result[province] ??= {});
  if (city in cities) throw new Error(`Two places called ${city} in ${province}`);
  const codes = place.code === "1380600000" ? read("sub-municipalities.json").filter((sub) => sub.code.startsWith("13806")).map((sub) => sub.code) : [place.code];
  cities[city] = [...new Set(codes.flatMap((code) => barangaysByCode[code] ?? []).map(clean))];
}
if (unplaced.length) throw new Error(`No province for: ${unplaced.join(", ")}`);

// Keep the existing list where it covers every barangay PSGC Cloud lists (the PSA's own spelling).
const cityCount = {};
for (const cities of Object.values(result)) for (const city of Object.keys(cities)) cityCount[city] = (cityCount[city] ?? 0) + 1;
const keptExisting = [];
for (const [province, cities] of Object.entries(result)) {
  for (const [city, names] of Object.entries(cities)) {
    const old = previous[province]?.[city] ?? (cityCount[city] === 1 ? legacy[city] : undefined);
    if (!old) continue;
    const oldFolded = new Set(old.map(fold));
    // A list with many more barangays than PSGC Cloud's is a name collision, not the same place.
    const sameCity = names.every((name) => oldFolded.has(fold(name))) && old.length <= names.length + Math.max(3, names.length * 0.1);
    if (KEEP_EXISTING.has(`${province}|${city}`) || sameCity) {
      if (old.length !== names.length || old.some((name) => !names.includes(name))) keptExisting.push(`${province} / ${city}`);
      cities[city] = [...old];
    }
  }
}
for (const cities of Object.values(result)) for (const city of Object.keys(cities)) cities[city] = [...new Set(cities[city])].sort(byText);

const sortedProvinces = Object.keys(result).sort((a, b) => (a === "Metro Manila" ? -1 : b === "Metro Manila" ? 1 : byText(a, b)));
const lines = sortedProvinces.map((province) => {
  const rows = Object.keys(result[province]).sort(byText).map((city) => `  ${JSON.stringify(city)}: ${JSON.stringify(result[province][city])},`);
  return `${JSON.stringify(province)}: {\n${rows.join("\n")}\n},`;
});
const empty = Object.entries(result).flatMap(([province, cities]) => Object.entries(cities).filter(([, names]) => names.length === 0).map(([city]) => `${province} / ${city}`));
const totalCities = Object.values(result).reduce((total, cities) => total + Object.keys(cities).length, 0);
const barangayCount = Object.values(result).reduce((total, cities) => total + Object.values(cities).reduce((sum, names) => sum + names.length, 0), 0);

writeFileSync(outPath, `// Generated by scripts/address/build-address-data.mjs. Do not edit by hand.
//
// Every province, city/municipality and barangay of the Philippines, from the Philippine Statistics
// Authority's PSGC (through the PSGC Cloud API): ${sortedProvinces.length} provinces (Metro Manila is the National
// Capital Region), ${totalCities} cities and municipalities, ${barangayCount} barangays. Barangays are nested under their
// province and city because many city names repeat (there are several San Fernando and Santa Cruz).

export const PH_ADDRESSES: Readonly<Record<string, Readonly<Record<string, string[]>>>> = {
${lines.join("\n")}
};

const PROVINCE_NAMES = ${JSON.stringify(sortedProvinces)} as const;

export type Province = (typeof PROVINCE_NAMES)[number];

export const PROVINCES: Province[] = [...PROVINCE_NAMES];
`);
console.log(`Wrote ${sortedProvinces.length} provinces, ${totalCities} cities and ${barangayCount} barangays to ${outPath}`);
console.log(`Cities that kept their existing barangay spelling: ${keptExisting.length}`);
console.log(`Cities with no barangay in the source: ${empty.length ? empty.join("; ") : "none"}`);
