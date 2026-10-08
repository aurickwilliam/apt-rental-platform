import { Card } from "@heroui/react";
import { CircleCheckBig } from "lucide-react";

export default function SubmittedStep({ apartmentName }: { apartmentName: string | null }) {
  return (
    <Card className="border border-border bg-card p-8 text-center text-card-foreground shadow-none md:p-12">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success/10">
        <CircleCheckBig size={32} className="text-success" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold text-primary md:text-3xl">Application Sent!</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-card-foreground">
        Your application for <span className="font-semibold">{apartmentName}</span> has been submitted with your APT
        Passport documents. The rental owner will review it and get back to you.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">You can follow its status from My Rental.</p>
    </Card>
  );
}
