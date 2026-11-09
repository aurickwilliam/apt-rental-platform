// Usage: PROPERTY_MODAL_ESBUILD_PATH=/temporary/tools/node_modules/esbuild \
// node apps/web/tests/property-details-modal/build-fixture.mjs /temporary/output
//
// Bundles the production My Properties table, drawer and edit dialog with the
// real HeroUI styles. Only transport (Supabase), identity, Next navigation and
// the two out-of-scope children are replaced; nothing can reach the network.
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "../..");
const output = process.argv[2];
if (!output || !process.env.PROPERTY_MODAL_ESBUILD_PATH) {
  throw new Error(
    "Provide an output directory and PROPERTY_MODAL_ESBUILD_PATH (temporary esbuild installation).",
  );
}

const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.PROPERTY_MODAL_ESBUILD_PATH);
const tailwindPath = require.resolve("@tailwindcss/postcss");
const { compile } = createRequire(tailwindPath)("@tailwindcss/node");
await mkdir(output, { recursive: true });

await build({
  entryPoints: [path.join(here, "fixture-app.jsx")],
  outfile: path.join(output, "fixture.js"),
  bundle: true,
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [
    path.join(web, "node_modules"),
    path.resolve(web, "../../node_modules"),
  ],
  plugins: [
    {
      name: "isolated-property-modal-fixtures",
      setup(plugin) {
        plugin.onResolve({ filter: /^next\/(navigation|link|dynamic|image)$/ }, ({ path: source }) => ({
          path: source,
          namespace: "next-fixture",
        }));
        plugin.onLoad({ filter: /.*/, namespace: "next-fixture" }, ({ path: source }) => ({
          contents:
            source === "next/navigation"
              ? `export { useRouter, useSearchParams, usePathname } from ${JSON.stringify(path.join(here, "fixture-next.jsx"))}`
              : `export { ${source === "next/link" ? "FixtureLink" : source === "next/dynamic" ? "dynamic" : "FixtureImage"} as default } from ${JSON.stringify(path.join(here, "fixture-next.jsx"))}`,
          loader: "js",
          resolveDir: here,
        }));
        plugin.onResolve({ filter: /^@repo\/supabase(\/.*)?$/ }, () => ({
          path: path.join(here, "fixture-supabase.jsx"),
        }));
        // The map picker needs an API key and the verification button is a
        // server action; neither participates in overlay behavior.
        plugin.onResolve({ filter: /(^|\/)(GoogleMapPicker|SubmitApartmentVerificationButton)$/ }, () => ({
          path: path.join(here, "fixture-stubs.jsx"),
        }));
        plugin.onResolve({ filter: /^@\// }, ({ path: source }) => {
          const base = path.join(web, source.slice(2));
          const resolved = [base, `${base}.ts`, `${base}.tsx`].find((file) => existsSync(file));
          if (!resolved) throw new Error(`Cannot resolve fixture import: ${source}`);
          return { path: resolved };
        });
      },
    },
  ],
});

// Compile the real global stylesheet. Tailwind's automatic source detection
// covers app/**, and the fixture's own utilities are added as candidates.
const cssPath = path.join(web, "app/globals.css");
const fixtureFiles = ["fixture-app.jsx", "fixture-stubs.jsx"].map((name) => path.join(here, name));
const candidates = new Set();
for (const file of fixtureFiles) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/className="([^"]+)"/g)) {
    for (const candidate of match[1].split(/\s+/)) if (candidate) candidates.add(candidate);
  }
}
const compiler = await compile(await readFile(cssPath, "utf8"), {
  base: path.dirname(cssPath),
  onDependency() {},
});
await writeFile(path.join(output, "styles.css"), compiler.build([...candidates]));

await writeFile(
  path.join(output, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`,
);
console.log(`Isolated property-details modal fixture: ${output}`);
