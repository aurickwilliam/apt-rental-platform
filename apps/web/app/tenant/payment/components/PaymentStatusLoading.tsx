import { Spinner } from "@heroui/react";

interface PaymentStatusLoadingProps {
  message: string;
  receipt?: boolean;
}

export default function PaymentStatusLoading({ message, receipt = false }: PaymentStatusLoadingProps) {
  return (
    <div className={`${receipt ? "min-h-[60vh]" : "min-h-screen"} px-5 flex flex-col`} style={{ backgroundColor: "#376BF5" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center" role="status" aria-busy="true">
        <Spinner size="lg" color="current" className="text-white" aria-hidden="true" />
        <p className="text-white text-base font-inter">{message}</p>
      </div>
    </div>
  );
}
