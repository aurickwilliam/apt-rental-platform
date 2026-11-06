// Real Settings modal, form, server action and HeroUI. Only external transports and unrelated tabs are isolated.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "../..");
const output = process.argv[2];
if (!output || !process.env.SETTINGS_ESBUILD_PATH) throw new Error("Provide output and SETTINGS_ESBUILD_PATH");
const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.SETTINGS_ESBUILD_PATH);
const { compile } = createRequire(require.resolve("@tailwindcss/postcss"))("@tailwindcss/node");
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(here, "fixture-app.jsx")], outfile: path.join(output, "fixture.js"),
  bundle: true, platform: "browser", format: "esm", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{ name: "settings-transports", setup(plugin) {
    plugin.onResolve({ filter: /^next\/navigation$|^next-themes$|^@\/hooks\/use-user$|^\.\/use-user$|^@repo\/supabase\/server$/ }, () => ({ path: path.join(here, "fixture-transports.jsx") }));
    plugin.onResolve({ filter: /(SecurityTab|LanguageRegionTab|NotificationsTab|HelpTab|PaymentMethodsTab)$/ }, () => ({ path: "tab", namespace: "settings-tab" }));
    plugin.onLoad({ filter: /.*/, namespace: "settings-tab" }, () => ({ resolveDir: web, contents: 'export default function OtherTab() { return <p>Other Settings content</p>; }', loader: "jsx" }));
    plugin.onResolve({ filter: /^@repo\/utils$/ }, () => ({ path: "utils", namespace: "settings-utils" }));
    plugin.onLoad({ filter: /.*/, namespace: "settings-utils" }, () => ({ resolveDir: web, contents:
      `export * from ${JSON.stringify(path.resolve(web, "../../packages/utils/src/preferenceLinking.ts"))};`,
    }));
  } }],
});
const files = [
  "app/components/settings/SettingsModal.tsx", "app/components/settings/tabs/RentalPreferencesTab.tsx",
  "app/components/settings/tabs/GeneralTab.tsx", "app/components/settings/SettingsSelect.tsx",
  "app/components/settings/SettingsMultiSelect.tsx", "app/components/settings/SettingsRow.tsx",
  "app/components/settings/ToggleSwitch.tsx", "app/components/preferences/BudgetRangeField.tsx",
  "tests/settings-preferences/fixture-app.jsx",
];
const sources = await Promise.all(files.map(file => readFile(path.join(web, file), "utf8")));
const candidates = sources.flatMap(source => [...source.matchAll(/["'`]([^"'`\n]+)["'`]/g)].flatMap(match => match[1].split(/\s+/)));
const cssPath = path.join(web, "app/globals.css");
const compiler = await compile(await readFile(cssPath, "utf8"), { base: path.dirname(cssPath), onDependency() {} });
await writeFile(path.join(output, "styles.css"), compiler.build(candidates));
await writeFile(path.join(output, "index.html"), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
console.log(`Settings fixture: ${output}`);
