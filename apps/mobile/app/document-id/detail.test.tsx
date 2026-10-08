import { act, fireEvent, render, screen } from "@testing-library/react-native";

import PassportDocumentDetail from "./[documentId]";

const mockRequestReview = jest.fn();
const mockRemove = jest.fn();
let mockRequestError: Error | null = null;

const mockDocument = {
  id: "doc-1",
  user_id: "user-1",
  doc_type: "Proof of Residency",
  storage_path: "user-1/passport/residency.pdf",
  storage_path_back: null as string | null,
  mime_type: "application/pdf" as string | null,
  rejection_reason: null as string | null,
  verification_id: null as string | null,
  is_primary: false,
  is_verified: false,
  review_status: "unverified" as string,
  expires_at: null as string | null,
  created_at: "2026-10-03T00:00:00.000Z",
};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ documentId: "doc-1" }),
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("@/components/display/PdfThumbnail", () => ({
  __esModule: true,
  default: () => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return React.createElement(View, { testID: "pdf-thumbnail" });
  },
}));
jest.mock("react-native-image-viewing", () => () => null);

jest.mock("@/components/layout/ScreenWrapper", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) =>
      React.createElement(View, null, children, footer),
  };
});
jest.mock("@/components/layout/StandardHeader", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/display/ConfirmDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onConfirm,
    errorMessage,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    errorMessage?: string | null;
  }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text, Pressable } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return isOpen
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(Pressable, { onPress: onConfirm, accessibilityLabel: "confirm-delete" }),
          errorMessage ? React.createElement(Text, null, errorMessage) : null,
        )
      : null;
  },
}));
jest.mock("@/components/display/ErrorDialog", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({
    colors: { primary: "#376BF5", gray400: "#9CA3AF", success: "#22C55E", danger: "#EF4444" },
  }),
}));
jest.mock("@/hooks/passport", () => ({
  usePassportDocuments: () => ({ documents: [mockDocument], loading: false }),
  useDeletePassportDocument: () => ({ mutate: mockRemove, isPending: false }),
  useRequestPassportDocumentReview: () => ({
    mutate: mockRequestReview,
    isPending: false,
    error: mockRequestError,
    reset: jest.fn(),
  }),
}));
jest.mock("@/hooks/applications", () => ({
  useDocumentUrls: () => ({
    resolved: [
      { signedUrl: "https://signed.test/front" },
      { signedUrl: "https://signed.test/back" },
    ],
    loading: false,
  }),
}));

jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View, Text, Pressable } =
    jest.requireActual<typeof import("react-native")>("react-native");
  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  const ButtonBase = ({
    children,
    isDisabled,
    accessibilityLabel,
    onPress,
  }: {
    children?: React.ReactNode;
    isDisabled?: boolean;
    accessibilityLabel?: string;
    onPress?: () => void;
  }) =>
    React.createElement(
      Pressable,
      { accessibilityLabel, onPress, accessibilityState: { disabled: !!isDisabled } },
      children,
    );
  const Button = ButtonBase as typeof ButtonBase & {
    Label: ({ children }: { children?: React.ReactNode }) => React.ReactNode;
  };
  Button.Label = function ButtonLabel({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children);
  };
  const Chip = (({ children, variant, color, size }: {
    children?: React.ReactNode;
    variant: string;
    color: string;
    size: string;
  }) => React.createElement(View, { testID: `status-chip-${variant}-${color}-${size}` }, children)) as typeof Passthrough & {
    Label: ({ children }: { children?: React.ReactNode }) => React.ReactNode;
  };
  Chip.Label = function ChipLabel({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children);
  };
  return { Button, Chip, Separator: Passthrough, Spinner: Passthrough };
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
     expect(screen.getByTestId("status-chip-soft-success-sm")).toBeTruthy();
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

it("uses a soft warning chip and an in-body banner during review", () => {
  mockDocument.review_status = "pending";

  try {
    render(<PassportDocumentDetail />);

    expect(screen.getByText("Under review")).toBeTruthy();
    expect(screen.getByTestId("status-chip-soft-warning-sm")).toBeTruthy();
    expect(screen.getByText("Under admin review")).toBeTruthy();
    expect(screen.queryByText("Delete Document")).toBeNull();
    expect(screen.queryByText(/You can delete it once/)).toBeNull();
  } finally {
    mockDocument.review_status = "unverified";
  }
});

function withDocument(patch: Partial<typeof mockDocument>, run: () => void) {
  const original = { ...mockDocument };
  Object.assign(mockDocument, patch);
  try {
    run();
  } finally {
    Object.assign(mockDocument, original);
  }
}

it("renders an inline PDF thumbnail for PDF documents", () => {
  render(<PassportDocumentDetail />);

  expect(screen.getByTestId("pdf-thumbnail")).toBeTruthy();
  expect(screen.getByText("Document Preview")).toBeTruthy();
});

it("falls back to a file card for non-PDF, non-image files", () => {
  withDocument(
    {
      storage_path: "user-1/passport/letter.docx",
      mime_type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    () => {
      render(<PassportDocumentDetail />);

      expect(screen.queryByTestId("pdf-thumbnail")).toBeNull();
      expect(screen.getByText(/DOCX · Tap to open/)).toBeTruthy();
    },
  );
});

it("labels front and back only when a back image exists", () => {
  render(<PassportDocumentDetail />);
  expect(screen.queryByText("Front")).toBeNull();
  expect(screen.queryByText("Back")).toBeNull();
  screen.unmount();

  withDocument({ storage_path_back: "user-1/passport/back.jpg" }, () => {
    render(<PassportDocumentDetail />);
    expect(screen.getByText("Front")).toBeTruthy();
    expect(screen.getByText("Back")).toBeTruthy();
  });
});

it("shows the uploaded date and 'No expiry' when there is no expiry date", () => {
  render(<PassportDocumentDetail />);

  expect(screen.getByText("Uploaded")).toBeTruthy();
  expect(screen.getByText("Expiry date")).toBeTruthy();
  expect(screen.getByText("No expiry")).toBeTruthy();
});

it("flags an expired document and disables verification", () => {
  withDocument({ doc_type: "Payslip", expires_at: "2020-01-01" }, () => {
    render(<PassportDocumentDetail />);

    expect(screen.getByText("Expired document")).toBeTruthy();
    expect(screen.getByText(/\(Expired\)/)).toBeTruthy();
    expect(screen.getByText(/This document has expired/)).toBeTruthy();
    expect(
      screen.getByLabelText("Request document verification").props
        .accessibilityState.disabled,
    ).toBe(true);
  });
});

it("shows Unverified, Rejected and Verified statuses with text", () => {
  const original = mockDocument.doc_type;
  mockDocument.doc_type = "Payslip";
  render(<PassportDocumentDetail />);
  mockDocument.doc_type = original;
  expect(screen.getByText("Unverified")).toBeTruthy();
  expect(screen.getByText("Request Verification")).toBeTruthy();
  screen.unmount();

  withDocument(
    { doc_type: "Payslip", review_status: "rejected", rejection_reason: "Photo is blurry" },
    () => {
      render(<PassportDocumentDetail />);
      expect(screen.getByText("Rejected")).toBeTruthy();
      expect(screen.getByText("Photo is blurry")).toBeTruthy();
      expect(screen.getByText("Request Review Again")).toBeTruthy();
    },
  );
});

it("hides the verify action once the document is verified", () => {
  withDocument({ is_verified: true, review_status: "verified" }, () => {
    render(<PassportDocumentDetail />);

    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.queryByText("Request Verification")).toBeNull();
    expect(screen.getByText("Delete Document")).toBeTruthy();
  });
});

beforeEach(() => {
  mockRequestReview.mockClear();
  mockRemove.mockClear();
  mockRequestError = null;
});

it("shows an Expired chip instead of Verified for an expired verified document", () => {
  withDocument(
    { is_verified: true, review_status: "verified", expires_at: "2020-01-01" },
    () => {
      render(<PassportDocumentDetail />);

      expect(screen.getByText("Expired")).toBeTruthy();
      expect(screen.queryByText("Verified")).toBeNull();
    },
  );
});

it("submits a review request for an eligible document", () => {
  withDocument({ doc_type: "Payslip" }, () => {
    render(<PassportDocumentDetail />);

    fireEvent(screen.getByLabelText("Request document verification"), "press");
    expect(mockRequestReview).toHaveBeenCalledWith({ id: "doc-1" });
  });
});

it("shows the review request error inline", () => {
  mockRequestError = new Error("This document is already under review.");
  withDocument({ doc_type: "Payslip" }, () => {
    render(<PassportDocumentDetail />);

    expect(
      screen.getByText("This document is already under review."),
    ).toBeTruthy();
  });
});

it("deletes after confirmation and surfaces a delete error", () => {
  render(<PassportDocumentDetail />);

  fireEvent(screen.getByLabelText("Delete document"), "press");
  fireEvent(screen.getByLabelText("confirm-delete"), "press");
  expect(mockRemove).toHaveBeenCalledWith(
    { id: "doc-1", storagePath: "user-1/passport/residency.pdf" },
    expect.any(Object),
  );

  const { onError } = mockRemove.mock.calls[0][1];
  act(() => onError(new Error("Attached to an active application.")));
  expect(screen.getByText("Attached to an active application.")).toBeTruthy();
});
