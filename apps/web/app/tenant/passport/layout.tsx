import { requirePassportViewer } from "@/app/components/passport/requirePassportViewer";

// Guards every /tenant/passport route, including direct links to add/detail.
export default async function TenantPassportLayout({ children }: { children: React.ReactNode }) {
  await requirePassportViewer("tenant");
  return children;
}
