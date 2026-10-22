import { lazy, Suspense, useSyncExternalStore } from "react";

const subscribe = (listener) => {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
};
export function useFixtureUrl() {
  return useSyncExternalStore(
    subscribe,
    () => location.pathname + location.search,
  );
}
export function useSearchParams() {
  const url = useFixtureUrl();
  return new URLSearchParams(url.split("?")[1] ?? "");
}
function push(href) {
  history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function useRouter() {
  return { push, replace: push, prefetch: () => {} };
}
export function FixtureLink({ href, children, ...props }) {
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        push(href);
      }}
    >
      {children}
    </a>
  );
}
export function dynamic(importer, options = {}) {
  const Component = lazy(importer);
  return function FixtureDynamic(props) {
    return (
      <Suspense fallback={options.loading?.() ?? null}>
        <Component {...props} />
      </Suspense>
    );
  };
}
