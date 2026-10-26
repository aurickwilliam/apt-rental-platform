import {
  detectDeviceLanguage,
  isLanguageCode,
  parseAcceptLanguage,
  parseLanguageTag,
  resolveLocale,
} from "./locale";

describe("parseLanguageTag", () => {
  test("maps Filipino and Tagalog tags to Filipino", () => {
    for (const tag of ["fil", "fil-PH", "fil_PH", "TL", "tl-ph"]) {
      expect(parseLanguageTag(tag)).toBe("fil");
    }
  });

  test("maps English tags to English", () => {
    for (const tag of ["en", "en-US", "en_PH"]) {
      expect(parseLanguageTag(tag)).toBe("en");
    }
  });

  test("ignores unsupported and missing tags", () => {
    for (const tag of ["", "   ", null, undefined, "es", "de-DE", "fr"]) {
      expect(parseLanguageTag(tag)).toBeNull();
    }
  });
});

describe("parseAcceptLanguage", () => {
  test("follows the stated quality order", () => {
    expect(parseAcceptLanguage("fil-PH,fil;q=0.9,en;q=0.8")).toBe("fil");
    expect(parseAcceptLanguage("en-US,en;q=0.9,fil;q=0.8")).toBe("en");
  });

  test("skips unsupported entries and zero-quality entries", () => {
    expect(parseAcceptLanguage("de-DE,fr;q=0.9,fil;q=0.5")).toBe("fil");
    expect(parseAcceptLanguage("fil;q=0,en;q=0.4")).toBe("en");
  });

  test("returns null when nothing is supported", () => {
    expect(parseAcceptLanguage("de-DE,fr-FR")).toBeNull();
    expect(parseAcceptLanguage("")).toBeNull();
    expect(parseAcceptLanguage(null)).toBeNull();
  });
});

describe("resolveLocale", () => {
  test("returns English while Filipino is gated off", () => {
    expect(resolveLocale({ stored: "fil", device: "fil-PH", allowFilipino: false })).toBe("en");
  });

  test("prefers the explicit choice over the device", () => {
    expect(resolveLocale({ stored: "en", device: "fil-PH", allowFilipino: true })).toBe("en");
    expect(resolveLocale({ stored: "fil", device: "en-US", allowFilipino: true })).toBe("fil");
  });

  test("falls back to the device language, then English", () => {
    expect(resolveLocale({ device: "fil-PH", allowFilipino: true })).toBe("fil");
    expect(resolveLocale({ device: "de-DE", allowFilipino: true })).toBe("en");
    expect(resolveLocale({ allowFilipino: true })).toBe("en");
  });

  test("ignores an invalid stored value", () => {
    expect(resolveLocale({ stored: "es", device: "fil-PH", allowFilipino: true })).toBe("fil");
  });
});

describe("isLanguageCode", () => {
  test("only accepts the supported codes", () => {
    expect(isLanguageCode("en")).toBe(true);
    expect(isLanguageCode("fil")).toBe(true);
    expect(isLanguageCode("ph")).toBe(false);
    expect(isLanguageCode("es")).toBe(false);
    expect(isLanguageCode(null)).toBe(false);
  });
});

describe("detectDeviceLanguage", () => {
  test("returns a readable tag or null, never throws", () => {
    const detected = detectDeviceLanguage();
    expect(detected === null || typeof detected === "string").toBe(true);
  });
});
