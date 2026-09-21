import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { GuidedFrameRect } from '@/components/display/GuidedFrameOverlay';

export interface ImageCropRegion {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * Maps an on-screen guided-frame rect to a pixel crop region of the captured
 * photo. Assumes the native preview fills its view with a center-crop
 * (`cover`) of the full sensor frame — the same assumption behind the
 * reported "extra surroundings" mismatch (preview shows the cropped center,
 * `takePictureAsync` returns the whole frame).
 *
 * Pure geometry — no camera or filesystem access — so it is unit-testable.
 * The result is always clamped inside the photo bounds; degenerate inputs
 * fall back to the full photo.
 */
export function mapGuidedRectToImageCrop(
  frame: GuidedFrameRect,
  viewWidth: number,
  viewHeight: number,
  photoWidth: number,
  photoHeight: number,
): ImageCropRegion {
  if (viewWidth <= 0 || viewHeight <= 0 || photoWidth <= 0 || photoHeight <= 0) {
    return { originX: 0, originY: 0, width: Math.max(1, Math.round(photoWidth)), height: Math.max(1, Math.round(photoHeight)) };
  }

  // Cover scale: how the photo is scaled to fill the preview view, plus the
  // bands cropped away on each axis.
  const scale = Math.max(viewWidth / photoWidth, viewHeight / photoHeight);
  const offsetX = (photoWidth * scale - viewWidth) / 2;
  const offsetY = (photoHeight * scale - viewHeight) / 2;

  const rawX = (frame.x + offsetX) / scale;
  const rawY = (frame.y + offsetY) / scale;
  const rawWidth = frame.width / scale;
  const rawHeight = frame.height / scale;

  const originX = Math.min(Math.max(0, Math.round(rawX)), photoWidth - 1);
  const originY = Math.min(Math.max(0, Math.round(rawY)), photoHeight - 1);
  const width = Math.min(Math.max(1, Math.round(rawWidth)), photoWidth - originX);
  const height = Math.min(Math.max(1, Math.round(rawHeight)), photoHeight - originY);

  return { originX, originY, width, height };
}

/**
 * Sanity guard for a mapped crop region. A region that is tiny or outside
 * the photo means the cover-preview assumption does not hold on this
 * device — cropping it would store an unloadable (blank) image, so the
 * caller must fall back to the uncropped photo instead.
 */
const MIN_CROP_SIDE_PX = 50;
const MIN_CROP_AREA_FRACTION = 0.01;

export function isCropRegionSane(
  region: ImageCropRegion,
  photoWidth: number,
  photoHeight: number,
): boolean {
  if (photoWidth <= 0 || photoHeight <= 0) return false;
  if (region.width < MIN_CROP_SIDE_PX || region.height < MIN_CROP_SIDE_PX) return false;
  if (region.originX < 0 || region.originY < 0) return false;
  if (region.originX + region.width > photoWidth) return false;
  if (region.originY + region.height > photoHeight) return false;
  return (region.width * region.height) / (photoWidth * photoHeight) >= MIN_CROP_AREA_FRACTION;
}

/**
 * Crops a captured photo to the guided-frame region and re-encodes it as
 * JPEG, so the review screen shows exactly what was inside the frame
 * (WYSIWYG) instead of the full sensor image. Rejects when the region is
 * insane or the encoder returns an invalid image — the caller falls back
 * to the uncropped photo rather than storing a blank image.
 */
export interface CropPhotoOptions {
  /**
   * Mirror horizontally before cropping (front-camera selfie) so the saved
   * photo matches the mirrored live preview: right hand up stays on the
   * right side of the photo.
   */
  mirrorHorizontal?: boolean;
}

export async function cropPhotoToFrame(
  uri: string,
  region: ImageCropRegion,
  photoWidth: number,
  photoHeight: number,
  options?: CropPhotoOptions,
): Promise<{ uri: string; width: number; height: number }> {
  if (!isCropRegionSane(region, photoWidth, photoHeight)) {
    throw new Error('Crop region failed sanity check.');
  }

  const context = ImageManipulator.manipulate(uri);
  if (options?.mirrorHorizontal === true) {
    context.flip('horizontal');
  }
  context.crop(region);
  const imageRef = await context.renderAsync();
  const saved = await imageRef.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });

  if (saved.uri == null || saved.width <= 0 || saved.height <= 0) {
    throw new Error('Crop produced an invalid image.');
  }

  return { uri: saved.uri, width: saved.width, height: saved.height };
}
