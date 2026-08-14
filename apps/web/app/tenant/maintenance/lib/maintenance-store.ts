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

const requestsCache: StoredMaintenanceRequest[] = [];

export function getMaintenanceRequests(): StoredMaintenanceRequest[] {
  return [...requestsCache];
}

export function saveMaintenanceRequest(
  payload: MaintenanceRequestPayload
): StoredMaintenanceRequest {
  const stored: StoredMaintenanceRequest = {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  requestsCache.push(stored);
  return stored;
}