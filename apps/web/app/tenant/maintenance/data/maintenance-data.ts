// apps/web/app/(main)/tenant/maintenance/data/maintenance-data.ts
 
export type Category = { id: string; label: string };
 
export const FORM_LIMITS = {
  titleMinLength: 5,
  descriptionMinLength: 10,
  maxFiles: 5,
  maxFileSizeMB: 10,
} as const;

export const CATEGORIES: Category[] = [
  { id: "plumbing", label: "Plumbing & Water Fixtures" },
  { id: "appliances", label: "Appliances" },
  { id: "hvac", label: "HVAC (Climate Control)" },
  { id: "electrical", label: "Electrical & Lighting" },
  { id: "wear-and-tear", label: "General Wear and Tear" },
  { id: "pest-control", label: "Pest Control" },
  { id: "structural", label: "Structural Issues" },
  { id: "safety-security", label: "Safety & Security" },
];
 

 