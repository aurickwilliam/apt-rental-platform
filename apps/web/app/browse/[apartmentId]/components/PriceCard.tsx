"use client";

import {
  Card,
  Button,
  Separator
} from "@heroui/react";

import { Flag } from "lucide-react";

import { formatPesoDisplay } from "@repo/utils";

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

  const formattedPrice = formatPesoDisplay(price);

  const totalMoveInCost = price + securityDeposit + advancePayment;

  const costBreakdown = [
    { label: "Monthly Rent", value: `₱ ${formattedPrice}` },
    { label: "Security Deposit", value: `${formatPesoDisplay(securityDeposit)}` },
    { label: "Advance Payment", value: `${formatPesoDisplay(advancePayment)}` },
  ]

  return (
    <Card className="border border-grey-300 shadow-none">
      <Card.Header>
        <Card.Title className="text-3xl font-medium text-primary">
          ₱ {formattedPrice}<span className="text-xl">/month</span>
        </Card.Title>
      </Card.Header>

      <Card.Content>
        <div className="flex flex-col gap-3 bg-darker-white p-4 rounded-lg">
          {costBreakdown.map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-grey-500">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Move-in Cost:</span>
            <span className="font-medium">{formatPesoDisplay(totalMoveInCost)}</span>
          </div>
        </div>
      </Card.Content>

      <Card.Footer className="flex flex-col gap-2">
        <Button fullWidth>
          Apply Now
        </Button>

        {/* Report Button */}
        <Button
          variant="tertiary"
          className="bg-red-400/10 text-red-600 border-red-300 hover:bg-red-400/20"
          fullWidth
        >
          <Flag size={16} />
          Report
        </Button>
      </Card.Footer>
    </Card>
  );
}
