import { renderHook } from "@testing-library/react-native";
import { STATUS_COLORS } from "@repo/constants";

import { statusChipSurface, useStatusChipStyles } from "./useStatusChipStyles";
import { usePaymentStatusStyles } from "./payments/usePaymentStatusStyles";
import { useMaintenanceRequestStatusStyles } from "./maintenance-requests/useMaintenaceRequestStatusStyles";
import { useVisitRequestStatusStyles } from "./visitRequests/useVisitRequestStatusStyles";

let mockIsDark = false;
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ isDark: mockIsDark }),
}));

afterEach(() => {
  mockIsDark = false;
});

it("uses the specified semantic backgrounds, foregrounds and 1px borders in both themes", () => {
  const { result, rerender } = renderHook(useStatusChipStyles);
  expect(result.current).toEqual(STATUS_COLORS.light);
  expect(statusChipSurface(result.current.warning)).toEqual({
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
    borderWidth: 1,
  });
  expect(result.current.success.textColor).toBe("#166534");
  expect(result.current.danger.textColor).toBe("#991B1B");
  expect(result.current.neutral.textColor).toBe("#334155");

  mockIsDark = true;
  rerender(undefined);
  expect(result.current).toEqual(STATUS_COLORS.dark);
  expect(result.current.success.textColor).toBe("#BBF7D0");
  expect(result.current.warning.textColor).toBe("#FDE68A");
  expect(result.current.danger.textColor).toBe("#FECACA");
  expect(result.current.neutral.textColor).toBe("#E2E8F0");
});

it("maps payment, maintenance and visit statuses to the same semantic palette", () => {
  const payments = renderHook(usePaymentStatusStyles);
  const maintenance = renderHook(useMaintenanceRequestStatusStyles);
  const visits = renderHook(useVisitRequestStatusStyles);

  expect(payments.result.current.Paid).toBe(STATUS_COLORS.light.success);
  expect(payments.result.current.Pending).toBe(STATUS_COLORS.light.warning);
  expect(payments.result.current.Unpaid).toBe(STATUS_COLORS.light.danger);
  expect(maintenance.result.current["In Progress"]).toBe(STATUS_COLORS.light.warning);
  expect(maintenance.result.current.Cancelled).toBe(STATUS_COLORS.light.danger);
  expect(visits.result.current.getStatusStyle("approved").textColor).toBe("#166534");
  expect(visits.result.current.getStatusStyle("cancelled").textColor).toBe("#991B1B");
});
