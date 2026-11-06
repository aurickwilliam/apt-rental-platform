import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { MobileSidebarNavigation } from "../../app/components/layout/AppSidebar";
import { menus } from "fixture-menus";

const portal = new URLSearchParams(location.search).get("portal") || "tenant";
const items = menus[portal];
if (new URLSearchParams(location.search).has("long")) {
  items.push({ href: `/${portal}/long`, label: "AnExtremelyLongNavigationLabelWithoutSpacesForOverflowCoverage", icon: "FileText" });
}
createRoot(document.getElementById("root")).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <MobileSidebarNavigation
      navItems={items}
      iconSet="tabler"
      activePortal={portal}
      userRoles={["tenant", "landlord", "admin"]}
      profileHref={`/${portal}/profile`}
      favoritesHref={portal === "tenant" ? "/tenant/favorites" : undefined}
      buttonLabel="Open navigation"
      menuLabel={`${portal} navigation`}
      navLabel="Portal navigation"
    />
    <p id="fixture-actions" role="status" />
  </ThemeProvider>,
);
