import React from "react";
import { render, screen } from "@testing-library/react-native";
import TermsScreen from "@/app/settings/terms";
import PrivacyPolicyScreen from "@/app/settings/privacy-policy";
import { TERMS_POLICY } from "@/constants/legal/terms";
import { PRIVACY_POLICY } from "@/constants/legal/privacy";

jest.mock("@/components/layout/StandardHeader", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockHeader({ title }: { title: string }) {
    return <Text>{title}</Text>;
  };
});

jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockScreenWrapper({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
    return <View>{header}{children}</View>;
  };
});

describe.each([
  { name: "Terms", Component: TermsScreen, policy: TERMS_POLICY },
  { name: "Privacy", Component: PrivacyPolicyScreen, policy: PRIVACY_POLICY },
])("$name screen", ({ Component, policy }) => {
  it("renders all policy text, headings, metadata, callouts, and contact information", () => {
    render(<Component />);
    expect(screen.getByText(policy.title)).toBeTruthy();
    expect(screen.getByText(`Last updated: ${policy.lastUpdated}`)).toBeTruthy();
    expect(screen.getByText(`Version ${policy.version} · ${policy.jurisdiction}`)).toBeTruthy();

    policy.sections.forEach((section, index) => {
      expect(screen.getByRole("header", { name: `${index + 1}. ${section.title}` })).toBeTruthy();
      if (section.intro) expect(screen.getAllByText(section.intro).length).toBeGreaterThan(0);
      section.body?.forEach((text) => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
      section.list?.forEach((text) => expect(screen.getAllByText(`• ${text}`).length).toBeGreaterThan(0));
      section.blocks?.forEach((block) => {
        if (block.type === "list") {
          block.items.forEach((text) => expect(screen.getAllByText(`• ${text}`).length).toBeGreaterThan(0));
        } else {
          expect(screen.getAllByText(block.text).length).toBeGreaterThan(0);
        }
      });
      if (section.callout) {
        expect(screen.getAllByText(section.callout.label).length).toBeGreaterThan(0);
        expect(screen.getByText(section.callout.text)).toBeTruthy();
      }
    });

    expect(screen.getByText(`Email: ${policy.contact.email}`)).toBeTruthy();
    expect(screen.getByText(`Address: ${policy.contact.address}`)).toBeTruthy();
    expect(screen.getByText(`Hours: ${policy.contact.hours}`)).toBeTruthy();
    expect(screen.queryByText(/June 2025|support@apt\.com|maximum of 12 months/)).toBeNull();
  });
});
