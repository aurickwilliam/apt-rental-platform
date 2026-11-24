// Shared traversal helpers for @testing-library/react-native v14.
//
// v14 renders through `test-renderer` 1.3, whose tree exposes ONLY host
// instances (View/Text/…) plus text nodes — composite components are gone —
// and the legacy UNSAFE_*/react-test-renderer traversal methods were removed.
// These helpers express the old queries against the surviving
// `TestInstance.queryAll(predicate)` primitive.
//
// Query results here include elements hidden from accessibility, matching the
// old UNSAFE_ behavior.

import type { TestInstance } from "test-renderer";

/** React Native host names render as plain strings ("View", "Text"); the
 *  scrollable panes surface as RCTScrollView/RCTScrollContentView. */
export const RN_HOST_NAMES = {
  view: "View",
  text: "Text",
  textInput: "TextInput",
  pressable: "Pressable",
  touchable: "RCTTextWithBlockView",
  scrollView: "RCTScrollView",
  scrollViewContent: "RCTScrollContentView",
  flatList: "RNFlatList",
} as const;

type Predicate = (instance: TestInstance) => boolean;

/** All instance descendants of `root` matching a predicate. */
export function queryAllMatching(root: TestInstance, predicate: Predicate): TestInstance[] {
  return root.queryAll(predicate);
}

/** First descendant matching the predicate; throws like the old getBy* APIs. */
export function getMatching(root: TestInstance, predicate: Predicate): TestInstance {
  const all = root.queryAll(predicate);
  if (all.length === 0) {
    throw new Error("testTraversal.getMatching: predicate matched no instances");
  }
  if (all.length > 1) {
    throw new Error(`testTraversal.getMatching: predicate matched ${all.length} instances; narrow it`);
  }
  return all[0];
}

/** Descendants by React Native host type name (one or several names). */
export function queryAllByHostType(
  root: TestInstance,
  type: string | readonly string[],
): TestInstance[] {
  const names = typeof type === "string" ? [type] : [...type];
  return root.queryAll((instance) => names.includes(String(instance.type)));
}

function containsProps(props: Record<string, unknown>, expected: Record<string, unknown>): boolean {
  return Object.entries(expected).every(([key, value]) =>
    isPlainObjectMatch(props[key], value),
  );
}

function isPlainObjectMatch(actual: unknown, expected: unknown): boolean {
  if (
    typeof expected === "object" && expected !== null &&
    typeof actual === "object" && actual !== null
  ) {
    return containsProps(actual as Record<string, unknown>, expected as Record<string, unknown>);
  }
  return actual === expected;
}

/** Descendants whose props carry every given key/value pair (shallow, value
 *  equality — the old findByProps semantics). */
export function queryAllByProps(root: TestInstance, props: Record<string, unknown>): TestInstance[] {
  return root.queryAll((instance) => containsProps(instance.props, props));
}

/** Descendants whose `className` string includes every given class token
 *  (split on whitespace, order-insensitive — mirrors the old
 *  `.filter(n => n.props.className?.includes(...))` checks). */
export function queryAllWithClasses(
  root: TestInstance,
  fragments: string | readonly string[],
): TestInstance[] {
  const tokens = (typeof fragments === "string" ? [fragments] : [...fragments]).flatMap(
    (fragment) => fragment.split(/\s+/),
  );
  return root.queryAll((instance) => {
    const classes =
      typeof instance.props.className === "string"
        ? instance.props.className.split(/\s+/)
        : [];
    return tokens.every((token) => classes.includes(token));
  });
}

/** Descendants of a given host type whose props carry the given pairs. */
export function queryAllByHostProps(
  root: TestInstance,
  type: string | readonly string[],
  props: Record<string, unknown>,
): TestInstance[] {
  const names = typeof type === "string" ? [type] : [...type];
  return root.queryAll(
    (instance) => names.includes(String(instance.type)) && containsProps(instance.props, props),
  );
}

/** The root itself plus every descendant matching the predicate — the old
 *  `UNSAFE_root.findAll` semantics. `TestInstance.queryAll` only walks
 *  descendants, so a screen whose outermost host element is the match would
 *  otherwise be missed. */
export function findAllInTree(root: TestInstance, predicate: Predicate): TestInstance[] {
  return [...(predicate(root) ? [root] : []), ...root.queryAll(predicate)];
}
