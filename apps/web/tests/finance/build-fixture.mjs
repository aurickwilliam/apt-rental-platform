// Usage: FINANCE_ESBUILD_PATH=/temporary/tools/node_modules/esbuild \
// node apps/web/tests/finance/build-fixture.mjs /temporary/output
// Uses existing production components, hooks and compiled CSS. Only transport,
// identity and Next navigation are replaced; no hosted requests can be made.
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, writeFile, readdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "../..");
const output = process.argv[2];
if (!output || !process.env.FINANCE_ESBUILD_PATH)
  throw new Error(
    "Provide output path and FINANCE_ESBUILD_PATH (temporary esbuild installation).",
  );
const { build } = createRequire(import.meta.url)(
  process.env.FINANCE_ESBUILD_PATH,
);
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
      name: "isolated-finance-fixtures",
      setup(plugin) {
        plugin.onResolve(
          {
            filter: /^@\/hooks\/use-user$|^@\/service\/landlordFinanceService$/,
          },
          () => ({ path: path.join(here, "fixture-service.jsx") }),
        );
        plugin.onResolve(
          { filter: /^next\/(navigation|link|dynamic)$/ },
          ({ path: source }) => ({ path: source, namespace: "next-fixture" }),
        );
        plugin.onLoad(
          { filter: /.*/, namespace: "next-fixture" },
          ({ path: source }) => ({
            contents:
              source === "next/navigation"
                ? `export { useRouter, useSearchParams } from ${JSON.stringify(path.join(here, "fixture-navigation.jsx"))}`
                : `export { ${source === "next/link" ? "FixtureLink" : "dynamic"} as default } from ${JSON.stringify(path.join(here, "fixture-navigation.jsx"))}`,
            loader: "js",
            resolveDir: here,
          }),
        );
        plugin.onResolve({ filter: /^@\// }, ({ path: source }) => {
          const base = path.join(web, source.slice(2));
          const resolved = [base, `${base}.ts`, `${base}.tsx`].find((file) =>
            existsSync(file),
          );
          if (!resolved)
            throw new Error(`Cannot resolve fixture import: ${source}`);
          return { path: resolved };
        });
      },
    },
  ],
});
const cssDirectory = path.join(web, ".next/static/chunks");
const css = (await readdir(cssDirectory)).filter((name) =>
  name.endsWith(".css"),
);
for (const name of css)
  await copyFile(path.join(cssDirectory, name), path.join(output, name));
await writeFile(
  path.join(output, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${css.map((name) => `<link rel="stylesheet" href="/${name}">`).join("")}</head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`,
);
console.log(`Isolated finance browser fixture: ${output}`);
