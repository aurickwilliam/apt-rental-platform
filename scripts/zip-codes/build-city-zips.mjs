#!/usr/bin/env node
// Regenerates packages/constants/src/address/ph-city-zips.ts: the ZIP codes of
// every non-NCR city in `CITIES`, matched by province and city name.
//
//   node --experimental-strip-types scripts/zip-codes/build-city-zips.mjs \
//     --phlpost <ph_zip_codes.json> --community <postal-codes-2024.json>
//
// Inputs (download them first; the script never touches the network):
//   --phlpost    `phzipcodes` package data (https://github.com/jayson-panganiban/phzipcodes,
//                scraped from https://phlpost.gov.ph/zip-code-locator/), grouped by region,
//                province and city name.
//   --community  `postal-codes-2024.json` from https://github.com/kon2raya24/ph-postal-php
//                (GeoNames, CC BY 4.0, joined to PSGC): covers the provinces the PHLPost
//                locator page no longer lists (most of the Visayas, Zamboanga, BARMM).
//
// Metro Manila is not generated: it is a set of contiguous blocks per city
// (`METRO_MANILA_ZIP_RANGES` in address.ts). The script only checks that every NCR ZIP
// in the inputs falls inside one of those blocks.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, index, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs), []),
);
if (!args.phlpost || !args.community) {
  console.error("Usage: build-city-zips.mjs --phlpost <file> --community <file> [--out <file>]");
  process.exit(1);
}
const outPath = args.out ?? fileURLToPath(new URL("../../packages/constants/src/address/ph-city-zips.ts", import.meta.url));
const { CITIES, METRO_MANILA_ZIP_RANGES } = await import("../../packages/constants/src/address/address.ts");

const phlpost = JSON.parse(readFileSync(args.phlpost, "utf8"));
const community = JSON.parse(readFileSync(args.community, "utf8")).postal_codes;

const ZIP = /^\d{4}$/;

// Community-source province codes that cannot be learned from unambiguous matches.
const PROVINCE_CODE_OVERRIDES = { Basilan: "1507", Capiz: "0619", "La Union": "0133", "Southern Leyte": "0864" };

// App city name -> the spelling the sources use (renamed, abbreviated or misspelled there).
const SOURCE_NAMES = {
  "Cavite|Trece Martires": "Trece Martirez City",
  "Misamis Occidental|Ozamiz": "Ozamis City",
  "Antique|San Jose de Buenavista": "San Jose de Buanavista",
  "Maguindanao del Norte|Datu Blah Sinsuat": "Datu Blah T. Sinsuat",
  "Maguindanao del Norte|Kabuntalan": "Northern Kabuntalan",
  "Maguindanao del Sur|Raja Buayan": "Rajah Buayan",
  "Sulu|Kalingalan Caluang": "Kalingalan Kalauang",
  "Sulu|Old Panamao": "Panamao",
  "Tawi-Tawi|Turtle Islands": "Turtle Island",
};

function normalize(text) {
  return text
    .normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\bgen\.? /g, "general ").replace(/\bsta\.? /g, "santa ").replace(/\bsto\.? /g, "santo ").replace(/\bst\.? /g, "saint ")
    .replace(/\bcity of\b|\bcity\b|\bmunicipality of\b/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}
const normalizeProvince = (name) => normalize(name).replace("camarines sur camsur", "camarines sur").replace("cotabato north", "north cotabato");

const byProvince = new Map(); // normalized province -> normalized city -> Set(zip)
for (const provinces of Object.values(phlpost)) {
  for (const [province, cities] of Object.entries(provinces)) {
    const cityMap = byProvince.get(normalizeProvince(province)) ?? new Map();
    byProvince.set(normalizeProvince(province), cityMap);
    for (const [city, zips] of Object.entries(cities)) {
      const set = cityMap.get(normalize(city)) ?? new Set();
      zips.filter((zip) => ZIP.test(zip)).forEach((zip) => set.add(zip));
      cityMap.set(normalize(city), set);
    }
  }
}
const byName = new Map(); // normalized city -> community entries
for (const entry of community) {
  const key = normalize(entry.cityMun);
  byName.set(key, [...(byName.get(key) ?? []), entry]);
}

const sourceName = (province, city) => SOURCE_NAMES[`${province}|${city}`] ?? city;

// Learn each province's community-source code from cities whose name is unique there.
const votes = new Map();
for (const [province, cities] of Object.entries(CITIES)) {
  if (province === "Metro Manila") continue;
  for (const city of cities) {
    const codes = new Set((byName.get(normalize(sourceName(province, city))) ?? []).filter((e) => e.cityMunCode).map((e) => e.cityMunCode.slice(0, 4)));
    if (codes.size !== 1) continue;
    const [code] = codes;
    const tally = votes.get(province) ?? new Map();
    tally.set(code, (tally.get(code) ?? 0) + 1);
    votes.set(province, tally);
  }
}
const provinceCode = { ...Object.fromEntries([...votes].map(([province, tally]) => [province, [...tally].sort((a, b) => b[1] - a[1])[0][0]])), ...PROVINCE_CODE_OVERRIDES };

const result = {};
const missing = [];
for (const [province, cities] of Object.entries(CITIES)) {
  if (province === "Metro Manila") continue;
  for (const city of cities) {
    const name = sourceName(province, city);
    const zips = new Set(byProvince.get(normalizeProvince(province))?.get(normalize(name)) ?? []);
    const code = provinceCode[province];
    for (const entry of byName.get(normalize(name)) ?? []) {
      // Entries the PSGC join could not resolve still carry their region.
      const sameProvince = entry.cityMunCode ? entry.cityMunCode.slice(0, 4) === code : code && entry.region === code.slice(0, 2);
      if (sameProvince && ZIP.test(entry.zip)) zips.add(entry.zip);
    }
    if (zips.size === 0) missing.push(`${province} / ${city}`);
    else (result[province] ??= {})[city] = [...zips].sort();
  }
}

// Every NCR ZIP in the sources must sit inside exactly one city block.
const outsideBlocks = new Set();
const ncrZips = [
  ...Object.values(phlpost).flatMap((provinces) => Object.entries(provinces).filter(([province]) => province === "Metro Manila").flatMap(([, cities]) => Object.values(cities).flat())),
  ...community.filter((entry) => entry.region === "13").map((entry) => entry.zip),
];
for (const zip of ncrZips.filter((value) => ZIP.test(value))) {
  const hits = Object.values(METRO_MANILA_ZIP_RANGES).filter((range) => Number(zip) >= range.min && Number(zip) <= range.max).length;
  if (hits !== 1) outsideBlocks.add(zip);
}

const lines = Object.entries(result).map(([province, cities]) => {
  const rows = Object.entries(cities).map(([city, zips]) => `    ${JSON.stringify(city)}: [${zips.map((zip) => `"${zip}"`).join(", ")}],`);
  return `  ${JSON.stringify(province)}: {\n${rows.join("\n")}\n  },`;
});
const today = new Date().toISOString().slice(0, 10);
writeFileSync(outPath, `// Generated by scripts/zip-codes/build-city-zips.mjs on ${today}. Do not edit by hand.
//
// ZIP codes per non-NCR city, keyed by the province and city names in \`CITIES\`
// (Metro Manila uses METRO_MANILA_ZIP_RANGES). Union of:
//   - PHLPost's ZIP code locator (https://phlpost.gov.ph/zip-code-locator/), through
//     the \`phzipcodes\` package. The live page now lists only part of the country, but every
//     row it still shows is in this data unchanged.
//   - the GeoNames-based \`postal-codes-2024\` dataset (CC BY 4.0, © GeoNames) for provinces
//     the locator page no longer lists, including Davao City's 8016-8026.
// Cities missing here have no published ZIP in either source and get the format check only.

export const PH_CITY_ZIPS: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
${lines.join("\n")}
};
`);

console.log(`Wrote ${Object.values(result).reduce((total, cities) => total + Object.keys(cities).length, 0)} cities to ${outPath}`);
console.log(`No ZIP found (format check only): ${missing.length ? missing.join("; ") : "none"}`);
console.log(`NCR ZIPs outside every Metro Manila block: ${outsideBlocks.size ? [...outsideBlocks].sort().join(", ") : "none"}`);
