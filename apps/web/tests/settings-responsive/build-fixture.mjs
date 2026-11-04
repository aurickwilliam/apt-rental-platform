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
const ts = require("typescript");
const transports = path.join(here, "fixture-transports.jsx");
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(here, "fixture-app.jsx")], outfile: path.join(output, "fixture.js"),
  bundle: true, platform: "browser", format: "esm", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{ name: "settings-fixture", setup(plugin) {
    plugin.onResolve({ filter: /^next\/(navigation|link)$/ }, () => ({ path: transports }));
    plugin.onResolve({ filter: /^@\/hooks\/(use-user|use-rental-preferences-form)$/ }, () => ({ path: transports }));
    plugin.onResolve({ filter: /^\.\/tabs\/(SecurityTab|LanguageRegionTab|NotificationsTab|HelpTab|RentalPreferencesTab)$/ }, ({ path: source }) => ({ path: source, namespace: "fixture-tab" }));
    plugin.onLoad({ filter: /.*/, namespace: "fixture-tab" }, ({ path: source }) => ({
      contents: `import {createElement} from 'react'; export default function Tab(){return createElement('h2',{},${JSON.stringify(source.split("/").at(-1))})}`,
      loader: "js", resolveDir: here,
    }));
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
for (const file of ["app/components/settings/SettingsModal.tsx", "app/components/settings/SettingsRow.tsx", "app/components/settings/SettingsSelect.tsx", "app/components/settings/ToggleSwitch.tsx", "app/components/settings/tabs/GeneralTab.tsx", "tests/settings-responsive/fixture-app.jsx"]) {
  const source = await readFile(path.join(web, file), "utf8");
  for (const match of source.matchAll(/["`']([^"`'\n]+)["`']/g)) for (const candidate of match[1].split(/\s+/)) candidates.add(candidate);
  // Conditional class strings inside template expressions need AST scanning;
  // a quote-only regex can miss the active category's blue utilities.
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = node => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      for (const candidate of node.text.split(/\s+/)) candidates.add(candidate);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
}
await writeFile(path.join(output, "styles.css"), compiler.build([...candidates]));
await writeFile(path.join(output, "index.html"), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
console.log(`Settings fixture built: ${output}`);
