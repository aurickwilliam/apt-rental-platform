"use client";

import { useState } from "react";

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
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-primary font-medium hover:opacity-80 transition-opacity text-sm underline-offset-2 hover:underline"
        >
          {isExpanded ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
}
