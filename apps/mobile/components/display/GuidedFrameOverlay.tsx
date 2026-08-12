import { View } from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

/** CR80 card aspect ratio (width:height), per Requirement 3.2. */
export const CARD_ASPECT_RATIO = 3.375 / 2.125;

/** @deprecated Use `CARD_ASPECT_RATIO`. Retained as an alias for the same value. */
export const CR80_ASPECT_RATIO = CARD_ASPECT_RATIO;

export type GuidedFrameShape = 'rectangle' | 'circle';

export interface GuidedFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes the largest centered rectangle matching the given aspect ratio
 * (defaulting to the CR80 card ratio) that fits within the given viewport
 * dimensions. The geometric algorithm is unchanged from the prior,
 * CR80-only implementation — only the ratio itself is now a parameter.
 *
 * Validates: Requirements 3.2
 */
export function computeGuidedFrameRect(
  viewportWidth: number,
  viewportHeight: number,
  aspectRatio: number = CARD_ASPECT_RATIO,
): GuidedFrameRect {
  const widthIfConstrainedByHeight = viewportHeight * aspectRatio;

  let width: number;
  let height: number;

  if (widthIfConstrainedByHeight <= viewportWidth) {
    width = widthIfConstrainedByHeight;
    height = viewportHeight;
  } else {
    width = viewportWidth;
    height = viewportWidth / aspectRatio;
  }

  return {
    x: (viewportWidth - width) / 2,
    y: (viewportHeight - height) / 2,
    width,
    height,
  };
}

/**
 * Computes the fill ratio (guided frame area ÷ viewport area) — a pure
 * geometric comparison used by the Frame_Quality_Check's fill heuristic.
 * Aspect-ratio-agnostic by construction: it only cares about the resulting
 * rectangle's area, not how that rectangle's ratio was derived.
 *
 * Validates: Requirements 3.2
 */
export function computeFillRatio(
  guidedFrameRect: GuidedFrameRect,
  viewportWidth: number,
  viewportHeight: number,
): number {
  const frameArea = guidedFrameRect.width * guidedFrameRect.height;
  const viewportArea = viewportWidth * viewportHeight;
  return frameArea / viewportArea;
}

const CORNER_LENGTH = 28;
const CORNER_THICKNESS = 4;
const DEFAULT_STROKE_COLOR = 'white';
const MASK_ID = 'guided-frame-mask';

interface GuidedFrameOverlayProps {
  viewportWidth: number;
  viewportHeight: number;
  /** Guided_Frame aspect ratio (width / height). Defaults to the CR80 card ratio. */
  aspectRatio?: number;
  /** Rectangle keeps document corner brackets; circle is used for selfie framing. */
  shape?: GuidedFrameShape;
  /** Border color for the guided frame. */
  strokeColor?: string;
}

/**
 * Presentational camera overlay with a dimmed mask outside the configured
 * guide. Document steps use rectangular corner brackets; selfie capture uses
 * the opt-in circular guide while preserving the same geometric frame bounds
 * for quality checks.
 */
export default function GuidedFrameOverlay({
  viewportWidth,
  viewportHeight,
  aspectRatio = CARD_ASPECT_RATIO,
  shape = 'rectangle',
  strokeColor = DEFAULT_STROKE_COLOR,
}: GuidedFrameOverlayProps) {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return null;
  }

  const frame = computeGuidedFrameRect(viewportWidth, viewportHeight, aspectRatio);

  if (shape === 'circle') {
    const radius = Math.min(frame.width, frame.height) / 2;
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;

    return (
      <View className="absolute inset-0" pointerEvents="none">
        <Svg width={viewportWidth} height={viewportHeight}>
          <Defs>
            <Mask id={MASK_ID}>
              <Rect width={viewportWidth} height={viewportHeight} fill="white" />
              <Circle cx={centerX} cy={centerY} r={radius} fill="black" />
            </Mask>
          </Defs>
          <Rect
            width={viewportWidth}
            height={viewportHeight}
            fill="black"
            opacity={0.4}
            mask={`url(#${MASK_ID})`}
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={CORNER_THICKNESS}
          />
        </Svg>
      </View>
    );
  }

  return (
    <View className="absolute inset-0" pointerEvents="none">
      {/* Dimmed mask — top/bottom/left/right bands outside the guided frame */}
      <View
        className="absolute bg-black/40"
        style={{ top: 0, left: 0, right: 0, height: frame.y }}
      />
      <View
        className="absolute bg-black/40"
        style={{ top: frame.y + frame.height, left: 0, right: 0, bottom: 0 }}
      />
      <View
        className="absolute bg-black/40"
        style={{ top: frame.y, left: 0, width: frame.x, height: frame.height }}
      />
      <View
        className="absolute bg-black/40"
        style={{
          top: frame.y,
          left: frame.x + frame.width,
          right: 0,
          height: frame.height,
        }}
      />

      <Svg
        className="absolute"
        style={{ top: frame.y, left: frame.x }}
        width={frame.width}
        height={frame.height}
      >
        {/* Top-left */}
        <Rect x={0} y={0} width={CORNER_LENGTH} height={CORNER_THICKNESS} fill={strokeColor} />
        <Rect x={0} y={0} width={CORNER_THICKNESS} height={CORNER_LENGTH} fill={strokeColor} />
        {/* Top-right */}
        <Rect
          x={frame.width - CORNER_LENGTH}
          y={0}
          width={CORNER_LENGTH}
          height={CORNER_THICKNESS}
          fill={strokeColor}
        />
        <Rect
          x={frame.width - CORNER_THICKNESS}
          y={0}
          width={CORNER_THICKNESS}
          height={CORNER_LENGTH}
          fill={strokeColor}
        />
        {/* Bottom-left */}
        <Rect
          x={0}
          y={frame.height - CORNER_THICKNESS}
          width={CORNER_LENGTH}
          height={CORNER_THICKNESS}
          fill={strokeColor}
        />
        <Rect
          x={0}
          y={frame.height - CORNER_LENGTH}
          width={CORNER_THICKNESS}
          height={CORNER_LENGTH}
          fill={strokeColor}
        />
        {/* Bottom-right */}
        <Rect
          x={frame.width - CORNER_LENGTH}
          y={frame.height - CORNER_THICKNESS}
          width={CORNER_LENGTH}
          height={CORNER_THICKNESS}
          fill={strokeColor}
        />
        <Rect
          x={frame.width - CORNER_THICKNESS}
          y={frame.height - CORNER_LENGTH}
          width={CORNER_THICKNESS}
          height={CORNER_LENGTH}
          fill={strokeColor}
        />
      </Svg>
    </View>
  );
}
