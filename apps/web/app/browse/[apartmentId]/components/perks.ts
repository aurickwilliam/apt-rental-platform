import {
  Bath,
  BrushCleaning,
  Thermometer,
  Wifi,
  AirVent,
  Tv,
  Refrigerator,
  Microwave,
  Coffee,
  ChefHat,
  Car,
  TramFront,
  ShieldCheck,
  TriangleAlert,
  FireExtinguisher,
  Sofa,
  Shirt,
  Sun,
  WashingMachine,
  Bike,
  PawPrint,
  CigaretteOff,
  Cigarette,
  Flame,
  Wind,
  Dumbbell,
  LockKeyhole,
  LucideIcon,
} from "lucide-react";

export type Perk = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export const PERKS: Record<string, Perk> = {
  bath: { 
    id: "bath", 
    name: "Shower/Bathtub", 
    icon: Bath 
  },
  cleaning: { 
    id: "cleaning", 
    name: "Cleaning Essentials", 
    icon: BrushCleaning 
  },
  hotwater: { 
    id: "hotwater", 
    name: "Hot Water", 
    icon: Thermometer 
  },
  wifi: { 
    id: "wifi", 
    name: "Wi-Fi", 
    icon: Wifi 
  },
  ac: { 
    id: "ac", 
    name: "Air Conditioning", 
    icon: AirVent 
  },
  tv: { 
    id: "tv", 
    name: "TV", 
    icon: Tv 
  },
  fridge: { 
    id: "fridge", 
    name: "Refrigerator", 
    icon: Refrigerator 
  },
  microwave: { 
    id: "microwave", 
    name: "Microwave", 
    icon: Microwave 
  },
  kettle: { 
    id: "kettle", 
    name: "Electric Kettle", 
    icon: Coffee 
  },
  kitchen: { 
    id: "kitchen", 
    name: "Kitchen", 
    icon: ChefHat 
  },
  parking: { 
    id: "parking", 
    name: "Parking", 
    icon: Car 
  },
  parkroad: { 
    id: "parkroad", 
    name: "Street Parking", 
    icon: TramFront 
  },
  security: { 
    id: "security", 
    name: "Security System", 
    icon: ShieldCheck 
  },
  smokealarm: { 
    id: "smokealarm", 
    name: "Smoke Alarm", 
    icon: TriangleAlert 
  },
  fireextinguisher: { 
    id: "fireextinguisher", 
    name: "Fire Extinguisher", 
    icon: FireExtinguisher 
  },
  furniture: { 
    id: "furniture", 
    name: "Furnished", 
    icon: Sofa 
  },
  wardrobe: { 
    id: "wardrobe", 
    name: "Wardrobe", 
    icon: Shirt 
  },
  balcony: { 
    id: "balcony", 
    name: "Balcony Access", 
    icon: Sun 
  },
  washer: { 
    id: "washer", 
    name: "Washing Machine", 
    icon: WashingMachine 
  },
  motorbikeparking: { 
    id: "motorbikeparking", 
    name: "Motorbike Parking", 
    icon: Bike 
  },
  petfriendly: { 
    id: "petfriendly", 
    name: "Pet Friendly", 
    icon: PawPrint 
  },
  nonsmoking: { 
    id: "nonsmoking", 
    name: "Non-Smoking", 
    icon: CigaretteOff 
  },
  smoking: { 
    id: "smoking", 
    name: "Smoking Allowed", 
    icon: Cigarette 
  },
  stove: { 
    id: "stove", 
    name: "Stove", 
    icon: Flame 
  },
  electricfan: { 
    id: "electricfan", 
    name: "Electric Fan", 
    icon: Wind 
  },
  gym: { 
    id: "gym", 
    name: "Gym Access", 
    icon: Dumbbell 
  },
  smartlock: { 
    id: "smartlock", 
    name: "Smart Lock", 
    icon: LockKeyhole 
  },
};
