import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  MAX_RECENT_PLACE_SEARCHES,
  addRecentPlaceSearch,
  loadRecentPlaceSearches,
  recentPlaceSearchesKey,
  saveRecentPlaceSearches,
  type RecentPlaceSearch,
} from "./recentPlaceSearches";

const place = (id: string): RecentPlaceSearch => ({
  placeId: id,
  mainText: `Place ${id}`,
  secondaryText: "Malabon, Metro Manila",
});

describe("addRecentPlaceSearch", () => {
  it("puts the newest first and removes an older copy", () => {
    const list = addRecentPlaceSearch([place("a"), place("b")], place("b"));
    expect(list.map((item) => item.placeId)).toEqual(["b", "a"]);
  });

  it(`keeps at most ${MAX_RECENT_PLACE_SEARCHES}`, () => {
    let list: RecentPlaceSearch[] = [];
    for (const id of ["1", "2", "3", "4", "5", "6"]) list = addRecentPlaceSearch(list, place(id));
    expect(list.map((item) => item.placeId)).toEqual(["6", "5", "4", "3", "2"]);
  });
});

describe("load/save", () => {
  beforeEach(() => AsyncStorage.clear());

  it("round-trips per account", async () => {
    await saveRecentPlaceSearches("user-1", [place("a")]);
    expect(await loadRecentPlaceSearches("user-1")).toEqual([place("a")]);
    expect(await loadRecentPlaceSearches("user-2")).toEqual([]);
  });

  it("ignores malformed data", async () => {
    await AsyncStorage.setItem(recentPlaceSearchesKey("user-1"), JSON.stringify([{ bad: true }, place("a")]));
    expect(await loadRecentPlaceSearches("user-1")).toEqual([place("a")]);
    await AsyncStorage.setItem(recentPlaceSearchesKey("user-1"), "not json");
    expect(await loadRecentPlaceSearches("user-1")).toEqual([]);
  });
});
