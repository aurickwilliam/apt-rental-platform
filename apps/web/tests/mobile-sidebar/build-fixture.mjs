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
const menus = {};
for (const portal of ["tenant", "landlord", "admin"]) {
  const file = path.join(web, `app/${portal}/layout.tsx`);
  const ast = ts.createSourceFile(file, await readFile(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const constants = [];
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.initializer && ts.isStringLiteral(declaration.initializer)) constants.push(`const ${declaration.name.getText(ast)} = ${declaration.initializer.getText(ast)};`);
      if (declaration.name.getText(ast) === `${portal.toUpperCase()}_NAV`) menus[portal] = declaration.initializer.getText(ast);
    }
  }
  if (!menus[portal]) throw new Error(`Missing ${portal} navigation`);
  menus[portal] = `(() => { ${constants.join("\n")} return ${menus[portal]}; })()`;
}
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(here, "fixture-app.jsx")], outfile: path.join(output, "fixture.js"),
  bundle: true, platform: "browser", format: "esm", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{ name: "mobile-sidebar-fixture", setup(plugin) {
    plugin.onResolve({ filter: /^fixture-menus$/ }, () => ({ path: "menus", namespace: "fixture" }));
    plugin.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `export const menus = {${Object.entries(menus).map(([key, value]) => `${key}:${value}`).join(",")}};`, loader: "ts" }));
    plugin.onResolve({ filter: /^next\/(navigation|link|image)$/ }, ({ path: source }) => ({ path: source, namespace: "fixture-next" }));
    plugin.onLoad({ filter: /.*/, namespace: "fixture-next" }, ({ path: source }) => ({
      contents: source === "next/navigation" ? `export { useRouter, useSearchParams, usePathname } from ${JSON.stringify(transports)}` :
        `export { ${source === "next/link" ? "FixtureLink" : "FixtureImage"} as default } from ${JSON.stringify(transports)}`,
      loader: "js", resolveDir: here,
    }));
    plugin.onResolve({ filter: /^(?:@\/(?:service\/signOutService|hooks\/(?:use-notifications|use-pending-navigation)|lib\/sidebar-notification-activity|app\/components\/(?:notifications\/NotificationsOverlay|settings\/SettingsOverlay|profile\/UserAvatar))|\.\/(?:SidebarLinkPending|SidebarNotificationsItem))$/ }, () => ({ path: transports }));
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
for (const file of ["app/components/layout/AppSidebar.tsx", "app/components/settings/ToggleSwitch.tsx", "tests/mobile-sidebar/fixture-app.jsx"]) {
  const source = await readFile(path.join(web, file), "utf8");
  for (const match of source.matchAll(/["`']([^"`'\n]+)["`']/g)) for (const candidate of match[1].split(/\s+/)) candidates.add(candidate);
}
await writeFile(path.join(output, "styles.css"), compiler.build([...candidates]));
await writeFile(path.join(output, "index.html"), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
await mkdir(path.join(output, "logo"), { recursive: true });
await writeFile(path.join(output, "logo/logo-name-transparent.svg"), await readFile(path.join(web, "public/logo/logo-name-transparent.svg")));
console.log(`Mobile sidebar fixture built: ${output}`);
