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
  Waves,
  Zap,
  Droplets,
  Building2,
  Camera,
  BellRing,
  Utensils,
  UtensilsCrossed,
  Toilet,
  BedDouble,
  Baby,
  TreePine,
  Fence,
  Podcast,
  Plug,
  Lamp,
  Package,
  Truck,
  CircleParking,
  ArrowUpDown,
  LucideIcon,
} from "lucide-react";

export type Perk = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export const PERKS: Record<string, Perk> = {
  // Bathroom
  bath: { id: "bath", name: "Shower/Bathtub", icon: Bath },
  hotwater: { id: "hotwater", name: "Hot Water", icon: Thermometer },
  toilet: { id: "toilet", name: "Private Toilet", icon: Toilet },

  // Cleaning & Maintenance
  cleaning: { id: "cleaning", name: "Cleaning Essentials", icon: BrushCleaning },
  washer: { id: "washer", name: "Washing Machine", icon: WashingMachine },
  dryer: { id: "dryer", name: "Dryer", icon: Wind },

  // Internet & Entertainment
  wifi: { id: "wifi", name: "Wi-Fi", icon: Wifi },
  tv: { id: "tv", name: "TV", icon: Tv },
  cabletv: { id: "cabletv", name: "Cable TV", icon: Podcast },

  // Climate Control
  ac: { id: "ac", name: "Air Conditioning", icon: AirVent },
  electricfan: { id: "electricfan", name: "Electric Fan", icon: Wind },
  ceiling_fan: { id: "ceiling_fan", name: "Ceiling Fan", icon: Wind },

  // Kitchen & Appliances
  fridge: { id: "fridge", name: "Refrigerator", icon: Refrigerator },
  microwave: { id: "microwave", name: "Microwave", icon: Microwave },
  kettle: { id: "kettle", name: "Electric Kettle", icon: Coffee },
  kitchen: { id: "kitchen", name: "Kitchen", icon: ChefHat },
  stove: { id: "stove", name: "Stove", icon: Flame },
  cooking_utensils: { id: "cooking_utensils", name: "Cooking Utensils", icon: Utensils },
  no_cooking: { id: "no_cooking", name: "No Cooking Allowed", icon: UtensilsCrossed },
  water_dispenser: { id: "water_dispenser", name: "Water Dispenser", icon: Droplets },

  // Furniture & Fixtures
  furniture: { id: "furniture", name: "Furnished", icon: Sofa },
  wardrobe: { id: "wardrobe", name: "Wardrobe", icon: Shirt },
  bed: { id: "bed", name: "Bed Included", icon: BedDouble },
  lamp: { id: "lamp", name: "Study Lamp", icon: Lamp },

  // Outdoor & Building
  balcony: { id: "balcony", name: "Balcony Access", icon: Sun },
  garden: { id: "garden", name: "Garden", icon: TreePine },
  fenced: { id: "fenced", name: "Fenced Compound", icon: Fence },
  elevator: { id: "elevator", name: "Elevator", icon: ArrowUpDown },
  rooftop: { id: "rooftop", name: "Rooftop Access", icon: Building2 },

  // Parking
  parking: { id: "parking", name: "Parking", icon: Car },
  parkroad: { id: "parkroad", name: "Street Parking", icon: TramFront },
  motorbikeparking: { id: "motorbikeparking", name: "Motorbike Parking", icon: Bike },
  covered_parking: { id: "covered_parking", name: "Covered Parking", icon: CircleParking },

  // Security
  security: { id: "security", name: "Security Guard", icon: ShieldCheck },
  cctv: { id: "cctv", name: "CCTV", icon: Camera },
  smartlock: { id: "smartlock", name: "Smart Lock", icon: LockKeyhole },
  intercom: { id: "intercom", name: "Intercom / Doorbell", icon: BellRing },
  smokealarm: { id: "smokealarm", name: "Smoke Alarm", icon: TriangleAlert },
  fireextinguisher: { id: "fireextinguisher", name: "Fire Extinguisher", icon: FireExtinguisher },

  // Utilities
  electricity: { id: "electricity", name: "Electricity Included", icon: Zap },
  water: { id: "water", name: "Water Included", icon: Droplets },
  generator: { id: "generator", name: "Generator / Backup Power", icon: Plug },

  // Lifestyle
  gym: { id: "gym", name: "Gym Access", icon: Dumbbell },
  pool: { id: "pool", name: "Swimming Pool", icon: Waves },
  petfriendly: { id: "petfriendly", name: "Pet Friendly", icon: PawPrint },
  childfriendly: { id: "childfriendly", name: "Child Friendly", icon: Baby },
  nonsmoking: { id: "nonsmoking", name: "Non-Smoking", icon: CigaretteOff },
  smoking: { id: "smoking", name: "Smoking Allowed", icon: Cigarette },

  // Storage & Moving
  storage: { id: "storage", name: "Storage Room", icon: Package },
  moving_in: { id: "moving_in", name: "Move-in Ready", icon: Truck },
};
