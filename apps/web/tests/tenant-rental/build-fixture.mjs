import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "../..");
const output = process.argv[2];
if (!output || !process.env.BROWSE_ESBUILD_PATH) throw new Error("Provide output and BROWSE_ESBUILD_PATH.");
const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.BROWSE_ESBUILD_PATH);
const ts = require("typescript");
const transports = path.join(here, "fixture-transports.jsx");
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(here, "fixture-app.jsx")], outfile: path.join(output, "fixture.js"),
  bundle: true, platform: "browser", format: "esm", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{ name: "tenant-rental-fixture", setup(plugin) {
    plugin.onResolve({ filter: /^next\/(navigation|link|image)$/ }, ({ path: source }) => ({ path: source, namespace: "fixture-next" }));
    plugin.onLoad({ filter: /.*/, namespace: "fixture-next" }, ({ path: source }) => ({
      contents: source === "next/navigation" ? `export {useRouter,useSearchParams,useParams} from ${JSON.stringify(transports)}` : `export {${source === "next/link" ? "FixtureLink" : "FixtureImage"} as default} from ${JSON.stringify(transports)}`,
      loader: "js", resolveDir: here,
    }));
    plugin.onResolve({ filter: /^(?:@repo\/utils|@repo\/supabase\/browser|@\/service\/favoritesService|@\/hooks\/(?:use-auth-identity|use-tenant-applications|use-applicant-personal-info|use-visit-request|use-respond-to-reschedule|use-application-document-urls|use-signed-lease-viewer|use-maintenance-photo-urls|use-maintenance-request-history|use-submit-maintenance-request|use-tenancy))$/ }, () => ({ path: transports }));
    plugin.onResolve({ filter: /^@\/service\/tenantApplicationsService$/ }, () => ({ path: transports }));
    plugin.onResolve({ filter: /^@\// }, ({ path: source }) => {
      const base = path.join(web, source.slice(2));
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find(file => existsSync(file));
      if (!resolved) throw new Error(`Unresolved fixture import ${source}`);
      return { path: resolved };
    });
  } }],
});
const { compile } = createRequire(require.resolve("@tailwindcss/postcss"))("@tailwindcss/node");
const css = path.join(web, "app/globals.css");
const compiler = await compile(await readFile(css, "utf8"), { base: path.dirname(css), onDependency() {} });
const candidates = new Set();
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await scan(file); continue; }
    if (!/\.[jt]sx?$/.test(entry.name)) continue;
    const ast = ts.createSourceFile(file, await readFile(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = node => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) for (const token of node.text.split(/\s+/)) candidates.add(token);
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
}
for (const folder of ["app/tenant/my-rental", "app/tenant/applications", "app/tenant/maintenance", "app/components/display", "app/components/settings", "app/components/profile", "tests/tenant-rental"]) await scan(path.join(web, folder));
await writeFile(path.join(output, "styles.css"), compiler.build([...candidates]));
await writeFile(path.join(output, "index.html"), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
console.log(`Tenant rental fixture built: ${output}`);
