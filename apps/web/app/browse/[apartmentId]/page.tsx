import Amenities from "./components/Amenities";
import BackBtn from "./components/BackBtn";
import ImageHeader from "./components/ImageHeader";


import { Divider } from "@heroui/react";

import { House } from "lucide-react";
import MapLocation from "./components/MapLocation";
import RatingSection from "./components/RatingsSection";

export default async function ApartmentDetailsPage({ params }: { params: Promise<{ apartmentId: string }> }) {
  const { apartmentId } = await params;

  // In a real application, you would fetch the apartment details using the apartmentId
  // For this example, we'll just display the ID
  const IMAGES = [
    "/default/default-thumbnail.jpeg",
    "/default/default-thumbnail2.jpg",
    "/default/default-thumbnail3.jpg",
    "/default/default-thumbnail4.jpg",
  ]

  // Replace with actual perk IDs from the apartment data
  const apartmentPerks = ["wifi", "parking", "gym", "washer", "smartlock", "tv", "fridge", "microwave", "kettle", "kitchen"];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <BackBtn />
      
      {/* Image Header */}
      <div className="my-4">
        <ImageHeader imageUrl={IMAGES} />
      </div>

      <div className="w-full flex gap-5">
        {/* Apartment Details */}
        <div className="w-2/3">
          {/* Name and Address */}
          <div>
            <h1 className="text-3xl font-medium font-dm-serif text-primary">
              Apartment Name - ID: {apartmentId}
            </h1>

            <h3>
              Street Name, City, State, Zip Code
            </h3>
          </div>

          {/* Type */}
          <div className="my-4 flex gap-2 items-center">
            <House size={22} className="text-grey-700" />
            <h2 className="text-lg font-medium text-grey-700">
              Studio Type
            </h2>
          </div>

          <Divider className="my-8" />

          {/* Description */}
          <div className="max-h-64 overflow-y-auto">
            <h3 className="text-lg font-medium mb-2">
              Description
            </h3>
            <p>
              This is a brief description of the apartment. It includes information about the amenities, location, and other details that potential tenants might be interested in.
            </p>
          </div>

          <Divider className="my-8" />

          <Amenities apartmentPerks={apartmentPerks} />

          <Divider className="my-8" />

          <div>
            <h3 className="text-lg font-medium mb-2">
              View on Map
            </h3>
            <MapLocation />
          </div>

          <Divider className="my-8" />

          {/* Ratings */}
          <div>
            <h3 className="text-lg font-medium mb-8">
              Ratings & Reviews
            </h3>

            <RatingSection 
              overallRate={4.5} 
              totalReviews={34}
              no5Star={10} 
              no4Star={20} 
              no3Star={2}
              no2Star={1} 
              no1Star={1} 
            />
          </div>
        </div>

        {/* Price and Application */}
        <div className="w-1/3 bg-amber-200"> 

        </div>
      </div>
    </div>
  );
}
