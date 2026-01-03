import {IMAGES} from "@/constants/images";
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
    imagePath: IMAGES.onboardingImage1,
  },
  {
    id: 2,
    title: 'Explore Rentals',
    description: 'Browse apartments by location, price, and amenities.',
    imagePath: IMAGES.onboardingImage2,
  },
  {
    id: 3,
    title: 'Secure & Easy Transactions',
    description: 'Pay rent securely and chat directly with landlords.',
    imagePath: IMAGES.onboardingImage3,
  },
  {
    id: 4,
    title: 'Verified Listings',
    description: 'All listings are verified to ensure trust and safety.',
    imagePath: IMAGES.onboardingImage4,
  },
];