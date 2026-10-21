import { act, renderHook } from "@testing-library/react-native";
import {
  useExpenseEntryForm,
  type ExpenseEntryFormOptions,
} from "./useExpenseEntryForm";

const mockRandomUUID = jest.fn(() => "draft-id");
jest.mock("expo-crypto", () => ({ randomUUID: () => mockRandomUUID() }));
jest.mock("@/service/finance/financeService", () => ({
  financeErrorMessage: () => "Save failed. Try again.",
}));

const options = (): ExpenseEntryFormOptions => ({
  isOpen: true,
  properties: [{ id: "apt", name: "Villa" }],
  apartmentId: "apt",
  month: "2026-10",
  onClose: jest.fn(),
  onSave: jest.fn().mockResolvedValue(undefined),
});

describe("expense entry draft lifecycle", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
    mockRandomUUID.mockReset().mockReturnValue("draft-id");
  });
  afterEach(() => jest.useRealTimers());

  test("a report refresh does not overwrite an open draft", () => {
    const props = options();
    const { result, rerender } = renderHook(useExpenseEntryForm, {
      initialProps: props,
    });
    act(() => {
      result.current.setAmount("1250.25");
      result.current.setDescription("Sink repair");
    });
    rerender({
      ...props,
      properties: [{ id: "apt", name: "Renamed villa" }],
      month: "2026-09",
    });
    expect(result.current.amount).toBe("1250.25");
    expect(result.current.description).toBe("Sink repair");
    expect(result.current.date).toBe("2026-10-17");
    expect(mockRandomUUID).toHaveBeenCalledTimes(1);
  });

  test("failed insert retries keep the same UUID and draft", async () => {
    const props = options();
    const onSave = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(undefined);
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { result } = renderHook(() =>
        useExpenseEntryForm({ ...props, onSave }),
      );
      act(() => {
        result.current.setAmount("1250.25");
        result.current.setDescription("  Sink repair  ");
      });
      await act(async () => {
        await result.current.handleSave();
      });
      expect(result.current.error).toBe("Save failed. Try again.");
      expect(result.current.description).toBe("  Sink repair  ");
      expect(props.onClose).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.handleSave();
      });
      expect(onSave).toHaveBeenCalledTimes(2);
      expect(onSave.mock.calls[0]).toEqual(onSave.mock.calls[1]);
      expect(onSave.mock.calls[1][0]).toMatchObject({
        id: "draft-id",
        description: "Sink repair",
        amount: 1250.25,
      });
      expect(props.onClose).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });

  test("each reopening starts a fresh UUID and clears validation and delete state", async () => {
    mockRandomUUID
      .mockReturnValueOnce("first-id")
      .mockReturnValueOnce("next-id");
    const props = options();
    const { result, rerender } = renderHook(useExpenseEntryForm, {
      initialProps: props,
    });
    act(() => {
      result.current.setConfirmDelete(true);
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(result.current.submitted).toBe(true);
    rerender({ ...props, isOpen: false });
    rerender({ ...props, month: "2026-09" });
    expect(result.current.submitted).toBe(false);
    expect(result.current.confirmDelete).toBe(false);
    expect(result.current.date).toBe("2026-09-01");
    act(() => {
      result.current.setAmount("500");
      result.current.setDescription("Repair");
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(props.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: "next-id" }),
      false,
    );
  });
});
