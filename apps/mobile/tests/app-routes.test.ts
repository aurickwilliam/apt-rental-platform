import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const APP_ROOT = join(__dirname, "..", "app");

/**
 * Every file under `app/` is a route to Expo Router, apart from test files
 * (excluded from the bundle by metro.config.js) and the `+`-prefixed special
 * files. Helper modules belong in `constants/`, `utils/`, `hooks/` or
 * `service/`; leaving them here makes the router warn that the route "is
 * missing the required default export" and adds phantom typed routes.
 */
function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) return [];
    if (entry.name.startsWith("+")) return [];
    return [path];
  });
}

it("keeps non-route modules out of the app directory", () => {
  const missingDefaultExport = routeFiles(APP_ROOT).filter(
    (file) => !/\bexport\s+default\b|\bas\s+default\b/.test(readFileSync(file, "utf8")),
  );

  expect(missingDefaultExport.map((file) => relative(APP_ROOT, file)).sort()).toEqual([]);
});
