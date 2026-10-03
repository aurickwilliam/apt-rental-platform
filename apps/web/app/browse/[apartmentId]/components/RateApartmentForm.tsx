"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import {
  Button,
  FieldError,
  Label,
  Separator,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { IconStarFilled } from "@tabler/icons-react";

import BackBtn from "./BackBtn";
import ReviewPhotosInput, {
  MAX_REVIEW_IMAGES,
  type ReviewPhoto,
} from "../rate-apartment/components/ReviewPhotosInput";
import StarRatingInput from "../rate-apartment/components/StarRatingInput";
import { getTenantContext } from "@/service/favoritesService";
import {
  fetchRateApartmentHeader,
  fetchReviewById,
  fetchReviewTenancy,
  getReviewImageUrls,
  type RateApartmentHeader,
  type TenancyLease,
  type TenantApartmentReview,
} from "@/service/reviewsService";
import { useSubmitReview } from "@/hooks/use-submit-review";

type FormErrors = {
  rating?: string;
  reviewText?: string;
};

function formatStayLabel(tenancy: TenancyLease): string {
  const fmt = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return `${fmt(tenancy.lease_start)} - ${tenancy.lease_end ? fmt(tenancy.lease_end) : "Present"}`;
}

function isBlobPhoto(photo: ReviewPhoto): boolean {
  return photo.file !== null;
}

export interface RateApartmentFormProps {
  apartmentIdOverride?: string;
  tenancyIdOverride?: string | null;
  reviewIdOverride?: string | null;
  hideBackButton?: boolean;
  showApartmentInfo?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RateApartmentForm({
  apartmentIdOverride,
  tenancyIdOverride,
  reviewIdOverride,
  hideBackButton = false,
  showApartmentInfo = true,
  onSuccess,
  onCancel,
}: RateApartmentFormProps = {}) {
  const router = useRouter();
  const { apartmentId: routeApartmentId } = useParams<{ apartmentId: string }>();
  const searchParams = useSearchParams();
  const apartmentId = apartmentIdOverride ?? routeApartmentId;
  const tenancyId = tenancyIdOverride !== undefined ? tenancyIdOverride : searchParams.get("tenancyId");
  const reviewId = reviewIdOverride !== undefined ? reviewIdOverride : searchParams.get("reviewId");
  const isEditMode = reviewId !== null;

  const handleClose = onSuccess ?? (() => router.back());
  const handleCancel = onCancel ?? (() => router.back());

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewImages, setReviewImages] = useState<ReviewPhoto[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [header, setHeader] = useState<RateApartmentHeader | null>(null);
  const [tenancy, setTenancy] = useState<TenancyLease | null>(null);
  const [existingReview, setExistingReview] = useState<TenantApartmentReview | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [originalPaths, setOriginalPaths] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const { submitReview, updateExistingReview, isSubmitting } = useSubmitReview();

  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setPageLoading(true);
      setPageError(null);

      try {
        const context = await getTenantContext();
        if (!context.tenantId) {
          throw new Error(
            isEditMode
              ? "You must be signed in as a tenant to edit a review."
              : "You must be signed in as a tenant to write a review.",
          );
        }

        const apartmentHeader = showApartmentInfo
          ? await fetchRateApartmentHeader(apartmentId)
          : null;

        if (isEditMode) {
          const review = await fetchReviewById(reviewId);

          // Client-side guard only — RLS remains the authority.
          if (review.tenantId !== context.tenantId) {
            throw new Error("This review cannot be edited.");
          }

          const lease = await fetchReviewTenancy(review.tenancyId);
          if (lease.apartment_id !== apartmentId) {
            throw new Error("This review cannot be edited.");
          }

          if (isMounted) {
            setExistingReview(review);
            setTenantId(context.tenantId);
            setTenancy(lease);
            setHeader(apartmentHeader);
            setRating(review.rating);            setReviewText(review.comment);
            setOriginalPaths(review.imagePaths);
            const kept = (getReviewImageUrls(review.imagePaths) ?? []).map((url, index) => ({
              file: null,
              url,
              path: review.imagePaths[index],
            }));
            setReviewImages(kept);
          }
        } else {
          if (!tenancyId) {
            throw new Error("Missing tenancy reference.");
          }

          const lease = await fetchReviewTenancy(tenancyId);

          // Client-side guard only — RLS and triggers remain the authority.
          if (lease.tenant_id !== context.tenantId || lease.apartment_id !== apartmentId) {
            throw new Error("This stay cannot be reviewed.");
          }

          if (isMounted) {
            setTenancy(lease);
            setHeader(apartmentHeader);
          }
        }
      } catch (err) {
        if (isMounted) {
          setPageError(err instanceof Error ? err.message : "Failed to load review details.");
        }
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [apartmentId, tenancyId, reviewId, isEditMode, showApartmentInfo]);

  const handleAddImages = (files: File[]) => {
    const urls: string[] = [];
    setReviewImages((prev) => {
      const next = [
        ...prev,
        ...files.map((file) => {
          const url = URL.createObjectURL(file);
          urls.push(url);
          return { file, url };
        }),
      ].slice(0, MAX_REVIEW_IMAGES);

      blobUrlsRef.current = next.filter(isBlobPhoto).map((photo) => photo.url);

      return next;
    });
  };

  const handleRemoveImage = (url: string) => {
    setReviewImages((prev) => {
      const target = prev.find((photo) => photo.url === url);
      if (target && isBlobPhoto(target)) URL.revokeObjectURL(target.url);

      const next = prev.filter((photo) => photo.url !== url);
      blobUrlsRef.current = next.filter(isBlobPhoto).map((photo) => photo.url);

      return next;
    });
  };

  const handleStarChange = (value: number) => {
    setRating(value);
    if (errors.rating) setErrors((prev) => ({ ...prev, rating: undefined }));
  };

  const handleReviewTextChange = (value: string) => {
    setReviewText(value);
    if (errors.reviewText) {
      setErrors((prev) => ({ ...prev, reviewText: undefined }));
    }
  };

  const isSubmitDisabled =
    pageLoading || !!pageError || !tenancy || isSubmitting || (isEditMode && !existingReview);

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

    const newErrors: FormErrors = {};

    if (rating <= 0) {
      newErrors.rating = "Please select a rating";
    }

    if (!reviewText.trim()) {
      newErrors.reviewText = "Please write a review";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setSubmitError(null);

    if (isEditMode && existingReview && tenantId) {
      const keptPaths = reviewImages
        .map((photo) => photo.path)
        .filter((path): path is string => !!path);
      const removedPaths = originalPaths.filter((path) => !keptPaths.includes(path));
      const newFiles = reviewImages.filter(isBlobPhoto).map((photo) => photo.file as File);

      const result = await updateExistingReview({
        reviewId: existingReview.id,
        tenantId,
        rating,
        comment: reviewText.trim(),
        keptPaths,
        removedPaths,
        newImages: newFiles,
      });

      if (result.success) {
        toast("Review updated!");
        handleClose();
        return;
      }

      setSubmitError(result.error ?? "Failed to save your changes. Please try again.");
      return;
    }

    const result = await submitReview({
      apartmentId,
      tenancyId: tenancyId!,
      rating,
      comment: reviewText.trim(),
      stayedDate: tenancy!.lease_end ?? new Date().toISOString(),
      images: reviewImages.filter(isBlobPhoto).map((photo) => photo.file as File),
    });

    if (result.success) {
      toast("Review submitted!");
      handleClose();
      return;
    }

    setSubmitError(result.error ?? "Failed to submit your review. Please try again.");
  };

  if (pageLoading) {
    return (
      <div className={hideBackButton ? "w-full" : "mx-auto max-w-3xl p-4"}>
        {!hideBackButton && <BackBtn />}
        <p className="mt-6 text-sm text-muted-foreground">Loading review details…</p>
      </div>
    );
  }

  if (pageError || (showApartmentInfo && !header)) {
    return (
      <div className={hideBackButton ? "w-full" : "mx-auto max-w-3xl p-4"}>
        {!hideBackButton && <BackBtn />}
        <p className="mt-6 text-sm text-red-600">
          {pageError ?? "We couldn't load this apartment's details."}
        </p>
        <Button className="mt-4" variant="outline" onPress={handleCancel}>
          Go Back
        </Button>
      </div>
    );
  }

  const address = header
    ? [header.street_address, header.barangay, header.city].filter(Boolean).join(", ")
    : "";

  const isModalLayout = hideBackButton;

  return (
    <div className={hideBackButton ? "w-full" : "mx-auto max-w-3xl p-4"}>
      {!hideBackButton && <BackBtn />}

      {!hideBackButton && (
        <div className="mt-4">
          <h1 className="text-2xl font-medium md:text-3xl">
            {isEditMode ? "Edit Review" : "Rate Apartment"}
          </h1>
        </div>
      )}

      <div className={showApartmentInfo ? (isModalLayout ? "grid grid-cols-1 gap-x-8 md:grid-cols-2" : undefined) : "flex flex-col"}>
        {showApartmentInfo && (
        <div>
          {header && (
            <>
              {/* Apartment Cover */}
              <div
                className={
                  isModalLayout
                    ? "mt-4 h-52 w-full overflow-hidden rounded-3xl md:h-64"
                    : "mt-4 h-52 w-full overflow-hidden rounded-3xl"
                }
              >
                <Image
                  src={header.coverImage ?? "/default/default-thumbnail.jpeg"}
                  alt={header.name}
                  width={800}
                  height={208}
                  unoptimized
                  className="size-full object-cover"
                />
              </div>

              {/* Apartment Name and Address */}
              <div className="mt-4 flex flex-col gap-1">
                <h1 className="font-nunito text-2xl font-semibold text-card-foreground">
                  {header.name}
                </h1>
                <p className="text-base text-muted-foreground">
                  {address}
                </p>
              </div>
            </>
          )}

          {/* Apartment Details */}
          <div className="mt-4 flex flex-col gap-3">
            {header && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">Landlord</Label>
                  <span className="text-base font-medium text-card-foreground">
                    {header.landlordName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-muted-foreground">Apartment Type</Label>
                    <span className="text-base font-medium text-card-foreground">
                      {header.type ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <IconStarFilled size={22} className="text-rating" />
                    <span className="text-base font-medium">
                      {(header.average_rating ?? 0).toFixed(1)} ({header.no_ratings ?? 0})
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Duration of Stay — read-only, sourced from the tenancy record */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Duration of Stay</Label>
              <div className="mt-2 flex items-center justify-between rounded-2xl border border-border bg-muted px-4 py-3">
                <span className="text-base font-medium text-card-foreground">
                  {tenancy ? formatStayLabel(tenancy) : "—"}
                </span>
                {tenancy && !tenancy.lease_end && (
                  <span className="text-xs text-muted-foreground">Ongoing</span>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {showApartmentInfo && (
          <Separator className={isModalLayout ? "my-6 md:hidden" : "my-6"} />
        )}

        <div className={showApartmentInfo && !isModalLayout ? "contents" : undefined}>
          {/* Rating Input */}
          <div className="flex flex-col items-center">
            <Label className="font-nunito text-lg font-semibold">Overall Rating</Label>

            <p className="mt-2 font-nunito text-5xl font-bold leading-tight text-rating">
              {rating.toFixed(1)}
            </p>

            <div className="my-5">
              <StarRatingInput value={rating} onChange={handleStarChange} />
            </div>

            <div className="flex items-center gap-5">
              <span className="text-sm text-muted-foreground">1 - Poor</span>
              <span className="text-sm text-muted-foreground">5 - Excellent</span>
            </div>

            {errors.rating && (
              <p className="mt-1 text-xs text-red-600">{errors.rating}</p>
            )}
          </div>

          {/* Tenant Review */}
          <div className="mt-6">
            <TextField
              isRequired
              isInvalid={!!errors.reviewText}
              value={reviewText}
              onChange={handleReviewTextChange}
            >
              <Label>Tenant Review:</Label>
              <TextArea
                rows={5}
                placeholder="Type your experience and review about the apartment.."
                className="resize-none"
              />
              <FieldError>{errors.reviewText}</FieldError>
            </TextField>
          </div>

          {/* Photos (optional) */}
          <div className="mt-6">
            <ReviewPhotosInput
              images={reviewImages}
              onAdd={handleAddImages}
              onRemove={handleRemoveImage}
            />
          </div>
        </div>
      </div>

      {submitError && (
        <p className="mt-4 text-sm text-red-600">{submitError}</p>
      )}

      <Button
        className="mt-8 w-full"
        onPress={() => void handleSubmit()}
        isPending={isSubmitting}
        isDisabled={isSubmitDisabled}
      >
        {isSubmitting ? (isEditMode ? "Saving…" : "Submitting…") : isEditMode ? "Save Changes" : "Submit Review"}
      </Button>
    </div>
  );
}
