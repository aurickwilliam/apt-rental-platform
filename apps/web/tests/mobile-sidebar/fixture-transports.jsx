function record(value) {
  document.getElementById("fixture-actions").textContent = value;
}
const portal = new URLSearchParams(location.search).get("portal") || "tenant";
export function usePathname() { return portal === "tenant" ? "/tenant/browse" : `/${portal}/dashboard`; }
export function useSearchParams() { return new URLSearchParams(); }
export function useRouter() { return { push: href => record(href), prefetch() {} }; }
export function usePendingNavigation() { return { pendingHref: null, navigate: href => record(href) }; }
export function useNotifications() { return { notifications: [], unreadCount: 12 }; }
export function getUnreadSidebarActivity() { return new Set(); }
export function signOut() { record("Signed out"); }
export const SETTINGS_QUERY_VALUE = "open";
export const NOTIFICATIONS_QUERY_VALUE = "open";
export function FixtureLink({ href, children, ...props }) { return <a href={href} {...props}>{children}</a>; }
export function FixtureImage({ priority, alt = "", ...props }) {
  void priority;
  return createElement("img", { ...props, alt });
}
export default function UnusedDesktopComponent() { return null; }
import { createElement } from "react";
