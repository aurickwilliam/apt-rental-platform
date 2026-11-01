#!/usr/bin/env node
// Downloads the PSGC Cloud files that build-address-data.mjs reads into a folder.
//
//   node scripts/address/fetch-psgc.mjs <output folder>
//
// PSGC Cloud (https://psgc.cloud/api) allows 120 requests a minute, and there is one request per
// city/municipality, so a full run takes about 20 minutes. It saves its progress, so run it again
// after an interruption and it carries on where it stopped.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const folder = process.argv[2];
if (!folder) {
  console.error("Usage: fetch-psgc.mjs <output folder>");
  process.exit(1);
}
mkdirSync(folder, { recursive: true });

const API = "https://psgc.cloud/api";
const PAUSE_MS = 600;
const RETRIES = 8;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(path) {
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const response = await fetch(`${API}/${path}`).catch(() => null);
    if (response?.ok) return response.json();
    await sleep(response?.status === 429 ? 20_000 : 1000 * attempt);
  }
  throw new Error(`Could not fetch ${path}`);
}

const listings = {};
for (const name of ["provinces", "cities-municipalities", "sub-municipalities"]) {
  listings[name] = await get(name);
  writeFileSync(`${folder}/${name}.json`, JSON.stringify(listings[name]));
  await sleep(PAUSE_MS);
}

const progressPath = `${folder}/barangays-by-code.json`;
const barangays = existsSync(progressPath) ? JSON.parse(readFileSync(progressPath, "utf8")) : {};
const units = [...listings["cities-municipalities"], ...listings["sub-municipalities"]];
let fetched = 0;
for (const { code, type } of units) {
  if (code in barangays) continue;
  const kind = type === "SubMun" ? "sub-municipalities" : "cities-municipalities";
  barangays[code] = (await get(`${kind}/${code}/barangays`)).map((barangay) => barangay.name);
  fetched += 1;
  if (fetched % 50 === 0) {
    writeFileSync(progressPath, JSON.stringify(barangays));
    console.log(`${Object.keys(barangays).length} of ${units.length}`);
  }
  await sleep(PAUSE_MS);
}
writeFileSync(progressPath, JSON.stringify(barangays));
console.log(`Saved ${Object.keys(barangays).length} lists to ${folder}`);
