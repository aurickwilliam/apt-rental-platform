import { act, renderHook } from "@testing-library/react-native";
import { Uniwind, useUniwind } from "uniwind";

import { MOBILE_COLORS } from "../constants/theme";

import { useThemeHydrationStore, useThemeStore } from "../stores/useThemeStore";
import { useColors, useTheme, useThemePreference, useThemeSync } from "./useTheme";

const setTheme = Uniwind.setTheme as jest.Mock;
const mockUseUniwind = useUniwind as jest.Mock;

function resolveTo(theme: "light" | "dark") {
  mockUseUniwind.mockReturnValue({ theme, hasAdaptiveThemes: true });
}

describe("theme hooks", () => {
  beforeEach(() => {
    setTheme.mockClear();
    resolveTo("light");
    useThemeStore.getState().reset();
    useThemeHydrationStore.setState({ hydrated: true });
  });

  describe("useColors / useTheme", () => {
    it("derives the palette from Uniwind's resolved theme", async () => {
      const { result, rerender } = await renderHook(() => useColors());
      expect(result.current).toEqual({ colors: MOBILE_COLORS.light, isDark: false });

      resolveTo("dark");
      await rerender({});
      expect(result.current).toEqual({ colors: MOBILE_COLORS.dark, isDark: true });
    });

    it("follows a device change while System is selected, ignoring the stored preference", async () => {
      useThemeStore.getState().setThemeMode("system");
      const { result, rerender } = await renderHook(() => useTheme());

      resolveTo("dark"); // OS switched to dark
      await rerender({});
      expect(result.current.isDark).toBe(true);
    });

    it("never writes to the native appearance, however many consumers mount", async () => {
      await renderHook(() => {
        useColors();
        useColors();
        useTheme();
      });

      expect(setTheme).not.toHaveBeenCalled();
    });
  });

  describe("useThemePreference", () => {
    it("exposes the saved choice and updates it", async () => {
      const { result } = await renderHook(() => useThemePreference());
      expect(result.current.themeMode).toBe("system");

      await act(() => {
        result.current.setThemeMode("dark");
      });
      expect(result.current.themeMode).toBe("dark");
    });
  });

  describe("useThemeSync", () => {
    it("applies System by default so the device appearance is followed", async () => {
      const { result } = await renderHook(() => useThemeSync());

      expect(result.current).toBe(true);
      expect(setTheme).toHaveBeenCalledTimes(1);
      expect(setTheme).toHaveBeenCalledWith("system");
    });

    it("waits for the saved choice before applying anything", async () => {
      useThemeHydrationStore.setState({ hydrated: false });
      const { result } = await renderHook(() => useThemeSync());

      expect(result.current).toBe(false);
      expect(setTheme).not.toHaveBeenCalled();

      await act(() => {
        useThemeStore.setState({ themeMode: "dark" });
        useThemeHydrationStore.setState({ hydrated: true });
      });

      expect(result.current).toBe(true);
      expect(setTheme).toHaveBeenCalledTimes(1);
      expect(setTheme).toHaveBeenLastCalledWith("dark");
    });

    it("applies each change once, and returns to System from a forced mode", async () => {
      await renderHook(() => useThemeSync());
      setTheme.mockClear();

      await act(() => {
        useThemeStore.getState().setThemeMode("light");
      });
      await act(() => {
        useThemeStore.getState().setThemeMode("dark");
      });
      await act(() => {
        useThemeStore.getState().setThemeMode("system");
      });

      expect(setTheme.mock.calls).toEqual([["light"], ["dark"], ["system"]]);
    });

    it("is the only appearance write even with many color consumers mounted", async () => {
      await renderHook(() => {
        useThemeSync();
        useColors();
        useColors();
        useTheme();
      });

      expect(setTheme).toHaveBeenCalledTimes(1);
    });
  });
});
