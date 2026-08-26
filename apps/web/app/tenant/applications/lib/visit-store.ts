"use client";

export type VisitStatus = "pending" | "approved" | "rejected" | "cancelled";

export type StoredVisit = {
  id: string;
  applicationId: string;
  apartmentId: string;
  visitDate: string;
  visitTime: string;
  period: "AM" | "PM";
  noVisitors: string;
  notes: string;
  status: VisitStatus;
  createdAt: string;
};

const STORAGE_KEY = "apt.visit_requests";

function safeParse(raw: string | null): StoredVisit[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredVisit[]) : [];
  } catch {
    return [];
  }
}

function readStore(): StoredVisit[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function getVisitRequests(applicationId?: string): StoredVisit[] {
  const all = readStore();
  const filtered = applicationId ? all.filter((v) => v.applicationId === applicationId) : all;
  return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getVisitRequest(applicationId: string): StoredVisit | null {
  return getVisitRequests(applicationId)[0] ?? null;
}

export function saveVisitRequest(
  input: Omit<StoredVisit, "id" | "createdAt" | "status"> & { status?: VisitStatus }
): StoredVisit {
  const stored: StoredVisit = {
    ...input,
    id: crypto.randomUUID(),
    status: input.status ?? "pending",
    createdAt: new Date().toISOString(),
  };
  const prev = readStore();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...prev, stored]));
  return stored;
}

export function cancelVisitRequest(id: string): void {
  const prev = readStore();
  const next = prev.map((v) => (v.id === id ? { ...v, status: "cancelled" as VisitStatus } : v));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
