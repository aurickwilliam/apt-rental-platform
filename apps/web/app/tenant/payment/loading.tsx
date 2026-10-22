import { PaymentPageHeader, PaymentPageShell } from "./components/PaymentPageLayout";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

export default function TenantPaymentLoading() {
  return <PaymentPageShell><PaymentPageHeader /><RouteLoadingStatus>Loading payment details…</RouteLoadingStatus></PaymentPageShell>;
}
