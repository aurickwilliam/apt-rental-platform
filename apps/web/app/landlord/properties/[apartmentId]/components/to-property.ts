import type { Property } from "../../components/propertyTypes";
import type { LandlordUnitApartment } from "@/service/landlordUnitDetailService";

const DEFAULT_THUMBNAIL = "/default/default-thumbnail.jpeg";

// Detail apartment → legacy Property shape consumed by the existing edit modals.
export function toProperty(apartment: LandlordUnitApartment): Property {
  const cover =
    apartment.apartment_images.find((img) => img.is_cover) ?? apartment.apartment_images[0];
  return {
    id: apartment.id,
    name: apartment.name,
    description: apartment.description,
    monthly_rent: apartment.monthly_rent,
    security_deposit: apartment.security_deposit,
    advance_rent: apartment.advance_rent,
    type: apartment.type,
    street_address: apartment.street_address,
    barangay: apartment.barangay,
    city: apartment.city,
    province: apartment.province,
    zip_code: apartment.zip_code,
    status: apartment.status,
    average_rating: apartment.average_rating ?? 0,
    no_ratings: apartment.no_ratings ?? 0,
    no_bedrooms: apartment.no_bedrooms,
    no_bathrooms: apartment.no_bathrooms,
    area_sqm: apartment.area_sqm,
    max_occupants: apartment.max_occupants,
    furnished_type: apartment.furnished_type,
    floor_level: apartment.floor_level,
    lease_duration: apartment.lease_duration,
    latitude: null,
    longitude: null,
    amenities: apartment.amenities,
    thumbnail: cover?.url_thumb || cover?.url || DEFAULT_THUMBNAIL,
    lease_agreement_url: apartment.lease_agreement_url,
  };
}
