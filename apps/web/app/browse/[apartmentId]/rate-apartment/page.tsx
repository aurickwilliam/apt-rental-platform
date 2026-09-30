import { Suspense } from "react";

import { RateApartmentForm } from "../components/RateApartmentForm";

export default function RateApartmentPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-4 text-sm">Loading…</div>}>
      <RateApartmentForm />
    </Suspense>
  );
}
