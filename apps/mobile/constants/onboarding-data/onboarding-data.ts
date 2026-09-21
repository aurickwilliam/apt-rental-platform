import { ImageSource } from 'expo-image';

interface Slide {
  id: number;
  title: string;
  description: string;
  imagePath: ImageSource;
}

export const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Welcome!',
    description: 'Find your perfect apartment in just a few taps.',
    imagePath: require("../../assets/images/onboarding/onboarding-welcome-1.png"),
  },
  {
    id: 2,
    title: 'Explore Rentals',
    description: 'Browse apartments by location, price, and amenities.',
    imagePath: require("../../assets/images/onboarding/onboarding-explore-2.png"),
  },
  {
    id: 3,
    title: 'Secure & Easy Transactions',
    description: 'Pay rent securely and chat directly with landlords.',
    imagePath: require("../../assets/images/onboarding/onboarding-transactions-3.png"),
  },
  {
    id: 4,
    title: 'Verified Listings',
    description: 'All listings are verified to ensure trust and safety.',
    imagePath: require("../../assets/images/onboarding/onboarding-verified-4.png"),
  },
];