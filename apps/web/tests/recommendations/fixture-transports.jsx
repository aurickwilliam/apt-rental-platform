import { lazy, Suspense, useCallback, useState } from "react";

const actions = (value) => { document.getElementById("fixture-actions").textContent = value; };
export function useRouter() {
  return { push: (href) => actions(`Navigate ${href}`), replace: (href) => actions(`Search ${href}`), refresh: () => actions("Refresh") };
}
export function useSearchParams() { return new URLSearchParams(window.location.search); }
export function FixtureLink({ href, children, onNavigate, ...props }) {
  return <a {...props} href={href} onClick={(event) => { event.preventDefault(); onNavigate?.(); actions(`Navigate ${href}`); }}>{children}</a>;
}
export function useLinkStatus() { return { pending: false }; }
export function FixtureImage({ priority, unoptimized, fill, ...props }) {
  void priority; void unoptimized; void fill;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt ?? ""} />;
}
export function fixtureDynamic(loader) {
  const Component = lazy(loader);
  return function Dynamic(props) { return <Suspense fallback={null}><Component {...props} /></Suspense>; };
}
export function useFavorites() {
  const [ids, setIds] = useState(new Set());
  const isFavorite = useCallback((id) => ids.has(id), [ids]);
  const toggleFavorite = useCallback(async (id) => {
    actions(`Favorite ${id}`);
    const next = !ids.has(id);
    if (window.fixtureHoldFavorites) await new Promise((resolve) => { window.fixtureResolveFavorite = resolve; });
    setIds((old) => {
      const updated = new Set(old);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
    return next;
  }, [ids]);
  return { isFavorite, toggleFavorite };
}
export function useRememberRecentApartment() { return () => {}; }
export function useRecentApartmentSearches() { return { recent: [], clear() {} }; }
export function Empty() { return null; }
export function formatPesoDisplay(value) { return `₱${value.toLocaleString("en-PH")}`; }
