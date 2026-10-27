import type { VerifiedPassportSlot } from "@repo/passport";

import type { ProfileReviewSort, ReviewRatingDistribution, StayHistorySummary, UnitSummary } from "@/lib/public-profile";

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

/** One page of a landlord's reviews, with the summary its aside repeats. */
export interface LandlordReviewsPageData {
  identity: PublicProfileIdentity;
  averageRating: number | null;
  /** Same bounded summary the profile shows, so both headline figures agree. */
  reviewCount: number;
  ratingDistribution: ReviewRatingDistribution;
  reviews: PublicProfileReview[];
  /** Exact number of review rows; drives pagination and the range line. */
  totalCount: number;
  /** 1-based, already clamped to the real range. */
  page: number;
  pageCount: number;
  sort: ProfileReviewSort;
}

export interface PublicProfilePastStay {
  id: string;
  apartmentName: string;
  /** Null when the listing is hidden or gone, so the name renders as plain text. */
  apartmentId: string | null;
  location: string;
  stayPeriod: string;
  /** "6 months"; null when the lease dates cannot give a length. */
  durationLabel: string | null;
  landlord: { id: string; name: string } | null;
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
