import { render, screen } from "@testing-library/react-native";

import PassportDocumentDetail from "./[documentId]";

const mockDocument = {
  id: "doc-1",
  user_id: "user-1",
  doc_type: "Proof of Residency",
  storage_path: "user-1/passport/residency.pdf",
  storage_path_back: null,
  verification_id: null as string | null,
  is_primary: false,
  is_verified: false,
  review_status: "unverified",
  expires_at: null,
  created_at: "2026-10-03T00:00:00.000Z",
};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ documentId: "doc-1" }),
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("react-native-image-viewing", () => () => null);

jest.mock("@/components/layout/ScreenWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/layout/StandardHeader", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/display/ConfirmDialog", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/display/ErrorDialog", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({
    colors: { primary: "#376BF5", gray400: "#9CA3AF", success: "#22C55E" },
  }),
}));
jest.mock("@/hooks/passport", () => ({
  usePassportDocuments: () => ({ documents: [mockDocument], loading: false }),
  useDeletePassportDocument: () => ({ mutate: jest.fn(), isPending: false }),
  useRequestPassportDocumentReview: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
    reset: jest.fn(),
  }),
}));
jest.mock("@/hooks/applications", () => ({
  useDocumentUrls: () => ({ resolved: [], loading: false }),
}));

jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View, Text } =
    jest.requireActual<typeof import("react-native")>("react-native");
  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  const Chip = Passthrough as typeof Passthrough & {
    Label: ({ children }: { children?: React.ReactNode }) => React.ReactNode;
  };
  Chip.Label = function ChipLabel({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children);
  };
  return { Button: Passthrough, Chip, Separator: Passthrough, Spinner: Passthrough };
});

it("shows the matching icon and purpose above a supporting document preview", () => {
  render(<PassportDocumentDetail />);

  const icon = screen.getByTestId("document-type-icon");
  expect(icon.parent?.children[0]).toBe(icon);
  expect(screen.getByText("Proof of Residency")).toBeTruthy();
  expect(
    screen.getByText(
      "Confirm your address when an application asks for proof of billing or residency.",
    ),
  ).toBeTruthy();
});

it("explains auto-linked verified IDs without repeating the message", () => {
  mockDocument.verification_id = "verification-1";
  mockDocument.doc_type = "Driver’s License";
  mockDocument.is_primary = true;
  mockDocument.is_verified = true;

  try {
    render(<PassportDocumentDetail />);

    expect(screen.getByTestId("document-type-icon")).toBeTruthy();
    expect(
      screen.getAllByText(
        "This ID is linked to your approved account verification and is managed automatically.",
      ),
    ).toHaveLength(1);
  } finally {
    mockDocument.verification_id = null;
    mockDocument.doc_type = "Proof of Residency";
    mockDocument.is_primary = false;
    mockDocument.is_verified = false;
  }
});
