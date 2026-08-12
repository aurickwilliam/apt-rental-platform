import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/** CR80 card aspect ratio (width:height), per Requirement 2.3. */
export const CR80_ASPECT_RATIO = 3.375 / 2.125;

export interface GuidedFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes the largest centered rectangle matching the CR80 (3.375:2.125)
 * aspect ratio that fits within the given viewport dimensions.
 *
 * Validates: Requirements 2.3
 */
export function computeGuidedFrameRect(
  viewportWidth: number,
  viewportHeight: number,
): GuidedFrameRect {
  const widthIfConstrainedByHeight = viewportHeight * CR80_ASPECT_RATIO;

  let width: number;
  let height: number;

  if (widthIfConstrainedByHeight <= viewportWidth) {
    width = widthIfConstrainedByHeight;
    height = viewportHeight;
  } else {
    width = viewportWidth;
    height = viewportWidth / CR80_ASPECT_RATIO;
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
 *
 * Validates: Requirements 2.3
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

interface GuidedFrameOverlayProps {
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Generic corner-bracket overlay sized to the CR80 ID-card aspect ratio,
 * centered over a camera preview, with a dimmed mask outside the frame area.
 * Presentational only — no verification-specific logic.
 */
export default function GuidedFrameOverlay({
  viewportWidth,
  viewportHeight,
}: GuidedFrameOverlayProps) {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return null;
  }

  const frame = computeGuidedFrameRect(viewportWidth, viewportHeight);

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

      {/* Corner brackets */}
      <Svg
        className="absolute"
        style={{ top: frame.y, left: frame.x }}
        width={frame.width}
        height={frame.height}
      >
        {/* Top-left */}
        <Rect x={0} y={0} width={CORNER_LENGTH} height={CORNER_THICKNESS} fill="white" />
        <Rect x={0} y={0} width={CORNER_THICKNESS} height={CORNER_LENGTH} fill="white" />
        {/* Top-right */}
        <Rect
          x={frame.width - CORNER_LENGTH}
          y={0}
          width={CORNER_LENGTH}
          height={CORNER_THICKNESS}
          fill="white"
        />
        <Rect
          x={frame.width - CORNER_THICKNESS}
          y={0}
          width={CORNER_THICKNESS}
          height={CORNER_LENGTH}
          fill="white"
        />
        {/* Bottom-left */}
        <Rect
          x={0}
          y={frame.height - CORNER_THICKNESS}
          width={CORNER_LENGTH}
          height={CORNER_THICKNESS}
          fill="white"
        />
        <Rect
          x={0}
          y={frame.height - CORNER_LENGTH}
          width={CORNER_THICKNESS}
          height={CORNER_LENGTH}
          fill="white"
        />
        {/* Bottom-right */}
        <Rect
          x={frame.width - CORNER_LENGTH}
          y={frame.height - CORNER_THICKNESS}
          width={CORNER_LENGTH}
          height={CORNER_THICKNESS}
          fill="white"
        />
        <Rect
          x={frame.width - CORNER_THICKNESS}
          y={frame.height - CORNER_LENGTH}
          width={CORNER_THICKNESS}
          height={CORNER_LENGTH}
          fill="white"
        />
      </Svg>
    </View>
  );
}
