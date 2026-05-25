"use client";

import { Card, Avatar } from "@heroui/react";

interface ReviewCardProps {
  reviewerName: string;
  reviewerAvatar: string;
  reviewDate: string;
  reviewText: string;
  stayPeriod: string;
}

export default function ReviewCard({
  reviewerName,
  reviewerAvatar,
  reviewDate,
  reviewText,
  stayPeriod,
}: ReviewCardProps) {
  return (
    <Card className="gap-0">
      <Card.Header className="flex gap-3">
        <Avatar size="md">
          <Avatar.Image src={reviewerAvatar} alt={reviewerName} />
          <Avatar.Fallback>
            {reviewerName
              .split(" ")
              .map((part) => part[0]?.toUpperCase())
              .join("")}
          </Avatar.Fallback>
        </Avatar>
        
        <div className="flex flex-col">
          <h3 className="text-base font-medium">
            {reviewerName}
          </h3>
          <p className="text-sm text-grey-500">
            {reviewDate}
          </p>
        </div>
      </Card.Header>

      <Card.Content>
        <p className="text-sm">
          {reviewText}
        </p>
      </Card.Content>

      <Card.Footer>
        <span className="text-sm text-gray-500">
          {stayPeriod}
        </span>
      </Card.Footer>
    </Card>
  );
}
