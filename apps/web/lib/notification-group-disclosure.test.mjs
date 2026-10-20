import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped} \\{[^}]+\\}`));
  assert.ok(match, `missing CSS rule: ${selector}`);
  return match[0];
}

test("group disclosure keeps a 44px target while hover and focus hug the chevron", () => {
  const target = rule(".apt-notifications-drawer .notification-group-disclosure");
  assert.match(target, /width: 2\.75rem;/, "the control keeps a 44px hit target");
  assert.match(target, /height: 2\.75rem;/);
  assert.match(target, /--button-bg-hover: transparent;/, "the target itself never paints");
  assert.match(target, /--button-bg-pressed: transparent;/);

  const visual = rule(".notification-group-disclosure-visual");
  assert.match(visual, /@apply flex size-6/, "feedback is confined to a 24px inner circle");

  assert.ok(
    css.includes(".apt-notifications-drawer .notification-group-disclosure:hover .notification-group-disclosure-visual"),
    "hover belongs to the inner circle",
  );
  assert.ok(
    css.includes(".apt-notifications-drawer .notification-group-disclosure:focus-visible .notification-group-disclosure-visual"),
    "keyboard focus belongs to the inner circle",
  );
  assert.match(rule(".apt-notifications-drawer .notification-group-disclosure:active .notification-group-disclosure-visual"), /14%/);
  assert.match(css, /outline: 2px solid var\(--primary\);/, "focus stays visible");

  const nativeRing = css.match(
    /\.apt-notifications-drawer \.notification-group-disclosure:focus-visible:not\(\[data-focused\]\),\s*\.apt-notifications-drawer \.notification-group-disclosure\[data-focus-visible="true"\] \{[^}]+\}/,
  );
  assert.ok(nativeRing, "HeroUI's 44px focus ring is overridden");
  assert.match(nativeRing[0], /box-shadow: none;/, "no 44px halo can enclose the unread dot");
});
