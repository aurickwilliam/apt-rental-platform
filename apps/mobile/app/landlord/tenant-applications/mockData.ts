export type TenantApplicationStatus = "Applied" | "Under Review" | "Approved" | "Rejected";

export type TenantApplication = {
  id: string;
  tenant_name: string;
  tenant_avatar_url: string | null;
  apartment_name: string;
  status: TenantApplicationStatus;
  date_submitted: string;
  move_in_date: string;
  duration_stay: string;
  monthly_income: number;
  occupation: string;
  employer_name: string;
  employment_type: string;
  no_occupants: number;
  has_pets: boolean;
  has_smoker: boolean;
  need_parking: boolean;
  prev_landlord_name: string | null;
  prev_landlord_contact: string | null;
  message: string | null;
};

export const TENANT_APPLICATIONS: TenantApplication[] = [
  {
    id: "app-1",
    tenant_name: "Marcus Reed",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=12",
    apartment_name: "Sunset Heights",
    status: "Applied",
    date_submitted: "2025-11-20",
    move_in_date: "2026-01-05",
    duration_stay: "12 months",
    monthly_income: 68000,
    occupation: "Product Designer",
    employer_name: "Northwind Studio",
    employment_type: "Full-time",
    no_occupants: 2,
    has_pets: true,
    has_smoker: false,
    need_parking: true,
    prev_landlord_name: "Alma Gutierrez",
    prev_landlord_contact: "0917 123 4567",
    message: "We are tidy, quiet, and ready to move in by early January.",
  },
  {
    id: "app-2",
    tenant_name: "Jasmine Dela Cruz",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=47",
    apartment_name: "Maple Residences",
    status: "Under Review",
    date_submitted: "2025-11-18",
    move_in_date: "2025-12-15",
    duration_stay: "6 months",
    monthly_income: 52000,
    occupation: "QA Engineer",
    employer_name: "Blue Creek Labs",
    employment_type: "Contract",
    no_occupants: 1,
    has_pets: false,
    has_smoker: false,
    need_parking: false,
    prev_landlord_name: "Evan Santos",
    prev_landlord_contact: "0918 555 2090",
    message: "Happy to provide additional documents if needed.",
  },
  {
    id: "app-3",
    tenant_name: "Rafael Soriano",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=33",
    apartment_name: "Cedar Point",
    status: "Approved",
    date_submitted: "2025-11-12",
    move_in_date: "2025-12-01",
    duration_stay: "18 months",
    monthly_income: 76000,
    occupation: "Finance Analyst",
    employer_name: "Aurum Capital",
    employment_type: "Full-time",
    no_occupants: 3,
    has_pets: true,
    has_smoker: false,
    need_parking: true,
    prev_landlord_name: null,
    prev_landlord_contact: null,
    message: "Looking forward to a long-term lease.",
  },
  {
    id: "app-4",
    tenant_name: "Noah Valdez",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=65",
    apartment_name: "Parkview Suites",
    status: "Rejected",
    date_submitted: "2025-11-08",
    move_in_date: "2025-12-10",
    duration_stay: "9 months",
    monthly_income: 41000,
    occupation: "Freelance Videographer",
    employer_name: "Self-employed",
    employment_type: "Self-employed",
    no_occupants: 1,
    has_pets: false,
    has_smoker: true,
    need_parking: true,
    prev_landlord_name: "Dion Reyes",
    prev_landlord_contact: "0998 880 7744",
    message: "I can move in quickly and provide references on request.",
  },
];
