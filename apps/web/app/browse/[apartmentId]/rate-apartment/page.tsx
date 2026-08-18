"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Button,
  FieldError,
  Label,
  Separator,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { Star } from "lucide-react";

import BackBtn from "../components/BackBtn";
import ReviewPhotosInput, {
  MAX_REVIEW_IMAGES,
  type ReviewPhoto,
} from "./components/ReviewPhotosInput";
import StarRatingInput from "./components/StarRatingInput";

const MOCK_APARTMENT = {
  name: "Sunshine Residences",
  address: "123 General Luna St, Barangay 8, Valenzuela City, NCR",
  landlordName: "Juan Dela Cruz",
  apartmentType: "Apartment",
  averageRating: 4.5,
  noRatings: 6,
  coverImage: "/default/default-thumbnail.jpeg",
};

const MOCK_STAY_DURATION = "Jan 2025 - Present";

type FormErrors = {
  rating?: string;
  reviewText?: string;
};

export default function RateApartmentPage() {
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewImages, setReviewImages] = useState<ReviewPhoto[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const reviewImagesRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      reviewImagesRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleAddImages = (files: File[]) => {
    setReviewImages((prev) => {
      const next = [
        ...prev,
        ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ].slice(0, MAX_REVIEW_IMAGES);

      reviewImagesRef.current = next.map((photo) => photo.url);

      return next;
    });
  };

  const handleRemoveImage = (url: string) => {
    setReviewImages((prev) => {
      const target = prev.find((photo) => photo.url === url);
      if (target) URL.revokeObjectURL(target.url);

      const next = prev.filter((photo) => photo.url !== url);
      reviewImagesRef.current = next.map((photo) => photo.url);

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

  const handleSubmit = () => {
    const newErrors: FormErrors = {};

    if (rating <= 0) {
      newErrors.rating = "Please select a rating";
    }

    if (!reviewText.trim()) {
      newErrors.reviewText = "Please write a review";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    toast("Review submitted!");
    router.back();
  };

  return (
    <div className="mx-auto max-w-3xl p-4">
      <BackBtn />

      {/* Apartment Cover */}
      <div className="mt-4 h-52 w-full overflow-hidden rounded-3xl">
        <Image
          src={MOCK_APARTMENT.coverImage}
          alt={MOCK_APARTMENT.name}
          width={800}
          height={208}
          className="size-full object-cover"
        />
      </div>

      {/* Apartment Name and Address */}
      <div className="mt-4 flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-primary">
          {MOCK_APARTMENT.name}
        </h1>
        <p className="text-base text-foreground">
          {MOCK_APARTMENT.address}
        </p>
      </div>

      {/* Apartment Details */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-grey-700">Landlord</Label>
          <span className="text-base">
            {MOCK_APARTMENT.landlordName}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Label className="text-sm font-medium text-grey-700">Apartment Type</Label>
            <span className="text-base">
              {MOCK_APARTMENT.apartmentType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Star size={22} className="text-secondary" fill="currentColor" />
            <span className="text-base font-medium">
              {MOCK_APARTMENT.averageRating.toFixed(1)} ({MOCK_APARTMENT.noRatings})
            </span>
          </div>
        </div>

        {/* Duration of Stay — read-only, mocked until tenancy wiring exists */}
        <div>
          <Label className="text-sm font-medium text-grey-700">Duration of Stay</Label>
          <div className="mt-2 flex items-center justify-between rounded-2xl bg-gray-100 px-4 py-3">
            <span className="text-base">
              {MOCK_STAY_DURATION}
            </span>
            <span className="text-xs text-grey-700">Ongoing</span>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Rating Input */}
      <div className="flex flex-col items-center">
        <Label className="text-lg font-medium">Overall Rating</Label>

        <p className="mt-2 text-5xl font-medium leading-tight text-secondary font-dm-serif">
          {rating.toFixed(1)}
        </p>

        <div className="my-5">
          <StarRatingInput value={rating} onChange={handleStarChange} />
        </div>

        <div className="flex items-center gap-5">
          <span className="text-sm text-grey-700">1 - Poor</span>
          <span className="text-sm text-grey-700">5 - Excellent</span>
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

      <Button className="mt-8 w-full" onPress={handleSubmit}>
        Submit Review
      </Button>
    </div>
  );
}