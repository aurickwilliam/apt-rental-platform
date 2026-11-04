import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "../..");
const output = process.argv[2];
if (!output || !process.env.BROWSE_ESBUILD_PATH) throw new Error("Provide output directory and BROWSE_ESBUILD_PATH.");
const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.BROWSE_ESBUILD_PATH);
// Shared router/image/dynamic/favorites doubles; the fixture owns #fixture-actions.
const transports = path.resolve(here, "../recommendations/fixture-transports.jsx");
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(here, "fixture-app.jsx")], outfile: path.join(output, "fixture.js"),
  bundle: true, platform: "browser", format: "esm", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"', "process.env.NEXT_PUBLIC_SUPABASE_URL": '"https://example.test"' },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{ name: "search-toolbar-fixture-transports", setup(plugin) {
    plugin.onResolve({ filter: /^next\/(navigation|link|image|dynamic)$/ }, ({ path: source }) => ({ path: source, namespace: "fixture-next" }));
    plugin.onLoad({ filter: /.*/, namespace: "fixture-next" }, ({ path: source }) => ({
      contents: source === "next/navigation" ? `export { useRouter, useSearchParams } from ${JSON.stringify(transports)}` :
        source === "next/link" ? `export { FixtureLink as default, useLinkStatus } from ${JSON.stringify(transports)}` :
        `export { ${source === "next/image" ? "FixtureImage" : "fixtureDynamic"} as default } from ${JSON.stringify(transports)}`,
      loader: "js", resolveDir: here,
    }));
    plugin.onResolve({ filter: /^(@repo\/utils|@\/hooks\/(use-favorites|use-recent-apartment-searches))$/ }, () => ({ path: transports }));
    plugin.onResolve({ filter: /^@\// }, ({ path: source }) => {
      const base = path.join(web, source.slice(2));
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find((file) => existsSync(file));
      if (!resolved) throw new Error(`Unresolved fixture import ${source}`);
      return { path: resolved };
    });
  } }],
});
const { compile } = createRequire(require.resolve("@tailwindcss/postcss"))("@tailwindcss/node");
const css = path.join(web, "app/globals.css");
const compiler = await compile(await readFile(css, "utf8"), { base: path.dirname(css), onDependency() {} });
const candidates = new Set();
for (const file of [
  "app/browse/components/SearchContainer.tsx",
  "app/browse/lib/browse-layout.ts",
  "tests/search-toolbar/fixture-app.jsx",
]) {
  const source = await readFile(path.join(web, file), "utf8");
  for (const match of source.matchAll(/["`']([^"`'\n]+)["`']/g)) for (const candidate of match[1].split(/\s+/)) candidates.add(candidate);
}
await writeFile(path.join(output, "styles.css"), compiler.build([...candidates]));
await writeFile(path.join(output, "index.html"), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
console.log(`Search toolbar fixture built: ${output}`);
