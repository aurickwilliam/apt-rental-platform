import { act, renderHook } from "@testing-library/react-native";

import { useProfileDetailsForm } from "./useProfileDetailsForm";

async function setup(initial: { firstName?: string; lastName?: string } = {}) {
  const scrollTo = jest.fn();
  const scrollRef = { current: { scrollTo } } as never;
  const hook = await renderHook(() => useProfileDetailsForm({ ...initial, scrollRef }));
  return { ...hook, scrollTo };
}

type Form = ReturnType<typeof setup>["result"]["current"];

async function fillValid(form: () => Form) {
  await act(() => {
    form().setField("firstName", "Ana");
    form().setField("lastName", "Lim");
    form().setField("gender", "Female");
    form().setField("birthDate", "1990-01-05");
    form().setField("streetAddress", "1 Main St");
    form().setProvince("Metro Manila");
  });
  await act(() => form().setCity("Caloocan"));
  await act(() => {
    form().setField("barangay", "Barangay 1");
    form().mobile.onChange("09171234567");
    form().postal.onChange("1400");
  });
}

describe("useProfileDetailsForm", () => {
  it("starts with the given names and everything else empty", async () => {
    const { result } = await setup({ firstName: "Ana", lastName: "Lim" });

    expect(result.current.values).toMatchObject({ firstName: "Ana", lastName: "Lim", gender: "", city: "" });
  });

  it("clears the levels under a changed province or city", async () => {
    const { result } = await setup();
    await fillValid(() => result.current);

    await act(() => result.current.setCity("Quezon City"));
    expect(result.current.values.barangay).toBe("");

    await act(() => result.current.setProvince("Rizal"));
    expect(result.current.values).toMatchObject({ province: "Rizal", city: "", barangay: "" });
    expect(result.current.barangayOptions).toEqual([]);
  });

  it("offers cities only once a province is picked", async () => {
    const { result } = await setup();
    expect(result.current.cityOptions).toEqual([]);

    await act(() => result.current.setProvince("Metro Manila"));
    expect(result.current.cityOptions).toContain("Caloocan");
  });

  it("offers every municipality of a province, not a short list", async () => {
    const { result } = await setup();

    await act(() => result.current.setProvince("Bulacan"));

    expect(result.current.cityOptions).toEqual(expect.arrayContaining(["Baliwag", "Marilao", "Malolos"]));
    expect(result.current.cityOptions.length).toBeGreaterThanOrEqual(24);
  });

  it("offers the barangays of the picked province's city when several provinces share the name", async () => {
    const { result } = await setup();

    await act(() => result.current.setProvince("Pampanga"));
    await act(() => result.current.setCity("San Fernando"));
    expect(result.current.barangayOptions).toContain("Alasas");
    expect(result.current.barangayOptions).not.toContain("Abut");

    await act(() => result.current.setProvince("La Union"));
    await act(() => result.current.setCity("San Fernando"));
    expect(result.current.barangayOptions).toContain("Abut");
    expect(result.current.barangayOptions).not.toContain("Alasas");
  });

  it("shows required errors only after a submit attempt", async () => {
    const { result } = await setup();
    expect(result.current.getError("firstName")).toBeUndefined();

    await act(() => { result.current.validate(); });

    expect(result.current.getError("firstName")).toBe("This field is required");
    expect(result.current.getError("middleName")).toBeUndefined();
  });

  it("checks the birth date as soon as there is one", async () => {
    const { result } = await setup();

    await act(() => result.current.setField("birthDate", "2999-01-01"));

    expect(result.current.getError("birthDate")).toBe("Birth date cannot be in the future.");
  });

  it("scrolls to the first invalid field, in screen order", async () => {
    const { result, scrollTo } = await setup({ firstName: "Ana", lastName: "Lim" });
    await act(() => {
      result.current.trackPosition("gender").onLayout({ nativeEvent: { layout: { y: 300 } } } as never);
      result.current.trackPosition("barangay").onLayout({ nativeEvent: { layout: { y: 900 } } } as never);
    });

    let valid = true;
    await act(() => { valid = result.current.validate(); });

    expect(valid).toBe(false);
    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: 284, animated: true });
  });

  it("puts the screen's own invalid fields after the shared ones", async () => {
    const { result, scrollTo } = await setup();
    await fillValid(() => result.current);
    await act(() => {
      result.current.trackPosition("password").onLayout({ nativeEvent: { layout: { y: 1200 } } } as never);
    });

    let valid = true;
    await act(() => { valid = result.current.validate(["password"]); });

    expect(valid).toBe(false);
    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: 1184, animated: true });
  });

  it("passes a fully filled form", async () => {
    const { result, scrollTo } = await setup();
    await fillValid(() => result.current);

    let valid = false;
    await act(() => { valid = result.current.validate(); });

    expect(valid).toBe(true);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("rejects an invalid mobile number and postal code", async () => {
    const { result } = await setup();
    await fillValid(() => result.current);
    await act(() => {
      result.current.mobile.onChange("123");
      result.current.postal.onChange("12");
    });

    let valid = true;
    await act(() => { valid = result.current.validate(); });

    expect(valid).toBe(false);
    expect(result.current.mobile.errorMessage).toBeTruthy();
    expect(result.current.postal.error).toBeTruthy();
  });

  it("warns, without blocking, about a well-formed ZIP we do not recognize for the city", async () => {
    const { result } = await setup();
    await fillValid(() => result.current);
    expect(result.current.postal.warning).toBeNull();

    await act(() => result.current.postal.onChange("1200"));
    expect(result.current.postal.warning).toBe("This ZIP isn't one we recognize for Caloocan. Double-check it.");

    let valid = false;
    await act(() => { valid = result.current.validate(); });
    expect(valid).toBe(true);
    expect(result.current.postal.error).toBeNull();
  });

  it("spaces the mobile number as it is typed and refuses a +63 number", async () => {
    const { result } = await setup();
    await act(() => result.current.mobile.onChange("09171234567"));
    expect(result.current.mobile.value).toBe("0917 123 4567");
    expect(result.current.mobile.errorMessage).toBeNull();

    await act(() => result.current.mobile.onChange("+639171234567"));
    expect(result.current.mobile.value).toBe("6391 712 3456");
    expect(result.current.mobile.errorMessage).toBe("Enter a valid mobile number, like 0917 123 4567.");
  });

  it("builds the users row with blanks as null and the formatted mobile number", async () => {
    const { result } = await setup();
    await fillValid(() => result.current);
    await act(() => result.current.mobile.onChange("0917 123 4567"));

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
