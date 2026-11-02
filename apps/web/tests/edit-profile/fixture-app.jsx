import { createRoot } from "react-dom/client";
import { Card, Toast } from "@heroui/react";
import ProfileForm from "../../app/components/profile/ProfileForm";
import EditableCover from "../../app/components/profile/EditableCover";

const initial = {
  email: "preview@example.com",
  first_name: "Preview",
  middle_name: null,
  last_name: "Tenant",
  suffix: null,
  birth_date: "2000-01-01",
  gender: "Male",
  mobile_number: "09171234567",
  street_address: "123 Preview Street",
  barangay: "Barangay 158",
  city: "Caloocan",
  province: "Metro Manila",
  postal_code: 1401,
};
window.fixtureWrites = [];
window.fixturePhotoWrites = [];
const standalone = new URLSearchParams(location.search).has("standalone");
const cover = new URLSearchParams(location.search).has("cover");
const empty = new URLSearchParams(location.search).has("empty");
createRoot(document.getElementById("root")).render(
  <main className="mx-auto w-full max-w-7xl p-4">
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <div data-testid="profile-details">
        {cover ? (
          <EditableCover authUserId="preview-user" initialUrl={empty ? null : `${location.origin}/initial.png`} />
        ) : (
          <ProfileForm initial={initial} initialMode={standalone ? "edit" : "view"} />
        )}
      </div>
    </Card>
    <Toast.Provider />
  </main>,
);
