import type { Href } from 'expo-router';

// Short step names for the add-apartment progress bar. Same labels as the web
// create-listing stepper (`apps/web/app/landlord/properties/create/page.tsx`).
export const ADD_APARTMENT_STEP_LABELS = ['Photos', 'Info', 'Pricing', 'Details', 'Preview'];

export const ADD_APARTMENT_TOTAL_STEPS = ADD_APARTMENT_STEP_LABELS.length;

const BASE = '/landlord/manage-apartment/add-apartment';

/** Route of each step, for jumping back from the progress bar. */
export const ADD_APARTMENT_STEP_HREFS: Href[] = [
  BASE,
  `${BASE}/second-step`,
  `${BASE}/third-step`,
  `${BASE}/fourth-step`,
  `${BASE}/fifth-step`,
];
