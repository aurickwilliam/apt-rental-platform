import BackBtn from "./BackBtn";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

interface ApartmentDestinationLoadingProps {
  title: string;
  message: string;
}

/** Forms and reviews must not inherit the apartment gallery placeholder. */
export default function ApartmentDestinationLoading({ title, message }: ApartmentDestinationLoadingProps) {
  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <BackBtn />
      <h1 className="mt-4 font-nunito text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
      <RouteLoadingStatus>{message}</RouteLoadingStatus>
    </div>
  );
}
