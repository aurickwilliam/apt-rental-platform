import { fireEvent, render, screen } from "@testing-library/react-native";

import SearchSection from "./SearchSection";
import type { SearchSection as SearchSectionType } from "@/hooks/search/useSearchSections";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconChevronRight: () => null }));
jest.mock("heroui-native", () => ({ SkeletonGroup: () => null }));
jest.mock("components/cards/ApartmentCard", () => () => null);
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#000" } }) }));

function buildSection(id: string): SearchSectionType {
  return {
    id,
    title: id === "all_results" ? "All Results" : "Verified",
    apartments: [{ id: "apt-1" } as never],
  };
}

describe("SearchSection", () => {
  it("shows a See All button for a regular section", async () => {
    await render(
      <SearchSection section={buildSection("verified")} isFavorite={() => false} onToggleFavorite={jest.fn()} onPressApartment={jest.fn()} />,
    );
    expect(screen.getByLabelText("See all Verified")).toBeTruthy();
  });

  it("hides See All for the All Results fallback", async () => {
    await render(
      <SearchSection section={buildSection("all_results")} isFavorite={() => false} onToggleFavorite={jest.fn()} onPressApartment={jest.fn()} />,
    );
    expect(screen.queryByLabelText("See all All Results")).toBeNull();
    expect(screen.getByText("All Results")).toBeTruthy();
  });

  beforeEach(() => mockPush.mockClear());

  it("shows the subtitle under the title", async () => {
    await render(
      <SearchSection
        section={{ ...buildSection("pets"), title: "Pet-Friendly Homes", subtitle: "Because you have pets." }}
        isFavorite={() => false}
        onToggleFavorite={jest.fn()}
        onPressApartment={jest.fn()}
      />,
    );
    expect(screen.getByText("Pet-Friendly Homes")).toBeTruthy();
    expect(screen.getByText("Because you have pets.")).toBeTruthy();
  });

  it("opens a fixed row by its id alone", async () => {
    await render(
      <SearchSection section={buildSection("verified")} isFavorite={() => false} onToggleFavorite={jest.fn()} onPressApartment={jest.fn()} />,
    );
    await fireEvent.press(screen.getByLabelText("See all Verified"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/search/section/[sectionId]",
      params: { sectionId: "verified", title: "Verified" },
    });
  });

  it("opens a spec-built row with its spec so See All can list the whole row", async () => {
    const spec = { id: "pets", title: "Pet-Friendly Homes", subtitle: "", criteria: { amenities: ["petfriendly"] }, sort: "rating" as const };
    await render(
      <SearchSection
        section={{ ...buildSection("pets"), title: "Pet-Friendly Homes", spec }}
        isFavorite={() => false}
        onToggleFavorite={jest.fn()}
        onPressApartment={jest.fn()}
      />,
    );
    await fireEvent.press(screen.getByLabelText("See all Pet-Friendly Homes"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/search/section/[sectionId]",
      params: { sectionId: "pets", title: "Pet-Friendly Homes", spec: JSON.stringify(spec) },
    });
  });
});
