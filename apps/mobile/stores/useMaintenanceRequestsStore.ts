import { create } from "zustand";

import { COLORS } from "@repo/constants";

export type MaintenanceRequestStatus = "Pending" | "In Progress" | "Resolved";
export type MaintenanceRequestUrgency = "Low" | "Medium" | "High";

export type MaintenanceRequest = {
  id: string;
  issue_title: string;
  apartment_name: string;
  apartment_address: string;
  tenant_name: string;
  tenant_avatar_url: string | null;
  contact_number: string;
  reported_at: string;
  urgency: MaintenanceRequestUrgency;
  status: MaintenanceRequestStatus;
  description: string;
  photos: string[];
};

export const STATUS_ORDER: Record<MaintenanceRequestStatus, number> = {
  Pending: 0,
  "In Progress": 1,
  Resolved: 2,
};

export const STATUS_STYLES: Record<
  MaintenanceRequestStatus,
  { backgroundColor: string; textColor: string }
> = {
  Pending: {
    backgroundColor: COLORS.lightYellowish,
    textColor: COLORS.yellowish,
  },
  "In Progress": {
    backgroundColor: COLORS.lightBlue,
    textColor: COLORS.primary,
  },
  Resolved: {
    backgroundColor: COLORS.lightGreen,
    textColor: COLORS.greenHulk,
  },
};

const INITIAL_REQUESTS: MaintenanceRequest[] = [
  {
    id: "mr-1",
    issue_title: "Leaking kitchen sink",
    apartment_name: "Parkview Suites 12B",
    apartment_address: "Dela Rosa St, Makati City",
    tenant_name: "Jenna Santos",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=24",
    contact_number: "09123456789",
    reported_at: "2026-05-24",
    urgency: "High",
    status: "Pending",
    description:
      "Water is dripping from the pipe under the sink and pooling on the floor. It started last night and has not stopped.",
    photos: [
      "https://picsum.photos/seed/maintenance-1/400/400",
      "https://picsum.photos/seed/maintenance-2/400/400",
      "https://picsum.photos/seed/maintenance-3/400/400",
    ],
  },
  {
    id: "mr-2",
    issue_title: "Air conditioner not cooling",
    apartment_name: "Sunset Heights 7A",
    apartment_address: "Valenzuela St, Quezon City",
    tenant_name: "Carlos Medina",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=12",
    contact_number: "09987654321",
    reported_at: "2026-05-22",
    urgency: "Medium",
    status: "In Progress",
    description:
      "The unit turns on but only blows warm air. We tried cleaning the filter and resetting the unit.",
    photos: [
      "https://picsum.photos/seed/maintenance-4/400/400",
      "https://picsum.photos/seed/maintenance-5/400/400",
    ],
  },
  {
    id: "mr-3",
    issue_title: "Broken bathroom light",
    apartment_name: "Maple Residences 3C",
    apartment_address: "Katipunan Ave, Quezon City",
    tenant_name: "Alyssa Cruz",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=56",
    contact_number: "09170011223",
    reported_at: "2026-05-19",
    urgency: "Low",
    status: "Resolved",
    description:
      "The bathroom light flickered for a day and now will not turn on at all.",
    photos: ["https://picsum.photos/seed/maintenance-6/400/400"],
  },
  {
    id: "mr-4",
    issue_title: "Ceiling leak after rain",
    apartment_name: "Cedar Point 9F",
    apartment_address: "Roxas Blvd, Pasay City",
    tenant_name: "Noah Lim",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=68",
    contact_number: "09181234567",
    reported_at: "2026-05-25",
    urgency: "High",
    status: "Pending",
    description:
      "There is a steady drip from the bedroom ceiling during heavy rain. The paint has started to bubble.",
    photos: [
      "https://picsum.photos/seed/maintenance-7/400/400",
      "https://picsum.photos/seed/maintenance-8/400/400",
    ],
  },
  {
    id: "mr-5",
    issue_title: "Loose door handle",
    apartment_name: "Riverstone Flats 5D",
    apartment_address: "Ortigas Ave, Pasig City",
    tenant_name: "Bianca Reyes",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=49",
    contact_number: "09223334444",
    reported_at: "2026-05-21",
    urgency: "Low",
    status: "Pending",
    description:
      "The main door handle is loose and wobbles when turning. It still locks but feels unstable.",
    photos: ["https://picsum.photos/seed/maintenance-9/400/400"],
  },
];

const getNextStatus = (status: MaintenanceRequestStatus) => {
  if (status === "Pending") return "In Progress";
  if (status === "In Progress") return "Resolved";
  return "Resolved";
};

type MaintenanceRequestsStore = {
  requests: MaintenanceRequest[];
  advanceStatus: (requestId: string) => void;
};

export const useMaintenanceRequestsStore = create<MaintenanceRequestsStore>(
  (set) => ({
    requests: INITIAL_REQUESTS,
    advanceStatus: (requestId) =>
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === requestId
            ? { ...request, status: getNextStatus(request.status) }
            : request
        ),
      })),
  })
);
