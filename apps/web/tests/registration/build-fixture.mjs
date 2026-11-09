// Isolated UI only: never starts Next or loads .env, Auth or hosted services.
// REGISTRATION_ESBUILD_PATH points to an existing temporary esbuild install.
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "../..");
const output = process.argv[2];
if (!output || !process.env.REGISTRATION_ESBUILD_PATH) throw new Error("Supply output and REGISTRATION_ESBUILD_PATH.");
const { build } = createRequire(import.meta.url)(process.env.REGISTRATION_ESBUILD_PATH);
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(here, "fixture-app.jsx")], outdir: output, entryNames: "fixture", chunkNames: "[name]-[hash]",
  bundle: true, splitting: true, platform: "browser", format: "esm", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{ name: "isolated-registration", setup(plugin) {
    plugin.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "fixture" }));
    plugin.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "fixture" }));
    plugin.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: source }) => ({
      contents: source === "navigation"
        ? 'export function useRouter() { return { prefetch() {} }; }'
        : 'import {createElement} from "react"; export default function Link(props) { return createElement("a",props); }',
      loader: "js", resolveDir: web,
    }));
    plugin.onResolve({ filter: /^@\// }, ({ path: source }) => {
      const base = path.join(web, source.slice(2));
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find(file => existsSync(file));
      if (!resolved) throw new Error(`Cannot resolve ${source}`);
      return { path: resolved };
    });
  } }],
});
const requireWeb = createRequire(path.join(web, "package.json"));
const postcss = createRequire(requireWeb.resolve("@tailwindcss/postcss"))("postcss");
const tailwind = requireWeb("@tailwindcss/postcss");
const cssPath = path.join(web, "app/globals.css");
const styles = await postcss([tailwind()]).process(await readFile(cssPath, "utf8"), { from: cssPath });
await writeFile(path.join(output, "fixture.css"), styles.css);
await writeFile(path.join(output, "index.html"), '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
console.log(`Isolated registration UI: ${output}`);
