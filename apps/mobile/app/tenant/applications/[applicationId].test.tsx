import { render, screen } from "@testing-library/react-native";

import ApplicationApartment from "./[applicationId]";

const mockApplication = {
  id: "app-1",
  status: "pending" as string,
  created_at: "2026-10-08T00:00:00.000Z",
  rejected_reason: null as string | null,
  apartment_id: "apt-1",
  occupation: "Engineer",
  employer_name: "Acme",
  monthly_income: 50000,
  employment_type: "Full-Time",
  prev_landlord_name: null as string | null,
  prev_landlord_contact: null as string | null,
  move_in_date: "2026-11-08",
  no_occupants: 2,
  has_pets: false,
  has_smoker: false,
  need_parking: false,
  message: null as string | null,
  documents: [
    { label: "Government ID", path: "u/v/id-front.jpg", signedUrl: null },
    { label: "Government ID (Back)", path: "u/v/id-back.jpg", signedUrl: null },
    { label: "Proof of Income", path: "u/passport/income.pdf", signedUrl: null },
  ] as { label: string; path: string; signedUrl: string | null }[],
  apartments: { name: "Parada 3BR", monthly_rent: 80000 },
};

let mockHistory: { id: string }[] = [];

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ applicationId: "app-1", apartmentId: "apt-1" }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("react-native-image-viewing", () => () => null);
jest.mock("@/components/layout/ScreenWrapper", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children) };
});
jest.mock("@/components/display/ConfirmDialog", () => ({ __esModule: true, default: () => null }));
jest.mock("../../../components/display/DocumentRow", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ label }: { label: string }) => React.createElement(Text, null, `doc:${label}`) };
});
jest.mock("./components/VisitRequestCard", () => ({ __esModule: true, default: () => null }));
jest.mock("./components/VisitRequestHistoryItem", () => ({ __esModule: true, default: () => null }));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({
    colors: { primary: "#376BF5", gray400: "#9CA3AF", gray500: "#6B7280", secondaryForeground: "#FFF" },
  }),
}));
jest.mock("@/hooks/useStatusChipStyles", () => ({
  useStatusChipStyles: () => ({ success: {}, warning: {}, danger: {}, neutral: { textColor: "#000" } }),
  statusChipSurface: () => ({}),
}));
jest.mock("@/hooks/auth", () => ({ useProfile: () => ({ profile: { id: "tenant-1" } }) }));
jest.mock("@/hooks/apartments", () => ({
  useApartmentDetails: () => ({
    apartment: {
      id: "apt-1",
      name: "Parada 3BR",
      monthly_rent: 80000,
      street_address: "21 Parada Street",
      apartment_images: [],
      landlord: null,
    },
    loading: false,
  }),
}));
jest.mock("@/hooks/visitRequests", () => ({
  useVisitRequest: () => ({ visitRequest: null, history: mockHistory, loading: false, refetch: jest.fn() }),
  useRespondToReschedule: () => ({ accept: jest.fn(), decline: jest.fn(), loading: false }),
}));
jest.mock("@/hooks/applications", () => ({
  useTenantApplications: () => ({ applications: [mockApplication], loading: false }),
  useApplicationStatusStyles: () => ({
    getStatusStyle: () => ({ chipColor: "warning", label: "Pending" }),
  }),
  useCancelApplication: () => ({ cancelApplication: jest.fn(), loading: false }),
}));
jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
  function Button({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) {
    return React.createElement(Pressable, { onPress, accessibilityRole: "button" }, children);
  }
  Button.Label = function ButtonLabel({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children);
  };
  function Chip({ children }: { children?: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  Chip.Label = function ChipLabel({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children);
  };
  return { Button, Chip, Spinner: () => null };
});

function withApplication(patch: Partial<typeof mockApplication>, run: () => void) {
  const original = { ...mockApplication };
  Object.assign(mockApplication, patch);
  try {
    run();
  } finally {
    Object.assign(mockApplication, original);
  }
}

beforeEach(() => {
  mockHistory = [];
});

it("presents the submitted information as titled cards, all visible without expanding", () => {
  render(<ApplicationApartment />);

  for (const title of [
    "Application Status",
    "Employment",
    "Previous Landlord",
    "Rental Preferences",
    "Submitted Documents",
  ]) {
    expect(screen.getByText(title)).toBeTruthy();
  }
  expect(screen.getByText("Engineer")).toBeTruthy();
  expect(screen.getByText("Acme")).toBeTruthy();
});

it("lists every submitted document including the ID back", () => {
  render(<ApplicationApartment />);

  expect(screen.getByText("doc:Government ID")).toBeTruthy();
  expect(screen.getByText("doc:Government ID (Back)")).toBeTruthy();
  expect(screen.getByText("doc:Proof of Income")).toBeTruthy();
});

it("says so when no documents were submitted", () => {
  withApplication({ documents: [] }, () => {
    render(<ApplicationApartment />);

    expect(screen.getByText("No documents submitted.")).toBeTruthy();
  });
});

it("shows the tenant's message only when there is one", () => {
  render(<ApplicationApartment />);
  expect(screen.queryByText("Message")).toBeNull();
  screen.unmount();

  withApplication({ message: "Looking forward to it" }, () => {
    render(<ApplicationApartment />);
    expect(screen.getByText("Looking forward to it")).toBeTruthy();
  });
});

it("shows the rejection reason in its own card", () => {
  withApplication({ status: "rejected", rejected_reason: "Incomplete documents" }, () => {
    render(<ApplicationApartment />);

    expect(screen.getByText("Application Rejected")).toBeTruthy();
    expect(screen.getByText("Incomplete documents")).toBeTruthy();
  });
});

it("offers Cancel Application and Request a Visit only while pending", () => {
  render(<ApplicationApartment />);
  expect(screen.getByText("Cancel Application")).toBeTruthy();
  expect(screen.getByText("Request a Visit")).toBeTruthy();
  screen.unmount();

  withApplication({ status: "approved" }, () => {
    render(<ApplicationApartment />);
    expect(screen.queryByText("Cancel Application")).toBeNull();
    expect(screen.queryByText("Request a Visit")).toBeNull();
  });
});

it("shows the visit history section only when there is history", () => {
  render(<ApplicationApartment />);
  expect(screen.queryByText("Visit History")).toBeNull();
  screen.unmount();

  mockHistory = [{ id: "v1" }];
  render(<ApplicationApartment />);
  expect(screen.getByText("Visit History")).toBeTruthy();
});
