// Bundle the production modal and CSS without Next.js, .env files or hosted requests.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const output = process.argv[2];
if (!output || !process.env.REVIEW_ESBUILD_PATH) {
  throw new Error("Provide an output directory and REVIEW_ESBUILD_PATH.");
}
const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.REVIEW_ESBUILD_PATH);
const tailwindPath = require.resolve("@tailwindcss/postcss");
const { compile } = createRequire(tailwindPath)("@tailwindcss/node");
await mkdir(output, { recursive: true });

await build({
  stdin: {
    contents: `import React from "react";
      import { createRoot } from "react-dom/client";
      import ReviewUnlockGate from "./app/tenant/components/ReviewUnlockGate";
      document.documentElement.classList.toggle("dark", new URLSearchParams(location.search).has("dark"));
      createRoot(document.getElementById("root")).render(<>
        <main><h1>Tenant review fixture</h1><button onClick={() => window.backgroundClicks++}>Background action</button></main>
        <nav style={{position: "fixed", bottom: 16, left: 16, zIndex: 40}}>Tenant menu</nav>
        <ReviewUnlockGate />
      </>);
      window.backgroundClicks = 0;`,
    resolveDir: web,
    loader: "jsx",
  },
  outfile: path.join(output, "fixture.js"),
  bundle: true,
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{
    name: "isolated-review-transport",
    setup(plugin) {
      plugin.onResolve({ filter: /^next\/navigation$|^@\/hooks\/use-review-unlock$/ }, ({ path }) => ({
        path, namespace: "review-fixture",
      }));
      plugin.onLoad({ filter: /.*/, namespace: "review-fixture" }, ({ path }) => ({
        contents: path === "next/navigation"
          ? `export const useRouter = () => ({push: href => { window.reviewDestination = href; }});`
          : `const key = "review-unlock-modal-seen:fixture-tenancy";
            export const markReviewUnlockSeen = () => localStorage.setItem(key, "1");
            export const useReviewUnlock = () => localStorage.getItem(key) ? null : ({
              tenancyId: "fixture-tenancy", apartmentId: "fixture-apartment",
              apartmentName: new URLSearchParams(location.search).get("name") || "Cozy Cove Apartment"
            });`,
        loader: "js",
      }));
    },
  }],
});

const cssPath = path.join(web, "app/globals.css");
const source = await readFile(path.join(web, "app/tenant/components/ReviewUnlockGate.tsx"), "utf8");
const candidates = [...source.matchAll(/className="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/));
const compiler = await compile(await readFile(cssPath, "utf8"), { base: path.dirname(cssPath), onDependency() {} });
await writeFile(path.join(output, "styles.css"), compiler.build(candidates));
await writeFile(path.join(output, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div>
<script type="module" src="/fixture.js"></script></body></html>`);
console.log(`Isolated review modal fixture: ${output}`);
