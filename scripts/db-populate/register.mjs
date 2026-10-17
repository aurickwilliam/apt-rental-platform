// Node 22.17+ can strip TypeScript; resolve the shared packages' extensionless
// imports only for this operator tool. No application build/runtime changes.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const packages = new URL("../../packages/", import.meta.url).href;
registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith(packages) && url.endsWith(".ts")) return nextLoad(url, { ...context, format: "module-typescript" });
    return nextLoad(url, context);
  },
  resolve(specifier, context, nextResolve) {
    if (specifier === "@repo/constants" && context.parentURL?.startsWith(packages)) {
      return nextResolve(new URL("constants/src/index.ts", packages).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith(packages)) {
      const path = fileURLToPath(new URL(specifier, context.parentURL));
      for (const suffix of [".ts", "/index.ts"]) {
        if (existsSync(path + suffix)) return nextResolve(pathToFileURL(path + suffix).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
