export interface ApartmentCardProps {
  id: number;
  thumbnail?: string;
  name?: string;
  location?: string;
  ratings?: string;
  isFavorite?: boolean;
  monthlyRent?: number;
  noBedroom?: number;
  noBathroom?: number;
  areaSqm?: number;
  isGrid?: boolean;
}
