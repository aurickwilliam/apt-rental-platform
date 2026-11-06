import { lazy, Suspense, useSyncExternalStore } from "react";
export const fixture = {
  userId: "tenant-a", preferences: { selectedCities: ["Caloocan"], budgetMin: 10000, budgetMax: 18000, bedroomCount: "1-2 Bedrooms", hasPets: true, hasParking: true },
  favorites: new Set(), navigation: [], revision: 0, listeners: new Set(),
};
export function update() { fixture.revision++; fixture.listeners.forEach(fn => fn()); }
function useRevision() { useSyncExternalStore(fn => { fixture.listeners.add(fn); return () => fixture.listeners.delete(fn); }, () => fixture.revision); }
export function useUser() {
  useRevision();
  return { loading: false, user: fixture.userId ? { id: fixture.userId } : null, profile: fixture.userId ? { roles: ["tenant"], preferences: fixture.preferences } : null };
}
const router = { push(href) { fixture.navigation.push(href); update(); }, refresh() {} };
export const useRouter = () => router;
export const useSearchParams = () => new URLSearchParams();
export const useRememberRecentApartment = () => () => {};
export function useFavorites() {
  useRevision();
  return { isFavorite: id => fixture.favorites.has(id), toggleFavorite: async id => {
    if (fixture.favorites.has(id)) fixture.favorites.delete(id); else fixture.favorites.add(id);
    update(); return fixture.favorites.has(id);
  } };
}
export function dynamic(loader) {
  const Component = lazy(loader);
  return function Dynamic(props) { return <Suspense fallback={null}><Component {...props} /></Suspense>; };
}
export function Image({ unoptimized, priority, ...props }) {
  void unoptimized; void priority;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt="" />;
}
export function Link({ href, onNavigate, children, ...props }) {
  return <a {...props} href={href} onClick={event => { event.preventDefault(); onNavigate?.({ preventDefault() {} }); }}>{children}</a>;
}
// esbuild selects the appropriate default for each Next module below via named aliases.
export default dynamic;
