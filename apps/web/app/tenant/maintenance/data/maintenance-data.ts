// apps/web/app/(main)/tenant/maintenance/data/maintenance-data.ts
 
export type Category = { id: string; label: string };
 
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
 

 