import { StrictMode, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Button } from "@heroui/react";
import ApplyStartModal from "../../app/browse/[apartmentId]/apply/components/ApplyStartModal";
import PassportProfileCard from "../../app/components/passport/PassportProfileCard";
import VerifyClient from "../../app/verify/components/VerifyClient";
import MobileVerifyClient from "../../app/verify/mobile/components/MobileVerifyClient";
import VerifySubmitConfirm from "../../app/verify/components/VerifySubmitConfirm";
import { verificationApartmentPath } from "../../lib/profile-verification-navigation";
import { usePathname } from "./fixture-next";
import { status } from "./fixture-state";

function Fixture() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname === "/tenant/profile" || pathname === "/landlord/profile") {
    return <main className="p-6">
      <h1>Profile</h1>
      <PassportProfileCard accountStatus={status()} basePath={pathname.replace("profile", "passport")} verificationSlot={<p>Existing verification activity</p>} />
    </main>;
  }
  if (pathname === "/verify") {
    return <VerifyClient siteUrl="https://apt.test" accountStatus={status()} hasPending={false} />;
  }
  if (pathname === "/verify/mobile") {
    const params = new URLSearchParams(location.search);
    const returnTo = verificationApartmentPath(params.get("returnTo"));
    return <main className="mobile-verification-page">
      <MobileVerifyClient key={params.get("token")} token={params.get("token")} returnTo={returnTo} />
      {returnTo ? <a href={returnTo} className="mobile-verification-return">Return to apartment</a> : null}
      {/* Test-only diagnostic: React text escaping, never HTML insertion. */}
      <output hidden data-testid="requested-return-destination">{params.get("returnTo") ?? ""}</output>
    </main>;
  }
  if (pathname === "/confirmation") {
    const params = new URLSearchParams(location.search);
    return <VerifySubmitConfirm open isSubmitting={false} idPhotosReady={params.get("id") === "true"} selfieReady={params.get("selfie") === "true"}
      onConfirm={() => { window.fixtureConfirmations = (window.fixtureConfirmations || 0) + 1; }} onClose={() => {}} />;
  }
  return <main className="p-6">
    <h1>Apartment details</h1>
    <Button onPress={() => setOpen(true)}>Apply Now</Button>
    <ApplyStartModal isOpen={open} onOpenChange={setOpen} basePath="/tenant/browse"
      viewer={{ userId: "fixture-user", accountStatus: status(), hasActiveApplication: false }}
      apartment={{ id: "apartment-1", name: "Fixture apartment", location: "Navotas", coverUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E", landlordId: "other-user", monthlyRent: 5000, securityDeposit: 5000, advanceRent: 5000, maxOccupants: 2 }} />
  </main>;
}
const root = document.getElementById("root");
if (location.pathname === "/hydration") {
  const tree = <StrictMode><VerifyClient siteUrl="https://apt.test" accountStatus="unverified" hasPending={false} /></StrictMode>;
  // The builder renders the production neutral state on Node. Hydrate that
  // existing server markup rather than inserting an HTML string in the browser.
  window.fixtureServerHTML = root.innerHTML;
  hydrateRoot(root, tree, { onRecoverableError: error => { window.fixtureHydrationErrors = [...(window.fixtureHydrationErrors || []), error.message]; } });
} else {
  createRoot(root).render(<StrictMode><Fixture /></StrictMode>);
}
