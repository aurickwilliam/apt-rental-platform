import { render, screen } from "@testing-library/react-native";

import { TEAM_MEMBERS } from "@repo/constants";
import About from "@/app/settings/about";

jest.mock("heroui-native", () => ({
  ...jest.requireActual("../support/heroUINativeStub"),
  useToast: () => ({ toast: { show: jest.fn() } }),
}));

jest.mock("expo-updates", () => ({ isEnabled: false, isEmbeddedLaunch: true, updateId: null, channel: null }));

jest.mock("@/service/appRelease/appReleaseService", () => ({ getInstalledAppVersion: () => "1.2.3" }));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { primary: "#376BF5" } }),
}));

jest.mock("@/components/layout/ScreenWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/layout/StandardHeader", () => ({ __esModule: true, default: () => null }));

describe("About screen", () => {
  it("lists the real team and no placeholder names", async () => {
    await render(<About />);
    for (const member of TEAM_MEMBERS) {
      expect(screen.getByText(member.name)).toBeTruthy();
    }
    expect(screen.queryByText(/Bill Gates|Linus Torvalds/)).toBeNull();
  });

  it("shows a link button only for profiles the member has", async () => {
    await render(<About />);
    const githubCount = TEAM_MEMBERS.filter((m) => m.github).length;
    const linkedinCount = TEAM_MEMBERS.filter((m) => m.linkedin).length;
    expect(screen.getAllByLabelText(/on GitHub$/)).toHaveLength(githubCount);
    expect(screen.getAllByLabelText(/on LinkedIn$/)).toHaveLength(linkedinCount);
  });
});
