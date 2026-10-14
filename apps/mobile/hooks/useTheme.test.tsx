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
    it("derives the palette from Uniwind's resolved theme", () => {
      const { result, rerender } = renderHook(() => useColors());
      expect(result.current).toEqual({ colors: MOBILE_COLORS.light, isDark: false });

      resolveTo("dark");
      rerender({});
      expect(result.current).toEqual({ colors: MOBILE_COLORS.dark, isDark: true });
    });

    it("follows a device change while System is selected, ignoring the stored preference", () => {
      useThemeStore.getState().setThemeMode("system");
      const { result, rerender } = renderHook(() => useTheme());

      resolveTo("dark"); // OS switched to dark
      rerender({});
      expect(result.current.isDark).toBe(true);
    });

    it("never writes to the native appearance, however many consumers mount", () => {
      renderHook(() => {
        useColors();
        useColors();
        useTheme();
      });

      expect(setTheme).not.toHaveBeenCalled();
    });
  });

  describe("useThemePreference", () => {
    it("exposes the saved choice and updates it", () => {
      const { result } = renderHook(() => useThemePreference());
      expect(result.current.themeMode).toBe("system");

      act(() => {
        result.current.setThemeMode("dark");
      });
      expect(result.current.themeMode).toBe("dark");
    });
  });

  describe("useThemeSync", () => {
    it("applies System by default so the device appearance is followed", () => {
      const { result } = renderHook(() => useThemeSync());

      expect(result.current).toBe(true);
      expect(setTheme).toHaveBeenCalledTimes(1);
      expect(setTheme).toHaveBeenCalledWith("system");
    });

    it("waits for the saved choice before applying anything", () => {
      useThemeHydrationStore.setState({ hydrated: false });
      const { result } = renderHook(() => useThemeSync());

      expect(result.current).toBe(false);
      expect(setTheme).not.toHaveBeenCalled();

      act(() => {
        useThemeStore.setState({ themeMode: "dark" });
        useThemeHydrationStore.setState({ hydrated: true });
      });

      expect(result.current).toBe(true);
      expect(setTheme).toHaveBeenCalledTimes(1);
      expect(setTheme).toHaveBeenLastCalledWith("dark");
    });

    it("applies each change once, and returns to System from a forced mode", () => {
      renderHook(() => useThemeSync());
      setTheme.mockClear();

      act(() => {
        useThemeStore.getState().setThemeMode("light");
      });
      act(() => {
        useThemeStore.getState().setThemeMode("dark");
      });
      act(() => {
        useThemeStore.getState().setThemeMode("system");
      });

      expect(setTheme.mock.calls).toEqual([["light"], ["dark"], ["system"]]);
    });

    it("is the only appearance write even with many color consumers mounted", () => {
      renderHook(() => {
        useThemeSync();
        useColors();
        useColors();
        useTheme();
      });

      expect(setTheme).toHaveBeenCalledTimes(1);
    });
  });
});
