"use client";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled" | "closed";

export type StoredApplication = {
  id: string;
  apartmentId: string;
  apartmentName: string | null;
  apartmentCover: string | null;
  apartmentAddress: string | null;
  monthlyRent: number | null;
  status: ApplicationStatus;
  createdAt: string;
  data: {
    fullName: string;
    email: string;
    contactNumber: string;
    currentAddress: string;
    dateOfBirth: string;
    employmentType: string;
    occupation: string;
    companyName: string;
    monthlyIncomeText: string;
    prevLandlordName: string;
    prevLandlordContact: string;
    moveInDate: string;
    noOccupants: string;
    hasPets: string | null;
    isSmoker: string | null;
    needParking: string | null;
    additionalNotes: string;
    govIdName: string | null;
    proofOfBillingName: string | null;
    proofOfIncomeName: string | null;
    nbiName: string | null;
  };
};

const STORAGE_KEY = "apt.tenant_applications";

function safeParse(raw: string | null): StoredApplication[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredApplication[]) : [];
  } catch {
    return [];
  }
}

function readStore(): StoredApplication[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function getApplications(): StoredApplication[] {
  const all = readStore();
  return [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveApplication(
  input: Omit<StoredApplication, "id" | "createdAt" | "status"> & { status?: ApplicationStatus }
): StoredApplication {
  const stored: StoredApplication = {
    ...input,
    id: crypto.randomUUID(),
    status: input.status ?? "pending",
    createdAt: new Date().toISOString(),
  };
  const prev = readStore();
  const next = [...prev, stored];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return stored;
}

export function deleteApplication(id: string): void {
  const prev = readStore();
  const next = prev.filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearApplications(): void {
  localStorage.removeItem(STORAGE_KEY);
}
