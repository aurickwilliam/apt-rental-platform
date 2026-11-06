// First-time tutorial rules shared by web and mobile: which steps a person
// sees, and whether the tour should start by itself. Rendering stays in each
// app. The database (`tutorial_progress`) only remembers whether a portal's
// tour was finished or skipped; it never decides access, so these helpers
// follow the same verification rules as the rest of the app and only decide
// what to explain.

import { canUseLandlordFeatures } from "./landlordAccess";

export type TutorialPortal = "tenant" | "landlord";
export type TutorialPlatform = "mobile" | "web";

export type TutorialStepId =
  | "tenant-rentals"
  | "tenant-explore"
  | "tenant-applications"
  | "tenant-messages"
  | "tenant-maintenance"
  | "landlord-dashboard"
  | "landlord-properties"
  | "landlord-applications"
  | "landlord-messages"
  | "landlord-rental-management";

/** What a step needs before it is worth showing. */
type TutorialRequirement = "always" | "verified" | "active-tenancy";

interface TutorialStepDefinition {
  id: TutorialStepId;
  portal: TutorialPortal;
  title: string;
  description: string;
  requires: TutorialRequirement;
  /**
   * Stable target keys. Web uses `data-tour="<key>"`; mobile registers the
   * same key from `TutorialTarget`. A platform without a key (or whose target
   * is missing at run time) shows the step as a plain card.
   */
  targets: Partial<Record<TutorialPlatform, string>>;
  /** Mobile tab to open while the step is shown, so the explanation has context. */
  mobileTab?: string;
}

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  description: string;
  targetKey: string | null;
  mobileTab: string | null;
}

export interface TutorialContext {
  platform: TutorialPlatform;
  /** `users.account_status` (`verified`, `pending`, `unverified`, `rejected`). */
  accountStatus: string | null | undefined;
  /** A running tenancy keeps the tenancy screens open for unverified accounts. */
  hasActiveTenancy: boolean;
}

export const TUTORIAL_TARGETS = {
  mobileTabRentals: "tab-rentals",
  mobileTabSearch: "tab-search",
  mobileTabChat: "tab-chat",
  mobileTabDashboard: "tab-dashboard",
  mobileTabUnits: "tab-units",
  mobileQuickApplications: "quick-applications",
  mobileQuickRepairs: "quick-repairs",
  mobileQuickTenantApplications: "quick-tenant-applications",
  mobileQuickPayments: "quick-payments",
  webNavBrowse: "nav-browse",
  webNavMyRental: "nav-my-rental",
  webNavMaintenance: "nav-maintenance",
  webNavMessages: "nav-messages",
  webNavDashboard: "nav-dashboard",
  webNavProperties: "nav-properties",
  webNavApplications: "nav-applications",
  webNavPayments: "nav-payments",
} as const;

const STEP_DEFINITIONS: readonly TutorialStepDefinition[] = [
  {
    id: "tenant-rentals",
    portal: "tenant",
    title: "Your rental",
    description:
      "See your lease, rent payments, payment history and maintenance requests in one place once you have a home on APT.",
    requires: "always",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileTabRentals,
      web: TUTORIAL_TARGETS.webNavMyRental,
    },
    mobileTab: "rentals",
  },
  {
    id: "tenant-explore",
    portal: "tenant",
    title: "Find an apartment",
    description:
      "Browse listings and narrow them by location, price, bedrooms and amenities, or use map search. Open a listing for photos, rental terms and the landlord.",
    requires: "always",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileTabSearch,
      web: TUTORIAL_TARGETS.webNavBrowse,
    },
    mobileTab: "search",
  },
  {
    id: "tenant-applications",
    portal: "tenant",
    title: "Apply or visit",
    description:
      "On a listing, apply to rent or request a visit. Track your applications and visit requests from your rental screen.",
    requires: "verified",
    targets: { mobile: TUTORIAL_TARGETS.mobileQuickApplications },
    mobileTab: "rentals",
  },
  {
    id: "tenant-messages",
    portal: "tenant",
    title: "Message landlords",
    description: "Ask a landlord a question about a listing or chat with your current landlord.",
    requires: "verified",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileTabChat,
      web: TUTORIAL_TARGETS.webNavMessages,
    },
    mobileTab: "chat",
  },
  {
    id: "tenant-maintenance",
    portal: "tenant",
    title: "Report a problem",
    description: "Send a maintenance request for your home and follow its progress here.",
    requires: "active-tenancy",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileQuickRepairs,
      web: TUTORIAL_TARGETS.webNavMaintenance,
    },
    mobileTab: "rentals",
  },
  {
    id: "landlord-dashboard",
    portal: "landlord",
    title: "Your dashboard",
    description: "Get an overview of your properties, rental activity and the numbers that matter.",
    requires: "verified",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileTabDashboard,
      web: TUTORIAL_TARGETS.webNavDashboard,
    },
    mobileTab: "dashboard",
  },
  {
    id: "landlord-properties",
    portal: "landlord",
    title: "Properties and listings",
    description:
      "View and manage your listings. Add a new one with its details, location, photos, amenities and rental terms, or edit an existing one.",
    requires: "verified",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileTabUnits,
      web: TUTORIAL_TARGETS.webNavProperties,
    },
    mobileTab: "units",
  },
  {
    id: "landlord-applications",
    portal: "landlord",
    title: "Review applications",
    description: "Look through tenant applications and approve or decline them.",
    requires: "verified",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileQuickTenantApplications,
      web: TUTORIAL_TARGETS.webNavApplications,
    },
    mobileTab: "units",
  },
  {
    id: "landlord-messages",
    portal: "landlord",
    title: "Message tenants",
    description: "Talk with prospective and current tenants.",
    requires: "verified",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileTabChat,
      web: TUTORIAL_TARGETS.webNavMessages,
    },
    mobileTab: "chat",
  },
  {
    id: "landlord-rental-management",
    portal: "landlord",
    title: "Payments and maintenance",
    description:
      "Confirm rent payments, handle maintenance requests and keep track of your tenants.",
    requires: "active-tenancy",
    targets: {
      mobile: TUTORIAL_TARGETS.mobileQuickPayments,
      web: TUTORIAL_TARGETS.webNavPayments,
    },
    mobileTab: "units",
  },
];

function isStepAvailable(
  step: TutorialStepDefinition,
  context: TutorialContext,
): boolean {
  if (step.requires === "always") return true;

  const verified = canUseLandlordFeatures(context.accountStatus);
  if (step.requires === "verified") return verified;

  // "active-tenancy": a running tenancy keeps its own screens open for anyone.
  // Without one, only a verified landlord still manages rentals.
  if (context.hasActiveTenancy) return true;
  return step.portal === "landlord" && verified;
}

/**
 * The steps this person can use today, in order. Landlords who are not yet
 * verified only see the tenancy steps (and only with a running tenancy), so
 * the tour never points at a blocked screen. An empty list means no tour.
 */
export function getTutorialSteps(
  portal: TutorialPortal,
  context: TutorialContext,
): TutorialStep[] {
  return STEP_DEFINITIONS.filter(
    (step) => step.portal === portal && isStepAvailable(step, context),
  ).map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    targetKey: step.targets[context.platform] ?? null,
    mobileTab: step.mobileTab ?? null,
  }));
}

export interface TutorialProgressRow {
  completed_at: string | null;
  skipped_at: string | null;
}

export function hasFinishedTutorial(
  row: TutorialProgressRow | null | undefined,
): boolean {
  return Boolean(row && (row.completed_at || row.skipped_at));
}

export interface AutoStartInput {
  portal: TutorialPortal;
  roles: readonly string[];
  /** `undefined` while the progress read is still loading or failed. */
  progressLoaded: boolean;
  progress: TutorialProgressRow | null;
  profileComplete: boolean;
  suspended: boolean;
  stepCount: number;
}

/**
 * The tour starts by itself only for a signed-in holder of the portal whose
 * profile is complete, with no saved progress, and at least one usable step.
 * A failed or pending read never starts it (fail closed).
 */
export function shouldAutoStartTutorial(input: AutoStartInput): boolean {
  if (!input.progressLoaded) return false;
  if (input.suspended || !input.profileComplete) return false;
  if (!input.roles.includes(input.portal)) return false;
  if (input.stepCount === 0) return false;
  return !hasFinishedTutorial(input.progress);
}
