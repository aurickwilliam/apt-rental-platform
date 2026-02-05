import {
  IconBath,
  IconSpray,
  IconTemperature,
  IconWifi,
  IconAirConditioning,
  IconDeviceTv,
  IconFridge,
  IconMicrowave,
  IconTeapot,
  IconToolsKitchen2,
  IconCar,
  IconRoad,
  IconShieldCheck,
  IconAlertTriangle,
  IconFireExtinguisher,
  IconSofa,
  IconHanger,
  IconSun,
  IconWashMachine,
  IconMotorbike,
  IconPaw,
  IconSmokingNo,
  IconSmoking,
  IconCooker,
  IconPropeller,
  IconBarbell,
  IconLockAccess,
  IconProps
} from '@tabler/icons-react-native';

type Perk = {
  id: string;
  name: string;
  icon: React.ComponentType<IconProps>;
}

export const PERKS: Record<string, Perk> = {
  'bath': {
    id: 'bath',
    name: 'Shower/Bathtub',
    icon: IconBath,
  },
  'cleaning': {
    id: 'cleaning',
    name: 'Cleaning Essentials', 
    icon: IconSpray,
  },
  'hotwater': {
    id: 'hotwater',
    name: 'Hot Water',
    icon: IconTemperature,
  },
  'wifi': {
    id: 'wifi',
    name: 'Wi-Fi',
    icon: IconWifi,
  },
  'ac': {
    id: 'ac',
    name: 'Air Conditioning',
    icon: IconAirConditioning,
  },
  'tv': {
    id: 'tv',
    name: 'TV',
    icon: IconDeviceTv,
  },
  'fridge': {
    id: 'fridge',
    name: 'Refrigerator',
    icon: IconFridge,
  },
  'microwave': {
    id: 'microwave',
    name: 'Microwave',
    icon: IconMicrowave,
  },
  'kettle': {
    id: 'kettle',
    name: 'Electric Kettle',
    icon: IconTeapot,
  },
  'kitchen': {
    id: 'kitchen',
    name: 'Kitchen',
    icon: IconToolsKitchen2,
  },
  'parking': {
    id: 'parking',
    name: 'Parking',
    icon: IconCar,
  },
  'parkroad': {
    id: 'parkroad',
    name: 'Street Parking',
    icon: IconRoad,
  },
  'security': {
    id: 'security',
    name: 'Security System',
    icon: IconShieldCheck,
  },
  'smokealarm': {
    id: 'smokealarm',
    name: 'Smoke Alarm',
    icon: IconAlertTriangle,
  },
  'fireextinguisher': {
    id: 'fireextinguisher',
    name: 'Fire Extinguisher',
    icon: IconFireExtinguisher,
  },
  'furniture': {
    id: 'furniture',
    name: 'Furnished',
    icon: IconSofa,
  },
  'wardrobe': {
    id: 'wardrobe',
    name: 'Wardrobe',
    icon: IconHanger,
  },
  'balcony': {
    id: 'balcony',
    name: 'Balcony Access',
    icon: IconSun,
  },
  'washer': {
    id: 'washer',
    name: 'Washing Machine',
    icon: IconWashMachine,
  },
  'motorbikeparking': {
    id: 'motorbikeparking',
    name: 'Motorbike Parking',
    icon: IconMotorbike
  },
  'petfriendly': {
    id: 'petfriendly',
    name: 'Pet Friendly',
    icon: IconPaw,
  },
  'nonsmoking': {
    id: 'nonsmoking',
    name: 'Non-Smoking',
    icon: IconSmokingNo,
  },
  'smoking': {
    id: 'smoking',
    name: 'Smoking Allowed',
    icon: IconSmoking,
  },
  'stove': {
    id: 'stove',
    name: 'Stove',
    icon: IconCooker,
  },
  'electricfan': {
    id: 'electricfan',
    name: 'Electric Fan',
    icon: IconPropeller,
  },
  'gym': {
    id: 'gym',
    name: 'Gym Access',
    icon: IconBarbell,
  },
  'smartlock': {
    id: 'smartlock',
    name: 'Smart Lock',
    icon: IconLockAccess,
  },
}