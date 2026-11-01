import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { TERMS_POLICY } from "./terms";
import { PRIVACY_POLICY } from "./privacy";
import type { LegalPolicy, LegalSection } from "./types";

const WEB_ROOT = resolve(__dirname, "../../../web");

// Read only the web's pure policy modules. The mobile bundle never imports web code.
function readWebModule<T>(path: string): T {
  const filename = resolve(WEB_ROOT, path);
  const source = readFileSync(filename, "utf8");
  const { outputText } = transpileModule(source, {
    compilerOptions: { module: ModuleKind.CommonJS },
    fileName: filename,
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require: (name: string) => {
      if (name !== "@/lib/registration-policies") throw new Error(`Unexpected policy dependency: ${name}`);
      return readWebModule("lib/registration-policies.ts");
    },
  }, { filename });
  return exports as T;
}

interface WebPolicyModule {
  BRAND: LegalPolicy["contact"];
  LEGAL_META: Pick<LegalPolicy, "lastUpdated" | "version" | "jurisdiction">;
  SECTIONS: (LegalSection & { emphasis: string; num: string })[];
}

describe.each([
  { name: "Terms", policy: TERMS_POLICY, path: "tos/data/tos-sections.ts", count: 22 },
  { name: "Privacy", policy: PRIVACY_POLICY, path: "pap/data/pap-sections.ts", count: 13 },
])("$name policy", ({ policy, path, count }) => {
  const web = readWebModule<WebPolicyModule>(`app/(main)/${path}`);

  it("matches every web section, paragraph, list, and callout in order", () => {
    const sections = web.SECTIONS.map(({ num: _num, emphasis, title, ...section }) => ({
      ...section,
      title: [title, emphasis].filter(Boolean).join(" "),
    }));
    expect(policy.sections).toHaveLength(count);
    expect(policy.sections).toEqual(sections);
  });

  it("matches the current web dates, versions, jurisdiction, and contact details", () => {
    expect({ lastUpdated: policy.lastUpdated, version: policy.version, jurisdiction: policy.jurisdiction }).toEqual(web.LEGAL_META);
    expect(policy.contact).toEqual(web.BRAND);
  });
});
