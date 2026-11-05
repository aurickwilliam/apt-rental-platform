import { buildCaptchaPage, isAllowedCaptchaUrl, parseCaptchaMessage } from "./captchaPage";

describe("captcha page messages", () => {
  it("reads tokens and state messages", () => {
    expect(parseCaptchaMessage(JSON.stringify({ type: "token", token: "abc" }))).toEqual({ type: "token", token: "abc" });
    expect(parseCaptchaMessage(JSON.stringify({ type: "interactive" }))).toEqual({ type: "interactive" });
    expect(parseCaptchaMessage(JSON.stringify({ type: "expired" }))).toEqual({ type: "expired" });
  });

  it("ignores empty tokens, unknown types and non-JSON", () => {
    expect(parseCaptchaMessage(JSON.stringify({ type: "token", token: "" }))).toBeNull();
    expect(parseCaptchaMessage(JSON.stringify({ type: "other" }))).toBeNull();
    expect(parseCaptchaMessage("not json")).toBeNull();
  });
});

describe("captcha navigation allow-list", () => {
  const base = "https://apt.example.com";

  it("allows the widget page and Cloudflare challenge hosts", () => {
    expect(isAllowedCaptchaUrl("about:blank", base)).toBe(true);
    expect(isAllowedCaptchaUrl("https://apt.example.com/", base)).toBe(true);
    expect(isAllowedCaptchaUrl("https://challenges.cloudflare.com/cdn-cgi/challenge-platform/x", base)).toBe(true);
  });

  it("blocks everything else", () => {
    expect(isAllowedCaptchaUrl("https://evil.example.net/", base)).toBe(false);
    expect(isAllowedCaptchaUrl("http://challenges.cloudflare.com/", base)).toBe(false);
    expect(isAllowedCaptchaUrl("javascript:alert(1)", base)).toBe(false);
  });
});

describe("captcha page html", () => {
  it("embeds the site key and the callbacks", () => {
    const html = buildCaptchaPage("0x4AAAAAAAkey");
    expect(html).toContain("sitekey:'0x4AAAAAAAkey'");
    expect(html).toContain("ReactNativeWebView.postMessage");
    expect(html).toContain("interaction-only");
  });
});
