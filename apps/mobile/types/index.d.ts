interface ApartmentCardProps {
  id: string;
  thumbnail?: { uri: string };
  name?: string;
  location?: string;
  ratings?: string;
  isFavorite?: boolean;
  monthlyRent?: number;
  noBedroom?: number;
  noBathroom?: number;
  areaSqm?: number;
  isGrid?: boolean;
  onPress?: () => void;
  onPressFavorite?: () => void;
}
