import { render, screen } from "@testing-library/react-native";

import SearchSection from "./SearchSection";
import type { SearchSection as SearchSectionType } from "./useSearchSections";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconChevronRight: () => null }));
jest.mock("heroui-native", () => ({ SkeletonGroup: () => null }));
jest.mock("components/cards/ApartmentCard", () => () => null);
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#000" } }) }));

function buildSection(id: string): SearchSectionType {
  return {
    id,
    title: id === "all_results" ? "All Results" : "Verified",
    apartments: [{ id: "apt-1" } as never],
    rawApartments: [],
  };
}

describe("SearchSection", () => {
  it("shows a See All button for a regular section", () => {
    render(
      <SearchSection section={buildSection("verified")} isFavorite={() => false} onToggleFavorite={jest.fn()} onPressApartment={jest.fn()} />,
    );
    expect(screen.getByLabelText("See all Verified")).toBeTruthy();
  });

  it("hides See All for the All Results fallback", () => {
    render(
      <SearchSection section={buildSection("all_results")} isFavorite={() => false} onToggleFavorite={jest.fn()} onPressApartment={jest.fn()} />,
    );
    expect(screen.queryByLabelText("See all All Results")).toBeNull();
    expect(screen.getByText("All Results")).toBeTruthy();
  });
});
