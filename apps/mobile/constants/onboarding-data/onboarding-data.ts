import { ImageSourcePropType } from "react-native";

interface Slide {
  id: number;
  title: string;
  description: string;
  imagePath: ImageSourcePropType;
}

export const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Welcome!',
    description: 'Find your perfect apartment in just a few taps.',
    imagePath: require("../../assets/images/splash-image/welcome.png"),
  },
  {
    id: 2,
    title: 'Explore Rentals',
    description: 'Browse apartments by location, price, and amenities.',
    imagePath: require("../../assets/images/splash-image/explore-rentals.png"),
  },
  {
    id: 3,
    title: 'Secure & Easy Transactions',
    description: 'Pay rent securely and chat directly with landlords.',
    imagePath: require("../../assets/images/splash-image/secure-transactions.png"),
  },
  {
    id: 4,
    title: 'Verified Listings',
    description: 'All listings are verified to ensure trust and safety.',
    imagePath: require("../../assets/images/splash-image/verified-listing.png"),
  },
];