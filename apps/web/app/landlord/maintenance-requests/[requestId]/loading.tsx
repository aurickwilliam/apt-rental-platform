import MaintenanceDetailShell from "./components/MaintenanceDetailShell";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

export default function MaintenanceDetailLoading() {
  return <MaintenanceDetailShell><RouteLoadingStatus>Loading maintenance request details…</RouteLoadingStatus></MaintenanceDetailShell>;
}
