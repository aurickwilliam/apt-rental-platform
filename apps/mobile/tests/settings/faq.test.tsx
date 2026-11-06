import { render, screen } from "@testing-library/react-native";

import Faq from "@/app/settings/faq";
import { FAQ_ITEMS } from "@/constants/faq";

jest.mock("heroui-native", () => jest.requireActual("../support/heroUINativeStub"));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { gray500: "#626B73" } }),
}));

jest.mock("@/components/layout/ScreenWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/layout/StandardHeader", () => ({ __esModule: true, default: () => null }));

describe("FAQ screen", () => {
  it("renders every question and its answer", () => {
    render(<Faq />);
    for (const faq of FAQ_ITEMS) {
      expect(screen.getByText(faq.question)).toBeTruthy();
      expect(screen.getByText(faq.answer)).toBeTruthy();
    }
  });

  it("names the controls the app actually shows", () => {
    render(<Faq />);
    expect(screen.getByText(/Pay Now/)).toBeTruthy();
    expect(screen.getByText(/Request Maintenance/)).toBeTruthy();
    expect(screen.getByText(/View document/)).toBeTruthy();
    expect(screen.getByText(/Message landlord/)).toBeTruthy();
    expect(screen.getByText(/Add Property/)).toBeTruthy();
    expect(screen.getByText(/Apply for Verification/)).toBeTruthy();
  });

  it("never brings back labels the app stopped using", () => {
    render(<Faq />);
    // Removed flows must not creep back into the copy.
    expect(screen.queryByText(/Chat Landlord|Pay Rent|Verify Account/)).toBeNull();
  });
});
