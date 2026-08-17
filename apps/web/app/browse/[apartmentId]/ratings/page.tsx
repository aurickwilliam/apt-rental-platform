"use client";

import { useMemo, useState } from "react";

import { Button, Card, Dropdown, Label } from "@heroui/react";
import { ChevronDown } from "lucide-react";

import BackBtn from "../components/BackBtn";
import RatingBreakdown from "../components/RatingBreakdown";
import ReviewCard from "../components/ReviewCard";

type ReviewSortOption = "Most Recent" | "Highest Rating" | "Lowest Rating";

const SORT_OPTIONS: ReviewSortOption[] = [
  "Most Recent",
  "Highest Rating",
  "Lowest Rating",
];

interface MockReview {
  id: string;
  name: string;
  date: string;
  rating: number;
  review: string;
  profilePictureUrl?: string;
  durationOfStay?: string;
  images?: string[];
}

const MOCK_REVIEWS: MockReview[] = [
  {
    id: "1",
    name: "Maria Santos",
    date: "2026-07-18",
    rating: 5,
    review:
      "Clean unit, responsive landlord, and very fair rent. The location is convenient for commuting to work. Highly recommended!",
    profilePictureUrl: "/images/mija.jpg",
    durationOfStay: "Mar 2025 - Present",
  },
  {
    id: "2",
    name: "Juan Dela Cruz",
    date: "2026-06-30",
    rating: 5,
    review:
      "Stayed here for over a year and overall it has been a great experience. The landlord is quick to respond to maintenance requests and the building is quiet at night. Only minor downside is limited parking space for visitors on weekends, but the unit itself is spacious, well-ventilated, and worth the price. Will definitely renew my lease.",
    durationOfStay: "Jan 2025 - Present",
    images: [
      "/default/default-thumbnail.jpeg",
      "/default/default-thumbnail2.jpg",
      "/default/default-thumbnail3.jpg",
      "/default/default-thumbnail4.jpg",
      "/default/default-thumbnail2.jpg",
    ],
  },
  {
    id: "3",
    name: "Andrea Villanueva",
    date: "2026-05-12",
    rating: 5,
    review:
      "Spacious unit with great natural lighting. Aircon and water heater are well-maintained. The neighborhood is safe and quiet.",
    profilePictureUrl: "/images/ron.jpg",
    durationOfStay: "Jun 2024 - Dec 2025",
  },
  {
    id: "4",
    name: "Rafael Garcia",
    date: "2026-04-02",
    rating: 5,
    review:
      "Smooth move-in process and everything was as advertised. The landlord even helped with the internet installation.",
    profilePictureUrl: "/images/charle.jpg",
    durationOfStay: "Aug 2024 - Jun 2025",
  },
  {
    id: "5",
    name: "Carlo Reyes",
    date: "2026-03-21",
    rating: 4,
    review:
      "Nice apartment overall, but the water pressure in the shower can be weak during peak hours. Management was responsive when we raised it.",
    profilePictureUrl: "/images/orik.jpg",
    durationOfStay: "Feb 2025 - Feb 2026",
    images: ["/default/default-thumbnail3.jpg"],
  },
  {
    id: "6",
    name: "Paolo Mendoza",
    date: "2026-02-10",
    rating: 3,
    review:
      "The unit is okay for the price, though the walls are a bit thin and you can hear the neighbors sometimes. Location is good though.",
    durationOfStay: "Sep 2024 - Aug 2025",
  },
];

const OVERALL_RATING = 4.5;
const TOTAL_REVIEWS = MOCK_REVIEWS.length;

const RATINGS_COUNT = [
  { rating: 5, ratingCount: 4 },
  { rating: 4, ratingCount: 1 },
  { rating: 3, ratingCount: 1 },
  { rating: 2, ratingCount: 0 },
  { rating: 1, ratingCount: 0 },
];

const countFor = (rating: number) =>
  RATINGS_COUNT.find((r) => r.rating === rating)?.ratingCount ?? 0;

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function RatingsPage() {
  const [sortBy, setSortBy] = useState<ReviewSortOption>("Most Recent");

  const sortedReviews = useMemo(() => {
    const list = [...MOCK_REVIEWS];

    switch (sortBy) {
      case "Highest Rating":
        return list.sort((a, b) => b.rating - a.rating);
      case "Lowest Rating":
        return list.sort((a, b) => a.rating - b.rating);
      default:
        return list.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
  }, [sortBy]);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <BackBtn />

      <div className="mt-4">
        <h1 className="text-2xl font-medium md:text-3xl">Ratings & Reviews</h1>
      </div>

      <Card className="mt-6 p-6 md:p-8">
        <RatingBreakdown
          overallRate={OVERALL_RATING}
          totalReviews={TOTAL_REVIEWS}
          no5Star={countFor(5)}
          no4Star={countFor(4)}
          no3Star={countFor(3)}
          no2Star={countFor(2)}
          no1Star={countFor(1)}
        />
      </Card>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">Tenant Reviews</h2>

        <Dropdown>
          <Button variant="outline" size="sm" className="h-9 rounded-full">
            {sortBy}
            <ChevronDown size={16} />
          </Button>

          <Dropdown.Popover>
            <Dropdown.Menu
              selectionMode="single"
              selectedKeys={new Set([sortBy])}
              onAction={(key) => setSortBy(key as ReviewSortOption)}
            >
              {SORT_OPTIONS.map((option) => (
                <Dropdown.Item key={option} id={option} textValue={option}>
                  <Dropdown.ItemIndicator />
                  <Label>{option}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <div className="mt-5 columns-1 gap-3 md:columns-2">
        {sortedReviews.map((review) => (
          <div key={review.id} className="mb-3 break-inside-avoid">
            <ReviewCard
              reviewerName={review.name}
              reviewerAvatar={review.profilePictureUrl}
              reviewDate={formatReviewDate(review.date)}
              reviewText={review.review}
              stayPeriod={review.durationOfStay}
              rating={review.rating}
              images={review.images}
            />
          </div>
        ))}
      </div>
    </div>
  );
}