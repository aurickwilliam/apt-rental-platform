import {
  IconAirConditioning,
  IconAlertTriangle,
  IconArmchair,
  IconArrowsUpDown,
  IconBabyCarriage,
  IconBarbell,
  IconBath,
  IconBed,
  IconBellRinging,
  IconBolt,
  IconBrush,
  IconBuilding,
  IconCamera,
  IconCar,
  IconCoffee,
  IconDeviceTv,
  IconDroplets,
  IconFence,
  IconFireExtinguisher,
  IconFlame,
  IconFridge,
  IconLamp,
  IconLock,
  IconMicrowave,
  IconMotorbike,
  IconPackage,
  IconParking,
  IconPaw,
  IconPlug,
  IconPool,
  IconShieldCheck,
  IconShirt,
  IconSmoking,
  IconSmokingNo,
  IconSun,
  IconTemperature,
  IconToolsKitchen2,
  IconTree,
  IconTruck,
  IconWashMachine,
  IconWifi,
  IconWind,
  type Icon,
} from "@tabler/icons-react";

export type Perk = {
  id: string;
  name: string;
  icon: Icon;
};

export const PERKS: Record<string, Perk> = {
  // Bathroom
  bath: { id: "bath", name: "Shower/Bathtub", icon: IconBath },
  hotwater: { id: "hotwater", name: "Hot Water", icon: IconTemperature },
  toilet: { id: "toilet", name: "Private Toilet", icon: IconBath },

  // Cleaning & Maintenance
  cleaning: { id: "cleaning", name: "Cleaning Essentials", icon: IconBrush },
  washer: { id: "washer", name: "Washing Machine", icon: IconWashMachine },
  dryer: { id: "dryer", name: "Dryer", icon: IconWind },

  // Internet & Entertainment
  wifi: { id: "wifi", name: "Wi-Fi", icon: IconWifi },
  tv: { id: "tv", name: "TV", icon: IconDeviceTv },
  cabletv: { id: "cabletv", name: "Cable TV", icon: IconDeviceTv },

  // Climate Control
  ac: { id: "ac", name: "Air Conditioning", icon: IconAirConditioning },
  electricfan: { id: "electricfan", name: "Electric Fan", icon: IconWind },
  ceiling_fan: { id: "ceiling_fan", name: "Ceiling Fan", icon: IconWind },

  // Kitchen & Appliances
  fridge: { id: "fridge", name: "Refrigerator", icon: IconFridge },
  microwave: { id: "microwave", name: "Microwave", icon: IconMicrowave },
  kettle: { id: "kettle", name: "Electric Kettle", icon: IconCoffee },
  kitchen: { id: "kitchen", name: "Kitchen", icon: IconToolsKitchen2 },
  stove: { id: "stove", name: "Stove", icon: IconFlame },
  cooking_utensils: { id: "cooking_utensils", name: "Cooking Utensils", icon: IconToolsKitchen2 },
  no_cooking: { id: "no_cooking", name: "No Cooking Allowed", icon: IconToolsKitchen2 },
  water_dispenser: { id: "water_dispenser", name: "Water Dispenser", icon: IconDroplets },

  // Furniture & Fixtures
  furniture: { id: "furniture", name: "Furnished", icon: IconArmchair },
  wardrobe: { id: "wardrobe", name: "Wardrobe", icon: IconShirt },
  bed: { id: "bed", name: "Bed Included", icon: IconBed },
  lamp: { id: "lamp", name: "Study Lamp", icon: IconLamp },

  // Outdoor & Building
  balcony: { id: "balcony", name: "Balcony Access", icon: IconSun },
  garden: { id: "garden", name: "Garden", icon: IconTree },
  fenced: { id: "fenced", name: "Fenced Compound", icon: IconFence },
  elevator: { id: "elevator", name: "Elevator", icon: IconArrowsUpDown },
  rooftop: { id: "rooftop", name: "Rooftop Access", icon: IconBuilding },

  // Parking
  parking: { id: "parking", name: "Parking", icon: IconCar },
  parkroad: { id: "parkroad", name: "Street Parking", icon: IconCar },
  motorbikeparking: { id: "motorbikeparking", name: "Motorbike Parking", icon: IconMotorbike },
  covered_parking: { id: "covered_parking", name: "Covered Parking", icon: IconParking },

  // Security
  security: { id: "security", name: "Security Guard", icon: IconShieldCheck },
  cctv: { id: "cctv", name: "CCTV", icon: IconCamera },
  smartlock: { id: "smartlock", name: "Smart Lock", icon: IconLock },
  intercom: { id: "intercom", name: "Intercom / Doorbell", icon: IconBellRinging },
  smokealarm: { id: "smokealarm", name: "Smoke Alarm", icon: IconAlertTriangle },
  fireextinguisher: { id: "fireextinguisher", name: "Fire Extinguisher", icon: IconFireExtinguisher },

  // Utilities
  electricity: { id: "electricity", name: "Electricity Included", icon: IconBolt },
  water: { id: "water", name: "Water Included", icon: IconDroplets },
  generator: { id: "generator", name: "Generator / Backup Power", icon: IconPlug },

  // Lifestyle
  gym: { id: "gym", name: "Gym Access", icon: IconBarbell },
  pool: { id: "pool", name: "Swimming Pool", icon: IconPool },
  petfriendly: { id: "petfriendly", name: "Pet Friendly", icon: IconPaw },
  childfriendly: { id: "childfriendly", name: "Child Friendly", icon: IconBabyCarriage },
  nonsmoking: { id: "nonsmoking", name: "Non-Smoking", icon: IconSmokingNo },
  smoking: { id: "smoking", name: "Smoking Allowed", icon: IconSmoking },

  // Storage & Moving
  storage: { id: "storage", name: "Storage Room", icon: IconPackage },
  moving_in: { id: "moving_in", name: "Move-in Ready", icon: IconTruck },
};
