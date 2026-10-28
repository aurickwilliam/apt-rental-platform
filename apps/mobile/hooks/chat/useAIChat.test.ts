import { act, renderHook } from "@testing-library/react-native";
import { EMPTY_AI_SEARCH_FILTERS, type AiSearchFilters } from "@repo/utils";

import { useAIChat } from "./useAIChat";

const mockAskAva = jest.fn();
const mockFetchAvaListings = jest.fn();

jest.mock("@/service/search/aiSearchService", () => ({
  askAva: (...args: unknown[]) => mockAskAva(...args),
  fetchAvaListings: (...args: unknown[]) => mockFetchAvaListings(...args),
  hasSearchableDetails: (filters: AiSearchFilters) =>
    filters.cities.length > 0 || filters.priceMax !== null,
}));

const MALABON: AiSearchFilters = { ...EMPTY_AI_SEARCH_FILTERS, cities: ["Malabon"] };
const LISTING = { id: "apt-1", name: "Sunny Studio" };

const answer = (overrides: Record<string, unknown>) => ({
  source: "gemini",
  reply: null,
  quickReplies: [],
  noResultsReply: null,
  noResultsQuickReplies: [],
  filters: EMPTY_AI_SEARCH_FILTERS,
  ...overrides,
});

describe("useAIChat", () => {
  beforeEach(() => {
    mockAskAva.mockReset();
    mockFetchAvaListings.mockReset();
  });

  it("shows Ava's reply with real listings", async () => {
    mockAskAva.mockResolvedValue(answer({
      source: "gemini",
      reply: "Hinahanap ko po ang studio sa Malabon.",
      quickReplies: ["Hanggang 10k"],
      filters: MALABON,
    }));
    mockFetchAvaListings.mockResolvedValue({ listings: [LISTING], total: 1 });

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("studio sa Malabon"));

    expect(mockAskAva).toHaveBeenCalledWith([{ role: "user", text: "studio sa Malabon" }]);
    expect(mockFetchAvaListings).toHaveBeenCalledWith(MALABON);
    const [user, assistant] = result.current.messages;
    expect(user).toMatchObject({ role: "user", text: "studio sa Malabon" });
    expect(assistant).toMatchObject({
      role: "assistant",
      text: "Hinahanap ko po ang studio sa Malabon.",
      quickReplies: ["Hanggang 10k"],
      listings: [LISTING],
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("sends the earlier conversation with the new message", async () => {
    mockAskAva.mockResolvedValue(answer({ source: "gemini", reply: "Saan po?", quickReplies: [], filters: EMPTY_AI_SEARCH_FILTERS }));

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("Hi"));
    await act(() => result.current.sendMessage("Malabon"));

    expect(mockAskAva).toHaveBeenLastCalledWith([
      { role: "user", text: "Hi" },
      { role: "assistant", text: "Saan po?" },
      { role: "user", text: "Malabon" },
    ]);
  });

  it("asks for details and offers cities when nothing searchable was understood", async () => {
    mockAskAva.mockResolvedValue(answer({ source: "fallback", reply: null, quickReplies: [], filters: EMPTY_AI_SEARCH_FILTERS }));

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("Hello"));

    expect(mockFetchAvaListings).not.toHaveBeenCalled();
    expect(result.current.messages[1].text).toMatch(/area, your monthly budget/);
    expect(result.current.messages[1].quickReplies).toEqual(["Caloocan", "Malabon", "Navotas", "Valenzuela"]);
  });

  it("explains the daily limit and still searches", async () => {
    mockAskAva.mockResolvedValue(answer({ source: "limit", reply: null, quickReplies: [], filters: MALABON }));
    mockFetchAvaListings.mockResolvedValue({ listings: [LISTING], total: 1 });

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("Malabon"));

    expect(result.current.messages[1].text).toMatch(/^I've answered a lot today/);
    expect(result.current.messages[1].listings).toEqual([LISTING]);
  });

  it("uses Gemini's no-results reply in the tenant's language", async () => {
    mockAskAva.mockResolvedValue(answer({
      reply: "Hinahanap ko po ang pet-friendly na studio. May gusto pa po ba kayong idagdag?",
      quickReplies: ["May parking"],
      noResultsReply: "Wala pa pong pet-friendly na studio. Subukan natin sa ibang lugar?",
      noResultsQuickReplies: ["Ibang lugar", "Taasan ang budget"],
      filters: MALABON,
    }));
    mockFetchAvaListings.mockResolvedValue({ listings: [], total: 0 });

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("murang studio na pet friendly"));

    expect(result.current.messages[1]).toMatchObject({
      text: "Wala pa pong pet-friendly na studio. Subukan natin sa ibang lugar?",
      quickReplies: ["Ibang lugar", "Taasan ang budget"],
    });
  });

  it("says when no listing matches", async () => {
    mockAskAva.mockResolvedValue(answer({ source: "fallback", reply: null, quickReplies: [], filters: MALABON }));
    mockFetchAvaListings.mockResolvedValue({ listings: [], total: 0 });

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("Malabon"));

    expect(result.current.messages[1].text).toMatch(/couldn't find a match yet/);
    expect(result.current.messages[1].quickReplies).toEqual(["Any area in CAMANAVA", "Higher budget", "Any unit type"]);
  });

  it("shows a friendly error when listings fail to load", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockAskAva.mockResolvedValue(answer({ source: "gemini", reply: "OK", quickReplies: [], filters: MALABON }));
    mockFetchAvaListings.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("Malabon"));

    expect(result.current.messages[1].text).toMatch(/couldn't load listings/);
    consoleError.mockRestore();
  });

  it("starts a new chat and drops a reply that was still on its way", async () => {
    let resolveAnswer: (value: unknown) => void = () => {};
    mockAskAva.mockReturnValue(new Promise((resolve) => { resolveAnswer = resolve; }));

    const { result } = renderHook(() => useAIChat());
    let pending: Promise<void> = Promise.resolve();
    act(() => { pending = result.current.sendMessage("Malabon"); });
    act(() => result.current.resetChat());

    await act(async () => {
      resolveAnswer(answer({ reply: "Late reply", filters: EMPTY_AI_SEARCH_FILTERS }));
      await pending;
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("ignores blank messages", async () => {
    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("   "));

    expect(mockAskAva).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });
});
