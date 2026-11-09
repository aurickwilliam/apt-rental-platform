import { useSyncExternalStore } from "react";

const listeners = new Set();
const notify = () => listeners.forEach(listener => listener());
for (const method of ["pushState", "replaceState"]) {
  const original = window.history[method].bind(window.history);
  window.history[method] = (...args) => { original(...args); notify(); };
}
window.addEventListener("popstate", notify);
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}
export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => window.location.search);
  return new URLSearchParams(search);
}
export function useRouter() {
  return { push: href => window.history.pushState(null, "", href), refresh: notify };
}
export function FixtureLink({ href, children, ...props }) {
  return <a href={href} {...props} onClick={event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState(null, "", href);
  }}>{children}</a>;
}
export function FixtureImage(props) {
  const native = { ...props };
  delete native.fill;
  delete native.unoptimized;
  // The real Next Image optimizer is outside this network-isolated fixture.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...native} alt={props.alt ?? ""} />;
}
