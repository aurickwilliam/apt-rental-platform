import { getLandlordUnitDetail, UnitNotice } from "../lib/get-unit-detail";
import DescriptionClient from "./components/DescriptionClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ apartmentId: string }>;
};

export default async function LandlordPropertyDescriptionPage({ params }: PageProps) {
  const { apartmentId } = await params;
  const result = await getLandlordUnitDetail(apartmentId);
  if ("error" in result) {
    return <UnitNotice title={result.error.title} message={result.error.message} />;
  }
  return <DescriptionClient detail={result.detail} />;
}
