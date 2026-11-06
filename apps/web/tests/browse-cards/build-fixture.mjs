// Production Browse/card/hover components and installed HeroUI; only external transports are replaced.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const output = process.argv[2];
const entry = process.argv[3] === "ranking" ? "ranking-fixture-app.jsx"
  : process.argv[3] === "recommendations" ? "recommendation-fixture-app.jsx" : "fixture-app.jsx";
if (!output || !process.env.BROWSE_ESBUILD_PATH) throw new Error("Provide output and BROWSE_ESBUILD_PATH");
const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.BROWSE_ESBUILD_PATH);
const { compile } = createRequire(require.resolve("@tailwindcss/postcss"))("@tailwindcss/node");
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(web, "tests/browse-cards", entry)], outfile: path.join(output, "fixture.js"),
  bundle: true, platform: "browser", format: "esm", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{ name: "browse-transports", setup(plugin) {
    plugin.onResolve({ filter: /^next\/(dynamic|image|link)$/ }, ({ path: module }) => ({ path: module, namespace: "browse-next" }));
    plugin.onLoad({ filter: /.*/, namespace: "browse-next" }, ({ path: module }) => ({ resolveDir: web, contents:
      `export { ${module === "next/image" ? "Image" : module === "next/link" ? "Link" : "dynamic"} as default } from ${JSON.stringify(path.join(web, "tests/browse-cards/fixture-transports.jsx"))};`,
    }));
    plugin.onResolve({ filter: /^next\/navigation$|^@\/hooks\/(use-favorites|use-recent-apartment-searches|use-user)$|^\.\/use-user$/ }, () => ({
      path: path.join(web, "tests/browse-cards/fixture-transports.jsx"),
    }));
    // Export the actual shared criteria, not a fixture matching implementation.
    plugin.onResolve({ filter: /^@repo\/utils$/ }, () => ({ path: "utils", namespace: "browse-utils" }));
    plugin.onLoad({ filter: /.*/, namespace: "browse-utils" }, () => ({ resolveDir: web, contents:
      `export * from ${JSON.stringify(path.resolve(web, "../../packages/utils/src/browseRows.ts"))};
       export { formatPesoDisplay } from ${JSON.stringify(path.resolve(web, "../../packages/utils/src/formatCurrencyInput.ts"))};`,
    }));
  } }],
});
const files = [
  "app/components/ui/ApartmentCard.tsx", "app/components/ui/PreferenceMatchChips.tsx", "app/components/display/StatusChip.tsx",
  "app/browse/components/ApartmentHoverPreview.tsx", "app/browse/components/BrowseSectionsList.tsx",
  "app/browse/components/RenderApartments.tsx", "app/browse/lib/browse-layout.ts", `tests/browse-cards/${entry}`,
];
const sources = await Promise.all(files.map(file => readFile(path.join(web, file), "utf8")));
const candidates = sources.flatMap(source => [...source.matchAll(/["'`]([^"'`\n]+)["'`]/g)].flatMap(match => match[1].split(/\s+/)));
const cssPath = path.join(web, "app/globals.css");
const compiler = await compile(await readFile(cssPath, "utf8"), { base: path.dirname(cssPath), onDependency() {} });
await writeFile(path.join(output, "styles.css"), compiler.build(candidates));
await writeFile(path.join(output, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"></head>
  <body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`);
console.log(`Browse card fixture: ${output}`);
