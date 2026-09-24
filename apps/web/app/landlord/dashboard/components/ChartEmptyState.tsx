import { ChartNoAxesCombined } from "lucide-react";

type Props = {
  title: string;
  description: string;
};

export default function ChartEmptyState({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="bg-gray-100 rounded-full p-5">
        <ChartNoAxesCombined size={36} className="text-grey-500" />
      </div>
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-grey-500">{description}</p>
    </div>
  );
}
