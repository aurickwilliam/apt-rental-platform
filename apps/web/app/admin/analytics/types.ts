export interface AnalyticsMetrics {
  users: {
    total: number;
    new: number;
    newTenants: number;
    newLandlords: number;
    tenants: number;
    landlords: number;
    verified: number;
    suspended: number;
  };
  apartments: {
    total: number;
    new: number;
    hidden: number;
    verified: number;
    available: number;
  };
  userVerifications: { pending: number; approved: number; rejected: number };
  apartmentVerifications: {
    pending: number;
    approved: number;
    rejected: number;
  };
  applications: { new: number; approved: number };
  tenancies: { new: number; active: number; occupiedUnits: number };
  payments: { paidCount: number; paidTotal: number };
  maintenance: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
  };
}

export interface AnalyticsTrend {
  bucket_start: string;
  bucket_end: string;
  users: number;
  apartments: number;
  tenants: number;
  landlords: number;
}

export interface PaymentTrend {
  bucket_start: string;
  bucket_end: string;
  payment_total: number;
  payment_count: number;
}

export interface ListingStatus {
  total: number;
  available: number;
  occupied: number;
  hidden: number;
  pending_verification: number;
  other: number;
}

export interface ListingCityCount {
  city: string;
  listing_count: number;
}

export interface ApplicationStatusCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  closed: number;
}
