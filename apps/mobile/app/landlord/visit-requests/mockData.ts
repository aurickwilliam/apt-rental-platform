import { VisitRequestStatus } from "@/components/cards/VisitRequestCard";

export type VisitRequest = {
  id: string;
  tenant_name: string;
  tenant_avatar_url: string | null;
  apartment_name: string;
  apartment_address: string;
  apartment_image_url: string | null;
  visit_date: string;
  visit_time: string;
  status: VisitRequestStatus;
  no_visitors: number;
  notes: string | null;
};

export const VISIT_REQUESTS: VisitRequest[] = [
  {
    id: "vr-1",
    tenant_name: "Jenna Santos",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=24",
    apartment_name: "Parkview Suites",
    apartment_address: "Dela Rosa St, Makati City",
    apartment_image_url: null,
    visit_date: "2026-05-26",
    visit_time: "10:30 AM",
    status: "Pending",
    no_visitors: 2,
    notes: "We can arrive a little earlier if that works for you.",
  },
  {
    id: "vr-2",
    tenant_name: "Carlos Medina",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=12",
    apartment_name: "Sunset Heights",
    apartment_address: "Valenzuela St, Quezon City",
    apartment_image_url: null,
    visit_date: "2026-05-27",
    visit_time: "02:00 PM",
    status: "Approved",
    no_visitors: 3,
    notes: "We are three adults, no pets, and very flexible.",
  },
  {
    id: "vr-3",
    tenant_name: "Alyssa Cruz",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=56",
    apartment_name: "Maple Residences",
    apartment_address: "Katipunan Ave, Quezon City",
    apartment_image_url: null,
    visit_date: "2026-05-29",
    visit_time: "11:15 AM",
    status: "Rescheduled",
    no_visitors: 1,
    notes: "I will need to move it to next week if possible.",
  },
  {
    id: "vr-4",
    tenant_name: "Noah Lim",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=68",
    apartment_name: "Cedar Point",
    apartment_address: "Roxas Blvd, Pasay City",
    apartment_image_url: null,
    visit_date: "2026-06-02",
    visit_time: "09:00 AM",
    status: "Approved",
    no_visitors: 2,
    notes: "Please let us know if parking is available nearby.",
  },
  {
    id: "vr-5",
    tenant_name: "Bianca Reyes",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=49",
    apartment_name: "Riverstone Flats",
    apartment_address: "Ortigas Ave, Pasig City",
    apartment_image_url: null,
    visit_date: "2026-05-24",
    visit_time: "01:00 PM",
    status: "Rejected",
    no_visitors: 2,
    notes: "We are okay with a short viewing if needed.",
  },
  {
    id: "vr-6",
    tenant_name: "Marco Villanueva",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=33",
    apartment_name: "Harbor View",
    apartment_address: "Magsaysay Blvd, Manila",
    apartment_image_url: null,
    visit_date: "2026-06-05",
    visit_time: "03:30 PM",
    status: "Pending",
    no_visitors: 4,
    notes: "Two adults and two kids, thank you.",
  },
];
