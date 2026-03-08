"use client";

import { Card, CardBody, CardHeader, CardFooter, Avatar } from "@heroui/react";

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
    <Card
     shadow="none"
     classNames={{
       base: "gap-0"
     }}
    >
      <CardHeader className="flex gap-3">
        <Avatar
          size="md"
          src={reviewerAvatar}
          alt="User Avatar"
        />
        
        <div className="flex flex-col">
          <h3 className="text-base font-medium">
            {reviewerName}
          </h3>
          <p className="text-sm text-grey-500">
            {reviewDate}
          </p>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-sm">
          {reviewText}
        </p>
      </CardBody>

      <CardFooter>
        <span className="text-sm text-gray-500">
          {stayPeriod}
        </span>
      </CardFooter>
    </Card>
  );
}
