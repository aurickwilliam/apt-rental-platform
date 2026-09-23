import type {
  LandlordMaintenanceStatus,
  LandlordMaintenanceUrgency,
} from "../lib/maintenance-status";

export type MockMaintenanceRequest = {
  id: string;
  issue_title: string;
  description: string;
  apartment_name: string;
  apartment_city: string;
  apartment_address: string;
  tenant_name: string;
  tenant_avatar_url: string | null;
  contact_number: string;
  reported_at: string;
  status: LandlordMaintenanceStatus;
  urgency: LandlordMaintenanceUrgency;
  photos: string[];
  resolution_notes: string | null;
};

// UI-first mock data mirroring the mobile landlord shape.
// Backend wiring will replace this with fetchLandlordMaintenanceRequests.
export const MOCK_MAINTENANCE_REQUESTS: MockMaintenanceRequest[] = [
  {
    id: "mock-req-001",
    issue_title: "Leaking kitchen faucet",
    description:
      "The kitchen faucet keeps dripping even when fully closed. Water pools under the sink every morning.",
    apartment_name: "Rizal Suites Unit 4B",
    apartment_city: "Caloocan",
    apartment_address: "123 Rizal St., Brgy. Bagong Silang, Caloocan",
    tenant_name: "Maria Santos",
    tenant_avatar_url: null,
    contact_number: "0917 123 4567",
    reported_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Pending",
    urgency: "high",
    photos: [
      "https://picsum.photos/seed/maintenance-leak-1/400/400",
      "https://picsum.photos/seed/maintenance-leak-2/400/400",
    ],
    resolution_notes: null,
  },
  {
    id: "mock-req-002",
    issue_title: "Aircon not cooling",
    description:
      "Split-type aircon in the bedroom blows warm air. Filter was cleaned last week but the issue persists.",
    apartment_name: "Malabon Courtyard Unit 2A",
    apartment_city: "Malabon",
    apartment_address: "45 Rivera Ave., Brgy. Tugatog, Malabon",
    tenant_name: "Jose Cruz",
    tenant_avatar_url: null,
    contact_number: "0928 555 0119",
    reported_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: "In Progress",
    urgency: "medium",
    photos: ["https://picsum.photos/seed/maintenance-ac-1/400/400"],
    resolution_notes: null,
  },
  {
    id: "mock-req-003",
    issue_title: "Clogged bathroom drain",
    description:
      "Shower drain is very slow and water rises to ankle level. Tried a plunger with no luck.",
    apartment_name: "Navotas Bay Lofts Unit 7C",
    apartment_city: "Navotas",
    apartment_address: "88 M. Naval St., Brgy. Sipac-Almacen, Navotas",
    tenant_name: "Ana Reyes",
    tenant_avatar_url: null,
    contact_number: "0935 777 2233",
    reported_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Pending",
    urgency: "medium",
    photos: [],
    resolution_notes: null,
  },
  {
    id: "mock-req-004",
    issue_title: "Bedroom ceiling stain spreading",
    description:
      "Brown water stain on the bedroom ceiling keeps getting bigger after every rain. Possible roof leak above.",
    apartment_name: "Valenzuela Grand Unit 3D",
    apartment_city: "Valenzuela",
    apartment_address: "12 MacArthur Hwy., Brgy. Marulas, Valenzuela",
    tenant_name: "Mark Villanueva",
    tenant_avatar_url: null,
    contact_number: "0919 888 4455",
    reported_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Resolved",
    urgency: "high",
    photos: ["https://picsum.photos/seed/maintenance-roof-1/400/400"],
    resolution_notes: "Resealed the roof flashing above the unit and repainted the ceiling.",
  },
  {
    id: "mock-req-005",
    issue_title: "Loose cabinet hinge",
    description: "One kitchen cabinet door hangs crooked because the top hinge screws stripped out.",
    apartment_name: "Rizal Suites Unit 1A",
    apartment_city: "Caloocan",
    apartment_address: "123 Rizal St., Brgy. Bagong Silang, Caloocan",
    tenant_name: "Liza Ramos",
    tenant_avatar_url: null,
    contact_number: "0945 222 8899",
    reported_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Pending",
    urgency: "low",
    photos: [],
    resolution_notes: null,
  },
  {
    id: "mock-req-006",
    issue_title: "Flickering hallway light",
    description:
      "The hallway LED panel flickers intermittently at night. Breaker looks fine, likely a faulty driver.",
    apartment_name: "Malabon Courtyard Unit 5B",
    apartment_city: "Malabon",
    apartment_address: "45 Rivera Ave., Brgy. Tugatog, Malabon",
    tenant_name: "Paolo Aquino",
    tenant_avatar_url: null,
    contact_number: "0977 333 6677",
    reported_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    status: "In Progress",
    urgency: "low",
    photos: [],
    resolution_notes: null,
  },
  {
    id: "mock-req-007",
    issue_title: "Ant infestation in pantry",
    description: "Sugar ants keep coming back in the pantry despite daily cleaning. Trail leads to the window frame.",
    apartment_name: "Navotas Bay Lofts Unit 2B",
    apartment_city: "Navotas",
    apartment_address: "88 M. Naval St., Brgy. Sipac-Almacen, Navotas",
    tenant_name: "Katrina Uy",
    tenant_avatar_url: null,
    contact_number: "0922 444 1122",
    reported_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Resolved",
    urgency: "medium",
    photos: [],
    resolution_notes: "Pest control treated the pantry and sealed the window frame gaps.",
  },
  {
    id: "mock-req-008",
    issue_title: "Wobbly balcony railing",
    description: "The balcony railing wobbles when leaned on. Reported for safety before it gets worse.",
    apartment_name: "Valenzuela Grand Unit 6A",
    apartment_city: "Valenzuela",
    apartment_address: "12 MacArthur Hwy., Brgy. Marulas, Valenzuela",
    tenant_name: "Daniel Torres",
    tenant_avatar_url: null,
    contact_number: "0908 999 3344",
    reported_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Cancelled",
    urgency: "high",
    photos: [],
    resolution_notes: null,
  },
];
