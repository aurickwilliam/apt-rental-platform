import { ImageSource } from 'expo-image';

import type { TranslationKey } from '@repo/i18n';

interface Slide {
  id: number;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  imagePath: ImageSource;
}

export const SLIDES: Slide[] = [
  {
    id: 1,
    titleKey: 'authMobile.onboarding.slide1.title',
    descriptionKey: 'authMobile.onboarding.slide1.description',
    imagePath: require("../../assets/images/onboarding/onboarding-welcome-1.png"),
  },
  {
    id: 2,
    titleKey: 'authMobile.onboarding.slide2.title',
    descriptionKey: 'authMobile.onboarding.slide2.description',
    imagePath: require("../../assets/images/onboarding/onboarding-explore-2.png"),
  },
  {
    id: 3,
    titleKey: 'authMobile.onboarding.slide3.title',
    descriptionKey: 'authMobile.onboarding.slide3.description',
    imagePath: require("../../assets/images/onboarding/onboarding-transactions-3.png"),
  },
  {
    id: 4,
    titleKey: 'authMobile.onboarding.slide4.title',
    descriptionKey: 'authMobile.onboarding.slide4.description',
    imagePath: require("../../assets/images/onboarding/onboarding-verified-4.png"),
  },
];
