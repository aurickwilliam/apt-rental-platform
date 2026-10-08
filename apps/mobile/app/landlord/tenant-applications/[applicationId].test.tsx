import { render, screen } from "@testing-library/react-native";

import TenantApplicationDetails from "./[applicationId]";

const mockApplication = {
  id: "app-1",
  status: "Applied" as string,
  created_at: "2026-10-08T00:00:00.000Z",
  rejected_reason: null as string | null,
  apartment_id: "apt-1",
  tenant_id: "tenant-1",
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
  gov_id_url: "u/v/id-front.jpg",
  gov_id_back_url: "u/v/id-back.jpg" as string | null,
  proof_of_income_url: "u/passport/income.pdf",
  proof_of_billing_url: "u/passport/billing.pdf",
  nbi_clearance_url: null as string | null,
  tenant_name: "Case Oh",
  tenant_avatar_url: null,
  tenant_address: "Quezon City",
  tenant_email: "case@example.com",
  tenant_city: "Quezon City",
  tenant_mobile_number: null,
  apartment_name: "Parada 3BR",
  monthly_rent: 80000,
  apartment_city: "Valenzuela",
  apartment_address: "21 Parada Street",
  apartment_status: "available",
};

jest.mock("expo-router", () => ({ useLocalSearchParams: () => ({ applicationId: "app-1" }) }));
jest.mock("react-native-image-viewing", () => () => null);
jest.mock("heroui-native", () => ({ Spinner: () => null }));
jest.mock("@/components/layout/ScreenWrapper", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children) };
});
jest.mock("@/components/layout/StandardHeader", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/display/ErrorDialog", () => ({ __esModule: true, default: () => null }));
jest.mock("../../../components/display/RejectDialog", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/display/DocumentRow", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ label }: { label: string }) => React.createElement(Text, null, `doc:${label}`) };
});
jest.mock("./components/ApplicationDecisionBar", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: () => React.createElement(Text, null, "decision-bar") };
});
jest.mock("./components/TenantApplicationDetailsSkeleton", () => ({ __esModule: true, default: () => null }));
jest.mock("./components/TenantSummaryCard", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ name, status }: { name: string; status: string }) => React.createElement(Text, null, `${name} · ${status}`) };
});
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5", danger: "#EF4444", gray500: "#6B7280" } }),
}));
jest.mock("@/hooks/useStatusChipStyles", () => ({ useStatusChipStyles: () => ({}) }));
jest.mock("@/hooks/applications/useApplicationStatusStyles", () => ({
  getLandlordApplicationStatusStyle: () => ({ textColor: "#000" }),
}));
jest.mock("@/hooks/passport", () => ({
  usePassportVerifiedPaths: () => ({ data: new Set<string>() }),
}));
jest.mock("@/hooks/applications", () => ({
  useLandlordApplications: () => ({ applications: [mockApplication], loading: false }),
  useDocumentUrls: (entries: { label: string; path: string | null }[]) => ({
    resolved: entries.map((entry) => ({ ...entry, path: entry.path ?? "", signedUrl: null })),
    loading: false,
  }),
  useApplicationActions: () => ({
    localStatus: null,
    actionLoading: false,
    isRejectDialogOpen: false,
    errorMessage: null,
    approve: jest.fn(),
    reject: jest.fn(),
    openRejectDialog: jest.fn(),
    closeRejectDialog: jest.fn(),
    clearError: jest.fn(),
  }),
}));

function withApplication(patch: Partial<typeof mockApplication>, run: () => void) {
  const original = { ...mockApplication };
  Object.assign(mockApplication, patch);
  try {
    run();
  } finally {
    Object.assign(mockApplication, original);
  }
}

it("groups the information into titled sections", () => {
  render(<TenantApplicationDetails />);

  for (const title of [
    "Application",
    "Employment",
    "Preferences",
    "Previous Landlord",
    "Documents",
    "Message from Tenant",
  ]) {
    expect(screen.getByText(title)).toBeTruthy();
  }
  expect(screen.getByText("Parada 3BR")).toBeTruthy();
  expect(screen.getByText("Case Oh · Applied")).toBeTruthy();
});

it("lists the ID front and back among the documents", () => {
  render(<TenantApplicationDetails />);

  expect(screen.getByText("doc:Government ID")).toBeTruthy();
  expect(screen.getByText("doc:Government ID (Back)")).toBeTruthy();
});

it("shows dashes and a fallback message for empty optional details", () => {
  render(<TenantApplicationDetails />);

  expect(screen.getAllByText("-")).toHaveLength(2);
  expect(screen.getByText("No message provided.")).toBeTruthy();
});

it("offers the approve / reject actions only while the application is pending", () => {
  render(<TenantApplicationDetails />);
  expect(screen.getByText("decision-bar")).toBeTruthy();
  screen.unmount();

  withApplication({ status: "Approved" }, () => {
    render(<TenantApplicationDetails />);
    expect(screen.queryByText("decision-bar")).toBeNull();
  });
});

it("shows the rejection reason when there is one", () => {
  withApplication({ status: "Rejected", rejected_reason: "Incomplete documents" }, () => {
    render(<TenantApplicationDetails />);

    expect(screen.getByText("Rejection Reason")).toBeTruthy();
    expect(screen.getByText("Incomplete documents")).toBeTruthy();
  });
});
