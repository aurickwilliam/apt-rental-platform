import ApplicationDetailShell from "./components/ApplicationDetailShell";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

export default function ApplicationDetailLoading() {
  return <ApplicationDetailShell><RouteLoadingStatus>Loading application details…</RouteLoadingStatus></ApplicationDetailShell>;
}
