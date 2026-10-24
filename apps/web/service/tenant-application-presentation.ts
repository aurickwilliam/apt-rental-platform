import type { PresentationSeed } from "./presentation-seed";
import type { TenantApplication } from "./tenantApplicationsService";
import type { VisitRequestResult } from "./visitRequestsService";
import type { ApplicantPersonalInfo } from "@/lib/application-profile";

export interface TenantApplicationPresentation {
  application: PresentationSeed<TenantApplication[]>;
  visits: PresentationSeed<VisitRequestResult>;
  personalInfo: PresentationSeed<ApplicantPersonalInfo>;
}
