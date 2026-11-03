// Isolated production ProfileForm + HeroUI/CSS; no credentials or backend access.
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "../..");
const output = process.argv[2];
if (!output || !process.env.PROFILE_ESBUILD_PATH) {
  throw new Error("Provide output directory and PROFILE_ESBUILD_PATH.");
}
const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.PROFILE_ESBUILD_PATH);
await mkdir(output, { recursive: true });
await build({
  entryPoints: [path.join(here, "fixture-app.jsx")],
  outfile: path.join(output, "fixture.js"),
  bundle: true,
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  nodePaths: [path.join(web, "node_modules"), path.resolve(web, "../../node_modules")],
  plugins: [{
    name: "profile-transport-fixtures",
    setup(plugin) {
      plugin.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "fixture" }));
      plugin.onResolve({ filter: /update-profile$/ }, () => ({ path: "action", namespace: "fixture" }));
      plugin.onResolve({ filter: /^next\/image$/ }, () => ({ path: path.join(here, "fixture-photos.jsx") }));
      plugin.onResolve({ filter: /^@repo\/supabase\/browser$/ }, () => ({ path: path.join(here, "fixture-photos.jsx") }));
      // Standalone admin photo children are outside the consumer modal tests.
      plugin.onResolve({ filter: /\.\/Profile(Avatar|Background|PhotoErrorDialog)$/ }, () => ({ path: "photos", namespace: "fixture" }));
      plugin.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: source }) => ({
        contents: source === "navigation"
          ? "export const useRouter = () => ({ push: (href) => { window.fixtureRedirect = href; }, refresh: () => {} });"
          : source === "action"
            ? `export async function updateProfile(_, data) {
                window.fixtureWrites.push(Object.fromEntries(data));
                await new Promise(resolve => setTimeout(resolve, 300));
                return window.fixtureError ? { error: window.fixtureError } : { success: "Profile updated." };
              }`
            : "export default function Photo() { return null; } export const createClient = () => {}; export const compressAvatarImage = () => {}; export const compressBackgroundImage = () => {}; export const uploadAvatar = () => {}; export const uploadBackground = () => {};",
        loader: "js",
      }));
      plugin.onResolve({ filter: /^@\// }, ({ path: source }) => {
        const base = path.join(web, source.slice(2));
        return { path: [base, `${base}.ts`, `${base}.tsx`].find(existsSync) };
      });
    },
  }],
});
const { compile } = createRequire(require.resolve("@tailwindcss/postcss"))("@tailwindcss/node");
const cssPath = path.join(web, "app/globals.css");
const compiler = await compile(await readFile(cssPath, "utf8"), { base: path.dirname(cssPath), onDependency() {} });
const sources = await Promise.all([
  path.join(here, "fixture-app.jsx"),
  path.join(web, "app/components/profile/ProfileForm.tsx"),
  path.join(web, "app/components/profile/ProfileSaveSuccessDialog.tsx"),
  path.join(web, "app/components/profile/EditableCover.tsx"),
  path.join(web, "app/components/profile/EditableAvatar.tsx"),
  path.join(web, "app/components/profile/UserAvatar.tsx"),
  path.join(web, "app/components/profile/RemovePhotoConfirmModal.tsx"),
  path.join(web, "app/components/display/ErrorBanner.tsx"),
  path.join(web, "app/components/display/PhotoGalleryModal.tsx"),
].map((file) => readFile(file, "utf8")));
// Include production utilities, including the conditional form layout strings.
const candidates = sources.flatMap((source) => [...source.matchAll(/"([^"\n]+)"/g)]
  .flatMap((match) => match[1].split(/\s+/)));
await writeFile(path.join(output, "styles.css"), compiler.build(candidates));
await writeFile(path.join(output, "index.html"), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
console.log(`Profile fixture: ${output}`);
