import { Card } from "@heroui/react";

import MobileVerifyClient from "./components/MobileVerifyClient";

type MobileVerifyPageProps = {
  searchParams: Promise<{ token?: string }>;
};

// Phone entry opened from the desktop QR code. The token is opaque (no PII);
// it is validated against the signed-in owner on claim, and consumed only
// on successful submit. Abandoning the page simply lets it expire.
export default async function MobileVerifyPage({ searchParams }: MobileVerifyPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-8">
        <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl">
          <Card.Content className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-nunito text-xl font-bold">Invalid verification link</h1>
            <p className="text-sm text-muted-foreground">
              This page needs a code from your computer. Open your profile,
              start verification, and scan the QR code again.
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <MobileVerifyClient token={token} />
    </div>
  );
}
