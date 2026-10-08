import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import { IconHourglass } from "@tabler/icons-react-native";

import Index from "./index";

const mockRouter = { push: jest.fn(), replace: jest.fn() };

const mockPassportState = {
  documents: [] as unknown[],
  loading: false,
  refreshing: false,
  error: null as string | null,
  refetch: jest.fn(),
};

const mockDocumentUrlsState = {
  resolved: [] as { label: string; path: string; signedUrl: string | null }[],
  loading: false,
  error: null,
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("expo-image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return { Image: () => React.createElement(View) };
});

jest.mock("react-native-image-viewing", () => () => null);

jest.mock("react-native-pdf", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: "pdf-thumbnail" }),
  };
});

jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock("react-native-keyboard-aware-scroll-view", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const MockKeyboardAwareScrollView = React.forwardRef<
    React.ComponentRef<typeof RN.View>,
    { children?: React.ReactNode }
  >(function MockKeyboardAwareScrollView({ children }, ref) {
    return React.createElement(RN.View, { ref }, children);
  });
  return {
    __esModule: true,
    default: MockKeyboardAwareScrollView,
    KeyboardAwareScrollView: MockKeyboardAwareScrollView,
  };
});

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({
    colors: {
      primary: "#376BF5",
      success: "#22C55E",
      gray400: "#9CA3AF",
      textPrimary: "#333333",
    },
    isDark: false,
  }),
}));

jest.mock("@/hooks/passport", () => ({
  usePassportDocuments: () => mockPassportState,
}));

jest.mock("@/hooks/applications", () => ({
  // Resolves per requested entries like the real hook: each call site only
  // ever sees signed URLs for the paths it asked about.
  useDocumentUrls: (docs: { label: string; path: string | null }[]) => ({
    resolved: mockDocumentUrlsState.resolved.filter((r) =>
      docs.some((d) => d.path === r.path),
    ),
    loading: mockDocumentUrlsState.loading,
    error: null,
  }),
}));

jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View, Text, TouchableOpacity } =
    jest.requireActual<typeof import("react-native")>("react-native");

  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);

  const ButtonMock = (
    props: { children?: React.ReactNode } & Pick<
      React.ComponentProps<typeof TouchableOpacity>,
      "accessibilityLabel" | "accessibilityRole" | "onPress" | "testID"
    >,
  ) => React.createElement(TouchableOpacity, props);
  const ButtonLabelMock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(Text, null, children);
  ButtonMock.Label = ButtonLabelMock;

  const ChipMock = ({ children, testID, className, style, variant, color, size }: {
    children?: React.ReactNode;
    testID?: string;
    className?: string;
    style?: React.ComponentProps<typeof View>["style"];
    variant?: string;
    color?: string;
    size?: string;
  }) => React.createElement(View, { testID: testID ?? `chip-${variant}-${color}-${size}`, className, style }, children);
  ChipMock.Label = function ChipLabelMock({ children, style }: {
    children?: React.ReactNode;
    style?: React.ComponentProps<typeof View>["style"];
  }) {
    return React.createElement(View, { style }, children);
  };

  const SkeletonGroupMock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, { testID: "skeleton-group" }, children);
  const SkeletonItemMock = () =>
    React.createElement(View, { testID: "skeleton-item" });
  SkeletonGroupMock.Item = SkeletonItemMock;

  const ListGroupMock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);

  const CardMock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  CardMock.Body = Passthrough;
  function CardTitleMock({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children);
  }
  CardMock.Title = CardTitleMock;

  const PressableFeedbackMock = ({
    children,
    onPress,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
  }) =>
    React.createElement(
      TouchableOpacity,
      { onPress, testID: "pressable-card" },
      children,
    );
  function PressableHighlightMock() {
    return null;
  }
  PressableFeedbackMock.Highlight = PressableHighlightMock;

  return {
    Button: ButtonMock,
    Card: CardMock,
    Chip: ChipMock,
    ListGroup: ListGroupMock,
    PressableFeedback: PressableFeedbackMock,
    Separator: () => null,
    Spinner: () => null,
    SkeletonGroup: SkeletonGroupMock,
    Skeleton: () => null,
  };
});

jest.mock("./components/PassportSkeleton", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: "passport-skeleton" }),
  };
});

const primaryDoc = {
  id: "doc-1",
  user_id: "user-1",
  doc_type: "Driver’s License",
  storage_path: "user-1/passport/licence-1.jpg",
  storage_path_back: null,
  mime_type: "image/jpeg",
  id_type: "Driver’s License",
  verification_id: "verification-1",
  is_verified: true,
  is_primary: true,
  expires_at: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: null,
};

const payslipDoc = {
  ...primaryDoc,
  id: "doc-2",
  doc_type: "Payslip",
  storage_path: "user-1/passport/payslip-1.jpg",
  id_type: null,
  verification_id: null,
  is_verified: false,
  is_primary: false,
};

const payslipResolved = {
  label: "Payslip",
  path: "user-1/passport/payslip-1.jpg",
  signedUrl: "https://signed.test/payslip.jpg",
};

const pdfDoc = {
  ...primaryDoc,
  id: "doc-3",
  doc_type: "Proof of Income",
  storage_path: "user-1/passport/income-1.pdf",
  mime_type: "application/pdf",
  id_type: null,
  verification_id: null,
  is_verified: false,
  is_primary: false,
};

const pdfResolved = {
  label: "Proof of Income",
  path: "user-1/passport/income-1.pdf",
  signedUrl: "https://signed.test/income.pdf",
};

const frontResolved = {
  label: "Driver’s License",
  path: "user-1/passport/licence-1.jpg",
  signedUrl: "https://signed.test/front.jpg",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPassportState.documents = [];
  mockPassportState.loading = false;
  mockPassportState.refreshing = false;
  mockPassportState.error = null;
  mockDocumentUrlsState.resolved = [];
  mockDocumentUrlsState.loading = false;
});

describe("APT Passport wallet screen", () => {
  it("holds the skeleton while the wallet query is loading", () => {
    mockPassportState.loading = true;

    render(<Index />);

    expect(screen.getByTestId("passport-skeleton")).toBeTruthy();
    expect(screen.queryByText("No documents yet")).toBeNull();
  });

  it("holds the skeleton while signed URLs are still resolving", () => {
    mockDocumentUrlsState.loading = true;

    render(<Index />);

    expect(screen.getByTestId("passport-skeleton")).toBeTruthy();
    expect(screen.queryByText("No documents yet")).toBeNull();
  });

  it("shows the empty state once the wallet has settled empty", () => {
    render(<Index />);

    expect(screen.getByText("No documents yet")).toBeTruthy();
    expect(screen.queryByTestId("passport-skeleton")).toBeNull();
  });

  it("never renders the empty state while the wallet is still loading", async () => {
    // The wallet query links the verification ID before resolving, so a
    // settled read already contains the primary row.
    mockPassportState.loading = true;

    const { rerender } = render(<Index />);

    expect(screen.queryByText("No documents yet")).toBeNull();

    mockPassportState.loading = false;
    mockPassportState.documents = [primaryDoc];
    rerender(<Index />);

    await waitFor(() =>
      expect(screen.getByText("Valid ID / Government ID")).toBeTruthy(),
    );
    expect(screen.queryByText("No documents yet")).toBeNull();
  });

  it("keeps settled content visible on later refetches", async () => {
    const { rerender } = render(<Index />);

    await waitFor(() =>
      expect(screen.getByText("No documents yet")).toBeTruthy(),
    );

    mockPassportState.refreshing = true;
    mockPassportState.documents = [primaryDoc];
    rerender(<Index />);

    expect(screen.getByText("Valid ID / Government ID")).toBeTruthy();
    expect(screen.queryByText("No documents yet")).toBeNull();
    expect(screen.queryByTestId("passport-skeleton")).toBeNull();
  });

  it("shows the section empty state when only the verified ID exists", () => {
    mockPassportState.documents = [primaryDoc];
    mockDocumentUrlsState.resolved = [
      {
        label: "Driver’s License",
        path: "user-1/passport/licence-1.jpg",
        signedUrl: "https://signed.test/front.jpg",
      },
    ];

    render(<Index />);

    expect(screen.getByText("Valid ID / Government ID")).toBeTruthy();
    expect(screen.getByText("No supporting documents yet")).toBeTruthy();
    expect(screen.getByText("Add a Document")).toBeTruthy();
    expect(screen.queryByText("No documents yet")).toBeNull();
    expect(screen.queryByText("Need help?")).toBeNull();
    expect(screen.queryByText("Contact Support")).toBeNull();
  });

  it("never renders the help footer", () => {
    render(<Index />);

    expect(screen.queryByText("Need help?")).toBeNull();
    expect(screen.queryByText("Contact Support")).toBeNull();
  });
});

describe("Supporting documents view toggle", () => {
  beforeEach(() => {
    mockPassportState.documents = [primaryDoc, payslipDoc];
    mockDocumentUrlsState.resolved = [
      {
        label: "Driver’s License",
        path: "user-1/passport/licence-1.jpg",
        signedUrl: "https://signed.test/front.jpg",
      },
      payslipResolved,
    ];
  });

  it("defaults to the grid view", () => {
    render(<Index />);

    expect(screen.getByLabelText("Toggle view")).toBeTruthy();
    // Grid cards use "Tap to View"; list rows use "Tap to view".
    expect(screen.getByText("Tap to View")).toBeTruthy();
    expect(screen.queryByText("Tap to view")).toBeNull();
  });

  it("switches to the vertical list view", () => {
    render(<Index />);

    fireEvent.press(screen.getByLabelText("Toggle view"));

    expect(screen.getByText("Tap to view")).toBeTruthy();
    expect(screen.queryByText("Tap to View")).toBeNull();
  });

  it("insets the list row content inside its card", () => {
    render(<Index />);
    fireEvent.press(screen.getByLabelText("Toggle view"));

    const RNView =
      jest.requireActual<typeof import("react-native")>("react-native").View;
    expect(
      screen.UNSAFE_getAllByType(RNView).some(
        (node) => node.props.className === "px-4",
      ),
    ).toBe(true);
  });

  it("routes to the detail screen from a list row", () => {
    render(<Index />);

    fireEvent.press(screen.getByLabelText("Toggle view"));
    fireEvent.press(screen.getByText("Payslip"));

    expect(mockRouter.push).toHaveBeenCalledWith("/document-id/doc-2");
  });

  it("renders a PDF thumbnail for PDF documents", () => {
    mockPassportState.documents = [primaryDoc, pdfDoc];
    mockDocumentUrlsState.resolved = [frontResolved, pdfResolved];

    render(<Index />);

    expect(screen.getByTestId("pdf-thumbnail")).toBeTruthy();
  });

  it("does not try to render a private PDF without a signed URL", () => {
    mockPassportState.documents = [primaryDoc, pdfDoc];
    mockDocumentUrlsState.resolved = [
      frontResolved,
      { ...pdfResolved, signedUrl: null },
    ];

    render(<Index />);

    expect(screen.getByText("Proof of Income")).toBeTruthy();
    expect(screen.queryByTestId("pdf-thumbnail")).toBeNull();
  });

  it("renders a PDF thumbnail in the list view too", () => {
    mockPassportState.documents = [primaryDoc, pdfDoc];
    mockDocumentUrlsState.resolved = [frontResolved, pdfResolved];

    render(<Index />);

    fireEvent.press(screen.getByLabelText("Toggle view"));

    expect(screen.getByTestId("pdf-thumbnail")).toBeTruthy();
  });

  it("keeps image previews for image documents", () => {
    mockPassportState.documents = [primaryDoc, payslipDoc];
    mockDocumentUrlsState.resolved = [frontResolved, payslipResolved];

    render(<Index />);

    expect(screen.queryByTestId("pdf-thumbnail")).toBeNull();
    expect(screen.getByText("Payslip")).toBeTruthy();
  });

  it("shows the shield in the card corner for verified supporting documents", () => {
    mockPassportState.documents = [primaryDoc, { ...payslipDoc, is_verified: true }];
    render(<Index />);

    expect(screen.getByTestId("verified-badge")).toBeTruthy();
    expect(screen.queryByTestId("expired-badge")).toBeNull();
  });

  it("overlays the under-review chip at the top left of the document thumbnail", () => {
    mockPassportState.documents = [
      primaryDoc,
      { ...payslipDoc, review_status: "pending" },
    ];
    render(<Index />);

    const badge = screen.getByTestId("pending-badge");
    expect(badge.props.className).toContain("absolute top-2 left-2");
    expect(badge.props.style).toMatchObject({
      backgroundColor: "#FEF3C7",
      borderColor: "#FCD34D",
      borderWidth: 1,
    });
    expect(badge.findByType(IconHourglass).props.color).toBe("#92400E");
    expect(
      badge.findAll(
        (node) => node.children.includes("Under review") && node.props.style?.color === "#92400E",
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Payslip")).toBeTruthy();
    expect(screen.queryByTestId("verified-badge")).toBeNull();
  });

  it("shows expired instead of verified on cards and list rows", () => {
    mockPassportState.documents = [
      primaryDoc,
      { ...payslipDoc, is_verified: true, expires_at: "2020-01-01" },
    ];
    mockDocumentUrlsState.resolved = [frontResolved, payslipResolved];
    render(<Index />);

    expect(screen.queryByTestId("verified-badge")).toBeNull();
    expect(screen.getByTestId("expired-badge")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Toggle view"));
    expect(screen.getByText("Expired")).toBeTruthy();
    expect(screen.queryByText("Verified")).toBeNull();
  });
});

describe("Valid ID flip control", () => {
  const primaryWithBack = {
    ...primaryDoc,
    id: "doc-back",
    storage_path_back: "user-1/passport/licence-1-back.jpg",
  };

  beforeEach(() => {
    mockPassportState.documents = [primaryWithBack];
    mockDocumentUrlsState.resolved = [
      {
        label: "Driver’s License",
        path: "user-1/passport/licence-1.jpg",
        signedUrl: "https://signed.test/front.jpg",
      },
      {
        label: "Driver’s License (back)",
        path: "user-1/passport/licence-1-back.jpg",
        signedUrl: "https://signed.test/back.jpg",
      },
    ];
  });

  it("hides the flip button when the ID has no back side", () => {
    mockPassportState.documents = [primaryDoc];
    mockDocumentUrlsState.resolved = [
      {
        label: "Driver’s License",
        path: "user-1/passport/licence-1.jpg",
        signedUrl: "https://signed.test/front.jpg",
      },
    ];

    render(<Index />);

    expect(screen.getByText("Valid ID / Government ID")).toBeTruthy();
    expect(screen.queryByLabelText("Show back of ID")).toBeNull();
    expect(screen.queryByLabelText("Show front of ID")).toBeNull();
    expect(screen.getByTestId("chip-soft-success-md")).toBeTruthy();
  });

  it("flips between front and back when the button is tapped", () => {
    render(<Index />);

    expect(screen.getByLabelText("Show back of ID")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Show back of ID"));

    expect(screen.getByLabelText("Show front of ID")).toBeTruthy();
    expect(screen.queryByLabelText("Show back of ID")).toBeNull();
  });
});

describe("PassportSkeleton", () => {
  it("renders a skeleton group matching the wallet layout", () => {
    const ActualSkeleton = jest.requireActual<
      typeof import("./components/PassportSkeleton")
    >("./components/PassportSkeleton").default;

    render(<ActualSkeleton />);

    expect(screen.getByTestId("skeleton-group")).toBeTruthy();
    expect(screen.getAllByTestId("skeleton-item").length).toBeGreaterThan(0);
  });

  it("lays the card placeholders out in two columns", () => {
    const ActualSkeleton = jest.requireActual<
      typeof import("./components/PassportSkeleton")
    >("./components/PassportSkeleton").default;
    const RNView =
      jest.requireActual<typeof import("react-native")>("react-native").View;

    const { UNSAFE_getAllByType } = render(<ActualSkeleton />);
    const wrappers = UNSAFE_getAllByType(RNView).filter(
      (node: { props?: { className?: string } }) =>
        node.props?.className === "w-[48%]",
    );

    // Four 2-column placeholders, matching the four-card grid of the real view.
    expect(wrappers.length).toBe(4);
  });
});
