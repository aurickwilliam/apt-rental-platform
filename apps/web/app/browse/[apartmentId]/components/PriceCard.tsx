"use client";

import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Divider
} from "@heroui/react";

import { Flag } from "lucide-react";

import { formatCurrency } from "@repo/utils";

interface PriceCardProps {
  price: number;
  securityDeposit: number | undefined;
  advancePayment: number | undefined;
}

export default function PriceCard({
  price,
  securityDeposit = 0,
  advancePayment = 0,
}: PriceCardProps) {

  const formattedPrice = formatCurrency(price);

  const totalMoveInCost = price + securityDeposit + advancePayment;

  const costBreakdown = [
    { label: "Monthly Rent", value: `₱ ${formattedPrice}` },
    { label: "Security Deposit", value: `₱ ${formatCurrency(securityDeposit)}` },
    { label: "Advance Payment", value: `₱ ${formatCurrency(advancePayment)}` },
  ]

  return (
    <Card
      shadow="none"
      classNames={{
        base: "border border-grey-300"
      }}
    >
      <CardHeader>
        <h2 className="text-3xl font-noto-serif font-medium text-primary">
          ₱ {formattedPrice}<span className="text-xl">/month</span>
        </h2>
      </CardHeader>

      <CardBody>
        <div className="flex flex-col gap-3 bg-darker-white p-4 rounded-lg">
          {costBreakdown.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-grey-500">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}

          <Divider />

          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Move-in Cost:</span>
            <span className="font-medium">₱ {formatCurrency(totalMoveInCost)}</span>
          </div>
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
