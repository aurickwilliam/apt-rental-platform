import { finishProfileRoute, readFinishProfileParams } from "./finishProfileRoute";

describe("finishProfileRoute", () => {
  it("points at the finish-profile screen and drops unset params", () => {
    expect(finishProfileRoute({ email: "a@example.test", userSide: undefined, firstName: "A" })).toEqual({
      pathname: "/(auth)/finish-profile",
      params: { email: "a@example.test", firstName: "A" },
    });
  });

  it("marks a missing profile with the string flag the screen reads", () => {
    expect(finishProfileRoute({ email: "a@example.test", profileMissing: true }).params).toEqual({
      email: "a@example.test",
      profileMissing: "1",
    });
    expect(finishProfileRoute({ email: "a@example.test", profileMissing: false }).params).toEqual({
      email: "a@example.test",
    });
  });
});

describe("readFinishProfileParams", () => {
  it("collapses array params and defaults missing text to empty", () => {
    expect(readFinishProfileParams({ email: ["a@example.test", "b@example.test"] })).toMatchObject({
      email: "a@example.test",
      firstName: "",
      lastName: "",
      isProfileMissing: false,
    });
  });

  it("prefers the requested role, then the suggestion, then tenant", () => {
    expect(readFinishProfileParams({ userSide: "landlord", suggestedRole: "tenant" }).initialRole).toBe("landlord");
    expect(readFinishProfileParams({ suggestedRole: "landlord" }).initialRole).toBe("landlord");
    expect(readFinishProfileParams({}).initialRole).toBe("tenant");
  });

  it("keeps an invalid requested role visible so submit can reject it", () => {
    const params = readFinishProfileParams({ userSide: "admin", suggestedRole: "landlord" });
    expect(params.requestedRole).toBe("admin");
    expect(params.initialRole).toBe("landlord");
  });

  it("reads the profile-missing flag", () => {
    expect(readFinishProfileParams({ profileMissing: "1" }).isProfileMissing).toBe(true);
  });
});
