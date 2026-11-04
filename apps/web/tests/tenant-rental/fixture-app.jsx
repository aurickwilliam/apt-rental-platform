import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import ApplicationsList from "../../app/tenant/my-rental/components/ApplicationsList";
import MyRentalClient from "../../app/tenant/my-rental/MyRentalClient";
import ApplicationDetailClient from "../../app/tenant/applications/[applicationId]/ApplicationDetailClient";
import MaintenanceClient from "../../app/tenant/maintenance/MaintenanceClient";
import { AUTH_ID, TENANT_ID, applications, rental, rentals, requests, screen } from "./fixture-transports";

const seed = (data, resourceId) => ({ authUserId: AUTH_ID, profileId: TENANT_ID, data, resourceId, renderedAt: new Date().toISOString(), error: null });
const context = { authUserId: AUTH_ID, tenantId: TENANT_ID, tenancy: rentals.length === 1 ? rental : null, tenancies: rentals, renderedAt: new Date().toISOString(), error: null };
createRoot(document.getElementById("root")).render(
  <ThemeProvider attribute="class" defaultTheme={new URLSearchParams(location.search).has("dark") ? "dark" : "light"} enableSystem={false}>
    <main className="min-h-dvh min-w-0 bg-background text-foreground">
      {screen === "applications" ? <div className="p-4"><ApplicationsList applications={applications} loading={false} error={null} /></div> : null}
      {screen === "rental" ? <MyRentalClient initialContext={context} /> : null}
      {screen === "detail" ? <ApplicationDetailClient initial={seed({ application: seed(applications, "application-0"), personalInfo: {}, visits: {} }, "application-0")} /> : null}
      {screen === "maintenance" ? <MaintenanceClient initial={seed({ context, history: seed(requests, "all") })} /> : null}
      <p id="fixture-actions" role="status" />
    </main>
  </ThemeProvider>,
);
