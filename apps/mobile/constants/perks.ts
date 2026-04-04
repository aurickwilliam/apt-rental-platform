import {
  IconBath,
  IconThermometer,
  IconToiletPaper,
  IconBrush,
  IconWashMachine,
  IconWind,
  IconWifi,
  IconDeviceTv,
  IconAntenna,
  IconAirConditioning,
  IconPropeller,
  IconFridge,
  IconMicrowave,
  IconCoffee,
  IconChefHat,
  IconFlame,
  IconToolsKitchen,
  IconToolsKitchenOff,
  IconDroplet,
  IconSofa,
  IconShirt,
  IconBed,
  IconLamp,
  IconSun,
  IconTree,
  IconFence,
  IconArrowsUpDown,
  IconBuilding,
  IconCar,
  IconTrain,
  IconBike,
  IconParking,
  IconShieldCheck,
  IconCamera,
  IconLock,
  IconBellRinging,
  IconAlertTriangle,
  IconFireExtinguisher,
  IconBolt,
  IconPlug,
  IconBarbell,
  IconSwimming,
  IconPaw,
  IconSmokingNo,
  IconSmoking,
  IconBabyCarriage,
  IconPackage,
  IconTruck,
  type Icon,
} from "@tabler/icons-react-native";

export type Perk = {
  id: string;
  name: string;
  icon: Icon;
};

export const PERKS: Record<string, Perk> = {
  // Bathroom
  bath: { id: "bath", name: "Shower/Bathtub", icon: IconBath },
  hotwater: { id: "hotwater", name: "Hot Water", icon: IconThermometer },
  toilet: { id: "toilet", name: "Private Toilet", icon: IconToiletPaper },

  // Cleaning & Maintenance
  cleaning: { id: "cleaning", name: "Cleaning Essentials", icon: IconBrush },
  washer: { id: "washer", name: "Washing Machine", icon: IconWashMachine },
  dryer: { id: "dryer", name: "Dryer", icon: IconWind },

  // Internet & Entertainment
  wifi: { id: "wifi", name: "Wi-Fi", icon: IconWifi },
  tv: { id: "tv", name: "TV", icon: IconDeviceTv },
  cabletv: { id: "cabletv", name: "Cable TV", icon: IconAntenna },

  // Climate Control
  ac: { id: "ac", name: "Air Conditioning", icon: IconAirConditioning },
  electricfan: { id: "electricfan", name: "Electric Fan", icon: IconPropeller },
  ceiling_fan: { id: "ceiling_fan", name: "Ceiling Fan", icon: IconPropeller },

  // Kitchen & Appliances
  fridge: { id: "fridge", name: "Refrigerator", icon: IconFridge },
  microwave: { id: "microwave", name: "Microwave", icon: IconMicrowave },
  kettle: { id: "kettle", name: "Electric Kettle", icon: IconCoffee },
  kitchen: { id: "kitchen", name: "Kitchen", icon: IconChefHat },
  stove: { id: "stove", name: "Stove", icon: IconFlame },
  cooking_utensils: { id: "cooking_utensils", name: "Cooking Utensils", icon: IconToolsKitchen },
  no_cooking: { id: "no_cooking", name: "No Cooking Allowed", icon: IconToolsKitchenOff },
  water_dispenser: { id: "water_dispenser", name: "Water Dispenser", icon: IconDroplet },

  // Furniture & Fixtures
  furniture: { id: "furniture", name: "Furnished", icon: IconSofa },
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
  parkroad: { id: "parkroad", name: "Street Parking", icon: IconTrain },
  motorbikeparking: { id: "motorbikeparking", name: "Motorbike Parking", icon: IconBike },
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
  water: { id: "water", name: "Water Included", icon: IconDroplet },
  generator: { id: "generator", name: "Generator / Backup Power", icon: IconPlug },

  // Lifestyle
  gym: { id: "gym", name: "Gym Access", icon: IconBarbell },
  pool: { id: "pool", name: "Swimming Pool", icon: IconSwimming },
  petfriendly: { id: "petfriendly", name: "Pet Friendly", icon: IconPaw },
  childfriendly: { id: "childfriendly", name: "Child Friendly", icon: IconBabyCarriage },
  nonsmoking: { id: "nonsmoking", name: "Non-Smoking", icon: IconSmokingNo },
  smoking: { id: "smoking", name: "Smoking Allowed", icon: IconSmoking },

  // Storage & Moving
  storage: { id: "storage", name: "Storage Room", icon: IconPackage },
  moving_in: { id: "moving_in", name: "Move-in Ready", icon: IconTruck },
};