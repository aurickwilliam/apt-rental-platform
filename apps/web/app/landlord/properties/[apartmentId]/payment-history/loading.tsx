import PropertyPaymentHistoryShell from "./components/PropertyPaymentHistoryShell";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

export default function PropertyPaymentHistoryLoading() {
  return <PropertyPaymentHistoryShell><RouteLoadingStatus>Loading payment history…</RouteLoadingStatus></PropertyPaymentHistoryShell>;
}
