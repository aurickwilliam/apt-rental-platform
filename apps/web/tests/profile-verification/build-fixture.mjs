import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "../..");
const output = process.argv[2];
if (!output || !process.env.VERIFICATION_ESBUILD_PATH) throw new Error("Provide output and VERIFICATION_ESBUILD_PATH.");
const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.VERIFICATION_ESBUILD_PATH);
await mkdir(output, { recursive: true });
const common = {
  bundle: true, jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.NEXT_PUBLIC_ANDROID_APK_URL": '"https://apt.test/app.apk"',
    "process.env.NEXT_PUBLIC_SITE_URL": '"https://apt.test"',
  },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
};
function fixturePlugin(server = false) {
  return { name: "verification-transports-only", setup(plugin) {
    plugin.onResolve({ filter: /^next\/(navigation|link|image)$/ }, ({ path: source }) => ({ path: source, namespace: "next-fixture" }));
    plugin.onLoad({ filter: /.*/, namespace: "next-fixture" }, ({ path: source }) => ({
      contents: server
        ? 'export function useRouter() { return { push() {}, refresh() {} }; } export function useSearchParams() { return new URLSearchParams(); } export function usePathname() { return "/hydration"; } export default function FixtureElement() { return null; }'
        : source === "next/navigation"
        ? `export { useRouter, useSearchParams, usePathname } from ${JSON.stringify(path.join(here, "fixture-next.jsx"))}`
        : `export { ${source === "next/link" ? "FixtureLink" : "FixtureImage"} as default } from ${JSON.stringify(path.join(here, "fixture-next.jsx"))}`,
      loader: "js", resolveDir: here,
    }));
    plugin.onResolve({ filter: /^(\.\.\/actions|\.\.\/\.\.\/actions|@\/hooks\/use-application-readiness|@repo\/utils|\.\/ApplicationGuidelinesModal)$/ }, () => ({ path: path.join(here, "fixture-state.jsx") }));
    plugin.onResolve({ filter: /^@repo\/supabase(?:\/browser)?$/ }, () => ({ path: path.join(here, "fixture-state.jsx") }));
    plugin.onResolve({ filter: /^@\// }, ({ path: source }) => {
      const base = path.join(web, source.slice(2));
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find(file => existsSync(file));
      if (!resolved) throw new Error(`Unresolved fixture import: ${source}`);
      return { path: resolved };
    });
  } };
}
await build({
  ...common,
  entryPoints: [path.join(here, "fixture-app.jsx")], outfile: path.join(output, "fixture.js"),
  platform: "browser", format: "esm", plugins: [fixturePlugin()],
});
// Render the actual production neutral state with fixed props on Node. Query
// parameters never enter this markup; browser hydration is still tested fully.
const hydrationFile = path.join(output, "hydration.cjs");
await build({
  ...common, outfile: hydrationFile, platform: "node", format: "cjs", plugins: [fixturePlugin(true)],
  stdin: {
    contents: `import { StrictMode } from "react"; import { renderToString } from "react-dom/server";
      import VerifyClient from ${JSON.stringify(path.join(web, "app/verify/components/VerifyClient.tsx"))};
      export const html = renderToString(<StrictMode><VerifyClient siteUrl="https://apt.test" accountStatus="unverified" hasPending={false} /></StrictMode>);`,
    loader: "jsx", resolveDir: web,
  },
});
const { html: hydrationHtml } = require(hydrationFile);
const { compile } = createRequire(require.resolve("@tailwindcss/postcss"))("@tailwindcss/node");
const cssPath = path.join(web, "app/globals.css");
const routeCss = await readFile(path.join(web, "app/verify/mobile/verification.css"), "utf8");
const compiler = await compile(`${await readFile(cssPath, "utf8")}\n${routeCss}`, { base: path.dirname(cssPath), onDependency() {} });
const candidates = new Set(["p-6"]);
for (const file of [
  "app/verify/components/VerifyClient.tsx", "app/verify/components/PhoneVerificationMethods.tsx",
  "app/verify/components/VerifyDialog.tsx", "app/verify/components/VerifyStatePanels.tsx",
  "app/verify/components/DesktopVerifyWizard.tsx",
  "app/verify/components/VerifySubmitConfirm.tsx",
  "app/components/passport/PassportProfileCard.tsx", "app/verify/mobile/components/MobileVerifyClient.tsx",
  "app/verify/mobile/components/CameraCapture.tsx",
  "app/verify/mobile/components/MobileVerificationNavigation.tsx",
  "app/verify/mobile/components/MobileVerificationPhotoStep.tsx",
  "app/verify/mobile/components/VerificationIdSelector.tsx",
  "app/browse/[apartmentId]/apply/components/ApplyStartModal.tsx",
  "app/browse/[apartmentId]/apply/components/ApplicationIssues.tsx",
]) {
  const source = await readFile(path.join(web, file), "utf8");
  for (const match of source.matchAll(/className(?:=|: )(?:(?:"([^"]+)")|(?:\{`([^`]+)`\}))/g)) {
    for (const candidate of (match[1] || match[2]).split(/\s+/)) if (candidate) candidates.add(candidate);
  }
}
await writeFile(path.join(output, "styles.css"), compiler.build([...candidates]));
await writeFile(path.join(output, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root">${hydrationHtml}</div><script type="module" src="/fixture.js"></script></body></html>`);
console.log(`Verification fixture built: ${output}`);
