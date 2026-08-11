import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import type { ImageResult } from 'expo-image-manipulator'

const MAX_LONG_EDGE = 1600
const COMPRESS_QUALITY = 0.7

/**
 * Resizes (capped at 1600px on the long edge) and re-encodes an image as JPEG.
 * Reduces upload size before persisting to Supabase Storage.
 */
export async function compressImage(
  uri: string,
  width: number,
  height: number,
): Promise<ImageResult> {
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(width, height))
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  const context = ImageManipulator.manipulate(uri)
  if (scale < 1) {
    context.resize({ width: targetWidth, height: targetHeight })
  }

  const imageRef = await context.renderAsync()
  return imageRef.saveAsync({
    compress: COMPRESS_QUALITY,
    format: SaveFormat.JPEG,
  })
}
