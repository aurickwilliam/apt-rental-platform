export interface JourneyPoint { x: number; y: number }
export interface JourneyBox { top: number; bottom: number }
export interface JourneyRect extends JourneyBox { left: number; right: number }
export interface JourneyChapter { copy: JourneyRect; media: JourneyRect }
export interface JourneyLayout {
  width: number;
  height: number;
  featured: JourneyBox;
  discover: JourneyBox;
  manage: JourneyBox;
  workflow: JourneyBox;
  cta: JourneyRect;
  sideSpace?: number;
  scrollLimit?: number;
  chapters?: { discover: JourneyChapter; manage: JourneyChapter; introBottom: number; introRight: number };
}
export interface JourneyGeometry {
  width: number;
  height: number;
  path: string;
  scrollProgress: number[];
  drawProgress: number[];
  points: JourneyPoint[];
  markerDiameter: number;
  completion: JourneyCompletion;
}
export interface JourneyCompletion { arrivalProgress: number; fadeEndProgress: number }

export const JOURNEY_READING_LINE = 0.72;
export const JOURNEY_ARC_PACING_WEIGHT = 0.3;
export const JOURNEY_MIN_WIDTH = 720; // 768px viewport minus the unchanged 24px page gutters.
export const JOURNEY_DESKTOP_WIDTH = 976; // The production chapters become columns at 1024px.
export const JOURNEY_CTA_GAP = 20;
export const JOURNEY_FADE_DISTANCE = 128;
const FADE_END_MARGIN = 8;
const SAMPLES_PER_CURVE = 64;
const CONTENT_GAP = 8;
const CHAPTER_SCROLL_LEAD = 32;
const CHAPTER_TURN_REACH = 48;
const CTA_SCROLL_LEAD = 48;
const TANGENT_SAMPLE_DISTANCE = 3;
const TRANSITION_HANDLE = 0.65;
const ENTRY_SHOULDER_REACH = 48;
const ENTRY_SHOULDER_HEIGHT = 100;
const ENTRY_SHOULDER_SPLIT = 0.65;
const EXIT_SHOULDER_HEIGHT = 48;
const EXIT_SHOULDER_REACH = 48;
const COMPACT_EXIT_REACH = 16;
const FINAL_APPROACH_HANDLE = 36;
type Curve = [JourneyPoint, JourneyPoint, JourneyPoint, JourneyPoint];
interface PacedCurve { points: Curve; scrollStart: number; scrollEnd: number }
const point = (x: number, y: number): JourneyPoint => ({ x, y });
const coordinate = (value: number) => Math.round(value * 100) / 100;
function sampleCurve([a, b, c, d]: Curve, t: number): JourneyPoint {
  const u = 1 - t;
  return point(u ** 3 * a.x + 3 * u ** 2 * t * b.x + 3 * u * t ** 2 * c.x + t ** 3 * d.x,
    u ** 3 * a.y + 3 * u ** 2 * t * b.y + 3 * u * t ** 2 * c.y + t ** 3 * d.y);
}

export function journeyMarkerDiameter(width: number, sideSpace: number) {
  // Leave breathing room on both sides of the narrow 24px gutter rather than
  // letting the badge touch copy. Roomy desktops retain the more legible badge.
  if (width >= JOURNEY_DESKTOP_WIDTH) return sideSpace >= 40 ? 32 : 22;
  return 20;
}

/** Sample the rendered stroke itself; callers cache its total length on layout changes. */
export function journeyMarkerPoint(path: { getPointAtLength(distance: number): JourneyPoint }, totalLength: number, progress: number): JourneyPoint {
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return path.getPointAtLength(totalLength * clamped);
}

/** Forward route bearing for an up-facing icon; reverse scrolling retraces it. */
export function journeyMarkerAngle(path: { getPointAtLength(distance: number): JourneyPoint }, totalLength: number, progress: number) {
  if (!Number.isFinite(totalLength) || totalLength <= 0) return 180;
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const distance = totalLength * clamped;
  const before = path.getPointAtLength(Math.max(0, distance - TANGENT_SAMPLE_DISTANCE));
  const after = path.getPointAtLength(Math.min(totalLength, distance + TANGENT_SAMPLE_DISTANCE));
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  if (dx === 0 && dy === 0) return 180;
  // The route is strictly downward: atan2 stays in [0, 180], so the icon's
  // +90° native-orientation correction stays continuous in [90, 270]. No
  // history-dependent 180° velocity flip or 360° angle unwrapping is needed.
  return Math.atan2(dy, dx) * 180 / Math.PI + 90;
}

/** Scroll-only smoothstep: independent from path length and marker visibility. */
export function journeyPathOpacity(progress: number, completion: JourneyCompletion) {
  const { arrivalProgress, fadeEndProgress } = completion;
  if (![progress, arrivalProgress, fadeEndProgress].every(Number.isFinite) || fadeEndProgress <= arrivalProgress) return 1;
  const fade = Math.max(0, Math.min(1, (progress - arrivalProgress) / (fadeEndProgress - arrivalProgress)));
  return 1 - fade * fade * (3 - 2 * fade);
}

/** Controlled chapter transitions through measured whitespace, never through content. */
export function buildJourneyGeometry(layout: JourneyLayout): JourneyGeometry | null {
  const { width, height, featured, discover, manage, workflow, cta } = layout;
  if (width < JOURNEY_MIN_WIDTH || height <= 0) return null;
  if (![width, height, ...[featured, discover, manage, workflow, cta].flatMap(box => [box.top, box.bottom])].every(Number.isFinite)) return null;
  if ([featured, discover, manage, workflow, cta].some(box => box.bottom < box.top)) return null;
  const desktop = width >= JOURNEY_DESKTOP_WIDTH;
  const sideSpace = layout.sideSpace ?? 24;
  const markerDiameter = journeyMarkerDiameter(width, sideSpace);
  const radius = markerDiameter / 2;
  // The gutter must fit the whole badge. Within that range, keep the badge
  // outside the content and inside the viewport.
  if (!Number.isFinite(sideSpace) || sideSpace < markerDiameter) return null;
  const laneDistance = Math.max(radius, Math.min(desktop ? 32 : 12, sideSpace / 2));
  const left = -laneDistance;
  const clearance = radius + CONTENT_GAP;
  const end = point((cta.left + cta.right) / 2, cta.top - radius - JOURNEY_CTA_GAP);
  const milestones = [featured.bottom + 24, discover.top, discover.bottom, manage.top, manage.bottom, workflow.top, workflow.bottom, end.y];
  // A changed/crowded layout hides the decoration rather than routing through content.
  if (milestones[0] < 0 || end.y > height || !Number.isFinite(end.x) || !Number.isFinite(cta.right) ||
    cta.left < 0 || cta.right > width || end.x + radius > cta.right ||
    milestones.some((y, index) => index > 0 && y <= milestones[index - 1])) return null;

  const chapters = layout.chapters;
  let discoverLane = left;
  let manageLane = left;
  if (desktop) {
    if (!chapters) return null;
    const values = [chapters.introBottom, chapters.introRight,
      ...[chapters.discover, chapters.manage].flatMap(chapter => [chapter.copy, chapter.media].flatMap(rect => [rect.top, rect.bottom, rect.left, rect.right]))];
    if (!values.every(Number.isFinite)) return null;
    const discoverGap = chapters.discover.copy.left - chapters.discover.media.right;
    const manageGap = chapters.manage.media.left - chapters.manage.copy.right;
    if (Math.min(discoverGap, manageGap) < markerDiameter + CONTENT_GAP * 2) return null;
    if (manage.top - discover.bottom < markerDiameter + CONTENT_GAP * 4) return null;
    discoverLane = (chapters.discover.copy.left + chapters.discover.media.right) / 2;
    manageLane = (chapters.manage.copy.right + chapters.manage.media.left) / 2;
    if (discoverLane <= manageLane || chapters.discover.copy.top < discover.top ||
      chapters.discover.copy.bottom > discover.bottom || chapters.manage.copy.top < manage.top ||
      chapters.manage.copy.bottom > manage.bottom) return null;
    if (chapters.introRight < 0 || chapters.introRight > width ||
      [chapters.discover, chapters.manage].some(chapter => [chapter.copy, chapter.media].some(rect => rect.right <= rect.left || rect.bottom <= rect.top))) return null;
  }

  const start = point(desktop ? Math.max(width - radius - 32, chapters!.introRight + clearance) : 32, featured.bottom + 24);
  if (start.x + radius > width) return null;
  const curves: PacedCurve[] = [];
  let cursor = start;
  let scrollCursor = start.y;
  function connect(x: number, y: number, scrollEnd = y, handle = 0.5) {
    const distance = y - cursor.y;
    // One cubic per directional movement, with vertical tangents on both ends.
    // Equal handles avoid the old small corner hooks and flat border-like runs.
    curves.push({ points: [cursor, point(cursor.x, cursor.y + distance * handle), point(x, y - distance * handle), point(x, y)], scrollStart: scrollCursor, scrollEnd });
    cursor = point(x, y);
    scrollCursor = scrollEnd;
  }
  if (desktop) {
    connect(start.x, chapters!.introBottom + clearance);
    connect(discoverLane, chapters!.discover.copy.top - clearance);
    connect(discoverLane, discover.bottom - CHAPTER_TURN_REACH, discover.bottom - CHAPTER_SCROLL_LEAD);
    // Longer vertical handles let this small sidestep begin and end inside the
    // column corridors, with almost all lateral travel in the actual chapter gap.
    connect(manageLane, manage.top + CHAPTER_TURN_REACH, manage.top + CHAPTER_SCROLL_LEAD, 0.9);
    connect(manageLane, chapters!.manage.copy.bottom + clearance);
    connect(left, workflow.top - clearance);
  } else {
    // Stacked copy leaves no inner corridor: make only a modest opening turn,
    // then keep the guide beside the text and devices, never across them.
    connect(left, Math.min(start.y + 72, discover.top - clearance));
  }
  connect(left, workflow.bottom + clearance, workflow.bottom - CTA_SCROLL_LEAD);
  connect(end.x, end.y);
  if (curves.some(({ points: [a, , , b], scrollStart, scrollEnd }) => b.y - a.y < 16 || scrollEnd <= scrollStart)) return null;

  // Retain the approved phase-input table; only the visible curve and its actual
  // arc-length outputs change. Timing references are never a marker trajectory.
  const shapes: Curve[][] = curves.map(({ points }) => [points]);
  const splits = curves.map(() => 1);
  for (const index of desktop ? [1, 5] : []) {
    const [a, , , d] = curves[index].points;
    const handle = (d.y - a.y) * TRANSITION_HANDLE;
    shapes[index] = [[a, point(a.x, a.y + handle), point(d.x, d.y - handle), d]];
  }
  if (desktop) {
    const [a, , , d] = curves[0].points;
    const reach = Math.min(ENTRY_SHOULDER_REACH, Math.max(0, start.x - chapters!.introRight - clearance) * 0.5);
    if (reach > 1 && d.y - a.y > ENTRY_SHOULDER_HEIGHT) {
      const shoulder = point(a.x, d.y - ENTRY_SHOULDER_HEIGHT);
      const finish = point(d.x - reach, d.y);
      shapes[0] = [[a, point(a.x, (a.y + shoulder.y) / 2), point(a.x, (a.y + shoulder.y) / 2), shoulder],
        [shoulder, point(a.x, shoulder.y + 40), point(finish.x + reach / 2, finish.y - 30), finish]];
      splits[0] = ENTRY_SHOULDER_SPLIT;
      const target = curves[1].points[3];
      shapes[1] = [[finish, point(finish.x - reach, finish.y + 60), point(target.x, target.y - (target.y - finish.y) * 0.45), target]];
    }
  }
  const gutterPhase = curves.length - 2;
  const gutter = curves[gutterPhase].points;
  const roomy = laneDistance - radius >= CONTENT_GAP;
  // Roomy gutters can begin rounding beside the panel. In a 24px gutter the
  // whole badge must first clear its bottom; never borrow width from the panel.
  const shoulderY = workflow.bottom + (roomy ? -EXIT_SHOULDER_HEIGHT : radius + 1);
  if (shoulderY <= gutter[0].y) return null;
  let low = 0;
  let high = 1;
  // Split the original vertical cubic (de Casteljau), preserving its entire
  // earlier descent and parameterization. This search runs only on layout.
  for (let step = 0; step < 32; step++) {
    const middle = (low + high) / 2;
    if (sampleCurve(gutter, middle).y < shoulderY) low = middle; else high = middle;
  }
  const split = (low + high) / 2;
  splits[gutterPhase] = split;
  const mix = (a: JourneyPoint, b: JourneyPoint): JourneyPoint => point(a.x + (b.x - a.x) * split, a.y + (b.y - a.y) * split);
  const first = mix(gutter[0], gutter[1]);
  const second = mix(mix(gutter[0], gutter[1]), mix(gutter[1], gutter[2]));
  const shoulderStart = sampleCurve(gutter, split);
  const shoulderEnd = point(left + (roomy ? EXIT_SHOULDER_REACH : COMPACT_EXIT_REACH), workflow.bottom + clearance);
  shapes[gutterPhase] = [[gutter[0], first, second, shoulderStart],
    [shoulderStart, point(left, shoulderEnd.y - (shoulderEnd.y - shoulderStart.y) * 0.25), point(left, shoulderEnd.y), shoulderEnd]];
  shapes[gutterPhase + 1] = [[shoulderEnd, point(shoulderEnd.x + (end.x - shoulderEnd.x) * 0.38, shoulderEnd.y),
    point(end.x, end.y - Math.min(FINAL_APPROACH_HANDLE, (end.y - shoulderEnd.y) * 0.7)), end]];
  const path = `M ${coordinate(start.x)} ${coordinate(start.y)} ` + shapes.flat().map(([, c1, c2, finish]) =>
    `C ${coordinate(c1.x)} ${coordinate(c1.y)} ${coordinate(c2.x)} ${coordinate(c2.y)} ${coordinate(finish.x)} ${coordinate(finish.y)}`
  ).join(" ");
  const points: JourneyPoint[] = [start];
  const lengths = [0];
  const scrollProgress = [start.y / height];
  let length = 0;
  let timingLength = 0;
  let timingPrevious = start;
  for (const [phase, { points: reference, scrollStart, scrollEnd }] of curves.entries()) {
    const [a, , , d] = reference;
    const firstIndex = points.length - 1;
    const timingStartLength = timingLength;
    const timingSamples: { y: number; length: number }[] = [];
    for (let index = 1; index <= SAMPLES_PER_CURVE; index++) {
      const t = index / SAMPLES_PER_CURVE;
      const split = splits[phase];
      const shape = shapes[phase];
      const next = shape.length === 1 ? sampleCurve(shape[0], t) :
        t <= split ? sampleCurve(shape[0], t / split) : sampleCurve(shape[1], (t - split) / (1 - split));
      const timing = sampleCurve(reference, t);
      timingLength += Math.hypot(timing.x - timingPrevious.x, timing.y - timingPrevious.y);
      timingSamples.push({ y: timing.y, length: timingLength });
      timingPrevious = timing;
      const previous = points[points.length - 1];
      length += Math.hypot(next.x - previous.x, next.y - previous.y);
      points.push(next);
      lengths.push(length);
    }
    for (let index = firstIndex + 1; index < points.length; index++) {
      // Pace each chapter locally. A longer entry curve cannot shift the reading
      // interval of a later chapter. The short inter-chapter shift receives a
      // measured, bounded scroll interval instead of racing through an 80px gap.
      const timing = timingSamples[index - firstIndex - 1];
      const vertical = (timing.y - a.y) / (d.y - a.y);
      const arc = (timing.length - timingStartLength) / (timingLength - timingStartLength);
      const paced = vertical * (1 - JOURNEY_ARC_PACING_WEIGHT) + arc * JOURNEY_ARC_PACING_WEIGHT;
      scrollProgress.push((scrollStart + (scrollEnd - scrollStart) * paced) / height);
    }
  }
  const obstacles: JourneyRect[] = [
    ...(desktop ? [chapters!.discover.copy, chapters!.discover.media, chapters!.manage.copy, chapters!.manage.media] :
      [{ ...discover, left: 0, right: width }, { ...manage, left: 0, right: width }]),
    { ...workflow, left: 0, right: width }, cta,
  ];
  // Check each shoulder independently too: a short compound piece must not
  // disappear between two samples of its much longer timing phase.
  const safetyPoints = shapes.flat().flatMap(curve => Array.from({ length: SAMPLES_PER_CURVE + 1 }, (_, index) => sampleCurve(curve, index / SAMPLES_PER_CURVE)));
  if (safetyPoints.some(p => p.x - radius < -sideSpace || p.x + radius > width + sideSpace ||
    obstacles.some(rect => Math.hypot(p.x - Math.max(rect.left, Math.min(rect.right, p.x)),
      p.y - Math.max(rect.top, Math.min(rect.bottom, p.y))) < radius + 0.5))) return null;
  const drawProgress = lengths.map(value => value / length);
  // Arrival keeps the existing traversal mapping. Only the following natural
  // scroll interval fades the strokes; it never changes or extends the route.
  const available = Math.min(height, layout.scrollLimit ?? height) - end.y;
  const fadeDistance = Math.min(JOURNEY_FADE_DISTANCE, available > FADE_END_MARGIN ? available - FADE_END_MARGIN : available);
  if (!Number.isFinite(fadeDistance) || fadeDistance < 1) return null;
  const completion = { arrivalProgress: end.y / height, fadeEndProgress: (end.y + fadeDistance) / height };
  return { width, height, path, points, scrollProgress, drawProgress, markerDiameter, completion };
}
