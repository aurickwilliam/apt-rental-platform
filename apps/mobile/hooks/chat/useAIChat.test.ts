import { act, renderHook } from "@testing-library/react-native";
import { EMPTY_AI_SEARCH_FILTERS, type AiSearchFilters } from "@repo/utils";

import { useAIChat } from "./useAIChat";

const mockAskAva = jest.fn();
const mockFetchAvaListings = jest.fn();

const mockFetchByIds = jest.fn();
const mockLoadChats = jest.fn();
const mockSaveChats = jest.fn();

jest.mock("@/service/search/aiSearchService", () => ({
  askAva: (...args: unknown[]) => mockAskAva(...args),
  fetchAvaListings: (...args: unknown[]) => mockFetchAvaListings(...args),
  fetchAvaListingsByIds: (...args: unknown[]) => mockFetchByIds(...args),
}));
jest.mock("@/service/chat/avaHistoryStore", () => ({
  loadAvaChats: (...args: unknown[]) => mockLoadChats(...args),
  saveAvaChats: (...args: unknown[]) => mockSaveChats(...args),
}));

const MALABON: AiSearchFilters = { ...EMPTY_AI_SEARCH_FILTERS, cities: ["Malabon"] };
const LISTING = { id: "apt-1", name: "Sunny Studio" };
const FOUND = {
  card: LISTING,
  candidate: {
    id: "apt-1",
    monthlyRent: 9000,
    bedrooms: 1,
    amenities: [],
    latitude: 14.66,
    longitude: 120.95,
    city: "Malabon",
  },
};

const answer = (overrides: Record<string, unknown>) => ({
  source: "gemini",
  reply: null,
  quickReplies: [],
  noResultsReply: null,
  noResultsQuickReplies: [],
  filters: EMPTY_AI_SEARCH_FILTERS,
  landmark: null,
  wantsMore: false,
  ...overrides,
});

describe("useAIChat", () => {
  beforeEach(() => {
    mockAskAva.mockReset();
    mockFetchAvaListings.mockReset();
    mockFetchByIds.mockReset();
    mockLoadChats.mockReset().mockResolvedValue([]);
    mockSaveChats.mockReset().mockResolvedValue(undefined);
  });

  it("shows Ava's reply with real listings", async () => {
    mockAskAva.mockResolvedValue(answer({
      source: "gemini",
      reply: "Hinahanap ko po ang studio sa Malabon.",
      quickReplies: ["Hanggang 10k"],
      filters: MALABON,
    }));
    mockFetchAvaListings.mockResolvedValue([FOUND]);

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("studio sa Malabon"));

    expect(mockAskAva).toHaveBeenCalledWith([expect.objectContaining({ role: "user", text: "studio sa Malabon" })]);
    expect(mockFetchAvaListings).toHaveBeenCalledWith(MALABON, 5, [], { light: undefined, ids: undefined });
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
    await act(() => result.current.sendMessage("I need a place to rent"));
    await act(() => result.current.sendMessage("Malabon"));

    expect(mockAskAva).toHaveBeenLastCalledWith([
      { role: "user", text: "I need a place to rent" },
      { role: "assistant", text: "Saan po?" },
      { role: "user", text: "Malabon" },
    ].map((turn) => expect.objectContaining(turn)));
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
    mockFetchAvaListings.mockResolvedValue([FOUND]);

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
    mockFetchAvaListings.mockResolvedValue([]);

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("murang studio na pet friendly"));

    expect(result.current.messages[1]).toMatchObject({
      text: "Wala pa pong pet-friendly na studio. Subukan natin sa ibang lugar?",
      quickReplies: ["Ibang lugar", "Taasan ang budget"],
    });
  });

  it("says when no listing matches", async () => {
    mockAskAva.mockResolvedValue(answer({ source: "fallback", reply: null, quickReplies: [], filters: MALABON }));
    mockFetchAvaListings.mockResolvedValue([]);

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

  it("remembers the search and asks for the next page with 'show me more'", async () => {
    mockAskAva.mockResolvedValue(answer({ reply: "Here you go.", filters: MALABON }));
    mockFetchAvaListings.mockResolvedValue([FOUND]);

    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("apartments in Malabon"));
    expect(result.current.messages[1].shownIds).toEqual(["apt-1"]);

    mockAskAva.mockResolvedValue(answer({ reply: "More!", filters: EMPTY_AI_SEARCH_FILTERS, wantsMore: true }));
    mockFetchAvaListings.mockResolvedValue([]);
    await act(() => result.current.sendMessage("Show me more."));

    expect(mockFetchAvaListings).toHaveBeenLastCalledWith(MALABON, 5, ["apt-1"], { light: undefined, ids: undefined });
    expect(result.current.messages[3].text).toMatch(/everything I have/);
  });

  it("ignores blank messages", async () => {
    const { result } = renderHook(() => useAIChat());
    await act(() => result.current.sendMessage("   "));

    expect(mockAskAva).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  describe("history", () => {
    it("saves each conversation per account and re-reads its listings when reopened", async () => {
      mockAskAva.mockResolvedValue(answer({ reply: "Here you go.", filters: MALABON }));
      mockFetchAvaListings.mockResolvedValue([FOUND]);

      const { result } = renderHook(() => useAIChat("auth-1"));
      await act(async () => {});
      await act(() => result.current.sendMessage("apartments in Malabon"));

      expect(result.current.chats).toHaveLength(1);
      expect(result.current.chats[0].title).toBe("apartments in Malabon");
      expect(result.current.chats[0].messages[1].listingIds).toEqual(["apt-1"]);
      expect(mockSaveChats).toHaveBeenLastCalledWith("auth-1", result.current.chats);

      const chatId = result.current.chats[0].id;
      act(() => result.current.resetChat());
      expect(result.current.messages).toEqual([]);

      mockFetchByIds.mockResolvedValue(new Map([["apt-1", { id: "apt-1", name: "Fresh Name" }]]));
      await act(() => result.current.openChat(chatId));
      expect(result.current.messages[1].listings).toEqual([{ id: "apt-1", name: "Fresh Name" }]);
    });

    it("drops a listing that is no longer visible and can delete a chat", async () => {
      mockAskAva.mockResolvedValue(answer({ reply: "Here you go.", filters: MALABON }));
      mockFetchAvaListings.mockResolvedValue([FOUND]);

      const { result } = renderHook(() => useAIChat("auth-1"));
      await act(async () => {});
      await act(() => result.current.sendMessage("apartments in Malabon"));
      const chatId = result.current.chats[0].id;
      act(() => result.current.resetChat());

      mockFetchByIds.mockResolvedValue(new Map());
      await act(() => result.current.openChat(chatId));
      expect(result.current.messages[1].listings).toEqual([]);

      act(() => result.current.deleteChat(chatId));
      expect(result.current.chats).toEqual([]);
      expect(result.current.messages).toEqual([]);
    });

    it("never overwrites older chats when a reply lands before the history has loaded", async () => {
      let resolveLoad: (chats: unknown[]) => void = () => {};
      mockLoadChats.mockReturnValue(new Promise((resolve) => { resolveLoad = resolve; }));
      mockAskAva.mockResolvedValue(answer({ reply: "Here you go.", filters: MALABON }));
      mockFetchAvaListings.mockResolvedValue([FOUND]);
      const older = { id: "old-chat", title: "Older", updatedAt: 1, messages: [{ id: "m", role: "user", text: "hi" }] };

      const { result } = renderHook(() => useAIChat("auth-1"));
      await act(() => result.current.sendMessage("apartments in Malabon"));
      expect(mockSaveChats).not.toHaveBeenCalled();

      await act(async () => { resolveLoad([older]); });
      const saved = mockSaveChats.mock.calls.at(-1)?.[1] as { id: string }[];
      expect(saved.map((chat) => chat.id)).toContain("old-chat");
      expect(saved).toHaveLength(2);
    });

    it("does not save anything without an account", async () => {
      mockAskAva.mockResolvedValue(answer({ reply: "Here you go.", filters: MALABON }));
      mockFetchAvaListings.mockResolvedValue([FOUND]);

      const { result } = renderHook(() => useAIChat());
      await act(() => result.current.sendMessage("apartments in Malabon"));

      expect(mockSaveChats).not.toHaveBeenCalled();
      expect(result.current.chats).toEqual([]);
    });
  });
});
