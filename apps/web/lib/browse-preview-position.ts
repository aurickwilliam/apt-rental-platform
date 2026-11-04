export interface PreviewAnchor {
  left: number;
  top: number;
  width: number;
  height: number;
  bounds?: { left: number; right: number };
}

const PREVIEW_WIDTH = 320;
const MARGIN = 8;

/** Fixed, portaled preview: bounded by BOTH its browsing region and viewport. */
export function browsePreviewPosition(
  anchor: PreviewAnchor,
  viewport: { width: number; height: number },
  measuredHeight = 388,
) {
  const leftEdge = Math.max(MARGIN, anchor.bounds?.left ?? MARGIN);
  const rightEdge = Math.min(viewport.width - MARGIN, anchor.bounds?.right ?? viewport.width - MARGIN);
  const width = Math.max(0, Math.min(PREVIEW_WIDTH, rightEdge - leftEdge));
  const maxHeight = Math.max(0, viewport.height - MARGIN * 2);
  const height = Math.min(measuredHeight, maxHeight);
  const left = Math.max(leftEdge, Math.min(anchor.left + anchor.width / 2 - width / 2, rightEdge - width));
  const top = Math.max(MARGIN, Math.min(anchor.top + anchor.height / 2 - height / 2, viewport.height - MARGIN - height));
  return { left, top, width, maxHeight };
}
