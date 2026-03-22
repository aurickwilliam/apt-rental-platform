"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@heroui/react";
import ApartmentCard from "../../components/ui/ApartmentCard";

interface ApartmentItem {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
}

interface RenderApartmentsProps {
  apartment: ApartmentItem[];
  page: number;
  totalCount: number;
  pageSize: number;
}

export default function RenderApartments({ apartment, page, totalCount, pageSize }: RenderApartmentsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(searchParams.toString());
    current.set("page", String(newPage));
    router.push(`/browse?${current.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {apartment.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-default-400">
          <p className="text-lg font-medium">No apartments found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {apartment.map(apt => (
            <ApartmentCard
              key={apt.id}
              name={apt.name}
              location={apt.location}
              price={apt.price}
              rating={apt.rating}
              thumbnailUrl={apt.image}
              onPress={() => router.push(`/browse/${apt.id}`)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            radius="full"
            showControls
          />
        </div>
      )}
    </div>
  );
}