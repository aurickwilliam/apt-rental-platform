// Replacements for the two children the property components load outside this
// fixture's scope: the Google Maps picker (needs an API key and network) and
// the verification button (a server action).
export default function GoogleMapPicker({ latitude, longitude }) {
  return (
    <div data-fixture="map-picker" className="rounded-lg border border-dashed p-3 text-sm">
      Map pin: {latitude ?? "—"}, {longitude ?? "—"}
    </div>
  );
}

export function SubmitApartmentVerificationButton({ status }) {
  return <span data-fixture="verification">{status ?? "unverified"}</span>;
}
