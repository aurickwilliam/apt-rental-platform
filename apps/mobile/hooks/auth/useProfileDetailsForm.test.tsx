import { act, renderHook } from "@testing-library/react-native";

import { useProfileDetailsForm } from "./useProfileDetailsForm";

function setup(initial: { firstName?: string; lastName?: string } = {}) {
  const scrollTo = jest.fn();
  const scrollRef = { current: { scrollTo } } as never;
  const hook = renderHook(() => useProfileDetailsForm({ ...initial, scrollRef }));
  return { ...hook, scrollTo };
}

type Form = ReturnType<typeof setup>["result"]["current"];

function fillValid(form: () => Form) {
  act(() => {
    form().setField("firstName", "Ana");
    form().setField("lastName", "Lim");
    form().setField("gender", "Female");
    form().setField("birthDate", "1990-01-05");
    form().setField("streetAddress", "1 Main St");
    form().setProvince("Metro Manila");
  });
  act(() => form().setCity("Caloocan"));
  act(() => {
    form().setField("barangay", "Barangay 1");
    form().mobile.onChange("09171234567");
    form().postal.onChange("1400");
  });
}

describe("useProfileDetailsForm", () => {
  it("starts with the given names and everything else empty", () => {
    const { result } = setup({ firstName: "Ana", lastName: "Lim" });

    expect(result.current.values).toMatchObject({ firstName: "Ana", lastName: "Lim", gender: "", city: "" });
  });

  it("clears the levels under a changed province or city", () => {
    const { result } = setup();
    fillValid(() => result.current);

    act(() => result.current.setCity("Quezon City"));
    expect(result.current.values.barangay).toBe("");

    act(() => result.current.setProvince("Rizal"));
    expect(result.current.values).toMatchObject({ province: "Rizal", city: "", barangay: "" });
    expect(result.current.barangayOptions).toEqual([]);
  });

  it("offers cities only once a province is picked", () => {
    const { result } = setup();
    expect(result.current.cityOptions).toEqual([]);

    act(() => result.current.setProvince("Metro Manila"));
    expect(result.current.cityOptions).toContain("Caloocan");
  });

  it("offers every municipality of a province, not a short list", () => {
    const { result } = setup();

    act(() => result.current.setProvince("Bulacan"));

    expect(result.current.cityOptions).toEqual(expect.arrayContaining(["Baliwag", "Marilao", "Malolos"]));
    expect(result.current.cityOptions.length).toBeGreaterThanOrEqual(24);
  });

  it("offers the barangays of the picked province's city when several provinces share the name", () => {
    const { result } = setup();

    act(() => result.current.setProvince("Pampanga"));
    act(() => result.current.setCity("San Fernando"));
    expect(result.current.barangayOptions).toContain("Alasas");
    expect(result.current.barangayOptions).not.toContain("Abut");

    act(() => result.current.setProvince("La Union"));
    act(() => result.current.setCity("San Fernando"));
    expect(result.current.barangayOptions).toContain("Abut");
    expect(result.current.barangayOptions).not.toContain("Alasas");
  });

  it("shows required errors only after a submit attempt", () => {
    const { result } = setup();
    expect(result.current.getError("firstName")).toBeUndefined();

    act(() => { result.current.validate(); });

    expect(result.current.getError("firstName")).toBe("This field is required");
    expect(result.current.getError("middleName")).toBeUndefined();
  });

  it("checks the birth date as soon as there is one", () => {
    const { result } = setup();

    act(() => result.current.setField("birthDate", "2999-01-01"));

    expect(result.current.getError("birthDate")).toBe("Birth date cannot be in the future.");
  });

  it("scrolls to the first invalid field, in screen order", () => {
    const { result, scrollTo } = setup({ firstName: "Ana", lastName: "Lim" });
    act(() => {
      result.current.trackPosition("gender").onLayout({ nativeEvent: { layout: { y: 300 } } } as never);
      result.current.trackPosition("barangay").onLayout({ nativeEvent: { layout: { y: 900 } } } as never);
    });

    let valid = true;
    act(() => { valid = result.current.validate(); });

    expect(valid).toBe(false);
    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: 284, animated: true });
  });

  it("puts the screen's own invalid fields after the shared ones", () => {
    const { result, scrollTo } = setup();
    fillValid(() => result.current);
    act(() => {
      result.current.trackPosition("password").onLayout({ nativeEvent: { layout: { y: 1200 } } } as never);
    });

    let valid = true;
    act(() => { valid = result.current.validate(["password"]); });

    expect(valid).toBe(false);
    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: 1184, animated: true });
  });

  it("passes a fully filled form", () => {
    const { result, scrollTo } = setup();
    fillValid(() => result.current);

    let valid = false;
    act(() => { valid = result.current.validate(); });

    expect(valid).toBe(true);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("rejects an invalid mobile number and postal code", () => {
    const { result } = setup();
    fillValid(() => result.current);
    act(() => {
      result.current.mobile.onChange("123");
      result.current.postal.onChange("12");
    });

    let valid = true;
    act(() => { valid = result.current.validate(); });

    expect(valid).toBe(false);
    expect(result.current.mobile.errorMessage).toBeTruthy();
    expect(result.current.postal.error).toBeTruthy();
  });

  it("builds the users row with blanks as null and the formatted mobile number", () => {
    const { result } = setup();
    fillValid(() => result.current);
    act(() => result.current.mobile.onChange("+639171234567"));

    expect(result.current.toRow()).toEqual({
      first_name: "Ana",
      last_name: "Lim",
      middle_name: null,
      suffix: null,
      gender: "Female",
      birth_date: "1990-01-05",
      mobile_number: "09171234567",
      province: "Metro Manila",
      city: "Caloocan",
      barangay: "Barangay 1",
      postal_code: 1400,
      street_address: "1 Main St",
    });
  });
});
