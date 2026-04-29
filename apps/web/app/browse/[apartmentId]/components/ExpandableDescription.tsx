"use client";

import { useState } from "react";
import { Button } from "@heroui/react";

interface Props {
  text: string;
  maxLength?: number;
}

export default function ExpandableDescription({ text, maxLength = 300 }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return (
    <div>
      <h3 className="text-lg font-medium mb-2">Description</h3>
      <p className="text-foreground/80 italic">No description provided.</p>
    </div>
  );

  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded ? `${text.slice(0, maxLength)}...` : text;

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Description</h3>
      <p className="whitespace-pre-line text-foreground/80 leading-relaxed">{displayText}</p>
      {shouldTruncate && (
        <Button
          onPress={() => setIsExpanded(!isExpanded)}
          radius="full"
          variant="light"
          className="mt-2 text-primary font-medium text-sm transform -translate-x-4"
        >
          {isExpanded ? "View less" : "View more"}
        </Button>
      )}
    </div>
  );
}
