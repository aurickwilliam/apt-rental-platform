import { en, type TranslationKey } from "./catalogs/en";
import { fil } from "./catalogs/fil";
import { translate } from "./translate";

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholdersOf(value: string): string[] {
  return Array.from(value.matchAll(PLACEHOLDER), (match) => match[1]).sort();
}

describe("catalog parity", () => {
  test("Filipino declares exactly the English key set", () => {
    expect(Object.keys(fil).sort()).toEqual(Object.keys(en).sort());
  });

  test("no catalog entry is blank", () => {
    for (const [key, value] of Object.entries(fil)) {
      expect({ key, blank: value.trim().length === 0 }).toEqual({ key, blank: false });
    }
    for (const [key, value] of Object.entries(en)) {
      expect({ key, blank: String(value).trim().length === 0 }).toEqual({ key, blank: false });
    }
  });

  test("interpolation placeholders match between catalogs", () => {
    for (const key of Object.keys(en) as TranslationKey[]) {
      expect({ key, placeholders: placeholdersOf(fil[key]) }).toEqual({
        key,
        placeholders: placeholdersOf(en[key]),
      });
    }
  });

  test("language names are never translated", () => {
    expect(fil["languages.en"]).toBe(en["languages.en"]);
    expect(fil["languages.fil"]).toBe(en["languages.fil"]);
  });
});

describe("translate", () => {
  test("returns the catalog value for the active language", () => {
    expect(translate("en", "common.save")).toBe("Save");
    expect(translate("fil", "common.save")).toBe("I-save");
  });

  test("interpolates variables", () => {
    expect(translate("en", "notifications.unreadCount", { count: 3 })).toBe("3 unread");
    expect(translate("fil", "notifications.unreadCount", { count: 3 })).toBe("3 hindi pa nabasa");
  });

  test("leaves an unknown variable untouched instead of printing undefined", () => {
    expect(translate("en", "notifications.unreadCount", {})).toBe("{count} unread");
  });
});
