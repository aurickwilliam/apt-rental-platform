// apps/web/app/(main)/tos/components/TosContact.tsx
import { Card } from "@heroui/react";
import { BRAND } from "../data/tos-sections";

export default function TosContact() {
  return (
    <Card className="mt-4 bg-surface border border-default-200 shadow-none p-6">
      <div className="mb-3 text-xs font-poppinsSemiBold uppercase tracking-widest text-default-500">
        Questions about these Terms?
      </div>
      <ul className="space-y-1.5 text-sm text-default-700 leading-relaxed">
        <li>
          <strong className="font-poppinsSemiBold">Email:</strong> {BRAND.email}
        </li>
        <li>
          <strong className="font-poppinsSemiBold">Address:</strong> {BRAND.address}
        </li>
        <li>
          <strong className="font-poppinsSemiBold">Hours:</strong> {BRAND.hours}
        </li>
      </ul>
    </Card>
  );
}