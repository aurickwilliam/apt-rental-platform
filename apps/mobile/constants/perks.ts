import {
  IconBath,
  IconToiletPaper,
  IconBrush,
  IconWashMachine,
  IconWind,
  IconWifi,
  IconDeviceTv,
  IconAntenna,
  IconAirConditioning,
  IconWindmill,
  IconFridge,
  IconMicrowave,
  IconCoffee,
  IconChefHat,
  IconFlame,
  IconToolsKitchen2,
  IconToolsKitchenOff,
  IconDroplet,
  IconDroplets,
  IconSofa,
  IconShirt,
  IconBed,
  IconLamp,
  IconSun,
  IconTrees,
  IconFence,
  IconArrowsUpDown,
  IconBuilding,
  IconBuildingSkyscraper,
  IconCar,
  IconParkingCircle,
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
  IconTruck,
  IconCooker,
  IconBread,
  IconTable,
  IconBell,
  IconTool,
  IconTrash,
  IconBug,
  IconMail,
  IconArmchair,
  IconBook2,
  IconConfetti,
  IconDeviceGamepad2,
  IconWheelchair,
  IconBatteryCharging,
  IconSunset,
  IconDoorExit,
  IconBus,
  IconShoppingCart,
  IconGauge,
  IconVolumeOff,
  IconSchool,
  IconHospital,
  IconShoppingBag,
  IconUsers,
  IconClock,
  IconStack,
  IconDesk,
  IconMotorbike,
  IconTemperature
} from "@tabler/icons-react-native";
import type React from "react";

export type Perk = {
  id: string;
  name: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
};

export const PERKS: Record<string, Perk> = {
  // Bathroom
  bath: {
    id: "bath",
    name: "Shower/Bathtub",
    icon: IconBath
  },
  hotwater: {
    id: "hotwater",
    name: "Hot Water",
    icon: IconTemperature
  },
  toilet: {
    id: "toilet",
    name: "Private Toilet",
    icon: IconToiletPaper
  },
  bidet: {
    id: "bidet",
    name: "Bidet",
    icon: IconDroplets
  },

  // Cleaning & Maintenance
  cleaning: {
    id: "cleaning",
    name: "Cleaning Essentials",
    icon: IconBrush
  },
  washer: {
    id: "washer",
    name: "Washing Machine",
    icon: IconWashMachine
  },
  dryer: {
    id: "dryer",
    name: "Dryer",
    icon: IconWind
  },
  laundry_area: {
    id: "laundry_area",
    name: "Laundry Area",
    icon: IconStack
  },

  // Internet & Entertainment
  wifi: {
    id: "wifi",
    name: "Wi-Fi",
    icon: IconWifi
  },
  fast_internet: {
    id: "fast_internet",
    name: "High-Speed Internet",
    icon: IconGauge,
  },
  tv: {
    id: "tv",
    name: "TV",
    icon: IconDeviceTv
  },
  cabletv: {
    id: "cabletv",
    name: "Cable TV",
    icon: IconAntenna
  },
  game_room: {
    id: "game_room",
    name: "Game Room",
    icon: IconDeviceGamepad2
  },

  // Climate Control
  ac: {
    id: "ac",
    name: "Air Conditioning",
    icon: IconAirConditioning
  },
  electricfan: {
    id: "electricfan",
    name: "Electric Fan",
    icon: IconWindmill
  },
  ceiling_fan: {
    id: "ceiling_fan",
    name: "Ceiling Fan",
    icon: IconWindmill
  },

  // Kitchen & Appliances
  fridge: {
    id: "fridge",
    name: "Refrigerator",
    icon: IconFridge
  },
  microwave: {
    id: "microwave",
    name: "Microwave",
    icon: IconMicrowave
  },
  oven: {
    id: "oven",
    name: "Oven",
    icon: IconMicrowave
  },
  toaster: {
    id: "toaster",
    name: "Toaster",
    icon: IconBread
  },
  rice_cooker: {
    id: "rice_cooker",
    name: "Rice Cooker",
    icon: IconCooker
  },
  kettle: {
    id: "kettle",
    name: "Electric Kettle",
    icon: IconCoffee
  },
  kitchen: {
    id: "kitchen",
    name: "Kitchen",
    icon: IconChefHat
  },
  stove: {
    id: "stove",
    name: "Stove",
    icon: IconFlame
  },
  cooking_utensils: {
    id: "cooking_utensils",
    name: "Cooking Utensils",
    icon: IconToolsKitchen2,
  },
  no_cooking: {
    id: "no_cooking",
    name: "No Cooking Allowed",
    icon: IconToolsKitchenOff,
  },
  water_dispenser: {
    id: "water_dispenser",
    name: "Water Dispenser",
    icon: IconDroplet,
  },
  dining_table: {
    id: "dining_table",
    name: "Dining Table",
    icon: IconTable
  },

  // Furniture & Fixtures
  furniture: {
    id: "furniture",
    name: "Furnished",
    icon: IconSofa
  },
  wardrobe: {
    id: "wardrobe",
    name: "Wardrobe",
    icon: IconShirt
  },
  bed: {
    id: "bed",
    name: "Bed Included",
    icon: IconBed
  },
  double_bed: {
    id: "double_bed",
    name: "Double Bed",
    icon: IconBed
  },
  lamp: {
    id: "lamp",
    name: "Study Lamp",
    icon: IconLamp
  },
  work_desk: {
    id: "work_desk",
    name: "Work Desk",
    icon: IconDesk
  },

  // Outdoor & Building
  balcony: {
    id: "balcony",
    name: "Balcony Access",
    icon: IconSun
  },
  terrace: {
    id: "terrace",
    name: "Terrace",
    icon: IconSunset
  },
  garden: {
    id: "garden", name: "Garden", icon: IconTrees
  },
  fenced: {
    id: "fenced",
    name: "Fenced Compound",
    icon: IconFence
  },
  elevator: {
    id: "elevator",
    name: "Elevator",
    icon: IconArrowsUpDown
  },
  rooftop: {
    id: "rooftop",
    name: "Rooftop Access",
    icon: IconBuilding
  },
  fire_escape: {
    id: "fire_escape",
    name: "Fire Exit",
    icon: IconDoorExit
  },

  // Common Areas
  lounge: {
    id: "lounge",
    name: "Common Lounge",
    icon: IconArmchair
  },
  study_room: {
    id: "study_room",
    name: "Study Room / Library",
    icon: IconBook2,
  },
  function_hall: {
    id: "function_hall",
    name: "Function Hall",
    icon: IconConfetti,
  },
  lobby: {
    id: "lobby",
    name: "Lobby / Reception",
    icon: IconBell
  },

  // Parking
  parking: {
    id: "parking",
    name: "Parking",
    icon: IconCar
  },
  parkroad: {
    id: "parkroad",
    name: "Street Parking",
    icon: IconParkingCircle
  },
  motorbikeparking: {
    id: "motorbikeparking",
    name: "Motorbike Parking",
    icon: IconMotorbike,
  },
  covered_parking: {
    id: "covered_parking",
    name: "Covered Parking",
    icon: IconBuildingSkyscraper,
  },

  // Security
  security: {
    id: "security",
    name: "Security Guard",
    icon: IconShieldCheck
  },
  cctv: {
    id: "cctv",
    name: "CCTV",
    icon: IconCamera
  },
  smartlock: {
    id: "smartlock",
    name: "Smart Lock",
    icon: IconLock
  },
  intercom: {
    id: "intercom",
    name: "Intercom / Doorbell",
    icon: IconBell
  },
  smokealarm: {
    id: "smokealarm",
    name: "Smoke Alarm",
    icon: IconAlertTriangle
  },
  fireextinguisher: {
    id: "fireextinguisher",
    name: "Fire Extinguisher",
    icon: IconFireExtinguisher,
  },
  gated: {
    id: "gated",
    name: "Gated Community",
    icon: IconFence
  },
  curfew: {
    id: "curfew",
    name: "Curfew / Quiet Hours",
    icon: IconClock
  },

  // Utilities
  electricity: {
    id: "electricity",
    name: "Electricity Included",
    icon: IconBolt
  },
  water: {
    id: "water",
    name: "Water Included",
    icon: IconDroplet
  },
  generator: {
    id: "generator",
    name: "Generator",
    icon: IconPlug
  },
  backup_power: {
    id: "backup_power",
    name: "Backup Power / UPS",
    icon: IconBatteryCharging,
  },
  solar: {
    id: "solar",
    name: "Solar Power",
    icon: IconSun
  },

  // Services
  concierge: {
    id: "concierge",
    name: "Concierge / Reception",
    icon: IconBellRinging,
  },
  maintenance: {
    id: "maintenance",
    name: "Maintenance Service",
    icon: IconTool
  },
  garbage_collection: {
    id: "garbage_collection",
    name: "Garbage Collection",
    icon: IconTrash,
  },
  pest_control: {
    id: "pest_control",
    name: "Pest Control",
    icon: IconBug
  },
  mail: {
    id: "mail",
    name: "Mail / Package Service",
    icon: IconMail
  },

  // Lifestyle
  gym: {
    id: "gym",
    name: "Gym Access",
    icon: IconBarbell
  },
  pool: {
    id: "pool",
    name: "Swimming Pool",
    icon: IconSwimming
  },
  petfriendly: {
    id: "petfriendly",
    name: "Pet Friendly",
    icon: IconPaw
  },
  childfriendly: {
    id: "childfriendly",
    name: "Child Friendly",
    icon: IconBabyCarriage
  },
  nonsmoking: {
    id: "nonsmoking",
    name: "Non-Smoking",
    icon: IconSmokingNo
  },
  smoking: {
    id: "smoking",
    name: "Smoking Allowed",
    icon: IconSmoking
  },
  soundproof: {
    id: "soundproof",
    name: "Soundproofing",
    icon: IconVolumeOff
  },
  all_female: {
    id: "all_female",
    name: "Female Tenants Only",
    icon: IconUsers,
  },
  vending_machine: {
    id: "vending_machine",
    name: "Vending Machine",
    icon: IconShoppingCart,
  },

  // Accessibility
  wheelchair: {
    id: "wheelchair",
    name: "Wheelchair Accessible",
    icon: IconWheelchair,
  },

  // Nearby / Location
  near_transport: {
    id: "near_transport",
    name: "Near Public Transport",
    icon: IconBus,
  },
  near_school: {
    id: "near_school",
    name: "Near School / University",
    icon: IconSchool,
  },
  near_hospital: {
    id: "near_hospital",
    name: "Near Hospital / Clinic",
    icon: IconHospital,
  },
  near_mall: {
    id: "near_mall",
    name: "Near Mall / Market",
    icon: IconShoppingBag
  },

  // Storage & Moving
  storage: {
    id: "storage",
    name: "Storage Room",
    icon: IconStack
  },
  moving_in: {
    id: "moving_in",
    name: "Move-in Ready",
    icon: IconTruck
  },
};
