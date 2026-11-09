/* eslint-disable @next/next/no-img-element -- fixture stand-in for next/image */
import { lazy, Suspense, useSyncExternalStore } from "react";

// Next.js is not part of this fixture. Navigation, code splitting and images
// are replaced by browser equivalents so the real property components can
// mount without a router, a server or an optimizer.
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

export function usePathname() {
  return location.pathname;
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
  return {
    push,
    replace: push,
    prefetch: () => {},
    back: () => history.back(),
  };
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

// Same contract as next/dynamic: the module is loaded lazily and receives the
// loading fallback while the chunk resolves. Keeping the real lazy boundary
// matters here, because it is what mounts the drawer and the edit dialog.
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

// next/image-only props that a plain <img> must not receive.
const NEXT_IMAGE_ONLY = new Set(["fill", "unoptimized", "priority"]);

export function FixtureImage({ src, alt, ...props }) {
  const attributes = Object.fromEntries(
    Object.entries(props).filter(([name]) => !NEXT_IMAGE_ONLY.has(name)),
  );
  const resolved = typeof src === "string" ? src : (src?.src ?? "");
  return <img src={resolved} alt={alt ?? ""} {...attributes} />;
}
