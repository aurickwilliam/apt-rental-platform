"use client";

import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button
} from "@heroui/react";

import { Flag } from "lucide-react";

interface PriceCardProps {
  price: number;
}

export default function PriceCard({
  price,
}: PriceCardProps) {
  return (
    <Card
      shadow="none"
      classNames={{
        base: "border border-grey-300"
      }}
    >
      <CardHeader>
        <h2 className="text-3xl font-noto-serif font-medium text-primary">
          ₱ {price}<span className="text-xl">/month</span>
        </h2>
      </CardHeader>

      <CardBody>
        <div className="flex flex-col gap-3 bg-darker-white p-4 rounded-lg">
          {[
              { label: "2 Months Security Deposit", value: "₱ 20,000" },
              { label: "1 Month Advance", value: "₱ 10,000" },
              { label: "Association Dues", value: "₱ 2,500" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-grey-500">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
        </div>
      </CardBody>

      <CardFooter className="flex flex-col gap-2">
        <Button
          variant="solid"
          radius="full"
          color="primary"
          fullWidth
        >
          Apply Now
        </Button>

        {/* Report Button */}
        <Button
          variant="light"
          radius="full"
          color="danger"
          fullWidth
          startContent={<Flag size={16} />}
        >
          Report
        </Button>
      </CardFooter>
    </Card>
  );
}
