"use client";

type ZigzagEdgeProps = {
  cutColor?: string;
  toothColor?: string;
  depth?: number;
  toothWidth?: number;
  className?: string;
};

export default function ZigzagEdge({ cutColor = "#fafafa", toothColor = "white", depth = 12, toothWidth = 20, className = "" }: ZigzagEdgeProps) {
  // Decorative scalloped bottom — CSS triangle row + solid cap
  // Pure div/CSS so it works with Tailwind without RN canvas
  const teeth = 32; // enough to fill width responsively via flex
  return (
    <div className={`relative w-full overflow-hidden ${className}`} aria-hidden>
      <div className="flex w-full" style={{ height: depth }}>
        {Array.from({ length: teeth }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{
              background: toothColor,
              clipPath: i % 2 === 0 ? "polygon(0 0, 100% 0, 50% 100%)" : "polygon(0 0, 100% 0, 50% 0)",
              marginLeft: i === 0 ? 0 : -1,
            }}
          />
        ))}
      </div>
      <div className="h-2 w-full" style={{ background: cutColor, marginTop: -1 }} />
    </div>
  );
}


