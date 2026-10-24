"use client";

import { useEffect, useRef, useState } from "react";

type ZigzagEdgeProps = {
  cutColor?: string;
  depth?: number;
  toothWidth?: number;
  className?: string;
  /**
   * Draws white-paper teeth hanging below the receipt (filled with `cutColor`)
   * instead of background-colored notches cut into it, so the edge stays
   * correct over any background, including a transparent dialog.
   */
  hanging?: boolean;
};

// Web twin of mobile ZigzagEdge: an SVG notch path filled with the background
// color behind the card (cutColor), so the white receipt looks cut out.
// Teeth recompute from measured width so they fit evenly, no partial tooth.
export default function ZigzagEdge({ cutColor = "#376BF5", depth = 13, toothWidth = 20, className = "", hanging = false }: ZigzagEdgeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0);
      setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (width === 0) {
    return <div ref={ref} style={{ height: depth }} className={className} aria-hidden />;
  }

  const teeth = Math.max(1, Math.round(width / toothWidth));
  const tooth = width / teeth;

  let d = hanging ? "M0,0 " : `M0,${depth} `;
  for (let i = 0; i < teeth; i++) {
    const midX = i * tooth + tooth / 2;
    const endX = (i + 1) * tooth;
    d += hanging ? `L${midX},${depth} L${endX},0 ` : `L${midX},0 L${endX},${depth} `;
  }
  d += "Z";

  return (
    <div ref={ref} className={`w-full ${className}`} style={{ height: depth }} aria-hidden>
      <svg width={width} height={depth} viewBox={`0 0 ${width} ${depth}`} className="block w-full">
        <path d={d} fill={cutColor} />
      </svg>
    </div>
  );
}
