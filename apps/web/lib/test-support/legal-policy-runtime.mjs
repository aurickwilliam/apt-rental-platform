import * as registrationPolicies from "../registration-policies.ts";
import { compile } from "./hook-runtime.mjs";

const dependencies = { "@/lib/registration-policies": registrationPolicies };
export const terms = compile("app/(main)/tos/data/tos-sections.ts", dependencies);
export const privacy = compile("app/(main)/pap/data/pap-sections.ts", dependencies);
