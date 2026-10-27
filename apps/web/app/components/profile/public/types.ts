import type { VerifiedPassportSlot } from "@repo/passport";

import type { ReviewRatingDistribution, StayHistorySummary, UnitSummary } from "@/lib/public-profile";

export interface PublicProfileIdentity {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  accountStatus: string | null;
  joinedAt: string | null;
  location: string | null;
}

/** Shown only to signed-in viewers; null hides the whole card. */
export interface PublicProfileContact {
  email: string | null;
  mobileNumber: string | null;
}

export interface PublicProfileListing {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  isVerified: boolean;
  thumbnailUrl: string;
}

export interface PublicProfileReview {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  date: string;
  text: string;
  rating: number;
  images?: string[];
  /** Apartment the reviewer rented, when it still belongs to this landlord. */
  apartmentName: string | null;
  /** Stay range; only read for signed-in viewers (anonymous readers cannot join tenancies). */
  stayPeriod?: string;
}

export interface LandlordProfileData {
  identity: PublicProfileIdentity;
  contact: PublicProfileContact | null;
  units: UnitSummary;
  /** Cities with listings, most listings first. */
  cities: string[];
  /** Mean of the review ratings, not an average of listing averages. */
  averageRating: number | null;
  reviewCount: number;
  ratingDistribution: ReviewRatingDistribution;
  /** Listed apartments that passed APT verification, out of `listedTotal`. */
  verifiedListings: number;
  listedTotal: number;
  listings: PublicProfileListing[];
  reviews: PublicProfileReview[];
}

export interface PublicProfilePastStay {
  id: string;
  apartmentName: string;
  location: string;
  stayPeriod: string;
  thumbnailUrl: string;
}

export interface TenantProfileData {
  identity: PublicProfileIdentity;
  contact: PublicProfileContact;
  reviewCount: number;
  /** Verified, unexpired passport documents the viewer can see (empty is not "unverified"). */
  verifiedDocuments: VerifiedPassportSlot[];
  stayHistory: StayHistorySummary;
  pastStays: PublicProfilePastStay[];
}
