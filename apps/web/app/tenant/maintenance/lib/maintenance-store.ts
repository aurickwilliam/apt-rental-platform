export type MaintenanceFileMeta = {
  name: string;
  type: string;
  size: number;
};

export type MaintenanceRequestPayload = {
  title: string;
  categoryId: string;
  categoryLabel: string;
  description: string;
  urgency: "low" | "medium" | "high";
  files: MaintenanceFileMeta[];
};

export type StoredMaintenanceRequest = MaintenanceRequestPayload & {
  id: string;
  createdAt: string;
};

const STORAGE_KEY = "apt.maintenance_requests";

function safeParse(raw: string | null): StoredMaintenanceRequest[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredMaintenanceRequest[]) : [];
  } catch {
    return [];
  }
}

export function getMaintenanceRequests(): StoredMaintenanceRequest[] {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveMaintenanceRequest(
  payload: MaintenanceRequestPayload
): StoredMaintenanceRequest {
  const stored: StoredMaintenanceRequest = {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next = [...getMaintenanceRequests(), stored];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return stored;
}