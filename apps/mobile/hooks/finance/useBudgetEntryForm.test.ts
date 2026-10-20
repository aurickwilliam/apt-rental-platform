import { act, renderHook } from "@testing-library/react-native";
import {
  useBudgetEntryForm,
  type BudgetEntryFormOptions,
} from "./useBudgetEntryForm";

jest.mock("@/service/finance/financeService", () => ({
  financeErrorMessage: () => "Save failed. Try again.",
}));

const options = (): BudgetEntryFormOptions => ({
  properties: [{ id: "apt", name: "Villa" }],
  apartmentId: "apt",
  month: "2026-10",
  initial: {
    id: "budget",
    apartment_id: "apt",
    month: "2026-10",
    category: "insurance",
    kind: "reserve",
    amount: 500,
    target_amount: 12000,
    months_remaining: 12,
  },
  onClose: jest.fn(),
  onSave: jest.fn().mockResolvedValue(undefined),
});

describe("budget entry draft lifecycle", () => {
  test("a refreshed budget and suggestion do not overwrite an in-progress draft", () => {
    const props = options();
    const { result, rerender } = renderHook(useBudgetEntryForm, {
      initialProps: props,
    });
    act(() => {
      result.current.setAmount("800");
      result.current.applyGoal({ target: "18000", months: "18" });
    });
    rerender({
      ...props,
      initial: { ...props.initial!, amount: 700 },
      suggestedAmount: 900,
    });
    expect(result.current.amount).toBe("800");
    expect(result.current.target).toBe("18000");
    expect(result.current.months).toBe("18");
  });

  test("applying a goal only fills the draft; a failed save retains it for retry", async () => {
    const props = options();
    const onSave = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(undefined);
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { result } = renderHook(() =>
        useBudgetEntryForm({ ...props, onSave }),
      );
      act(() => {
        result.current.applyGoal({ target: "24000", months: "12" }, 2000);
      });
      expect(onSave).not.toHaveBeenCalled();
      expect(result.current.amount).toBe("2000");
      expect(result.current.goalSheetOpen).toBe(false);
      await act(async () => {
        await result.current.handleSave();
      });
      expect(result.current.error).toBe("Save failed. Try again.");
      expect(props.onClose).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.handleSave();
      });
      expect(onSave.mock.calls[0]).toEqual(onSave.mock.calls[1]);
      expect(onSave).toHaveBeenLastCalledWith(
        expect.objectContaining({
          amount: 2000,
          target_amount: 24000,
          months_remaining: 12,
        }),
      );
      expect(props.onClose).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });
});
