import { requirePassportViewer } from "@/app/components/passport/requirePassportViewer";

// Guards every /landlord/passport route, including direct links to detail.
export default async function LandlordPassportLayout({ children }: { children: React.ReactNode }) {
  await requirePassportViewer("landlord");
  return children;
}
