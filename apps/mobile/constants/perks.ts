import {
  Bath,
  Thermometer,
  Scroll,
  Brush,
  WashingMachine,
  Wind,
  Wifi,
  Tv,
  Antenna,
  AirVent,
  Fan,
  Refrigerator,
  Microwave,
  Coffee,
  ChefHat,
  Flame,
  Utensils,
  UtensilsCrossed,
  Droplet,
  Droplets,
  Sofa,
  Shirt,
  Bed,
  BedDouble,
  Lamp,
  Sun,
  Trees,
  Fence,
  ArrowUpDown,
  Building,
  Building2,
  Car,
  Train,
  Bike,
  SquareParking,
  ShieldCheck,
  Camera,
  Lock,
  BellRing,
  AlertTriangle,
  FireExtinguisher,
  Zap,
  Plug,
  Dumbbell,
  Waves,
  PawPrint,
  CigaretteOff,
  Cigarette,
  Baby,
  Package,
  Truck,
  CookingPot,
  Dock,
  Table2,
  ConciergeBell,
  Wrench,
  Trash2,
  Bug,
  Mail,
  Armchair,
  BookOpen,
  PartyPopper,
  Gamepad2,
  Monitor,
  Accessibility,
  BatteryCharging,
  Sunset,
  DoorOpen,
  Bus,
  ShoppingCart,
  Gauge,
  VolumeX,
  Leaf,
  GraduationCap,
  Hospital,
  ShoppingBag,
  UsersRound,
  Clock,
  Layers,
  type LucideIcon,
} from "lucide-react-native";

export type Perk = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export const PERKS: Record<string, Perk> = {
  // Bathroom
  bath: { id: "bath", name: "Shower/Bathtub", icon: Bath },
  hotwater: { id: "hotwater", name: "Hot Water", icon: Thermometer },
  toilet: { id: "toilet", name: "Private Toilet", icon: Scroll },
  bidet: { id: "bidet", name: "Bidet", icon: Droplets },

  // Cleaning & Maintenance
  cleaning: { id: "cleaning", name: "Cleaning Essentials", icon: Brush },
  washer: { id: "washer", name: "Washing Machine", icon: WashingMachine },
  dryer: { id: "dryer", name: "Dryer", icon: Wind },
  laundry_area: { id: "laundry_area", name: "Laundry Area", icon: Layers },

  // Internet & Entertainment
  wifi: { id: "wifi", name: "Wi-Fi", icon: Wifi },
  fast_internet: { id: "fast_internet", name: "High-Speed Internet", icon: Gauge },
  tv: { id: "tv", name: "TV", icon: Tv },
  cabletv: { id: "cabletv", name: "Cable TV", icon: Antenna },
  game_room: { id: "game_room", name: "Game Room", icon: Gamepad2 },

  // Climate Control
  ac: { id: "ac", name: "Air Conditioning", icon: AirVent },
  electricfan: { id: "electricfan", name: "Electric Fan", icon: Fan },
  ceiling_fan: { id: "ceiling_fan", name: "Ceiling Fan", icon: Fan },

  // Kitchen & Appliances
  fridge: { id: "fridge", name: "Refrigerator", icon: Refrigerator },
  microwave: { id: "microwave", name: "Microwave", icon: Microwave },
  oven: { id: "oven", name: "Oven", icon: Microwave },
  toaster: { id: "toaster", name: "Toaster", icon: Dock },
  rice_cooker: { id: "rice_cooker", name: "Rice Cooker", icon: CookingPot },
  kettle: { id: "kettle", name: "Electric Kettle", icon: Coffee },
  kitchen: { id: "kitchen", name: "Kitchen", icon: ChefHat },
  stove: { id: "stove", name: "Stove", icon: Flame },
  cooking_utensils: { id: "cooking_utensils", name: "Cooking Utensils", icon: Utensils },
  no_cooking: { id: "no_cooking", name: "No Cooking Allowed", icon: UtensilsCrossed },
  water_dispenser: { id: "water_dispenser", name: "Water Dispenser", icon: Droplet },
  dining_table: { id: "dining_table", name: "Dining Table", icon: Table2 },

  // Furniture & Fixtures
  furniture: { id: "furniture", name: "Furnished", icon: Sofa },
  wardrobe: { id: "wardrobe", name: "Wardrobe", icon: Shirt },
  bed: { id: "bed", name: "Bed Included", icon: Bed },
  double_bed: { id: "double_bed", name: "Double Bed", icon: BedDouble },
  lamp: { id: "lamp", name: "Study Lamp", icon: Lamp },
  work_desk: { id: "work_desk", name: "Work Desk", icon: Monitor },

  // Outdoor & Building
  balcony: { id: "balcony", name: "Balcony Access", icon: Sun },
  terrace: { id: "terrace", name: "Terrace", icon: Sunset },
  garden: { id: "garden", name: "Garden", icon: Trees },
  fenced: { id: "fenced", name: "Fenced Compound", icon: Fence },
  elevator: { id: "elevator", name: "Elevator", icon: ArrowUpDown },
  rooftop: { id: "rooftop", name: "Rooftop Access", icon: Building },
  fire_escape: { id: "fire_escape", name: "Fire Exit", icon: DoorOpen },

  // Common Areas
  lounge: { id: "lounge", name: "Common Lounge", icon: Armchair },
  study_room: { id: "study_room", name: "Study Room / Library", icon: BookOpen },
  function_hall: { id: "function_hall", name: "Function Hall", icon: PartyPopper },
  lobby: { id: "lobby", name: "Lobby / Reception", icon: Building2 },

  // Parking
  parking: { id: "parking", name: "Parking", icon: Car },
  parkroad: { id: "parkroad", name: "Street Parking", icon: Train },
  motorbikeparking: { id: "motorbikeparking", name: "Motorbike Parking", icon: Bike },
  covered_parking: { id: "covered_parking", name: "Covered Parking", icon: SquareParking },

  // Security
  security: { id: "security", name: "Security Guard", icon: ShieldCheck },
  cctv: { id: "cctv", name: "CCTV", icon: Camera },
  smartlock: { id: "smartlock", name: "Smart Lock", icon: Lock },
  intercom: { id: "intercom", name: "Intercom / Doorbell", icon: BellRing },
  smokealarm: { id: "smokealarm", name: "Smoke Alarm", icon: AlertTriangle },
  fireextinguisher: { id: "fireextinguisher", name: "Fire Extinguisher", icon: FireExtinguisher },
  gated: { id: "gated", name: "Gated Community", icon: ShieldCheck },
  curfew: { id: "curfew", name: "Curfew / Quiet Hours", icon: Clock },

  // Utilities
  electricity: { id: "electricity", name: "Electricity Included", icon: Zap },
  water: { id: "water", name: "Water Included", icon: Droplet },
  generator: { id: "generator", name: "Generator", icon: Plug },
  backup_power: { id: "backup_power", name: "Backup Power / UPS", icon: BatteryCharging },
  solar: { id: "solar", name: "Solar Power", icon: Leaf },

  // Services
  concierge: { id: "concierge", name: "Concierge / Reception", icon: ConciergeBell },
  maintenance: { id: "maintenance", name: "Maintenance Service", icon: Wrench },
  garbage_collection: { id: "garbage_collection", name: "Garbage Collection", icon: Trash2 },
  pest_control: { id: "pest_control", name: "Pest Control", icon: Bug },
  mail: { id: "mail", name: "Mail / Package Service", icon: Mail },

  // Lifestyle
  gym: { id: "gym", name: "Gym Access", icon: Dumbbell },
  pool: { id: "pool", name: "Swimming Pool", icon: Waves },
  petfriendly: { id: "petfriendly", name: "Pet Friendly", icon: PawPrint },
  childfriendly: { id: "childfriendly", name: "Child Friendly", icon: Baby },
  nonsmoking: { id: "nonsmoking", name: "Non-Smoking", icon: CigaretteOff },
  smoking: { id: "smoking", name: "Smoking Allowed", icon: Cigarette },
  soundproof: { id: "soundproof", name: "Soundproofing", icon: VolumeX },
  all_female: { id: "all_female", name: "Female Tenants Only", icon: UsersRound },
  vending_machine: { id: "vending_machine", name: "Vending Machine", icon: ShoppingCart },

  // Accessibility
  wheelchair: { id: "wheelchair", name: "Wheelchair Accessible", icon: Accessibility },

  // Nearby / Location
  near_transport: { id: "near_transport", name: "Near Public Transport", icon: Bus },
  near_school: { id: "near_school", name: "Near School / University", icon: GraduationCap },
  near_hospital: { id: "near_hospital", name: "Near Hospital / Clinic", icon: Hospital },
  near_mall: { id: "near_mall", name: "Near Mall / Market", icon: ShoppingBag },

  // Storage & Moving
  storage: { id: "storage", name: "Storage Room", icon: Package },
  moving_in: { id: "moving_in", name: "Move-in Ready", icon: Truck },
};