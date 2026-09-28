import {
  formatUserAddress,
  getAge,
  getFullName,
  joinedFormatter,
  type AdminUserDetail,
} from "../../lib/user-display";
import { InfoField } from "./UserDetailPrimitives";

interface UserPersonalInfoProps {
  user: AdminUserDetail;
}

export default function UserPersonalInfo({ user }: UserPersonalInfoProps) {
  const age = getAge(user.birth_date);
  return (
    <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-nunito text-lg font-bold">Personal information</h2>
      <dl className="mt-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <InfoField label="Full name" value={getFullName(user)} />
        <InfoField label="Email" value={user.email ?? "Not provided"} />
        <InfoField label="Mobile" value={user.mobile_number ?? "Not provided"} />
        <InfoField
          label="Gender"
          value={user.gender ? user.gender : "Not provided"}
        />
        <InfoField
          label="Birth date"
          value={
            user.birth_date
              ? `${joinedFormatter.format(new Date(user.birth_date))}${age !== null ? ` (${age} y/o)` : ""}`
              : "Not provided"
          }
        />
        <InfoField label="Address" value={formatUserAddress(user)} />
        <InfoField
          label="Postal code"
          value={user.postal_code ? String(user.postal_code) : "—"}
        />
        <InfoField label="Internal ID" value={user.id} />
        <InfoField
          label="Last updated"
          value={
            user.updated_at
              ? joinedFormatter.format(new Date(user.updated_at))
              : "—"
          }
        />
      </dl>
    </section>
  );
}
