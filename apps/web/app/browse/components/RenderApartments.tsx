"use client";

import { useRouter } from "next/navigation";

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
}

export default function RenderApartments({apartment}: RenderApartmentsProps) {
  const route = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {apartment.map(apt => (
        <ApartmentCard
          key={apt.id}
          id={apt.id}
          name={apt.name}
          location={apt.location}
          price={apt.price}
          rating={apt.rating}
          thumbnailUrl={apt.image}
          onPress={() => route.push(`/browse/${apt.id}`)}
        />
      ))}
    </div>
  );
}
