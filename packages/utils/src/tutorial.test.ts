import { getTutorialSteps, hasFinishedTutorial, shouldAutoStartTutorial } from "./tutorial";

const ids = (steps: { id: string }[]) => steps.map((step) => step.id);

describe("getTutorialSteps", () => {
  it("shows a verified tenant every core step but maintenance without a tenancy", () => {
    const steps = getTutorialSteps("tenant", { platform: "web", accountStatus: "verified", hasActiveTenancy: false });
    expect(ids(steps)).toEqual(["tenant-rentals", "tenant-explore", "tenant-applications", "tenant-messages"]);
  });

  it("adds maintenance when the tenant has a running tenancy", () => {
    const steps = getTutorialSteps("tenant", { platform: "web", accountStatus: "verified", hasActiveTenancy: true });
    expect(ids(steps)).toContain("tenant-maintenance");
  });

  it("limits an unverified tenant to browsing and their rental", () => {
    const steps = getTutorialSteps("tenant", { platform: "mobile", accountStatus: "unverified", hasActiveTenancy: false });
    expect(ids(steps)).toEqual(["tenant-rentals", "tenant-explore"]);
  });

  it("shows a verified landlord every landlord step", () => {
    const steps = getTutorialSteps("landlord", { platform: "web", accountStatus: "verified", hasActiveTenancy: false });
    expect(ids(steps)).toEqual([
      "landlord-dashboard",
      "landlord-properties",
      "landlord-applications",
      "landlord-messages",
      "landlord-rental-management",
    ]);
  });

  it("gives an unverified landlord no steps without a tenancy", () => {
    for (const accountStatus of ["unverified", "pending", "rejected", null]) {
      expect(getTutorialSteps("landlord", { platform: "mobile", accountStatus, hasActiveTenancy: false })).toEqual([]);
    }
  });

  it("gives an unverified landlord only the tenancy step when a tenancy is running", () => {
    const steps = getTutorialSteps("landlord", { platform: "web", accountStatus: "pending", hasActiveTenancy: true });
    expect(ids(steps)).toEqual(["landlord-rental-management"]);
  });

  it("uses the platform's own target key and falls back to none", () => {
    const web = getTutorialSteps("landlord", { platform: "web", accountStatus: "verified", hasActiveTenancy: false });
    const mobile = getTutorialSteps("landlord", { platform: "mobile", accountStatus: "verified", hasActiveTenancy: false });
    expect(web.find((s) => s.id === "landlord-properties")?.targetKey).toBe("nav-properties");
    expect(mobile.find((s) => s.id === "landlord-properties")?.targetKey).toBe("tab-units");
    expect(mobile.find((s) => s.id === "landlord-applications")?.targetKey).toBeNull();
  });
});

describe("hasFinishedTutorial", () => {
  it("treats completed and skipped as finished and a missing row as unseen", () => {
    expect(hasFinishedTutorial(null)).toBe(false);
    expect(hasFinishedTutorial({ completed_at: null, skipped_at: null })).toBe(false);
    expect(hasFinishedTutorial({ completed_at: "2026-11-06T00:00:00Z", skipped_at: null })).toBe(true);
    expect(hasFinishedTutorial({ completed_at: null, skipped_at: "2026-11-06T00:00:00Z" })).toBe(true);
  });
});

describe("shouldAutoStartTutorial", () => {
  const base = {
    portal: "tenant" as const,
    roles: ["tenant"],
    progressLoaded: true,
    progress: null,
    profileComplete: true,
    suspended: false,
    stepCount: 2,
  };

  it("starts for a new tenant with a complete profile", () => {
    expect(shouldAutoStartTutorial(base)).toBe(true);
  });

  it("does not start while the progress read is pending or failed", () => {
    expect(shouldAutoStartTutorial({ ...base, progressLoaded: false })).toBe(false);
  });

  it("does not start after completion or skip", () => {
    expect(shouldAutoStartTutorial({ ...base, progress: { completed_at: "x", skipped_at: null } })).toBe(false);
    expect(shouldAutoStartTutorial({ ...base, progress: { completed_at: null, skipped_at: "x" } })).toBe(false);
  });

  it("does not start for an incomplete profile, a suspended account or a portal not held", () => {
    expect(shouldAutoStartTutorial({ ...base, profileComplete: false })).toBe(false);
    expect(shouldAutoStartTutorial({ ...base, suspended: true })).toBe(false);
    expect(shouldAutoStartTutorial({ ...base, roles: ["landlord"] })).toBe(false);
    expect(shouldAutoStartTutorial({ ...base, roles: ["admin"] })).toBe(false);
  });

  it("does not start when there is nothing to show", () => {
    expect(shouldAutoStartTutorial({ ...base, stepCount: 0 })).toBe(false);
  });
});
