import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { CameraView } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { computeFillRatio, type GuidedFrameRect } from '@/components/display/GuidedFrameOverlay';

export type FrameQualityReason = 'blur' | 'glare' | 'fill';

export interface FrameQualityResult {
  status: 'evaluating' | 'pass' | 'fail';
  reasons: FrameQualityReason[];
  /** true once `status === 'pass'` has held for `stableDurationMs` of consecutive passing samples. */
  isStable: boolean;
}

export interface FrameQualityCheckOptions {
  enabled: boolean;
  sampleIntervalMs?: number;
  stableDurationMs?: number;
  /** Current guided-frame geometry, used by the fill-ratio heuristic. */
  guidedFrameRect: GuidedFrameRect;
  viewportWidth: number;
  viewportHeight: number;
}

const DEFAULT_SAMPLE_INTERVAL_MS = 400;
const DEFAULT_STABLE_DURATION_MS = 1000;

// Sample downscale target, matching the CR80 (3.375:2.125) ratio.
const SAMPLE_DOWNSCALE_WIDTH = 200;
const SAMPLE_DOWNSCALE_HEIGHT = 126;

/**
 * Best-effort motion-blur proxy: true per-pixel Laplacian-variance blur
 * detection requires pixel access that expo-camera's JS API does not expose.
 * This flags long exposure times (which correlate with motion-blur risk,
 * especially in low light) as a coarse EXIF-metadata proxy instead.
 *
 * NOT a real Laplacian-variance blur detector.
 *
 * Validates: Requirements 2.4
 */
export const BLUR_EXPOSURE_TIME_THRESHOLD_SECONDS = 1 / 30;

export function evaluateBlurHeuristic(exif: { ExposureTime?: number }): boolean {
  if (exif.ExposureTime == null) return true; // no signal — do not fail the sample
  return exif.ExposureTime <= BLUR_EXPOSURE_TIME_THRESHOLD_SECONDS;
}

/**
 * Best-effort glare/exposure proxy: true per-pixel brightness-variance glare
 * detection requires pixel access that expo-camera's JS API does not expose.
 * This flags brightness values outside an expected mid-range band as a
 * coarse EXIF-metadata proxy instead.
 *
 * NOT true variance-based glare detection.
 *
 * Validates: Requirements 2.4
 */
export const GLARE_BRIGHTNESS_MIN = -2;
export const GLARE_BRIGHTNESS_MAX = 6;

export function evaluateGlareHeuristic(exif: { BrightnessValue?: number }): boolean {
  if (exif.BrightnessValue == null) return true; // no signal — do not fail the sample
  return exif.BrightnessValue >= GLARE_BRIGHTNESS_MIN && exif.BrightnessValue <= GLARE_BRIGHTNESS_MAX;
}

/**
 * Fill-ratio check: a pure geometric comparison (no pixel/content analysis
 * required) — passes when the guided frame occupies a reasonable proportion
 * of the viewport.
 */
const MIN_FILL_RATIO = 0.05;

function evaluateFillHeuristic(
  guidedFrameRect: GuidedFrameRect,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  if (viewportWidth <= 0 || viewportHeight <= 0) return true;
  return computeFillRatio(guidedFrameRect, viewportWidth, viewportHeight) >= MIN_FILL_RATIO;
}

interface SampleExif {
  ExposureTime?: number;
  BrightnessValue?: number;
}

/**
 * Periodic-sampling based frame quality check. expo-camera's JS API exposes
 * no frame-processor/pixel stream, so "continuous" evaluation is implemented
 * as periodic cheap still-capture sampling (see design.md's Feasibility
 * constraint) rather than true per-frame analysis.
 *
 * Validates: Requirements 2.4, 2.5
 */
export function useFrameQualityCheck(
  cameraRef: RefObject<CameraView | null>,
  options: FrameQualityCheckOptions,
): FrameQualityResult {
  const {
    enabled,
    sampleIntervalMs = DEFAULT_SAMPLE_INTERVAL_MS,
    stableDurationMs = DEFAULT_STABLE_DURATION_MS,
    guidedFrameRect,
    viewportWidth,
    viewportHeight,
  } = options;

  const [result, setResult] = useState<FrameQualityResult>({
    status: 'evaluating',
    reasons: [],
    isStable: false,
  });

  const isSamplingRef = useRef(false);
  const passingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      passingSinceRef.current = null;
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      void runSample();
    }, sampleIntervalMs);

    async function runSample() {
      if (cancelled) return;
      if (isSamplingRef.current) return; // concurrency guard — skip this tick

      const camera = cameraRef.current;
      if (camera == null) {
        // Camera not yet mounted — skip this tick without failing.
        if (!cancelled) {
          setResult((prev) => ({ ...prev, status: 'evaluating' }));
        }
        return;
      }

      isSamplingRef.current = true;
      try {
        const picture = await camera.takePictureAsync({
          quality: 0.1,
          skipProcessing: true,
          exif: true,
        });

        if (cancelled) return;

        const context = ImageManipulator.manipulate(picture.uri);
        context.resize({ width: SAMPLE_DOWNSCALE_WIDTH, height: SAMPLE_DOWNSCALE_HEIGHT });
        const imageRef = await context.renderAsync();
        await imageRef.saveAsync({ format: SaveFormat.JPEG });

        if (cancelled) return;

        const exif = ((picture as unknown as { exif?: SampleExif }).exif ?? {}) as SampleExif;

        const reasons: FrameQualityReason[] = [];
        if (!evaluateBlurHeuristic(exif)) reasons.push('blur');
        if (!evaluateGlareHeuristic(exif)) reasons.push('glare');
        if (!evaluateFillHeuristic(guidedFrameRect, viewportWidth, viewportHeight)) {
          reasons.push('fill');
        }

        applySampleOutcome(reasons.length === 0, reasons);
      } catch {
        // A rejected takePictureAsync is treated as a failing sample; it
        // must not crash the hook or leave it stuck evaluating.
        if (!cancelled) {
          applySampleOutcome(false, []);
        }
      } finally {
        isSamplingRef.current = false;
      }
    }

    function applySampleOutcome(passed: boolean, reasons: FrameQualityReason[]) {
      if (cancelled) return;

      const now = Date.now();

      if (!passed) {
        passingSinceRef.current = null;
        setResult({ status: 'fail', reasons, isStable: false });
        return;
      }

      if (passingSinceRef.current === null) {
        passingSinceRef.current = now;
      }

      const isStable = now - passingSinceRef.current >= stableDurationMs;
      setResult({ status: 'pass', reasons: [], isStable });
    }

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sampleIntervalMs, stableDurationMs, guidedFrameRect, viewportWidth, viewportHeight]);

  return result;
}
