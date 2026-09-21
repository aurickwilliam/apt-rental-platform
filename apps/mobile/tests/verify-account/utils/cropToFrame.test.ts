import { computeGuidedFrameRect } from '@/components/display/GuidedFrameOverlay';
import { CARD_ASPECT_RATIO } from '@/app/(auth)/verify-account/constants/captureSequences';
import {
  cropPhotoToFrame,
  isCropRegionSane,
  mapGuidedRectToImageCrop,
} from '@/app/(auth)/verify-account/utils/cropToFrame';

const mockCropAction = jest.fn();
const mockFlipAction = jest.fn();
const mockRenderAsync = jest.fn();
const mockSaveAsync = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => ({ crop: mockCropAction, flip: mockFlipAction, renderAsync: mockRenderAsync }),
  },
}));

describe('mapGuidedRectToImageCrop', () => {
  it('maps a portrait preview center-crop of a landscape photo to image pixels', () => {
    // Portrait 400x800 preview of a landscape 4000x3000 sensor frame:
    // cover scale = 800/3000, side bands of 333.33 view-px are cropped away.
    const region = mapGuidedRectToImageCrop(
      { x: 20, y: 300, width: 360, height: 227 },
      400,
      800,
      4000,
      3000,
    );

    expect(region).toEqual({ originX: 1325, originY: 1125, width: 1350, height: 851 });
  });

  it('is the identity mapping when preview and photo share geometry', () => {
    const region = mapGuidedRectToImageCrop(
      { x: 0, y: 0, width: 400, height: 400 },
      400,
      400,
      1000,
      1000,
    );

    expect(region).toEqual({ originX: 0, originY: 0, width: 1000, height: 1000 });
  });

  it('clamps a frame overflowing the preview inside the photo bounds', () => {
    const region = mapGuidedRectToImageCrop(
      { x: -50, y: -50, width: 1000, height: 1000 },
      400,
      400,
      1000,
      1000,
    );

    expect(region.originX).toBe(0);
    expect(region.originY).toBe(0);
    expect(region.originX + region.width).toBeLessThanOrEqual(1000);
    expect(region.originY + region.height).toBeLessThanOrEqual(1000);
    expect(region.width).toBeGreaterThan(0);
    expect(region.height).toBeGreaterThan(0);
  });

  it('falls back to the full photo on degenerate inputs', () => {
    expect(mapGuidedRectToImageCrop({ x: 0, y: 0, width: 10, height: 10 }, 0, 800, 4000, 3000))
      .toEqual({ originX: 0, originY: 0, width: 4000, height: 3000 });
    expect(mapGuidedRectToImageCrop({ x: 0, y: 0, width: 10, height: 10 }, 400, 800, 0, 0))
      .toEqual({ originX: 0, originY: 0, width: 1, height: 1 });
  });

  it('keeps every real guided frame inside the photo across ID and selfie ratios', () => {
    const viewWidth = 400;
    const viewHeight = 800;
    const photoWidth = 4000;
    const photoHeight = 3000;

    for (const aspectRatio of [CARD_ASPECT_RATIO, 125 / 88, 1]) {
      const frame = computeGuidedFrameRect(viewWidth, viewHeight, aspectRatio);
      const region = mapGuidedRectToImageCrop(frame, viewWidth, viewHeight, photoWidth, photoHeight);

      expect(region.originX).toBeGreaterThanOrEqual(0);
      expect(region.originY).toBeGreaterThanOrEqual(0);
      expect(region.originX + region.width).toBeLessThanOrEqual(photoWidth);
      expect(region.originY + region.height).toBeLessThanOrEqual(photoHeight);
      expect(region.width / region.height).toBeCloseTo(frame.width / frame.height, 2);
    }
  });
});

describe('isCropRegionSane', () => {
  it('accepts a normal frame crop', () => {
    expect(
      isCropRegionSane({ originX: 1325, originY: 1125, width: 1350, height: 851 }, 4000, 3000),
    ).toBe(true);
  });

  it('rejects slivers and specks', () => {
    expect(isCropRegionSane({ originX: 0, originY: 0, width: 1, height: 851 }, 4000, 3000)).toBe(false);
    expect(isCropRegionSane({ originX: 0, originY: 0, width: 1350, height: 10 }, 4000, 3000)).toBe(false);
  });

  it('rejects regions outside the photo', () => {
    expect(isCropRegionSane({ originX: -5, originY: 0, width: 100, height: 100 }, 4000, 3000)).toBe(false);
    expect(isCropRegionSane({ originX: 3950, originY: 0, width: 100, height: 100 }, 4000, 3000)).toBe(false);
  });

  it('rejects degenerate photo dims', () => {
    expect(isCropRegionSane({ originX: 0, originY: 0, width: 100, height: 100 }, 0, 0)).toBe(false);
  });
});

describe('cropPhotoToFrame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
    mockSaveAsync.mockResolvedValue({ uri: 'file://cropped.jpg', width: 200, height: 126 });
  });

  it('returns the re-encoded crop for a sane region', async () => {
    const result = await cropPhotoToFrame(
      'file://captured.jpg',
      { originX: 137, originY: 86, width: 126, height: 79 },
      400,
      252,
    );

    expect(mockFlipAction).not.toHaveBeenCalled();
    expect(mockCropAction).toHaveBeenCalledWith({ originX: 137, originY: 86, width: 126, height: 79 });
    expect(result).toEqual({ uri: 'file://cropped.jpg', width: 200, height: 126 });
  });

  it('mirrors horizontally before cropping when requested (selfie)', async () => {
    await cropPhotoToFrame(
      'file://captured.jpg',
      { originX: 137, originY: 86, width: 126, height: 79 },
      400,
      252,
      { mirrorHorizontal: true },
    );

    expect(mockFlipAction).toHaveBeenCalledTimes(1);
    expect(mockFlipAction).toHaveBeenCalledWith('horizontal');
    expect(mockCropAction).toHaveBeenCalledTimes(1);
    expect(mockFlipAction.mock.invocationCallOrder[0]).toBeLessThan(
      mockCropAction.mock.invocationCallOrder[0],
    );
  });

  it('rejects an insane region without touching the encoder', async () => {
    await expect(
      cropPhotoToFrame('file://captured.jpg', { originX: 0, originY: 0, width: 1, height: 1 }, 400, 252),
    ).rejects.toThrow();

    expect(mockCropAction).not.toHaveBeenCalled();
  });

  it('rejects when the encoder returns an invalid image', async () => {
    mockSaveAsync.mockResolvedValue({ uri: 'file://cropped.jpg', width: 0, height: 0 });

    await expect(
      cropPhotoToFrame(
        'file://captured.jpg',
        { originX: 137, originY: 86, width: 126, height: 79 },
        400,
        252,
      ),
    ).rejects.toThrow();
  });
});
