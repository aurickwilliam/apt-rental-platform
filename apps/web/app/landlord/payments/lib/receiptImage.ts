import type { ReceiptData, ReceiptTone } from "./receiptData";

// The receipt is drawn on a canvas from its data, so the picture never depends on
// page CSS, hidden DOM or fonts being captured. Metrics are in CSS pixels; the
// canvas is scaled up for sharp text. Everything is drawn on a soft card background
// so it looks right when pasted into a chat app that has no transparency.
export const RECEIPT_IMAGE = {
  paperWidth: 460,
  margin: 24,
  padding: 24,
  scale: 2,
  rowHeight: 34,
  teethWidth: 16,
  teethDepth: 10,
} as const;

const COLORS = {
  background: "#E6EBF5",
  paper: "#FFFFFF",
  text: "#18181B",
  muted: "#71717A",
  primary: "#376BF5",
  divider: "#D4D4D8",
  tone: { success: "#16A34A", warning: "#F59E0B", danger: "#DC2626" } satisfies Record<ReceiptTone, string>,
};

export type ReceiptFonts = { body: string; heading: string };

type Row = { label: string; value: string; strong?: boolean };

function rowsOf(data: ReceiptData): { main: Row[]; breakdown: Row[]; reference: Row } {
  return {
    main: [
      { label: "Tenant", value: data.tenant },
      { label: "Apartment", value: data.apartment },
      { label: data.dateLabel, value: `${data.date}, ${data.time}` },
      { label: "Method", value: data.method },
      { label: "Status", value: data.status },
    ],
    breakdown: data.breakdown.length > 0
      ? [...data.breakdown.map((line) => ({ ...line })), { label: "Total", value: data.total, strong: true }]
      : [],
    reference: { label: "Reference No.", value: data.reference },
  };
}

// Vertical rhythm, in CSS pixels: padding, icon (44), title, amount, period, then the first divider.
const HEADER_HEIGHT = RECEIPT_IMAGE.padding + 22 + (22 + 12 + 18) + (14 + 36) + (8 + 20) + 24;
const DIVIDER_GAP = 12;
// Space under the reference row, so the last line is not crowded by the torn edge.
const BOTTOM_PADDING = 36;

/** Size of the image in CSS pixels, for the given receipt. Pure, so it can be tested without a canvas. */
export function receiptImageSize(data: ReceiptData): { width: number; height: number } {
  const { paperWidth, margin, rowHeight, teethDepth } = RECEIPT_IMAGE;
  const { main, breakdown } = rowsOf(data);
  const breakdownHeight = breakdown.length > 0 ? DIVIDER_GAP * 2 + breakdown.length * rowHeight : 0;
  const paper = HEADER_HEIGHT + main.length * rowHeight + breakdownHeight + DIVIDER_GAP * 2 + rowHeight + BOTTOM_PADDING;
  return { width: paperWidth + margin * 2, height: paper + teethDepth + margin * 2 };
}

function fit(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) return text;
  let shortened = text;
  while (shortened.length > 1 && context.measureText(`${shortened}…`).width > maxWidth) shortened = shortened.slice(0, -1);
  return `${shortened.trimEnd()}…`;
}

function drawStatusIcon(context: CanvasRenderingContext2D, tone: ReceiptTone, centerX: number, centerY: number) {
  const radius = 22;
  context.strokeStyle = COLORS.tone[tone];
  context.lineWidth = 3;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  if (tone === "success") {
    context.moveTo(centerX - 9, centerY + 1);
    context.lineTo(centerX - 2, centerY + 8);
    context.lineTo(centerX + 10, centerY - 7);
  } else if (tone === "danger") {
    context.moveTo(centerX - 8, centerY - 8);
    context.lineTo(centerX + 8, centerY + 8);
    context.moveTo(centerX + 8, centerY - 8);
    context.lineTo(centerX - 8, centerY + 8);
  } else {
    context.moveTo(centerX, centerY - 10);
    context.lineTo(centerX, centerY);
    context.lineTo(centerX + 7, centerY + 5);
  }
  context.stroke();
}

function dashedDivider(context: CanvasRenderingContext2D, left: number, right: number, y: number) {
  context.strokeStyle = COLORS.divider;
  context.lineWidth = 1;
  context.setLineDash([4, 4]);
  context.beginPath();
  context.moveTo(left, y);
  context.lineTo(right, y);
  context.stroke();
  context.setLineDash([]);
}

/** Draws the receipt onto `canvas` and sizes the canvas to fit. */
export function drawReceipt(canvas: HTMLCanvasElement, data: ReceiptData, fonts: ReceiptFonts): void {
  const { paperWidth, margin, padding, scale, rowHeight, teethWidth, teethDepth } = RECEIPT_IMAGE;
  const { width, height } = receiptImageSize(data);
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.scale(scale, scale);

  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, width, height);

  const left = margin;
  const right = margin + paperWidth;
  const paperHeight = height - margin * 2 - teethDepth;
  const top = margin;
  const bottom = top + paperHeight;
  const radius = 16;

  // Paper: rounded top corners, then white teeth hanging below its bottom edge.
  context.fillStyle = COLORS.paper;
  context.beginPath();
  context.moveTo(left, top + radius);
  context.arcTo(left, top, left + radius, top, radius);
  context.lineTo(right - radius, top);
  context.arcTo(right, top, right, top + radius, radius);
  context.lineTo(right, bottom);
  const teeth = Math.max(1, Math.round(paperWidth / teethWidth));
  const tooth = paperWidth / teeth;
  for (let i = teeth - 1; i >= 0; i--) {
    context.lineTo(left + i * tooth + tooth / 2, bottom + teethDepth);
    context.lineTo(left + i * tooth, bottom);
  }
  context.closePath();
  context.fill();

  const inner = { left: left + padding, right: right - padding };
  const center = (left + right) / 2;
  context.textBaseline = "alphabetic";
  context.textAlign = "center";
  let y = top + padding + 22;

  drawStatusIcon(context, data.tone, center, y);
  y += 22 + 12 + 18;
  context.fillStyle = COLORS.tone[data.tone];
  context.font = `700 18px ${fonts.heading}`;
  context.fillText(data.title, center, y);

  y += 14 + 36;
  context.fillStyle = COLORS.primary;
  context.font = `700 36px ${fonts.heading}`;
  context.fillText(data.amount, center, y);

  y += 8 + 20;
  context.fillStyle = COLORS.muted;
  context.font = `400 14px ${fonts.body}`;
  context.fillText(fit(context, data.period, inner.right - inner.left), center, y);

  y += 24;
  dashedDivider(context, inner.left, inner.right, y);

  const { main, breakdown, reference } = rowsOf(data);
  const drawRows = (rows: Row[], startY: number): number => {
    let rowY = startY;
    for (const row of rows) {
      rowY += rowHeight;
      context.textAlign = "left";
      context.fillStyle = COLORS.muted;
      context.font = `400 14px ${fonts.body}`;
      context.fillText(row.label, inner.left, rowY - 12);
      const labelWidth = context.measureText(row.label).width;
      context.textAlign = "right";
      context.fillStyle = row.strong ? COLORS.primary : COLORS.text;
      context.font = `600 14px ${fonts.heading}`;
      context.fillText(fit(context, row.value, inner.right - inner.left - labelWidth - 16), inner.right, rowY - 12);
    }
    return rowY;
  };

  y = drawRows(main, y);
  if (breakdown.length > 0) {
    y += DIVIDER_GAP;
    dashedDivider(context, inner.left, inner.right, y);
    y += DIVIDER_GAP;
    y = drawRows(breakdown, y);
  }
  y += DIVIDER_GAP;
  dashedDivider(context, inner.left, inner.right, y);
  y += DIVIDER_GAP;
  drawRows([reference], y);
}

/** Renders the receipt as a PNG. Waits for the page's fonts first so the text matches the screen. */
export async function renderReceiptImage(data: ReceiptData, fonts: ReceiptFonts): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* A font that fails to load falls back to the next family. */ }
  }
  const canvas = document.createElement("canvas");
  drawReceipt(canvas, data, fonts);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't create the receipt image."))), "image/png"),
  );
}
